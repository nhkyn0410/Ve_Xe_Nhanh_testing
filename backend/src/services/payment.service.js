const moment = require('moment');
const logger = require('../utils/logger');

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const vnpayService = require('./vnpay.service');
const SeatLockService = require('./seatLock.service');

// Lazy-load TicketService to avoid circular dependency
let TicketService = null;
const getTicketService = () => {
  if (!TicketService) {
    // eslint-disable-next-line global-require
    TicketService = require('./ticket.service');
  }
  return TicketService;
};
let VoucherService = null;
const getVoucherService = () => {
  if (!VoucherService) {
    // eslint-disable-next-line global-require
    VoucherService = require('./voucher.service');
  }
  return VoucherService;
};

/**
 * Payment Service
 * Handles payment operations and integrates with payment gateways
 */
class PaymentService {
  /**
   * Create payment for a booking
   *
   * @param {Object} paymentData - Payment data
   * @param {string} paymentData.bookingId - Booking ID
   * @param {string} paymentData.customerId - Customer ID (optional for guest)
   * @param {string} paymentData.paymentMethod - Payment method
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.ipAddress - Customer IP address
   * @param {string} paymentData.userAgent - Customer user agent
   * @param {string} paymentData.bankCode - Bank code (for VNPay)
   * @param {string} paymentData.locale - Language preference
   * @returns {Object} Payment with payment URL
   */
  static async createPayment(paymentData) {
    const {
      bookingId,
      customerId,
      paymentMethod = 'vnpay',
      amount,
      ipAddress,
      userAgent,
      bankCode,
      locale = 'vn',
    } = paymentData;

    // Validate booking
    const booking = await Booking.findById(bookingId)
      .populate('tripId')
      .populate('operatorId');

    if (!booking) {
      throw new Error('Không tìm thấy booking');
    }

    if (booking.paymentStatus === 'paid') {
      throw new Error('Booking đã được thanh toán');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking đã bị hủy');
    }

    // Validate amount matches booking
    if (amount !== booking.finalPrice) {
      throw new Error(
        `Số tiền thanh toán (${amount}) không khớp với giá booking (${booking.finalPrice})`
      );
    }

    // Generate payment code
    const paymentCode = await Payment.generatePaymentCode();

    // Create payment record
    const payment = await Payment.create({
      paymentCode,
      bookingId,
      customerId: customerId || booking.customerId,
      operatorId: booking.operatorId._id,
      paymentMethod,
      paymentGateway: paymentMethod === 'vnpay' ? 'vnpay' : null,
      amount,
      currency: 'VND',
      status: 'pending',
      ipAddress,
      userAgent,
      metadata: {
        bookingCode: booking.bookingCode,
        tripId: booking.tripId._id,
      },
    });

    // Generate payment URL based on payment method
    let paymentUrl = null;

    if (paymentMethod === 'vnpay') {
      const orderInfo = `Thanh toan ve xe ${booking.bookingCode}`;

      paymentUrl = vnpayService.createPaymentUrl({
        paymentCode,
        amount,
        orderInfo,
        orderType: 'billpayment',
        ipAddress,
        bankCode,
        locale,
      });

      // Update payment with URL and expiry
      payment.setPaymentUrl(paymentUrl, 15);
      await payment.save();
    } else if (paymentMethod === 'cash') {
      // For cash payment, mark as pending and confirm booking
      payment.status = 'pending';
      payment.metadata = {
        ...payment.metadata,
        paymentType: 'cash_on_boarding',
        note: 'Thanh toán tiền mặt khi lên xe',
      };
      await payment.save();

      // Get trip and update booked seats
      const trip = await Trip.findById(booking.tripId);
      if (!trip) {
        throw new Error('Không tìm thấy chuyến xe');
      }

      // Add seats to trip's booked seats
      const seatNumbers = booking.seats.map((s) => s.seatNumber);
      for (let i = 0; i < booking.seats.length; i += 1) {
        const seat = booking.seats[i];
        trip.bookedSeats.push({
          seatNumber: seat.seatNumber,
          bookingId: booking._id,
          passengerName: seat.passengerName,
        });
      }
      trip.availableSeats -= seatNumbers.length;
      await trip.save();

      // Apply voucher if present
      if (booking.voucherId) {
        try {
          const VoucherServiceClass = getVoucherService();
          await VoucherServiceClass.applyToBooking(booking.voucherId);
        } catch (error) {
          logger.error('Không thể áp dụng voucher:', error.message);
        }
      }

      // Confirm booking immediately for cash payment
      booking.paymentStatus = 'pending'; // Will be marked as 'paid' when driver confirms cash received
      booking.paymentMethod = 'cash';
      booking.paymentId = payment._id;
      booking.confirm(); // Confirm booking (sets status to 'confirmed', unsets hold)
      await booking.save();

      // Release Redis locks if booking was held
      if (booking.isHeld) {
        try {
          await SeatLockService.releaseSeats(booking.tripId, seatNumbers);
        } catch (error) {
          logger.info('Lưu ý: Không thể mở khóa ghế (có thể đã hết hạn):', error.message);
        }
      }

      // Generate digital ticket in background
      const TicketServiceClass = getTicketService();
      TicketServiceClass.generateTicket(booking._id)
        .then((ticket) => {
          logger.info('Vé được tạo để đặt vé bằng tiền mặt:', booking.bookingCode);
          return TicketServiceClass.sendTicketNotifications(ticket._id);
        })
        .then((notificationResult) => {
          logger.info('Đã gửi thông báo vé:', notificationResult);
        })
        .catch((error) => {
          logger.error('Tạo vé không thành công:', error);
        });
    }

    // Populate payment details
    await payment.populate('bookingId');
    await payment.populate('operatorId', 'companyName email phone');

    return {
      payment,
      paymentUrl,
    };
  }

