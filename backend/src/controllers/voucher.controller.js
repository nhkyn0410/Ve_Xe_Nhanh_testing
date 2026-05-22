const VoucherService = require('../services/voucher.service');
const logger = require('../utils/logger');

const isPlatformVoucher = (voucher) => !voucher.operatorId;

/**
 * @route   POST /api/v1/vouchers/validate
 * @desc    Validate voucher for booking
 * @access  Public
 */
exports.validateVoucher = async (req, res) => {
  try {
    const { code, tripId, totalAmount } = req.body;

    if (!code || !tripId || !totalAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu thông tin bắt buộc',
      });
    }

    const customerId = req.user ? req.user._id : null;

    const validation = await VoucherService.validateForBooking(code, {
      tripId,
      customerId,
      totalAmount,
    });

    res.status(200).json({
      status: 'success',
      data: validation,
      message: 'Voucher hợp lệ',
    });
  } catch (error) {
    logger.error('Lỗi xác thực voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Voucher không hợp lệ',
    });
  }
};

/**
 * @route   GET /api/v1/vouchers/public
 * @desc    Get public vouchers for customers
 * @access  Public
 */
exports.getPublicVouchers = async (req, res) => {
  try {
    const { operatorId, routeId } = req.query;

    const vouchers = await VoucherService.getPublicVouchers({
      operatorId,
      routeId,
    });

    res.status(200).json({
      status: 'success',
      data: {
        vouchers,
        total: vouchers.length,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy voucher công khai:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy danh sách voucher',
    });
  }
};

/**
 * @route   GET /api/v1/vouchers/wallet
 * @desc    Get current customer's saved voucher wallet
 * @access  Private (Customer)
 */
exports.getVoucherWallet = async (req, res) => {
  try {
    const vouchers = await VoucherService.getWallet(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        vouchers,
        total: vouchers.length,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy ví voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy ví voucher',
    });
  }
};

/**
 * @route   POST /api/v1/vouchers/wallet
 * @desc    Save a voucher to current customer's wallet
 * @access  Private (Customer)
 */
exports.saveVoucherToWallet = async (req, res) => {
  try {
    const { voucherId, code } = req.body;
    if (!voucherId && !code) {
      return res.status(400).json({
        status: 'error',
        message: 'Cần voucherId hoặc mã voucher',
      });
    }

    const voucher = await VoucherService.saveToWallet(req.user._id, { voucherId, code });

    res.status(200).json({
      status: 'success',
      data: { voucher },
      message: 'Đã lưu voucher vào ví',
    });
  } catch (error) {
    logger.error('Lỗi lưu voucher vào ví:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lưu voucher',
    });
  }
};

/**
 * @route   DELETE /api/v1/vouchers/wallet/:voucherId
 * @desc    Remove a voucher from current customer's wallet
 * @access  Private (Customer)
 */
exports.removeVoucherFromWallet = async (req, res) => {
  try {
    await VoucherService.removeFromWallet(req.user._id, req.params.voucherId);

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa voucher khỏi ví',
    });
  } catch (error) {
    logger.error('Lỗi xóa voucher khỏi ví:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể xóa voucher khỏi ví',
    });
  }
};

/**
 * @route   POST /api/v1/admin/vouchers
 * @desc    Create a platform voucher available across operators
 * @access  Private (Admin)
 */
exports.createAdminVoucher = async (req, res) => {
  try {
    const voucherData = { ...req.body, operatorId: null };
    const voucher = await VoucherService.create(voucherData, req.user._id, 'Admin');

    res.status(201).json({
      status: 'success',
      data: { voucher },
      message: 'Tạo voucher hệ thống thành công',
    });
  } catch (error) {
    logger.error('Lỗi tạo voucher hệ thống:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể tạo voucher hệ thống',
    });
  }
};

/**
 * @route   GET /api/v1/admin/vouchers
 * @desc    Get platform vouchers managed by admins
 * @access  Private (Admin)
 */
