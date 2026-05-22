const express = require('express');

const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');

/**
 * Public voucher routes
 */

// Validate voucher
router.post('/validate', optionalAuth, voucherController.validateVoucher);

// Get public vouchers
router.get('/public', voucherController.getPublicVouchers);

// Customer voucher wallet
router.get('/wallet', authenticate, authorize('customer'), voucherController.getVoucherWallet);
router.post('/wallet', authenticate, authorize('customer'), voucherController.saveVoucherToWallet);
router.delete(
  '/wallet/:voucherId',
  authenticate,
  authorize('customer'),
  voucherController.removeVoucherFromWallet
);

module.exports = router;
