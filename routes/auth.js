const express = require('express');
const router = express.Router();
const ctrl = require('../controller/authController');
const userAuth = require('../middleware/userAuth');

router.post('/send-otp', ctrl.sendOtp);
router.post('/verify-otp', ctrl.verifyOtp);

router.post('/onboarding', userAuth, ctrl.onboarding);

module.exports = router;
