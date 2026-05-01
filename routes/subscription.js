const express = require('express');
const router = express.Router();
const ctrl = require('../controller/subscriptionController');
const userAuth = require('../middleware/userAuth');

router.use(userAuth);

router.post('/create-order', ctrl.createOrder);
router.post('/verify-payment', ctrl.verifyPayment);

module.exports = router;
