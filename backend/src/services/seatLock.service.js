const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Seat Lock Service
 * Manages temporary seat locks using Redis with TTL
 */
class SeatLockService {
  /**
   * Lock duration in seconds (15 minutes)
   */
  static LOCK_DURATION = 15 * 60; // 900 seconds

  /**
   * Generate Redis key for seat lock
   * @param {string} tripId - Trip ID
   * @param {string} seatNumber - Seat number
   * @returns {string} Redis key
   */
  static getLockKey(tripId, seatNumber) {
    return `seat:lock:${tripId}:${seatNumber}`;
  }

  /**
   * Generate Redis key for trip's all locked seats set
   * @param {string} tripId - Trip ID
   * @returns {string} Redis key
   */
  static getTripLocksKey(tripId) {
    return `seat:locks:${tripId}`;
  }

  /**
   * Lock seats for a trip
   * @param {string} tripId - Trip ID
   * @param {string[]} seatNumbers - Array of seat numbers to lock
   * @param {string} userId - User/session ID who is locking
   * @param {number} duration - Lock duration in seconds (default: 15 minutes)
   * @returns {Promise<Object>} Result with locked seats and failures
   */
  static async lockSeats(tripId, seatNumbers, userId, duration = this.LOCK_DURATION) {
    try {
      const redis = getRedisClient();
      const locked = [];
      const failed = [];
      const lockKeys = seatNumbers.map((s) => this.getLockKey(tripId, s));

      // Attempt to set all locks in parallel
      const setResults = await Promise.all(lockKeys.map((k) => redis.set(k, userId, { NX: true, EX: duration })));

      const tripLocksKey = this.getTripLocksKey(tripId);
      const sAddPromises = [];

      // Collect failed indices to fetch owners later
      const failedIndices = [];
      for (let i = 0; i < setResults.length; i += 1) {
        if (setResults[i] === 'OK') {
          locked.push(seatNumbers[i]);
          sAddPromises.push(redis.sAdd(tripLocksKey, seatNumbers[i]));
        } else {
          failedIndices.push(i);
        }
      }

      if (sAddPromises.length) {
        await Promise.all(sAddPromises);
        await redis.expire(tripLocksKey, duration);
      }

      if (failedIndices.length) {
        const failedKeys = failedIndices.map((idx) => lockKeys[idx]);
        const owners = await Promise.all(failedKeys.map((k) => redis.get(k)));
        for (let j = 0; j < failedIndices.length; j += 1) {
          const idx = failedIndices[j];
          const owner = owners[j];
          failed.push({
            seatNumber: seatNumbers[idx],
            reason: owner === userId ? 'already_locked_by_you' : 'locked_by_another_user',
            lockedBy: owner,
          });
        }
      }

      return {
        success: locked.length > 0,
        locked,
        failed,
        expiresIn: duration,
        expiresAt: new Date(Date.now() + duration * 1000),
      };
    } catch (error) {
      logger.error('Lỗi khóa ghế:', error);
      throw new Error('Không thể khóa ghế. Vui lòng thử lại.');
    }
  }

  /**
   * Release seat locks
   * @param {string} tripId - Trip ID
   * @param {string[]} seatNumbers - Array of seat numbers to unlock
   * @param {string} userId - User/session ID who is unlocking
   * @returns {Promise<Object>} Result with released seats
   */
  static async releaseSeats(tripId, seatNumbers, userId) {
    try {
      const redis = getRedisClient();
      const released = [];
      const failed = [];
      const lockKeys = seatNumbers.map((s) => this.getLockKey(tripId, s));
      const owners = await Promise.all(lockKeys.map((k) => redis.get(k)));

      const tripLocksKey = this.getTripLocksKey(tripId);
      const delPromises = [];
      const sRemPromises = [];

      for (let i = 0; i < seatNumbers.length; i += 1) {
        const seatNumber = seatNumbers[i];
        const owner = owners[i];
        if (!owner) {
          failed.push({ seatNumber, reason: 'not_locked' });
        } else if (owner !== userId) {
          failed.push({ seatNumber, reason: 'locked_by_another_user', lockedBy: owner });
        } else {
          delPromises.push(redis.del(lockKeys[i]));
          sRemPromises.push(redis.sRem(tripLocksKey, seatNumber));
          released.push(seatNumber);
        }
      }

      if (delPromises.length) await Promise.all(delPromises);
      if (sRemPromises.length) await Promise.all(sRemPromises);

      return {
        success: released.length > 0,
        released,
        failed,
      };
    } catch (error) {
      logger.error('Lỗi nhả ghế:', error);
      throw new Error('Không thể mở khóa ghế. Vui lòng thử lại.');
    }
  }

