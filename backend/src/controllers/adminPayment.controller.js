const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Admin Payment Controller
 * System-admin oversight of every operator's payment transactions
 * (UC — system transactions). Read-only reconciliation built entirely on
 * real Payment records: real amounts, real refundAmount, the canonical
 * Payment.status lifecycle and the real paymentMethod enum. No fabricated
 * "system commission" (there is no commission field) and no fake realtime
 * gateway-health feed — those design elements have no backing data.
 */

const STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
  'partial_refund',
];

const METHODS = ['vnpay', 'atm_card', 'credit_card', 'debit_card', 'momo', 'zalopay', 'cash'];

/**
 * @route   GET /api/v1/admin/payments
 * @desc    List every payment across all operators with real amounts
 * @access  Private (Admin)
 */
exports.getAllPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status && STATUSES.includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (req.query.method && METHODS.includes(req.query.method)) {
      query.paymentMethod = req.query.method;
    }

    if (req.query.operatorId && mongoose.Types.ObjectId.isValid(req.query.operatorId)) {
      query.operatorId = req.query.operatorId;
    }

    // Date lens on createdAt
    const now = new Date();
    if (req.query.range === 'today') {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: s, $lte: e };
    } else if (req.query.range === '7d') {
      const s = new Date(now); s.setDate(s.getDate() - 7);
      query.createdAt = { $gte: s };
    } else if (req.query.range === '30d') {
      const s = new Date(now); s.setDate(s.getDate() - 30);
      query.createdAt = { $gte: s };
    }

    // Cross-collection search: resolve booking/customer refs first.
    if (req.query.search) {
      const rx = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const [bookingIds, customerIds] = await Promise.all([
        Booking.find({ bookingCode: rx }).distinct('_id'),
        User.find({ $or: [{ fullName: rx }, { email: rx }, { phone: rx }] }).distinct('_id'),
      ]);
      query.$or = [
        { paymentCode: rx },
        { transactionId: rx },
        { bookingId: { $in: bookingIds } },
        { customerId: { $in: customerIds } },
      ];
    }

    const [total, payments] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .populate('customerId', 'fullName email phone')
        .populate('operatorId', 'operatorName companyName')
        .populate('bookingId', 'bookingCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          'paymentCode bookingId customerId operatorId paymentMethod paymentGateway amount refundAmount status transactionId createdAt completedAt refundedAt failedAt'
        )
        .lean(),
    ]);

    const data = payments.map((p) => {
      const { bookingId, customerId, operatorId, ...rest } = p;
      return {
        ...rest,
        bookingCode: bookingId?.bookingCode || null,
        customer: customerId
          ? { name: customerId.fullName, email: customerId.email, phone: customerId.phone }
          : null,
        operator: operatorId?.companyName || null,
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
    logger.error('Lỗi lấy danh sách giao dịch (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể tải danh sách giao dịch',
    });
  }
};

/**
 * @route   GET /api/v1/admin/payments/statistics
 * @desc    System-wide payment KPIs (all real)
 * @access  Private (Admin)
 */
exports.getPaymentStatistics = async (req, res) => {
  try {
    const now = new Date();
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(now); endToday.setHours(23, 59, 59, 999);

    const [overallAgg, byStatusAgg, methodAgg, todayAgg] = await Promise.all([
      Payment.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            completedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $in: ['$status', ['failed', 'cancelled']] }, 1, 0] },
            },
            refunded: {
              $sum: { $cond: [{ $in: ['$status', ['refunded', 'partial_refund']] }, 1, 0] },
            },
            totalRefundAmount: { $sum: '$refundAmount' },
            avgPaymentAmount: { $avg: '$amount' },
          },
        },
      ]),
      Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Payment.aggregate([
        { $match: { createdAt: { $gte: startToday, $lte: endToday } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const o = overallAgg[0] || {
      total: 0,
      totalAmount: 0,
      completedAmount: 0,
      completed: 0,
      failed: 0,
      refunded: 0,
      totalRefundAmount: 0,
      avgPaymentAmount: 0,
    };

    const byStatus = STATUSES.reduce((acc, s) => { acc[s] = 0; return acc; }, {});
    byStatusAgg.forEach((r) => { if (r._id in byStatus) byStatus[r._id] = r.count; });

    const methodBreakdown = METHODS.map((m) => {
      const hit = methodAgg.find((x) => x._id === m);
      return {
        method: m,
        count: hit ? hit.count : 0,
        totalAmount: hit ? hit.totalAmount : 0,
      };
    }).filter((m) => m.count > 0);

    const today = todayAgg[0] || { count: 0, amount: 0 };

    return res.status(200).json({
      status: 'success',
      data: {
        total: o.total,
        totalAmount: o.totalAmount,
        completedAmount: o.completedAmount,
        avgPaymentAmount: o.avgPaymentAmount != null ? Math.round(o.avgPaymentAmount) : 0,
        successRate: o.total > 0 ? Math.round((o.completed / o.total) * 1000) / 10 : 0,
        failureRate: o.total > 0 ? Math.round((o.failed / o.total) * 1000) / 10 : 0,
        completed: o.completed,
        failed: o.failed,
        refunded: o.refunded,
        totalRefundAmount: o.totalRefundAmount,
        today: { count: today.count, amount: today.amount },
        byStatus,
        methodBreakdown,
      },
    });
  } catch (error) {
    logger.error('Lỗi thống kê giao dịch (admin):', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể tải thống kê giao dịch',
    });
  }
};
