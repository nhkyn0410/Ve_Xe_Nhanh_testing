const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const logger = require('./utils/logger');
const { setupSwagger } = require('./docs/swagger');

// Load environment variables
dotenv.config();

// Import configurations
const connectDB = require('./config/database');
const connectRedis = require('./config/redis');
const websocketService = require('./services/websocket.service');
const schedulerService = require('./services/scheduler.service');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const operatorRoutes = require('./routes/operator.routes');
const employeeRoutes = require('./routes/employee.routes');
const adminRoutes = require('./routes/admin.routes');
const routeRoutes = require('./routes/route.routes');
const busRoutes = require('./routes/bus.routes');
const tripRoutes = require('./routes/trip.routes');
const bookingRoutes = require('./routes/booking.routes');
const voucherRoutes = require('./routes/voucher.routes');
const paymentRoutes = require('./routes/payment.routes');
const ticketRoutes = require('./routes/ticket.routes');
const tripManagerRoutes = require('./routes/tripManager.routes');
const complaintRoutes = require('./routes/complaint.routes');
const contentRoutes = require('./routes/content.routes');
const reviewRoutes = require('./routes/review.routes');
const guestRoutes = require('./routes/guest.routes');

// Import middleware
const errorHandler = require('./middleware/error.middleware');
const {
  sanitizeData,
  preventXSS,
  preventHPP,
  setSecurityHeaders,
  sanitizeRequest,
  detectAttackPatterns,
} = require('./middleware/security.middleware');
const { validateOrigin } = require('./middleware/csrf.middleware');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Connect to Redis
connectRedis();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Additional security headers
app.use(setSecurityHeaders);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
app.use(sanitizeData());

// Data sanitization against XSS
app.use(preventXSS());

// Prevent parameter pollution
app.use(preventHPP());

// Custom request sanitization
app.use(sanitizeRequest);

// Detect attack patterns
app.use(detectAttackPatterns);

// Validate origin for state-changing requests
app.use(validateOrigin);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per minute
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API đang chạy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API v1',
    version: '1.0.0',
    documentation: `/api/${API_VERSION}/docs`,
  });
});

setupSwagger(app, API_VERSION);

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/operators`, operatorRoutes);
app.use(`/api/${API_VERSION}/employees`, employeeRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/routes`, routeRoutes);
app.use(`/api/${API_VERSION}/buses`, busRoutes);
app.use(`/api/${API_VERSION}/trips`, tripRoutes);
app.use(`/api/${API_VERSION}/bookings`, bookingRoutes);
app.use(`/api/${API_VERSION}/vouchers`, voucherRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/tickets`, ticketRoutes);
app.use(`/api/${API_VERSION}/trip-manager`, tripManagerRoutes);
app.use(`/api/${API_VERSION}/complaints`, complaintRoutes);
app.use(`/api/${API_VERSION}/content`, contentRoutes);
app.use(`/api/${API_VERSION}/reviews`, reviewRoutes);
app.use(`/api/${API_VERSION}/guest`, guestRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Không tìm thấy route',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Create HTTP server for Socket.IO
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize WebSocket
websocketService.initialize(server);

// Initialize Scheduler (cron jobs)
schedulerService.initialize();

// Start server
server.listen(PORT, () => {
  logger.start(`=====================================================================`);
  logger.success(`Máy chủ đang chạy ở chế độ ${process.env.NODE_ENV} trên port ${PORT}`);
  logger.success(`Health check: http://localhost:${PORT}/health`);
  logger.success(`API endpoint: http://localhost:${PORT}/api/${API_VERSION}`);
  logger.success(`Swagger docs: http://localhost:${PORT}/api/${API_VERSION}/docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('LỖI KHÔNG ĐƯỢC XỬ LÝ (unhandledRejection)! Đang tắt...');
  if (err instanceof Error) {
    logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  } else {
    logger.error(JSON.stringify(err));
  }
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('LỖI KHÔNG ĐƯỢC XỬ LÝ (uncaughtException)! Đang tắt...');
  if (err instanceof Error) {
    logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  } else {
    logger.error(JSON.stringify(err));
  }
  process.exit(1); // Nếu server chưa khởi tạo xong
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Đang tắt server một cách nhẹ nhàng...');
  server.close(() => {
    logger.info('Server đã tắt. Tiến trình kết thúc!');
  });
});

module.exports = app;
