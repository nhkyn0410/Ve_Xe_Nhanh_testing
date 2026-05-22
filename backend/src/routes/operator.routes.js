const express = require('express');

const router = express.Router();
const operatorController = require('../controllers/operator.controller');
const routeController = require('../controllers/route.controller');
const busController = require('../controllers/bus.controller');
const employeeController = require('../controllers/employee.controller');
const tripController = require('../controllers/trip.controller');
const bookingController = require('../controllers/booking.controller');
const voucherController = require('../controllers/voucher.controller');
const paymentController = require('../controllers/payment.controller');
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Operator Routes
 * /api/v1/operators
 */

// Public routes
router.post('/register', operatorController.register);
router.post('/login', operatorController.login);
router.get('/', operatorController.getAll);

// Protected routes (Operator only)
router.get('/me/profile', authenticate, authorize('operator'), operatorController.getMe);
router.put('/me/profile', authenticate, authorize('operator'), operatorController.updateMe);

// Dashboard statistics (Operator only)
router.get('/dashboard/stats', authenticate, authorize('operator'), operatorController.getDashboardStats);

// Route management (Operator only)
router.post('/routes', authenticate, authorize('operator'), routeController.create);
router.get('/routes', authenticate, authorize('operator'), routeController.getMyRoutes);
router.get('/routes/:id', authenticate, authorize('operator'), routeController.getById);
router.put('/routes/:id', authenticate, authorize('operator'), routeController.update);
router.delete('/routes/:id', authenticate, authorize('operator'), routeController.delete);
router.put('/routes/:id/toggle-active', authenticate, authorize('operator'), routeController.toggleActive);

// Pickup/Dropoff points management
router.post('/routes/:id/pickup-points', authenticate, authorize('operator'), routeController.addPickupPoint);
router.delete('/routes/:id/pickup-points/:pointId', authenticate, authorize('operator'), routeController.removePickupPoint);
router.post('/routes/:id/dropoff-points', authenticate, authorize('operator'), routeController.addDropoffPoint);
router.delete('/routes/:id/dropoff-points/:pointId', authenticate, authorize('operator'), routeController.removeDropoffPoint);

// Bus management (Operator only)
router.post('/buses', authenticate, authorize('operator'), busController.create);
router.get('/buses', authenticate, authorize('operator'), busController.getMyBuses);
router.get('/buses/statistics', authenticate, authorize('operator'), busController.getStatistics);
router.get('/buses/:id', authenticate, authorize('operator'), busController.getById);
router.put('/buses/:id', authenticate, authorize('operator'), busController.update);
router.delete('/buses/:id', authenticate, authorize('operator'), busController.delete);
router.put('/buses/:id/status', authenticate, authorize('operator'), busController.changeStatus);

// Employee management (Operator only)
router.post('/employees', authenticate, authorize('operator'), employeeController.create);
router.get('/employees', authenticate, authorize('operator'), employeeController.getMyEmployees);
router.get('/employees/statistics', authenticate, authorize('operator'), employeeController.getStatistics);
router.get('/employees/available/:role', authenticate, authorize('operator'), employeeController.getAvailableForTrips);
router.get('/employees/:id', authenticate, authorize('operator'), employeeController.getById);
router.put('/employees/:id', authenticate, authorize('operator'), employeeController.update);
router.delete('/employees/:id', authenticate, authorize('operator'), employeeController.delete);
router.put('/employees/:id/status', authenticate, authorize('operator'), employeeController.changeStatus);
router.post('/employees/:id/reset-password', authenticate, authorize('operator'), employeeController.resetPassword);

// Trip management (Operator only)
router.post('/trips', authenticate, authorize('operator'), tripController.create);
router.post('/trips/recurring', authenticate, authorize('operator'), tripController.createRecurring);
router.get('/trips', authenticate, authorize('operator'), tripController.getMyTrips);
router.get('/trips/statistics', authenticate, authorize('operator'), tripController.getStatistics);
router.get('/trips/:id', authenticate, authorize('operator'), tripController.getById);
router.put('/trips/:id', authenticate, authorize('operator'), tripController.update);
router.put('/trips/:id/dynamic-pricing', authenticate, authorize('operator'), tripController.configureDynamicPricing);
router.delete('/trips/:id', authenticate, authorize('operator'), tripController.delete);
router.put('/trips/:id/cancel', authenticate, authorize('operator'), tripController.cancel);

// Booking management (Operator only)
router.get('/bookings', authenticate, authorize('operator'), bookingController.getOperatorBookings);
router.get('/bookings/statistics', authenticate, authorize('operator'), bookingController.getStatistics);
router.put('/bookings/:bookingId/payment', authenticate, authorize('operator'), bookingController.updatePayment);

// Voucher management (Operator only)
router.post('/vouchers', authenticate, authorize('operator'), voucherController.createVoucher);
router.get('/vouchers', authenticate, authorize('operator'), voucherController.getOperatorVouchers);
router.get('/vouchers/statistics', authenticate, authorize('operator'), voucherController.getVoucherStatistics);
router.get('/vouchers/:id', authenticate, authorize('operator'), voucherController.getVoucherById);
router.get('/vouchers/:id/usage-report', authenticate, authorize('operator'), voucherController.getVoucherUsageReport);
router.put('/vouchers/:id', authenticate, authorize('operator'), voucherController.updateVoucher);
router.delete('/vouchers/:id', authenticate, authorize('operator'), voucherController.deleteVoucher);
router.put('/vouchers/:id/activate', authenticate, authorize('operator'), voucherController.activateVoucher);
router.put('/vouchers/:id/deactivate', authenticate, authorize('operator'), voucherController.deactivateVoucher);

// Payment management (Operator only)
router.get('/payments', authenticate, authorize('operator'), paymentController.getOperatorPayments);
router.get('/payments/statistics', authenticate, authorize('operator'), paymentController.getStatistics);
router.post('/payments/:paymentId/refund', authenticate, authorize('operator'), paymentController.processRefund);

// Reports & Analytics (Operator only) - Phase 5.3
router.get('/reports/revenue', authenticate, authorize('operator'), reportController.getRevenueReport);
router.get('/reports/revenue/summary', authenticate, authorize('operator'), reportController.getRevenueSummary);
router.get('/reports/revenue/by-route', authenticate, authorize('operator'), reportController.getRevenueByRoute);
router.get('/reports/revenue/trend', authenticate, authorize('operator'), reportController.getRevenueTrend);
router.get('/reports/cancellation', authenticate, authorize('operator'), reportController.getCancellationReport);
router.get('/reports/growth', authenticate, authorize('operator'), reportController.getGrowthMetrics);

// Dynamic param routes (MUST BE LAST to avoid conflicts with specific routes)
router.get('/:id', operatorController.getById);

module.exports = router;
