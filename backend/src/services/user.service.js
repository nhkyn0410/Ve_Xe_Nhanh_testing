const User = require('../models/User');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * User Service
 * Xử lý các logic liên quan đến user profile
 */
class UserService {
  /**
   * Lấy thông tin profile của user
   * @param {String} userId - User ID
   * @returns {Object} User profile
   */
  static async getProfile(userId) {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    return user;
  }

  /**
   * Cập nhật profile của user
   * @param {String} userId - User ID
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @returns {Object} Updated user
   */
  static async updateProfile(userId, updateData) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    // Các trường được phép cập nhật
    const allowedUpdates = [
      'fullName',
      'dateOfBirth',
      'gender',
      'phone',
      'savedPassengers',
    ];

    // Chỉ cập nhật các trường được phép (iterate allowed keys to avoid object-injection)
    allowedUpdates.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        user[key] = updateData[key];
      }
    });

    await user.save();

    // Loại bỏ password khỏi response
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Upload avatar
   * @param {String} userId - User ID
   * @param {Object} file - File object hoặc base64 string
   * @returns {Object} Updated user with new avatar
   */
  static async uploadAvatar(userId, file) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    // Nếu user đã có avatar, xóa avatar cũ khỏi Cloudinary
    if (user.avatar) {
      try {
        // Extract public_id from avatar URL
        const urlParts = user.avatar.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExtension.split('.')[0];
        await deleteImage(publicId);
      } catch (error) {
        logger.error(`Error đang xóa old avtạiar: ${error.message}`);
        // Continue even if delete fails
      }
    }

    // Upload avatar mới lên Cloudinary
    const uploadResult = await uploadImage(file, 'vexenhanh/avatars');

    // Cập nhật avatar URL trong database
    user.avatar = uploadResult.url;
    await user.save();

    // Loại bỏ password khỏi response
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Xóa avatar
   * @param {String} userId - User ID
   * @returns {Object} Updated user
   */
  static async deleteAvatar(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    if (!user.avatar) {
      throw new Error('User chưa có avatar');
    }

    // Xóa avatar khỏi Cloudinary
    try {
      const urlParts = user.avatar.split('/');
      const publicIdWithExtension = urlParts.slice(-2).join('/');
      const publicId = publicIdWithExtension.split('.')[0];
      await deleteImage(publicId);
    } catch (error) {
      logger.error(`Error đang xóa avtạiar từ Cloudtrtrêngary: ${error.message}`);
    }

    // Xóa avatar URL khỏi database
    user.avatar = null;
    await user.save();

    // Loại bỏ password khỏi response
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Thay đổi mật khẩu
   * @param {String} userId - User ID
   * @param {String} currentPassword - Mật khẩu hiện tại
   * @param {String} newPassword - Mật khẩu mới
   * @returns {Boolean} Success
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }

    // Kiểm tra mật khẩu mới khác mật khẩu cũ
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword; // Sẽ được hash tự động trong pre-save hook
    await user.save();

    return true;
  }

  /**
   * Thêm hành khách thường đi
   * @param {String} userId - User ID
   * @param {Object} passengerData - Thông tin hành khách
   * @returns {Object} Updated user
   */
  static async addSavedPassenger(userId, passengerData) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    // Giới hạn tối đa 5 hành khách
    if (user.savedPassengers.length >= 5) {
      throw new Error('Bạn chỉ có thể lưu tối đa 5 hành khách');
    }

    // Kiểm tra hành khách đã tồn tại chưa
    const existingPassenger = user.savedPassengers.find(
      (p) => p.idCard === passengerData.idCard
    );

    if (existingPassenger) {
      throw new Error('Hành khách này đã được lưu');
    }

    // Thêm hành khách mới
    user.savedPassengers.push(passengerData);
    await user.save();

    // Loại bỏ password khỏi response
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Xóa hành khách thường đi
   * @param {String} userId - User ID
   * @param {String} passengerId - ID của hành khách trong mảng
   * @returns {Object} Updated user
   */
  static async removeSavedPassenger(userId, passengerId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    // Tìm và xóa hành khách
    const passengerIndex = user.savedPassengers.findIndex(
      (p) => p._id.toString() === passengerId
    );

    if (passengerIndex === -1) {
      throw new Error('Không tìm thấy hành khách');
    }

    user.savedPassengers.splice(passengerIndex, 1);
    await user.save();

    // Loại bỏ password khỏi response
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return updatedUser;
  }

  /**
   * Lấy lịch sử điểm loyalty
   * @param {String} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Object} Points history
   */
  static async getPointsHistory(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    // Tính toán pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const pointsHistory = user.pointsHistory
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(startIndex, endIndex);

    return {
      totalPoints: user.totalPoints,
      loyaltyTier: user.loyaltyTier,
      history: pointsHistory,
      pagination: {
        page,
        limit,
        total: user.pointsHistory.length,
        totalPages: Math.ceil(user.pointsHistory.length / limit),
      },
    };
  }
}

module.exports = UserService;
