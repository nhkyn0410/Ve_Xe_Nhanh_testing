const mongoose = require('mongoose');

/**
 * Route Schema
 * Manages bus routes for operators
 */

// Sub-schema for location (used in origin, destination)
const LocationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, 'Thành phố là bắt buộc'],
      trim: true,
    },
    province: {
      type: String,
      required: [true, 'Tỉnh/Thành phố là bắt buộc'],
      trim: true,
    },
    station: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        min: [-90, 'Vĩ độ phải từ -90 đến 90'],
        max: [90, 'Vĩ độ phải từ -90 đến 90'],
      },
      lng: {
        type: Number,
        min: [-180, 'Kinh độ phải từ -180 đến 180'],
        max: [180, 'Kinh độ phải từ -180 đến 180'],
      },
    },
  },
  { _id: false }
);

// Sub-schema for pickup/dropoff points
const PointSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên điểm là bắt buộc'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        min: [-90, 'Vĩ độ phải từ -90 đến 90'],
        max: [90, 'Vĩ độ phải từ -90 đến 90'],
      },
      lng: {
        type: Number,
        min: [-180, 'Kinh độ phải từ -180 đến 180'],
        max: [180, 'Kinh độ phải từ -180 đến 180'],
      },
    },
  },
  { _id: true } // Keep _id for points for easier reference
);

// Sub-schema for stops/waypoints along the route
const StopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên điểm dừng là bắt buộc'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        min: [-90, 'Vĩ độ phải từ -90 đến 90'],
        max: [90, 'Vĩ độ phải từ -90 đến 90'],
      },
      lng: {
        type: Number,
        min: [-180, 'Kinh độ phải từ -180 đến 180'],
        max: [180, 'Kinh độ phải từ -180 đến 180'],
      },
    },
    order: {
      type: Number,
      required: [true, 'Thứ tự điểm dừng là bắt buộc'],
      min: [1, 'Thứ tự phải bắt đầu từ 1'],
    },
    estimatedArrivalMinutes: {
      type: Number,
      required: [true, 'Thời gian đến ước tính là bắt buộc'],
      min: [0, 'Thời gian không thể âm'],
      // Số phút từ điểm xuất phát
    },
    stopDuration: {
      type: Number,
      default: 15,
      min: [5, 'Thời gian dừng tối thiểu 5 phút'],
      max: [120, 'Thời gian dừng tối đa 120 phút'],
      // Thời gian dừng tại điểm này (phút)
    },
  },
  { _id: true }
);

const RouteSchema = new mongoose.Schema(
  {
    // Owner
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Operator ID là bắt buộc'],
      index: true,
    },

    // Route Info
    routeName: {
      type: String,
      required: [true, 'Tên tuyến đường là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tên tuyến đường không được quá 200 ký tự'],
    },
    routeCode: {
      type: String,
      required: [true, 'Mã tuyến đường là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'Mã tuyến chỉ được chứa chữ hoa, số và dấu gạch ngang'],
    },

    // Origin & Destination
    origin: {
      type: LocationSchema,
      required: [true, 'Điểm đi là bắt buộc'],
    },
    destination: {
      type: LocationSchema,
      required: [true, 'Điểm đến là bắt buộc'],
    },

    // Pickup & Dropoff Points
    pickupPoints: {
      type: [PointSchema],
      default: [],
      validate: {
        validator(points) {
          return points.length <= 20;
        },
        message: 'Không được có quá 20 điểm đón',
      },
    },
    dropoffPoints: {
      type: [PointSchema],
      default: [],
      validate: {
        validator(points) {
          return points.length <= 20;
        },
        message: 'Không được có quá 20 điểm trả',
      },
    },

    // Stops/Waypoints along the route
    stops: {
      type: [StopSchema],
      default: [],
      validate: {
        validator(stops) {
          return stops.length <= 15;
        },
        message: 'Không được có quá 15 điểm dừng',
      },
    },

    // Route Details
    distance: {
      type: Number,
      required: [true, 'Khoảng cách là bắt buộc'],
      min: [0, 'Khoảng cách không thể âm'],
      max: [5000, 'Khoảng cách không thể quá 5000 km'],
    },
    estimatedDuration: {
      type: Number,
      required: [true, 'Thời gian ước tính là bắt buộc'],
      min: [0, 'Thời gian không thể âm'],
      max: [2880, 'Thời gian không thể quá 48 giờ (2880 phút)'],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (compound indexes only - single field indexes are defined in schema)
// Note: routeCode has unique constraint in schema, operatorId and isActive have index: true
RouteSchema.index({ 'origin.city': 1, 'destination.city': 1 });
RouteSchema.index({ operatorId: 1, isActive: 1 });

// Virtual for route description
RouteSchema.virtual('routeDescription').get(function () {
  return `${this.origin.city} → ${this.destination.city}`;
});

// Virtual for estimated duration in hours
RouteSchema.virtual('estimatedDurationHours').get(function () {
  return (this.estimatedDuration / 60).toFixed(1);
});

// Instance method to activate route
RouteSchema.methods.activate = async function () {
  this.isActive = true;
  return this.save();
};

// Instance method to deactivate route
RouteSchema.methods.deactivate = async function () {
  this.isActive = false;
  return this.save();
};

// Instance method to add pickup point
RouteSchema.methods.addPickupPoint = async function (point) {
  if (this.pickupPoints.length >= 20) {
    throw new Error('Không thể thêm quá 20 điểm đón');
  }
  this.pickupPoints.push(point);
  return this.save();
};

// Instance method to remove pickup point
RouteSchema.methods.removePickupPoint = async function (pointId) {
  this.pickupPoints = this.pickupPoints.filter(
    (point) => point._id.toString() !== pointId.toString()
  );
  return this.save();
};

// Instance method to add dropoff point
RouteSchema.methods.addDropoffPoint = async function (point) {
  if (this.dropoffPoints.length >= 20) {
    throw new Error('Không thể thêm quá 20 điểm trả');
  }
  this.dropoffPoints.push(point);
  return this.save();
};

// Instance method to remove dropoff point
RouteSchema.methods.removeDropoffPoint = async function (pointId) {
  this.dropoffPoints = this.dropoffPoints.filter(
    (point) => point._id.toString() !== pointId.toString()
  );
  return this.save();
};

// Static method to find by route code
RouteSchema.statics.findByRouteCode = function (routeCode) {
  return this.findOne({ routeCode: routeCode.toUpperCase() });
};

// Static method to find routes by operator
RouteSchema.statics.findByOperator = function (operatorId, activeOnly = false) {
  const query = { operatorId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query);
};

// Static method to search routes by cities
RouteSchema.statics.searchByCities = function (originCity, destinationCity) {
  const query = {
    isActive: true,
  };

  if (originCity) {
    query['origin.city'] = new RegExp(originCity, 'i');
  }

  if (destinationCity) {
    query['destination.city'] = new RegExp(destinationCity, 'i');
  }

  return this.find(query).populate('operatorId', 'companyName averageRating');
};

// Pre-save middleware to auto-generate route name if not provided
RouteSchema.pre('save', function (next) {
  if (!this.routeName && this.origin && this.destination) {
    this.routeName = `${this.origin.city} - ${this.destination.city}`;
  }
  next();
});

const Route = mongoose.model('Route', RouteSchema);

module.exports = Route;
