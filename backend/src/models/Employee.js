const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Employee Schema
 * Quản lý nhân viên của nhà xe (tài xế và quản lý chuyến)
 */
const EmployeeSchema = new mongoose.Schema(
  {
    // Owner
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Operator ID là bắt buộc'],
      index: true,
    },

    // Employee Info
    employeeCode: {
      type: String,
      required: [true, 'Mã nhân viên là bắt buộc'],
      uppercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },

    idCard: {
      type: String,
      trim: true,
      validate: {
        validator(v) {
          if (!v) return true; // Optional field
          return /^[0-9]{9,12}$/.test(v); // CMND: 9 digits, CCCD: 12 digits
        },
        message: 'CMND/CCCD không hợp lệ (9-12 chữ số)',
      },
    },

    address: {
      type: String,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      validate: {
        validator(v) {
          if (!v) return true;
          const age = (new Date() - new Date(v)) / (365.25 * 24 * 60 * 60 * 1000);
          return age >= 18 && age <= 70; // Age between 18 and 70
        },
        message: 'Tuổi nhân viên phải từ 18-70',
      },
    },

    // Authentication
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false, // Don't return password by default
    },

    // Role
    role: {
      type: String,
      enum: {
        values: ['driver', 'trip_manager'],
        message: 'Role phải là driver hoặc trip_manager',
      },
      required: [true, 'Role là bắt buộc'],
    },

    // Driver-specific fields
    licenseNumber: {
      type: String,
      uppercase: true,
      trim: true,
      validate: {
        validator(v) {
          // Only required for drivers
          if (this.role === 'driver') {
            return !!v;
          }
          return true;
        },
        message: 'Số giấy phép lái xe là bắt buộc cho tài xế',
      },
    },

    licenseClass: {
      type: String,
      uppercase: true,
      enum: {
        values: ['', 'B', 'C', 'D', 'E', 'FB', 'FC', 'FD', 'FE'],
        message: 'Hạng giấy phép không hợp lệ',
      },
      validate: {
        validator(v) {
          // Only required for drivers
          if (this.role === 'driver') {
            return !!v;
          }
          return true;
        },
        message: 'Hạng giấy phép là bắt buộc cho tài xế',
      },
    },

    licenseExpiry: {
      type: Date,
      validate: {
        validator(v) {
          // Only required for drivers
          if (this.role === 'driver') {
            if (!v) return false;
            return new Date(v) > new Date(); // Must be in the future
          }
          return true;
        },
        message: 'Giấy phép lái xe đã hết hạn hoặc không hợp lệ',
      },
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['active', 'on_leave', 'suspended', 'terminated'],
        message: 'Trạng thái không hợp lệ',
      },
      default: 'active',
    },

    // Work History
    hireDate: {
      type: Date,
      default: Date.now,
    },

    terminationDate: {
      type: Date,
      validate: {
        validator(v) {
          if (!v) return true;
          return v > this.hireDate; // Must be after hire date
        },
        message: 'Ngày nghỉ việc phải sau ngày tuyển dụng',
      },
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
// Unique employee code per operator
EmployeeSchema.index({ operatorId: 1, employeeCode: 1 }, { unique: true });

// Unique contact info per operator
EmployeeSchema.index({ operatorId: 1, phone: 1 }, { unique: true });
EmployeeSchema.index(
  { operatorId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $type: 'string' },
    },
  },
);

// Query by operator, role, and status
EmployeeSchema.index({ operatorId: 1, role: 1, status: 1 });

// Search by phone
EmployeeSchema.index({ phone: 1 });

/**
 * Pre-save Middleware
 * Hash password before saving
 */
EmployeeSchema.pre('save', async function (next) {
  if (typeof this.email === 'string' && this.email.trim() === '') {
    this.email = undefined;
  }

  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Methods
 */

/**
 * Compare password for authentication
 * @param {String} candidatePassword - Password to compare
 * @returns {Promise<Boolean>}
 */
EmployeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if employee can be assigned to trips
 * @returns {Boolean}
 */
EmployeeSchema.methods.canBeAssignedToTrips = function () {
  if (this.status !== 'active') return false;

  // For drivers, check license expiry
  if (this.role === 'driver') {
    return this.licenseExpiry && new Date(this.licenseExpiry) > new Date();
  }

  return true;
};

/**
 * Get employee display info (without sensitive data)
 * @returns {Object}
 */
EmployeeSchema.methods.getPublicInfo = function () {
  return {
    _id: this._id,
    employeeCode: this.employeeCode,
    fullName: this.fullName,
    phone: this.phone,
    email: this.email,
    role: this.role,
    status: this.status,
    licenseClass: this.licenseClass,
    hireDate: this.hireDate,
  };
};

/**
 * Virtual: Years of service
 */
EmployeeSchema.virtual('yearsOfService').get(function () {
  const endDate = this.terminationDate || new Date();
  const years = (endDate - this.hireDate) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0, years.toFixed(1));
});

/**
 * Virtual: Is license expiring soon (within 30 days)
 */
EmployeeSchema.virtual('isLicenseExpiringSoon').get(function () {
  if (this.role !== 'driver' || !this.licenseExpiry) return false;

  const daysUntilExpiry = (new Date(this.licenseExpiry) - new Date()) / (24 * 60 * 60 * 1000);
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
});

/**
 * Static Methods
 */

/**
 * Find employees by operator and filters
 * @param {ObjectId} operatorId
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
EmployeeSchema.statics.findByOperator = function (operatorId, filters = {}) {
  const query = { operatorId };

  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { fullName: new RegExp(filters.search, 'i') },
      { employeeCode: new RegExp(filters.search, 'i') },
      { phone: new RegExp(filters.search, 'i') },
    ];
  }

  return this.find(query).select('-password').sort({ createdAt: -1 });
};

/**
 * Find available employees for trip assignment
 * @param {ObjectId} operatorId
 * @param {String} role - 'driver' or 'trip_manager'
 * @returns {Promise<Array>}
 */
EmployeeSchema.statics.findAvailableForTrips = function (operatorId, role) {
  const query = {
    operatorId,
    role,
    status: 'active',
  };

  // For drivers, ensure license is valid
  if (role === 'driver') {
    query.licenseExpiry = { $gt: new Date() };
  }

  return this.find(query).select('-password').sort({ fullName: 1 });
};

module.exports = mongoose.model('Employee', EmployeeSchema);
