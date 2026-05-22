const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');
const BusOperator = require('../models/BusOperator');
const reviewService = require('../services/review.service');
const logger = require('../utils/logger');

/**
 * Admin Review Controller
 * System-admin moderation of every operator's customer reviews
 * (UC — system reviews). Built entirely on the real Review model: real
 * overall + detailed ratings, real comment/images, the real operatorResponse,
 * and the real isPublished / isReported moderation flags. The design's
 * fabricated reviewer "tier" maps to the real User.loyaltyTier; nothing is
 * invented. Moderation actions (publish / unpublish / clear-report) mutate
 * only those real flags and re-sync the operator's aggregate rating.
 */

const STAR_VALUES = [5, 4, 3, 2, 1];
const noResponse = { $in: [null, ''] };

const flatten = (r) => {
  const u = r.userId && typeof r.userId === 'object' ? r.userId : null;
  const op = r.operatorId && typeof r.operatorId === 'object' ? r.operatorId : null;
  const trip = r.tripId && typeof r.tripId === 'object' ? r.tripId : null;
  const route = trip && trip.routeId && typeof trip.routeId === 'object' ? trip.routeId : null;
  const routeLabel = route
    ? route.routeName ||
      `${route.origin?.city || route.origin?.province || '?'} → ${route.destination?.city || route.destination?.province || '?'}`
    : null;
  return {
    _id: r._id,
    user: u ? { name: u.fullName, avatar: u.avatar || null, tier: u.loyaltyTier || null } : null,
    operator: op?.companyName || null,
    route: routeLabel,
    departureTime: trip?.departureTime || null,
    overallRating: r.overallRating,
    vehicleRating: r.vehicleRating,
    driverRating: r.driverRating,
    punctualityRating: r.punctualityRating,
    serviceRating: r.serviceRating,
    comment: r.comment || '',
    images: Array.isArray(r.images) ? r.images : [],
    operatorResponse: r.operatorResponse || null,
    respondedAt: r.respondedAt || null,
    isPublished: r.isPublished !== false,
    isReported: !!r.isReported,
    reportReason: r.reportReason || null,
    createdAt: r.createdAt,
  };
};

/**
 * @route   GET /api/v1/admin/reviews
 * @desc    List every review across all operators (moderation queue)
 * @access  Private (Admin)
 */
exports.getAllReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.tab === 'unanswered') {
      query.operatorResponse = noResponse;
    } else if (req.query.tab === 'reported') {
      query.isReported = true;
    } else if (req.query.tab === 'unpublished') {
      query.isPublished = false;
    }

    const ratingNum = parseInt(req.query.rating, 10);
    if (ratingNum >= 1 && ratingNum <= 5) {
      query.overallRating = ratingNum;
    }

    if (req.query.operatorId && mongoose.Types.ObjectId.isValid(req.query.operatorId)) {
      query.operatorId = req.query.operatorId;
    }

    // Cross-collection search: resolve reviewer / operator refs first.
    if (req.query.search) {
      const rx = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const [userIds, operatorIds] = await Promise.all([
        User.find({ fullName: rx }).distinct('_id'),
        BusOperator.find({ companyName: rx }).distinct('_id'),
      ]);
      query.$or = [
        { comment: rx },
        { userId: { $in: userIds } },
        { operatorId: { $in: operatorIds } },
      ];
    }

    const [total, reviews] = await Promise.all([
      Review.countDocuments(query),
      Review.find(query)
        .populate('userId', 'fullName avatar loyaltyTier')
        .populate('operatorId', 'operatorName companyName')
        .populate({
          path: 'tripId',
          select: 'departureTime routeId',
          populate: { path: 'routeId', select: 'routeName origin destination' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: 'success',
      data: reviews.map(flatten),
      pagination: {
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        limit,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy danh sách đánh giá (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể tải danh sách đánh giá',
    });
  }
};

/**
 * @route   GET /api/v1/admin/reviews/statistics
 * @desc    System-wide review KPIs + rating distribution (all real)
 * @access  Private (Admin)
 */
exports.getReviewStatistics = async (req, res) => {
  try {
    const [overallAgg, distAgg, needResponse, reported, unpublished] = await Promise.all([
      Review.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$overallRating' } } },
      ]),
      Review.aggregate([{ $group: { _id: '$overallRating', count: { $sum: 1 } } }]),
      Review.countDocuments({ operatorResponse: noResponse }),
      Review.countDocuments({ isReported: true }),
      Review.countDocuments({ isPublished: false }),
    ]);

    const total = overallAgg[0]?.total || 0;
    const distMap = {};
    distAgg.forEach((d) => { distMap[d._id] = d.count; });
    const distribution = STAR_VALUES.map((star) => {
      const count = distMap[star] || 0;
      return { star, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        total,
        avgRating: overallAgg[0]?.avg != null ? Math.round(overallAgg[0].avg * 100) / 100 : 0,
        needResponse,
        reported,
        unpublished,
        distribution,
      },
    });
  } catch (error) {
    logger.error('Lỗi thống kê đánh giá (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể tải thống kê đánh giá',
    });
  }
};

/**
 * Shared moderation helper — mutate a real flag then re-sync operator rating.
 */
const moderate = async (req, res, mutate, okMessage) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 'error', message: 'ID đánh giá không hợp lệ' });
    }
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy đánh giá' });
    }
    mutate(review);
    await review.save();
    // isPublished changes affect the operator's published aggregate rating.
    reviewService.updateOperatorRating(review.operatorId).catch(() => {});
    return res.status(200).json({ status: 'success', message: okMessage });
  } catch (error) {
    logger.error('Lỗi kiểm duyệt đánh giá (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể cập nhật đánh giá',
    });
  }
};

/**
 * @route   PUT /api/v1/admin/reviews/:id/publish
 * @access  Private (Admin)
 */
exports.publishReview = (req, res) =>
  moderate(req, res, (r) => { r.isPublished = true; }, 'Đã duyệt đánh giá');

/**
 * @route   PUT /api/v1/admin/reviews/:id/unpublish
 * @access  Private (Admin)
 */
exports.unpublishReview = (req, res) =>
  moderate(req, res, (r) => { r.isPublished = false; }, 'Đã ẩn đánh giá');

/**
 * @route   PUT /api/v1/admin/reviews/:id/clear-report
 * @access  Private (Admin)
 */
exports.clearReport = (req, res) =>
  moderate(
    req,
    res,
    (r) => { r.isReported = false; r.reportReason = undefined; },
    'Đã bỏ đánh dấu báo cáo'
  );
