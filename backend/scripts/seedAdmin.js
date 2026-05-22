/**
 * SEED ADMIN SCRIPT
 * 
 * Mục tiêu: Chỉ tạo một tài khoản Admin duy nhất cho hệ thống.
 * Hữu ích cho môi trường production hoặc khi chỉ cần khởi tạo quyền quản trị cao nhất.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');
const User = require('../src/models/User');

async function seedAdmin() {
  try {
    await connectDB();
    
    // Tìm xem đã có admin nào chưa
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      logger.info(`Đã tồn tại tài khoản Admin: ${existingAdmin.email}`);
      process.exit(0);
    }

    logger.info('Đang khởi tạo tài khoản Admin...');
    
    // Sử dụng Document.save() để trigger pre-save hook (hashing mật khẩu)
    const adminDoc = new User({
      fullName: 'Hệ thống Admin',
      email: 'admin@vexenhanh.vn',
      phone: '0987654321',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    
    await adminDoc.save();

    logger.success('\n========================================');
    logger.success('   TẠO ADMIN THÀNH CÔNG!   ');
    logger.success('========================================\n');

    logger.info('--- THÔNG TIN ĐĂNG NHẬP ---');
    logger.info('Email: admin@vexenhanh.vn');
    logger.info('Mật khẩu: admin123');
    logger.info('Role: admin');
    logger.info('---------------------------\n');

    process.exit(0);
  } catch (error) {
    logger.error('LỖI KHI TẠO ADMIN:');
    logger.error(error);
    process.exit(1);
  }
}

seedAdmin();