  /**
   * Process VNPay callback
   *
   * @param {Object} vnpParams - VNPay callback parameters
   * @param {string} ipAddress - Client IP address
   * @returns {Object} Processing result
   */
  static async processVNPayCallback(vnpParams) {
    logger.info('VNPay callback đã nhận:', vnpParams);

    // Process callback with VNPay service
    const result = vnpayService.processCallback(vnpParams);
    logger.info('VNPay kết quả xác minh chữ ký:', result);

    if (!result.success) {
      logger.error(' VNPay callback thất bại:', result);
      return {
        success: false,
        message: result.message,
        code: result.code,
      };
    }

    const { paymentCode, transactionId, amount, bankCode, cardType, payDate } = result;
    logger.info('VNPay chi tiết thanh toán:', { paymentCode, transactionId, amount, bankCode });

    // Find payment
    const payment = await Payment.findOne({ paymentCode }).populate('bookingId');
    logger.info('Đã tìm thấy khoản thanh toán:', payment ? payment.paymentCode : 'NOT FOUND');

    if (!payment) {
      return {
        success: false,
        message: 'Không tìm thấy thanh toán',
        code: 'PAYMENT_NOT_FOUND',
      };
    }

    // Check if payment already processed
    if (payment.status === 'completed') {
      return {
        success: true,
        message: 'Thanh toán đã được xử lý trước đó',
        payment,
        booking: payment.bookingId,
      };
    }

    // Verify amount
    logger.info('Xác minh số tiền:', { vnpayAmount: amount, paymentAmount: payment.amount });
    if (amount !== payment.amount) {
      logger.error(' Amount mismatch!');
      payment.markAsFailed(
        `Số tiền không khớp: ${amount} !== ${payment.amount}`,
        'AMOUNT_MISMATCH',
        result.rawData
      );
      await payment.save();

      return {
        success: false,
        message: 'Số tiền thanh toán không khớp',
        code: 'AMOUNT_MISMATCH',
      };
    }

    try {
      logger.info('Xử lý thanh toán thành công...');

      // Mark payment as completed
      payment.markAsCompleted(transactionId, {
        ...result.rawData,
        bankCode,
        cardType,
        payDate,
      });
      await payment.save();
      logger.info('Thanh toán được đánh dấu là đã hoàn thành');

      // Update booking payment status
      const booking = await Booking.findById(payment.bookingId);
      logger.info('Booking found:', booking ? booking.bookingCode : 'NOT FOUND');

      if (booking) {
        booking.paymentStatus = 'paid';
        booking.paymentMethod = 'vnpay';
        booking.paymentId = payment._id;
        booking.paidAt = new Date();

        // Auto-confirm booking if it's in pending/held status
        if (booking.status === 'pending' || booking.isHeld) {
          logger.info('Xác nhận chỗ ngồi trong chuyến đi...');

          // Get trip and update booked seats
          const trip = await Trip.findById(booking.tripId);

          if (trip) {
            // Add seats to trip's booked seats
            const seatNumbers = booking.seats.map((s) => s.seatNumber);

            for (let i = 0; i < booking.seats.length; i += 1) {
              const seat = booking.seats[i];
              // Only add if not already booked
              const alreadyBooked = trip.bookedSeats.some(
                (bookedSeat) => bookedSeat.seatNumber === seat.seatNumber
              );

              if (!alreadyBooked) {
                trip.bookedSeats.push({
                  seatNumber: seat.seatNumber,
                  bookingId: booking._id,
                  passengerName: seat.passengerName,
                });
              }
            }

            // Update available seats count
            trip.availableSeats = Math.max(0, trip.totalSeats - trip.bookedSeats.length);
            await trip.save();
            logger.info('Đã cập nhật chỗ ngồi trong chuyến đi:', {
              bookedSeats: trip.bookedSeats.length,
              availableSeats: trip.availableSeats,
            });

            // Release Redis locks (best effort - sessionId unknown in callback)
            try {
              await SeatLockService.releaseSeats(booking.tripId, seatNumbers);
              logger.info('Redis đã mở khóa ghế');
            } catch (lockError) {
              logger.warn('Không thể giải phóng khóa Redis (chúng sẽ hết hạn):', lockError.message);
              // Don't fail payment if lock release fails - they will auto-expire
            }
          } else {
            logger.error('Không tìm thấy chuyến đi để đặt chỗ:', booking.tripId);
          }

          // Confirm booking (updates status to confirmed, isHeld to false)
          booking.confirm();
        }

        await booking.save();
        logger.info('Đặt chỗ được cập nhật thành công');

        // Generate digital ticket in background (UC-7)
        const TicketServiceClass = getTicketService();
        TicketServiceClass.generateTicket(booking._id)
          .then((ticket) => {
            logger.info('Vé được tạo để đặt chỗ:', booking.bookingCode);
            // Send ticket notifications in background
            return TicketServiceClass.sendTicketNotifications(ticket._id);
          })
          .then((notificationResult) => {
            logger.info('Đã gửi thông báo vé:', notificationResult);
          })
          .catch((error) => {
            logger.error('Tạo vé/thông báo không thành công:', error);
            // Don't fail the payment if ticket generation fails
            // Admin can retry ticket generation manually
          });
      }

      logger.info('VNPay callback xử lý thành công!');
      return {
        success: true,
        message: 'Thanh toán thành công',
        payment,
        booking,
      };
    } catch (error) {
      logger.error('Lỗi xử lý lệnh gọi lại VNPay:', error);
      payment.markAsFailed(error.message, 'PROCESSING_ERROR', result.rawData);
      await payment.save();

      throw error;
    }
  }

