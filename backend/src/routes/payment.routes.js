const express = require('express');

const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');

/**
 * Payment Routes
 */

// Public routes

// Get payment methods
router.get('/methods', PaymentController.getPaymentMethods);

// Get bank list for VNPay
router.get('/banks', PaymentController.getBankList);

// VNPay callback (no auth required - called by VNPay)
router.get('/vnpay/callback', PaymentController.vnpayCallback);

// VNPay return (no auth required - called by VNPay)
router.get('/vnpay/return', PaymentController.vnpayReturn);

// Get payment by code (public for status checking)
router.get('/code/:paymentCode', PaymentController.getPaymentByCode);

// Protected routes (require authentication)

// Create payment (optional auth - supports guest booking)
router.post('/create', optionalAuth, PaymentController.createPayment);

// Get payments by booking
router.get('/booking/:bookingId', authenticate, PaymentController.getPaymentsByBooking);

// Customer routes

// Get my payments
router.get('/my-payments', authenticate, PaymentController.getMyPayments);

// System/Admin routes

// Handle expired payments (should be protected with admin auth in production)
router.post('/handle-expired', PaymentController.handleExpiredPayments);

/**
 * Dynamic param routes (MUST BE LAST to avoid conflicts with specific routes)
 */

// Query transaction status
router.get('/:paymentCode/status', PaymentController.queryTransactionStatus);

// Get payment by ID
router.get('/:paymentId', authenticate, PaymentController.getPaymentById);

module.exports = router;
