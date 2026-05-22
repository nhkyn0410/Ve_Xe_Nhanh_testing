const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    // Basic Info
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
    },
    description: {
      type: String,
      required: [true, 'Mô tả là bắt buộc'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'booking',
        'payment',
        'service',
        'driver',
        'vehicle',
        'refund',
        'technical',
        'other',
      ],
      required: [true, 'Danh mục là bắt buộc'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'open',
    },

    // User Info
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
      required: true,
    },

    // Related Entities
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },

    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
    },

    // Attachments
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Notes and Comments
    notes: [
      {
        content: {
          type: String,
          required: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        addedByRole: {
          type: String,
          enum: ['admin', 'customer'],
          required: true,
        },
        isInternal: {
          type: Boolean,
          default: false, // Internal notes only visible to admins
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Resolution
    resolution: {
      type: String,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },

    // Satisfaction
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    satisfactionFeedback: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for performance (ticketNumber already has unique: true in schema, which creates an index)
complaintSchema.index({ userId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ bookingId: 1 });
complaintSchema.index({ createdAt: -1 });

// Generate unique ticket number before validation so the required check passes.
complaintSchema.pre('validate', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    // Generate ticket number: TCKT-YYYYMMDD-XXXXX
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get count of tickets today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const sequence = String(count + 1).padStart(5, '0');
    this.ticketNumber = `TCKT-${year}${month}${day}-${sequence}`;
  }

  next();
});

// Instance method - Add note to complaint
complaintSchema.methods.addNote = function (content, userId, userRole, isInternal = false) {
  this.notes.push({
    content,
    addedBy: userId,
    addedByRole: userRole,
    isInternal,
  });
  return this.save();
};

// Instance method - Assign complaint
complaintSchema.methods.assignTo = function (adminId) {
  this.assignedTo = adminId;
  this.assignedAt = Date.now();
  if (this.status === 'open') {
    this.status = 'in_progress';
  }
  return this.save();
};

// Instance method - Resolve complaint
complaintSchema.methods.resolve = function (resolution, adminId) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolvedBy = adminId;
  this.resolvedAt = Date.now();
  return this.save();
};

// Instance method - Close complaint
complaintSchema.methods.close = function () {
  this.status = 'closed';
  this.closedAt = Date.now();
  return this.save();
};

// Instance method - Add satisfaction rating
complaintSchema.methods.addSatisfactionRating = function (rating, feedback = '') {
  if (this.status !== 'resolved' && this.status !== 'closed') {
    throw new Error('Chỉ có thể đánh giá khi khiếu nại đã được giải quyết');
  }
  this.satisfactionRating = rating;
  this.satisfactionFeedback = feedback;
  return this.save();
};

// Static method - Get statistics
complaintSchema.statics.getStatistics = async function (startDate, endDate) {
  const match = {};
  if (startDate && endDate) {
    match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const [stats] = await this.aggregate([
    { $match: match },
    {
      $facet: {
        byStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
            },
          },
        ],
        byPriority: [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
        ],
        avgResolutionTime: [
          {
            $match: { resolvedAt: { $exists: true } },
          },
          {
            $project: {
              resolutionTime: {
                $subtract: ['$resolvedAt', '$createdAt'],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgTime: { $avg: '$resolutionTime' },
            },
          },
        ],
        satisfaction: [
          {
            $match: { satisfactionRating: { $exists: true } },
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$satisfactionRating' },
              totalRatings: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  return stats;
};

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
