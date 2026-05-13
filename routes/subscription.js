const express = require('express');
const router = express.Router();
const ctrl = require('../controller/subscriptionController');
const userAuth = require('../middleware/userAuth');
const { upload } = require('../utils/s3');

router.use(userAuth);

router.post('/create-order', ctrl.createOrder);
router.post('/verify-payment', ctrl.verifyPayment);
router.post('/manual-payment', upload.single('proof'), ctrl.requestManualPayment);

module.exports = router;
