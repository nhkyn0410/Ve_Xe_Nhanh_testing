const BookingService = require('../services/booking.service');
const logger = require('../utils/logger');

/**
 * @route   POST /api/v1/bookings/hold-seats
 * @desc    Hold seats temporarily (15 minutes)
 * @access  Public
 */
exports.holdSeats = async (req, res) => {
  try {
    const { tripId, seats, contactInfo, pickupPoint, dropoffPoint, voucherCode } = req.body;

    // Validation
    if (!tripId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Thông tin không hợp lệ. Cần có tripId và danh sách ghế.',
      });
    }

    if (!contactInfo || !contactInfo.name || !contactInfo.phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Thông tin liên hệ không hợp lệ',
      });
    }

    // Validate each seat has required fields
    for (const seat of seats) {
      if (!seat.seatNumber || !seat.passengerName) {
        return res.status(400).json({
          status: 'error',
          message: 'Mỗi ghế cần có số ghế và tên hành khách',
        });
      }
    }

    // Get customer ID from authenticated user or guest session
    const customerId = req.user ? req.user._id : null;
    const isGuest = req.isGuest || !req.user;
    const guestInfo = req.guest || null;

    const result = await BookingService.holdSeats({
      tripId,
      seats,
      contactInfo,
      customerId,
      pickupPoint,
      dropoffPoint,
      voucherCode,
      isGuest,
      guestInfo,
    });

    res.status(201).json({
      status: 'success',
      data: result,
      message: 'Giữ ghế thành công. Vui lòng hoàn tất thanh toán trong 15 phút.',
    });
  } catch (error) {
    logger.error('Lỗi giữ ghế:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể giữ ghế. Vui lòng thử lại.',
    });
  }
};

/**
 * @route   POST /api/v1/bookings/:bookingId/confirm
 * @desc    Confirm booking after payment
 * @access  Public
 */
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID là bắt buộc',
      });
    }

    const booking = await BookingService.confirmBooking(bookingId, sessionId);

    res.status(200).json({
      status: 'success',
      data: { booking },
      message: 'Xác nhận booking thành công',
    });
  } catch (error) {
    logger.error('Lỗi xác nhận đặt chỗ:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể xác nhận booking',
    });
  }
};

/**
 * @route   POST /api/v1/bookings/:bookingId/cancel
 * @desc    Cancel booking
 * @access  Private (Customer or Operator)
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const cancelledBy = req.user.role === 'operator' ? 'operator' : 'customer';

    // Get IP address
    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const result = await BookingService.cancelBooking(
      bookingId,
      reason || 'Khách hủy',
      cancelledBy,
      ipAddress
    );

    res.status(200).json({
      status: 'success',
      data: {
        booking: result.booking,
        refundResult: result.refundResult,
      },
      message: 'Hủy booking thành công',
    });
  } catch (error) {
    logger.error('Lỗi hủy đặt chỗ:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể hủy booking',
    });
  }
};

/**
 * @route   POST /api/v1/bookings/guest/cancel
 * @desc    Cancel booking for guest users (no auth required)
 * @access  Public
 */
exports.cancelBookingGuest = async (req, res) => {
  try {
    const { bookingId, email, phone, reason } = req.body;

    // Validate required fields
    if (!bookingId) {
      return res.status(400).json({
        status: 'error',
        message: 'Mã đặt vé là bắt buộc',
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Email hoặc số điện thoại là bắt buộc để xác thực',
      });
    }

    // Get IP address
    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const result = await BookingService.cancelBookingGuest(
      bookingId,
      email,
      phone,
      reason || 'Khách hủy vé',
      ipAddress
    );

    res.status(200).json({
      status: 'success',
      data: {
        booking: result.booking,
        refundResult: result.refundResult,
      },
      message: 'Hủy vé thành công. Tiền sẽ được hoàn lại trong 3-7 ngày làm việc.',
    });
  } catch (error) {
    logger.error('Lỗi hủy đặt chỗ khách:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể hủy vé',
    });
  }
};

/**
 * @route   POST /api/v1/bookings/:bookingId/extend
 * @desc    Extend seat hold duration
 * @access  Public
 */
exports.extendHold = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { sessionId, minutes } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID là bắt buộc',
      });
    }

    const result = await BookingService.extendHold(
      bookingId,
      sessionId,
      minutes || 15
    );

    res.status(200).json({
      status: 'success',
      data: result,
      message: 'Gia hạn giữ ghế thành công',
    });
  } catch (error) {
    logger.error('Lỗi gia hạn giữ chỗ:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể gia hạn',
    });
  }
};

