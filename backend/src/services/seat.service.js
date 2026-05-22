const { getRedisClient } = require('../config/redis');
const Trip = require('../models/Trip');
const logger = require('../utils/logger');

// Import WebSocket service (lazy loaded to avoid circular dependency)
let websocketService;
const getWebSocketService = () => {
  if (!websocketService) {
    // eslint-disable-next-line global-require
    websocketService = require('./websocket.service');
  }
  return websocketService;
};

/**
 * Seat Service
 * Quản lý việc lock/unlock ghế sử dụng Redis
 */
class SeatService {
  /**
   * Lock ghế cho user trong 15 phút
   * @param {String} tripId - Trip ID
   * @param {Array<String>} seats - Seat numbers to lock
   * @param {String} userId - User ID (or session ID for guest)
   * @returns {Promise<Boolean>}
   */
  static async lockSeats(tripId, seats, userId) {
    const redis = getRedisClient();

    try {
      // Check if all seats are available (batch requests)
      const checkKeys = seats.map((seat) => `trip:${tripId}:seat:${seat}`);
      const checkResults = await Promise.all(checkKeys.map((k) => redis.get(k)));
      for (let i = 0; i < seats.length; i += 1) {
        const locked = checkResults[i];
        if (locked && locked !== userId) {
          throw new Error(`Ghế ${seats[i]} đã được người khác chọn`);
        }
      }

      // Lock all seats in parallel (TTL: 15 minutes)
      await Promise.all(seats.map((seat) => redis.set(`trip:${tripId}:seat:${seat}`, userId, { EX: 900, NX: false })));

      // Also update Redis with trip seat availability count
      await this.updateTripSeatAvailability(tripId);

      // Broadcast WebSocket event
      try {
        const ws = getWebSocketService();
        await ws.broadcastSeatAction(tripId, seats, 'locked');
      } catch (error) {
        logger.error('Lỗi phát sóng khóa ghế:', error);
      }

      return true;
    } catch (error) {
      logger.error('Lỗi khóa ghế:', error);
      throw error;
    }
  }

  /**
   * Unlock ghế (khi thanh toán thất bại hoặc hết thời gian)
   * @param {String} tripId - Trip ID
   * @param {Array<String>} seats - Seat numbers to unlock
   * @param {String} userId - User ID to verify ownership
   * @returns {Promise<Boolean>}
   */
  static async unlockSeats(tripId, seats, userId) {
    const redis = getRedisClient();

    try {
      const keys = seats.map((seat) => `trip:${tripId}:seat:${seat}`);
      const lockedVals = await Promise.all(keys.map((k) => redis.get(k)));
      const delPromises = [];
      for (let i = 0; i < seats.length; i += 1) {
        if (lockedVals[i] === userId) {
          delPromises.push(redis.del(keys[i]));
        }
      }
      if (delPromises.length) await Promise.all(delPromises);

      // Update trip seat availability
      await this.updateTripSeatAvailability(tripId);

      // Broadcast WebSocket event
      try {
        const ws = getWebSocketService();
        await ws.broadcastSeatAction(tripId, seats, 'unlocked');
      } catch (error) {
        logger.error('Lỗi phát sóng mở khóa chỗ ngồi:', error);
      }

      return true;
    } catch (error) {
      logger.error('Lỗi mở khóa ghế:', error);
      throw error;
    }
  }

