const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Guest Session Service
 * Manages temporary sessions for guest bookings after OTP verification
 */
class GuestSessionService {
  /**
   * Generate guest session token
   */
  static generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create guest session after OTP verification
   * @param {Object} guestData - Guest information
   * @param {string} guestData.email - Guest email
   * @param {string} guestData.phone - Guest phone
   * @param {string} guestData.name - Guest name (optional)
   * @param {number} expiryHours - Session expiry in hours (default 24)
   */
  static async createSession(guestData, expiryHours = 24) {
    const redis = getRedisClient();
    const sessionToken = this.generateSessionToken();
    const expirySeconds = expiryHours * 60 * 60;

    // Store session data
    const sessionData = {
      email: guestData.email,
      phone: guestData.phone,
      name: guestData.name || '',
      isGuest: true,
      verified: true,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const sessionKey = `guest:session:${sessionToken}`;
    await redis.setEx(sessionKey, expirySeconds, JSON.stringify(sessionData));

    // Also create reverse lookup by email/phone for quick access
    if (guestData.email) {
      const emailKey = `guest:email:${guestData.email}`;
      await redis.setEx(emailKey, expirySeconds, sessionToken);
    }

    if (guestData.phone) {
      const phoneKey = `guest:phone:${guestData.phone}`;
      await redis.setEx(phoneKey, expirySeconds, sessionToken);
    }

    return {
      sessionToken,
      expiresIn: expirySeconds,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
      guestData: sessionData,
    };
  }

  /**
   * Verify guest session token
   * @param {string} sessionToken - Session token
   * @returns {Object} Session data or null
   */
  static async verifySession(sessionToken) {
    if (!sessionToken) {
      return null;
    }

    const redis = getRedisClient();
    const sessionKey = `guest:session:${sessionToken}`;
    const sessionDataStr = await redis.get(sessionKey);

    if (!sessionDataStr) {
      return null;
    }

    try {
      const sessionData = JSON.parse(sessionDataStr);
      return sessionData;
    } catch (error) {
      logger.error('Lỗi xác minh guest phiên dữ liệu:', error);
      return null;
    }
  }

  /**
   * Get session by email or phone
   * @param {string} identifier - Email or phone
   * @returns {Object} Session data or null
   */
  static async getSessionByIdentifier(identifier) {
    const redis = getRedisClient();

    // Try email first
    const emailKey = `guest:email:${identifier}`;
    let sessionToken = await redis.get(emailKey);

    // If not found, try phone
    if (!sessionToken) {
      const phoneKey = `guest:phone:${identifier}`;
      sessionToken = await redis.get(phoneKey);
    }

    if (!sessionToken) {
      return null;
    }

    return this.verifySession(sessionToken);
  }

  /**
   * Extend guest session
   * @param {string} sessionToken - Session token
   * @param {number} expiryHours - New expiry in hours
   */
  static async extendSession(sessionToken, expiryHours = 24) {
    const redis = getRedisClient();
    const sessionKey = `guest:session:${sessionToken}`;
    const expirySeconds = expiryHours * 60 * 60;

    const exists = await redis.exists(sessionKey);
    if (!exists) {
      throw new Error('Session không tồn tại hoặc đã hết hạn');
    }

    await redis.expire(sessionKey, expirySeconds);

    // Also extend reverse lookups
    const sessionDataStr = await redis.get(sessionKey);
    if (sessionDataStr) {
      const sessionData = JSON.parse(sessionDataStr);

      if (sessionData.email) {
        const emailKey = `guest:email:${sessionData.email}`;
        await redis.expire(emailKey, expirySeconds);
      }

      if (sessionData.phone) {
        const phoneKey = `guest:phone:${sessionData.phone}`;
        await redis.expire(phoneKey, expirySeconds);
      }
    }

    return {
      success: true,
      expiresIn: expirySeconds,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
    };
  }

  /**
   * Delete guest session
   * @param {string} sessionToken - Session token
   */
  static async deleteSession(sessionToken) {
    const redis = getRedisClient();
    const sessionKey = `guest:session:${sessionToken}`;

    // Get session data to delete reverse lookups
    const sessionDataStr = await redis.get(sessionKey);
    if (sessionDataStr) {
      const sessionData = JSON.parse(sessionDataStr);

      if (sessionData.email) {
        const emailKey = `guest:email:${sessionData.email}`;
        await redis.del(emailKey);
      }

      if (sessionData.phone) {
        const phoneKey = `guest:phone:${sessionData.phone}`;
        await redis.del(phoneKey);
      }
    }

    await redis.del(sessionKey);

    return {
      success: true,
      message: 'Session đã được xóa',
    };
  }

  /**
   * Update guest session data
   * @param {string} sessionToken - Session token
   * @param {Object} updates - Data to update
   */
  static async updateSession(sessionToken, updates) {
    const redis = getRedisClient();
    const sessionKey = `guest:session:${sessionToken}`;

    const sessionDataStr = await redis.get(sessionKey);
    if (!sessionDataStr) {
      throw new Error('Session không tồn tại hoặc đã hết hạn');
    }

    const sessionData = JSON.parse(sessionDataStr);
    const updatedData = { ...sessionData, ...updates };

    const ttl = await redis.ttl(sessionKey);
    await redis.setEx(sessionKey, ttl, JSON.stringify(updatedData));

    return {
      success: true,
      sessionData: updatedData,
    };
  }

  /**
   * Clean up expired sessions (can be run as cron job)
   */
  static async cleanupExpiredSessions() {
    // Redis automatically handles expiry, but we can manually check and clean if needed
    const redis = getRedisClient();
    const pattern = 'guest:session:*';

    let cursor = '0';
    let deletedCount = 0;

    do {
      const scanResult = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      const { cursor: newCursor, keys } = scanResult;
      cursor = newCursor;

      if (keys && keys.length) {
        const ttls = await Promise.all(keys.map((k) => redis.ttl(k)));
        const toDelete = [];
        ttls.forEach((ttl, idx) => {
          if (ttl <= 0) toDelete.push(keys[idx]);
        });

        if (toDelete.length) {
          await Promise.all(toDelete.map((k) => redis.del(k)));
          deletedCount += toDelete.length;
        }
      }
    } while (cursor !== '0');

    return {
      success: true,
      deletedCount,
    };
  }

  /**
   * Get all active guest sessions count
   */
  static async getActiveSessionsCount() {
    const redis = getRedisClient();
    const pattern = 'guest:session:*';

    let cursor = '0';
    let count = 0;

    do {
      const scanResult = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      const { cursor: newCursor, keys } = scanResult;
      cursor = newCursor;
      count += (keys && keys.length) || 0;
    } while (cursor !== '0');

    return count;
  }
}

module.exports = GuestSessionService;