  /**
   * Get payment by ID
   *
   * @param {string} paymentId - Payment ID
   * @returns {Object} Payment details
   */
  static async getPaymentById(paymentId) {
    const payment = await Payment.findById(paymentId)
      .populate('bookingId')
      .populate('customerId', 'fullName email phone')
      .populate('operatorId', 'companyName email phone');

    if (!payment) {
      throw new Error('Không tìm thấy thanh toán');
    }

    return payment;
  }

  /**
   * Get payment by code
   *
   * @param {string} paymentCode - Payment code
   * @returns {Object} Payment details
   */
  static async getPaymentByCode(paymentCode) {
    const payment = await Payment.findOne({ paymentCode })
      .populate('bookingId')
      .populate('customerId', 'fullName email phone')
      .populate('operatorId', 'companyName email phone');

    if (!payment) {
      throw new Error('Không tìm thấy thanh toán');
    }

    return payment;
  }

  /**
   * Get payments by booking
   *
   * @param {string} bookingId - Booking ID
   * @returns {Array} List of payments
   */
  static async getPaymentsByBooking(bookingId) {
    const payments = await Payment.findByBooking(bookingId);
    return payments;
  }

  /**
   * Get customer payments
   *
   * @param {string} customerId - Customer ID
   * @param {Object} filters - Filter options
   * @returns {Array} List of payments
   */
  static async getCustomerPayments(customerId, filters = {}) {
    const payments = await Payment.findByCustomer(customerId, filters);
    return payments;
  }

