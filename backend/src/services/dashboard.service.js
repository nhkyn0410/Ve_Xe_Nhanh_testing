/**
 * Dashboard Service
 * Aggregates data for operator dashboard statistics
 */

const dayjs = require('dayjs');
const logger = require('../utils/logger');

const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');
const Payment = require('../models/Payment');

class DashboardService {
  /**
   * Get comprehensive dashboard statistics for operator
   * @param {string} operatorId - Operator ID
   * @param {Object} options - Options for date range
   * @returns {Object} Dashboard statistics
   */
  static async getDashboardStats(operatorId, options = {}) {
    const {
      period = 'month', // day, week, month, year
      startDate,
      endDate,
    } = options;

    // Calculate date range
    const dateRange = this.getDateRange(period, startDate, endDate);

    // Run all queries in parallel
    const [
      revenueStats,
      bookingStats,
      tripStats,
      ticketStats,
      trendData,
      upcomingTrips,
    ] = await Promise.all([
      this.getRevenueStats(operatorId, dateRange),
      this.getBookingStats(operatorId, dateRange),
      this.getTripStats(operatorId, dateRange),
      this.getTicketStats(operatorId, dateRange),
      this.getTrendData(operatorId, period),
      this.getUpcomingTrips(operatorId, 5),
    ]);

    return {
      revenue: revenueStats,
      bookings: bookingStats,
      trips: tripStats,
      tickets: ticketStats,
      trends: trendData,
      upcomingTrips,
      period,
      dateRange,
    };
  }

  /**
   * Get date range based on period
   */
  static getDateRange(period, startDate, endDate) {
    const now = dayjs();
    let start;
    let end;

    if (startDate && endDate) {
      start = dayjs(startDate);
      end = dayjs(endDate);
    } else {
      switch (period) {
        case 'day':
          start = now.startOf('day');
          end = now.endOf('day');
          break;
        case 'week':
          start = now.startOf('week');
          end = now.endOf('week');
          break;
        case 'month':
          start = now.startOf('month');
          end = now.endOf('month');
          break;
        case 'year':
          start = now.startOf('year');
          end = now.endOf('year');
          break;
        default:
          start = now.startOf('month');
          end = now.endOf('month');
      }
    }

    return {
      start: start.toDate(),
      end: end.toDate(),
    };
  }

