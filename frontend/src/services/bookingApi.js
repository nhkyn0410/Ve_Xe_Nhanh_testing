import api from './api';

/**
 * Booking API Service
 * Handles all booking-related API calls
 */

// Search trips
export const searchTrips = async (searchParams) => {
  const queryString = new URLSearchParams(searchParams).toString();
  return api.get(`/trips/search?${queryString}`);
};

// Get trip details
export const getTripDetails = async (tripId) => {
  return api.get(`/trips/${tripId}`);
};

// Get dynamic price for a trip
export const getTripDynamicPrice = async (tripId, bookingDate) => {
  const params = bookingDate ? `?bookingDate=${bookingDate}` : '';
  return api.get(`/trips/${tripId}/dynamic-price${params}`);
};

// Get available seats for a trip
export const getAvailableSeats = async (tripId) => {
  return api.get(`/bookings/trips/${tripId}/available-seats`);
};

// Hold seats temporarily
export const holdSeats = async (holdData) => {
  return api.post('/bookings/hold-seats', holdData);
};

// Extend seat hold
export const extendHold = async (bookingId, sessionId, minutes = 15) => {
  return api.post(`/bookings/${bookingId}/extend`, { sessionId, minutes });
};

// Release held seats
export const releaseSeats = async (bookingId, sessionId) => {
  return api.post(`/bookings/${bookingId}/release`, { sessionId });
};

// Confirm booking (after payment)
export const confirmBooking = async (bookingId, sessionId) => {
  return api.post(`/bookings/${bookingId}/confirm`, { sessionId });
};

// Get booking by code (optional phone/email for guest lookup)
export const getBookingByCode = async (bookingCode, verification) => {
  const params =
    typeof verification === 'string'
      ? { phone: verification }
      : Object.fromEntries(
          Object.entries(verification || {}).filter(([, value]) => Boolean(value))
        );

  return api.get(`/bookings/code/${bookingCode}`, {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
};

// Cancel booking
export const cancelBooking = async (bookingId, reason) => {
  return api.post(`/bookings/${bookingId}/cancel`, { reason });
};

// Cancel booking for guest users (no auth required)
export const cancelBookingGuest = async ({ bookingId, email, phone, reason }) => {
  return api.post('/bookings/guest/cancel', { bookingId, email, phone, reason });
};

// Payment APIs

// Get payment methods
export const getPaymentMethods = async () => {
  return api.get('/payments/methods');
};

// Get bank list for VNPay
export const getBankList = async () => {
  return api.get('/payments/banks');
};

// Create payment
export const createPayment = async (paymentData) => {
  return api.post('/payments/create', paymentData);
};

// Get payment by code
export const getPaymentByCode = async (paymentCode) => {
  return api.get(`/payments/code/${paymentCode}`);
};

// Query payment status
export const queryPaymentStatus = async (paymentCode) => {
  return api.get(`/payments/${paymentCode}/status`);
};

// Voucher APIs

// Validate voucher
export const validateVoucher = async (code, bookingInfo) => {
  return api.post('/vouchers/validate', { code, ...bookingInfo });
};

// Get public vouchers
export const getPublicVouchers = async (filters) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters || {}).filter(([, value]) => Boolean(value))
  );
  return api.get('/vouchers/public', { params: cleanFilters });
};

// Get current customer's voucher wallet
export const getVoucherWallet = async () => {
  return api.get('/vouchers/wallet');
};

// Save a voucher to current customer's wallet
export const saveVoucherToWallet = async (voucher) => {
  return api.post('/vouchers/wallet', voucher);
};

// Remove a voucher from current customer's wallet
export const removeVoucherFromWallet = async (voucherId) => {
  return api.delete(`/vouchers/wallet/${voucherId}`);
};

export default {
  searchTrips,
  getTripDetails,
  getTripDynamicPrice,
  getAvailableSeats,
  holdSeats,
  extendHold,
  releaseSeats,
  confirmBooking,
  getBookingByCode,
  cancelBooking,
  cancelBookingGuest,
  getPaymentMethods,
  getBankList,
  createPayment,
  getPaymentByCode,
  queryPaymentStatus,
  validateVoucher,
  getPublicVouchers,
  getVoucherWallet,
  saveVoucherToWallet,
  removeVoucherFromWallet,
};
