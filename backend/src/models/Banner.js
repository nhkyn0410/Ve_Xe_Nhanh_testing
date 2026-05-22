const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề banner là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Hình ảnh banner là bắt buộc'],
    },
    mobileImageUrl: {
      type: String, // Optional separate image for mobile
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    linkText: {
      type: String,
      trim: true,
      default: 'Xem thêm',
    },
    position: {
      type: String,
      enum: ['homepage', 'booking', 'routes', 'footer'],
      default: 'homepage',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
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

// Indexes
bannerSchema.index({ position: 1, order: 1 });
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if banner is currently active based on dates
bannerSchema.virtual('isCurrentlyActive').get(function () {
  if (!this.isActive) return false;

  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;

  return true;
});

// Instance method - increment view count
bannerSchema.methods.incrementView = function () {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method - increment click count
bannerSchema.methods.incrementClick = function () {
  this.clickCount += 1;
  return this.save({ validateBeforeSave: false });
};

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
