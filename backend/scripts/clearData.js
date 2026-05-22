const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('../src/utils/logger');
const connectDB = require('../src/config/database');

// Load env vars
dotenv.config();

// Import models
const User = require('../src/models/User');
const BusOperator = require('../src/models/BusOperator');
const Employee = require('../src/models/Employee');
const Bus = require('../src/models/Bus');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const Voucher = require('../src/models/Voucher');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const Ticket = require('../src/models/Ticket');
const Review = require('../src/models/Review');
const Complaint = require('../src/models/Complaint');
const Banner = require('../src/models/Banner');
const Blog = require('../src/models/Blog');
const FAQ = require('../src/models/FAQ');

/**
 * Xóa toàn bộ dữ liệu trong database theo thứ tự ngược lại của các ràng buộc (dependencies)
 */
const clearData = async () => {
  try {
    // Kết nối database
    await connectDB();

    logger.start('BẮT ĐẦU XÓA DỮ LIỆU...');

    // Thứ tự xóa: Các model có nhiều "ref" đến model khác nên được xóa trước
    const models = [
      { name: 'Complaint', model: Complaint },
      { name: 'Review', model: Review },
      { name: 'Ticket', model: Ticket },
      { name: 'Payment', model: Payment },
      { name: 'Booking', model: Booking },
      { name: 'Voucher', model: Voucher },
      { name: 'Trip', model: Trip },
      { name: 'Route', model: Route },
      { name: 'Bus', model: Bus },
      { name: 'Employee', model: Employee },
      { name: 'BusOperator', model: BusOperator },
      { name: 'Blog', model: Blog },
      { name: 'Banner', model: Banner },
      { name: 'FAQ', model: FAQ },
      { name: 'User', model: User }
    ];

    for (const item of models) {
      const count = await item.model.countDocuments();
      if (count > 0) {
        await item.model.deleteMany();
        logger.success(`Đã xóa ${count} documents từ bộ sưu tập ${item.name}`);
      } else {
        logger.info(`Bộ sưu tập ${item.name} đã trống`);
      }
    }

    logger.success('HÒAN TẤT XÓA TOÀN BỘ DỮ LIỆU!');
    process.exit(0);
  } catch (error) {
    logger.error('LỖI KHI XÓA DỮ LIỆU:');
    logger.error(error);
    process.exit(1);
  }
};

// Chạy script
clearData();
