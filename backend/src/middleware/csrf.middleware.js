const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * CSRF Protection Middleware
 *
 * Note: CSRF protection is typically not needed for APIs using JWT tokens
 * because JWT tokens are not automatically sent by the browser like cookies.
 * However, this is implemented for completeness and can be enabled if needed.
 *
 * For JWT-based APIs, the main security comes from:
 * 1. Not storing tokens in cookies (use localStorage/sessionStorage)
 * 2. Using HTTPS
 * 3. Validating Origin/Referer headers
 */

/**
 * Generate CSRF token
 */
const generateCSRFToken = () => crypto.randomBytes(32).toString('hex');

/**
 * CSRF token validation middleware
 * Only enable this if you're using cookie-based sessions
 */
const validateCSRFToken = (req, res, next) => {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Get CSRF token from header or body
  const { _csrf: bodyToken } = req.body || {};
  const token = req.headers['x-csrf-token'] || bodyToken;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      status: 'error',
      message: 'CSRF token không hợp lệ',
    });
  }

  next();
};

/**
 * Set CSRF token in session
 * This middleware generates and stores a CSRF token in the session
 */
const setCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  next();
};

/**
 * Get CSRF token endpoint
 * Clients can call this to get a CSRF token
 */
const getCSRFToken = (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  res.status(200).json({
    status: 'success',
    data: {
      csrfToken: req.session.csrfToken,
    },
  });
};

/**
 * Origin validation middleware
 * More relevant for JWT-based APIs
 */
const validateOrigin = (req, res, next) => {
  const origin = req.get('origin');

  // Skip for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Allowed origins from environment variable + current backend origin for Swagger UI
  const allowedOrigins = [
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
    process.env.FRONTEND_URL,
    `${req.protocol}://${req.get('host')}`,
  ]
    .filter(Boolean)
    .map((value) => value.replace(/\/+$/, ''));

  // Check if request is from an allowed origin
  if (origin) {
    const normalizedOrigin = origin.replace(/\/+$/, '');
    const isAllowed = allowedOrigins.some(
      (allowed) => normalizedOrigin === allowed || normalizedOrigin.startsWith(`${allowed}/`)
    );

    if (!isAllowed && process.env.NODE_ENV === 'production') {
      logger.warn('[Bảo mật] Yêu cầu từ nguồn không được phép:', origin);
      return res.status(403).json({
        status: 'error',
        message: 'Yêu cầu từ nguồn không được phép',
      });
    }
  }

  next();
};

/**
 * Double submit cookie pattern
 * Alternative CSRF protection for JWT APIs
 */
const doubleSubmitCookie = (req, res, next) => {
  // Generate or get existing token
  let token = req.cookies?.csrfToken;

  if (!token) {
    token = generateCSRFToken();
    res.cookie('csrfToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });
  }

  // For state-changing methods, validate token
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!safeMethods.includes(req.method)) {
    const headerToken = req.headers['x-csrf-token'];

    if (!headerToken || headerToken !== token) {
      return res.status(403).json({
        status: 'error',
        message: 'CSRF token không hợp lệ',
      });
    }
  }

  next();
};

module.exports = {
  generateCSRFToken,
  validateCSRFToken,
  setCSRFToken,
  getCSRFToken,
  validateOrigin,
  doubleSubmitCookie,
};