  /**
   * Get revenue statistics
   */
  static async getRevenueStats(operatorId, dateRange) {
    const payments = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking',
        },
      },
      {
        $unwind: '$booking',
      },
      {
        $match: {
          'booking.operatorId': operatorId,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageOrderValue: { $avg: '$amount' },
        },
      },
    ]);

    const result = payments[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
    };

    // Get previous period for comparison
    const previousPeriodDays = dayjs(dateRange.end).diff(dateRange.start, 'day');
    const previousStart = dayjs(dateRange.start).subtract(previousPeriodDays, 'day').toDate();
    const previousEnd = dayjs(dateRange.start).subtract(1, 'day').toDate();

    const previousPayments = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidAt: { $gte: previousStart, $lte: previousEnd },
        },
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking',
        },
      },
      {
        $unwind: '$booking',
      },
      {
        $match: {
          'booking.operatorId': operatorId,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    const previousRevenue = previousPayments[0]?.totalRevenue || 0;
    const revenueGrowth = previousRevenue > 0
      ? ((result.totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      totalRevenue: result.totalRevenue,
      totalTransactions: result.totalTransactions,
      averageOrderValue: Math.round(result.averageOrderValue),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10, // Round to 1 decimal
      previousRevenue,
    };
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats(operatorId, dateRange) {
    const bookings = await Booking.aggregate([
      {
        $match: {
          operatorId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
    };

    bookings.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    const totalBookings = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const cancellationRate = totalBookings > 0
      ? (statusMap.cancelled / totalBookings) * 100
      : 0;

    return {
      total: totalBookings,
      confirmed: statusMap.confirmed,
      pending: statusMap.pending,
      cancelled: statusMap.cancelled,
      completed: statusMap.completed,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
    };
  }

  /**
   * Get trip statistics including occupancy rate
   */
  static async getTripStats(operatorId, dateRange) {
    const trips = await Trip.aggregate([
      {
        $match: {
          operatorId,
          departureTime: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSeats: { $sum: '$totalSeats' },
          totalBooked: { $sum: { $size: '$bookedSeats' } },
        },
      },
    ]);

    const statusMap = {
      scheduled: { count: 0, totalSeats: 0, totalBooked: 0 },
      ongoing: { count: 0, totalSeats: 0, totalBooked: 0 },
      completed: { count: 0, totalSeats: 0, totalBooked: 0 },
      cancelled: { count: 0, totalSeats: 0, totalBooked: 0 },
    };

    trips.forEach((item) => {
      if (statusMap[item._id]) {
        statusMap[item._id] = {
          count: item.count,
          totalSeats: item.totalSeats,
          totalBooked: item.totalBooked,
        };
      }
    });

    const totalTrips = Object.values(statusMap).reduce((a, b) => a + b.count, 0);
    const totalSeats = Object.values(statusMap).reduce((a, b) => a + b.totalSeats, 0);
    const totalBooked = Object.values(statusMap).reduce((a, b) => a + b.totalBooked, 0);
    const occupancyRate = totalSeats > 0 ? (totalBooked / totalSeats) * 100 : 0;

    return {
      total: totalTrips,
      scheduled: statusMap.scheduled.count,
      ongoing: statusMap.ongoing.count,
      completed: statusMap.completed.count,
      cancelled: statusMap.cancelled.count,
      totalSeats,
      totalBooked,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
    };
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStats(operatorId, dateRange) {
    const tickets = await Ticket.aggregate([
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
        $match: {
          'trip.operatorId': operatorId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      valid: 0,
      used: 0,
      cancelled: 0,
      expired: 0,
    };

    tickets.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    const totalTickets = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return {
      total: totalTickets,
      valid: statusMap.valid,
      used: statusMap.used,
      cancelled: statusMap.cancelled,
      expired: statusMap.expired,
    };
  }

  /**
   * Get trend data for charts (revenue and bookings)
   */
  static async getTrendData(operatorId, period) {
    logger.info('Lấy dữ liệu xu hướng cho:', {
      operatorId,
      operatorIdType: typeof operatorId,
      period
    });

    let groupBy;
    let dateFormat;

    switch (period) {
      case 'day':
        groupBy = { $hour: '$createdAt' };
        dateFormat = '%H:00';
        break;
      case 'week':
      case 'month':
        groupBy = { $dayOfMonth: '$createdAt' };
        dateFormat = '%d/%m';
        break;
      case 'year':
        groupBy = { $month: '$createdAt' };
        break;
      default:
        groupBy = { $dayOfMonth: '$createdAt' };
    }
    // Determine limit separately to avoid nested ternary
    let limitCount = 12;
    if (period === 'day') limitCount = 24;
    else if (period === 'week') limitCount = 7;
    else if (period === 'month') limitCount = 31;

    // Get booking trends
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          operatorId,
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          revenue: { $sum: '$finalPrice' },  // Use finalPrice instead of total
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $limit: limitCount,
      },
    ]);

    logger.info('Kết quả dữ liệu xu hướng:', {
      bookingTrendsCount: bookingTrends.length,
      sample: bookingTrends[0]
    });

    return {
      bookings: bookingTrends.map((item) => ({
        period: item._id,
        count: item.count,
        revenue: item.revenue || 0,
      })),
    };
  }

  /**
   * Get upcoming trips
   */
  static async getUpcomingTrips(operatorId, limit = 5) {
    const now = new Date();

    const trips = await Trip.find({
      operatorId,
      status: 'scheduled',
      departureTime: { $gte: now },
    })
      .populate('routeId', 'routeName origin destination')
      .populate('busId', 'busNumber busType')
      .sort({ departureTime: 1 })
      .limit(limit)
      .lean();

    return trips;
  }
}

module.exports = DashboardService;
