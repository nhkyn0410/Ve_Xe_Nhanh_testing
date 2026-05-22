const User = require('../models/User');
const Booking = require('../models/Booking');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

/**
 * Loyalty Service
 * Handles loyalty program business logic
 */
class LoyaltyService {
  /**
   * Calculate points to earn from a booking
   * @param {Object} booking - Booking object
   * @param {Object} user - User object
   * @returns {number} Points to earn
   */
  calculateBookingPoints(booking, user) {
    // Base points: 1 point per 10,000 VND
    const basePoints = Math.floor(booking.total / 10000);

    // Apply tier multiplier
    const tierBenefits = user.getTierBenefits();
    const multiplier = tierBenefits.pointsMultiplier || 1;

    const totalPoints = Math.floor(basePoints * multiplier);

    logger.info(
      `Calculated ${totalPoints} points (base: ${basePoints}, multiplier: ${multiplier})`
    );

    return totalPoints;
  }

  /**
   * Award points for a completed booking
   * @param {string} userId - User ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Points awarded
   */
  async awardBookingPoints(userId, bookingId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User không tồn tại');
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking không tồn tại');
      }

      // Check if points already awarded
      const alreadyAwarded = user.pointsHistory.some(
        (entry) =>
          entry.tripId &&
          entry.tripId.toString() === booking.tripId.toString() &&
          entry.type === 'earn' &&
          entry.reason.includes('Hoàn thành chuyến đi')
      );

      if (alreadyAwarded) {
        logger.info('Điểm đã được thưởng cho chuyến đi này');
        return {
          success: true,
          alreadyAwarded: true,
          message: 'Điểm đã được tích cho booking này',
        };
      }

      // Calculate points
      const pointsToAward = this.calculateBookingPoints(booking, user);

      // Award points
      user.addPoints(`Hoàn thành chuyến đi - Booking ${booking.bookingCode}`, pointsToAward, booking.tripId);
      await user.save();

      logger.info(`Awarded ${pointsToAward} points to user ${userId}`);

      // Send notification
      if (user.email) {
        await notificationService.sendEmail(
          user.email,
          'Bạn đã nhận được điểm thưởng!',
          this.generatePointsAwardedEmail(user.fullName, pointsToAward, user.totalPoints)
        );
      }

