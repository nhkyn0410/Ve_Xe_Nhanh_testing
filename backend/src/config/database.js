const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const MONGODB_URI =
      process.env.NODE_ENV === 'test' ? process.env.MONGODB_TEST_URI : process.env.MONGODB_URI;

    const conn = await mongoose.connect(MONGODB_URI);

    logger.success(`MongoDB Đã kết nối: ${conn.connection.port}/${conn.connection.name}`);

    // Connection events
    mongoose.connection.on('error', (err) => {
      logger.error('Lỗi khi kết nối MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.info('MongoDB Đã ngắt kết nối');
    });
  } catch (error) {
    logger.error('Lỗi kết nối với MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
