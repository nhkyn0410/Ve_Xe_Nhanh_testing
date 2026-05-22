const axios = require('axios');
const logger = require('../utils/logger');

/**
 * SMS Service
 * Handles SMS notifications via VNPT SMS or Viettel SMS
 */
class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'vnpt'; // 'vnpt' or 'viettel'
    this.apiKey = process.env.SMS_API_KEY;
    this.apiSecret = process.env.SMS_API_SECRET;
    this.brandName = process.env.SMS_BRAND_NAME || 'Vé xe nhanh';
    this.enabled = process.env.SMS_ENABLED === 'true';
  }

  /**
   * Send SMS via VNPT SMS
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} SMS send result
   */
  async sendVNPTSMS(phone, message) {
    try {
      const url = process.env.VNPT_SMS_URL || 'https://cloudsms.vietguys.biz:4438/api/';

      const response = await axios.post(
        `${url}SMSBrandname/SendOTP`,
        {
          Phone: phone,
          Content: message,
          ApiKey: this.apiKey,
          SecretKey: this.apiSecret,
          Brandname: this.brandName,
          SmsType: 2, // 2 = Brandname SMS
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.CodeResult === '100') {
        logger.success(`VNPT SMS đã gửi thành công đến: ${phone}`);
        return {
          success: true,
          messageId: response.data.SMSID,
          provider: 'vnpt',
        };
      } else {
        logger.error(`VNPT SMS thất bại: ${JSON.stringify(response.data)}`);
        return {
          success: false,
          error: response.data?.Message || 'SMS sending failed',
          provider: 'vnpt',
        };
      }
      } catch (error) {
      logger.error(`VNPT SMS lỗi: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: 'vnpt',
      };
    }
  }

  /**
   * Send SMS via Viettel SMS
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} SMS send result
   */
  async sendViettelSMS(phone, message) {
    try {
      const url = process.env.VIETTEL_SMS_URL || 'https://api.viettel.vn/sms/';

      const response = await axios.post(
        `${url}send`,
        {
          phone: phone,
          message: message,
          apiKey: this.apiKey,
          apiSecret: this.apiSecret,
          brandName: this.brandName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.status === 'success') {
        logger.success(`Viettel SMS đã gửi thành công đến: ${phone}`);
        return {
          success: true,
          messageId: response.data.messageId,
          provider: 'viettel',
        };
      } else {
        logger.error(`Viettel SMS thất bại: ${JSON.stringify(response.data)}`);
        return {
          success: false,
          error: response.data?.message || 'SMS sending failed',
          provider: 'viettel',
        };
      }
    } catch (error) {
      logger.error(`Viettel SMS lỗi: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: 'viettel',
      };
    }
  }

  /**
   * Send SMS (auto-select provider)
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} SMS send result
   */
  async sendSMS(phone, message) {
    if (!this.enabled) {
      logger.warn('SMS dịch vụ bị vô hiệu hóa');
      return {
        success: false,
        error: 'SMS service is disabled',
      };
    }

    if (!phone || !message) {
      return {
        success: false,
        error: 'Phone number and message are required',
      };
    }

    // Format phone number (remove spaces, dashes, etc.)
    const formattedPhone = phone.replace(/[\s()\-]/g, '');

    // Validate Vietnamese phone number
    if (!/^(0|\+84)[0-9]{9,10}$/.test(formattedPhone)) {
      return {
        success: false,
        error: 'Invalid Vietnamese phone number',
      };
    }

    // Send via selected provider
    if (this.provider === 'vnpt') {
      return this.sendVNPTSMS(formattedPhone, message);
    }

    if (this.provider === 'viettel') {
      return this.sendViettelSMS(formattedPhone, message);
    }

    return {
      success: false,
      error: 'Invalid SMS provider',
    };
  }

  /**
   * Send ticket confirmation SMS
   * @param {Object} ticketData - Ticket information
   * @returns {Promise<Object>} SMS send result
   */
  async sendTicketSMS(ticketData) {
    const { phone, bookingCode, ticketCode, routeName, departureTime, seatNumbers, ticketUrl } = ticketData;

    const message = `Ve xe nhanh: Ve cua ban da san sang!
Ma ve: ${ticketCode}
Ma dat cho: ${bookingCode}
Tuyen: ${routeName}
Gio di: ${departureTime}
Ghe: ${seatNumbers}
Tai ve: ${ticketUrl}
Lien he: 1900-0000`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send OTP SMS
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} SMS send result
   */
  async sendOTP(phone, otp) {
    const message = `Ve xe nhanh: Ma xac thuc OTP cua ban la: ${otp}. Ma co hieu luc trong 5 phut. KHONG chia se ma nay voi bat ky ai.`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send trip reminder SMS
   * @param {Object} reminderData - Reminder information
   * @returns {Promise<Object>} SMS send result
   */
  async sendTripReminder(reminderData) {
    const { phone, routeName, departureTime, pickupPoint, seatNumbers } = reminderData;

    const message = `Ve xe nhanh: Nhac nho chuyen di!
Tuyen: ${routeName}
Gio di: ${departureTime}
Diem don: ${pickupPoint}
Ghe: ${seatNumbers}
Vui long co mat truoc 15 phut!`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send booking cancellation SMS
   * @param {Object} cancellationData - Cancellation information
   * @returns {Promise<Object>} SMS send result
   */
  async sendCancellationSMS(cancellationData) {
    const { phone, bookingCode, routeName, refundAmount } = cancellationData;

    const message = `Ve xe nhanh: Ve ${bookingCode} (${routeName}) da duoc huy.${refundAmount > 0 ? ` Tien hoan: ${refundAmount.toLocaleString('vi-VN')} VND.` : ''
      } Lien he: 1900-0000`;

    return this.sendSMS(phone, message);
  }

  /**
   * Mock SMS sending (for development/testing)
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Mock result
   */
  async mockSend(phone, message) {
    logger.info('📱 [MOCK SMS]');
    logger.info(`Đến: ${phone}`);
    logger.info(`Message: ${message}`);
    logger.info('---');

    return {
      success: true,
      messageId: `MOCK-${Date.now()}`,
      provider: 'mock',
    };
  }
}

// Export singleton instance
module.exports = new SMSService();