exports.getAdminVouchers = async (req, res) => {
  try {
    const vouchers = await VoucherService.getPlatformVouchers();

    res.status(200).json({
      status: 'success',
      data: {
        vouchers,
        total: vouchers.length,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy voucher hệ thống:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy danh sách voucher hệ thống',
    });
  }
};

/**
 * @route   GET /api/v1/admin/vouchers/statistics
 * @desc    Get platform voucher statistics
 * @access  Private (Admin)
 */
exports.getAdminVoucherStatistics = async (req, res) => {
  try {
    const stats = await VoucherService.getPlatformStatistics();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    logger.error('Lỗi lấy thống kê voucher hệ thống:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy thống kê voucher hệ thống',
    });
  }
};

/**
 * @route   PUT /api/v1/admin/vouchers/:id
 * @desc    Update a platform voucher
 * @access  Private (Admin)
 */
exports.updateAdminVoucher = async (req, res) => {
  try {
    const existingVoucher = await VoucherService.getById(req.params.id);
    if (!isPlatformVoucher(existingVoucher)) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin chỉ được cập nhật voucher hệ thống tại endpoint này',
      });
    }

    const {
      operatorId: _operatorId,
      createdBy: _createdBy,
      createdByModel: _createdByModel,
      ...updates
    } = req.body;
    const voucher = await VoucherService.update(req.params.id, { ...updates, operatorId: null });

    res.status(200).json({
      status: 'success',
      data: { voucher },
      message: 'Cập nhật voucher hệ thống thành công',
    });
  } catch (error) {
    logger.error('Lỗi cập nhật voucher hệ thống:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể cập nhật voucher hệ thống',
    });
  }
};

/**
 * @route   DELETE /api/v1/admin/vouchers/:id
 * @desc    Delete a platform voucher
 * @access  Private (Admin)
 */
exports.deleteAdminVoucher = async (req, res) => {
  try {
    const existingVoucher = await VoucherService.getById(req.params.id);
    if (!isPlatformVoucher(existingVoucher)) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin chỉ được xóa voucher hệ thống tại endpoint này',
      });
    }

    await VoucherService.delete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Xóa voucher hệ thống thành công',
    });
  } catch (error) {
    logger.error('Lỗi xóa voucher hệ thống:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể xóa voucher hệ thống',
    });
  }
};

exports.activateAdminVoucher = async (req, res) => {
  try {
    const existingVoucher = await VoucherService.getById(req.params.id);
    if (!isPlatformVoucher(existingVoucher)) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin chỉ được kích hoạt voucher hệ thống tại endpoint này',
      });
    }

    const voucher = await VoucherService.activate(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { voucher },
      message: 'Kích hoạt voucher hệ thống thành công',
    });
  } catch (error) {
    logger.error('Lỗi kích hoạt voucher hệ thống:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể kích hoạt voucher hệ thống',
    });
  }
};

exports.deactivateAdminVoucher = async (req, res) => {
  try {
    const existingVoucher = await VoucherService.getById(req.params.id);
    if (!isPlatformVoucher(existingVoucher)) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin chỉ được tạm dừng voucher hệ thống tại endpoint này',
      });
    }

    const voucher = await VoucherService.deactivate(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { voucher },
      message: 'Tạm dừng voucher hệ thống thành công',
    });
  } catch (error) {
    logger.error('Lỗi tạm dừng voucher hệ thống:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể tạm dừng voucher hệ thống',
    });
  }
};

/**
 * @route   POST /api/v1/operators/vouchers
 * @desc    Create new voucher
 * @access  Private (Operator)
 */
exports.createVoucher = async (req, res) => {
  try {
    const operatorId = req.user._id;
    const voucherData = { ...req.body, operatorId };

    const voucher = await VoucherService.create(voucherData, operatorId, 'BusOperator');

    res.status(201).json({
      status: 'success',
      data: { voucher },
      message: 'Tạo voucher thành công',
    });
  } catch (error) {
    logger.error('Lỗi tạo voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể tạo voucher',
    });
  }
};

/**
 * @route   GET /api/v1/operators/vouchers
 * @desc    Get operator's vouchers
 * @access  Private (Operator)
 */