  /**
   * Get operator payments
   *
   * @param {string} operatorId - Operator ID
   * @param {Object} filters - Filter options
   * @returns {Array} List of payments
   */
  static async getOperatorPayments(operatorId, filters = {}) {
    const payments = await Payment.findByOperator(operatorId, filters);
    return payments;
  }

  /**
   * Process refund
   *
   * @param {Object} refundData - Refund data
   * @param {string} refundData.paymentId - Payment ID
   * @param {number} refundData.amount - Refund amount
   * @param {string} refundData.reason - Refund reason
   * @param {string} refundData.ipAddress - IP address
   * @param {string} refundData.user - User performing refund
   * @returns {Object} Refund result
   */
  static async processRefund(refundData) {
    const { paymentId, amount, reason, ipAddress, user = 'admin' } = refundData;

    // Find payment
    const payment = await Payment.findById(paymentId).populate('bookingId');

    if (!payment) {
      throw new Error('Không tìm thấy thanh toán');
    }

    if (payment.status !== 'completed') {
      throw new Error('Chỉ có thể hoàn tiền cho thanh toán đã hoàn thành');
    }

    // Validate refund amount
    const remainingAmount = payment.amount - (payment.refundAmount || 0);
    if (amount > remainingAmount) {
      throw new Error(
        `Số tiền hoàn vượt quá số tiền còn lại (${remainingAmount.toLocaleString('vi-VN')} VND)`
      );
    }

    // Process refund with payment gateway
    let refundResult = null;

    if (payment.paymentGateway === 'vnpay') {
      // Get transaction date from payment
      const transactionDate = moment(payment.completedAt).format('YYYYMMDDHHmmss');
      const transactionType = amount >= payment.amount ? '02' : '03'; // 02: full, 03: partial

      refundResult = await vnpayService.refundTransaction({
        paymentCode: payment.paymentCode,
        amount,
        transactionDate,
        transactionType,
        ipAddress,
        user,
      });

      if (!refundResult.success) {
        throw new Error(`Hoàn tiền thất bại: ${refundResult.message}`);
      }
    }

    // Update payment record
    payment.processRefund(
      amount,
      reason,
      refundResult ? refundResult.transactionId : null
    );
    await payment.save();

    // Update booking if full refund
    if (payment.status === 'refunded') {
      const booking = await Booking.findById(payment.bookingId);
      if (booking) {
        booking.paymentStatus = 'refunded';
        if (booking.status !== 'cancelled') {
          booking.status = 'cancelled';
        }
        await booking.save();
      }
    }

    return {
      success: true,
      message: 'Hoàn tiền thành công',
      payment,
      refundResult,
    };
  }

