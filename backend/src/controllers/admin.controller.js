const OperatorService = require('../services/operator.service');
const AuthService = require('../services/auth.service');
const User = require('../models/User');
const BusOperator = require('../models/BusOperator');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

const findAnyAdmin = () => User.findOne({ role: 'admin' }).select('_id email fullName');

const sanitizeUserResponse = (user) => {
  const userResponse = user.toObject();
  delete userResponse.password;
  return userResponse;
};

const ensureUserIdentityAvailable = async (email, phone) => {
  const normalizedEmail = email.toLowerCase();

  const [existingEmail, existingPhone] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    User.findOne({ phone }),
  ]);

  if (existingEmail) {
    throw new Error('Email đã được sử dụng');
  }

  if (existingPhone) {
    throw new Error('Số điện thoại đã được sử dụng');
  }

  return normalizedEmail;
};

const createAdminUser = async ({
  email,
  phone,
  password,
  fullName,
}) => User.create({
  email,
  phone,
  password,
  fullName,
  role: 'admin',
  isEmailVerified: true,
  isPhoneVerified: true,
});

/**
 * Admin Controller
 * Xử lý các HTTP requests cho admin
 * Includes operator management and user management (UC-22)
 */

/**
 * @route   POST /api/v1/admin/login
 * @desc    Đăng nhập admin
 * @access  Public
 */
/**
 * @route   POST /api/v1/admin/bootstrap
 * @desc    Bootstrap first admin account
 * @access  Public
 */
exports.bootstrapFirstAdmin = async (req, res) => {
  try {
    const existingAdmin = await findAnyAdmin();

    if (existingAdmin) {
      return res.status(409).json({
        status: 'error',
        message: 'Hệ thống đã có tài khoản admin. Bootstrap đã bị khóa.',
      });
    }

    const requiredBootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    const {
      bootstrapSecret,
      email,
      phone,
      password,
      fullName,
    } = req.body;

    if (requiredBootstrapSecret && bootstrapSecret !== requiredBootstrapSecret) {
      return res.status(403).json({
        status: 'error',
        message: 'Bootstrap secret không hợp lệ',
      });
    }

    const normalizedEmail = await ensureUserIdentityAvailable(email, phone);
    const admin = await createAdminUser({
      email: normalizedEmail,
      phone,
      password,
      fullName,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Khởi tạo admin đầu tiên thành công',
      data: {
        user: sanitizeUserResponse(admin),
      },
    });
  } catch (error) {
    logger.error('Lỗi bootstrap admin đầu tiên:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Khởi tạo admin đầu tiên thất bại',
    });
  }
};

/**
 * @route   POST /api/v1/admin/login
 * @desc    Admin login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp email/số điện thoại và mật khẩu',
      });
    }

    const result = await AuthService.login(identifier, password, rememberMe || false, 'admin');

    return res.status(200).json({
      status: 'success',
      message: 'Đăng nhập admin thành công',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    logger.error('Lỗi đăng nhập admin:', error);

    const isForbidden = error.message && error.message.includes('quyền truy cập khu vực quản trị');

    return res.status(isForbidden ? 403 : 401).json({
      status: 'error',
      message: error.message || 'Đăng nhập admin thất bại',
    });
  }
};

/**
 * @route   GET /api/v1/admin/operators
 * @desc    Lấy danh sách operators (Admin)
 * @access  Private (Admin)
 */
exports.getAllOperators = async (req, res, next) => {
  try {
    const {
      verificationStatus,
      isSuspended,
      isActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const filters = {
      verificationStatus,
      isSuspended: isSuspended === 'true' ? true : isSuspended === 'false' ? false : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    };

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await OperatorService.getAll(filters, options);

    res.status(200).json({
      status: 'success',
      data: {
        operators: result.operators,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy nhà xe:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lấy danh sách nhà xe thất bại',
    });
  }
};

/**
 * @route   GET /api/v1/admin/operators/:id
 * @desc    Lấy thông tin chi tiết operator (Admin)
 * @access  Private (Admin)
 */
exports.getOperatorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const operator = await OperatorService.getById(id);

    res.status(200).json({
      status: 'success',
      data: {
        operator,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy nhà điều hành:', error);
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy nhà xe',
    });
  }
};

/**
 * @route   PUT /api/v1/admin/operators/:id/approve
 * @desc    Duyệt nhà xe
 * @access  Private (Admin)
 */
exports.approveOperator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.userId; // Từ authenticate middleware

    const operator = await OperatorService.approve(id, adminId);

    res.status(200).json({
      status: 'success',
      message: 'Duyệt nhà xe thành công',
      data: {
        operator,
      },
    });
  } catch (error) {
    logger.error('Lỗi phê duyệt nhà xe:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Duyệt nhà xe thất bại',
    });
  }
};

