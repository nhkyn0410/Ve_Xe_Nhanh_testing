const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const { sendEmail } = require('../config/email');
const logger = require('../utils/logger');

/**
 * OTP Service
 * Handles OTP generation, storage, and verification for guest bookings
 */
class OTPService {
  /**
   * Generate OTP code (6 digits)
   */
  static generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store OTP in Redis with expiry
   * @param {string} identifier - Email or phone number
   * @param {string} otp - OTP code
   * @param {number} expiryMinutes - Expiry time in minutes (default 5)
   */
  static async storeOTP(identifier, otp, expiryMinutes = 5) {
    const redis = getRedisClient();
    const key = `otp:${identifier}`;
    const expirySeconds = expiryMinutes * 60;

    // Store OTP with metadata
    const otpData = {
      otp,
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };

    await redis.setEx(key, expirySeconds, JSON.stringify(otpData));

    return {
      expiresIn: expirySeconds,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
    };
  }

  /**
   * Verify OTP
   * @param {string} identifier - Email or phone number
   * @param {string} otp - OTP code to verify
   * @returns {Object} Verification result
   */
  static async verifyOTP(identifier, otp) {
    const redis = getRedisClient();
    const key = `otp:${identifier}`;

    const otpDataStr = await redis.get(key);

    if (!otpDataStr) {
      return {
        success: false,
        message: 'Mã OTP đã hết hạn hoặc không tồn tại',
        code: 'OTP_EXPIRED',
      };
    }

    const otpData = JSON.parse(otpDataStr);

    // Check attempts
    if (otpData.attempts >= otpData.maxAttempts) {
      await redis.del(key);
      return {
        success: false,
        message: 'Bạn đã nhập sai quá số lần cho phép',
        code: 'MAX_ATTEMPTS_EXCEEDED',
      };
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      // Increment attempts
      otpData.attempts += 1;
      const ttl = await redis.ttl(key);
      await redis.setEx(key, ttl, JSON.stringify(otpData));

      return {
        success: false,
        message: `Mã OTP không đúng. Còn ${otpData.maxAttempts - otpData.attempts} lần thử`,
        code: 'INVALID_OTP',
        attemptsLeft: otpData.maxAttempts - otpData.attempts,
      };
    }

    // OTP is valid, delete it
    await redis.del(key);

    return {
      success: true,
      message: 'Xác thực OTP thành công',
      code: 'OTP_VERIFIED',
    };
  }

  /**
   * Send OTP via email
   * @param {string} email - Email address
   * @param {string} otp - OTP code
   * @param {string} purpose - Purpose of OTP (e.g., 'guest_booking')
   */
  static async sendOTPEmail(email, otp, purpose = 'guest_booking') {
    logger.info(`Đang gửi OTP email đến ${email} cho mục đích ${purpose}`);

    await sendEmail({
      to: email,
      subject: 'Mã xác thực Vé xe nhanh',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Mã xác thực của bạn</h2>
          <p>Mã OTP của bạn là:</p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <strong style="color: #0ea5e9; font-size: 32px; letter-spacing: 5px;">${otp}</strong>
          </div>
          <p style="color: #dc2626;">Mã này có hiệu lực trong 5 phút.</p>
          <p style="color: #666; font-size: 14px;">
            Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
          </p>
        </div>
      `,
      text: `Mã OTP Vé xe nhanh của bạn là ${otp}. Mã có hiệu lực trong 5 phút.`,
    });

    return {
      success: true,
      message: 'OTP đã được gửi đến email của bạn',
    };
  }

  /**
   * Send OTP via SMS
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @param {string} purpose - Purpose of OTP
   */
  static async sendOTPSMS(phone, otp, purpose = 'guest_booking') {
    // In production, integrate with SMS service (Twilio, VNPT SMS, etc.)
    // For now, just log the OTP
    logger.info(`Đang gửi OTP đến ${phone}:`);
    logger.info(`OTP Code: ${otp}`);
    logger.info(`Purpose: ${purpose}`);
    logger.info(`---`);

    // TODO: Implement actual SMS sending
    // Example with VNPT SMS:
    /*
    const axios = require('axios');
    const response = await axios.post(
      process.env.VNPT_SMS_URL,
      {
        username: process.env.VNPT_SMS_USERNAME,
        password: process.env.VNPT_SMS_PASSWORD,
        brandname: process.env.VNPT_SMS_BRANDNAME,
        to: phone,
        message: `Ma xac thuc Vé xe nhanh cua ban la: ${otp}. Ma co hieu luc trong 5 phut.`,
      }
    );
    */

    return {
      success: true,
      message: 'OTP đã được gửi đến số điện thoại của bạn',
    };
  }

  /**
   * Request OTP for guest booking
   * @param {string} identifier - Email or phone
   * @param {string} type - 'email' or 'phone'
   */
  static async requestOTP(identifier, type = 'email') {
    // Validate identifier
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        throw new Error('Email không hợp lệ');
      }
    } else if (type === 'phone') {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(identifier)) {
        throw new Error('Số điện thoại không hợp lệ');
      }
    }

    // Check rate limiting (prevent spam)
    const rateLimitKey = `otp:ratelimit:${identifier}`;
    const redis = getRedisClient();
    const requestCount = await redis.get(rateLimitKey);

    if (requestCount && parseInt(requestCount, 10) >= 3) {
      throw new Error('Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 15 phút');
    }

    // Generate and store OTP
    const otp = this.generateOTP();
    const otpInfo = await this.storeOTP(identifier, otp);

    // Update rate limit counter
    if (!requestCount) {
      await redis.setEx(rateLimitKey, 15 * 60, '1'); // 15 minutes
    } else {
      await redis.incr(rateLimitKey);
    }

    // Send OTP
    let sendResult;
    if (type === 'email') {
      sendResult = await this.sendOTPEmail(identifier, otp, 'guest_booking');
    } else {
      sendResult = await this.sendOTPSMS(identifier, otp, 'guest_booking');
    }

    return {
      success: true,
      message: sendResult.message,
      expiresIn: otpInfo.expiresIn,
      expiresAt: otpInfo.expiresAt,
      // For development/testing only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp }),
    };
  }

  /**
   * Check if OTP exists and is valid
   * @param {string} identifier - Email or phone
   */
  static async checkOTPExists(identifier) {
    const redis = getRedisClient();
    const key = `otp:${identifier}`;
    const exists = await redis.exists(key);

    if (exists) {
      const ttl = await redis.ttl(key);
      return {
        exists: true,
        expiresIn: ttl,
      };
    }

    return {
      exists: false,
    };
  }
}

module.exports = OTPService;
