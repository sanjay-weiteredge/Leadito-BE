const jwt = require('jsonwebtoken');
const { User } = require('../models');

const otpStore = new Map();

const generateOtp = () => '123456';


exports.sendOtp = async (req, res) => {
    try {
        console.log('🔥 [DEBUG] Send OTP request received:', req.body);
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number is required' });

        const otp = generateOtp();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        otpStore.set(phone, { otp, expiresAt });

        console.log(`📱 [TEST MODE] Static OTP for ${phone}: ${otp}`);

        return res.json({ message: 'OTP sent successfully (Test Mode: 123456)' });
    } catch (err) {
        console.error('Send OTP error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp)
            return res.status(400).json({ message: 'Phone and OTP are required' });

        const record = otpStore.get(phone);
        if (!record)
            return res.status(400).json({ message: 'No OTP found for this number. Please request a new one.' });

        if (Date.now() > record.expiresAt) {
            otpStore.delete(phone);
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (record.otp !== otp.toString())
            return res.status(400).json({ message: 'Incorrect OTP' });

        otpStore.delete(phone);

        let [user, created] = await User.findOrCreate({
            where: { phone },
            defaults: { phone },
        });

        const token = jwt.sign(
            { id: user.id, phone: user.phone, isActive: user.isActive, isOnboarded: user.isOnboarded },
            process.env.USER_JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                phone: user.phone,
                isOnboarded: user.isOnboarded,
                isActive: user.isActive,
            },
            isNewUser: created,
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.onboarding = async (req, res) => {
    try {
        const { name, email, businessName, businessType, businessAddress, city, state, logoUrl } = req.body;

        if (!name || !businessName || !businessType || !city)
            return res.status(400).json({ message: 'name, businessName, businessType, and city are required' });

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.update({
            name,
            email,
            businessName,
            businessType,
            businessAddress,
            city,
            state,
            logoUrl,
            isOnboarded: true
        });

        const token = jwt.sign(
            { id: user.id, phone: user.phone, isActive: user.isActive, isOnboarded: true },
            process.env.USER_JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.json({
            message: 'Onboarding complete',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                businessName: user.businessName,
                businessType: user.businessType,
                businessAddress: user.businessAddress,
                city: user.city,
                state: user.state,
                logoUrl: user.logoUrl,
                isOnboarded: user.isOnboarded,
                isActive: user.isActive,
            },
        });
    } catch (err) {
        console.error('Onboarding error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
