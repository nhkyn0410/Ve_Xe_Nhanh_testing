import api from './api';

/**
 * Review API Service
 * Handles all review-related API calls
 */

// ============================================================================
// Customer Review Management
// ============================================================================

/**
 * Create review for a booking
 * @param {string} bookingId - Booking ID
 * @param {Object} reviewData - Review data
 * @param {number} reviewData.overallRating - Overall rating (1-5, required)
 * @param {number} reviewData.vehicleRating - Vehicle rating (1-5, optional)
 * @param {number} reviewData.driverRating - Driver rating (1-5, optional)
 * @param {number} reviewData.punctualityRating - Punctuality rating (1-5, optional)
 * @param {number} reviewData.serviceRating - Service rating (1-5, optional)
 * @param {string} reviewData.comment - Review comment (max 500 chars, optional)
 * @param {Array<string>} reviewData.images - Image URLs (max 5, optional)
 */
export const createReview = async (bookingId, reviewData) => {
  return api.post(`/reviews/bookings/${bookingId}/review`, reviewData);
};

/**
 * Check if can review a booking
 * @param {string} bookingId - Booking ID
 */
export const canReview = async (bookingId) => {
  return api.get(`/reviews/bookings/${bookingId}/can-review`);
};

/**
 * Send review invitation email
 * @param {string} bookingId - Booking ID
 */
export const sendReviewInvitation = async (bookingId) => {
  return api.post(`/reviews/bookings/${bookingId}/send-review-invitation`);
};

/**
 * Get my reviews (customer)
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export const getMyReviews = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/reviews/users/my-reviews${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get the current user's completed bookings awaiting a review
 * @returns {Promise<Object>} { success, pending: [...], total }
 */
export const getPendingReviews = async () => {
  return api.get('/reviews/users/pending-reviews');
};

// ============================================================================
// Public Review Queries
// ============================================================================

/**
 * Get reviews for a trip
 * @param {string} tripId - Trip ID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.sort - Sort order
 */
export const getTripReviews = async (tripId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/reviews/trips/${tripId}/reviews${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get reviews for an operator
 * @param {string} operatorId - Operator ID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.sort - Sort order
 */
export const getOperatorReviews = async (operatorId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/reviews/operators/${operatorId}/reviews${queryString ? `?${queryString}` : ''}`);
};

// ============================================================================
// Operator Review Management
// ============================================================================

/**
 * Add operator response to review
 * @param {string} reviewId - Review ID
 * @param {Object} responseData - Response data
 * @param {string} responseData.operatorResponse - Operator response text
 */
export const addOperatorResponse = async (reviewId, responseData) => {
  return api.post(`/reviews/reviews/${reviewId}/response`, responseData);
};

// ============================================================================
// Review Reporting
// ============================================================================

/**
 * Report a review
 * @param {string} reviewId - Review ID
 * @param {Object} reportData - Report data
 * @param {string} reportData.reportReason - Reason for reporting
 */
export const reportReview = async (reviewId, reportData) => {
  return api.post(`/reviews/reviews/${reviewId}/report`, reportData);
};

// ============================================================================
// Export all methods
// ============================================================================

export default {
  createReview,
  canReview,
  sendReviewInvitation,
  getMyReviews,
  getPendingReviews,
  getTripReviews,
  getOperatorReviews,
  addOperatorResponse,
  reportReview,
};
