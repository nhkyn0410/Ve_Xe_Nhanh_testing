/* eslint-disable no-await-in-loop, security/detect-object-injection */
/**
 * Seed one customer account with past trips and 5,000 loyalty points.
 *
 * Idempotent: recreates this customer's bookings, tickets, payments, reviews,
 * and dedicated past trips without touching unrelated data.
 *
 * Usage:
 *   node scripts/seedCustomerHistory.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

const User = require('../src/models/User');
const BusOperator = require('../src/models/BusOperator');
const Bus = require('../src/models/Bus');
const Employee = require('../src/models/Employee');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const Ticket = require('../src/models/Ticket');
const Review = require('../src/models/Review');

const CUSTOMER = {
  email: 'customer.history@vexenhanh.vn',
  phone: '0901234599',
  password: 'customer123',
  fullName: 'Nguyen Minh Anh',
};

const PAST_TRIP_PREFIX = 'VXN-SEED-CUSTOMER-HISTORY';

const PAST_TRIPS = [
  {
    code: `${PAST_TRIP_PREFIX}-001`,
    departAt: new Date(2026, 1, 18, 7, 30),
    seatNumber: 'A1',
    price: 240000,
    review: 'Chuyen di dung gio, xe sach va nhan vien ho tro rat tot.',
  },
  {
    code: `${PAST_TRIP_PREFIX}-002`,
    departAt: new Date(2026, 2, 12, 20, 0),
    seatNumber: 'B2',
    price: 320000,
    review: 'Dat ve nhanh, len xe thuan tien, trai nghiem on dinh.',
  },
  {
    code: `${PAST_TRIP_PREFIX}-003`,
    departAt: new Date(2026, 3, 24, 6, 15),
    seatNumber: 'C3',
    price: 280000,
    review: 'Tai xe than thien, thong tin diem don tra ro rang.',
  },
];

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function pickPoint(points, fallback) {
  return points && points.length ? points[0] : fallback;
}

async function findSeedResources() {
  const operator = await BusOperator.findOne({
    verificationStatus: 'approved',
    isActive: true,
    isSuspended: false,
  }).sort({ createdAt: 1 });

  if (!operator) {
    throw new Error('Missing approved operator. Run npm run seed:operators first.');
  }

  const [route, bus, driver, manager] = await Promise.all([
    Route.findOne({ operatorId: operator._id, isActive: true }).sort({ routeCode: 1 }),
    Bus.findOne({ operatorId: operator._id, status: 'active' }).sort({ busNumber: 1 }),
    Employee.findOne({
      operatorId: operator._id,
      role: 'driver',
      status: 'active',
      licenseExpiry: { $gt: new Date() },
    }).sort({ employeeCode: 1 }),
    Employee.findOne({
      operatorId: operator._id,
      role: 'trip_manager',
      status: 'active',
    }).sort({ employeeCode: 1 }),
  ]);

  if (!route) throw new Error('Missing active route. Run npm run seed:routes first.');
  if (!bus) throw new Error('Missing active bus. Run npm run seed:buses first.');
  if (!driver || !manager) {
    throw new Error('Missing active driver/trip manager. Run npm run seed:employees first.');
  }

  return { operator, route, bus, driver, manager };
}

async function upsertCustomer() {
  const existing = await User.findOne({
    $or: [{ email: CUSTOMER.email }, { phone: CUSTOMER.phone }],
  }).select('+password');

  const pointsHistory = PAST_TRIPS.map((trip, index) => ({
    points: [1600, 1700, 1700][index],
    reason: `Hoan thanh chuyen di - ${trip.code}`,
    type: 'earn',
    createdAt: addMinutes(trip.departAt, 60),
    expiresAt: new Date(2027, trip.departAt.getMonth(), trip.departAt.getDate()),
    isExpired: false,
  }));

  const payload = {
    email: CUSTOMER.email,
    phone: CUSTOMER.phone,
    fullName: CUSTOMER.fullName,
    dateOfBirth: new Date(1995, 8, 12),
    gender: 'female',
    role: 'customer',
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    isBlocked: false,
    savedPassengers: [
      {
        fullName: CUSTOMER.fullName,
        phone: CUSTOMER.phone,
        idCard: '079195012345',
      },
    ],
    loyaltyTier: 'gold',
    totalPoints: 5000,
    pointsHistory,
  };

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return { doc: existing, created: false };
  }

  const user = new User({ ...payload, password: CUSTOMER.password });
  await user.save();
  return { doc: user, created: true };
}

async function clearCustomerHistory(customerId) {
  const bookings = await Booking.find({ customerId }).select('_id');
  const bookingIds = bookings.map((booking) => booking._id);

  await Promise.all([
    Review.deleteMany({ userId: customerId }),
    Ticket.deleteMany({ customerId }),
    Payment.deleteMany({ customerId }),
    Booking.deleteMany({ customerId }),
  ]);

  if (bookingIds.length) {
    await Promise.all([
      Review.deleteMany({ bookingId: { $in: bookingIds } }),
      Ticket.deleteMany({ bookingId: { $in: bookingIds } }),
      Payment.deleteMany({ bookingId: { $in: bookingIds } }),
    ]);
  }

  await Trip.deleteMany({ recurringGroupId: { $regex: `^${PAST_TRIP_PREFIX}` } });
}

async function createPastTrip(resources, spec, index) {
  const { operator, route, bus, driver, manager } = resources;
  const duration = route.estimatedDuration || 240;
  const temporaryDeparture = addMinutes(new Date(), 24 * 60 + index * 60);

  const trip = new Trip({
    routeId: route._id,
    busId: bus._id,
    operatorId: operator._id,
    driverId: driver._id,
    tripManagerId: manager._id,
    departureTime: temporaryDeparture,
    arrivalTime: addMinutes(temporaryDeparture, duration),
    basePrice: spec.price,
    discount: 0,
    finalPrice: spec.price,
    totalSeats: bus.seatLayout.totalSeats,
    availableSeats: bus.seatLayout.totalSeats,
    bookedSeats: [],
    status: 'scheduled',
    isRecurring: false,
    recurringGroupId: spec.code,
    notes: 'Seed customer history trip.',
    journey: {
      currentStopIndex: -1,
      currentStatus: 'preparing',
      stoppedAt: [],
      statusHistory: [],
    },
  });

  await trip.save();

  trip.departureTime = spec.departAt;
  trip.arrivalTime = addMinutes(spec.departAt, duration);
  trip.status = 'completed';
  trip.journey = {
    currentStopIndex: route.stops.length ? route.stops.length - 1 : -1,
    currentStatus: 'completed',
    stoppedAt: route.stops.map((_stop, stopIndex) => stopIndex),
    actualDepartureTime: spec.departAt,
    actualArrivalTime: addMinutes(spec.departAt, duration),
    statusHistory: [
      {
        status: 'completed',
        stopIndex: route.stops.length ? route.stops.length - 1 : -1,
        timestamp: addMinutes(spec.departAt, duration),
        notes: 'Seeded as completed customer trip.',
      },
    ],
  };
  await trip.save();

  return trip;
}

async function createBookingSet(customer, resources, trip, spec, index) {
  const { operator, route, bus } = resources;
  const pickup = pickPoint(route.pickupPoints, {
    name: route.origin.station || route.origin.city,
    address: route.origin.address,
  });
  const dropoff = pickPoint(route.dropoffPoints, {
    name: route.destination.station || route.destination.city,
    address: route.destination.address,
  });

  const bookingCode = `BK-HISTORY-${String(index + 1).padStart(3, '0')}`;
  const booking = await Booking.create({
    bookingCode,
    tripId: trip._id,
    customerId: customer._id,
    operatorId: operator._id,
    status: 'completed',
    seats: [
      {
        seatNumber: spec.seatNumber,
        price: spec.price,
        passengerName: customer.fullName,
        passengerPhone: customer.phone,
        passengerEmail: customer.email,
        passengerIdCard: '079195012345',
      },
    ],
    contactInfo: {
      name: customer.fullName,
      phone: customer.phone,
      email: customer.email,
    },
    pickupPoint: {
      name: pickup.name,
      address: pickup.address,
      time: spec.departAt,
    },
    dropoffPoint: {
      name: dropoff.name,
      address: dropoff.address,
      time: trip.arrivalTime,
    },
    totalPrice: spec.price,
    finalPrice: spec.price,
    paymentMethod: 'vnpay',
    paymentStatus: 'paid',
    paidAt: addMinutes(spec.departAt, -60),
    isGuestBooking: false,
    isHeld: false,
  });

  trip.bookedSeats = [
    {
      seatNumber: spec.seatNumber,
      bookingId: booking._id,
      passengerName: customer.fullName,
    },
  ];
  trip.availableSeats = Math.max(0, trip.totalSeats - trip.bookedSeats.length);
  await trip.save();

  await Payment.create({
    paymentCode: `PAY-HISTORY-${String(index + 1).padStart(3, '0')}`,
    bookingId: booking._id,
    customerId: customer._id,
    operatorId: operator._id,
    paymentMethod: 'vnpay',
    paymentGateway: 'vnpay',
    amount: spec.price,
    status: 'completed',
    transactionId: `VXN-HISTORY-${String(index + 1).padStart(3, '0')}`,
    initiatedAt: addMinutes(spec.departAt, -75),
    processedAt: addMinutes(spec.departAt, -60),
    completedAt: addMinutes(spec.departAt, -60),
    callbackReceived: true,
    callbackReceivedAt: addMinutes(spec.departAt, -60),
    notes: 'Seed completed payment for customer history.',
  });

  const ticket = await Ticket.create({
    ticketCode: `TKT-HISTORY-${String(index + 1).padStart(3, '0')}`,
    bookingId: booking._id,
    customerId: customer._id,
    tripId: trip._id,
    operatorId: operator._id,
    qrCode: `seed-qr-${bookingCode}`,
    qrCodeData: JSON.stringify({ bookingCode, customerId: customer._id, tripId: trip._id }),
    passengers: [
      {
        seatNumber: spec.seatNumber,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        idCard: '079195012345',
      },
    ],
    tripInfo: {
      routeName: route.routeName,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      origin: route.origin,
      destination: route.destination,
      pickupPoint: {
        name: pickup.name,
        address: pickup.address,
      },
      dropoffPoint: {
        name: dropoff.name,
        address: dropoff.address,
      },
      busNumber: bus.busNumber,
      busType: bus.busType,
    },
    totalPrice: spec.price,
    isUsed: true,
    usedAt: addMinutes(spec.departAt, 10),
    status: 'used',
    emailSent: true,
    emailSentAt: addMinutes(spec.departAt, -55),
  });

  await Review.create({
    userId: customer._id,
    bookingId: booking._id,
    tripId: trip._id,
    operatorId: operator._id,
    overallRating: index === 1 ? 4 : 5,
    vehicleRating: index === 1 ? 4 : 5,
    driverRating: 5,
    punctualityRating: index === 1 ? 4 : 5,
    serviceRating: 5,
    comment: spec.review,
    isPublished: true,
  });

  return { booking, ticket };
}

async function seedCustomerHistory() {
  await connectDB();

  const resources = await findSeedResources();
  const customerResult = await upsertCustomer();
  await clearCustomerHistory(customerResult.doc._id);

  const createdBookings = [];
  const createdTickets = [];

  for (let index = 0; index < PAST_TRIPS.length; index += 1) {
    const spec = PAST_TRIPS[index];
    const trip = await createPastTrip(resources, spec, index);
    const { booking, ticket } = await createBookingSet(
      customerResult.doc,
      resources,
      trip,
      spec,
      index
    );
    createdBookings.push(booking.bookingCode);
    createdTickets.push(ticket.ticketCode);
  }

  logger.success('Seed customer history completed.');
  logger.info('CUSTOMER HISTORY SUMMARY');
  logger.info(`Email: ${CUSTOMER.email}`);
  logger.info(`Password: ${CUSTOMER.password}`);
  logger.info(`Phone: ${CUSTOMER.phone}`);
  logger.info('Loyalty: gold / 5000 points');
  logger.info(`Bookings: ${createdBookings.join(', ')}`);
  logger.info(`Tickets: ${createdTickets.join(', ')}`);
}

seedCustomerHistory()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed customer history failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
