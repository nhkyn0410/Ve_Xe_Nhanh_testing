const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const logger = require('../utils/logger');

/**
 * Admin Trip Controller
 * System-admin oversight of every operator's trips (UC — system trips).
 * Read-only monitoring built on real Trip records with real seat-occupancy
 * (bookedSeats vs totalSeats) and the canonical Trip.status lifecycle
 * (scheduled · ongoing · completed · cancelled). No fabricated "delayed"
 * state and no live-map — those design elements have no backing data.
 */

const STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'];

/**
 * @route   GET /api/v1/admin/trips
 * @desc    List every trip across all operators with real occupancy
 * @access  Private (Admin)
 */
exports.getAllTrips = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status && STATUSES.includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (req.query.operatorId && mongoose.Types.ObjectId.isValid(req.query.operatorId)) {
      query.operatorId = req.query.operatorId;
    }

    // Date lens on departureTime
    const now = new Date();
    if (req.query.range === 'today') {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      query.departureTime = { $gte: s, $lte: e };
    } else if (req.query.range === 'upcoming') {
      query.departureTime = { $gte: now };
    } else if (req.query.range === 'past') {
      query.departureTime = { $lt: now };
    }

    // Cross-collection search: resolve route/bus refs first.
    if (req.query.search) {
      const rx = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const [routeIds, busIds] = await Promise.all([
        Route.find({
          $or: [
            { routeName: rx }, { routeCode: rx },
            { 'origin.city': rx }, { 'origin.province': rx },
            { 'destination.city': rx }, { 'destination.province': rx },
          ],
        }).distinct('_id'),
        Bus.find({ busNumber: rx }).distinct('_id'),
      ]);
      query.$or = [{ routeId: { $in: routeIds } }, { busId: { $in: busIds } }];
    }

    const sortDir = req.query.range === 'upcoming' ? 1 : -1;

    const [total, trips] = await Promise.all([
      Trip.countDocuments(query),
      Trip.find(query)
        .populate('routeId', 'routeName routeCode origin destination')
        .populate('busId', 'busNumber busType')
        .populate('operatorId', 'operatorName companyName')
        .sort({ departureTime: sortDir })
        .skip(skip)
        .limit(limit)
        .select('routeId busId operatorId departureTime arrivalTime basePrice finalPrice totalSeats bookedSeats status journey createdAt')
        .lean(),
    ]);

    const data = trips.map((t) => {
      const soldSeats = Array.isArray(t.bookedSeats) ? t.bookedSeats.length : 0;
      const occupancy =
        t.totalSeats > 0 ? Math.round((soldSeats / t.totalSeats) * 100) : null;
      const { bookedSeats, journey, ...rest } = t;
      return {
        ...rest,
        soldSeats,
        occupancy,
        journeyStatus: journey?.currentStatus || null,
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
    logger.error('Lỗi lấy danh sách chuyến (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể tải danh sách chuyến xe',
    });
  }
};

/**
 * @route   GET /api/v1/admin/trips/statistics
 * @desc    System-wide trip KPIs (all real)
 * @access  Private (Admin)
 */
exports.getTripStatistics = async (req, res) => {
  try {
    const now = new Date();
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(now); endToday.setHours(23, 59, 59, 999);

    const [byStatusAgg, occAgg, todayCount, total] = await Promise.all([
      Trip.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Trip.aggregate([
        { $match: { totalSeats: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            avgOccupancy: {
              $avg: {
                $multiply: [
                  { $divide: [{ $size: { $ifNull: ['$bookedSeats', []] } }, '$totalSeats'] },
                  100,
                ],
              },
            },
          },
        },
      ]),
      Trip.countDocuments({ departureTime: { $gte: startToday, $lte: endToday } }),
      Trip.estimatedDocumentCount(),
    ]);

    const byStatus = STATUSES.reduce((acc, s) => { acc[s] = 0; return acc; }, {});
    byStatusAgg.forEach((r) => { if (r._id in byStatus) byStatus[r._id] = r.count; });

    return res.status(200).json({
      status: 'success',
      data: {
        total,
        today: todayCount,
        byStatus,
        scheduled: byStatus.scheduled,
        ongoing: byStatus.ongoing,
        completed: byStatus.completed,
        cancelled: byStatus.cancelled,
        avgOccupancy: occAgg[0]?.avgOccupancy != null ? Math.round(occAgg[0].avgOccupancy) : 0,
      },
    });
  } catch (error) {
    logger.error('Lỗi thống kê chuyến (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể tải thống kê chuyến xe',
    });
  }
};
