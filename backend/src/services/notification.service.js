const nodemailer = require('nodemailer');
const smsService = require('./sms.service');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

/**
 * Notification Service
 * Handles email and SMS notifications for various events
 */
class NotificationService {
  constructor() {
    // Email transporter setup with error handling
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (error) {
      logger.warn('Không thể tạo email vận chuyển:', error.message);
      this.emailTransporter = null;
    }

    // SMS service (singleton instance)
    this.smsService = smsService;

    this.fromEmail = process.env.FROM_EMAIL || 'noreply@vexenhanh.com';
    this.fromName = process.env.FROM_NAME || 'Vé xe nhanh';
    this.emailEnabled = process.env.EMAIL_ENABLED !== 'false'; // Default enabled
    this.smsEnabled = process.env.SMS_ENABLED === 'true';
  }

  /**
   * Send email notification
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(to, subject, html) {
    try {
      if (!this.emailEnabled) {
        logger.info('Email disabled, bỏ qua:', to);
        return { success: true, skipped: true, reason: 'Email disabled' };
      }

      if (!this.emailTransporter) {
        logger.info('Email bộ vận chuyển không khả dụng');
        return { success: false, error: 'Email transporter not configured' };
      }

      if (!to) {
        logger.info('No người nhận email provided');
        return { success: false, error: 'No recipient email' };
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      logger.info('Email đã gửi thành công đến:', to);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error(' Email gửi lỗi:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS notification
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(phone, message) {
    try {
      if (!this.smsEnabled) {
        logger.info('SMS disabled, bỏ qua:', phone);
        return { success: true, skipped: true, reason: 'SMS disabled' };
      }

      if (!phone) {
        logger.info('No phtrêne number provided');
        return { success: false, error: 'No phone number' };
      }

      const result = await this.smsService.sendSMS(phone, message);
      return result;
    } catch (error) {
      logger.error('SMS send lỗi:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Notify passengers about trip status change
   * @param {Object} trip - Trip object (populated with routeId)
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Notification results
   */
  async notifyTripStatusChange(trip, oldStatus, newStatus) {
    try {
      const Booking = require('../models/Booking');

      // Get all confirmed bookings for this trip
      const bookings = await Booking.find({
        tripId: trip._id,
        status: { $in: ['confirmed', 'completed'] },
      })
        .select('contactInfo seats')
        .lean();

      if (bookings.length === 0) {
        logger.info('No đặt chỗ đến notify cho chuyến:', trip._id);
        return {
          success: true,
          notified: 0,
          message: 'No passengers to notify',
        };
      }

      // Generate notification content
      const { emailSubject, emailHtml, smsMessage } = this.generateStatusChangeContent(
        trip,
        oldStatus,
        newStatus
      );

      // Send notifications to all passengers in parallel (collect results)
      const sendPromises = bookings.map(async (booking) => {
        const email = booking.contactInfo?.email;
        const phone = booking.contactInfo?.phone;

        let emailSent = 0;
        let emailFailed = 0;
        let smsSent = 0;
        let smsFailed = 0;

        if (email) {
          const emailResult = await this.sendEmail(email, emailSubject, emailHtml);
          if (emailResult.success && !emailResult.skipped) emailSent = 1;
          else if (!emailResult.skipped) emailFailed = 1;
        }

        if (phone) {
          const smsResult = await this.sendSMS(phone, smsMessage);
          if (smsResult.success && !smsResult.skipped) smsSent = 1;
          else if (!smsResult.skipped) smsFailed = 1;
        }

        return { emailSent, emailFailed, smsSent, smsFailed };
      });

      const settled = await Promise.all(sendPromises);

      const results = settled.reduce((acc, r) => {
        acc.total += 1;
        acc.emailSent += r.emailSent;
        acc.emailFailed += r.emailFailed;
        acc.smsSent += r.smsSent;
        acc.smsFailed += r.smsFailed;
        return acc;
      }, { total: 0, emailSent: 0, emailFailed: 0, smsSent: 0, smsFailed: 0 });

      logger.info('Chuyến trạng thái change thông báo đã gửi:', results);
      return {
        success: true,
        results,
      };
    } catch (error) {
      logger.error('Error notifytrtrêngg passengers:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate notification content for status change
   * @param {Object} trip - Trip object
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {Object} Email and SMS content
   */
  generateStatusChangeContent(trip, oldStatus, newStatus) {
    const routeName =
      trip.routeId?.routeName ||
      `${trip.routeId?.origin?.city} - ${trip.routeId?.destination?.city}`;
    const departureTime = new Date(trip.departureTime).toLocaleString('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    // Status labels in Vietnamese
    const statusLabels = {
      scheduled: 'Đã lên lịch',
      ongoing: 'Đang di chuyển',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
    };

    const oldStatusLabel = statusLabels[oldStatus] || oldStatus;
    const newStatusLabel = statusLabels[newStatus] || newStatus;

    // Email subject
    let emailSubject = '';
    let statusIcon = '';
    let statusMessage = '';

    switch (newStatus) {
      case 'ongoing':
        emailSubject = `🚌 Chuyến xe của bạn đã khởi hành - ${routeName}`;
        statusIcon = '🚌';
        statusMessage = 'Chuyến xe của bạn đã bắt đầu hành trình';
        break;
      case 'completed':
        emailSubject = `Chuyến xe đã hoàn thành - ${routeName}`;
        statusIcon = '✅';
        statusMessage = 'Chuyến xe của bạn đã đến điểm đến';
        break;
      case 'cancelled':
        emailSubject = ` Chuyến xe đã bị hủy - ${routeName}`;
        statusIcon = '';
        statusMessage =
          'Chuyến xe của bạn đã bị hủy. Vui lòng liên hệ nhà xe để được hỗ trợ hoàn tiền.';
        break;
      default:
        emailSubject = `📢 Cập nhật trạng thái chuyến xe - ${routeName}`;
        statusIcon = '📢';
        statusMessage = 'Trạng thái chuyến xe của bạn đã được cập nhật';
    }

    // HTML email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
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
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
          }
          .status-box {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .status-change {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 15px 0;
            font-size: 18px;
            font-weight: bold;
          }
          .trip-info {
            background: #f9fafb;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .trip-info p {
            margin: 8px 0;
          }
          .trip-info strong {
            color: #0ea5e9;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #0ea5e9;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusIcon} Vé xe nhanh</h1>
            <p>Cập nhật trạng thái chuyến xe</p>
          </div>

          <div class="content">
            <div class="status-box">
              <h2 style="margin-top: 0; color: #0ea5e9;">
                ${statusMessage}
              </h2>
              <div class="status-change">
                <span style="color: #94a3b8;">${oldStatusLabel}</span>
                <span>→</span>
                <span style="color: #0ea5e9;">${newStatusLabel}</span>
              </div>
            </div>

            <div class="trip-info">
              <h3 style="margin-top: 0; color: #334155;">Thông tin chuyến xe:</h3>
              <p><strong>Tuyến đường:</strong> ${routeName}</p>
              <p><strong>Thời gian khởi hành:</strong> ${departureTime}</p>
              ${trip.routeId?.origin?.city
        ? `<p><strong>Điểm đi:</strong> ${trip.routeId.origin.city}</p>`
        : ''
      }
              ${trip.routeId?.destination?.city
        ? `<p><strong>Điểm đến:</strong> ${trip.routeId.destination.city}</p>`
        : ''
      }
            </div>

            ${newStatus === 'cancelled'
        ? `
              <p style="color: #dc2626; font-weight: bold;">
                Chuyến xe đã bị hủy. Vui lòng liên hệ nhà xe để được hỗ trợ hoàn tiền.
              </p>
            `
        : ''
      }

            ${newStatus === 'completed'
        ? `
              <p>
                Cảm ơn bạn đã sử dụng dịch vụ Vé xe nhanh!
                Đừng quên đánh giá chuyến đi của bạn để giúp chúng tôi cải thiện dịch vụ.
              </p>
            `
        : ''
      }

            <p style="margin-top: 30px; color: #666;">
              Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ:
              <br>
              📧 Email: support@vexenhanh.com
              <br>
              📞 Hotline: 1900-0000
            </p>
          </div>

          <div class="footer">
            <p>
               ${new Date().getFullYear()} Vé xe nhanh - Hệ thống đặt vé xe khách trực tuyến
            </p>
            <p style="font-size: 12px; color: #94a3b8;">
              Email này được gửi tự động, vui lòng không trả lời.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // SMS message (shorter)
    let smsMessage = '';
    switch (newStatus) {
      case 'ongoing':
        smsMessage = `Ve xe nhanh: Chuyen xe ${routeName} (${departureTime}) da khoi hanh. Chuc ban hanh trinh tot lanh!`;
        break;
      case 'completed':
        smsMessage = `Ve xe nhanh: Chuyen xe ${routeName} da hoan thanh. Cam on ban da su dung dich vu!`;
        break;
      case 'cancelled':
        smsMessage = `Ve xe nhanh: Chuyen xe ${routeName} (${departureTime}) da bi huy. Vui long lien he nha xe de duoc ho tro.`;
        break;
      default:
        smsMessage = `Ve xe nhanh: Trang thai chuyen xe ${routeName} da duoc cap nhat thanh: ${newStatusLabel}`;
    }

    return {
      emailSubject,
      emailHtml,
      smsMessage,
    };
  }

  /**
   * Send booking confirmation notification
   * @param {Object} booking - Booking object
   * @param {Object} trip - Trip object
   * @returns {Promise<Object>} Notification results
   */
  async notifyBookingConfirmation(booking, trip) {
    // Implementation for booking confirmation
    // This can be called from booking service
    logger.info('Đặt chỗ ctrênfirmtạiitrên thông báo:', booking.bookingCode);
    return { success: true };
  }

  /**
   * Send cancellation notification
   * @param {Object} booking - Booking object
   * @param {Object} trip - Trip object
   * @returns {Promise<Object>} Notification results
   */
  async notifyCancellation(booking, trip) {
    // Implementation for cancellation notification
    logger.info('Hủy thông báo:', booking.bookingCode);
    return { success: true };
  }

  /**
   * Utility: Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} Test result
   */
  async testEmailConfiguration() {
    try {
      if (!this.emailTransporter) {
        logger.error(' Email bộ vận chuyển không config');
        return false;
      }
      await this.emailTransporter.verify();
      logger.info('Email cấu hình is valid');
      return true;
    } catch (error) {
      logger.error(' Email cấu hình lỗi:', error.message);
      return false;
    }
  }
}

module.exports = new NotificationService();
