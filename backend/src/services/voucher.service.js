const mongoose = require('mongoose');
const Voucher = require('../models/Voucher');
const VoucherWallet = require('../models/VoucherWallet');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

// logger not used in this service

/**
 * Voucher Service
 * Manages voucher creation, validation, and usage tracking
 */
class VoucherService {
  /**
   * Create a new voucher
   * @param {Object} voucherData - Voucher data
   * @param {string} creatorId - ID of creator (operator or admin)
   * @param {string} creatorModel - 'BusOperator' or 'Admin'
   * @returns {Promise<Voucher>} Created voucher
   */
  static async create(voucherData, creatorId, creatorModel = 'BusOperator') {
    const {
      code,
      name,
      description,
      operatorId,
      discountType,
      discountValue,
      maxDiscountAmount,
      minBookingAmount,
      maxUsageTotal,
      maxUsagePerCustomer,
      validFrom,
      validUntil,
      applicableRoutes,
      applicableCustomers,
      applicableCustomerTiers,
      applicableDaysOfWeek,
      isActive,
    } = voucherData;

    // Check if code already exists
    const existingVoucher = await Voucher.findByCode(code);
    if (existingVoucher) {
      throw new Error('Mã voucher đã tồn tại');
    }

    // Validate dates
    const startDate = new Date(validFrom);
    const endDate = new Date(validUntil);
    if (startDate >= endDate) {
      throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
    }

    // Create voucher
    const voucher = await Voucher.create({
      code,
      name,
      description,
      operatorId: operatorId || null,
      discountType,
      discountValue,
      maxDiscountAmount,
      minBookingAmount: minBookingAmount || 0,
      maxUsageTotal,
      maxUsagePerCustomer: maxUsagePerCustomer || 1,
      validFrom: startDate,
      validUntil: endDate,
      applicableRoutes: applicableRoutes || [],
      applicableCustomers: applicableCustomers || [],
      applicableCustomerTiers: applicableCustomerTiers || [],
      applicableDaysOfWeek: applicableDaysOfWeek || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: creatorId,
      createdByModel: creatorModel,
    });

    return voucher;
  }

  /**
   * Validate voucher for booking
   * @param {string} code - Voucher code
   * @param {Object} bookingInfo - Booking information
   * @returns {Promise<Object>} Validation result with discount amount
   */
  static async validateForBooking(code, bookingInfo) {
    const { tripId, customerId, totalAmount } = bookingInfo;

    // Find voucher
    const voucher = await Voucher.findByCode(code);
    if (!voucher) {
      throw new Error('Mã voucher không tồn tại');
    }

    // Get trip information
    const trip = await Trip.findById(tripId).populate('routeId');
    if (!trip) {
      throw new Error('Không tìm thấy chuyến xe');
    }

    // Check operator match (if voucher is operator-specific)
    if (voucher.operatorId && voucher.operatorId.toString() !== trip.operatorId.toString()) {
      throw new Error('Voucher không áp dụng cho nhà xe này');
    }

    // Get day of week from trip departure time
    const dayOfWeek = new Date(trip.departureTime).getDay();

    // Check if voucher can be used
    const canUse = voucher.canBeUsed({
      bookingAmount: totalAmount,
      customerId,
      routeId: trip.routeId._id,
      dayOfWeek,
    });

    if (!canUse.valid) {
      throw new Error(canUse.reason);
    }

    // Check usage per customer
    if (customerId && voucher.maxUsagePerCustomer) {
      const customerUsageCount = await Booking.countDocuments({
        customerId,
        voucherId: voucher._id,
        status: { $in: ['confirmed', 'completed'] },
      });

      if (customerUsageCount >= voucher.maxUsagePerCustomer) {
        throw new Error(
          `Bạn đã sử dụng tối đa ${voucher.maxUsagePerCustomer} lần cho voucher này`
        );
      }
    }

    // Calculate discount
    const discountAmount = voucher.calculateDiscount(totalAmount);

    return {
      valid: true,
      voucher: {
        id: voucher._id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        source: voucher.operatorId ? 'operator' : 'platform',
        sourceLabel: voucher.operatorId ? 'Nhà xe' : 'Vé Xe Nhanh',
      },
      discountAmount,
      finalAmount: Math.max(0, totalAmount - discountAmount),
    };
  }