      return {
        success: true,
        pointsAwarded: pointsToAward,
        totalPoints: user.totalPoints,
        tier: user.loyaltyTier,
        message: `Bạn đã nhận được ${pointsToAward} điểm!`,
      };
    } catch (error) {
      logger.error('Lỗi cộng điểm:', error);
      throw error;
    }
  }

  /**
   * Redeem points for discount
   * @param {string} userId - User ID
   * @param {number} points - Points to redeem
   * @returns {Promise<Object>} Redemption result
   */
  async redeemPoints(userId, points) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User không tồn tại');
      }

      if (points < 100) {
        throw new Error('Số điểm đổi tối thiểu là 100');
      }

      if (user.totalPoints < points) {
        throw new Error(`Không đủ điểm. Bạn có ${user.totalPoints} điểm.`);
      }

      // Redeem points (1 point = 1,000 VND discount)
      const discountAmount = points * 1000;

      user.redeemPoints(points, `Đổi ${points} điểm lấy giảm giá ${discountAmount.toLocaleString('vi-VN')} VND`);
      await user.save();

      logger.info(`Redeemed ${points} points for user ${userId}`);

      return {
        success: true,
        pointsRedeemed: points,
        discountAmount,
        remainingPoints: user.totalPoints,
        message: `Đã đổi ${points} điểm lấy giảm giá ${discountAmount.toLocaleString('vi-VN')} VND`,
      };
    } catch (error) {
      logger.error('Lỗi đổi điểm:', error);
      throw error;
    }
  }

  /**
   * Get user loyalty history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Loyalty history
   */
  async getLoyaltyHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20, type = null } = options;

      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error('User không tồn tại');
      }

      let history = user.pointsHistory || [];

      // Filter by type if specified
      if (type) {
        history = history.filter((entry) => entry.type === type);
      }

      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Pagination
      const total = history.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedHistory = history.slice(startIndex, endIndex);

      // Get tier benefits
      const userObj = await User.findById(userId);
      const tierBenefits = userObj.getTierBenefits();

      // Calculate points expiring soon (within 30 days)
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const pointsExpiringSoon = history
        .filter(
          (entry) =>
            entry.type === 'earn' &&
            !entry.isExpired &&
            entry.expiresAt &&
            entry.expiresAt < thirtyDaysFromNow
        )
        .reduce((sum, entry) => sum + entry.points, 0);

      return {
        success: true,
        user: {
          fullName: user.fullName,
          email: user.email,
          loyaltyTier: user.loyaltyTier,
          totalPoints: user.totalPoints,
        },
        tierBenefits,
        pointsExpiringSoon,
        history: paginatedHistory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasMore: endIndex < total,
        },
      };
    } catch (error) {
      logger.error('Lỗi lấy lịch sử khách hàng thân thiết:', error);
      throw error;
    }
  }

  /**
   * Get loyalty program overview
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Loyalty overview
   */
  async getLoyaltyOverview(userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error('User không tồn tại');
      }

      const userObj = await User.findById(userId);
      const tierBenefits = userObj.getTierBenefits();

      // Calculate statistics
      const history = user.pointsHistory || [];
      const totalEarned = history
        .filter((entry) => entry.type === 'earn')
        .reduce((sum, entry) => sum + entry.points, 0);

      const totalRedeemed = history
        .filter((entry) => entry.type === 'redeem')
        .reduce((sum, entry) => sum + Math.abs(entry.points), 0);

      const totalExpired = history
        .filter((entry) => entry.type === 'expire')
        .reduce((sum, entry) => sum + Math.abs(entry.points), 0);

      // Points expiring soon
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const pointsExpiringSoon = history
        .filter(
          (entry) =>
            entry.type === 'earn' &&
            !entry.isExpired &&
            entry.expiresAt &&
            entry.expiresAt < thirtyDaysFromNow
        )
        .reduce((sum, entry) => sum + entry.points, 0);

      // Next tier info
      const nextTierInfo = this.getNextTierInfo(user.loyaltyTier, user.totalPoints);

      return {
        success: true,
        currentTier: {
          name: user.loyaltyTier,
          benefits: tierBenefits,
        },
        nextTier: nextTierInfo,
        points: {
          total: user.totalPoints,
          totalEarned,
          totalRedeemed,
          totalExpired,
          expiringSoon: pointsExpiringSoon,
        },
        redemptionValue: user.totalPoints * 1000, // 1 point = 1,000 VND
      };
    } catch (error) {
      logger.error('Lỗi nhận tổng quan về mức độ trung thành:', error);
      throw error;
    }
  }

  /**
   * Get next tier information
   * @param {string} currentTier - Current tier
   * @param {number} currentPoints - Current points
   * @returns {Object} Next tier info
   */
  getNextTierInfo(currentTier, currentPoints) {
    const tiers = [
      { name: 'bronze', minPoints: 0 },
      { name: 'silver', minPoints: 2000 },
      { name: 'gold', minPoints: 5000 },
      { name: 'platinum', minPoints: 10000 },
    ];

    const currentTierIndex = tiers.findIndex((t) => t.name === currentTier);

    if (currentTierIndex === tiers.length - 1) {
      return {
        name: 'platinum',
        isMaxTier: true,
        message: 'Bạn đã đạt hạng cao nhất!',
      };
    }

    const nextTier = tiers[currentTierIndex + 1];
    const pointsNeeded = nextTier.minPoints - currentPoints;

    return {
      name: nextTier.name,
      minPoints: nextTier.minPoints,
      pointsNeeded,
      progress: (currentPoints / nextTier.minPoints) * 100,
      message: `Cần thêm ${pointsNeeded} điểm để lên hạng ${nextTier.name}`,
    };
  }

  /**
   * Cleanup expired points for all users
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupExpiredPoints() {
    try {
      logger.info('Bắt đầu dọn dẹp điểm hết hạn...');

      const users = await User.find({
        'pointsHistory.expiresAt': { $lt: new Date() },
        'pointsHistory.isExpired': false,
      });

      const results = await Promise.all(users.map(async (user) => {
        const expiredPoints = await user.removeExpiredPoints();
        if (expiredPoints > 0) {
          await user.save();
          if (user.email) {
            await notificationService.sendEmail(
              user.email,
              'Thông báo: Điểm thưởng đã hết hạn',
              this.generatePointsExpiredEmail(user.fullName, expiredPoints, user.totalPoints)
            );
          }
          return expiredPoints;
        }
        return 0;
      }));

      let totalUsersAffected = 0;
      let totalPointsRemoved = 0;
      results.forEach((pts) => {
        if (pts > 0) totalUsersAffected += 1;
        totalPointsRemoved += pts;
      });

      logger.info(
        `Cleanup completed: ${totalUsersAffected} users, ${totalPointsRemoved} points removed`
      );

      return {
        success: true,
        usersAffected: totalUsersAffected,
        pointsRemoved: totalPointsRemoved,
      };
    } catch (error) {
      logger.error('Lỗi dọn dẹp điểm đã hết hạn:', error);
      throw error;
    }
  }

  /**
   * Generate points awarded email HTML
   * @param {string} userName - User name
   * @param {number} points - Points awarded
   * @param {number} totalPoints - Total points
   * @returns {string} Email HTML
   */
  generatePointsAwardedEmail(userName, points, totalPoints) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .content {
            padding: 30px 20px;
          }
          .points-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
          }
          .points-value {
            font-size: 48px;
            color: #f59e0b;
            font-weight: bold;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Vé xe nhanh</h1>
            <p>Bạn đã nhận được điểm thưởng!</p>
          </div>

          <div class="content">
            <h2>Chúc mừng ${userName}!</h2>

            <div class="points-box">
              <p style="margin: 0; color: #f59e0b; font-weight: bold;">Bạn đã nhận được</p>
              <div class="points-value">+${points}</div>
              <p style="margin: 0;">điểm thưởng</p>
            </div>

            <p style="text-align: center; font-size: 18px;">
              Tổng điểm của bạn: <strong style="color: #f59e0b;">${totalPoints} điểm</strong>
            </p>

            <p style="text-align: center;">
              Giá trị quy đổi: <strong>${(totalPoints * 1000).toLocaleString('vi-VN')} VND</strong>
            </p>

            <p>
              Sử dụng điểm để:
            </p>
            <ul>
              <li>💰 Đổi lấy giảm giá cho lần đặt vé tiếp theo</li>
              <li>🎁 Nhận quà tặng đặc biệt</li>
              <li>⭐ Nâng cấp hạng thành viên</li>
            </ul>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Lưu ý: Điểm sẽ hết hạn sau 1 năm kể từ ngày nhận.
            </p>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Trân trọng,<br>
              Đội ngũ Vé xe nhanh
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate points expired email HTML
   * @param {string} userName - User name
   * @param {number} expiredPoints - Expired points
   * @param {number} remainingPoints - Remaining points
   * @returns {string} Email HTML
   */
  generatePointsExpiredEmail(userName, expiredPoints, remainingPoints) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .content {
            padding: 30px 20px;
          }
          .warning-box {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Vé xe nhanh</h1>
            <p>Thông báo hết hạn điểm thưởng</p>
          </div>

          <div class="content">
            <h2>Xin chào ${userName}!</h2>

            <div class="warning-box">
              <p style="margin: 0;">
                <strong>${expiredPoints} điểm</strong> của bạn đã hết hạn.
              </p>
            </div>

            <p>
              Điểm còn lại: <strong style="color: #f59e0b;">${remainingPoints} điểm</strong>
            </p>

            <p>
              Đừng để điểm của bạn hết hạn! Sử dụng điểm để đổi lấy ưu đãi hấp dẫn ngay hôm nay.
            </p>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Trân trọng,<br>
              Đội ngũ Vé xe nhanh
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new LoyaltyService();