  /**
   * Xác nhận ghế đã được book (sau khi thanh toán thành công)
   * Xóa lock khỏi Redis vì đã được lưu vào MongoDB
   * @param {String} tripId - Trip ID
   * @param {Array<String>} seats - Seat numbers
  * @returns {Promise<Boolean>}
  */
  static async confirmSeats(tripId, seats) {
    const redis = getRedisClient();

    try {
      // Delete locks from Redis
      const deletePromises = seats.map((seat) => {
        const key = `trip:${tripId}:seat:${seat}`;
        return redis.del(key);
      });

      await Promise.all(deletePromises);

      // Update trip seat availability
      await this.updateTripSeatAvailability(tripId);

      // Broadcast WebSocket event
      try {
        const ws = getWebSocketService();
        await ws.broadcastSeatAction(tripId, seats, 'booked');
      } catch (error) {
        logger.error('Lỗi phát sóng xác nhận chỗ ngồi:', error);
      }

      return true;
    } catch (error) {
      logger.error('Lỗi xác nhận chỗ ngồi:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra ghế có available không
   * @param {String} tripId - Trip ID
   * @param {String} seat - Seat number
   * @returns {Promise<Boolean>}
   */
  static async isSeatAvailable(tripId, seat) {
    const redis = getRedisClient();

    try {
      // Check in Redis (temporary locks)
      const key = `trip:${tripId}:seat:${seat}`;
      const locked = await redis.get(key);

      if (locked) {
        return false; // Seat is locked
      }

      // Check in MongoDB (confirmed bookings)
      const trip = await Trip.findById(tripId);
      if (!trip) {
        throw new Error('Không tìm thấy chuyến xe');
      }

      return !trip.bookedSeats.includes(seat);
    } catch (error) {
      logger.error('Lỗi kiểm tra chỗ trống:', error);
      throw error;
    }
  }

  /**
   * Lấy trạng thái tất cả ghế của trip
   * @param {String} tripId - Trip ID
   * @returns {Promise<Object>} - { seatNumber: status }
   *   status: 'available', 'locked', 'booked'
   */
  static async getTripSeatStatus(tripId) {
    const redis = getRedisClient();

    try {
      const trip = await Trip.findById(tripId).populate('busId', 'seatLayout');

      if (!trip) {
        throw new Error('Không tìm thấy chuyến xe');
      }

      const seatStatus = {};

      // Get all seat numbers from bus layout
      const allSeats = this.extractSeatsFromLayout(trip.busId.seatLayout);

      // Prepare lists for parallel Redis checks
      const toCheck = [];
      const seatOrder = [];
      for (let i = 0; i < allSeats.length; i += 1) {
        const seat = allSeats[i];
        if (trip.bookedSeats.includes(seat)) {
          seatStatus[seat] = 'booked';
        } else {
          toCheck.push(`trip:${tripId}:seat:${seat}`);
          seatOrder.push(seat);
        }
      }

      if (toCheck.length) {
        const lockedResults = await Promise.all(toCheck.map((k) => redis.get(k)));
        for (let i = 0; i < lockedResults.length; i += 1) {
          const seat = seatOrder[i];
          seatStatus[seat] = lockedResults[i] ? 'locked' : 'available';
        }
      }

      return seatStatus;
    } catch (error) {
      logger.error('Lỗi nhận trạng thái chỗ ngồi trong chuyến đi:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách ghế available của trip
   * @param {String} tripId - Trip ID
   * @returns {Promise<Array<String>>}
   */
  static async getAvailableSeats(tripId) {
    const seatStatus = await this.getTripSeatStatus(tripId);

    return Object.keys(seatStatus).filter((seat) => seatStatus[seat] === 'available');
  }

  /**
   * Extract all seat numbers from bus layout
   * @param {Object} seatLayout - Bus seat layout
   * @returns {Array<String>}
   */
  static extractSeatsFromLayout(seatLayout) {
    if (!seatLayout || !seatLayout.layout) {
      return [];
    }

    const seats = [];

    // Layout is 2D array: [[row1], [row2], ...]
    seatLayout.layout.forEach((row) => {
      row.forEach((seat) => {
        if (seat && seat !== '' && seat !== null) {
          seats.push(seat);
        }
      });
    });

    return seats;
  }

  /**
   * Update trip seat availability count in Redis (for quick access)
   * @param {String} tripId - Trip ID
   * @returns {Promise<void>}
   */
  static async updateTripSeatAvailability(tripId) {
    const redis = getRedisClient();

    try {
      const availableSeats = await this.getAvailableSeats(tripId);
      const key = `trip:${tripId}:available_count`;

      // Cache for 5 minutes
      await redis.set(key, availableSeats.length.toString(), {
        EX: 300,
      });
    } catch (error) {
      logger.error('Lỗi cập nhật tình trạng chỗ trống của chuyến đi:', error);
    }
  }

  /**
   * Get trip available seat count (from cache or calculate)
   * @param {String} tripId - Trip ID
   * @returns {Promise<Number>}
   */
  static async getTripAvailableSeatCount(tripId) {
    const redis = getRedisClient();

    try {
      const key = `trip:${tripId}:available_count`;
      const cached = await redis.get(key);

      if (cached !== null) {
        return parseInt(cached, 10);
      }

      // Calculate if not cached
      const availableSeats = await this.getAvailableSeats(tripId);
      const count = availableSeats.length;

      // Cache it
      await redis.set(key, count.toString(), { EX: 300 });

      return count;
    } catch (error) {
      logger.error('Lỗi khi nhận số ghế còn trống của chuyến đi:', error);
      // Fallback to MongoDB
      const trip = await Trip.findById(tripId);
      return trip ? trip.availableSeats : 0;
    }
  }

  /**
   * Extend seat lock time (thêm 15 phút nữa)
   * @param {String} tripId - Trip ID
   * @param {Array<String>} seats - Seat numbers
   * @param {String} userId - User ID to verify ownership
   * @returns {Promise<Boolean>}
   */
  static async extendSeatLock(tripId, seats, userId) {
    const redis = getRedisClient();

    try {
      const keys = seats.map((seat) => `trip:${tripId}:seat:${seat}`);
      const lockedVals = await Promise.all(keys.map((k) => redis.get(k)));
      const expirePromises = [];
      for (let i = 0; i < seats.length; i += 1) {
        if (lockedVals[i] === userId) {
          expirePromises.push(redis.expire(keys[i], 900));
        }
      }
      if (expirePromises.length) await Promise.all(expirePromises);

      return true;
    } catch (error) {
      logger.error('Lỗi mở rộng khóa ghế:', error);
      throw error;
    }
  }

  /**
   * Get remaining lock time for seats
   * @param {String} tripId - Trip ID
   * @param {Array<String>} seats - Seat numbers
   * @returns {Promise<Object>} - { seatNumber: remainingSeconds }
   */
  static async getSeatLockRemainingTime(tripId, seats) {
    const redis = getRedisClient();

    try {
      const result = {};
      const keys = seats.map((seat) => `trip:${tripId}:seat:${seat}`);
      const ttls = await Promise.all(keys.map((k) => redis.ttl(k)));
      for (let i = 0; i < seats.length; i += 1) {
        result[seats[i]] = ttls[i] > 0 ? ttls[i] : 0;
      }

      return result;
    } catch (error) {
      logger.error('Lỗi khóa ghế trong thời gian còn lại:', error);
      return {};
    }
  }

  /**
   * Clean up expired locks (manual cleanup, Redis TTL should handle this)
   * @param {String} tripId - Trip ID
   * @returns {Promise<Number>}
   */
  static async cleanupExpiredLocks(tripId) {
    const redis = getRedisClient();
    let cleanedCount = 0;

    try {
      // Scan for all seat locks of this trip
      const pattern = `trip:${tripId}:seat:*`;
      const keys = await redis.keys(pattern);

      if (keys && keys.length) {
        const ttls = await Promise.all(keys.map((k) => redis.ttl(k)));
        const toDelete = keys.filter((k, idx) => ttls[idx] <= 0);
        if (toDelete.length) {
          await Promise.all(toDelete.map((k) => redis.del(k)));
          cleanedCount += toDelete.length;
        }
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Lỗi dọn dẹp ổ khóa hết hạn:', error);
      return cleanedCount;
    }
  }

  /**
   * Check if user owns the seat lock
   * @param {String} tripId - Trip ID
   * @param {String} seat - Seat number
   * @param {String} userId - User ID
   * @returns {Promise<Boolean>}
   */
  static async doesUserOwnSeatLock(tripId, seat, userId) {
    const redis = getRedisClient();

    try {
      const key = `trip:${tripId}:seat:${seat}`;
      const locked = await redis.get(key);

      return locked === userId;
    } catch (error) {
      logger.error('Lỗi kiểm tra quyền sở hữu khóa ghế:', error);
      return false;
    }
  }

  /**
   * Batch lock check - kiểm tra nhiều ghế cùng lúc
   * @param {String} tripId - Trip ID
   * @param {Array<String>} seats - Seat numbers to check
   * @returns {Promise<Object>} - { available: [], locked: [], booked: [] }
   */
  static async batchCheckSeats(tripId, seats) {
    const redis = getRedisClient();

    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        throw new Error('Không tìm thấy chuyến xe');
      }

      const result = {
        available: [],
        locked: [],
        booked: [],
      };

      const toCheck = [];
      const seatOrder = [];
      for (let i = 0; i < seats.length; i += 1) {
        const seat = seats[i];
        if (trip.bookedSeats.includes(seat)) {
          result.booked.push(seat);
        } else {
          toCheck.push(`trip:${tripId}:seat:${seat}`);
          seatOrder.push(seat);
        }
      }

      if (toCheck.length) {
        const lockedResults = await Promise.all(toCheck.map((k) => redis.get(k)));
        for (let i = 0; i < lockedResults.length; i += 1) {
          if (lockedResults[i]) result.locked.push(seatOrder[i]);
          else result.available.push(seatOrder[i]);
        }
      }

      return result;
    } catch (error) {
      logger.error('Lỗi kiểm tra hàng loạt chỗ ngồi:', error);
      throw error;
    }
  }
}

module.exports = SeatService;