  /**
   * Apply voucher to booking (increment usage)
   * @param {string} voucherId - Voucher ID
   * @param {string|null} customerId - Customer ID, if the booking belongs to a logged-in user
   * @returns {Promise<void>}
   */
  static async applyToBooking(voucherId, customerId = null) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }

    await voucher.incrementUsage();

    if (customerId) {
      await VoucherWallet.updateOne(
        {
          customerId,
          voucherId,
          status: { $ne: 'removed' },
        },
        {
          $set: {
            status: 'used',
            usedAt: new Date(),
          },
        }
      );
    }
  }

  /**
   * Release voucher from cancelled booking (decrement usage)
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<void>}
   */
  static async releaseFromBooking(voucherId) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return; // Voucher might have been deleted
    }

    if (voucher.currentUsageCount > 0) {
      voucher.currentUsageCount -= 1;
      await voucher.save();
    }
  }

  /**
   * Get voucher by ID
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<Voucher>} Voucher
   */
  static async getById(voucherId) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }
    return voucher;
  }

  /**
   * Get voucher by code
   * @param {string} code - Voucher code
   * @returns {Promise<Voucher>} Voucher
   */
  static async getByCode(code) {
    const voucher = await Voucher.findByCode(code);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }
    return voucher;
  }

  /**
   * Get active vouchers
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Active vouchers
   */
  static async getActive(filters = {}) {
    return Voucher.findActive(filters);
  }

  /**
   * Get vouchers for operator
   * @param {string} operatorId - Operator ID
   * @returns {Promise<Array>} Vouchers
   */
  static async getByOperator(operatorId) {
    return Voucher.findByOperator(operatorId);
  }

  /**
   * Update voucher
   * @param {string} voucherId - Voucher ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Voucher>} Updated voucher
   */
  static async update(voucherId, updateData) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }

    // Don't allow changing code or usage count manually
    const { code: _code, currentUsageCount: _currentUsageCount, ...allowedUpdates } = updateData;

    Object.assign(voucher, allowedUpdates);
    await voucher.save();

    return voucher;
  }

  /**
   * Activate voucher
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<Voucher>} Activated voucher
   */
  static async activate(voucherId) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }

    voucher.isActive = true;
    await voucher.save();

    return voucher;
  }

  /**
   * Deactivate voucher
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<Voucher>} Deactivated voucher
   */
  static async deactivate(voucherId) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }

    voucher.isActive = false;
    await voucher.save();

    return voucher;
  }

  /**
   * Delete voucher
   * @param {string} voucherId - Voucher ID
   * @returns {Promise<void>}
   */
  static async delete(voucherId) {
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }

    // Check if voucher has been used
    if (voucher.currentUsageCount > 0) {
      throw new Error('Không thể xóa voucher đã được sử dụng. Hãy vô hiệu hóa thay vì xóa.');
    }

    await Voucher.deleteOne({ _id: voucherId });
  }

  /**
   * Get voucher statistics
   * @param {string} operatorId - Operator ID (optional)
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics(operatorId = null) {
    const stats = await Voucher.getStatistics(operatorId);

    // Get top used vouchers
    const query = operatorId ? { operatorId } : {};
    const topUsed = await Voucher.find(query)
      .sort({ currentUsageCount: -1 })
      .limit(10)
      .select('code name currentUsageCount maxUsageTotal discountType discountValue');

    stats.topUsedVouchers = topUsed;

    return stats;
  }

  /**
   * Get public vouchers (for customers to browse)
   * @param {Object} filters - Filters
   * @returns {Promise<Array>} Public vouchers
   */
  static async getPublicVouchers(filters = {}) {
    const { operatorId, routeId } = filters;

    const baseQuery = {
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      // Only show vouchers with no specific customer restrictions
      applicableCustomers: { $size: 0 },
    };
    const conditions = [baseQuery];

    // Filter by operator (or system-wide)
    if (operatorId) {
      conditions.push({ $or: [{ operatorId }, { operatorId: null }] });
    } else {
      conditions.push({ operatorId: null }); // Only system-wide vouchers
    }

    // Filter by route if specified
    if (routeId) {
      conditions.push({
        $or: [
          { applicableRoutes: { $size: 0 } }, // No route restriction
          { applicableRoutes: routeId }, // Applicable to this route
        ],
      });
    }

    const query = conditions.length > 1 ? { $and: conditions } : baseQuery;
    const vouchers = await Voucher.find(query)
      .select(
        'code name description operatorId discountType discountValue maxDiscountAmount minBookingAmount maxUsageTotal currentUsageCount validUntil'
      )
      .sort({ validUntil: 1 })
      .limit(20);

    return vouchers.map((voucher) => this.toPublicVoucher(voucher));
  }

  static toPublicVoucher(voucher, walletStatus = null) {
    const source = voucher.operatorId ? 'operator' : 'platform';
    return {
      id: voucher._id,
      code: voucher.code,
      name: voucher.name,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountAmount: voucher.maxDiscountAmount,
      minBookingAmount: voucher.minBookingAmount,
      validUntil: voucher.validUntil,
      remainingUsage: voucher.remainingUsage,
      source,
      scope: source,
      sourceLabel: source === 'platform' ? 'Vé Xe Nhanh' : 'Nhà xe',
      walletStatus,
      isSaved: walletStatus === 'saved',
    };
  }

  static async getPlatformVouchers() {
    return Voucher.find({ operatorId: null }).sort({ createdAt: -1 });
  }

  static async getPlatformStatistics() {
    const query = { operatorId: null };

    const [total, active, expired, totalUsage, topUsed] = await Promise.all([
      Voucher.countDocuments(query),
      Voucher.countDocuments({ ...query, isActive: true }),
      Voucher.countDocuments({ ...query, validUntil: { $lt: new Date() } }),
      Voucher.aggregate([
        { $match: query },
        { $group: { _id: null, totalUsage: { $sum: '$currentUsageCount' } } },
      ]),
      Voucher.find(query)
        .sort({ currentUsageCount: -1 })
        .limit(10)
        .select('code name currentUsageCount maxUsageTotal discountType discountValue'),
    ]);

    return {
      totalVouchers: total,
      activeVouchers: active,
      expiredVouchers: expired,
      totalUsageCount: totalUsage[0]?.totalUsage || 0,
      topUsedVouchers: topUsed,
    };
  }

  static async saveToWallet(customerId, { voucherId, code }) {
    const voucher = voucherId ? await Voucher.findById(voucherId) : await Voucher.findByCode(code);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }

    const now = new Date();
    if (!voucher.isActive || voucher.validFrom > now || voucher.validUntil < now) {
      throw new Error('Voucher không còn hiệu lực');
    }

    if (voucher.applicableCustomers.length > 0) {
      const allowed = voucher.applicableCustomers.some((id) => id.toString() === customerId.toString());
      if (!allowed) {
        throw new Error('Voucher không áp dụng cho tài khoản này');
      }
    }

    const walletItem = await VoucherWallet.findOneAndUpdate(
      { customerId, voucherId: voucher._id },
      {
        $set: {
          status: 'saved',
          removedAt: null,
          usedAt: null,
          savedAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('voucherId');

    return this.toPublicVoucher(walletItem.voucherId, walletItem.status);
  }

  static async getWallet(customerId) {
    const items = await VoucherWallet.find({
      customerId,
      status: { $ne: 'removed' },
    })
      .populate('voucherId')
      .sort({ updatedAt: -1 });

    const now = new Date();
    return items
      .filter((item) => item.voucherId)
      .map((item) => {
        const expired =
          !item.voucherId.isActive ||
          item.voucherId.validUntil < now ||
          item.voucherId.validFrom > now;
        const status = expired && item.status === 'saved' ? 'expired' : item.status;
        return this.toPublicVoucher(item.voucherId, status);
      });
  }

  static async removeFromWallet(customerId, voucherId) {
    await VoucherWallet.updateOne(
      { customerId, voucherId },
      {
        $set: {
          status: 'removed',
          removedAt: new Date(),
        },
      }
    );
  }

  /**
   * Generate voucher code
   * @param {string} prefix - Prefix for code (default: 'QR')
   * @param {number} length - Length of random part (default: 6)
   * @returns {string} Generated code
   */
  static generateCode(prefix = 'QR', length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix;

    for (let i = 0; i < length; i += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  /**
   * Get detailed usage report for a voucher
   * @param {string} voucherId - Voucher ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Usage report
   */
  static async getUsageReport(voucherId, options = {}) {
    const { startDate, endDate, page = 1, limit = 20 } = options;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      throw new Error('Không tìm thấy voucher');
    }

    // Build query for bookings that used this voucher
    const query = {
      voucherId: new mongoose.Types.ObjectId(voucherId),
      status: { $in: ['confirmed', 'completed', 'cancelled'] },
    };

    // Add date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Count total bookings
    const total = await Booking.countDocuments(query);

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate('tripId', 'departureTime')
      .populate({
        path: 'tripId',
        populate: {
          path: 'routeId',
          select: 'routeName origin.city destination.city',
        },
      })
      .select('bookingCode contactEmail contactPhone total discount createdAt status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Calculate statistics
    const stats = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: '$discount' },
          totalRevenue: { $sum: '$finalPrice' },  // Use finalPrice instead of total
          confirmedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalDiscount: 0,
      totalRevenue: 0,
      confirmedCount: 0,
      completedCount: 0,
      cancelledCount: 0,
    };

    return {
      voucher: {
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        currentUsageCount: voucher.currentUsageCount,
        maxUsageTotal: voucher.maxUsageTotal,
        validFrom: voucher.validFrom,
        validUntil: voucher.validUntil,
        isActive: voucher.isActive,
      },
      statistics,
      bookings: bookings.map((booking) => ({
        bookingCode: booking.bookingCode,
        route: booking.tripId?.routeId
          ? `${booking.tripId.routeId.origin?.city} - ${booking.tripId.routeId.destination?.city}`
          : 'N/A',
        departureTime: booking.tripId?.departureTime,
        customerEmail: booking.contactEmail,
        customerPhone: booking.contactPhone,
        totalAmount: booking.total,
        discountAmount: booking.discount,
        status: booking.status,
        bookedAt: booking.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }
}

module.exports = VoucherService;
