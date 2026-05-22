const mongoose = require('mongoose');

/**
 * Payment Schema
 * Tracks all payment transactions and their status
 */
const PaymentSchema = new mongoose.Schema(
  {
    // Unique payment reference
    paymentCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // References
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking là bắt buộc'],
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Nhà xe là bắt buộc'],
      index: true,
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: ['vnpay', 'atm_card', 'credit_card', 'debit_card', 'momo', 'zalopay', 'cash'],
      required: [true, 'Phương thức thanh toán là bắt buộc'],
      index: true,
    },

    // Payment gateway (for online payments)
    paymentGateway: {
      type: String,
      enum: ['vnpay', 'momo', 'zalopay', null],
    },

    // Amount
    amount: {
      type: Number,
      required: [true, 'Số tiền là bắt buộc'],
      min: 0,
    },

    // Currency
    currency: {
      type: String,
      default: 'VND',
    },

    // Payment status
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded',
        'partial_refund',
      ],
      default: 'pending',
      index: true,
    },

    // Transaction ID from payment gateway
    transactionId: {
      type: String,
      index: true,
    },

    // Gateway response data
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Payment URL (for redirect-based payments)
    paymentUrl: {
      type: String,
    },

    // QR code (for QR-based payments)
    qrCode: {
      type: String,
    },

    // Timestamps
    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    failedAt: {
      type: Date,
    },

    // Failure information
    failureReason: {
      type: String,
    },

    failureCode: {
      type: String,
    },

    // Refund information
    refundAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    refundedAt: {
      type: Date,
    },

    refundReason: {
      type: String,
    },

    refundTransactionId: {
      type: String,
    },

    // Payment expiry (for time-limited payment links)
    expiresAt: {
      type: Date,
    },

    // IP address and user agent (for security)
    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    // Callback information
    callbackReceived: {
      type: Boolean,
      default: false,
    },

    callbackReceivedAt: {
      type: Date,
    },

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Notes
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes (compound indexes only - single field indexes are defined in schema)
 */
// Query payments by booking
PaymentSchema.index({ bookingId: 1, status: 1 });

// Query payments by customer
PaymentSchema.index({ customerId: 1, createdAt: -1 });

// Query payments by operator and status
PaymentSchema.index({ operatorId: 1, status: 1, createdAt: -1 });

// Query by payment method and status
PaymentSchema.index({ paymentMethod: 1, status: 1 });

/**
 * Virtual fields
 */
PaymentSchema.virtual('isExpired').get(function () {
  if (this.expiresAt && this.status === 'pending') {
    return new Date() > this.expiresAt;
  }
  return false;
});

PaymentSchema.virtual('isPending').get(function () {
  return this.status === 'pending' || this.status === 'processing';
});

PaymentSchema.virtual('isCompleted').get(function () {
  return this.status === 'completed';
});

PaymentSchema.virtual('isFailed').get(function () {
  return this.status === 'failed' || this.status === 'cancelled';
});

PaymentSchema.virtual('isRefunded').get(function () {
  return this.status === 'refunded' || this.status === 'partial_refund';
});

PaymentSchema.virtual('remainingAmount').get(function () {
  return Math.max(0, this.amount - this.refundAmount);
});

/**
 * Instance Methods
 */

/**
 * Mark payment as processing
 */
PaymentSchema.methods.markAsProcessing = function () {
  this.status = 'processing';
  this.processedAt = new Date();
};

/**
 * Mark payment as completed
 */
PaymentSchema.methods.markAsCompleted = function (transactionId, gatewayResponse = {}) {
  this.status = 'completed';
  this.transactionId = transactionId;
  this.gatewayResponse = gatewayResponse;
  this.completedAt = new Date();
  this.callbackReceived = true;
  this.callbackReceivedAt = new Date();
};

/**
 * Mark payment as failed
 */
PaymentSchema.methods.markAsFailed = function (reason, code, gatewayResponse = {}) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failureCode = code;
  this.gatewayResponse = gatewayResponse;
  this.failedAt = new Date();
  this.callbackReceived = true;
  this.callbackReceivedAt = new Date();
};

