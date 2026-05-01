const Razorpay = require('razorpay');
const crypto = require('crypto');
const { User, Subscription, Plan, sequelize } = require('../models');

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

        const options = {
            amount: plan.price, // Already in Paise from the database
            currency: 'INR',
            receipt: `receipt_plan_${planId}_user_${req.user.id}_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        return res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            planName: plan.name
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

        // Verify signature
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

        // Update user status
        await user.update({ isActive: true }, { transaction: t });

        // Deactivate existing active subscriptions for this user
        await Subscription.update(
            { status: 'expired' },
            {
                where: { userId: user.id, status: 'active' },
                transaction: t
            }
        );

        // Create new subscription
        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 30));

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
        return res.json({ message: 'Payment verified and plan activated successfully', subscription });
    } catch (err) {
        await t.rollback();
        console.error('Verify payment error:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