exports.getOperatorVouchers = async (req, res) => {
  try {
    const operatorId = req.user._id;

    const vouchers = await VoucherService.getByOperator(operatorId);

    res.status(200).json({
      status: 'success',
      data: {
        vouchers,
        total: vouchers.length,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy voucher nhà điều hành:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy danh sách voucher',
    });
  }
};

/**
 * @route   GET /api/v1/operators/vouchers/:id
 * @desc    Get voucher details
 * @access  Private (Operator)
 */
exports.getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await VoucherService.getById(id);

    // Verify ownership
    if (voucher.operatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Không có quyền truy cập voucher này',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { voucher },
    });
  } catch (error) {
    logger.error('Lỗi lấy voucher:', error);
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy voucher',
    });
  }
};

/**
 * @route   PUT /api/v1/operators/vouchers/:id
 * @desc    Update voucher
 * @access  Private (Operator)
 */
exports.updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership first
    const existingVoucher = await VoucherService.getById(id);
    if (existingVoucher.operatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Không có quyền cập nhật voucher này',
      });
    }

    const voucher = await VoucherService.update(id, req.body);

    res.status(200).json({
      status: 'success',
      data: { voucher },
      message: 'Cập nhật voucher thành công',
    });
  } catch (error) {
    logger.error('Lỗi cập nhật voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể cập nhật voucher',
    });
  }
};

/**
 * @route   DELETE /api/v1/operators/vouchers/:id
 * @desc    Delete voucher
 * @access  Private (Operator)
 */
exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership first
    const existingVoucher = await VoucherService.getById(id);
    if (existingVoucher.operatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Không có quyền xóa voucher này',
      });
    }

    await VoucherService.delete(id);

    res.status(200).json({
      status: 'success',
      message: 'Xóa voucher thành công',
    });
  } catch (error) {
    logger.error('Lỗi xóa voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể xóa voucher',
    });
  }
};

/**
 * @route   PUT /api/v1/operators/vouchers/:id/deactivate
 * @desc    Deactivate voucher
 * @access  Private (Operator)
 */
exports.deactivateVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership first
    const existingVoucher = await VoucherService.getById(id);
    if (existingVoucher.operatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Không có quyền vô hiệu hóa voucher này',
      });
    }

    const voucher = await VoucherService.deactivate(id);

    res.status(200).json({
      status: 'success',
      data: { voucher },
      message: 'Vô hiệu hóa voucher thành công',
    });
  } catch (error) {
    logger.error('Lỗi vô hiệu hóa voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể vô hiệu hóa voucher',
    });
  }
};

/**
 * @route   PUT /api/v1/operators/vouchers/:id/activate
 * @desc    Activate voucher
 * @access  Private (Operator)
 */
exports.activateVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership first
    const existingVoucher = await VoucherService.getById(id);
    if (existingVoucher.operatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Không có quyền kích hoạt voucher này',
      });
    }

    const voucher = await VoucherService.activate(id);

    res.status(200).json({
      status: 'success',
      data: { voucher },
      message: 'Kích hoạt voucher thành công',
    });
  } catch (error) {
    logger.error('Lỗi kích hoạt voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể kích hoạt voucher',
    });
  }
};

/**
 * @route   GET /api/v1/operators/vouchers/statistics
 * @desc    Get voucher statistics
 * @access  Private (Operator)
 */
exports.getVoucherStatistics = async (req, res) => {
  try {
    const operatorId = req.user._id;

    const stats = await VoucherService.getStatistics(operatorId);

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    logger.error('Lỗi lấy thống kê voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy thống kê',
    });
  }
};

/**
 * @route   GET /api/v1/operators/vouchers/:id/usage-report
 * @desc    Get detailed voucher usage report
 * @access  Private (Operator)
 */
exports.getVoucherUsageReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    // Verify ownership first
    const existingVoucher = await VoucherService.getById(id);
    if (existingVoucher.operatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Không có quyền xem báo cáo voucher này',
      });
    }

    const report = await VoucherService.getUsageReport(id, {
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    logger.error('Lỗi lấy báo cáo sử dụng voucher:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy báo cáo sử dụng voucher',
    });
  }
};
