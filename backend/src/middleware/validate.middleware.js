const { body, param, validationResult } = require('express-validator');

/**
 * Middleware xử lý validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Dữ liệu không hợp lệ',
      errors: errorMessages,
    });
  }

  next();
};

/**
 * Validation rules cho đăng ký
 */
const buildAccountValidationRules = () => [
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail().toLowerCase(),
  body('phone')
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại phải có 10-11 chữ số'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Họ tên là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự'),
];

const validateRegister = [...buildAccountValidationRules(), handleValidationErrors];

/**
 * Validation rules cho tạo tài khoản admin
 */
const validateCreateAdmin = [...buildAccountValidationRules(), handleValidationErrors];

/**
 * Validation rules cho bootstrap admin đầu tiên
 */
const validateBootstrapAdmin = [
  ...buildAccountValidationRules(),
  body('bootstrapSecret').optional().trim().isString().withMessage('Bootstrap secret không hợp lệ'),
  handleValidationErrors,
];

/**
 * Validation rules cho đăng nhập
 */
const validateLogin = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email hoặc số điện thoại là bắt buộc')
    .customSanitizer((value) => {
      // If it looks like an email, normalize it the same way as registration
      if (value.includes('@')) {
        const parts = value.toLowerCase().split('@');
        if (parts.length === 2) {
          const localPart = parts[0];
          const domain = parts[1];

          // For Gmail and Googlemail, remove dots from local part
          if (domain === 'gmail.com' || domain === 'googlemail.com') {
            return `${localPart.replace(/\./g, '')}@${domain}`;
          }

          // For other domains, just lowercase
          return value.toLowerCase();
        }
      }
      return value;
    }),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
  handleValidationErrors,
];

/**
 * Validation rules cho refresh token
 */
const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token là bắt buộc'),
  handleValidationErrors,
];

/**
 * Validation rules cho forgot password
 */
const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail().toLowerCase(),
  handleValidationErrors,
];

/**
 * Validation rules cho reset password
 */
const validateResetPassword = [
  body('resetToken').notEmpty().withMessage('Reset token là bắt buộc'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  handleValidationErrors,
];

/**
 * Validation rules cho verify email
 */
const validateVerifyEmail = [
  param('token').notEmpty().withMessage('Token là bắt buộc'),
  handleValidationErrors,
];

/**
 * Validation rules cho verify phone
 */
const validateVerifyPhone = [
  body('otp')
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('OTP phải là 6 chữ số'),
  handleValidationErrors,
];

/**
 * Validation rules cho update profile
 */
const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại phải có 10-11 chữ số'),
  body('dateOfBirth').optional().isISO8601().withMessage('Ngày sinh không hợp lệ'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ'),
  handleValidationErrors,
];

/**
 * Validation rules cho change password
 */
const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateCreateAdmin,
  validateBootstrapAdmin,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateVerifyPhone,
  validateUpdateProfile,
  validateChangePassword,
};