  /**
   * Auto-refund on booking cancellation
   *
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   * @param {string} ipAddress - IP address
   * @param {number} specificRefundAmount - Specific refund amount from cancellation policy (optional)
   * @returns {Object} Refund result
   */
  static async autoRefundOnCancellation(bookingId, reason, ipAddress, specificRefundAmount = null) {
    // Find completed payment for booking
    const payments = await Payment.find({
      bookingId,
      status: 'completed',
    });

    if (payments.length === 0) {
      return {
        success: false,
        message: 'Không tìm thấy thanh toán cần hoàn',
      };
    }

    const results = await Promise.all(payments.map(async (payment) => {
      try {
        let refundAmount;
        if (specificRefundAmount !== null && specificRefundAmount >= 0) {
          refundAmount = Math.min(specificRefundAmount, payment.amount - (payment.refundAmount || 0));
        } else {
          refundAmount = payment.amount - (payment.refundAmount || 0);
        }

        if (refundAmount > 0) {
          return this.processRefund({
            paymentId: payment._id,
            amount: refundAmount,
            reason: `Hoàn tiền tự động do hủy booking: ${reason}`,
            ipAddress,
            user: 'system',
          });
        }

        return {
          success: true,
          paymentId: payment._id,
          message: 'Không hoàn tiền theo chính sách hủy vé',
          refundAmount: 0,
        };
      } catch (error) {
        logger.error('Auto-refund failed for payment:', payment._id, error.message);
        return {
          success: false,
          paymentId: payment._id,
          error: error.message,
        };
      }
    }));

    return {
      success: results.some((r) => r.success),
      results,
    };
  }

  /**
   * Handle expired payments
   * Marks expired pending payments as failed
   */
  static async handleExpiredPayments() {
    const expiredPayments = await Payment.findExpiredPending();

    const results = await Promise.all(expiredPayments.map(async (payment) => {
      try {
        payment.markAsFailed('Thanh toán hết hạn', 'EXPIRED');
        await payment.save();

        // Update booking if needed
        const booking = await Booking.findById(payment.bookingId);
        if (booking && booking.paymentStatus === 'pending') {
          booking.paymentStatus = 'failed';
          await booking.save();
        }

        return { success: true, paymentId: payment._id };
      } catch (error) {
        logger.error('Failed to handle expired payment:', payment._id, error.message);
        return { success: false, paymentId: payment._id, error: error.message };
      }
    }));

    return {
      total: expiredPayments.length,
      processed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Get payment statistics
   *
   * @param {string} operatorId - Operator ID (optional)
   * @param {Object} filters - Filter options
   * @returns {Object} Payment statistics
   */
  static async getStatistics(operatorId = null, filters = {}) {
    const stats = await Payment.getStatistics(operatorId, filters);
    return stats;
  }

  /**
   * Query transaction status from VNPay
   *
   * @param {string} paymentCode - Payment code
   * @param {string} ipAddress - IP address
   * @returns {Object} Transaction status
   */
  static async queryTransactionStatus(paymentCode, ipAddress) {
    const payment = await Payment.findOne({ paymentCode });

    if (!payment) {
      throw new Error('Không tìm thấy thanh toán');
    }

    if (payment.paymentGateway !== 'vnpay') {
      throw new Error('Chỉ hỗ trợ truy vấn cho thanh toán VNPay');
    }

    const transactionDate = moment(payment.initiatedAt).format('YYYYMMDDHHmmss');

    const result = await vnpayService.queryTransaction({
      paymentCode,
      transactionDate,
      ipAddress,
    });

    return {
      payment,
      queryResult: result,
    };
  }

  /**
   * Get available payment methods
   *
   * @returns {Array} List of payment methods
   */
  static getPaymentMethods() {
    return [
      {
        code: 'vnpay',
        name: 'VNPay',
        description: 'Thanh toán qua VNPay',
        icon: 'vnpay',
        enabled: true,
      },
      {
        code: 'momo',
        name: 'MoMo',
        description: 'Thanh toán qua ví MoMo',
        icon: 'momo',
        enabled: false, // Not implemented yet
      },
      {
        code: 'zalopay',
        name: 'ZaloPay',
        description: 'Thanh toán qua ví ZaloPay',
        icon: 'zalopay',
        enabled: false, // Not implemented yet
      },
      {
        code: 'cash',
        name: 'Tiền mặt',
        description: 'Thanh toán bằng tiền mặt',
        icon: 'cash',
        enabled: true,
      },
    ];
  }

  /**
   * Get bank list for VNPay
   *
   * @returns {Array} List of banks
   */
  static getBankList() {
    return vnpayService.getBankList();
  }
}

module.exports = PaymentService;