  /**
   * Check if seats are locked
   * @param {string} tripId - Trip ID
   * @param {string[]} seatNumbers - Array of seat numbers to check
   * @returns {Promise<Object>} Status of each seat
   */
  static async checkSeatsLocked(tripId, seatNumbers) {
    try {
      const redis = getRedisClient();
      const results = {};

      const lockKeys = seatNumbers.map((s) => this.getLockKey(tripId, s));
      const owners = await Promise.all(lockKeys.map((k) => redis.get(k)));
      const ttls = await Promise.all(lockKeys.map((k) => redis.ttl(k)));

      for (let i = 0; i < seatNumbers.length; i += 1) {
        const seatNumber = seatNumbers[i];
        const lockedBy = owners[i];
        const ttl = ttls[i];
        results[seatNumber] = {
          isLocked: !!lockedBy,
          lockedBy: lockedBy || null,
          ttl: ttl > 0 ? ttl : 0,
          expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000) : null,
        };
      }

      return results;
    } catch (error) {
      logger.error('Lỗi kiểm tra chỗ ngồi:', error);
      throw new Error('Không thể kiểm tra trạng thái ghế.');
    }
  }

  /**
   * Get all locked seats for a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<string[]>} Array of locked seat numbers
   */
  static async getLockedSeats(tripId) {
    try {
      const redis = getRedisClient();
      const tripLocksKey = this.getTripLocksKey(tripId);

      const lockedSeats = await redis.sMembers(tripLocksKey);
      return lockedSeats || [];
    } catch (error) {
      logger.error('Lỗi bị khóa ghế:', error);
      return [];
    }
  }

  /**
   * Extend seat lock duration
   * @param {string} tripId - Trip ID
   * @param {string[]} seatNumbers - Array of seat numbers
   * @param {string} userId - User/session ID
   * @param {number} duration - New duration in seconds
   * @returns {Promise<Object>} Result
   */
  static async extendLock(tripId, seatNumbers, userId, duration = this.LOCK_DURATION) {
    try {
      const redis = getRedisClient();
      const extended = [];
      const failed = [];

      const lockKeys = seatNumbers.map((s) => this.getLockKey(tripId, s));
      const owners = await Promise.all(lockKeys.map((k) => redis.get(k)));

      const expirePromises = [];
      for (let i = 0; i < seatNumbers.length; i += 1) {
        const seatNumber = seatNumbers[i];
        const owner = owners[i];
        if (!owner) {
          failed.push({ seatNumber, reason: 'not_locked' });
        } else if (owner !== userId) {
          failed.push({ seatNumber, reason: 'locked_by_another_user' });
        } else {
          expirePromises.push(redis.expire(lockKeys[i], duration));
          extended.push(seatNumber);
        }
      }

      if (expirePromises.length) await Promise.all(expirePromises);

      return {
        success: extended.length > 0,
        extended,
        failed,
        expiresIn: duration,
        expiresAt: new Date(Date.now() + duration * 1000),
      };
    } catch (error) {
      logger.error('Lỗi mở rộng khóa:', error);
      throw new Error('Không thể gia hạn khóa ghế.');
    }
  }

  /**
   * Release all expired locks (cleanup job)
   * This is handled automatically by Redis TTL, but we clean up the trip sets
   * @param {string} tripId - Trip ID
   * @returns {Promise<number>} Number of cleaned locks
   */
  static async cleanupExpiredLocks(tripId) {
    try {
      const redis = getRedisClient();
      const tripLocksKey = this.getTripLocksKey(tripId);
      const allSeats = await redis.sMembers(tripLocksKey);

      let cleaned = 0;
      if (allSeats && allSeats.length) {
        const lockKeys = allSeats.map((s) => this.getLockKey(tripId, s));
        const existsResults = await Promise.all(lockKeys.map((k) => redis.exists(k)));
        const toRemove = [];
        for (let i = 0; i < existsResults.length; i += 1) {
          if (!existsResults[i]) toRemove.push(allSeats[i]);
        }
        if (toRemove.length) {
          await Promise.all(toRemove.map((s) => redis.sRem(tripLocksKey, s)));
          cleaned = toRemove.length;
        }
      }

      return cleaned;
    } catch (error) {
      logger.error('Lỗi khi dọn dẹp ổ khóa:', error);
      return 0;
    }
  }

  /**
   * Check if user has any locks for a trip
   * @param {string} tripId - Trip ID
   * @param {string} userId - User/session ID
   * @returns {Promise<string[]>} Array of seat numbers locked by user
   */
  static async getUserLocks(tripId, userId) {
    try {
      const redis = getRedisClient();
      const tripLocksKey = this.getTripLocksKey(tripId);
      const allSeats = await redis.sMembers(tripLocksKey);
      const userSeats = [];
      if (allSeats && allSeats.length) {
        const lockKeys = allSeats.map((s) => this.getLockKey(tripId, s));
        const owners = await Promise.all(lockKeys.map((k) => redis.get(k)));
        for (let i = 0; i < owners.length; i += 1) {
          if (owners[i] === userId) userSeats.push(allSeats[i]);
        }
      }

      return userSeats;
    } catch (error) {
      logger.error('Lỗi nhận khóa người dùng:', error);
      return [];
    }
  }

  /**
   * Release all locks for a user on a trip
   * @param {string} tripId - Trip ID
   * @param {string} userId - User/session ID
   * @returns {Promise<Object>} Result
   */
  static async releaseAllUserLocks(tripId, userId) {
    try {
      const userSeats = await this.getUserLocks(tripId, userId);

      if (userSeats.length === 0) {
        return {
          success: true,
          released: [],
          message: 'No locks to release',
        };
      }

      return this.releaseSeats(tripId, userSeats, userId);
    } catch (error) {
      logger.error('Lỗi giải phóng tất cả các khóa người dùng:', error);
      throw new Error('Không thể mở khóa tất cả ghế.');
    }
  }
}

module.exports = SeatLockService;
