const moment = require('moment-timezone');

/**
 * Cancellation Service
 * Handles cancellation policies and refund calculations
 */
class CancellationService {
  /**
   * Default cancellation policy (can be overridden by operator)
   * Refund percentage based on hours before departure
   */
  static DEFAULT_POLICY = {
    rules: [
      {
        hoursBeforeDeparture: 2,
        refundPercentage: 100,
        description: 'Hoàn 100% nếu hủy trước 2 giờ khởi hành',
      },
      {
        hoursBeforeDeparture: 0,
        refundPercentage: 0,
        description: 'Không hoàn tiền nếu hủy trong vòng 2 giờ trước giờ khởi hành',
      },
    ],
    cancellationFee: 0, // Fixed cancellation fee (VND)
    minimumRefund: 0, // Minimum refund amount (VND)
  };

  /**
   * Check if ticket can be cancelled
   * @param {Object} ticket - Ticket document
   * @returns {Object} Cancellation eligibility result
   */
  static canCancelTicket(ticket) {
    const now = moment().tz('Asia/Ho_Chi_Minh');
    const departureTime = moment(ticket.tripInfo.departureTime).tz('Asia/Ho_Chi_Minh');

    // Check if ticket is already cancelled
    if (ticket.status === 'cancelled') {
      return {
        canCancel: false,
        reason: 'Vé đã bị hủy trước đó',
      };
    }

    // Check if ticket is already used
    if (ticket.isUsed || ticket.status === 'used') {
      return {
        canCancel: false,
        reason: 'Không thể hủy vé đã sử dụng',
      };
    }

    // Check if trip has already departed
    if (departureTime.isBefore(now)) {
      return {
        canCancel: false,
        reason: 'Không thể hủy vé sau khi xe đã khởi hành',
      };
    }

    return {
      canCancel: true,
      hoursUntilDeparture: departureTime.diff(now, 'hours', true),
    };
  }

  /**
   * Calculate refund amount based on cancellation policy
   * @param {Object} ticket - Ticket document
   * @param {Object} booking - Booking document
   * @param {Object} policy - Custom cancellation policy (optional)
   * @returns {Object} Refund calculation result
   */
  static calculateRefund(ticket, booking, policy = null) {
    const eligibility = this.canCancelTicket(ticket);

    if (!eligibility.canCancel) {
      return {
        canRefund: false,
        reason: eligibility.reason,
        refundAmount: 0,
        refundPercentage: 0,
      };
    }

    // Use custom policy or default
    const appliedPolicy = policy || this.DEFAULT_POLICY;
    const { hoursUntilDeparture } = eligibility;

    // Find applicable refund rule
    const appliedRule = appliedPolicy.rules.find(
      (rule) => hoursUntilDeparture >= rule.hoursBeforeDeparture
    ) || null;
    const refundPercentage = appliedRule ? appliedRule.refundPercentage : 0;

    // Calculate refund amount
    const originalAmount = booking.finalPrice || ticket.totalPrice;
    let refundAmount = (originalAmount * refundPercentage) / 100;

    // Subtract cancellation fee
    if (appliedPolicy.cancellationFee > 0) {
      refundAmount = Math.max(0, refundAmount - appliedPolicy.cancellationFee);
    }

    // Apply minimum refund
    if (refundAmount > 0 && refundAmount < appliedPolicy.minimumRefund) {
      refundAmount = appliedPolicy.minimumRefund;
    }

    return {
      canRefund: true,
      refundAmount: Math.round(refundAmount),
      refundPercentage,
      originalAmount,
      cancellationFee: appliedPolicy.cancellationFee,
      appliedRule: appliedRule?.description || 'Chính sách mặc định',
      hoursUntilDeparture: Math.round(hoursUntilDeparture * 10) / 10,
      departureTime: ticket.tripInfo.departureTime,
    };
  }

  /**
   * Get cancellation policy details
   * @param {string} operatorId - Operator ID (for custom policies)
   * @returns {Object} Cancellation policy
   */
  static async getCancellationPolicy(_operatorId = null) {
    // TODO: Implement custom operator policies from database
    // For now, return default policy

    return {
      ...this.DEFAULT_POLICY,
      description: 'Chính sách hủy vé của Vé xe nhanh',
      lastUpdated: new Date(),
    };
  }

  /**
   * Validate cancellation reason
   * @param {string} reason - Cancellation reason
   * @returns {Object} Validation result
   */
  static validateCancellationReason(reason) {
    const validReasons = [
      'Thay đổi kế hoạch',
      'Lý do cá nhân',
      'Thời tiết xấu',
      'Vấn đề sức khỏe',
      'Trùng lịch',
      'Đặt nhầm',
      'Khác',
    ];

    if (!reason || reason.trim().length === 0) {
      return {
        valid: true,
        reason: 'Khách hủy vé', // Default reason
      };
    }

    return {
      valid: true,
      reason: reason.trim(),
    };
  }

  /**
   * Format cancellation details for email/notification
   * @param {Object} cancellationData - Cancellation data
   * @returns {Object} Formatted details
   */
  static formatCancellationDetails(cancellationData) {
    const {
      ticket,
      booking,
      refundInfo,
      cancelReason,
    } = cancellationData;

    return {
      ticketCode: ticket.ticketCode,
      bookingCode: booking.bookingCode,
      routeName: ticket.tripInfo.routeName,
      departureTime: moment(ticket.tripInfo.departureTime)
        .tz('Asia/Ho_Chi_Minh')
        .format('HH:mm, DD/MM/YYYY'),
      seatNumbers: ticket.passengers.map(p => p.seatNumber).join(', '),
      originalAmount: refundInfo.originalAmount.toLocaleString('vi-VN'),
      refundAmount: refundInfo.refundAmount.toLocaleString('vi-VN'),
      refundPercentage: refundInfo.refundPercentage,
      cancelReason: cancelReason || 'Không có lý do',
      cancelledAt: moment().tz('Asia/Ho_Chi_Minh').format('HH:mm, DD/MM/YYYY'),
      appliedRule: refundInfo.appliedRule,
    };
  }

  /**
   * Get refund status description
   * @param {string} status - Refund status
   * @returns {string} Vietnamese description
   */
  static getRefundStatusDescription(status) {
    const descriptions = {
      pending: 'Đang xử lý',
      processing: 'Đang hoàn tiền',
      completed: 'Đã hoàn tiền',
      failed: 'Hoàn tiền thất bại',
      not_applicable: 'Không áp dụng hoàn tiền',
    };

    return descriptions[status] || status;
  }

  /**
   * Calculate refund timeline (estimated days)
   * @param {string} paymentMethod - Original payment method
   * @returns {Object} Refund timeline
   */
  static getRefundTimeline(paymentMethod) {
    const timelines = {
      vnpay: { min: 3, max: 7, description: '3-7 ngày làm việc' },
      momo: { min: 1, max: 3, description: '1-3 ngày làm việc' },
      zalopay: { min: 1, max: 3, description: '1-3 ngày làm việc' },
      atm: { min: 5, max: 10, description: '5-10 ngày làm việc' },
      visa: { min: 7, max: 14, description: '7-14 ngày làm việc' },
      mastercard: { min: 7, max: 14, description: '7-14 ngày làm việc' },
      cod: { min: 0, max: 0, description: 'Không áp dụng' },
    };

    return timelines[paymentMethod] || { min: 3, max: 7, description: '3-7 ngày làm việc' };
  }
}

module.exports = CancellationService;
