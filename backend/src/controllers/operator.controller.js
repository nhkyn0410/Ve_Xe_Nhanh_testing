const OperatorService = require('../services/operator.service');
const DashboardService = require('../services/dashboard.service');
const logger = require('../utils/logger');

/**
 * Operator Controller
 * Xử lý các HTTP requests liên quan đến bus operators
 */

/**
 * @route   GET /api/v1/operators/dashboard/stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Private (Operator)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const operatorId = req.userId; // From authenticate middleware
    const { period, startDate, endDate } = req.query;

    const stats = await DashboardService.getDashboardStats(operatorId, {
      period,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Lỗi lấy thống kê dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Không thể tải thống kê dashboard',
    });
  }
};

/**
 * @route   POST /api/v1/operators/register
 * @desc    Đăng ký nhà xe mới
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const {
      companyName,
      operatorName,
      email,
      phone,
      password,
      businessLicense,
      taxCode,
      address,
      bankInfo,
      description,
      website,
    } = req.body;

    // Validate required fields
    if (!companyName || !email || !phone || !password || !businessLicense || !taxCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin: companyName, email, phone, password, businessLicense, taxCode',
      });
    }

    // Register operator
    const result = await OperatorService.register({
      companyName,
      operatorName,
      email,
      phone,
      password,
      businessLicense,
      taxCode,
      address,
      bankInfo,
      description,
      website,
    });

    res.status(201).json({
      status: 'success',
      message: 'Đăng ký nhà xe thành công. Vui lòng chờ admin duyệt.',
      data: {
        operator: result.operator,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    logger.error('Lỗi đăng ký nhà điều hành:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Đăng ký nhà xe thất bại',
    });
  }
};

/**
 * @route   POST /api/v1/operators/login
 * @desc    Đăng nhập cho operator
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp email và mật khẩu',
      });
    }

    // Login
    const result = await OperatorService.login(email, password, rememberMe || false);

    res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công',
      data: {
        operator: result.operator,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    logger.error('Lỗi đăng nhập nhà điều hành:', error);
    res.status(401).json({
      status: 'error',
      message: error.message || 'Đăng nhập thất bại',
    });
  }
};

/**
 * @route   GET /api/v1/operators/me
 * @desc    Lấy thông tin operator hiện tại
 * @access  Private (Operator)
 */
exports.getMe = async (req, res, next) => {
  try {
    const operatorId = req.userId; // Từ authenticate middleware

    const operator = await OperatorService.getById(operatorId);

    res.status(200).json({
      status: 'success',
      data: {
        operator,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy nhà điều hành:', error);
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy nhà xe',
    });
  }
};

/**
 * @route   PUT /api/v1/operators/me
 * @desc    Cập nhật thông tin operator
 * @access  Private (Operator)
 */
exports.updateMe = async (req, res, next) => {
  try {
    const operatorId = req.userId; // Từ authenticate middleware
    const updateData = req.body;

    const operator = await OperatorService.update(operatorId, updateData);

    res.status(200).json({
      status: 'success',
      message: 'Cập nhật thông tin thành công',
      data: {
        operator,
      },
    });
  } catch (error) {
    logger.error('Lỗi cập nhật nhà điều hành:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Cập nhật thông tin thất bại',
    });
  }
};

/**
 * @route   GET /api/v1/operators/:id
 * @desc    Lấy thông tin operator theo ID
 * @access  Public
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const operator = await OperatorService.getById(id);

    res.status(200).json({
      status: 'success',
      data: {
        operator,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy nhà điều hành:', error);
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy nhà xe',
    });
  }
};

exports.getPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await OperatorService.getPublicProfile(id);

    res.status(200).json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    logger.error('Lỗi lấy hồ sơ nhà xe:', error);
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy hồ sơ nhà xe',
    });
  }
};

/**
 * @route   GET /api/v1/operators
 * @desc    Lấy danh sách operators
 * @access  Public
 */
exports.getAll = async (req, res, next) => {
  try {
    const {
      verificationStatus,
      isSuspended,
      isActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const filters = {
      verificationStatus,
      isSuspended: isSuspended === 'true' ? true : isSuspended === 'false' ? false : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    };

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await OperatorService.getAll(filters, options);

    res.status(200).json({
      status: 'success',
      data: {
        operators: result.operators,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy nhà điều hành:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lấy danh sách nhà xe thất bại',
    });
  }
};
