import api from './api';

/**
 * Customer Authentication API Service
 * Handles customer registration, login, and account management
 */

// Register new customer
export const register = async (userData) => api.post('/auth/register', userData);

// Login customer
export const login = async (credentials) => api.post('/auth/login', credentials);

// Logout customer
export const logout = async () => api.post('/auth/logout');

// Get current user profile
export const getProfile = async () => api.get('/auth/me');

// Get customer profile details
export const getUserProfile = async () => api.get('/users/profile');

// Update customer profile details
export const updateProfile = async (profileData) => api.put('/users/profile', profileData);

// Change customer password
export const changePassword = async (passwordData) => api.put('/users/change-password', passwordData);

// Upload customer avatar
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);

  return api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Delete customer avatar
export const deleteAvatar = async () => api.delete('/users/avatar');

// Saved passengers — add a frequently-traveled companion
// Body: { fullName, phone, idCard }
export const addSavedPassenger = async (passengerData) =>
  api.post('/users/saved-passengers', passengerData);

// Saved passengers — remove by sub-document id
export const removeSavedPassenger = async (passengerId) =>
  api.delete(`/users/saved-passengers/${passengerId}`);

// Refresh token
export const refreshToken = async (token) => api.post('/auth/refresh-token', { refreshToken: token });

// Forgot password
export const forgotPassword = async (email) => api.post('/auth/forgot-password', { email });

// Reset password — backend expects { resetToken, newPassword }
export const resetPassword = async (resetToken, newPassword) =>
  api.post('/auth/reset-password', { resetToken, newPassword });

// Verify email
export const verifyEmail = async (token) => api.get(`/auth/verify-email/${token}`);

// Send phone OTP
export const sendPhoneOTP = async (phoneNumber) => api.post('/auth/send-phone-otp', { phoneNumber });

// Verify phone
export const verifyPhone = async (phoneNumber, otp) => api.post('/auth/verify-phone', { phoneNumber, otp });

// Google OAuth
export const googleOAuth = async (googleToken) => api.post('/auth/google', { token: googleToken });

// Facebook OAuth
export const facebookOAuth = async (facebookToken) => api.post('/auth/facebook', { token: facebookToken });

export default {
  register,
  login,
  logout,
  getProfile,
  getUserProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  addSavedPassenger,
  removeSavedPassenger,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendPhoneOTP,
  verifyPhone,
  googleOAuth,
  facebookOAuth,
};
