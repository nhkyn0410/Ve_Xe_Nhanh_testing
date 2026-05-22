const mongoose = require('mongoose');

/**
 * Ticket Schema
 * Represents a digital ticket with QR code for scanning and verification
 */
const TicketSchema = new mongoose.Schema(
  {
    // Unique ticket code
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // References
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID là bắt buộc'],
      unique: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest bookings
      index: true,
    },

    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip ID là bắt buộc'],
      index: true,
    },

    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Operator ID là bắt buộc'],
      index: true,
    },

    // QR Code
    qrCode: {
      type: String, // Base64 encoded QR code image
      required: true,
    },

    qrCodeData: {
      type: String, // Encrypted JSON string
      required: true,
      select: false, // Don't return this by default for security
    },

    // PDF (legacy, no longer generated)
    pdfUrl: {
      type: String, // Deprecated: kept for backward compatibility
    },

    pdfFileName: {
      type: String, // Deprecated: kept for backward compatibility
    },

    // Passenger Info (Denormalized for quick access)
    passengers: [
      {
        seatNumber: {
          type: String,
          required: true,
        },
        fullName: {
          type: String,
          required: true,
        },
        phone: String,
        email: String,
        idCard: String,
      },
    ],

    // Trip Info (Denormalized)
    tripInfo: {
      routeName: String,
      departureTime: Date,
      arrivalTime: Date,
      origin: {
        city: String,
        station: String,
        address: String,
      },
      destination: {
        city: String,
        station: String,
        address: String,
      },
      pickupPoint: {
        name: String,
        address: String,
      },
      dropoffPoint: {
        name: String,
        address: String,
      },
      busNumber: String,
      busType: String,
    },

    // Pricing Info
    totalPrice: {
      type: Number,
      required: true,
    },

    // Verification
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },

    usedAt: {
      type: Date,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee', // Trip Manager who verified
    },

    // Status
    status: {
      type: String,
      enum: ['valid', 'cancelled', 'expired', 'used'],
      default: 'valid',
      index: true,
    },

    // Notification Status
    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
    },

    smsSent: {
      type: Boolean,
      default: false,
    },

    smsSentAt: {
      type: Date,
    },

    // Metadata
    generatedAt: {
      type: Date,
      default: Date.now,
    },

    cancelledAt: {
      type: Date,
    },

    cancelReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (compound indexes only - single field indexes are defined in schema)
TicketSchema.index({ customerId: 1, status: 1 });
TicketSchema.index({ tripId: 1, status: 1 });
TicketSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if ticket is expired
TicketSchema.virtual('isExpired').get(function () {
  if (this.status === 'expired') return true;
  if (this.tripInfo && this.tripInfo.departureTime) {
    return new Date(this.tripInfo.departureTime) < new Date();
  }
  return false;
});

// Virtual for checking if ticket is valid for use
TicketSchema.virtual('isValidForUse').get(function () {
  return this.status === 'valid' && !this.isUsed && !this.isExpired;
});

/**
 * Generate unique ticket code
 * Format: TKT-YYYYMMDD-XXXXXXXX
 */
TicketSchema.statics.generateTicketCode = async function () {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  const generateUniqueCode = async () => {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const code = `TKT-${dateStr}-${random}`;
    const exists = await this.findOne({ ticketCode: code });

    if (exists) {
      return generateUniqueCode();
    }

    return code;
  };

  return generateUniqueCode();
};

/**
 * Mark ticket as used
 */
TicketSchema.methods.markAsUsed = function (verifiedBy) {
  this.isUsed = true;
  this.usedAt = new Date();
  this.verifiedBy = verifiedBy;
  this.status = 'used';
};

/**
 * Cancel ticket
 */
TicketSchema.methods.cancel = function (reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
};

/**
 * Mark email as sent
 */
TicketSchema.methods.markEmailSent = function () {
  this.emailSent = true;
  this.emailSentAt = new Date();
};

/**
 * Mark SMS as sent
 */
TicketSchema.methods.markSmsSent = function () {
  this.smsSent = true;
  this.smsSentAt = new Date();
};

/**
 * Find tickets by customer
 */
TicketSchema.statics.findByCustomer = function (customerId, filters = {}) {
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
    .populate('operatorId', 'operatorName companyName phone email logo')
    .sort({ createdAt: -1 });
};

/**
 * Find tickets by trip
 */
TicketSchema.statics.findByTrip = function (tripId, filters = {}) {
  const query = { tripId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.isUsed !== undefined) {
    query.isUsed = filters.isUsed;
  }

  return this.find(query)
    .populate('customerId', 'fullName phone email')
    .populate('verifiedBy', 'fullName employeeCode')
    .sort({ createdAt: -1 });
};

/**
 * Find ticket by code for lookup
 */
TicketSchema.statics.findByCode = function (ticketCode) {
  return this.findOne({ ticketCode })
    .populate('tripId')
    .populate('operatorId', 'operatorName companyName phone email logo')
    .populate('bookingId');
};

const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = Ticket;
