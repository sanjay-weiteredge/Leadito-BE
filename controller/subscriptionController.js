const Razorpay = require('razorpay');
const crypto = require('crypto');
const { User, Subscription, Plan, sequelize } = require('../models');
const notifCtrl = require('./notificationController');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        if (!planId) return res.status(400).json({ message: 'Plan ID is required' });

        const plan = await Plan.findByPk(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        // Check for existing active subscription
        const activeSub = await Subscription.findOne({
            where: { userId: req.user.id, status: 'active' }
        });

        // Determine if this is a renewal (same plan) or an upgrade (different plan)
        const isRenewal = activeSub && activeSub.planId === parseInt(planId);

        const options = {
            amount: plan.price * 100, // INR to paise for Razorpay
            currency: 'INR',
            receipt: `receipt_plan_${planId}_user_${req.user.id}_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // Return extra info so frontend can show the right confirmation message
        return res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            planName: plan.name,
            isRenewal,
            currentExpiryDate: isRenewal ? activeSub.expiryDate : null,
        });
    } catch (err) {
        console.error('Create Razorpay order error:', err);
        console.log('Full Error Object:', JSON.stringify(err, null, 2));
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

exports.verifyPayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
            return res.status(400).json({ message: 'All payment details and planId are required' });
        }

        // Verify Razorpay signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
        }

        const plan = await Plan.findByPk(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check for existing active subscription
        const activeSub = await Subscription.findOne({
            where: { userId: user.id, status: 'active' },
            transaction: t
        });

        const isRenewal = activeSub && activeSub.planId === plan.id;
        const duration = plan.durationDays || 90;

        let startDate = new Date();
        let expiryDate = new Date();

        if (isRenewal) {
            // RENEWAL: extend from the current expiry date (not from today)
            // This rewards the user — remaining days are preserved
            const currentExpiry = new Date(activeSub.expiryDate);
            const now = new Date();
            // If somehow already expired, extend from today; otherwise from current expiry
            const baseDate = currentExpiry > now ? currentExpiry : now;
            expiryDate = new Date(baseDate);
            expiryDate.setDate(expiryDate.getDate() + duration);
        } else {
            // UPGRADE to a different plan: fresh 90-day cycle from today
            expiryDate.setDate(expiryDate.getDate() + duration);
        }

        // Mark any existing active subscription as expired
        if (activeSub) {
            await activeSub.update({ status: 'expired' }, { transaction: t });
        }

        // Activate user
        await user.update({ isActive: true }, { transaction: t });

        // Create new subscription record
        const subscription = await Subscription.create({
            userId: user.id,
            planId: plan.id,
            status: 'active',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            signature: razorpay_signature,
            amount: plan.price,
            startDate: startDate.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
        }, { transaction: t });

        await t.commit();

        // Send a notification!
        await notifCtrl.createNotification(
            user.id,
            isRenewal ? 'Plan Renewed Successfully! 🎉' : 'New Plan Activated! 🚀',
            isRenewal ? `Your ${plan.name} has been extended by ${duration} days.` : `Your ${plan.name} is now active for ${duration} days. Enjoy your premium benefits!`,
            'payment',
            { planId: plan.id, paymentId: razorpay_payment_id }
        );

        return res.json({
            message: isRenewal
                ? `Plan renewed! Extended by ${duration} days.`
                : 'Payment verified and new plan activated successfully.',
            subscription,
            isRenewal,
        });
    } catch (err) {
        await t.rollback();
        console.error('Verify payment error:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
