import api from './api';

/**
 * Loyalty API Service
 * Handles all loyalty program related API calls
 */

// ============================================================================
// Loyalty Program Management
// ============================================================================

/**
 * Get loyalty overview
 * @returns {Promise<Object>} Loyalty overview data
 */
export const getLoyaltyOverview = async () => {
  return api.get('/users/loyalty/overview');
};

/**
 * Get loyalty history
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (optional, default: 1)
 * @param {number} params.limit - Items per page (optional, default: 20)
 * @param {string} params.type - Filter by type: earn, redeem, expire (optional)
 * @returns {Promise<Object>} Loyalty history data
 */
export const getLoyaltyHistory = async (params = {}) => {
  // Strip undefined/null/empty values so they aren't serialized as the
  // literal string "undefined" (which would break server-side filtering).
  const clean = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
  const queryString = new URLSearchParams(clean).toString();
  return api.get(`/users/loyalty/history${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get points history (legacy endpoint)
 * @returns {Promise<Object>} Points history data
 */
export const getPointsHistory = async () => {
  return api.get('/users/points-history');
};

/**
 * Redeem points for discount
 * @param {Object} redeemData - Redemption data
 * @param {number} redeemData.points - Number of points to redeem (min: 100)
 * @returns {Promise<Object>} Redemption result
 */
export const redeemPoints = async (redeemData) => {
  return api.post('/users/loyalty/redeem', redeemData);
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Vietnamese label for loyalty tier
 * @param {string} tier - Tier key
 * @returns {string} Vietnamese label
 */
export const getTierLabel = (tier) => {
  const labels = {
    bronze: 'Đồng',
    silver: 'Bạc',
    gold: 'Vàng',
    platinum: 'Bạch Kim',
  };
  return labels[tier] || tier;
};

/**
 * Get color for tier badge
 * @param {string} tier - Tier key
 * @returns {string} Hex color
 */
export const getTierColor = (tier) => {
  const colors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
  };
  return colors[tier] || colors.bronze;
};

/**
 * Get gradient colors for tier
 * @param {string} tier - Tier key
 * @returns {Object} Gradient colors
 */
export const getTierGradient = (tier) => {
  const gradients = {
    bronze: {
      from: '#cd7f32',
      to: '#b87333',
    },
    silver: {
      from: '#c0c0c0',
      to: '#a8a8a8',
    },
    gold: {
      from: '#ffd700',
      to: '#ffed4e',
    },
    platinum: {
      from: '#e5e4e2',
      to: '#b0aeab',
    },
  };
  return gradients[tier] || gradients.bronze;
};

/**
 * Get icon for transaction type
 * @param {string} type - Transaction type
 * @returns {string} Icon emoji
 */
export const getTransactionIcon = (type) => {
  const icons = {
    earn: '💰',
    redeem: '🎁',
    expire: '',
  };
  return icons[type] || '📝';
};

/**
 * Get Vietnamese label for transaction type
 * @param {string} type - Transaction type
 * @returns {string} Vietnamese label
 */
export const getTransactionLabel = (type) => {
  const labels = {
    earn: 'Tích điểm',
    redeem: 'Đổi điểm',
    expire: 'Hết hạn',
  };
  return labels[type] || type;
};

/**
 * Get color for transaction type
 * @param {string} type - Transaction type
 * @returns {string} Ant Design color
 */
export const getTransactionColor = (type) => {
  const colors = {
    earn: 'green',
    redeem: 'blue',
    expire: 'red',
  };
  return colors[type] || 'default';
};

/**
 * Format points with sign
 * @param {number} points - Points value
 * @param {string} type - Transaction type
 * @returns {string} Formatted points
 */
export const formatPoints = (points, type) => {
  if (type === 'earn') {
    return `+${points}`;
  } else if (type === 'redeem' || type === 'expire') {
    return `-${Math.abs(points)}`;
  }
  return points.toString();
};

/**
 * Format currency (VND)
 * @param {number} amount - Amount in VND
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
  return amount.toLocaleString('vi-VN') + ' VND';
};

/**
 * Calculate discount from points
 * @param {number} points - Number of points
 * @returns {number} Discount amount in VND
 */
export const calculateDiscount = (points) => {
  return points * 1000; // 1 point = 1,000 VND
};

/**
 * Calculate points needed for discount
 * @param {number} discountAmount - Desired discount in VND
 * @returns {number} Points needed
 */
export const calculatePointsNeeded = (discountAmount) => {
  return Math.ceil(discountAmount / 1000);
};

/**
 * Get tier benefits description
 * @param {string} tier - Tier key
 * @returns {Array<string>} Benefits array
 */
export const getTierBenefits = (tier) => {
  const benefits = {
    bronze: [
      '🎯 Tích điểm cơ bản: 1 điểm/10,000 VND',
      '🎁 Đổi điểm lấy giảm giá',
      '📧 Nhận thông báo ưu đãi',
    ],
    silver: [
      '⭐ Tích điểm x1.2',
      '🎁 Đổi điểm lấy giảm giá',
      '🎟️ Ưu tiên đặt chỗ',
      '📧 Nhận ưu đãi đặc biệt',
    ],
    gold: [
      '⭐⭐ Tích điểm x1.5',
      '🎁 Đổi điểm với tỷ lệ tốt hơn',
      '🎟️ Ưu tiên đặt chỗ cao',
      '🎂 Quà tặng sinh nhật',
      '📧 Ưu đãi VIP',
    ],
    platinum: [
      '⭐⭐⭐ Tích điểm x2.0',
      '🎁 Đổi điểm tỷ lệ cao nhất',
      '🎟️ Ưu tiên đặt chỗ tuyệt đối',
      '🎂 Quà tặng sinh nhật đặc biệt',
      '🚗 Nâng cấp miễn phí',
      '👨‍💼 Hỗ trợ khách hàng VIP',
      '📧 Ưu đãi độc quyền',
    ],
  };
  return benefits[tier] || benefits.bronze;
};

/**
 * Get tier requirements
 * @returns {Array<Object>} Tier requirements
 */
export const getTierRequirements = () => {
  return [
    { tier: 'bronze', minPoints: 0, label: 'Đồng', color: '#cd7f32' },
    { tier: 'silver', minPoints: 2000, label: 'Bạc', color: '#c0c0c0' },
    { tier: 'gold', minPoints: 5000, label: 'Vàng', color: '#ffd700' },
    { tier: 'platinum', minPoints: 10000, label: 'Bạch Kim', color: '#e5e4e2' },
  ];
};

// ============================================================================
// Export all methods
// ============================================================================

export default {
  getLoyaltyOverview,
  getLoyaltyHistory,
  getPointsHistory,
  redeemPoints,
  getTierLabel,
  getTierColor,
  getTierGradient,
  getTransactionIcon,
  getTransactionLabel,
  getTransactionColor,
  formatPoints,
  formatCurrency,
  calculateDiscount,
  calculatePointsNeeded,
  getTierBenefits,
  getTierRequirements,
};
