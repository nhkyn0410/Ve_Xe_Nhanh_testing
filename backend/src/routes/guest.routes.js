const express = require('express');

const router = express.Router();
const GuestController = require('../controllers/guest.controller');

/**
 * Guest Booking Routes
 * Handles guest OTP verification and session management
 */

// Request OTP for guest booking
router.post('/request-otp', GuestController.requestOTP);

// Verify OTP and create guest session
router.post('/verify-otp', GuestController.verifyOTP);

// Get guest session info
router.get('/session', GuestController.getSession);

// Extend guest session
router.post('/extend-session', GuestController.extendSession);

// Update guest session data
router.put('/session', GuestController.updateSession);

// Delete guest session (logout)
router.delete('/session', GuestController.deleteSession);

// Check OTP status
router.get('/otp-status/:identifier', GuestController.checkOTPStatus);

module.exports = router;
