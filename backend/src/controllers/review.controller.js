const reviewService = require('../services/review.service');
const logger = require('../utils/logger');

/**
 * Review Controller
 * Handles HTTP requests for review operations
 */
class ReviewController {
  /**
   * Create a new review for a booking
   * POST /api/bookings/:bookingId/review
   */
  async createReview(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user._id;
      const reviewData = req.body;

      // Validate required fields
      if (!reviewData.overallRating) {
        return res.status(400).json({
          success: false,
          message: 'Đánh giá tổng thể là bắt buộc',
        });
      }

      const result = await reviewService.createReview(userId, bookingId, reviewData);

      res.status(201).json(result);
    } catch (error) {
      logger.error(' Lỗi trtrêng tạo đánh giá:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể tạo đánh giá',
      });
    }
  }

  /**
   * Get reviews for a trip
   * GET /api/trips/:tripId/reviews
   */
  async getTripReviews(req, res) {
    try {
      const { tripId } = req.params;
      const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

      const result = await reviewService.getTripReviews(tripId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error(' Lỗi trtrêng lấy đánh giá chuyến:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể lấy danh sách đánh giá',
      });
    }
  }

  /**
   * Get reviews for an operator
   * GET /api/operators/:operatorId/reviews
   */
  async getOperatorReviews(req, res) {
    try {
      const { operatorId } = req.params;
      const { page = 1, limit = 10, sort = '-createdAt', minRating = 1 } = req.query;

      const result = await reviewService.getOperatorReviews(operatorId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        minRating: parseInt(minRating),
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error(' Lỗi trtrêng lấy đánh giá nhà điều hành:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể lấy danh sách đánh giá',
      });
    }
  }

  /**
   * Get current user's reviews
   * GET /api/users/my-reviews
   */
  async getMyReviews(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;

      const result = await reviewService.getUserReviews(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error(' Lỗi trtrêng lấy đánh giá của tôi:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể lấy danh sách đánh giá',
      });
    }
  }

  /**
   * Get current user's completed bookings awaiting a review
   * GET /api/reviews/users/pending-reviews
   */
  async getPendingReviews(req, res) {
    try {
      const userId = req.user._id;

      const result = await reviewService.getPendingReviews(userId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Lỗi khi lấy danh sách chờ đánh giá:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể lấy danh sách chờ đánh giá',
      });
    }
  }

  /**
   * Check if user can review a booking
   * GET /api/bookings/:bookingId/can-review
   */
  async canReview(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user._id;

      const result = await reviewService.canReview(userId, bookingId);

      res.status(200).json(result);
    } catch (error) {
      logger.error(' Lỗi trtrêng kiểm tra có thể đánh giá:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể kiểm tra',
      });
    }
  }

  /**
   * Add operator response to a review
   * POST /api/reviews/:reviewId/response
   */
  async addOperatorResponse(req, res) {
    try {
      const { reviewId } = req.params;
      const operatorId = req.user._id; // Assuming operator is authenticated
      const { response } = req.body;

      if (!response || response.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Phản hồi không được để trống',
        });
      }

      const result = await reviewService.addOperatorResponse(reviewId, operatorId, response);

      res.status(200).json(result);
    } catch (error) {
      logger.error(' Lỗi trtrêng thêm phản hồi nhà điều hành:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể thêm phản hồi',
      });
    }
  }

  /**
   * Report a review
   * POST /api/reviews/:reviewId/report
   */
  async reportReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lý do báo cáo là bắt buộc',
        });
      }

      const result = await reviewService.reportReview(reviewId, reason);

      res.status(200).json(result);
    } catch (error) {
      logger.error(' Lỗi trtrêng báo cáo đánh giá:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể báo cáo đánh giá',
      });
    }
  }

  /**
   * Send review invitation email
   * POST /api/bookings/:bookingId/send-review-invitation
   */
  async sendReviewInvitation(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user._id;

      const result = await reviewService.sendReviewInvitation(userId, bookingId);

      res.status(200).json({
        success: true,
        message: 'Email mời đánh giá đã được gửi',
        ...result,
      });
    } catch (error) {
      logger.error(' Lỗi trtrêng gửi lời mời đánh giá:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Không thể gửi email mời đánh giá',
      });
    }
  }
}

module.exports = new ReviewController();
