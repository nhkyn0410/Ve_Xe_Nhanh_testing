const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const logger = require('../utils/logger');

/**
 * Trip Manager Authentication Middleware
 * Verifies JWT token for trip managers and drivers
 */

/**
 * Protect routes - require trip manager/driver authentication
 */
const protectTripManager = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để truy cập',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if token type is access
    if (decoded.type !== 'access') {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }

    // Check if role is trip_manager or driver
    if (decoded.role !== 'trip_manager' && decoded.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Trip Manager hoặc Driver mới có quyền truy cập',
      });
    }

    // Verify employee exists and is active
    const employee = await Employee.findById(decoded.userId);
    if (!employee || employee.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản không hoạt động',
      });
    }

    // Attach trip manager info to request
    req.tripManager = {
      id: decoded.userId,
      role: decoded.role,
      operatorId: decoded.operatorId,
    };
    req.userId = decoded.userId;
    req.user = employee;

    next();
  } catch (error) {
    logger.error('Lỗi xác thực quản lý chuyến:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực',
    });
  }
};

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles (trip_manager, driver)
 */
const authorizeTripManager =
  (...roles) =>
  (req, res, next) => {
    if (!req.tripManager) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
      });
    }

    if (!roles.includes(req.tripManager.role)) {
      return res.status(403).json({
        success: false,
        message: `Chỉ ${roles.join(', ')} mới có quyền truy cập`,
      });
    }

    next();
  };

module.exports = {
  protectTripManager,
  authorizeTripManager,
};
