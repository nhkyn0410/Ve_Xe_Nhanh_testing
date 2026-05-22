const mongoose = require('mongoose');

/**
 * Booking Schema
 * Represents a ticket booking with seat selections and passenger details
 */
const BookingSchema = new mongoose.Schema(
  {
    // Unique booking reference code
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // References
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Chuyến xe là bắt buộc'],
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allow guest bookings
      index: true,
    },

    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Nhà xe là bắt buộc'],
      index: true,
    },

    // Booking status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
      default: 'pending',
      index: true,
    },

    // Selected seats
    seats: [
      {
        seatNumber: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        passengerName: {
          type: String,
          required: true,
        },
        passengerPhone: {
          type: String,
        },
        passengerEmail: {
          type: String,
        },
        passengerIdCard: {
          type: String,
        },
      },
    ],

    // Contact information (primary contact)
    contactInfo: {
      name: {
        type: String,
        required: [true, 'Tên liên hệ là bắt buộc'],
      },
      phone: {
        type: String,
        required: [true, 'Số điện thoại liên hệ là bắt buộc'],
      },
      email: {
        type: String,
      },
    },

    // Pickup and dropoff points
    pickupPoint: {
      name: String,
      address: String,
      time: Date,
    },

    dropoffPoint: {
      name: String,
      address: String,
      time: Date,
    },

    // Pricing
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Voucher information
    voucherCode: {
      type: String,
      uppercase: true,
    },

    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
    },

    voucherDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment information
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'momo', 'vnpay', 'zalopay'],
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    paymentId: {
      type: String,
    },

    paidAt: {
      type: Date,
    },

    // Cancellation
    cancelledAt: {
      type: Date,
    },

    cancelReason: {
      type: String,
    },

    cancelledBy: {
      type: String,
      enum: ['customer', 'operator', 'system'],
    },

    refundAmount: {
      type: Number,
      min: 0,
    },

    refundedAt: {
      type: Date,
    },

    // Special requests
    specialRequests: {
      type: String,
    },

    // Notes from operator
    operatorNotes: {
      type: String,
    },

    // Guest booking (for users without account)
    isGuestBooking: {
      type: Boolean,
      default: false,
    },

    // Hold/Lock information
    isHeld: {
      type: Boolean,
      default: false,
    },

    heldUntil: {
      type: Date,
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
// Query bookings by customer
BookingSchema.index({ customerId: 1, createdAt: -1 });

// Query bookings by operator and date
BookingSchema.index({ operatorId: 1, createdAt: -1 });

// Query bookings by trip
BookingSchema.index({ tripId: 1, status: 1 });

// Query bookings by status and payment
BookingSchema.index({ status: 1, paymentStatus: 1 });

/**
 * Virtual fields
 */
BookingSchema.virtual('numberOfSeats').get(function () {
  return this.seats ? this.seats.length : 0;
});

BookingSchema.virtual('isExpired').get(function () {
  if (this.isHeld && this.heldUntil) {
    return new Date() > this.heldUntil;
  }
  return false;
});

BookingSchema.virtual('canBeCancelled').get(function () {
  // Can only cancel pending or confirmed bookings
  if (!['pending', 'confirmed'].includes(this.status)) {
    return false;
  }

  // Cannot cancel if trip has already departed
  // This check should be done with trip data
  return true;
});

/**
 * Instance Methods
 */

/**
 * Generate unique booking code
 * Format: BK + YYYYMMDD + 6-digit random
 */
BookingSchema.statics.generateBookingCode = async function () {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  const generateUniqueCode = async () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    const code = `BK${dateStr}${random}`;
    const exists = await this.exists({ bookingCode: code });

    if (exists) {
      return generateUniqueCode();
    }

    return code;
  };

  return generateUniqueCode();
};

/**
 * Mark booking as confirmed
 */
BookingSchema.methods.confirm = function () {
  this.status = 'confirmed';
  this.isHeld = false;
  this.heldUntil = null;
};

/**
 * Cancel booking
 */
BookingSchema.methods.cancel = function (reason, cancelledBy = 'customer') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  this.cancelledBy = cancelledBy;
};

/**
 * Mark as paid
 */
BookingSchema.methods.markAsPaid = function (paymentId, paymentMethod) {
  this.paymentStatus = 'paid';
  this.paymentId = paymentId;
  this.paymentMethod = paymentMethod;
  this.paidAt = new Date();
  this.confirm(); // Automatically confirm when paid
};

/**
 * Process refund
 */
BookingSchema.methods.processRefund = function (amount) {
  this.status = 'refunded';
  this.paymentStatus = 'refunded';
  this.refundAmount = amount;
  this.refundedAt = new Date();
};

/**
 * Set hold/lock with TTL
 */
BookingSchema.methods.hold = function (minutes = 15) {
  this.isHeld = true;
  this.heldUntil = new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Release hold
 */
BookingSchema.methods.releaseHold = function () {
  this.isHeld = false;
  this.heldUntil = null;
};

/**
 * Static Methods
 */

/**
 * Find bookings by customer
 */
BookingSchema.statics.findByCustomer = function (customerId, filters = {}) {
  const query = { customerId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.fromDate && filters.toDate) {
    query.createdAt = {
      $gte: new Date(filters.fromDate),
      $lte: new Date(filters.toDate),
    };
  }

  return this.find(query)
    .populate('tripId')
    .populate('operatorId', 'operatorName companyName phone email')
    .sort({ createdAt: -1 });
};

/**
 * Find bookings by operator
 */
BookingSchema.statics.findByOperator = function (operatorId, filters = {}) {
  const query = { operatorId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }

  if (filters.fromDate && filters.toDate) {
    query.createdAt = {
      $gte: new Date(filters.fromDate),
      $lte: new Date(filters.toDate),
    };
  }

  return this.find(query)
    .populate('tripId')
    .populate('customerId', 'fullName phone email')
    .sort({ createdAt: -1 });
};

/**
 * Find expired held bookings
 */
BookingSchema.statics.findExpiredHolds = function () {
  return this.find({
    isHeld: true,
    heldUntil: { $lt: new Date() },
    status: 'pending',
  });
};

/**
 * Pre-save middleware
 */
BookingSchema.pre('save', function (next) {
  // Calculate final price with discounts
  if (
    this.isModified('discount') ||
    this.isModified('totalPrice') ||
    this.isModified('voucherDiscount')
  ) {
    // Apply percentage discount first
    let price = this.totalPrice * (1 - this.discount / 100);
    // Then apply voucher discount (fixed amount)
    price = Math.max(0, price - this.voucherDiscount);
    this.finalPrice = price;
  }

  next();
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
