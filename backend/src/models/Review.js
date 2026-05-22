const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    // References
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID là bắt buộc'],
      unique: true,
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

    // Rating (1-5 stars)
    overallRating: {
      type: Number,
      required: [true, 'Đánh giá tổng thể là bắt buộc'],
      min: [1, 'Đánh giá tối thiểu là 1 sao'],
      max: [5, 'Đánh giá tối đa là 5 sao'],
    },

    // Detailed Ratings
    vehicleRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    driverRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    punctualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    serviceRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    // Comment
    comment: {
      type: String,
      maxlength: [500, 'Bình luận không được vượt quá 500 ký tự'],
      trim: true,
    },

    // Media
    images: {
      type: [String],
      validate: {
        validator(v) {
          return v.length <= 5;
        },
        message: 'Tối đa 5 hình ảnh',
      },
      default: [],
    },

    // Operator Response
    operatorResponse: {
      type: String,
      maxlength: [1000, 'Phản hồi không được vượt quá 1000 ký tự'],
      trim: true,
    },
    respondedAt: {
      type: Date,
    },

    // Status
    isPublished: {
      type: Boolean,
      default: true,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const sanitizedRet = { ...ret };
        Reflect.deleteProperty(sanitizedRet, '__v');
        return sanitizedRet;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for performance (compound indexes only - single field indexes are defined in schema)
// Note: bookingId unique constraint is already defined in schema field
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ operatorId: 1, isPublished: 1 });
reviewSchema.index({ overallRating: -1, createdAt: -1 });

// Virtual populate for user info
reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate for booking info
reviewSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware - Calculate average detailed ratings if not provided
reviewSchema.pre('save', function (next) {
  // If detailed ratings are provided, ensure overall rating matches
  const detailedRatings = [
    this.vehicleRating,
    this.driverRating,
    this.punctualityRating,
    this.serviceRating,
  ].filter((r) => r !== null && r !== undefined);

  if (detailedRatings.length > 0) {
    // If overall rating not provided, calculate from detailed ratings
    if (!this.overallRating) {
      const sum = detailedRatings.reduce((acc, rating) => acc + rating, 0);
      this.overallRating = Math.round(sum / detailedRatings.length);
    }
  }

  next();
});

// Static method - Get average rating for operator
reviewSchema.statics.getOperatorAverageRating = async function (operatorId) {
  const result = await this.aggregate([
    {
      $match: {
        operatorId: mongoose.Types.ObjectId(operatorId),
        isPublished: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$overallRating' },
        totalReviews: { $sum: 1 },
        averageVehicleRating: { $avg: '$vehicleRating' },
        averageDriverRating: { $avg: '$driverRating' },
        averagePunctualityRating: { $avg: '$punctualityRating' },
        averageServiceRating: { $avg: '$serviceRating' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      averageVehicleRating: 0,
      averageDriverRating: 0,
      averagePunctualityRating: 0,
      averageServiceRating: 0,
    };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: result[0].totalReviews,
    averageVehicleRating: Math.round(result[0].averageVehicleRating * 10) / 10,
    averageDriverRating: Math.round(result[0].averageDriverRating * 10) / 10,
    averagePunctualityRating: Math.round(result[0].averagePunctualityRating * 10) / 10,
    averageServiceRating: Math.round(result[0].averageServiceRating * 10) / 10,
  };
};

// Static method - Get reviews for trip
reviewSchema.statics.getTripReviews = async function (tripId, options = {}) {
  const { page = 1, limit = 10, sort = '-createdAt' } = options;

  const reviews = await this.find({
    tripId,
    isPublished: true,
  })
    .populate('userId', 'fullName avatar')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await this.countDocuments({ tripId, isPublished: true });

  return {
    reviews,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total,
      hasMore: page * limit < total,
    },
  };
};

// Static method - Get rating statistics
reviewSchema.statics.getRatingStatistics = async function (operatorId) {
  const stats = await this.aggregate([
    {
      $match: {
        operatorId: mongoose.Types.ObjectId(operatorId),
        isPublished: true,
      },
    },
    {
      $group: {
        _id: '$overallRating',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);

  // Format into rating distribution
  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  let totalReviews = 0;
  stats.forEach((stat) => {
    distribution[stat._id] = stat.count;
    totalReviews += stat.count;
  });

  // Calculate percentages
  const percentages = {};
  Object.keys(distribution).forEach((rating) => {
    percentages[rating] = totalReviews > 0 ? (distribution[rating] / totalReviews) * 100 : 0;
  });

  return {
    distribution,
    percentages,
    totalReviews,
  };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
