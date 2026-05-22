const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
    },
    password: {
      type: String,
      required() {
        // Password chỉ bắt buộc nếu không phải OAuth user
        return !this.googleId && !this.facebookId;
      },
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false, // Không trả về password khi query
    },
    fullName: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    avatar: {
      type: String,
      default: null,
    },

    // Role
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },

    // OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    phoneVerificationOTP: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },

    // Security
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },

    // Preferences - Danh sách hành khách thường đi (max 5)
    savedPassengers: [
      {
        fullName: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
        },
        idCard: {
          type: String,
          required: true,
        },
      },
    ],

    // Loyalty Program
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    pointsHistory: [
      {
        points: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['earn', 'redeem', 'expire'],
          default: 'earn',
        },
        tripId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Trip',
        },
        expiresAt: {
          type: Date,
          // Points expire after 1 year
          default() {
            if (this.type === 'earn') {
              return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            }
            return null;
          },
        },
        isExpired: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: {
      type: String,
    },
    blockedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
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

// Indexes for performance (compound indexes only - single field indexes are defined in schema via unique: true)
userSchema.index({ createdAt: -1 });
userSchema.index({ loyaltyTier: 1, totalPoints: -1 });

// Pre-save middleware - Hash password before saving
userSchema.pre('save', async function (next) {
  // Chỉ hash password nếu nó được thay đổi hoặc là mới
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password với bcrypt (salt rounds: 12)
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method - So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    logger.info('=== so sánh mật khẩu ===');
    logger.info('Độ dài mật khẩu ứng viên:', candidatePassword ? candidatePassword.length : 0);
    logger.info('Hash lưu trữ tồn tại:', !!this.password);
    logger.info(
      'Xem trước hash lưu trữ:',
      this.password ? `${this.password.substring(0, 20)}...` : 'KHÔNG CÓ'
    );

    const result = await bcrypt.compare(candidatePassword, this.password);
    logger.info('Kết quả so sánh:', result);
    return result;
  } catch (error) {
    logger.info('LỖI khi so sánh mật khẩu:', error.message);
    throw new Error('Lỗi khi so sánh mật khẩu');
  }
};

// Instance method - Tạo password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token và lưu vào database
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Token hết hạn sau 10 phút
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Trả về token chưa hash để gửi qua email
  return resetToken;
};

// Instance method - Tạo email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash token và lưu vào database
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Trả về token chưa hash để gửi qua email
  return verificationToken;
};

// Instance method - Tạo OTP cho phone verification
userSchema.methods.createPhoneOTP = function () {
  // Tạo OTP 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu OTP vào database (có thể hash nếu cần)
  this.phoneVerificationOTP = otp;

  // OTP hết hạn sau 5 phút
  this.otpExpires = Date.now() + 5 * 60 * 1000;

  return otp;
};

// Instance method - Thêm loyalty points
userSchema.methods.addPoints = function (points, reason, tripId = null) {
  this.totalPoints += points;

  this.pointsHistory.push({
    points,
    reason,
    type: 'earn',
    tripId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  });

  // Update loyalty tier based on total points
  this.updateLoyaltyTier();
};

// Instance method - Redeem points
userSchema.methods.redeemPoints = function (points, reason) {
  if (this.totalPoints < points) {
    throw new Error('Không đủ điểm để đổi');
  }

  this.totalPoints -= points;

  this.pointsHistory.push({
    points: -points, // Negative for redemption
    reason,
    type: 'redeem',
  });

  // Update loyalty tier
  this.updateLoyaltyTier();
};

// Instance method - Remove expired points
userSchema.methods.removeExpiredPoints = async function () {
  const now = new Date();
  let expiredPoints = 0;

  // Find all expired points that haven't been marked as expired
  this.pointsHistory.forEach((entry) => {
    if (entry.type === 'earn' && !entry.isExpired && entry.expiresAt && entry.expiresAt < now) {
      entry.isExpired = true;
      expiredPoints += entry.points;
    }
  });

  if (expiredPoints > 0) {
    this.totalPoints -= expiredPoints;

    // Add expiry record
    this.pointsHistory.push({
      points: -expiredPoints,
      reason: 'Điểm hết hạn',
      type: 'expire',
    });

    // Update loyalty tier
    this.updateLoyaltyTier();

    logger.info(`Đã xóa ${expiredPoints} điểm hết hạn cho người dùng ${this._id}`);
  }

  return expiredPoints;
};

// Instance method - Update loyalty tier
userSchema.methods.updateLoyaltyTier = function () {
  if (this.totalPoints >= 10000) {
    this.loyaltyTier = 'platinum';
  } else if (this.totalPoints >= 5000) {
    this.loyaltyTier = 'gold';
  } else if (this.totalPoints >= 2000) {
    this.loyaltyTier = 'silver';
  } else {
    this.loyaltyTier = 'bronze';
  }
};

// Instance method - Get tier benefits
userSchema.methods.getTierBenefits = function () {
  const benefits = {
    bronze: {
      pointsMultiplier: 1,
      discountPercentage: 0,
      prioritySupport: false,
      features: ['Tích điểm cơ bản'],
    },
    silver: {
      pointsMultiplier: 1.2,
      discountPercentage: 5,
      prioritySupport: false,
      features: ['Tích điểm x1.2', 'Giảm 5% cho mỗi booking', 'Hủy vé miễn phí'],
    },
    gold: {
      pointsMultiplier: 1.5,
      discountPercentage: 10,
      prioritySupport: true,
      features: [
        'Tích điểm x1.5',
        'Giảm 10% cho mỗi booking',
        'Hủy vé miễn phí',
        'Hỗ trợ ưu tiên',
        'Đổi lịch miễn phí',
      ],
    },
    platinum: {
      pointsMultiplier: 2,
      discountPercentage: 15,
      prioritySupport: true,
      features: [
        'Tích điểm x2',
        'Giảm 15% cho mỗi booking',
        'Hủy vé miễn phí',
        'Hỗ trợ ưu tiên 24/7',
        'Đổi lịch miễn phí',
        'Phòng chờ VIP',
        'Quà tặng sinh nhật',
      ],
    },
  };

  return benefits[this.loyaltyTier] || benefits.bronze;
};

// Static method - Tìm user bằng email hoặc phone
userSchema.statics.findByEmailOrPhone = function (identifier) {
  logger.info('=== tìm theo email hoặc điện thoại ===');
  logger.info('Mã định danh gốc:', identifier);
  logger.info('Mã định danh chữ thường:', identifier.toLowerCase());
  logger.info('Truy vấn:', {
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });

  return this.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
