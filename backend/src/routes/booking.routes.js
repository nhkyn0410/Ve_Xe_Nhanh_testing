const express = require('express');

const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');

/**
 * Public booking routes (with optional auth to associate with logged-in users)
 */

// Hold seats temporarily (optionally authenticated to link with user account)
router.post('/hold-seats', optionalAuth, bookingController.holdSeats);

// Confirm booking (optionally authenticated to link with user account)
router.post('/:bookingId/confirm', optionalAuth, bookingController.confirmBooking);

// Extend hold duration
router.post('/:bookingId/extend', bookingController.extendHold);

// Release hold
router.post('/:bookingId/release', bookingController.releaseHold);

// Get booking by code (for guests)
router.get('/code/:bookingCode', bookingController.getBookingByCode);

// Get available seats for a trip
router.get('/trips/:tripId/available-seats', bookingController.getAvailableSeats);

// Cancel booking for guest users (no auth required)
router.post('/guest/cancel', bookingController.cancelBookingGuest);

/**
 * Protected customer routes
 */

// Get my bookings (requires authentication)
router.get(
  '/my-bookings',
  authenticate,
  authorize('customer'),
  bookingController.getMyBookings
);

// Cancel booking
router.post(
  '/:bookingId/cancel',
  authenticate,
  bookingController.cancelBooking
);

// Dynamic param routes (MUST BE LAST to avoid conflicts with specific routes)
// Get booking details
router.get('/:bookingId', bookingController.getBookingById);

module.exports = router;
