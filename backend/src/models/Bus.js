const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Bus Schema
 * Manages buses for operators
 */

// Sub-schema for seat layout
const SeatLayoutSchema = new mongoose.Schema(
  {
    floors: {
      type: Number,
      required: [true, 'Số tầng là bắt buộc'],
      enum: {
        values: [1, 2],
        message: 'Số tầng phải là 1 hoặc 2',
      },
    },
    rows: {
      type: Number,
      required: [true, 'Số hàng ghế là bắt buộc'],
      min: [1, 'Số hàng ghế phải lớn hơn 0'],
      max: [20, 'Số hàng ghế không được quá 20'],
    },
    columns: {
      type: Number,
      required: [true, 'Số cột ghế là bắt buộc'],
      min: [1, 'Số cột ghế phải lớn hơn 0'],
      max: [10, 'Số cột ghế không được quá 10'],
    },
    layout: {
      type: [[String]],
      required: [true, 'Sơ đồ ghế là bắt buộc'],
      validate: {
        validator(layout) {
          // Validate layout is a 2D array
          if (!Array.isArray(layout) || layout.length === 0) {
            return false;
          }
          // Check all rows have the same length
          const columnCount = layout[0].length;
          return layout.every((row) => Array.isArray(row) && row.length === columnCount);
        },
        message: 'Sơ đồ ghế không hợp lệ',
      },
    },
    totalSeats: {
      type: Number,
      required: [true, 'Tổng số ghế là bắt buộc'],
      min: [1, 'Tổng số ghế phải lớn hơn 0'],
      max: [200, 'Tổng số ghế không được quá 200'],
    },
  },
  { _id: false }
);

const BusSchema = new mongoose.Schema(
  {
    // Owner
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Operator ID là bắt buộc'],
      index: true,
    },

    // Bus Info
    busNumber: {
      type: String,
      required: [true, 'Biển số xe là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'Biển số xe chỉ được chứa chữ hoa, số và dấu gạch ngang'],
      maxlength: [20, 'Biển số xe không được quá 20 ký tự'],
    },

    busType: {
      type: String,
      required: [true, 'Loại xe là bắt buộc'],
      enum: {
        values: ['limousine', 'sleeper', 'seater', 'double_decker'],
        message: 'Loại xe phải là limousine, sleeper, seater hoặc double_decker',
      },
      index: true,
    },

    // Seat Configuration
    seatLayout: {
      type: SeatLayoutSchema,
      required: [true, 'Cấu hình ghế là bắt buộc'],
    },

    // Amenities
    amenities: {
      type: [String],
      default: [],
      validate: {
        validator(amenities) {
          const validAmenities = [
            'wifi',
            'ac',
            'toilet',
            'tv',
            'water',
            'blanket',
            'pillow',
            'charging',
            'snack',
            'entertainment',
          ];
          return amenities.every((amenity) => validAmenities.includes(amenity.toLowerCase()));
        },
        message:
          'Tiện ích không hợp lệ. Chỉ chấp nhận: wifi, ac, toilet, tv, water, blanket, pillow, charging, snack, entertainment',
      },
    },

    // Status
    status: {
      type: String,
      required: [true, 'Trạng thái xe là bắt buộc'],
      enum: {
        values: ['active', 'maintenance', 'retired'],
        message: 'Trạng thái xe phải là active, maintenance hoặc retired',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes (single field indexes already declared with index: true)
BusSchema.index({ operatorId: 1, status: 1 });
BusSchema.index({ busType: 1, status: 1 });

// Virtual for bus display name
BusSchema.virtual('displayName').get(function () {
  return `${this.busNumber} (${this.busType})`;
});

// Virtual for available status
BusSchema.virtual('isAvailable').get(function () {
  return this.status === 'active';
});

const isActualSeat = (seat) =>
  Boolean(seat) &&
  seat !== 'DRIVER' &&
  seat !== 'FLOOR_2' &&
  seat !== 'BUS' &&
  seat.toUpperCase() !== 'AISLE' &&
  !seat.toLowerCase().includes('aisle');

// Pre-save middleware to calculate total seats from layout
BusSchema.pre('save', function (next) {
  if (this.seatLayout && this.seatLayout.layout) {
    // Count only actual seats (excluding driver, aisle, floor markers, empty)
    const totalSeats = this.seatLayout.layout.flat().filter(isActualSeat).length;
    this.seatLayout.totalSeats = totalSeats;
    logger.info('MIDDLEWARE TRƯỚC KHI LƯU - Tổng số ghế được tính:', totalSeats);
  }
  next();
});

// Instance method to activate bus
BusSchema.methods.activate = async function () {
  this.status = 'active';
  return this.save();
};

// Instance method to set bus to maintenance
BusSchema.methods.setMaintenance = async function () {
  this.status = 'maintenance';
  return this.save();
};

// Instance method to retire bus
BusSchema.methods.retire = async function () {
  this.status = 'retired';
  return this.save();
};

// Instance method to add amenity
BusSchema.methods.addAmenity = async function (amenity) {
  const validAmenities = [
    'wifi',
    'ac',
    'toilet',
    'tv',
    'water',
    'blanket',
    'pillow',
    'charging',
    'snack',
    'entertainment',
  ];

  const lowerAmenity = amenity.toLowerCase();
  if (!validAmenities.includes(lowerAmenity)) {
    throw new Error('Tiện ích không hợp lệ');
  }

  if (!this.amenities.includes(lowerAmenity)) {
    this.amenities.push(lowerAmenity);
    return this.save();
  }

  return this;
};

// Instance method to remove amenity
BusSchema.methods.removeAmenity = async function (amenity) {
  this.amenities = this.amenities.filter((a) => a !== amenity.toLowerCase());
  return this.save();
};

// Static method to find by bus number
BusSchema.statics.findByBusNumber = function (busNumber) {
  return this.findOne({ busNumber: busNumber.toUpperCase() });
};

// Static method to find buses by operator
BusSchema.statics.findByOperator = function (operatorId, statusFilter = null) {
  const query = { operatorId };
  if (statusFilter) {
    query.status = statusFilter;
  }
  return this.find(query);
};

// Static method to find active buses by operator
BusSchema.statics.findActiveBusesByOperator = function (operatorId) {
  return this.find({ operatorId, status: 'active' });
};

// Static method to count buses by type for operator
BusSchema.statics.countByType = async function (operatorId) {
  return this.aggregate([
    { $match: { operatorId: mongoose.Types.ObjectId(operatorId) } },
    { $group: { _id: '$busType', count: { $sum: 1 } } },
  ]);
};

// Static method to get buses by type
BusSchema.statics.findByType = function (busType, activeOnly = false) {
  const query = { busType };
  if (activeOnly) {
    query.status = 'active';
  }
  return this.find(query).populate('operatorId', 'companyName averageRating');
};

const Bus = mongoose.model('Bus', BusSchema);

module.exports = Bus;
