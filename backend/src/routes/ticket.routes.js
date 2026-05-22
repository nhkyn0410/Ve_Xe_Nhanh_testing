const express = require('express');

const router = express.Router();
const { body, param } = require('express-validator');
const TicketController = require('../controllers/ticket.controller');


// Note: auth middleware should be imported from your middleware folder
// const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * Ticket Routes
 * Base path: /api/tickets or /api/v1/tickets
 */

// Validation middleware
const validateGenerateTicket = [
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID là bắt buộc')
    .isMongoId()
    .withMessage('Booking ID không hợp lệ'),
];

const validateLookupTicket = [
  body('ticketCode').notEmpty().withMessage('Mã vé là bắt buộc'),
  body('phone')
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage('Số điện thoại không hợp lệ'),
];

const validateRequestOTP = [
  body('phone')
    .optional()
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ'),
  body().custom((value, { req }) => {
    if (!req.body.phone && !req.body.email) {
      throw new Error('Phải cung cấp số điện thoại hoặc email');
    }
    return true;
  }),
];

const validateVerifyOTP = [
  body('phone')
    .optional()
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ'),
  body().custom((value, { req }) => {
    if (!req.body.phone && !req.body.email) {
      throw new Error('Phải cung cấp số điện thoại hoặc email');
    }
    return true;
  }),
  body('otp')
    .notEmpty()
    .withMessage('Mã OTP là bắt buộc')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải có 6 chữ số')
    .isNumeric()
    .withMessage('Mã OTP chỉ chứa số'),
];

const validateVerifyQR = [
  body('qrCodeData').notEmpty().withMessage('Dữ liệu QR code là bắt buộc'),
];

const validateCancelTicket = [
  body('reason')
    .optional()
    .isString()
    .withMessage('Lý do hủy phải là chuỗi ký tự'),
];

const validateChangeTicket = [
  body('newTripId')
    .notEmpty()
    .withMessage('Trip ID mới là bắt buộc')
    .isMongoId()
    .withMessage('Trip ID mới không hợp lệ'),
  body('seats')
    .notEmpty()
    .withMessage('Danh sách ghế là bắt buộc')
    .isArray({ min: 1 })
    .withMessage('Phải chọn ít nhất 1 ghế'),
  body('seats.*.seatNumber')
    .notEmpty()
    .withMessage('Số ghế là bắt buộc'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Lý do đổi vé phải là chuỗi ký tự'),
];

const validateTicketId = [
  param('id').isMongoId().withMessage('Ticket ID không hợp lệ'),
];

const validateTripId = [
  param('tripId').isMongoId().withMessage('Trip ID không hợp lệ'),
];

/**
 * Public routes (no authentication required)
 */

// UC-27: Guest ticket lookup with OTP (2-step process)
// Step 1: Request OTP
// POST /api/tickets/lookup/request-otp
router.post(
  '/lookup/request-otp',
  validateRequestOTP,
  TicketController.requestTicketLookupOTP
);

// Step 2: Verify OTP and get ticket
// POST /api/tickets/lookup/verify-otp
router.post(
  '/lookup/verify-otp',
  validateVerifyOTP,
  TicketController.verifyTicketLookupOTP
);

// UC-27: Legacy lookup without OTP (for backward compatibility)
// POST /api/tickets/lookup
router.post('/lookup', validateLookupTicket, TicketController.lookupTicket);

/**
 * Protected routes (authentication required)
 * Uncomment protect middleware when ready to use
 */

// Generate ticket (typically called after payment confirmation)
// POST /api/tickets/generate
router.post(
  '/generate',
  // protect,
  validateGenerateTicket,
  TicketController.generateTicket
);

/**
 * Customer routes
 * These should be mounted under /api/users in main app
 */

// UC-8: Get customer tickets
// GET /api/users/tickets
router.get(
  '/customer/my-tickets',
  // protect,
  // authorize('customer'),
  TicketController.getCustomerTickets
);

/**
 * Trip Manager routes
 * These should be mounted under /api/trips in main app
 */

// UC-20: Get trip passengers
// GET /api/trips/:tripId/passengers
router.get(
  '/trip/:tripId/passengers',
  // protect,
  // authorize('trip_manager', 'driver', 'operator'),
  validateTripId,
  TicketController.getTripPassengers
);

// UC-19: Verify ticket QR code
// POST /api/trips/:tripId/verify-ticket
router.post(
  '/trip/:tripId/verify',
  // protect,
  // authorize('trip_manager', 'driver'),
  validateTripId,
  validateVerifyQR,
  TicketController.verifyTicketQR
);

/**
 * Operator routes
 * These should be mounted under /api/operators in main app
 */

// Get ticket statistics
// GET /api/operators/tickets/stats
router.get(
  '/operator/stats',
  // protect,
  // authorize('operator'),
  TicketController.getTicketStats
);

/**
 * Dynamic param routes (MUST BE LAST to avoid conflicts with specific routes)
 */

// UC-9: Cancel ticket
// POST /api/tickets/:id/cancel
router.post(
  '/:id/cancel',
  // protect,
  validateTicketId,
  validateCancelTicket,
  TicketController.cancelTicket
);

// UC-10: Change/Exchange ticket
// POST /api/tickets/:id/change
router.post(
  '/:id/change',
  // protect,
  validateTicketId,
  validateChangeTicket,
  TicketController.changeTicket
);

// Download ticket PDF
// GET /api/tickets/:id/download
router.get(
  '/:id/download',
  // protect,
  validateTicketId,
  TicketController.downloadTicket
);

// Resend ticket notifications
// POST /api/tickets/:id/resend
router.post(
  '/:id/resend',
  // protect,
  validateTicketId,
  TicketController.resendTicket
);

// Get ticket by booking ID
// GET /api/tickets/booking/:bookingId
router.get(
  '/booking/:bookingId',
  TicketController.getTicketByBooking
);

// Get ticket by ID
// GET /api/tickets/:id
router.get(
  '/:id',
  // protect,
  validateTicketId,
  TicketController.getTicketById
);

module.exports = router;
