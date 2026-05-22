const mongoose = require('mongoose');

/**
 * Voucher/Coupon Schema
 * Represents discount vouchers that can be applied to bookings
 */
const VoucherSchema = new mongoose.Schema(
  {
    // Voucher code (unique)
    code: {
      type: String,
      required: [true, 'Mã voucher là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // Voucher name/description
    name: {
      type: String,
      required: [true, 'Tên voucher là bắt buộc'],
    },

    description: {
      type: String,
    },

    // Operator (null for system-wide vouchers)
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      index: true,
    },

    // Discount type
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },

    // Discount value
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Max discount amount (for percentage type)
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },

    // Minimum booking amount to use voucher
    minBookingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Usage limits
    maxUsageTotal: {
      type: Number,
      default: null, // null = unlimited
    },

    maxUsagePerCustomer: {
      type: Number,
      default: 1,
      min: 1,
    },

    currentUsageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Validity period
    validFrom: {
      type: Date,
      required: true,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Applicable routes (empty = all routes)
    applicableRoutes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
      },
    ],

    // Specific customers (empty = all customers)
    applicableCustomers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Customer tiers (empty = all tiers)
    applicableCustomerTiers: [
      {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
      },
    ],

    // Days of week when voucher is valid (empty = all days)
    // 0 = Sunday, 1 = Monday, etc.
    applicableDaysOfWeek: [
      {
        type: Number,
        min: 0,
        max: 6,
      },
    ],

    // Created by (admin or operator)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdByModel',
    },

    createdByModel: {
      type: String,
      enum: ['Admin', 'BusOperator'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes
 */
VoucherSchema.index({ code: 1, isActive: 1 });
VoucherSchema.index({ operatorId: 1, isActive: 1 });
VoucherSchema.index({ validFrom: 1, validUntil: 1 });

/**
 * Virtual fields
 */
VoucherSchema.virtual('isExpired').get(function () {
  return new Date() > this.validUntil;
});

VoucherSchema.virtual('isNotYetValid').get(function () {
  return new Date() < this.validFrom;
});

VoucherSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.maxUsageTotal === null || this.currentUsageCount < this.maxUsageTotal)
  );
});

VoucherSchema.virtual('remainingUsage').get(function () {
  if (this.maxUsageTotal === null) {
    return null; // Unlimited
  }
  return Math.max(0, this.maxUsageTotal - this.currentUsageCount);
});

/**
 * Instance Methods
 */

/**
 * Calculate discount amount for a booking
 * @param {Number} bookingAmount - Total booking amount
 * @returns {Number} Discount amount
 */
VoucherSchema.methods.calculateDiscount = function (bookingAmount) {
  if (this.discountType === 'percentage') {
    const discount = (bookingAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount) {
      return Math.min(discount, this.maxDiscountAmount);
    }
    return discount;
  }

  // Fixed amount
  return Math.min(this.discountValue, bookingAmount);
};

/**
 * Increment usage count
 */
VoucherSchema.methods.incrementUsage = async function () {
  this.currentUsageCount += 1;
  await this.save();
};

/**
 * Check if voucher can be used
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, reason: string }
 */
VoucherSchema.methods.canBeUsed = function (options = {}) {
  const { bookingAmount, customerId, routeId, dayOfWeek } = options;

  // Check if active
  if (!this.isActive) {
    return { valid: false, reason: 'Voucher không hoạt động' };
  }

  // Check validity period
  const now = new Date();
  if (now < this.validFrom) {
    return { valid: false, reason: 'Voucher chưa có hiệu lực' };
  }
  if (now > this.validUntil) {
    return { valid: false, reason: 'Voucher đã hết hạn' };
  }

  // Check usage limit
  if (this.maxUsageTotal !== null && this.currentUsageCount >= this.maxUsageTotal) {
    return { valid: false, reason: 'Voucher đã hết lượt sử dụng' };
  }

  // Check minimum booking amount
  if (bookingAmount && bookingAmount < this.minBookingAmount) {
    return {
      valid: false,
      reason: `Giá trị đơn hàng tối thiểu ${this.minBookingAmount.toLocaleString('vi-VN')}đ`,
    };
  }

  // Check applicable routes
  if (this.applicableRoutes.length > 0 && routeId) {
    const routeIdStr = routeId.toString();
    const isRouteApplicable = this.applicableRoutes.some((r) => r.toString() === routeIdStr);
    if (!isRouteApplicable) {
      return { valid: false, reason: 'Voucher không áp dụng cho tuyến đường này' };
    }
  }

  // Check applicable customers
  if (this.applicableCustomers.length > 0 && customerId) {
    const customerIdStr = customerId.toString();
    const isCustomerApplicable = this.applicableCustomers.some(
      (c) => c.toString() === customerIdStr
    );
    if (!isCustomerApplicable) {
      return { valid: false, reason: 'Voucher không áp dụng cho tài khoản này' };
    }
  }

  // Check applicable days of week
  if (this.applicableDaysOfWeek.length > 0) {
    const currentDay = dayOfWeek !== undefined ? dayOfWeek : new Date().getDay();
    if (!this.applicableDaysOfWeek.includes(currentDay)) {
      return { valid: false, reason: 'Voucher không áp dụng cho ngày này' };
    }
  }

  return { valid: true };
};

/**
 * Static Methods
 */

/**
 * Find active vouchers
 */
VoucherSchema.statics.findActive = function (filters = {}) {
  const query = {
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  };

  if (filters.operatorId) {
    query.$or = [{ operatorId: filters.operatorId }, { operatorId: null }];
  }

  return this.find(query).sort({ validUntil: 1 });
};

/**
 * Find voucher by code
 */
VoucherSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase() });
};

/**
 * Find operator vouchers
 */
VoucherSchema.statics.findByOperator = function (operatorId) {
  return this.find({ operatorId }).sort({ createdAt: -1 });
};

/**
 * Get voucher statistics
 */
VoucherSchema.statics.getStatistics = async function (operatorId = null) {
  const query = operatorId ? { operatorId } : {};

  const [total, active, expired, totalUsage] = await Promise.all([
    this.countDocuments(query),
    this.countDocuments({ ...query, isActive: true }),
    this.countDocuments({
      ...query,
      validUntil: { $lt: new Date() },
    }),
    this.aggregate([
      { $match: query },
      { $group: { _id: null, totalUsage: { $sum: '$currentUsageCount' } } },
    ]),
  ]);

  return {
    totalVouchers: total,
    activeVouchers: active,
    expiredVouchers: expired,
    totalUsageCount: totalUsage[0]?.totalUsage || 0,
  };
};

/**
 * Pre-save middleware
 */
VoucherSchema.pre('save', function (next) {
  // Ensure code is uppercase
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase().trim();
  }

  // Validate discount value
  if (this.discountType === 'percentage') {
    if (this.discountValue > 100) {
      return next(new Error('Giảm giá phần trăm không được vượt quá 100%'));
    }
  }

  // Validate date range
  if (this.validFrom >= this.validUntil) {
    return next(new Error('Ngày bắt đầu phải trước ngày kết thúc'));
  }

  next();
});

const Voucher = mongoose.model('Voucher', VoucherSchema);

module.exports = Voucher;
