const mongoose = require('mongoose');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const logger = require('../utils/logger');

/**
 * Admin Route Controller
 * System-admin oversight of every operator's routes (UC — system routes).
 * Read-only monitoring: real route records enriched with real, live
 * trip-derived metrics (trip count, upcoming trips, average seat
 * occupancy computed from actual bookings).
 */

/**
 * @route   GET /api/v1/admin/routes
 * @desc    List every route across all operators with live trip stats
 * @access  Private (Admin)
 */
exports.getAllRoutes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.operatorId && mongoose.Types.ObjectId.isValid(req.query.operatorId)) {
      query.operatorId = req.query.operatorId;
    }

    if (req.query.isActive === 'true') query.isActive = true;
    else if (req.query.isActive === 'false') query.isActive = false;

    if (req.query.search) {
      const rx = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { routeName: rx },
        { routeCode: rx },
        { 'origin.city': rx },
        { 'origin.province': rx },
        { 'destination.city': rx },
        { 'destination.province': rx },
      ];
    }

    // Distance band filter (real, derived from the route's own distance)
    if (req.query.band === 'short') query.distance = { $lt: 100 };
    else if (req.query.band === 'medium') query.distance = { $gte: 100, $lte: 300 };
    else if (req.query.band === 'long') query.distance = { $gt: 300 };

    let sort = { createdAt: -1 };
    if (req.query.sort === 'distance') sort = { distance: -1 };
    else if (req.query.sort === 'price') sort = { basePrice: -1 };
    else if (req.query.sort === 'name') sort = { routeName: 1 };

    const [total, routes] = await Promise.all([
      Route.countDocuments(query),
      Route.find(query)
        .populate('operatorId', 'operatorName companyName status')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Enrich the current page with real trip-derived metrics.
    const ids = routes.map((r) => r._id);
    let statsByRoute = {};
    if (ids.length) {
      const agg = await Trip.aggregate([
        { $match: { routeId: { $in: ids } } },
        {
          $group: {
            _id: '$routeId',
            tripsTotal: { $sum: 1 },
            tripsUpcoming: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'scheduled'] }, { $gt: ['$departureTime', new Date()] }] },
                  1,
                  0,
                ],
              },
            },
            tripsCompleted: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            avgOccupancy: {
              $avg: {
                $cond: [
                  { $gt: ['$totalSeats', 0] },
                  { $multiply: [{ $divide: [{ $size: { $ifNull: ['$bookedSeats', []] } }, '$totalSeats'] }, 100] },
                  null,
                ],
              },
            },
          },
        },
      ]);
      statsByRoute = agg.reduce((acc, s) => {
        acc[s._id.toString()] = s;
        return acc;
      }, {});
    }

    const data = routes.map((r) => {
      const s = statsByRoute[r._id.toString()] || {};
      return {
        ...r,
        tripsTotal: s.tripsTotal || 0,
        tripsUpcoming: s.tripsUpcoming || 0,
        tripsCompleted: s.tripsCompleted || 0,
        avgOccupancy: s.avgOccupancy != null ? Math.round(s.avgOccupancy) : null,
      };
    });

    return res.status(200).json({
      status: 'success',
      data,
      pagination: {
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
        limit,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy danh sách tuyến (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể tải danh sách tuyến đường',
    });
  }
};

/**
 * @route   GET /api/v1/admin/routes/statistics
 * @desc    System-wide route KPIs (all real, computed from Route data)
 * @access  Private (Admin)
 */
exports.getRouteStatistics = async (req, res) => {
  try {
    const [agg] = await Route.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          avgDistance: { $avg: '$distance' },
          avgPrice: { $avg: '$basePrice' },
          shortHaul: { $sum: { $cond: [{ $lt: ['$distance', 100] }, 1, 0] } },
          mediumHaul: {
            $sum: { $cond: [{ $and: [{ $gte: ['$distance', 100] }, { $lte: ['$distance', 300] }] }, 1, 0] },
          },
          longHaul: { $sum: { $cond: [{ $gt: ['$distance', 300] }, 1, 0] } },
        },
      },
    ]);

    const operatorsWithRoutes = await Route.distinct('operatorId');

    const stats = agg || {
      total: 0,
      active: 0,
      inactive: 0,
      avgDistance: 0,
      avgPrice: 0,
      shortHaul: 0,
      mediumHaul: 0,
      longHaul: 0,
    };

    return res.status(200).json({
      status: 'success',
      data: {
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive,
        avgDistance: Math.round(stats.avgDistance || 0),
        avgPrice: Math.round(stats.avgPrice || 0),
        shortHaul: stats.shortHaul,
        mediumHaul: stats.mediumHaul,
        longHaul: stats.longHaul,
        operatorsWithRoutes: operatorsWithRoutes.length,
      },
    });
  } catch (error) {
    logger.error('Lỗi thống kê tuyến (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể tải thống kê tuyến đường',
    });
  }
};
