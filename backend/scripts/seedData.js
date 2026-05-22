/**
 * Enhanced Seed Script for QuikRide Database
 * Creates comprehensive sample data with journey tracking and stops
 *
 * FIXES:
 * - Removed bcrypt.hash() in seed → models have pre-save hooks that auto-hash
 * - Added future trips (+3, +7, +14, +30 days) so trips are always available
 * - Added Vouchers for testing
 * - Added sample Bookings + Tickets for guest lookup & cancel testing
 * - Added sample Complaints for admin testing
 *
 * Usage: node scripts/seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const logger = require('../src/utils/logger');

// Import models
const User = require('../src/models/User');
const BusOperator = require('../src/models/BusOperator');
const Employee = require('../src/models/Employee');
const Route = require('../src/models/Route');
const Bus = require('../src/models/Bus');
const Trip = require('../src/models/Trip');
const Booking = require('../src/models/Booking');
const Ticket = require('../src/models/Ticket');
const Voucher = require('../src/models/Voucher');
const Complaint = require('../src/models/Complaint');

// Import seat layout utilities
const {
  generateLimousineLayout,
  generateAisleLayout,
  generateDoubleDecker,
} = require('../src/utils/seatLayout');

// Helper: date offset from today
const daysFromNow = (days, hours = 0) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000);
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quikride', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB Connected');
  } catch (error) {
    logger.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Save documents one by one so password hooks are applied reliably.
const createWithHooks = async (Model, docs) => {
  const createdDocs = [];

  for (let i = 0; i < docs.length; i += 1) {
    const record = new Model(docs[i]);
    // Saving inside a loop is intentional so model pre-save hooks run reliably
    // eslint-disable-next-line no-await-in-loop
    await record.save();
    createdDocs.push(record);
  }

  return createdDocs;
};



// Enhanced seed data with full journey tracking
const seedData = async () => {
  try {
    logger.info('\nStarting to seed database with enhanced data...\n');

    // ==================== CLEAR ALL EXISTING DATA ====================
    logger.info('Clearing ALL existing data...');
    const collections = [User, BusOperator, Employee, Route, Bus, Trip, Booking, Ticket];
    // Conditionally clear Voucher and Complaint if models loaded
    if (Voucher) collections.push(Voucher);
    if (Complaint) collections.push(Complaint);
    await Promise.all(collections.map((Model) => Model.deleteMany({})));
    logger.info('Cleared all existing data\n');

    // ==================== USERS ====================
    logger.info('Creating Users...');

    // NOTE: DO NOT use bcrypt.hash() here. All models have pre-save hooks
    // that auto-hash passwords. Passing hashed passwords causes DOUBLE-HASHING
    // and users cannot log in.

    const users = await createWithHooks(User, [
      // Admin
      {
        email: 'admin@quikride.com',
        phone: '0900000000',
        password: 'admin123',
        fullName: 'Quản Trị Viên Hệ Thống',
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
      // Customers
      {
        email: 'customer1@gmail.com',
        phone: '0912345678',
        password: '123456',
        fullName: 'Nguyễn Văn An',
        role: 'customer',
        isEmailVerified: true,
        isPhoneVerified: true,
        loyaltyTier: 'gold',
        totalPoints: 5500,
      },
      {
        email: 'customer2@gmail.com',
        phone: '0923456789',
        password: '123456',
        fullName: 'Trần Thị Bình',
        role: 'customer',
        isEmailVerified: true,
        isPhoneVerified: true,
        loyaltyTier: 'silver',
        totalPoints: 3200,
      },
      {
        email: 'customer3@gmail.com',
        phone: '0934567890',
        password: '123456',
        fullName: 'Lê Hoàng Cường',
        role: 'customer',
        isEmailVerified: true,
        isPhoneVerified: true,
        loyaltyTier: 'bronze',
        totalPoints: 1200,
      },
      {
        email: 'customer4@gmail.com',
        phone: '0945678901',
        password: '123456',
        fullName: 'Phạm Thị Dung',
        role: 'customer',
        isEmailVerified: true,
        isPhoneVerified: true,
        loyaltyTier: 'bronze',
        totalPoints: 500,
      },
    ]);

    console.log(`Created ${users.length} users\n`);

    // ==================== BUS OPERATORS ====================
    console.log('Creating Bus Operators...');

    const operators = await createWithHooks(BusOperator, [
      {
        email: 'operator1@quikride.com',
        phone: '0281234567',
        password: 'operator123',
        companyName: 'Phương Trang Express',
        companyAddress: '272 Đường Đệ Tam, Phường 12, Quận 11, TP.HCM',
        businessLicense: 'BL-PT-2020-001',
        taxCode: 'TAX-PT-001',
        representativeName: 'Nguyễn Văn Trang',
        representativePhone: '0281234567',
        representativeEmail: 'trang@phuongtrang.com',
        status: 'active',
        isVerified: true,
        averageRating: 4.7,
        totalTrips: 2450,
      },
      {
        email: 'operator2@quikride.com',
        phone: '0282345678',
        password: 'operator123',
        companyName: 'Thành Bưởi Limousine',
        companyAddress: '199 Nguyễn Văn Linh, Quận 7, TP.HCM',
        businessLicense: 'BL-TB-2019-002',
        taxCode: 'TAX-TB-002',
        representativeName: 'Trần Thành Bưởi',
        representativePhone: '0282345678',
        representativeEmail: 'buoi@thanhbuoi.com',
        status: 'active',
        isVerified: true,
        averageRating: 4.8,
        totalTrips: 1890,
      },
      {
        email: 'operator3@quikride.com',
        phone: '0283456789',
        password: 'operator123',
        companyName: 'Hải Âu Express',
        companyAddress: '45 Lê Duẩn, Quận 1, TP.HCM',
        businessLicense: 'BL-HA-2021-003',
        taxCode: 'TAX-HA-003',
        representativeName: 'Lê Văn Hải',
        representativePhone: '0283456789',
        representativeEmail: 'hai@haiau.com',
        status: 'active',
        isVerified: true,
        averageRating: 4.5,
        totalTrips: 1250,
      },
    ]);

    logger.info(`Created ${operators.length} bus operators\n`);

    // ==================== EMPLOYEES ====================
    // IMPORTANT: Pass plain-text passwords! Employee model has pre-save hook that auto-hashes.
    console.log('Creating Employees (Drivers & Trip Managers)...');

    const employees = await createWithHooks(Employee, [
      // Phương Trang - Drivers
      {
        operatorId: operators[0]._id,
        employeeCode: 'DRV-PT-001',
        fullName: 'Nguyễn Văn Long',
        phone: '0901234567',
        email: 'long.driver@phuongtrang.com',
        password: 'driver123',
        role: 'driver',
        status: 'active',
        licenseNumber: 'B2-123456',
        licenseExpiry: new Date('2026-12-31'),
      },
      {
        operatorId: operators[0]._id,
        employeeCode: 'DRV-PT-002',
        fullName: 'Trần Minh Tâm',
        phone: '0902345678',
        email: 'tam.driver@phuongtrang.com',
        password: 'driver123',
        role: 'driver',
        status: 'active',
        licenseNumber: 'B2-234567',
        licenseExpiry: new Date('2027-06-30'),
      },
      // Phương Trang - Trip Managers
      {
        operatorId: operators[0]._id,
        employeeCode: 'TM-PT-001',
        fullName: 'Lê Thị Hoa',
        phone: '0903456789',
        email: 'hoa.manager@phuongtrang.com',
        password: 'manager123',
        role: 'trip_manager',
        status: 'active',
      },
      {
        operatorId: operators[0]._id,
        employeeCode: 'TM-PT-002',
        fullName: 'Phạm Văn Nam',
        phone: '0904567890',
        email: 'nam.manager@phuongtrang.com',
        password: 'manager123',
        role: 'trip_manager',
        status: 'active',
      },
      // Thành Bưởi - Drivers
      {
        operatorId: operators[1]._id,
        employeeCode: 'DRV-TB-001',
        fullName: 'Võ Văn Thắng',
        phone: '0905678901',
        email: 'thang.driver@thanhbuoi.com',
        password: 'driver123',
        role: 'driver',
        status: 'active',
        licenseNumber: 'B2-345678',
        licenseExpiry: new Date('2026-09-30'),
      },
      {
        operatorId: operators[1]._id,
        employeeCode: 'DRV-TB-002',
        fullName: 'Đặng Văn Tuấn',
        phone: '0906789012',
        email: 'tuan.driver@thanhbuoi.com',
        password: 'driver123',
        role: 'driver',
        status: 'active',
        licenseNumber: 'B2-456789',
        licenseExpiry: new Date('2027-03-31'),
      },
      // Thành Bưởi - Trip Managers
      {
        operatorId: operators[1]._id,
        employeeCode: 'TM-TB-001',
        fullName: 'Nguyễn Thị Lan',
        phone: '0907890123',
        email: 'lan.manager@thanhbuoi.com',
        password: 'manager123',
        role: 'trip_manager',
        status: 'active',
      },
      // Hải Âu - Drivers
      {
        operatorId: operators[2]._id,
        employeeCode: 'DRV-HA-001',
        fullName: 'Huỳnh Văn Hùng',
        phone: '0908901234',
        email: 'hung.driver@haiau.com',
        password: 'driver123',
        role: 'driver',
        status: 'active',
        licenseNumber: 'B2-567890',
        licenseExpiry: new Date('2026-11-30'),
      },
      // Hải Âu - Trip Managers
      {
        operatorId: operators[2]._id,
        employeeCode: 'TM-HA-001',
        fullName: 'Trương Thị Mai',
        phone: '0909012345',
        email: 'mai.manager@haiau.com',
        password: 'manager123',
        role: 'trip_manager',
        status: 'active',
      },
    ]);

    logger.info(`Created ${employees.length} employees\n`);

    // ==================== BUSES ====================
    console.log('Creating Buses with Seat Layouts...');

    const buses = await Bus.create([
      // Phương Trang - Limousine
      {
        operatorId: operators[0]._id,
        busNumber: 'PT-001',
        plateNumber: '51B-12345',
        busType: 'limousine',
        manufacturer: 'Hyundai Universe',
        model: 'Limousine VIP',
        year: 2022,
        seatLayout: generateLimousineLayout(),
        status: 'active',
      },
      {
        operatorId: operators[0]._id,
        busNumber: 'PT-002',
        plateNumber: '51B-23456',
        busType: 'limousine',
        manufacturer: 'Hyundai Universe',
        model: 'Limousine VIP',
        year: 2023,
        seatLayout: generateLimousineLayout(),
        status: 'active',
      },
      // Phương Trang - Giường nằm
      {
        operatorId: operators[0]._id,
        busNumber: 'PT-003',
        plateNumber: '51B-34567',
        busType: 'sleeper',
        manufacturer: 'Thaco',
        model: 'TB120SL',
        year: 2021,
        seatLayout: generateAisleLayout(40),
        status: 'active',
      },
      // Thành Bưởi - Limousine
      {
        operatorId: operators[1]._id,
        busNumber: 'TB-001',
        plateNumber: '50B-11111',
        busType: 'limousine',
        manufacturer: 'Mercedes-Benz',
        model: 'Sprinter Limousine',
        year: 2023,
        seatLayout: generateLimousineLayout(),
        status: 'active',
      },
      {
        operatorId: operators[1]._id,
        busNumber: 'TB-002',
        plateNumber: '50B-22222',
        busType: 'limousine',
        manufacturer: 'Mercedes-Benz',
        model: 'Sprinter Limousine',
        year: 2023,
        seatLayout: generateLimousineLayout(),
        status: 'active',
      },
      // Hải Âu - Xe 2 tầng
      {
        operatorId: operators[2]._id,
        busNumber: 'HA-001',
        plateNumber: '51C-99999',
        busType: 'double_decker',
        manufacturer: 'Hyundai',
        model: 'Universe Noble',
        year: 2022,
        seatLayout: generateDoubleDecker(),
        status: 'active',
      },
    ]);

    console.log(`Created ${buses.length} buses with seat layouts\n`);

    // ==================== ROUTES WITH STOPS ====================
    console.log('Creating Routes with Stops...');

    const routes = await Route.create([
      // Route 1: TP.HCM → Đà Lạt
      {
        operatorId: operators[0]._id,
        routeCode: 'HCM-DL-001',
        routeName: 'TP. Hồ Chí Minh - Đà Lạt',
        origin: {
          city: 'TP. Hồ Chí Minh',
          province: 'TP. Hồ Chí Minh',
          station: 'Bến xe Miền Đông',
          address: '292 Đinh Bộ Lĩnh, P.26, Q. Bình Thạnh',
          coordinates: { lat: 10.8142, lng: 106.7053 },
        },
        destination: {
          city: 'Đà Lạt',
          province: 'Lâm Đồng',
          station: 'Bến xe Đà Lạt',
          address: '1 Tô Hiến Thành, P.3, TP. Đà Lạt',
          coordinates: { lat: 11.9344, lng: 108.4419 },
        },
        stops: [
          {
            name: 'Trạm dừng chân Dầu Giây',
            address: 'KM 50 QL1A, Dầu Giây, Đồng Nai',
            coordinates: { lat: 10.9876, lng: 107.1234 },
            order: 1,
            estimatedArrivalMinutes: 90,
            stopDuration: 15,
          },
          {
            name: 'Trạm Bảo Lộc',
            address: 'QL20, TP. Bảo Lộc, Lâm Đồng',
            coordinates: { lat: 11.5480, lng: 107.8065 },
            order: 2,
            estimatedArrivalMinutes: 240,
            stopDuration: 20,
          },
          {
            name: 'Ngã ba Liên Khương',
            address: 'Ngã ba Liên Khương, Đức Trọng, Lâm Đồng',
            coordinates: { lat: 11.7500, lng: 108.3670 },
            order: 3,
            estimatedArrivalMinutes: 330,
            stopDuration: 10,
          },
        ],
        distance: 308,
        estimatedDuration: 420,
        isActive: true,
      },
      // Route 2: TP.HCM → Vũng Tàu
      {
        operatorId: operators[0]._id,
        routeCode: 'HCM-VT-001',
        routeName: 'TP. Hồ Chí Minh - Vũng Tàu',
        origin: {
          city: 'TP. Hồ Chí Minh',
          province: 'TP. Hồ Chí Minh',
          station: 'Bến xe Miền Đông',
          address: '292 Đinh Bộ Lĩnh, P.26, Q. Bình Thạnh',
          coordinates: { lat: 10.8142, lng: 106.7053 },
        },
        destination: {
          city: 'Vũng Tàu',
          province: 'Bà Rịa - Vũng Tàu',
          station: 'Bến xe Vũng Tàu',
          address: '192 Nam Kỳ Khởi Nghĩa, P.9, TP. Vũng Tàu',
          coordinates: { lat: 10.3460, lng: 107.0844 },
        },
        stops: [
          {
            name: 'Trạm dừng Long Thành',
            address: 'QL51, Long Thành, Đồng Nai',
            coordinates: { lat: 10.7300, lng: 106.9500 },
            order: 1,
            estimatedArrivalMinutes: 45,
            stopDuration: 10,
          },
          {
            name: 'Ngã tư Bà Rịa',
            address: 'Ngã tư Bà Rịa, TP. Bà Rịa',
            coordinates: { lat: 10.5050, lng: 107.1700 },
            order: 2,
            estimatedArrivalMinutes: 90,
            stopDuration: 10,
          },
        ],
        distance: 125,
        estimatedDuration: 150,
        isActive: true,
      },
      // Route 3: TP.HCM → Nha Trang
      {
        operatorId: operators[1]._id,
        routeCode: 'HCM-NT-001',
        routeName: 'TP. Hồ Chí Minh - Nha Trang',
        origin: {
          city: 'TP. Hồ Chí Minh',
          province: 'TP. Hồ Chí Minh',
          station: 'Bến xe Miền Đông',
          address: '292 Đinh Bộ Lĩnh, P.26, Q. Bình Thạnh',
          coordinates: { lat: 10.8142, lng: 106.7053 },
        },
        destination: {
          city: 'Nha Trang',
          province: 'Khánh Hòa',
          station: 'Bến xe Phía Nam',
          address: '23 Tháng 10, P. Phước Hải, TP. Nha Trang',
          coordinates: { lat: 12.2388, lng: 109.1967 },
        },
        stops: [
          {
            name: 'Trạm Dầu Giây',
            address: 'KM 50 QL1A, Dầu Giây',
            coordinates: { lat: 10.9876, lng: 107.1234 },
            order: 1,
            estimatedArrivalMinutes: 90,
            stopDuration: 15,
          },
          {
            name: 'Phan Rang',
            address: 'QL1A, TP. Phan Rang, Ninh Thuận',
            coordinates: { lat: 11.5657, lng: 108.9890 },
            order: 2,
            estimatedArrivalMinutes: 300,
            stopDuration: 20,
          },
          {
            name: 'Cam Ranh',
            address: 'QL1A, TP. Cam Ranh, Khánh Hòa',
            coordinates: { lat: 11.9214, lng: 109.1593 },
            order: 3,
            estimatedArrivalMinutes: 390,
            stopDuration: 15,
          },
          {
            name: 'Ngã ba Đại Lãnh',
            address: 'Đại Lãnh, Cam Lâm, Khánh Hòa',
            coordinates: { lat: 12.0500, lng: 109.1800 },
            order: 4,
            estimatedArrivalMinutes: 420,
            stopDuration: 10,
          },
        ],
        distance: 448,
        estimatedDuration: 480,
        isActive: true,
      },
      // Route 4: TP.HCM → Đà Nẵng
      {
        operatorId: operators[1]._id,
        routeCode: 'HCM-DN-001',
        routeName: 'TP. Hồ Chí Minh - Đà Nẵng',
        origin: {
          city: 'TP. Hồ Chí Minh',
          province: 'TP. Hồ Chí Minh',
          station: 'Bến xe Miền Đông',
          address: '292 Đinh Bộ Lĩnh, P.26, Q. Bình Thạnh',
          coordinates: { lat: 10.8142, lng: 106.7053 },
        },
        destination: {
          city: 'Đà Nẵng',
          province: 'Đà Nẵng',
          station: 'Bến xe Trung tâm Đà Nẵng',
          address: 'Đường Điện Biên Phủ, Q. Thanh Khê',
          coordinates: { lat: 16.0544, lng: 108.2022 },
        },
        stops: [
          {
            name: 'Dầu Giây',
            address: 'KM 50 QL1A, Dầu Giây',
            coordinates: { lat: 10.9876, lng: 107.1234 },
            order: 1,
            estimatedArrivalMinutes: 90,
            stopDuration: 15,
          },
          {
            name: 'Nha Trang',
            address: 'QL1A, TP. Nha Trang',
            coordinates: { lat: 12.2388, lng: 109.1967 },
            order: 2,
            estimatedArrivalMinutes: 480,
            stopDuration: 30,
          },
          {
            name: 'Tuy Hòa',
            address: 'QL1A, TP. Tuy Hòa, Phú Yên',
            coordinates: { lat: 13.0882, lng: 109.2977 },
            order: 3,
            estimatedArrivalMinutes: 600,
            stopDuration: 20,
          },
          {
            name: 'Quy Nhơn',
            address: 'QL1A, TP. Quy Nhơn, Bình Định',
            coordinates: { lat: 13.7563, lng: 109.2235 },
            order: 4,
            estimatedArrivalMinutes: 720,
            stopDuration: 25,
          },
          {
            name: 'Quảng Ngãi',
            address: 'QL1A, TP. Quảng Ngãi',
            coordinates: { lat: 15.1208, lng: 108.8044 },
            order: 5,
            estimatedArrivalMinutes: 840,
            stopDuration: 20,
          },
        ],
        distance: 964,
        estimatedDuration: 960,
        isActive: true,
      },
      // Route 5: TP.HCM → Phan Thiết
      {
        operatorId: operators[2]._id,
        routeCode: 'HCM-PT-001',
        routeName: 'TP. Hồ Chí Minh - Phan Thiết',
        origin: {
          city: 'TP. Hồ Chí Minh',
          province: 'TP. Hồ Chí Minh',
          station: 'Bến xe Miền Đông',
          address: '292 Đinh Bộ Lĩnh, P.26, Q. Bình Thạnh',
          coordinates: { lat: 10.8142, lng: 106.7053 },
        },
        destination: {
          city: 'Phan Thiết',
          province: 'Bình Thuận',
          station: 'Bến xe Phan Thiết',
          address: 'Đường Tô Hiến Thành, P. Phú Thủy',
          coordinates: { lat: 10.9281, lng: 108.1014 },
        },
        stops: [
          {
            name: 'Trạm nghỉ Hàm Thuận Nam',
            address: 'QL1A, Hàm Thuận Nam, Bình Thuận',
            coordinates: { lat: 10.8000, lng: 107.7000 },
            order: 1,
            estimatedArrivalMinutes: 120,
            stopDuration: 15,
          },
        ],
        distance: 200,
        estimatedDuration: 180,
        isActive: true,
      },
    ]);

    console.log(`Created ${routes.length} routes with stops\n`);

    // ==================== TRIPS WITH JOURNEY TRACKING ====================
    console.log('Creating Trips with Journey Tracking...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Helper for trip dates
    const tripTime = (dayOffset, hour) => new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000);

    const trips = await Trip.create([
      // ===== TODAY =====
      // Trip 1: HCM → Đà Lạt - Hôm nay 6:00 (ongoing)
      {
        routeId: routes[0]._id,
        busId: buses[0]._id,
        operatorId: operators[0]._id,
        driverId: employees[0]._id,
        tripManagerId: employees[2]._id,
        departureTime: tripTime(0, 6),
        arrivalTime: tripTime(0, 13),
        basePrice: 250000,
        finalPrice: 250000,
        totalSeats: buses[0].seatLayout.totalSeats,
        availableSeats: buses[0].seatLayout.totalSeats - 18,
        status: 'ongoing',
        journey: {
          currentStopIndex: 1,
          currentStatus: 'at_stop',
          actualDepartureTime: tripTime(0, 6),
          statusHistory: [
            {
              status: 'preparing',
              stopIndex: -1,
              timestamp: tripTime(0, 5.5),
              notes: 'Chuẩn bị xe và kiểm tra hành khách',
              updatedBy: employees[2]._id,
            },
            {
              status: 'in_transit',
              stopIndex: 0,
              timestamp: tripTime(0, 6),
              notes: 'Khởi hành đúng giờ',
              updatedBy: employees[2]._id,
            },
          ],
        },
      },
      // Trip 2: HCM → Vũng Tàu - Hôm nay 8:00 (ongoing)
      {
        routeId: routes[1]._id,
        busId: buses[2]._id,
        operatorId: operators[0]._id,
        driverId: employees[0]._id,
        tripManagerId: employees[2]._id,
        departureTime: tripTime(0, 8),
        arrivalTime: tripTime(0, 10.5),
        basePrice: 120000,
        finalPrice: 120000,
        totalSeats: buses[2].seatLayout.totalSeats,
        availableSeats: buses[2].seatLayout.totalSeats - 28,
        status: 'ongoing',
        journey: {
          currentStopIndex: 0,
          currentStatus: 'in_transit',
          actualDepartureTime: tripTime(0, 8),
          statusHistory: [
            {
              status: 'in_transit',
              stopIndex: 0,
              timestamp: tripTime(0, 8),
              notes: 'Đã khởi hành',
              updatedBy: employees[2]._id,
            },
          ],
        },
      },
      // Trip 3: HCM → Đà Lạt - Hôm nay 14:00 (scheduled)
      {
        routeId: routes[0]._id,
        busId: buses[1]._id,
        operatorId: operators[0]._id,
        driverId: employees[1]._id,
        tripManagerId: employees[3]._id,
        departureTime: tripTime(0, 14),
        arrivalTime: tripTime(0, 21),
        basePrice: 250000,
        finalPrice: 250000,
        totalSeats: buses[1].seatLayout.totalSeats,
        availableSeats: buses[1].seatLayout.totalSeats - 12,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      // Trip 4: HCM → Phan Thiết - Hôm nay 16:00 (scheduled)
      {
        routeId: routes[4]._id,
        busId: buses[5]._id,
        operatorId: operators[2]._id,
        driverId: employees[7]._id,
        tripManagerId: employees[8]._id,
        departureTime: tripTime(0, 16),
        arrivalTime: tripTime(0, 19),
        basePrice: 150000,
        finalPrice: 150000,
        totalSeats: buses[5].seatLayout.totalSeats,
        availableSeats: buses[5].seatLayout.totalSeats - 20,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },

      // ===== TOMORROW (+1 day) =====
      // Trip 5: HCM → Nha Trang
      {
        routeId: routes[2]._id,
        busId: buses[3]._id,
        operatorId: operators[1]._id,
        driverId: employees[4]._id,
        tripManagerId: employees[6]._id,
        departureTime: tripTime(1, 6),
        arrivalTime: tripTime(1, 14),
        basePrice: 350000,
        finalPrice: 350000,
        totalSeats: buses[3].seatLayout.totalSeats,
        availableSeats: buses[3].seatLayout.totalSeats - 5,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      // Trip 6: HCM → Đà Nẵng
      {
        routeId: routes[3]._id,
        busId: buses[4]._id,
        operatorId: operators[1]._id,
        driverId: employees[5]._id,
        tripManagerId: employees[6]._id,
        departureTime: tripTime(1, 18),
        arrivalTime: tripTime(2, 10),
        basePrice: 450000,
        finalPrice: 450000,
        totalSeats: buses[4].seatLayout.totalSeats,
        availableSeats: buses[4].seatLayout.totalSeats - 3,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      // Trip 7: HCM → Vũng Tàu - Ngày mai 7:00
      {
        routeId: routes[1]._id,
        busId: buses[2]._id,
        operatorId: operators[0]._id,
        driverId: employees[1]._id,
        tripManagerId: employees[3]._id,
        departureTime: tripTime(1, 7),
        arrivalTime: tripTime(1, 9.5),
        basePrice: 120000,
        finalPrice: 120000,
        totalSeats: buses[2].seatLayout.totalSeats,
        availableSeats: buses[2].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },

      // ===== +3 DAYS =====
      {
        routeId: routes[0]._id,
        busId: buses[0]._id,
        operatorId: operators[0]._id,
        driverId: employees[0]._id,
        tripManagerId: employees[2]._id,
        departureTime: tripTime(3, 6),
        arrivalTime: tripTime(3, 13),
        basePrice: 250000,
        finalPrice: 250000,
        totalSeats: buses[0].seatLayout.totalSeats,
        availableSeats: buses[0].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      {
        routeId: routes[1]._id,
        busId: buses[2]._id,
        operatorId: operators[0]._id,
        driverId: employees[1]._id,
        tripManagerId: employees[3]._id,
        departureTime: tripTime(3, 8),
        arrivalTime: tripTime(3, 10.5),
        basePrice: 120000,
        finalPrice: 120000,
        totalSeats: buses[2].seatLayout.totalSeats,
        availableSeats: buses[2].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },

      // ===== +7 DAYS =====
      {
        routeId: routes[0]._id,
        busId: buses[0]._id,
        operatorId: operators[0]._id,
        driverId: employees[0]._id,
        tripManagerId: employees[2]._id,
        departureTime: tripTime(7, 6),
        arrivalTime: tripTime(7, 13),
        basePrice: 250000,
        finalPrice: 250000,
        totalSeats: buses[0].seatLayout.totalSeats,
        availableSeats: buses[0].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      {
        routeId: routes[1]._id,
        busId: buses[2]._id,
        operatorId: operators[0]._id,
        driverId: employees[1]._id,
        tripManagerId: employees[3]._id,
        departureTime: tripTime(7, 7),
        arrivalTime: tripTime(7, 9.5),
        basePrice: 120000,
        finalPrice: 120000,
        totalSeats: buses[2].seatLayout.totalSeats,
        availableSeats: buses[2].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      {
        routeId: routes[2]._id,
        busId: buses[3]._id,
        operatorId: operators[1]._id,
        driverId: employees[4]._id,
        tripManagerId: employees[6]._id,
        departureTime: tripTime(7, 18),
        arrivalTime: tripTime(8, 2),
        basePrice: 350000,
        finalPrice: 350000,
        totalSeats: buses[3].seatLayout.totalSeats,
        availableSeats: buses[3].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },

      // ===== +14 DAYS =====
      {
        routeId: routes[0]._id,
        busId: buses[1]._id,
        operatorId: operators[0]._id,
        driverId: employees[1]._id,
        tripManagerId: employees[3]._id,
        departureTime: tripTime(14, 6),
        arrivalTime: tripTime(14, 13),
        basePrice: 250000,
        finalPrice: 250000,
        totalSeats: buses[1].seatLayout.totalSeats,
        availableSeats: buses[1].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      {
        routeId: routes[1]._id,
        busId: buses[2]._id,
        operatorId: operators[0]._id,
        driverId: employees[0]._id,
        tripManagerId: employees[2]._id,
        departureTime: tripTime(14, 8),
        arrivalTime: tripTime(14, 10.5),
        basePrice: 120000,
        finalPrice: 120000,
        totalSeats: buses[2].seatLayout.totalSeats,
        availableSeats: buses[2].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      {
        routeId: routes[4]._id,
        busId: buses[5]._id,
        operatorId: operators[2]._id,
        driverId: employees[7]._id,
        tripManagerId: employees[8]._id,
        departureTime: tripTime(14, 15),
        arrivalTime: tripTime(14, 18),
        basePrice: 150000,
        finalPrice: 150000,
        totalSeats: buses[5].seatLayout.totalSeats,
        availableSeats: buses[5].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },

      // ===== +30 DAYS =====
      {
        routeId: routes[0]._id,
        busId: buses[0]._id,
        operatorId: operators[0]._id,
        driverId: employees[0]._id,
        tripManagerId: employees[2]._id,
        departureTime: tripTime(30, 6),
        arrivalTime: tripTime(30, 13),
        basePrice: 260000,
        finalPrice: 260000,
        totalSeats: buses[0].seatLayout.totalSeats,
        availableSeats: buses[0].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      {
        routeId: routes[1]._id,
        busId: buses[2]._id,
        operatorId: operators[0]._id,
        driverId: employees[1]._id,
        tripManagerId: employees[3]._id,
        departureTime: tripTime(30, 7),
        arrivalTime: tripTime(30, 9.5),
        basePrice: 130000,
        finalPrice: 130000,
        totalSeats: buses[2].seatLayout.totalSeats,
        availableSeats: buses[2].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      {
        routeId: routes[2]._id,
        busId: buses[3]._id,
        operatorId: operators[1]._id,
        driverId: employees[4]._id,
        tripManagerId: employees[6]._id,
        departureTime: tripTime(30, 6),
        arrivalTime: tripTime(30, 14),
        basePrice: 360000,
        finalPrice: 360000,
        totalSeats: buses[3].seatLayout.totalSeats,
        availableSeats: buses[3].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
      {
        routeId: routes[3]._id,
        busId: buses[4]._id,
        operatorId: operators[1]._id,
        driverId: employees[5]._id,
        tripManagerId: employees[6]._id,
        departureTime: tripTime(30, 18),
        arrivalTime: tripTime(31, 10),
        basePrice: 460000,
        finalPrice: 460000,
        totalSeats: buses[4].seatLayout.totalSeats,
        availableSeats: buses[4].seatLayout.totalSeats,
        status: 'scheduled',
        journey: { currentStopIndex: -1, currentStatus: 'preparing', statusHistory: [] },
      },
    ]);

    logger.info(`Created ${trips.length} trips with journey tracking\n`);

    // ==================== VOUCHERS ====================
    console.log('Creating Vouchers...');

    const vouchers = await Voucher.create([
      {
        code: 'WELCOME50',
        name: 'Chào mừng khách hàng mới',
        description: 'Giảm 50.000đ cho khách hàng mới đăng ký',
        discountType: 'fixed',
        discountValue: 50000,
        minBookingAmount: 100000,
        maxUsageTotal: 1000,
        maxUsagePerCustomer: 1,
        currentUsageCount: 45,
        validFrom: daysFromNow(-30),
        validUntil: daysFromNow(90),
        isActive: true,
        operatorId: null,
      },
      {
        code: 'PHUONGTRANG10',
        name: 'Phương Trang giảm 10%',
        description: 'Giảm 10% tối đa 100.000đ cho Phương Trang',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountAmount: 100000,
        minBookingAmount: 150000,
        maxUsageTotal: 500,
        maxUsagePerCustomer: 3,
        currentUsageCount: 120,
        validFrom: daysFromNow(-15),
        validUntil: daysFromNow(60),
        isActive: true,
        operatorId: operators[0]._id,
        createdBy: operators[0]._id,
        createdByModel: 'BusOperator',
      },
      {
        code: 'GOLD20',
        name: 'Ưu đãi Gold Member',
        description: 'Giảm 20% cho khách hàng Gold',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 200000,
        minBookingAmount: 200000,
        maxUsageTotal: 200,
        maxUsagePerCustomer: 5,
        currentUsageCount: 30,
        validFrom: daysFromNow(-10),
        validUntil: daysFromNow(120),
        isActive: true,
        operatorId: null,
        applicableCustomerTiers: ['gold'],
      },
      {
        code: 'VUNGTAU30K',
        name: 'Giảm 30K tuyến Vũng Tàu',
        description: 'Giảm 30.000đ cho tuyến HCM - Vũng Tàu',
        discountType: 'fixed',
        discountValue: 30000,
        minBookingAmount: 80000,
        maxUsageTotal: 300,
        maxUsagePerCustomer: 2,
        currentUsageCount: 88,
        validFrom: daysFromNow(-5),
        validUntil: daysFromNow(45),
        isActive: true,
        operatorId: operators[0]._id,
        applicableRoutes: [routes[1]._id],
        createdBy: operators[0]._id,
        createdByModel: 'BusOperator',
      },
      {
        code: 'EXPIRED2025',
        name: 'Voucher hết hạn',
        description: 'Voucher đã hết hạn - dùng để test',
        discountType: 'fixed',
        discountValue: 100000,
        maxUsageTotal: 100,
        maxUsagePerCustomer: 1,
        currentUsageCount: 100,
        validFrom: daysFromNow(-90),
        validUntil: daysFromNow(-1),
        isActive: false,
        operatorId: null,
      },
    ]);

    console.log(`Created ${vouchers.length} vouchers\n`);

    // ==================== BOOKINGS & TICKETS ====================
    console.log('Creating sample Bookings & Tickets...');

    // Booking 1: Customer 1 booked trip HCM → Đà Lạt (confirmed, paid)
    const booking1 = await Booking.create({
      bookingCode: 'BK000001',
      customerId: users[1]._id,
      tripId: trips[0]._id,
      operatorId: operators[0]._id,
      seats: [
        { seatNumber: 'A1', price: 250000, passengerName: 'Nguyễn Văn An' },
      ],
      contactInfo: {
        name: 'Nguyễn Văn An',
        phone: '0912345678',
        email: 'customer1@gmail.com',
      },
      pickupPoint: {
        name: 'Bến xe Miền Đông',
        address: '292 Đinh Bộ Lĩnh, P.26, Q. Bình Thạnh',
        time: tripTime(0, 5.5),
      },
      dropoffPoint: {
        name: 'Bến xe Đà Lạt',
        address: '1 Tô Hiến Thành, P.3, TP. Đà Lạt',
        time: tripTime(0, 13),
      },
      totalPrice: 250000,
      discount: 0,
      finalPrice: 250000,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      paidAt: daysFromNow(-1),
      status: 'confirmed',
      isGuestBooking: false,
    });

    const qrData1 = JSON.stringify({ bookingCode: 'BK000001', tripId: trips[0]._id.toString() });
    await Ticket.create({
      ticketCode: 'TK000001',
      bookingId: booking1._id,
      tripId: trips[0]._id,
      operatorId: operators[0]._id,
      customerId: users[1]._id,
      qrCode: Buffer.from(qrData1).toString('base64'),
      qrCodeData: crypto.createHash('sha256').update(qrData1).digest('hex'),
      totalPrice: 250000,
      passengers: [
        { seatNumber: 'A1', fullName: 'Nguyễn Văn An' },
      ],
      tripInfo: {
        routeName: 'TP. Hồ Chí Minh - Đà Lạt',
        departureTime: tripTime(0, 6),
        arrivalTime: tripTime(0, 13),
        origin: 'Bến xe Miền Đông',
        destination: 'Bến xe Đà Lạt',
        busNumber: 'PT-001',
        busType: 'limousine',
      },
      status: 'valid',
    });

    // Booking 2: Customer 2 booked trip HCM → Vũng Tàu (confirmed)
    const booking2 = await Booking.create({
      bookingCode: 'BK000002',
      customerId: users[2]._id,
      tripId: trips[1]._id,
      operatorId: operators[0]._id,
      seats: [
        { seatNumber: 'B2', price: 120000, passengerName: 'Trần Thị Bình' },
        { seatNumber: 'B3', price: 120000, passengerName: 'Trần Văn Cúc' },
      ],
      contactInfo: {
        name: 'Trần Thị Bình',
        phone: '0923456789',
        email: 'customer2@gmail.com',
      },
      pickupPoint: {
        name: 'Bến xe Miền Đông',
        address: '292 Đinh Bộ Lĩnh, P.26, Q. Bình Thạnh',
        time: tripTime(0, 7.5),
      },
      dropoffPoint: {
        name: 'Bến xe Vũng Tàu',
        address: '192 Nam Kỳ Khởi Nghĩa, P.9, TP. Vũng Tàu',
        time: tripTime(0, 10.5),
      },
      totalPrice: 240000,
      discount: 0,
      finalPrice: 240000,
      paymentMethod: 'vnpay',
      paymentStatus: 'paid',
      paidAt: daysFromNow(-1),
      status: 'confirmed',
      isGuestBooking: false,
    });

    const qrData2 = JSON.stringify({ bookingCode: 'BK000002', tripId: trips[1]._id.toString() });
    await Ticket.create({
      ticketCode: 'TK000002',
      bookingId: booking2._id,
      tripId: trips[1]._id,
      operatorId: operators[0]._id,
      customerId: users[2]._id,
      qrCode: Buffer.from(qrData2).toString('base64'),
      qrCodeData: crypto.createHash('sha256').update(qrData2).digest('hex'),
      totalPrice: 240000,
      passengers: [
        { seatNumber: 'B2', fullName: 'Trần Thị Bình' },
        { seatNumber: 'B3', fullName: 'Trần Văn Cúc' },
      ],
      tripInfo: {
        routeName: 'TP. Hồ Chí Minh - Vũng Tàu',
        departureTime: tripTime(0, 8),
        arrivalTime: tripTime(0, 10.5),
        origin: 'Bến xe Miền Đông',
        destination: 'Bến xe Vũng Tàu',
        busNumber: 'PT-003',
        busType: 'sleeper',
      },
      status: 'valid',
    });

    // Booking 3: Guest booking on future trip (for cancel testing)
    const booking3 = await Booking.create({
      bookingCode: 'BK000003',
      tripId: trips[4]._id,
      operatorId: operators[1]._id,
      seats: [
        { seatNumber: 'C1', price: 350000, passengerName: 'Lê Văn Guest' },
      ],
      contactInfo: {
        name: 'Lê Văn Guest',
        phone: '0912345678',
        email: 'customer1@gmail.com',
      },
      pickupPoint: {
        name: 'Bến xe Miền Đông',
        address: '292 Đinh Bộ Lĩnh, P.26, Q. Bình Thạnh',
        time: tripTime(1, 5.5),
      },
      dropoffPoint: {
        name: 'Bến xe Phía Nam Nha Trang',
        address: '23 Tháng 10, Nha Trang',
        time: tripTime(1, 14),
      },
      totalPrice: 350000,
      discount: 0,
      finalPrice: 350000,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      status: 'pending',
      isGuestBooking: true,
    });

    const qrData3 = JSON.stringify({ bookingCode: 'BK000003', tripId: trips[4]._id.toString() });
    await Ticket.create({
      ticketCode: 'TK000003',
      bookingId: booking3._id,
      tripId: trips[4]._id,
      operatorId: operators[1]._id,
      qrCode: Buffer.from(qrData3).toString('base64'),
      qrCodeData: crypto.createHash('sha256').update(qrData3).digest('hex'),
      totalPrice: 350000,
      passengers: [
        { seatNumber: 'C1', fullName: 'Lê Văn Guest' },
      ],
      tripInfo: {
        routeName: 'TP. Hồ Chí Minh - Nha Trang',
        departureTime: tripTime(1, 6),
        arrivalTime: tripTime(1, 14),
        origin: 'Bến xe Miền Đông',
        destination: 'Bến xe Phía Nam',
        busNumber: 'TB-001',
        busType: 'limousine',
      },
      status: 'valid',
    });

    console.log(`Created 3 bookings & 3 tickets\n`);

    // ==================== COMPLAINTS ====================
    console.log('Creating sample Complaints...');

    const complaints = await createWithHooks(Complaint, [
      {
        subject: 'Xe khởi hành trễ 30 phút',
        description: 'Chuyến HCM - Đà Lạt ngày hôm nay khởi hành trễ 30 phút so với lịch, không có thông báo trước.',
        category: 'service',
        priority: 'medium',
        status: 'open',
        userId: users[1]._id,
        userEmail: 'customer1@gmail.com',
        userPhone: '0912345678',
        bookingId: booking1._id,
        operatorId: operators[0]._id,
        tripId: trips[0]._id,
      },
      {
        subject: 'Thanh toán VNPay bị trừ tiền nhưng không nhận vé',
        description: 'Tôi đã thanh toán qua VNPay cho chuyến HCM - Vũng Tàu, tiền đã bị trừ nhưng hệ thống báo lỗi và không cấp vé.',
        category: 'payment',
        priority: 'high',
        status: 'in_progress',
        userId: users[2]._id,
        userEmail: 'customer2@gmail.com',
        userPhone: '0923456789',
        bookingId: booking2._id,
        operatorId: operators[0]._id,
        tripId: trips[1]._id,
        assignedTo: users[0]._id,
        assignedAt: daysFromNow(-1),
        notes: [
          {
            content: 'Đã liên hệ VNPay để xác minh giao dịch',
            addedBy: users[0]._id,
            addedByRole: 'admin',
            isInternal: true,
          },
        ],
      },
      {
        subject: 'Tài xế lái xe không an toàn',
        description: 'Tài xế chuyến HCM - Nha Trang lái xe quá tốc độ, vượt ẩu nhiều lần. Hành khách rất lo sợ.',
        category: 'driver',
        priority: 'urgent',
        status: 'open',
        userId: users[3]._id,
        userEmail: 'customer3@gmail.com',
        userPhone: '0934567890',
        operatorId: operators[1]._id,
      },
      {
        subject: 'Ghế bị hỏng không ngồi được',
        description: 'Ghế A3 trên chuyến HCM - Phan Thiết bị hỏng, không thể ngả lưng. Phải đổi ghế khác.',
        category: 'vehicle',
        priority: 'low',
        status: 'resolved',
        userId: users[4]._id,
        userEmail: 'customer4@gmail.com',
        userPhone: '0945678901',
        operatorId: operators[2]._id,
        resolution: 'Đã hoàn tiền chênh lệch ghế và ghi nhận để sửa chữa.',
        resolvedBy: users[0]._id,
        resolvedAt: daysFromNow(-2),
        satisfactionRating: 4,
        satisfactionFeedback: 'Xử lý khá nhanh, cảm ơn.',
      },
    ]);

    console.log(`Created ${complaints.length} complaints\n`);

    // ==================== SUMMARY ====================
    logger.info('\n==================== SEED SUMMARY ====================');
    logger.info(`Users: ${users.length} (1 admin + ${users.length - 1} customers)`);
    logger.info(`Bus Operators: ${operators.length}`);
    console.log(`Employees: ${employees.length}`);
    console.log(`   - Drivers: ${employees.filter(e => e.role === 'driver').length}`);
    console.log(`   - Trip Managers: ${employees.filter(e => e.role === 'trip_manager').length}`);
    console.log(`Buses: ${buses.length}`);
    console.log(`Routes: ${routes.length} (${routes.reduce((sum, r) => sum + r.stops.length, 0)} stops total)`);
    console.log(`Trips: ${trips.length}`);
    console.log(`   - Ongoing: ${trips.filter(t => t.status === 'ongoing').length}`);
    console.log(`   - Scheduled: ${trips.filter(t => t.status === 'scheduled').length}`);
    console.log(`   - Future trips (>1 day): ${trips.filter(t => t.departureTime > tripTime(1, 0)).length}`);
    console.log(`Vouchers: ${vouchers.length}`);
    console.log(`Bookings: 3 (2 confirmed + 1 pending guest)`);
    console.log(`Tickets: 3`);
    console.log(`Complaints: ${complaints.length}`);
    console.log('========================================================\n');

    console.log('Database seeding completed successfully!\n');
    console.log('Login Credentials:');
    console.log('   Admin:        admin@quikride.com / admin123');
    console.log('   Operator 1:   operator1@quikride.com / operator123');
    console.log('   Operator 2:   operator2@quikride.com / operator123');
    console.log('   Operator 3:   operator3@quikride.com / operator123');
    console.log('   Trip Manager: TM-PT-001 / manager123 (or email: hoa.manager@phuongtrang.com)');
    console.log('   Driver:       DRV-PT-001 / driver123 (or email: long.driver@phuongtrang.com)');
    console.log('   Customer 1:   customer1@gmail.com / 123456 (Gold)');
    console.log('   Customer 2:   customer2@gmail.com / 123456 (Silver)');
    console.log('   Customer 3:   customer3@gmail.com / 123456 (Bronze)');
    console.log('   Customer 4:   customer4@gmail.com / 123456 (Bronze)\n');
    console.log('Voucher Codes: WELCOME50, PHUONGTRANG10, GOLD20, VUNGTAU30K, EXPIRED2025\n');
    console.log('Booking Codes: BK000001, BK000002, BK000003\n');
    console.log('Guest Ticket Lookup: phone 0912345678, demo OTP: 123456\n');

  } catch (error) {
    console.error('Error seeding database:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  console.log('Database connection closed. Goodbye!\n');
  process.exit(0);
};

main();
