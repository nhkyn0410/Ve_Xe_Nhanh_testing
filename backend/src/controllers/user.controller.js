const UserService = require('../services/user.service');
const loyaltyService = require('../services/loyalty.service');
const logger = require('../utils/logger');

/**
 * User Controller
 * Xử lý các HTTP requests liên quan đến user profile
 */

/**
 * @route   GET /api/v1/users/profile
 * @desc    Lấy thông tin profile của user hiện tại
 * @access  Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.userId; // Từ authenticate middleware

    const user = await UserService.getProfile(userId);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy hồ sơ:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lấy thông tin profile thất bại',
    });
  }
};

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Cập nhật profile của user
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const updateData = req.body;

    // Không cho phép cập nhật các trường nhạy cảm qua route này
    const restrictedFields = ['password', 'email', 'role', 'isActive', 'isBlocked'];
    restrictedFields.forEach((field) => {
      if (updateData[field]) {
        delete updateData[field];
      }
    });

    const user = await UserService.updateProfile(userId, updateData);

    res.status(200).json({
      status: 'success',
      message: 'Cập nhật profile thành công',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Lỗi cập nhật hồ sơ:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Cập nhật profile thất bại',
    });
  }
};

/**
 * @route   POST /api/v1/users/avatar
 * @desc    Upload avatar
 * @access  Private
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Kiểm tra file được upload
    if (!req.file && !req.body.avatar) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng upload ảnh avatar',
      });
    }

    // Hỗ trợ cả file upload và base64
    const file = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : req.body.avatar;

    const user = await UserService.uploadAvatar(userId, file);

    res.status(200).json({
      status: 'success',
      message: 'Upload avatar thành công',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Lỗi tải ảnh đại diện:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Upload avatar thất bại',
    });
  }
};

/**
 * @route   DELETE /api/v1/users/avatar
 * @desc    Xóa avatar
 * @access  Private
 */
exports.deleteAvatar = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await UserService.deleteAvatar(userId);

    res.status(200).json({
      status: 'success',
      message: 'Xóa avatar thành công',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Lỗi xóa ảnh đại diện:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Xóa avatar thất bại',
    });
  }
};

/**
 * @route   PUT /api/v1/users/change-password
 * @desc    Thay đổi mật khẩu
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
    }

    await UserService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Thay đổi mật khẩu thành công',
    });
  } catch (error) {
    logger.error('Lỗi đổi mật khẩu:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Thay đổi mật khẩu thất bại',
    });
  }
};

/**
 * @route   POST /api/v1/users/saved-passengers
 * @desc    Thêm hành khách thường đi
 * @access  Private
 */
exports.addSavedPassenger = async (req, res, next) => {
  try {
    const userId = req.userId;
    const passengerData = req.body;

    // Validate required fields
    if (!passengerData.fullName || !passengerData.phone || !passengerData.idCard) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin hành khách',
      });
    }

    const user = await UserService.addSavedPassenger(userId, passengerData);

    res.status(200).json({
      status: 'success',
      message: 'Thêm hành khách thành công',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Lỗi thêm hành khách đã lưu:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Thêm hành khách thất bại',
    });
  }
};

/**
 * @route   DELETE /api/v1/users/saved-passengers/:passengerId
 * @desc    Xóa hành khách thường đi
 * @access  Private
 */
exports.removeSavedPassenger = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { passengerId } = req.params;

    if (!passengerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ID hành khách',
      });
    }

    const user = await UserService.removeSavedPassenger(userId, passengerId);

    res.status(200).json({
      status: 'success',
      message: 'Xóa hành khách thành công',
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Remove đã lưu passenger lỗi:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Xóa hành khách thất bại',
    });
  }
};

/**
 * @route   GET /api/v1/users/points-history
 * @desc    Lấy lịch sử điểm loyalty
 * @access  Private
 */
exports.getPointsHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = req.query;

    const result = await UserService.getPointsHistory(userId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    logger.error('Get điểm hisđếnry lỗi:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lấy lịch sử điểm thất bại',
    });
  }
};

/**
 * @route   GET /api/v1/users/loyalty/history
 * @desc    Get loyalty program history
 * @access  Private
 */
exports.getLoyaltyHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit, type } = req.query;

    const result = await loyaltyService.getLoyaltyHistory(userId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      type,
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('Get tích điểm hisđếnry lỗi:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lấy lịch sử loyalty thất bại',
    });
  }
};

/**
 * @route   GET /api/v1/users/loyalty/overview
 * @desc    Get loyalty program overview
 * @access  Private
 */
exports.getLoyaltyOverview = async (req, res, next) => {
  try {
    const userId = req.userId;

    const result = await loyaltyService.getLoyaltyOverview(userId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Get tích điểm tổng quan lỗi:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lấy thông tin loyalty thất bại',
    });
  }
};

/**
 * @route   POST /api/v1/users/loyalty/redeem
 * @desc    Redeem loyalty points
 * @access  Private
 */
exports.redeemPoints = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { points } = req.body;

    if (!points || points < 100) {
      return res.status(400).json({
        success: false,
        message: 'Số điểm đổi tối thiểu là 100',
      });
    }

    const result = await loyaltyService.redeemPoints(userId, points);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Redeem điểm lỗi:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Đổi điểm thất bại',
    });
  }
};
