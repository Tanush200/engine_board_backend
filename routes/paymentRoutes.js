const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

router.post('/create-payment', auth, paymentController.createPayment);
router.get('/products', auth, paymentController.listProducts);
router.get('/verify', auth, paymentController.verifyPayment);
router.post('/manual-update', auth, paymentController.manualPaymentUpdate);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
