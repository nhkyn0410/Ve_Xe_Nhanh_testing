const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const logger = require('../utils/logger');
/**
 * Security Middleware
 * Tổng hợp các middleware bảo mật
 */

/**
 * Sanitize data to prevent NoSQL injection attacks
 * Removes any keys that start with '$' or contain '.'
 */
const sanitizeData = () =>
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ key }) => {
      logger.warn(`[Bảo mật] Phát hiện cố gắng tiêm NoSQL: ${key}`);
    },
  });

/**
 * Prevent XSS attacks by sanitizing user input
 * Clean user input from malicious HTML/JavaScript
 */
const preventXSS = () => xss();

/**
 * Prevent HTTP Parameter Pollution attacks
 * Protects against duplicate parameters in query strings
 */
const preventHPP = () =>
  hpp({
    whitelist: [
      // Các parameters được phép duplicate
      'price',
      'rating',
      'seats',
      'date',
    ],
  });

/**
 * Security headers configuration
 * Already using Helmet.js, but can add custom headers here
 */
const setSecurityHeaders = (req, res, next) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  next();
};

/**
 * Request sanitization
 * Remove potentially dangerous characters from request
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitize req.body
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Remove null bytes
        req.body[key] = req.body[key].replace(/\0/g, '');

        // Trim whitespace
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Sanitize req.params
  if (req.params) {
    Object.keys(req.params).forEach((key) => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = req.params[key].replace(/\0/g, '').trim();
      }
    });
  }

  // Sanitize req.query
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/\0/g, '').trim();
      }
    });
  }

  next();
};

/**
 * Log security events
 */
const logSecurityEvent = (eventType, details, req) => {
  logger.warn('[Sự kiện bảo mật]', {
    type: eventType,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    path: req.path,
    ...details,
  });
};

/**
 * Detect and prevent common attack patterns
 */
const detectAttackPatterns = (req, res, next) => {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // XSS
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers
    /\$\{.*\}/g, // Template injection
    /\.\.\//g, // Path traversal
    /<iframe/gi, // Iframe injection
  ];

  const checkString = (str) => suspiciousPatterns.some((pattern) => pattern.test(str));

  // Check all string values in request
  const checkObject = (obj, path = '') => {
    const entries = Object.entries(obj);

    for (let index = 0; index < entries.length; index += 1) {
      const [key, value] = entries[index];
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string' && checkString(value)) {
        logSecurityEvent(
          'ATTACK_PATTERN_DETECTED',
          {
            field: currentPath,
            value: value.substring(0, 100),
          },
          req
        );

        return res.status(400).json({
          status: 'error',
          message: 'Yêu cầu chứa nội dung không hợp lệ',
        });
      }

      if (typeof value === 'object' && value !== null) {
        const result = checkObject(value, currentPath);
        if (result) return result;
      }
    }
  };

  // Check request body
  if (req.body && typeof req.body === 'object') {
    const result = checkObject(req.body);
    if (result) return result;
  }

  // Check query parameters
  if (req.query && typeof req.query === 'object') {
    const result = checkObject(req.query);
    if (result) return result;
  }

  next();
};

/**
 * Prevent timing attacks on sensitive operations
 */
const constantTimeResponse = async (promise, minDelay = 100) => {
  const start = Date.now();
  const result = await promise;
  const elapsed = Date.now() - start;
  const remaining = Math.max(0, minDelay - elapsed);

  if (remaining > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, remaining);
    });
  }

  return result;
};

module.exports = {
  sanitizeData,
  preventXSS,
  preventHPP,
  setSecurityHeaders,
  sanitizeRequest,
  detectAttackPatterns,
  logSecurityEvent,
  constantTimeResponse,
};
