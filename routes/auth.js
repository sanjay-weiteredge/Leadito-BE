const express = require('express');
const router = express.Router();
const ctrl = require('../controller/authController');
const userAuth = require('../middleware/userAuth');

router.post('/send-otp', ctrl.sendOtp);
router.post('/verify-otp', ctrl.verifyOtp);

const { upload } = require('../utils/s3');

router.post('/onboarding', userAuth, upload.single('logo'), ctrl.onboarding);

module.exports = router;
