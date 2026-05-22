const express = require('express');

const router = express.Router();
const voucherController = require('../controllers/voucher.controller');

/**
 * Public voucher routes
 */

// Validate voucher
router.post('/validate', voucherController.validateVoucher);

// Get public vouchers
router.get('/public', voucherController.getPublicVouchers);

module.exports = router;
