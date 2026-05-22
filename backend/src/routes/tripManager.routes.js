const express = require('express');

const router = express.Router();
const { body, param } = require('express-validator');
const TripManagerController = require('../controllers/tripManager.controller');
const TicketController = require('../controllers/ticket.controller');

const { protectTripManager, authorizeTripManager } = require('../middleware/tripManagerAuth.middleware');

/**
 * Trip Manager Routes
 * Base path: /api/trip-manager or /api/v1/trip-manager
 * For trip managers and drivers to manage trips and verify tickets
 */

// Validation middleware
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Tên đăng nhập là bắt buộc')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
];

const validateTripId = [
  param('tripId').isMongoId().withMessage('Trip ID không hợp lệ'),
];

const validateVerifyQR = [
  body('qrCodeData').notEmpty().withMessage('Dữ liệu QR code là bắt buộc'),
];

/**
 * Public routes (no authentication)
 */

// UC-18: Trip Manager Login
// POST /api/trip-manager/login
router.post('/login', validateLogin, TripManagerController.login);

/**
 * Protected routes (authentication required)
 */

// Get current trip manager info
// GET /api/trip-manager/me
router.get('/me', protectTripManager, TripManagerController.getMe);

// Get assigned trips
// GET /api/trip-manager/trips
router.get('/trips', protectTripManager, TripManagerController.getAssignedTrips);

// Get trip details with passengers
// GET /api/trip-manager/trips/:tripId
router.get(
  '/trips/:tripId',
  protectTripManager,
  validateTripId,
  TripManagerController.getTripDetails
);

// Start trip
// POST /api/trip-manager/trips/:tripId/start
router.post(
  '/trips/:tripId/start',
  protectTripManager,
  authorizeTripManager('trip_manager', 'driver'),
  validateTripId,
  TripManagerController.startTrip
);

// Complete trip
// POST /api/trip-manager/trips/:tripId/complete
router.post(
  '/trips/:tripId/complete',
  protectTripManager,
  authorizeTripManager('trip_manager', 'driver'),
  validateTripId,
  TripManagerController.completeTrip
);

// UC-21: Update trip status (Unified endpoint) - Phase 5.4
// PUT /api/trip-manager/trips/:tripId/status
// Status values: scheduled, ongoing, completed, cancelled
// Automatically notifies passengers on status change
router.put(
  '/trips/:tripId/status',
  protectTripManager,
  authorizeTripManager('trip_manager', 'driver'),
  validateTripId,
  [
    body('status')
      .notEmpty()
      .withMessage('Trạng thái là bắt buộc')
      .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
      .withMessage('Trạng thái không hợp lệ'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Lý do không quá 500 ký tự'),
  ],
  TripManagerController.updateTripStatus
);

/**
 * Ticket Verification Routes
 * These routes are for trip managers to verify tickets on their trips
 */

// UC-20: Get trip passengers
// GET /api/trip-manager/trips/:tripId/passengers
router.get(
  '/trips/:tripId/passengers',
  protectTripManager,
  validateTripId,
  TicketController.getTripPassengers
);

// UC-19: Verify ticket QR code
// POST /api/trip-manager/trips/:tripId/verify-ticket
router.post(
  '/trips/:tripId/verify-ticket',
  protectTripManager,
  authorizeTripManager('trip_manager', 'driver'),
  validateTripId,
  validateVerifyQR,
  TicketController.verifyTicketQR
);

/**
 * Journey Tracking Routes
 * For tracking trip progress through stops/waypoints
 */

// Get journey details with stops and status history
// GET /api/trip-manager/trips/:tripId/journey
router.get(
  '/trips/:tripId/journey',
  protectTripManager,
  validateTripId,
  TripManagerController.getJourneyDetails
);

// Update journey status (preparing, checking_tickets, in_transit, at_stop, completed)
// PUT /api/trip-manager/trips/:tripId/journey/status
router.put(
  '/trips/:tripId/journey/status',
  protectTripManager,
  authorizeTripManager('trip_manager', 'driver'),
  validateTripId,
  [
    body('status')
      .notEmpty()
      .withMessage('Trạng thái hành trình là bắt buộc')
      .isIn(['preparing', 'checking_tickets', 'in_transit', 'at_stop', 'completed', 'cancelled'])
      .withMessage('Trạng thái không hợp lệ'),
    body('stopIndex')
      .optional()
      .isInt({ min: -1 })
      .withMessage('stopIndex phải là số nguyên >= -1'),
    body('location')
      .optional()
      .isObject()
      .withMessage('location phải là object có lat và lng'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Ghi chú không quá 500 ký tự'),
  ],
  TripManagerController.updateJourneyStatus
);

module.exports = router;