/**
 * @route   PUT /api/v1/admin/operators/:id/reject
 * @desc    Từ chối nhà xe
 * @access  Private (Admin)
 */
exports.rejectOperator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.userId; // Từ authenticate middleware

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp lý do từ chối',
      });
    }

    const operator = await OperatorService.reject(id, adminId, reason);

    res.status(200).json({
      status: 'success',
      message: 'Từ chối nhà xe thành công',
      data: {
        operator,
      },
    });
  } catch (error) {
    logger.error('Lỗi từ chối nhà xe:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Từ chối nhà xe thất bại',
    });
  }
};

/**
 * @route   PUT /api/v1/admin/operators/:id/suspend
 * @desc    Tạm ngưng nhà xe
 * @access  Private (Admin)
 */
exports.suspendOperator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp lý do tạm ngưng',
      });
    }

    const operator = await OperatorService.suspend(id, reason);

    res.status(200).json({
      status: 'success',
      message: 'Tạm ngưng nhà xe thành công',
      data: {
        operator,
      },
    });
  } catch (error) {
    logger.error('Lỗi tạm ngưng nhà xe:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Tạm ngưng nhà xe thất bại',
    });
  }
};

/**
 * @route   PUT /api/v1/admin/operators/:id/resume
 * @desc    Khôi phục nhà xe
 * @access  Private (Admin)
 */
exports.resumeOperator = async (req, res, next) => {
  try {
    const { id } = req.params;

    const operator = await OperatorService.resume(id);

    res.status(200).json({
      status: 'success',
      message: 'Khôi phục nhà xe thành công',
      data: {
        operator,
      },
    });
  } catch (error) {
    logger.error('Lỗi kích hoạt lại nhà xe:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Khôi phục nhà xe thất bại',
    });
  }
};

/**
 * @route   GET /api/v1/admin/operators/statistics
 * @desc    Lấy thống kê tổng quan nhà xe (toàn hệ thống)
 * @access  Private (Admin)
 */
exports.getOperatorStatistics = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      total,
      active,
      pending,
      rejected,
      suspended,
      inactive,
      newThisMonth,
      aggregates,
    ] = await Promise.all([
      BusOperator.countDocuments(),
      BusOperator.countDocuments({ verificationStatus: 'approved', isSuspended: false }),
      BusOperator.countDocuments({ verificationStatus: 'pending' }),
      BusOperator.countDocuments({ verificationStatus: 'rejected' }),
      BusOperator.countDocuments({ isSuspended: true }),
      BusOperator.countDocuments({ isActive: false }),
      BusOperator.countDocuments({ createdAt: { $gte: startOfMonth } }),
      BusOperator.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalRevenue' },
            totalTrips: { $sum: '$totalTrips' },
            totalReviews: { $sum: '$totalReviews' },
            avgRating: {
              $avg: {
                $cond: [{ $gt: ['$averageRating', 0] }, '$averageRating', null],
              },
            },
          },
        },
      ]),
    ]);

    const agg = aggregates[0] || {};

    res.json({
      success: true,
      data: {
        total,
        active,
        pending,
        rejected,
        suspended,
        inactive,
        newThisMonth,
        totalRevenue: agg.totalRevenue || 0,
        totalTrips: agg.totalTrips || 0,
        totalReviews: agg.totalReviews || 0,
        avgRating: agg.avgRating ? Number(agg.avgRating.toFixed(2)) : 0,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy thống kê nhà xe:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thống kê nhà xe',
      error: error.message,
    });
  }
};

/**
 * ========================
 * USER MANAGEMENT (UC-22)
 * ========================
 */

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create a new admin account
 * @access  Private (Admin)
 */
