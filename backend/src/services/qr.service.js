const QRCode = require('qrcode');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * QR Code Service
 * Handles QR code generation with encryption for ticket verification
 */
class QRService {
  constructor() {
    // Encryption settings
    this.algorithm = 'aes-256-cbc';

    // Convert hex string from env to Buffer (32 bytes for aes-256)
    // QR_ENCRYPTION_KEY should be a 64-character hex string (32 bytes)
    if (process.env.QR_ENCRYPTION_KEY) {
      this.secretKey = Buffer.from(process.env.QR_ENCRYPTION_KEY, 'hex');
    } else {
      // Generate random 32 bytes if not set
      this.secretKey = crypto.randomBytes(32);
      logger.warn('QR_ENCRYPTION_KEY không được đặt, sử dụng khóa ngẫu nhiên. Điều này sẽ phá vỡ xác minh QR sau khi khởi động lại!');
    }

    // Verify key length
    if (this.secretKey.length !== 32) {
      throw new Error(`QR_ENCRYPTION_KEY phải là 32 byte (64 ký tự hex), got ${this.secretKey.length} bytes`);
    }
  }

  /**
   * Encrypt QR code data
   * IMPORTANT: Generate a fresh IV for each encryption (security best practice)
   * @param {Object} data - Data to encrypt
   * @returns {string} Encrypted string
   */
  encrypt(data) {
    try {
      const text = JSON.stringify(data);

      // Generate fresh IV for each encryption (CRITICAL for security and reliability)
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secretKey), iv);

      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Return encrypted data with IV (needed for decryption)
      const result = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

      logger.info('QR mã hóa:', {
        dataLength: text.length,
        encryptedLength: result.length,
        ivLength: iv.length
      });

      return result;
    } catch (error) {
      logger.error('Lỗi mã hóa:', error);
      throw new Error('Không thể mã hóa dữ liệu QR');
    }
  }

  /**
   * Decrypt QR code data
   * @param {string} encryptedText - Encrypted string
   * @returns {Object} Decrypted data object
   */
  decrypt(encryptedText) {
    try {
      logger.info('Đang cố gắng giải mã dữ liệu QR:', {
        length: encryptedText.length,
        preview: `${encryptedText.substring(0, 50)}...`,
      });

      // Trim whitespace that might come from scanning
      const cleanText = encryptedText.trim();

      const parts = cleanText.split(':');
      if (parts.length < 2) {
        throw new Error('QR code format không đúng (thiếu IV)');
      }

      const iv = Buffer.from(parts.shift(), 'hex');
      const encryptedData = Buffer.from(parts.join(':'), 'hex');

      logger.info('Thông số giải mã:', {
        ivLength: iv.length,
        dataLength: encryptedData.length,
      });

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(this.secretKey),
        iv
      );

      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      const result = JSON.parse(decrypted.toString());

      logger.info('Đã giải mã QR thành công:', {
        ticketCode: result.ticketCode,
        bookingId: result.bookingId,
        version: result.version,
      });

      return result;
    } catch (error) {
      logger.error('Lỗi giải mã:', error);
      logger.error('Văn bản QR không thành công:', encryptedText);
      throw new Error(`QR code không hợp lệ hoặc bị hỏng: ${error.message}`);
    }
  }

  /**
   * Generate QR code for ticket
   * @param {Object} ticketData - Ticket information
   * @returns {Promise<Object>} QR code data and image
   */
  async generateTicketQR(ticketData) {
    try {
      const {
        bookingId,
        ticketCode,
        tripId,
        seatNumbers,
        passengerName,
        departureTime,
      } = ticketData;

      // Create QR data payload
      const qrData = {
        bookingId,
        ticketCode,
        tripId,
        seats: seatNumbers,
        passenger: passengerName,
        departure: departureTime,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      // Encrypt the data
      const encryptedData = this.encrypt(qrData);

      // Generate QR code image (Base64)
      // Using balanced settings for optimal scanning reliability
      const qrCodeImage = await QRCode.toDataURL(encryptedData, {
        errorCorrectionLevel: 'M', // Medium error correction (balanced, can recover from ~15% damage)
        type: 'image/png',
        quality: 0.95,
        margin: 4, // Good margin for scanner detection
        width: 300, // Standard size - proven to work well
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      logger.info('Mã QR được tạo:', {
        dataLength: encryptedData.length,
        imageSize: '300x300',
        errorCorrection: 'M'
      });

      return {
        qrCode: qrCodeImage, // Base64 data URL
        qrCodeData: encryptedData, // Encrypted string for storage
        rawData: qrData, // Original data (don't expose to client)
      };
    } catch (error) {
      logger.error('Lỗi tạo QR:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify QR code data
   * @param {string} encryptedData - Encrypted QR data
   * @param {Object} expectedData - Expected ticket data for verification
   * @returns {Object} Verification result
   */
  async verifyTicketQR(encryptedData, expectedData = {}) {
    try {
      // Decrypt QR data
      const qrData = this.decrypt(encryptedData);

      // Verify QR code structure
      if (!qrData.bookingId || !qrData.ticketCode || !qrData.tripId) {
        return {
          valid: false,
          error: 'QR code format không hợp lệ',
        };
      }

      // Verify QR code version
      if (qrData.version !== '1.0') {
        return {
          valid: false,
          error: 'QR code version không được hỗ trợ',
        };
      }

      // Check if QR data matches expected data (if provided)
      const mismatches = [];

      if (expectedData.bookingId && qrData.bookingId !== expectedData.bookingId) {
        mismatches.push('Booking ID không khớp');
      }

      if (expectedData.ticketCode && qrData.ticketCode !== expectedData.ticketCode) {
        mismatches.push('Ticket code không khớp');
      }

      if (expectedData.tripId && qrData.tripId !== expectedData.tripId) {
        mismatches.push('Trip ID không khớp');
      }

      if (mismatches.length > 0) {
        return {
          valid: false,
          error: mismatches.join(', '),
          data: qrData,
        };
      }

      // Check if QR code is too old (optional: prevent replay attacks)
      const qrTimestamp = new Date(qrData.timestamp);
      const now = new Date();
      const ageInHours = (now - qrTimestamp) / (1000 * 60 * 60);

      // QR code valid for 72 hours (3 days before trip)
      if (ageInHours > 72) {
        return {
          valid: false,
          error: 'QR code đã quá cũ',
          data: qrData,
        };
      }

      return {
        valid: true,
        data: qrData,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message || 'QR code không hợp lệ',
      };
    }
  }

  /**
   * Generate QR code as Buffer (for PDF embedding)
   * @param {string} encryptedData - Encrypted data
   * @returns {Promise<Buffer>} QR code image buffer
   */
  async generateQRBuffer(encryptedData) {
    try {
      const buffer = await QRCode.toBuffer(encryptedData, {
        errorCorrectionLevel: 'H',
        type: 'png',
        quality: 0.95,
        margin: 1,
        width: 300,
      });

      return buffer;
    } catch (error) {
      logger.error('Lỗi tạo bộ đệm QR:', error);
      throw new Error('Không tạo được bộ đệm QR');
    }
  }

  /**
   * Scan and decode QR code from image
   * Note: This requires a QR scanner library like jimp + qrcode-reader
   * For now, we'll assume the client sends us the decoded string
   * @param {string} qrCodeString - Scanned QR code string
   * @returns {Object} Decoded ticket data
   */
  async scanQRCode(qrCodeString) {
    try {
      return this.decrypt(qrCodeString);
    } catch (error) {
      throw new Error('Không thể đọc QR code. Vui lòng thử lại.');
    }
  }
}

// Export singleton instance
module.exports = new QRService();
