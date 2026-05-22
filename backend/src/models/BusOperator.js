const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * BusOperator Schema
 * Manages bus operator (company) information and verification status
 */
const BusOperatorSchema = new mongoose.Schema(
  {
    // Basic Info
    companyName: {
      type: String,
      required: [true, 'Tên công ty là bắt buộc'],
      unique: true,
      trim: true,
      maxlength: [200, 'Tên công ty không được quá 200 ký tự'],
    },
    operatorName: {
      type: String,
      trim: true,
      maxlength: [200, 'Tên hiển thị không được quá 200 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Email không hợp lệ',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false, // Don't include password in queries by default
    },

    // Business Info
    businessLicense: {
      type: String,
      required: [true, 'Giấy phép kinh doanh là bắt buộc'],
      trim: true,
    },
    taxCode: {
      type: String,
      required: [true, 'Mã số thuế là bắt buộc'],
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      maxlength: [1000, 'Mô tả không được quá 1000 ký tự'],
      default: '',
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        'URL website không hợp lệ',
      ],
    },

    // Address
    address: {
      street: {
        type: String,
        trim: true,
      },
      ward: {
        type: String,
        trim: true,
      },
      district: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: 'Vietnam',
      },
    },

    // Bank Info (for payment settlements)
    bankInfo: {
      bankName: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      accountHolder: {
        type: String,
        trim: true,
      },
    },

    // Approval Status
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Trạng thái xác thực phải là: pending, approved, hoặc rejected',
      },
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },

    // Rating & Reviews
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating không thể nhỏ hơn 0'],
      max: [5, 'Rating không thể lớn hơn 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng đánh giá không thể âm'],
    },

    // Statistics
    totalTrips: {
      type: Number,
      default: 0,
      min: [0, 'Số chuyến không thể âm'],
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Doanh thu không thể âm'],
    },

    // Commission
    commissionRate: {
      type: Number,
      default: 5,
      min: [0, 'Tỷ lệ hoa hồng không thể âm'],
      max: [100, 'Tỷ lệ hoa hồng không thể lớn hơn 100'],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: null,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (companyName and email already have unique: true in schema, which creates indexes)
BusOperatorSchema.index({ verificationStatus: 1 });
BusOperatorSchema.index({ averageRating: -1 });
BusOperatorSchema.index({ createdAt: -1 });

// Hash password before saving
BusOperatorSchema.pre('validate', function (next) {
  if (!this.operatorName && this.companyName) {
    this.operatorName = this.companyName;
  }
  next();
});

BusOperatorSchema.pre('save', async function (next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
BusOperatorSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Lỗi so sánh mật khẩu');
  }
};

// Static method to find by email
BusOperatorSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by company name
BusOperatorSchema.statics.findByCompanyName = function (companyName) {
  return this.findOne({ companyName });
};

// Virtual for full address
BusOperatorSchema.virtual('fullAddress').get(function () {
  if (!this.address) return '';

  const parts = [
    this.address.street,
    this.address.ward,
    this.address.district,
    this.address.city,
    this.address.country,
  ].filter(Boolean);

  return parts.join(', ');
});

// Virtual for role (always 'operator' for BusOperator)
BusOperatorSchema.virtual('role').get(function () {
  return 'operator';
});

// Virtual for verification status label (for display)
BusOperatorSchema.virtual('verificationStatusLabel').get(function () {
  const labels = {
    pending: 'Đang chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Bị từ chối',
  };
  return labels[this.verificationStatus] || this.verificationStatus;
});

// Instance method to approve verification
BusOperatorSchema.methods.approve = async function (adminId) {
  this.verificationStatus = 'approved';
  this.verifiedAt = new Date();
  this.verifiedBy = adminId;
  this.rejectionReason = null;
  return this.save();
};

// Instance method to reject verification
BusOperatorSchema.methods.reject = async function (adminId, reason) {
  this.verificationStatus = 'rejected';
  this.verifiedAt = new Date();
  this.verifiedBy = adminId;
  this.rejectionReason = reason;
  return this.save();
};

// Instance method to suspend operator
BusOperatorSchema.methods.suspend = async function (reason) {
  this.isSuspended = true;
  this.suspensionReason = reason;
  this.suspendedAt = new Date();
  return this.save();
};

// Instance method to resume operator
BusOperatorSchema.methods.resume = async function () {
  this.isSuspended = false;
  this.suspensionReason = null;
  this.suspendedAt = null;
  return this.save();
};

const BusOperator = mongoose.model('BusOperator', BusOperatorSchema);

module.exports = BusOperator;