exports.createAdminAccount = async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      fullName,
    } = req.body;

    const normalizedEmail = await ensureUserIdentityAvailable(email, phone);
    const admin = await createAdminUser({
      email: normalizedEmail,
      phone,
      password,
      fullName,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Tạo tài khoản admin thành công',
      data: {
        user: sanitizeUserResponse(admin),
      },
    });
  } catch (error) {
    logger.error('Lỗi tạo tài khoản admin:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Tạo tài khoản admin thất bại',
    });
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin)
 */
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isBlocked,
      isActive,
      loyaltyTier,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by loyalty tier (customer membership)
    if (loyaltyTier) {
      query.loyaltyTier = loyaltyTier;
    }

    // Filter by blocked status
    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true';
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by email, phone, or name
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -phoneVerificationOTP -otpExpires')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get user statistics for each user (booking count, total spent)
    const userIds = users.map((u) => u._id);
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: '$userId',
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$finalPrice' },
        },
      },
    ]);

    // Map stats to users
    const statsMap = new Map(bookingStats.map((s) => [s._id.toString(), s]));
    const usersWithStats = users.map((user) => {
      const stats = statsMap.get(user._id.toString()) || {
        totalBookings: 0,
        totalSpent: 0,
      };
      return {
        ...user,
        totalBookings: stats.totalBookings,
        totalSpent: stats.totalSpent,
      };
    });

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách người dùng',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details by ID
 * @access  Private (Admin)
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findById(id)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -phoneVerificationOTP -otpExpires')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Get booking statistics
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          userId: user._id,
        },
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$finalPrice' },
        },
      },
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find({ userId: user._id })
      .populate('tripId', 'routeId departureTime')
      .populate({
        path: 'tripId',
        populate: {
          path: 'routeId',
          select: 'routeName origin destination',
        },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('bookingCode tripId seats totalPrice finalPrice paymentStatus createdAt')
      .lean();

    // Format booking stats
    const stats = {
      totalBookings: 0,
      paidBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      totalSpent: 0,
    };

    bookingStats.forEach((stat) => {
      stats.totalBookings += stat.count;
      if (stat._id === 'paid') {
        stats.paidBookings = stat.count;
        stats.totalSpent = stat.totalAmount;
      } else if (stat._id === 'pending') {
        stats.pendingBookings = stat.count;
      } else if (stat._id === 'cancelled' || stat._id === 'refunded') {
        stats.cancelledBookings += stat.count;
      }
    });

    res.json({
      success: true,
      data: {
        user,
        stats,
        recentBookings,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy người dùng theo ID:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thông tin người dùng',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/block
 * @desc    Block a user
 * @access  Private (Admin)
 */
exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do khóa tài khoản',
      });
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Check if already blocked
    if (user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã bị khóa trước đó',
      });
    }

    // Prevent blocking admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể khóa tài khoản admin',
      });
    }

    // Block user
    user.isBlocked = true;
    user.blockedReason = reason;
    user.blockedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Đã khóa tài khoản người dùng',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          isBlocked: user.isBlocked,
          blockedReason: user.blockedReason,
          blockedAt: user.blockedAt,
        },
      },
    });
  } catch (error) {
    logger.error('Lỗi khóa người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể khóa tài khoản',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/unblock
 * @desc    Unblock a user
 * @access  Private (Admin)
 */
exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Check if not blocked
    if (!user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản không bị khóa',
      });
    }

    // Unblock user
    user.isBlocked = false;
    user.blockedReason = undefined;
    user.blockedAt = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Đã mở khóa tài khoản người dùng',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          isBlocked: user.isBlocked,
        },
      },
    });
  } catch (error) {
    logger.error('Lỗi mở khóa người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể mở khóa tài khoản',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/admin/users/:id/reset-password
 * @desc    Reset user password (admin)
 * @access  Private (Admin)
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, sendEmail = true } = req.body;

    // Validate
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu mới',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    // Prevent resetting admin password
    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không thể đặt lại mật khẩu cho admin khác',
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // TODO: Send email notification to user about password change
    // if (sendEmail) {
    //   await emailService.sendPasswordChangeNotification(user.email, user.fullName);
    // }

    res.json({
      success: true,
      message: 'Đã đặt lại mật khẩu cho người dùng',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
        },
      },
    });
  } catch (error) {
    logger.error('Lỗi đặt lại mật khẩu người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đặt lại mật khẩu',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/admin/users/statistics
 * @desc    Get user statistics (dashboard)
 * @access  Private (Admin)
 */
exports.getUserStatistics = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();

    // Active users
    const activeUsers = await User.countDocuments({ isActive: true, isBlocked: false });

    // Blocked users
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // Users by loyalty tier
    const usersByTier = await User.aggregate([
      {
        $match: { role: 'customer' },
      },
      {
        $group: {
          _id: '$loyaltyTier',
          count: { $sum: 1 },
        },
      },
    ]);

    // User growth (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        blockedUsers,
        newUsersThisMonth,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        usersByTier: usersByTier.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        userGrowth,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy thống kê người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thống kê người dùng',
      error: error.message,
    });
  }
};

/**
 * ========================
 * SYSTEM REPORTS (UC-26)
 * ========================
 */

/**
 * @route   GET /api/admin/reports/overview
 * @desc    Get comprehensive system overview report
 * @access  Private (Admin)
 */
