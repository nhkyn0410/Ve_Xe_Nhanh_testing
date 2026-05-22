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

// Refresh token
export const refreshToken = async (token) => api.post('/auth/refresh-token', { refreshToken: token });

// Forgot password
export const forgotPassword = async (email) => api.post('/auth/forgot-password', { email });

// Reset password
export const resetPassword = async (token, newPassword) => api.post('/auth/reset-password', { token, newPassword });

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
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendPhoneOTP,
  verifyPhone,
  googleOAuth,
  facebookOAuth,
};
