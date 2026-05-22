const GuestSessionService = require('../services/guestSession.service');
const logger = require('../utils/logger');
/**
 * Guest Authentication Middleware
 * Verifies guest session token and attaches guest data to request
 */
const guestAuth = async (req, res, next) => {
  try {
    // Get guest token from header
    const guestToken = req.headers['x-guest-token'];

    if (!guestToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Guest session token là bắt buộc',
        code: 'NO_GUEST_TOKEN',
      });
    }

    // Verify guest session
    const guestData = await GuestSessionService.verifySession(guestToken);

    if (!guestData) {
      return res.status(401).json({
        status: 'error',
        message: 'Guest session không hợp lệ hoặc đã hết hạn',
        code: 'INVALID_GUEST_SESSION',
      });
    }

    // Attach guest data to request
    req.guest = guestData;
    req.guestToken = guestToken;
    req.isGuest = true;

    next();
  } catch (error) {
    logger.error('Lỗi xác thực khách:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Xác thực guest thất bại',
      code: 'GUEST_AUTH_FAILED',
    });
  }
};

/**
 * Optional guest authentication
 * Allows both authenticated users and guests
 */
const optionalGuestAuth = async (req, res, next) => {
  try {
    // Check for regular auth token first
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Let the regular auth middleware handle this
      return next();
    }

    // Check for guest token
    const guestToken = req.headers['x-guest-token'];

    if (guestToken) {
      const guestData = await GuestSessionService.verifySession(guestToken);

      if (guestData) {
        req.guest = guestData;
        req.guestToken = guestToken;
        req.isGuest = true;
      }
    }

    next();
  } catch (error) {
    logger.error('Lỗi xác thực khách tùy chọn:', error);
    next();
  }
};

module.exports = {
  guestAuth,
  optionalGuestAuth,
};
