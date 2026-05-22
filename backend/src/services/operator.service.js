const mongoose = require('mongoose');
const BusOperator = require('../models/BusOperator');
const Bus = require('../models/Bus');
const Review = require('../models/Review');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const AuthService = require('./auth.service');


/**
 * Operator Service
 * Xử lý logic liên quan đến bus operators
 */
class OperatorService {
  /**
   * Đăng ký nhà xe mới
   * @param {Object} operatorData - Thông tin nhà xe
   * @returns {Object} Operator và tokens
   */
  static async register(operatorData) {
    const {
      companyName,
      operatorName,
      email,
      phone,
      password,
      businessLicense,
      taxCode,
      address,
      bankInfo,
      description,
      website,
    } = operatorData;

    // Kiểm tra email đã tồn tại
    const existingOperator = await BusOperator.findByEmail(email);
    if (existingOperator) {
      throw new Error('Email đã được sử dụng');
    }

    // Kiểm tra tên công ty đã tồn tại
    const existingCompany = await BusOperator.findByCompanyName(companyName);
    if (existingCompany) {
      throw new Error('Tên công ty đã được sử dụng');
    }

    // Tạo operator mới
    const operator = await BusOperator.create({
      companyName,
      operatorName: operatorName || companyName,
      email: email.toLowerCase(),
      phone,
      password,
      businessLicense,
      taxCode,
      address,
      bankInfo,
      description,
      website,
      verificationStatus: 'pending',
    });

    // Tạo tokens cho operator (tương tự như user)
    const accessToken = AuthService.generateAccessToken(
      operator, // Pass operator object directly, not destructured
      false
    );

    const refreshToken = AuthService.generateRefreshToken(
      operator, // Pass operator object directly
      false
    );

    // Chuẩn bị response (loại bỏ sensitive data)
    const operatorResponse = operator.toObject();
    delete operatorResponse.password;

    return {
      operator: operatorResponse,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Đăng nhập cho operator
   * @param {String} email - Email
   * @param {String} password - Password
   * @param {Boolean} rememberMe - Remember me option
   * @returns {Object} Operator và tokens
   */
  static async login(email, password, rememberMe = false) {
    // Tìm operator và select password để so sánh
    const operator = await BusOperator.findByEmail(email).select('+password');

    if (!operator) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra account status
    if (operator.isSuspended) {
      throw new Error(
        `Tài khoản đã bị tạm ngưng. Lý do: ${operator.suspensionReason || 'Không rõ'}`
      );
    }

    if (!operator.isActive) {
      throw new Error('Tài khoản không hoạt động');
    }

    // So sánh password
    const isPasswordValid = await operator.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Tạo tokens
    const accessToken = AuthService.generateAccessToken(
      operator, // Pass operator object directly
      rememberMe
    );

    const refreshToken = AuthService.generateRefreshToken(
      operator, // Pass operator object directly
      rememberMe
    );

    // Chuẩn bị response
    const operatorResponse = operator.toObject();
    delete operatorResponse.password;

    return {
      operator: operatorResponse,
      accessToken,
      refreshToken,
    };
  }

  static getInitials(companyName = 'NX') {
    return companyName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  static getBrandColor(operatorId = '') {
    const palette = ['#E89B26', '#006481', '#1D4ED8', '#00613D', '#D18A1E'];
    const index = String(operatorId)
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
    return palette[index];
  }

  static formatFullAddress(address = {}) {
    return [address.street, address.ward, address.district, address.city, address.country]
      .filter(Boolean)
      .join(', ');
  }

  static async getPublicProfile(operatorId) {
    const objectId = new mongoose.Types.ObjectId(operatorId);
    const now = new Date();

    const [operator, fleetSize, routes, routeStats, ratingSummary, reviews] = await Promise.all([
      BusOperator.findOne({ _id: objectId, isActive: true, isSuspended: false }).lean(),
      Bus.countDocuments({ operatorId: objectId, status: { $ne: 'retired' } }),
      Route.find({ operatorId: objectId, isActive: true })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Trip.aggregate([
        {
          $match: {
            operatorId: objectId,
            status: 'scheduled',
            departureTime: { $gte: now },
          },
        },
        {
          $group: {
            _id: '$routeId',
            trips: { $sum: 1 },
            minPrice: { $min: '$finalPrice' },
            maxPrice: { $max: '$finalPrice' },
          },
        },
      ]),
      Review.aggregate([
        { $match: { operatorId: objectId, isPublished: true } },
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
      ]),
      Review.find({ operatorId: objectId, isPublished: true })
        .populate('userId', 'fullName avatar')
        .populate({
          path: 'tripId',
          select: 'routeId departureTime',
          populate: {
            path: 'routeId',
            select: 'origin destination',
          },
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    if (!operator) {
      throw new Error('Nhà xe không tồn tại hoặc đang tạm ngưng');
    }

    const statsByRoute = new Map(routeStats.map((stat) => [String(stat._id), stat]));
    const rating = ratingSummary[0] || {};
    const averageRating = Number((rating.averageRating || operator.averageRating || 0).toFixed(1));
    const totalReviews = rating.totalReviews || operator.totalReviews || 0;
    const displayName = operator.operatorName || operator.companyName;

    return {
      operator: {
        id: operator._id,
        companyName: operator.companyName,
        operatorName: displayName,
        shortName: OperatorService.getInitials(displayName),
        color: OperatorService.getBrandColor(operator._id),
        logo: operator.logo,
        description: operator.description,
        email: operator.email,
        phone: operator.phone,
        website: operator.website,
        address: operator.address,
        fullAddress: OperatorService.formatFullAddress(operator.address),
        averageRating,
        totalReviews,
        fleetSize,
        routeCount: routes.length,
        totalTrips: operator.totalTrips,
        foundedYear: (operator.verifiedAt || operator.createdAt)?.getFullYear?.(),
        verificationStatus: operator.verificationStatus,
      },
      activeRoutes: routes.map((route) => {
        const stats = statsByRoute.get(String(route._id));
        return {
          id: route._id,
          name: route.routeName,
          code: route.routeCode,
          from: route.origin?.city || route.origin?.province,
          to: route.destination?.city || route.destination?.province,
          distance: route.distance,
          duration: route.estimatedDuration,
          tripsPerDay: stats?.trips || 0,
          minPrice: stats?.minPrice || 0,
          maxPrice: stats?.maxPrice || 0,
        };
      }),
      ratingSummary: {
        averageRating,
        totalReviews,
        averageVehicleRating: Number((rating.averageVehicleRating || 0).toFixed(1)),
        averageDriverRating: Number((rating.averageDriverRating || 0).toFixed(1)),
        averagePunctualityRating: Number((rating.averagePunctualityRating || 0).toFixed(1)),
        averageServiceRating: Number((rating.averageServiceRating || 0).toFixed(1)),
      },
      reviews: reviews.map((review) => ({
        id: review._id,
        customerName: review.userId?.fullName || 'Khách hàng',
        avatar: review.userId?.avatar,
        rating: review.overallRating,
        comment: review.comment,
        createdAt: review.createdAt,
        route: review.tripId?.routeId ? {
          from: review.tripId.routeId.origin?.city,
          to: review.tripId.routeId.destination?.city,
        } : null,
        tripDate: review.tripId?.departureTime,
        operatorResponse: review.operatorResponse,
      })),
    };
  }

  /**
   * Lấy thông tin operator theo ID
   * @param {String} operatorId - Operator ID
   * @returns {Object} Operator
   */
  static async getById(operatorId) {
    const operator = await BusOperator.findById(operatorId);

    if (!operator) {
      throw new Error('Nhà xe không tồn tại');
    }

    return operator;
  }

  /**
   * Cập nhật thông tin operator
   * @param {String} operatorId - Operator ID
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Object} Updated operator
   */
  static async update(operatorId, updateData) {
    const operator = await BusOperator.findById(operatorId);

    if (!operator) {
      throw new Error('Nhà xe không tồn tại');
    }

    // Không cho phép cập nhật một số fields nhạy cảm
    const restrictedFields = [
      'password',
      'verificationStatus',
      'verifiedAt',
      'verifiedBy',
      'isSuspended',
      'suspensionReason',
      'totalTrips',
      'totalRevenue',
      'averageRating',
      'totalReviews',
    ];

    restrictedFields.forEach((field) => {
      delete updateData[field];
    });

    if (Object.prototype.hasOwnProperty.call(updateData, 'operatorName')) {
      updateData.operatorName = String(updateData.operatorName || '').trim();
      if (!updateData.operatorName) {
        throw new Error('Tên hiển thị nhà xe không được để trống');
      }
    }

    // Cập nhật operator
    Object.assign(operator, updateData);
    await operator.save();

    return operator;
  }

  /**
   * Duyệt nhà xe (Admin only)
   * @param {String} operatorId - Operator ID
   * @param {String} adminId - Admin ID
   * @returns {Object} Updated operator
   */
  static async approve(operatorId, adminId) {
    const operator = await BusOperator.findById(operatorId);

    if (!operator) {
      throw new Error('Nhà xe không tồn tại');
    }

    if (operator.verificationStatus === 'approved') {
      throw new Error('Nhà xe đã được duyệt');
    }

    await operator.approve(adminId);

    return operator;
  }

  /**
   * Từ chối nhà xe (Admin only)
   * @param {String} operatorId - Operator ID
   * @param {String} adminId - Admin ID
   * @param {String} reason - Lý do từ chối
   * @returns {Object} Updated operator
   */
  static async reject(operatorId, adminId, reason) {
    const operator = await BusOperator.findById(operatorId);

    if (!operator) {
      throw new Error('Nhà xe không tồn tại');
    }

    if (!reason) {
      throw new Error('Vui lòng cung cấp lý do từ chối');
    }

    await operator.reject(adminId, reason);

    return operator;
  }

  /**
   * Tạm ngưng nhà xe (Admin only)
   * @param {String} operatorId - Operator ID
   * @param {String} reason - Lý do tạm ngưng
   * @returns {Object} Updated operator
   */
  static async suspend(operatorId, reason) {
    const operator = await BusOperator.findById(operatorId);

    if (!operator) {
      throw new Error('Nhà xe không tồn tại');
    }

    if (operator.isSuspended) {
      throw new Error('Nhà xe đã bị tạm ngưng');
    }

    if (!reason) {
      throw new Error('Vui lòng cung cấp lý do tạm ngưng');
    }

    await operator.suspend(reason);

    return operator;
  }

  /**
   * Khôi phục nhà xe (Admin only)
   * @param {String} operatorId - Operator ID
   * @returns {Object} Updated operator
   */
  static async resume(operatorId) {
    const operator = await BusOperator.findById(operatorId);

    if (!operator) {
      throw new Error('Nhà xe không tồn tại');
    }

    if (!operator.isSuspended) {
      throw new Error('Nhà xe không bị tạm ngưng');
    }

    await operator.resume();

    return operator;
  }

  /**
   * Lấy danh sách operators với filters và pagination
   * @param {Object} filters - Filters
   * @param {Object} options - Pagination options
   * @returns {Object} Operators và pagination info
   */
  static async getAll(filters = {}, options = {}) {
    const {
      verificationStatus,
      isSuspended,
      isActive,
      search,
    } = filters;

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build query
    const query = {};

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (typeof isSuspended === 'boolean') {
      query.isSuspended = isSuspended;
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    if (search) {
      query.$or = [
        { operatorName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query
    const operators = await BusOperator.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await BusOperator.countDocuments(query);

    return {
      operators,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = OperatorService;
