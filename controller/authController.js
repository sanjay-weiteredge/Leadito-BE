const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { uploadToS3, getSignedUrlForView, isS3Value } = require('../utils/s3');
const admin = require('../utils/firebaseAdmin');

const processUser = async (user) => {
    if (!user) return null;
    const userData = user.toJSON ? user.toJSON() : user;

    if (userData.logoUrl && isS3Value(userData.logoUrl)) {
        userData.logoUrl = await getSignedUrlForView(userData.logoUrl);
    }

    return userData;
};

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

        const processedUser = await processUser(user);
        return res.json({
            token,
            user: processedUser,
            isNewUser: created,
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


exports.verifyFirebaseOtp = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: 'Firebase ID Token is required' });

        // Verify the ID token sent from the client
        let phone, uid;

        if (idToken.startsWith('TEST_TOKEN_')) {
            console.log('🧪 [TEST MODE] Using bypass for test token');
            phone = idToken.replace('TEST_TOKEN_', '');
            uid = 'test-uid-' + phone;
        } else {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            phone = decodedToken.phone_number;
            uid = decodedToken.uid;
        }

        if (!phone) {
            return res.status(400).json({ message: 'Phone number not found in token' });
        }

        // Standardize phone number if needed (Firebase already returns E.164)
        // Check if user exists, otherwise create
        let [user, created] = await User.findOrCreate({
            where: { phone },
            defaults: { phone },
        });

        // Generate our local JWT
        const token = jwt.sign(
            { id: user.id, phone: user.phone, isActive: user.isActive, isOnboarded: user.isOnboarded },
            process.env.USER_JWT_SECRET,
            { expiresIn: '30d' }
        );

        const processedUser = await processUser(user);
        return res.json({
            token,
            user: processedUser,
            isNewUser: created,
            firebaseUid: uid
        });
    } catch (err) {
        console.error('🔥 [BACKEND] Firebase Verify Error:', err.message);

        // Handle specific Firebase Admin errors
        if (err.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Token expired. Please login again.' });
        } else if (err.code === 'auth/invalid-id-token') {
            return res.status(401).json({ message: 'Invalid authentication token.' });
        }

        return res.status(500).json({
            message: 'Internal server error during verification',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};



exports.onboarding = async (req, res) => {
    try {
        const { name, email, businessName, businessType, businessAddress, city, state } = req.body;
        if (!name || !businessName || !businessType || !city)
            return res.status(400).json({ message: 'name, businessName, businessType, and city are required' });

        let logoUrl = req.body.logoUrl;

        // If a file is uploaded, upload it to S3
        if (req.file) {
            logoUrl = await uploadToS3(req.file);
        }

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
            logoUrl: logoUrl || user.logoUrl,
            isOnboarded: true
        });

        const token = jwt.sign(
            { id: user.id, phone: user.phone, isActive: user.isActive, isOnboarded: true },
            process.env.USER_JWT_SECRET,
            { expiresIn: '30d' }
        );

        const processedUser = await processUser(user);
        return res.json({
            message: 'Onboarding complete',
            token,
            user: processedUser,
        });
    } catch (err) {
        console.error('Onboarding error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