/**
 * Mark payment as cancelled
 */
PaymentSchema.methods.cancel = function (reason) {
  this.status = 'cancelled';
  this.failureReason = reason;
  this.failedAt = new Date();
};

/**
 * Process refund
 */
PaymentSchema.methods.processRefund = function (amount, reason, refundTransactionId) {
  if (amount >= this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partial_refund';
  }

  this.refundAmount = (this.refundAmount || 0) + amount;
  this.refundReason = reason;
  this.refundTransactionId = refundTransactionId;
  this.refundedAt = new Date();
};

/**
 * Set payment URL
 */
PaymentSchema.methods.setPaymentUrl = function (url, expiryMinutes = 15) {
  this.paymentUrl = url;
  this.expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
};

/**
 * Static Methods
 */

/**
 * Generate unique payment code
 * Format: PAY + YYYYMMDD + 8-digit random
 */
PaymentSchema.statics.generatePaymentCode = async function () {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const generateUniqueCode = async () => {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    const code = `PAY${dateStr}${random}`;
    const exists = await this.exists({ paymentCode: code });

    if (exists) {
      return generateUniqueCode();
    }

    return code;
  };

  return generateUniqueCode();
};

/**
 * Find payments by booking
 */
PaymentSchema.statics.findByBooking = function (bookingId) {
  return this.find({ bookingId })
    .populate('customerId', 'fullName email phone')
    .populate('operatorId', 'companyName email phone')
    .sort({ createdAt: -1 });
};

/**
 * Find payments by customer
 */
PaymentSchema.statics.findByCustomer = function (customerId, filters = {}) {
  const query = { customerId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.fromDate && filters.toDate) {
    query.createdAt = {
      $gte: new Date(filters.fromDate),
      $lte: new Date(filters.toDate),
    };
  }

  return this.find(query)
    .populate('bookingId')
    .populate('operatorId', 'companyName')
    .sort({ createdAt: -1 });
};

/**
 * Find payments by operator
 */
PaymentSchema.statics.findByOperator = function (operatorId, filters = {}) {
  const query = { operatorId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.fromDate && filters.toDate) {
    query.createdAt = {
      $gte: new Date(filters.fromDate),
      $lte: new Date(filters.toDate),
    };
  }

  return this.find(query)
    .populate('bookingId')
    .populate('customerId', 'fullName email phone')
    .sort({ createdAt: -1 });
};

/**
 * Find expired pending payments
 */
PaymentSchema.statics.findExpiredPending = function () {
  return this.find({
    status: { $in: ['pending', 'processing'] },
    expiresAt: { $lt: new Date() },
  });
};

/**
 * Get payment statistics
 */
PaymentSchema.statics.getStatistics = async function (operatorId = null, filters = {}) {
  const matchStage = operatorId ? { operatorId: new mongoose.Types.ObjectId(operatorId) } : {};

  if (filters.fromDate && filters.toDate) {
    matchStage.createdAt = {
      $gte: new Date(filters.fromDate),
      $lte: new Date(filters.toDate),
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
        },
        failedPayments: {
          $sum: { $cond: [{ $in: ['$status', ['failed', 'cancelled']] }, 1, 0] },
        },
        failedAmount: {
          $sum: { $cond: [{ $in: ['$status', ['failed', 'cancelled']] }, '$amount', 0] },
        },
        refundedPayments: {
          $sum: { $cond: [{ $in: ['$status', ['refunded', 'partial_refund']] }, 1, 0] },
        },
        totalRefundAmount: { $sum: '$refundAmount' },
        avgPaymentAmount: { $avg: '$amount' },
      },
    },
  ]);

  const result = stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    completedAmount: 0,
    failedPayments: 0,
    failedAmount: 0,
    refundedPayments: 0,
    totalRefundAmount: 0,
    avgPaymentAmount: 0,
  };

  // Calculate success rate
  result.successRate =
    result.totalPayments > 0 ? (result.completedPayments / result.totalPayments) * 100 : 0;

  // Get payment method breakdown
  const methodBreakdown = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  result.paymentMethodBreakdown = methodBreakdown;

  return result;
};

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
