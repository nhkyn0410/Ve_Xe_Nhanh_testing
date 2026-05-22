import api from './api';

/**
 * Content API Service
 * Handles banner (trang chủ), blog (Cẩm nang & tin tức) and FAQ endpoints.
 * The axios interceptor in services/api.js already unwraps `response.data`,
 * so each call resolves to the JSON body: { status, data, pagination }.
 */

// ============================================================================
// Banner (Trang chủ / khuyến mãi)
// ============================================================================

/**
 * Get active banners for a position (default: homepage).
 * Backend filters isActive + date window and sorts by `order`.
 * @param {string} position - homepage | booking | routes | footer
 * @returns {Promise<{ status, data: Banner[] }>}
 */
export const getBanners = async (position = 'homepage') => {
  return api.get(`/content/banners?position=${encodeURIComponent(position)}`);
};

/**
 * Track a banner impression (fire-and-forget).
 * @param {string} id - Banner _id
 */
export const trackBannerView = async (id) => {
  return api.post(`/content/banners/${id}/view`);
};

/**
 * Track a banner click (fire-and-forget).
 * @param {string} id - Banner _id
 */
export const trackBannerClick = async (id) => {
  return api.post(`/content/banners/${id}/click`);
};

// ============================================================================
// Blog (Cẩm nang & tin tức)
// ============================================================================

/**
 * Get published blog posts.
 * @param {Object} params - { category, tag, search, page, limit, sort }
 * @returns {Promise<{ status, data: Blog[], pagination }>}
 */
export const getBlogs = async (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );
  const queryString = new URLSearchParams(cleaned).toString();
  return api.get(`/content/blogs${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a single blog post by slug (also returns related posts).
 * @param {string} slug
 * @returns {Promise<{ status, data: { blog, relatedBlogs } }>}
 */
export const getBlogBySlug = async (slug) => {
  return api.get(`/content/blogs/${slug}`);
};

/**
 * Like a blog post.
 * @param {string} blogId
 */
export const likeBlog = async (blogId) => {
  return api.post(`/content/blogs/${blogId}/like`);
};

// ============================================================================
// FAQ (Câu hỏi thường gặp)
// ============================================================================

/**
 * Get FAQs (optionally filtered by category or full-text search).
 * @param {Object} params - { category, search }
 * @returns {Promise<{ status, data: { faqs, grouped } }>}
 */
export const getFAQs = async (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );
  const queryString = new URLSearchParams(cleaned).toString();
  return api.get(`/content/faqs${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a single FAQ by id.
 * @param {string} id
 */
export const getFAQById = async (id) => {
  return api.get(`/content/faqs/${id}`);
};

/**
 * Submit helpful / not-helpful feedback for an FAQ.
 * @param {string} id
 * @param {boolean} helpful
 */
export const markFAQHelpful = async (id, helpful) => {
  return api.post(`/content/faqs/${id}/helpful`, { helpful });
};

export default {
  getBanners,
  trackBannerView,
  trackBannerClick,
  getBlogs,
  getBlogBySlug,
  likeBlog,
  getFAQs,
  getFAQById,
  markFAQHelpful,
};