exports.getSystemOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const BusOperator = require('../models/BusOperator');
    const Trip = require('../models/Trip');
    const Route = require('../models/Route');

    // Parse date range or default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User Statistics
    // Tổng người dùng = mọi role (gồm cả admin trong cùng collection User).
    const totalUsers = await User.countDocuments();
    // Các KPI "Khách hàng" chỉ tính role 'customer' — admin nằm chung
    // collection User nên không được lẫn vào số khách hàng.
    const newUsers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: start, $lte: end },
    });
    const activeUsers = await User.countDocuments({
      role: 'customer',
      isActive: true,
      isBlocked: false,
    });

    // Operator Statistics
    const totalOperators = await BusOperator.countDocuments();
    const approvedOperators = await BusOperator.countDocuments({ verificationStatus: 'approved' });
    const pendingOperators = await BusOperator.countDocuments({ verificationStatus: 'pending' });

    // Booking Statistics
    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });
    const paidBookings = await Booking.countDocuments({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid',
    });
    const cancelledBookings = await Booking.countDocuments({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: { $in: ['cancelled', 'refunded'] },
    });

    // Revenue Statistics
    const revenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalPrice' },
          averageOrderValue: { $avg: '$finalPrice' },
          totalTickets: { $sum: { $size: '$seats' } },
        },
      },
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      averageOrderValue: 0,
      totalTickets: 0,
    };

    // Trip Statistics
    const totalTrips = await Trip.countDocuments({
      departureTime: { $gte: start, $lte: end },
    });
    const completedTrips = await Trip.countDocuments({
      departureTime: { $gte: start, $lte: end },
      status: 'completed',
    });

    // Top Routes by Bookings
    const topRoutes = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          paymentStatus: 'paid',
        },
      },
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'trip',
        },
      },
      {
        $unwind: '$trip',
      },
      {
        $lookup: {
          from: 'routes',
          localField: 'trip.routeId',
          foreignField: '_id',
          as: 'route',
        },
      },
      {
        $unwind: '$route',
      },
      {
        $group: {
          _id: '$route._id',
          routeName: { $first: '$route.routeName' },
          origin: { $first: '$route.origin' },
          destination: { $first: '$route.destination' },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$finalPrice' },
          totalTickets: { $sum: { $size: '$seats' } },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Top Operators by Revenue
    const topOperators = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          paymentStatus: 'paid',
        },
      },
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'trip',
        },
      },
      {
        $unwind: '$trip',
      },
      {
        $lookup: {
          from: 'operators',
          localField: 'trip.operatorId',
          foreignField: '_id',
          as: 'operator',
        },
      },
      {
        $unwind: '$operator',
      },
      {
        $group: {
          _id: '$operator._id',
          companyName: { $first: '$operator.companyName' },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$finalPrice' },
          totalTickets: { $sum: { $size: '$seats' } },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Daily Revenue Trend
    const revenueTrend = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$finalPrice' },
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: '$seats' } },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1,
        },
      },
    ]);

    // Format revenue trend with dates
    const formattedRevenueTrend = revenueTrend.map((item) => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day),
      revenue: item.revenue,
      bookings: item.bookings,
      tickets: item.tickets,
    }));

    // Growth Metrics (compare with previous period)
    const periodDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    const previousStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousEnd = start;

    const previousRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: previousStart, $lt: previousEnd },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalPrice' },
        },
      },
    ]);

    const previousBookings = await Booking.countDocuments({
      createdAt: { $gte: previousStart, $lt: previousEnd },
      paymentStatus: 'paid',
    });

    const previousUsers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: previousStart, $lt: previousEnd },
    });

    const prevRevenue = previousRevenue[0]?.totalRevenue || 0;
    const revenueGrowth = prevRevenue > 0 ? ((revenue.totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const bookingsGrowth = previousBookings > 0 ? ((paidBookings - previousBookings) / previousBookings) * 100 : 0;
    const usersGrowth = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;

    res.json({
      success: true,
      data: {
        dateRange: {
          start,
          end,
        },
        overview: {
          totalUsers,
          newUsers,
          activeUsers,
          totalOperators,
          approvedOperators,
          pendingOperators,
          totalBookings,
          paidBookings,
          cancelledBookings,
          cancellationRate: totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(2) : 0,
          totalTrips,
          completedTrips,
        },
        revenue: {
          totalRevenue: revenue.totalRevenue,
          averageOrderValue: revenue.averageOrderValue,
          totalTickets: revenue.totalTickets,
        },
        growth: {
          revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
          bookingsGrowth: parseFloat(bookingsGrowth.toFixed(2)),
          usersGrowth: parseFloat(usersGrowth.toFixed(2)),
        },
        topRoutes,
        topOperators,
        revenueTrend: formattedRevenueTrend,
      },
    });
  } catch (error) {
    logger.error('Lỗi tổng quan hệ thống:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải báo cáo tổng quan',
      error: error.message,
    });
  }
};
