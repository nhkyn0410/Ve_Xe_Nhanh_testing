/**
 * SEED DATA SCRIPT
 * 
 * Mục tiêu: Tạo dữ liệu mẫu cho hệ thống Vé Xe Nhanh.
 * Đảm bảo: 
 * - Ít nhất 30 BusOperator
 * - 1 Admin
 * - 1 Customer
 * - Dữ liệu đầy đủ cho Dashboard (Booking, Payment, Trip, Ticket)
 * - Tuân thủ SEED_DATA_GUIDE.md
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

// Models
const User = require('../src/models/User');
const BusOperator = require('../src/models/BusOperator');
const Employee = require('../src/models/Employee');
const Bus = require('../src/models/Bus');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const Ticket = require('../src/models/Ticket');
const Review = require('../src/models/Review');
const Complaint = require('../src/models/Complaint');
const Banner = require('../src/models/Banner');
const Blog = require('../src/models/Blog');
const FAQ = require('../src/models/FAQ');
const Voucher = require('../src/models/Voucher');

/**
 * Helper để chạy hook (new + save)
 */
async function createWithHooks(Model, docs) {
  const out = [];
  for (const d of docs) {
    const doc = new Model(d);
    await doc.save();
    out.push(doc);
  }
  return out;
}

/**
 * Helper tính ngày
 */
function daysFromNow(days, hour = 7) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * Xóa sạch dữ liệu cũ
 */
async function clearData() {
  logger.info('Đang xóa dữ liệu cũ...');
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    await mongoose.connection.collections[collectionName].deleteMany({});
  }
  logger.success('Đã xóa sạch dữ liệu cũ.');
}

  return createdDocs;
};



