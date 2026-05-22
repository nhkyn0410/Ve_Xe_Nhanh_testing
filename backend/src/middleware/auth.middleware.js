const AuthService = require('../services/auth.service');
const User = require('../models/User');
const BusOperator = require('../models/BusOperator');
const Employee = require('../models/Employee');
const logger = require('../utils/logger');
/**
 * Check session timeout (30 minutes of inactivity by default)
 * @param {Object} user - User object
 * @returns {Boolean} - True if session is valid
 */
const checkSessionTimeout = (user) => {
  const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10) || 30;
  const timeoutMs = sessionTimeout * 60 * 1000;

  if (user.lastLogin) {
    const timeSinceLastLogin = Date.now() - new Date(user.lastLogin).getTime();
    return timeSinceLastLogin <= timeoutMs;
  }

  // If no lastLogin, session is valid (newly created user)
  return true;
};

/**
 * Middleware xác thực JWT token
 * Kiểm tra token trong header Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Lấy token từ header
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Kiểm tra token có tồn tại không
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Vui lòng đăng nhập để truy cập',
        code: 'NO_TOKEN',
      });
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = AuthService.verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: error.message || 'Token không hợp lệ',
        code: 'INVALID_TOKEN',
      });
    }

    // 3. Kiểm tra token type (phải là access token)
    if (decoded.type !== 'access') {
      return res.status(401).json({
        status: 'error',
        message: 'Token không hợp lệ',
        code: 'INVALID_TOKEN_TYPE',
      });
    }

    // 4. Kiểm tra user/operator/employee còn tồn tại không
    let user;

    // Tìm trong collection tương ứng dựa trên role
    if (decoded.role === 'operator') {
      user = await BusOperator.findById(decoded.userId);
    } else if (decoded.role === 'trip_manager' || decoded.role === 'driver') {
      user = await Employee.findById(decoded.userId);
    } else {
      // customer, admin
      user = await User.findById(decoded.userId);
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Tài khoản không tồn tại',
        code: 'USER_NOT_FOUND',
      });
    }

    // 5. Kiểm tra account status dựa trên loại user
    if (decoded.role === 'operator') {
      // BusOperator checks
      if (user.isSuspended) {
        return res.status(403).json({
          status: 'error',
          message: `Tài khoản đã bị tạm ngưng. Lý do: ${user.suspensionReason || 'Không rõ'}`,
          code: 'ACCOUNT_SUSPENDED',
        });
      }
      if (!user.isActive) {
        return res.status(403).json({
          status: 'error',
          message: 'Tài khoản không hoạt động',
          code: 'ACCOUNT_INACTIVE',
        });
      }
    } else if (decoded.role === 'trip_manager' || decoded.role === 'driver') {
      // Employee checks
      if (user.status !== 'active') {
        return res.status(403).json({
          status: 'error',
          message: `Tài khoản ${user.status === 'suspended' ? 'đã bị tạm ngưng' : 'không hoạt động'}`,
          code: 'ACCOUNT_INACTIVE',
        });
      }
    } else {
      // User (customer/admin) checks
      if (user.isBlocked) {
        return res.status(403).json({
          status: 'error',
          message: `Tài khoản đã bị khóa. Lý do: ${user.blockedReason || 'Không rõ'}`,
          code: 'ACCOUNT_BLOCKED',
        });
      }
      if (!user.isActive) {
        return res.status(403).json({
          status: 'error',
          message: 'Tài khoản không hoạt động',
          code: 'ACCOUNT_INACTIVE',
        });
      }

      // Check session timeout only for regular users
      if (!checkSessionTimeout(user)) {
        return res.status(401).json({
          status: 'error',
          message: 'Phiên đăng nhập đã hết hạn do không hoạt động. Vui lòng đăng nhập lại.',
          code: 'SESSION_TIMEOUT',
        });
      }

      // Update lastLogin to extend session
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });
    }

    // 6. Lưu user vào request object
    req.user = user;
    req.userId = user._id;
    req.userRole = decoded.role; // Add role for easier access

    next();
  } catch (error) {
    logger.error('Lỗi xác thực:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi xác thực',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Middleware kiểm tra role
 * Sử dụng sau authenticate middleware
 * @param {...String} roles - Danh sách roles được phép
 */
const authorize = (...roles) => (req, res, next) => {
  // Kiểm tra user đã được authenticate chưa
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Vui lòng đăng nhập để truy cập',
    });
  }

  // Kiểm tra role - use req.userRole from authenticate middleware
  // This ensures consistency across different user types (User, BusOperator, Employee)
  const userRole = req.userRole || req.user.role;
  if (!roles.includes(userRole)) {
    return res.status(403).json({
      status: 'error',
      message: 'Bạn không có quyền truy cập tài nguyên này',
    });
  }

  next();
};

/**
 * Middleware cho phép truy cập không cần đăng nhập
 * Nhưng nếu có token hợp lệ thì sẽ lưu user vào request
 * Dùng cho guest booking
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Lấy token từ header
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Nếu không có token, cho phép tiếp tục (guest)
    if (!token) {
      req.user = null;
      return next();
    }

    // Nếu có token, verify và lưu user
    try {
      const decoded = AuthService.verifyToken(token);

      if (decoded.type === 'access') {
        const user = await User.findById(decoded.userId);
        if (user && !user.isBlocked && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      }
    } catch (error) {
      // Token không hợp lệ, vẫn cho phép tiếp tục như guest
      req.user = null;
    }

    next();
  } catch (error) {
    logger.error('Lỗi xác thực tùy chọn:', error);
    req.user = null;
    next();
  }
};

/**
 * Middleware kiểm tra email đã được verify chưa
 * Sử dụng sau authenticate middleware
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Vui lòng đăng nhập để truy cập',
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'Vui lòng xác thực email trước khi thực hiện thao tác này',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  next();
};

/**
 * Middleware kiểm tra phone đã được verify chưa
 * Sử dụng sau authenticate middleware
 */
const requirePhoneVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Vui lòng đăng nhập để truy cập',
    });
  }

  if (!req.user.isPhoneVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'Vui lòng xác thực số điện thoại trước khi thực hiện thao tác này',
      code: 'PHONE_NOT_VERIFIED',
    });
  }

  next();
};

module.exports = {
  authenticate,
  protect: authenticate, // Alias for authenticate
  authorize,
  optionalAuth,
  requireEmailVerified,
  requirePhoneVerified,
};