/**
 * @route   POST /api/v1/bookings/:bookingId/release
 * @desc    Release seat hold manually
 * @access  Public
 */
exports.releaseHold = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID là bắt buộc',
      });
    }

    const booking = await BookingService.releaseHold(bookingId, sessionId);

    res.status(200).json({
      status: 'success',
      data: { booking },
      message: 'Hủy giữ ghế thành công',
    });
  } catch (error) {
    logger.error('Lỗi phát hành giữ chỗ:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể hủy giữ ghế',
    });
  }
};

/**
 * @route   GET /api/v1/bookings/:bookingId
 * @desc    Get booking details
 * @access  Public (with authorization)
 */
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const customerId = req.user ? req.user._id : null;

    const booking = await BookingService.getBookingById(bookingId, customerId);

    res.status(200).json({
      status: 'success',
      data: { booking },
    });
  } catch (error) {
    logger.error('Lỗi lấy đặt chỗ:', error);
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy booking',
    });
  }
};

/**
 * @route   GET /api/v1/bookings/code/:bookingCode
 * @desc    Get booking by code (for guests)
 * @access  Public
 */
exports.getBookingByCode = async (req, res) => {
  try {
    const { bookingCode } = req.params;
    const { phone, email } = req.query;

    if (!phone && !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Số điện thoại hoặc email là bắt buộc',
      });
    }

    const booking = await BookingService.getBookingByCode(bookingCode, { phone, email });

    res.status(200).json({
      status: 'success',
      data: { booking },
    });
  } catch (error) {
    logger.error('Lỗi lấy đặt chỗ theo mã:', error);
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy booking',
    });
  }
};

/**
 * @route   GET /api/v1/bookings/trips/:tripId/available-seats
 * @desc    Get available seats for a trip
 * @access  Public
 */
exports.getAvailableSeats = async (req, res) => {
  try {
    const { tripId } = req.params;

    const seatsInfo = await BookingService.getAvailableSeats(tripId);

    res.status(200).json({
      status: 'success',
      data: seatsInfo,
    });
  } catch (error) {
    logger.error('Lỗi lấy ghế trống:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy thông tin ghế',
    });
  }
};

/**
 * @route   GET /api/v1/bookings/my-bookings
 * @desc    Get customer's bookings
 * @access  Private (Customer)
 */
exports.getMyBookings = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { status, fromDate, toDate } = req.query;

    const bookings = await BookingService.getCustomerBookings(customerId, {
      status,
      fromDate,
      toDate,
    });

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy đặt chỗ của tôi:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy danh sách booking',
    });
  }
};

/**
 * @route   GET /api/v1/operators/bookings
 * @desc    Get operator's bookings
 * @access  Private (Operator)
 */
exports.getOperatorBookings = async (req, res) => {
  try {
    const operatorId = req.user._id;
    const { status, paymentStatus, fromDate, toDate } = req.query;

    const bookings = await BookingService.getOperatorBookings(operatorId, {
      status,
      paymentStatus,
      fromDate,
      toDate,
    });

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy đặt chỗ nhà điều hành:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy danh sách booking',
    });
  }
};

/**
 * @route   GET /api/v1/operators/bookings/statistics
 * @desc    Get booking statistics for operator
 * @access  Private (Operator)
 */
exports.getStatistics = async (req, res) => {
  try {
    const operatorId = req.user._id;
    const { fromDate, toDate } = req.query;

    const stats = await BookingService.getStatistics(operatorId, {
      fromDate,
      toDate,
    });

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    logger.error('Lỗi lấy thống kê:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể lấy thống kê',
    });
  }
};

/**
 * @route   PUT /api/v1/operators/bookings/:bookingId/payment
 * @desc    Update booking payment status
 * @access  Private (Operator)
 */
exports.updatePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentId, paymentMethod, paymentStatus } = req.body;

    const booking = await BookingService.updatePayment(bookingId, {
      paymentId,
      paymentMethod,
      paymentStatus,
    });

    res.status(200).json({
      status: 'success',
      data: { booking },
      message: 'Cập nhật thanh toán thành công',
    });
  } catch (error) {
    logger.error('Lỗi cập nhật thanh đếnán:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Không thể cập nhật thanh toán',
    });
  }
};