// Enhanced seed data with full journey tracking
const seedData = async () => {
  try {
    await connectDB();
    await clearData();

    // 1. Tạo Users (Admin & Customer)
    logger.info('Đang tạo Users...');
    const users = await createWithHooks(User, [
      {
        fullName: 'Hệ thống Admin',
        email: 'admin@vexenhanh.vn',
        phone: '0987654321',
        password: 'admin123',
        role: 'admin',
        isActive: true
      },
      {
        fullName: 'Nguyễn Văn Khách',
        email: 'customer@gmail.com',
        phone: '0900000000',
        password: 'customer123',
        role: 'customer',
        isActive: true,
        loyaltyTier: 'silver',
        totalPoints: 2500
      }
    ]);
    const admin = users[0];
    const customer = users[1];

    // 2. Tạo 30 BusOperators
    logger.info('Đang tạo 30 Bus Operators...');
    const operatorData = [];
    const provinces = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Đà Lạt', 'Hải Phòng', 'Nha Trang', 'Huế'];
    
    for (let i = 1; i <= 30; i++) {
      const province = provinces[i % provinces.length];
      const operatorName = `Nhà xe ${i < 10 ? '0' + i : i} - ${['Kim Chi', 'Phương Trang', 'Thành Bưởi', 'Hải Vân', 'Hoàng Long', 'Mai Linh'][i % 6]}`;
      operatorData.push({
        companyName: operatorName,
        operatorName,
        email: `operator${i}@vexenhanh.vn`,
        phone: `09123456${i < 10 ? '0' + i : i}`,
        password: 'operator123',
        businessLicense: `GPKD-${1000 + i}`,
        taxCode: `MST-${2000 + i}`,
        verificationStatus: 'approved',
        isActive: true,
        isSuspended: false,
        address: {
          city: province,
          province: province,
          street: `${i * 10} Đường Chính`
        },
        averageRating: 4 + (i % 10) / 10
      });
    }
    const operators = await createWithHooks(BusOperator, operatorData);

    // 3. Tạo Employee (Cho 5 nhà xe đầu tiên để có dữ liệu chạy chuyến)
    logger.info('Đang tạo Employees cho 5 nhà xe đầu...');
    const allEmployees = [];
    for (let i = 0; i < 5; i++) {
      const op = operators[i];
      const emps = await createWithHooks(Employee, [
        {
          operatorId: op._id,
          employeeCode: `DRV-${op._id.toString().slice(-4).toUpperCase()}-1`,
          fullName: `Tài xế ${i + 1}`,
          phone: `092000000${i}`,
          password: 'driver123',
          role: 'driver',
          status: 'active',
          licenseNumber: `LX-${1000 + i}`,
          licenseClass: 'E',
          licenseExpiry: daysFromNow(365)
        },
        {
          operatorId: op._id,
          employeeCode: `TM-${op._id.toString().slice(-4).toUpperCase()}-1`,
          fullName: `Quản lý ${i + 1}`,
          phone: `093000000${i}`,
          password: 'manager123',
          role: 'trip_manager',
          status: 'active'
        }
      ]);
      allEmployees.push(...emps);
    }

    // 4. Tạo Bus (Cho 5 nhà xe đầu)
    logger.info('Đang tạo Buses...');
    const allBuses = [];
    for (let i = 0; i < 5; i++) {
      const op = operators[i];
      const bus = await new Bus({
        operatorId: op._id,
        busNumber: `${29 + i}B-${1000 + i}`,
        busType: i % 2 === 0 ? 'limousine' : 'sleeper',
        status: 'active',
        amenities: ['wifi', 'ac', 'water', 'tv'],
        seatLayout: {
          floors: 1,
          rows: 6,
          columns: 4,
          totalSeats: 24,
          layout: [
            ['A1', 'A2', 'AISLE', 'A3', 'A4'],
            ['B1', 'B2', 'AISLE', 'B3', 'B4'],
            ['C1', 'C2', 'AISLE', 'C3', 'C4'],
            ['D1', 'D2', 'AISLE', 'D3', 'D4'],
            ['E1', 'E2', 'AISLE', 'E3', 'E4'],
            ['F1', 'F2', 'AISLE', 'F3', 'F4']
          ]
        }
      }).save();
      allBuses.push(bus);
    }

    // 5. Tạo Routes (Cho 5 nhà xe đầu)
    logger.info('Đang tạo Routes...');
    const allRoutes = [];
    const routePairs = [
      { from: 'Hồ Chí Minh', to: 'Đà Lạt', code: 'HCM-DL', dist: 300, dur: 420 },
      { from: 'Hà Nội', to: 'Sapa', code: 'HN-SP', dist: 320, dur: 360 },
      { from: 'Đà Nẵng', to: 'Huế', code: 'DN-HUE', dist: 100, dur: 120 },
      { from: 'Cần Thơ', to: 'Rạch Giá', code: 'CT-RG', dist: 120, dur: 150 },
      { from: 'Hồ Chí Minh', to: 'Nha Trang', code: 'HCM-NT', dist: 450, dur: 540 }
    ];

    for (let i = 0; i < 5; i++) {
      const op = operators[i];
      const pair = routePairs[i % routePairs.length];
      const route = await new Route({
        operatorId: op._id,
        routeName: `${pair.from} - ${pair.to}`,
        routeCode: `${pair.code}-${i}`,
        origin: { city: pair.from, province: pair.from, coordinates: { lat: 10.7, lng: 106.6 } },
        destination: { city: pair.to, province: pair.to, coordinates: { lat: 11.9, lng: 108.4 } },
        distance: pair.dist,
        estimatedDuration: pair.dur,
        basePrice: 200000 + i * 10000,
        isActive: true
      }).save();
      allRoutes.push(route);
    }

    // 6. Tạo Trips (Cho 5 nhà xe đầu)
    logger.info('Đang tạo Trips...');
    const allTrips = [];
    for (let i = 0; i < 5; i++) {
      const op = operators[i];
      const route = allRoutes[i];
      const bus = allBuses[i];
      const driver = allEmployees.find(e => e.operatorId.equals(op._id) && e.role === 'driver');
      const manager = allEmployees.find(e => e.operatorId.equals(op._id) && e.role === 'trip_manager');

      // Chuyến tương lai
      const tripFuture = await new Trip({
        operatorId: op._id,
        routeId: route._id,
        busId: bus._id,
        driverId: driver._id,
        tripManagerId: manager._id,
        departureTime: daysFromNow(2, 8 + i),
        arrivalTime: daysFromNow(2, 14 + i),
        basePrice: route.basePrice,
        finalPrice: route.basePrice,
        totalSeats: bus.seatLayout.totalSeats,
        availableSeats: bus.seatLayout.totalSeats,
        status: 'scheduled'
      }).save();
      allTrips.push(tripFuture);

      // Chuyến trong tháng này (để có dashboard revenue)
      const tripPast = await new Trip({
        operatorId: op._id,
        routeId: route._id,
        busId: bus._id,
        driverId: driver._id,
        tripManagerId: manager._id,
        departureTime: daysFromNow(1, 8),
        arrivalTime: daysFromNow(1, 14),
        basePrice: route.basePrice,
        finalPrice: route.basePrice,
        totalSeats: bus.seatLayout.totalSeats,
        availableSeats: bus.seatLayout.totalSeats,
        status: 'completed'
      }).save();
      allTrips.push(tripPast);
    }

    // 7. Tạo Booking, Payment, Ticket (Cho dashboard data)
    logger.info('Đang tạo Booking, Payment, Ticket, Review...');
    for (let i = 0; i < 5; i++) {
      const trip = allTrips[i * 2 + 1]; // Chuyến đã hoàn thành
      const bookingCode = await Booking.generateBookingCode();
      const booking = await new Booking({
        bookingCode,
        tripId: trip._id,
        operatorId: trip.operatorId,
        customerId: customer._id,
        totalPrice: trip.finalPrice * 2,
        finalPrice: trip.finalPrice * 2,
        seats: [
          { seatNumber: 'A1', price: trip.finalPrice, passengerName: 'Nguyễn Văn Khách' },
          { seatNumber: 'A2', price: trip.finalPrice, passengerName: 'Trần Thị Bạn' }
        ],
        contactInfo: {
          name: 'Nguyễn Văn Khách',
          phone: '0900000000',
          email: 'customer@gmail.com'
        },
        status: 'completed',
        paymentStatus: 'paid'
      }).save();

      const paymentCode = await Payment.generatePaymentCode();
      const payment = await new Payment({
        paymentCode,
        bookingId: booking._id,
        operatorId: booking.operatorId,
        amount: booking.finalPrice,
        paymentMethod: 'vnpay',
        status: 'completed'
      }).save();

      // TRAP §6: Cập nhật paidAt trực tiếp vào collection
      await Payment.collection.updateOne(
        { _id: payment._id },
        { $set: { paidAt: new Date(), completedAt: new Date() } }
      );

      const ticketCode = await Ticket.generateTicketCode();
      await new Ticket({
        bookingId: booking._id,
        tripId: trip._id,
        operatorId: trip.operatorId,
        ticketCode,
        qrCode: 'placeholder-qr',
        qrCodeData: `DATA-${booking._id}`,
        totalPrice: booking.finalPrice,
        passengers: booking.seats.map(s => ({ seatNumber: s.seatNumber, fullName: s.passengerName })),
        status: 'used'
      }).save();

      // Cập nhật Trip bookedSeats
      trip.bookedSeats.push(
        { seatNumber: 'A1', bookingId: booking._id, passengerName: 'Nguyễn Văn Khách' },
        { seatNumber: 'A2', bookingId: booking._id, passengerName: 'Trần Thị Bạn' }
      );
      await trip.save();

      // Thêm nhẹ Review
      await Review.create({
        userId: customer._id,
        bookingId: booking._id,
        tripId: trip._id,
        operatorId: trip.operatorId,
        overallRating: 5,
        comment: 'Xe chạy êm, dịch vụ rất tuyệt vời.',
        isPublished: true
      });
    }

    // 8. Khiếu nại (Complaint)
    logger.info('Đang tạo Complaints...');
    await Complaint.create({
      userId: customer._id,
      subject: 'Hỗ trợ đổi vé',
      description: 'Mình muốn đổi sang chuyến sớm hơn do có việc bận.',
      category: 'booking',
      priority: 'medium',
      status: 'open',
      userEmail: customer.email,
      userPhone: customer.phone
    });

    // 9. Tạo Vouchers, Banners, Blogs, FAQs
    logger.info('Đang tạo Content & Vouchers...');
    await Voucher.create([
      {
        code: 'VEXENHANH2026',
        name: 'Chào mừng 2026',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 0,
        maxDiscountValue: 50000,
        validFrom: daysFromNow(-10),
        validUntil: daysFromNow(30),
        isActive: true,
        applicableCustomerTiers: ['bronze', 'silver', 'gold', 'platinum']
      }
    ]);

    await Banner.create([
      { title: 'Chào mừng bạn đến với Vé Xe Nhanh', imageUrl: 'https://placehold.co/1200x400?text=Welcome', position: 'homepage', isActive: true },
      { title: 'Giảm giá 10% cho khách hàng mới', imageUrl: 'https://placehold.co/1200x400?text=Promo', position: 'homepage', isActive: true }
    ]);

    await Blog.create([
      {
        title: 'Kinh nghiệm du lịch Đà Lạt tự túc',
        slug: 'kinh-nghiem-du-lich-da-lat-tu-tuc',
        excerpt: 'Đà Lạt luôn là điểm đến hấp dẫn với khí hậu mát mẻ...',
        content: 'Nội dung chi tiết bài viết về Đà Lạt...',
        featuredImage: 'https://placehold.co/800x600?text=DaLat',
        author: admin._id,
        category: 'travel_tips',
        status: 'published',
        publishedAt: new Date()
      }
    ]);

    await FAQ.create([
      { question: 'Làm thế nào để đặt vé?', answer: 'Bạn chỉ cần chọn điểm đi, điểm đến và thời gian...', category: 'booking', isActive: true },
      { question: 'Chính sách hoàn vé như thế nào?', answer: 'Hoàn vé trước 24h khởi hành sẽ được hoàn 90%...', category: 'policies', isActive: true }
    ]);

    logger.success('\n========================================');
    logger.success('   SEEDING COMPLETED SUCCESSFULLY!   ');
    logger.success('========================================\n');

    logger.info('--- SEED SUMMARY ---');
    logger.info('ADMIN: admin@vexenhanh.vn / admin123');
    logger.info('CUSTOMER: customer@gmail.com / customer123');
    logger.info(`BUS OPERATORS: 30 accounts (operator1..30@vexenhanh.vn / operator123)`);
    logger.info('DRIVERS: driver123');
    logger.info('MANAGERS: manager123');
    logger.info('--------------------\n');

    process.exit(0);
  } catch (error) {
    logger.error('LỖI KHI SEED DỮ LIỆU:');
    logger.error(error);
    process.exit(1);
  }
}

seed();
