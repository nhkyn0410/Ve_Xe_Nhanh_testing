const express = require('express');

const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Review Routes
 */

// Create review for a booking (Customer only)
router.post(
  '/bookings/:bookingId/review',
  authenticate,
  authorize('customer'),
  reviewController.createReview
);

// Check if can review a booking (Customer only)
router.get(
  '/bookings/:bookingId/can-review',
  authenticate,
  authorize('customer'),
  reviewController.canReview
);

// Send review invitation email (Customer only)
router.post(
  '/bookings/:bookingId/send-review-invitation',
  authenticate,
  authorize('customer'),
  reviewController.sendReviewInvitation
);

// Get reviews for a trip (Public)
router.get('/trips/:tripId/reviews', reviewController.getTripReviews);

// Get reviews for an operator (Public)
router.get('/operators/:operatorId/reviews', reviewController.getOperatorReviews);

// Get my reviews (Customer only)
router.get(
  '/users/my-reviews',
  authenticate,
  authorize('customer'),
  reviewController.getMyReviews
);

// Get bookings awaiting a review (Customer only)
router.get(
  '/users/pending-reviews',
  authenticate,
  authorize('customer'),
  reviewController.getPendingReviews
);

// Add operator response to review (Operator only)
router.post(
  '/reviews/:reviewId/response',
  authenticate,
  authorize('operator'),
  reviewController.addOperatorResponse
);

// Report a review (Authenticated users)
router.post(
  '/reviews/:reviewId/report',
  authenticate,
  reviewController.reportReview
);

module.exports = router;
