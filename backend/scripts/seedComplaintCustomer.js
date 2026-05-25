/* eslint-disable no-await-in-loop, security/detect-object-injection */
/**
 * Seed one customer account with complaint history.
 *
 * Idempotent: recreates this customer's complaints without touching unrelated
 * complaints or users.
 *
 * Usage:
 *   node scripts/seedComplaintCustomer.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

const User = require('../src/models/User');
const BusOperator = require('../src/models/BusOperator');
const Complaint = require('../src/models/Complaint');

const CUSTOMER = {
  email: 'customer.complaints@vexenhanh.vn',
  phone: '0901234588',
  password: 'customer123',
  fullName: 'Tran Hoai Nam',
};

const COMPLAINTS = [
  {
    ticketNumber: 'TCKT-SEED-CMP-001',
    subject: 'Xe den diem don tre hon thong bao',
    description:
      'Toi da co mat tai diem don truoc gio khoi hanh 20 phut nhung xe den tre khoang 35 phut va khong co thong bao kip thoi.',
    category: 'service',
    priority: 'medium',
    status: 'resolved',
    resolution:
      'Da xin loi khach hang, ghi nhan vi pham thong bao cham va tang voucher bu dap cho lan dat ve tiep theo.',
    satisfactionRating: 4,
    satisfactionFeedback: 'Nhan vien xu ly lich su, mong lan sau thong bao som hon.',
    notes: [
      {
        content: 'Toi can ho tro vi lich trinh bi anh huong.',
        role: 'customer',
      },
      {
        content: 'Khach da xac nhan nhan phuong an bu dap.',
        role: 'admin',
        isInternal: true,
      },
    ],
  },
  {
    ticketNumber: 'TCKT-SEED-CMP-002',
    subject: 'Nhan sai thong tin diem tra tren ve',
    description:
      'Ve dien tu hien diem tra khac voi diem toi da chon khi dat ve. Nho bo phan ho tro kiem tra va cap nhat lai.',
    category: 'booking',
    priority: 'high',
    status: 'in_progress',
    notes: [
      {
        content: 'Toi da gui anh chup man hinh ve qua email ho tro.',
        role: 'customer',
      },
    ],
  },
  {
    ticketNumber: 'TCKT-SEED-CMP-003',
    subject: 'Can kiem tra giao dich thanh toan',
    description:
      'Tai khoan ngan hang da tru tien nhung trang thanh toan ban dau bao dang xu ly. Toi muon duoc kiem tra lai.',
    category: 'payment',
    priority: 'medium',
    status: 'open',
    notes: [
      {
        content: 'Giao dich phat sinh luc 20:14, ma tham chieu ngan hang ket thuc bang 8821.',
        role: 'customer',
      },
    ],
  },
];

async function findOperator() {
  return BusOperator.findOne({
    verificationStatus: 'approved',
    isActive: true,
    isSuspended: false,
  }).sort({ createdAt: 1 });
}

async function findOrCreateAdmin() {
  const existing = await User.findOne({ role: 'admin', isActive: true, isBlocked: false });
  if (existing) return existing;

  const admin = new User({
    email: 'admin.complaints.seed@vexenhanh.vn',
    phone: '0901999988',
    password: 'admin123',
    fullName: 'Seed Complaint Admin',
    role: 'admin',
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    isBlocked: false,
  });
  await admin.save();
  return admin;
}

async function upsertCustomer() {
  const existing = await User.findOne({
    $or: [{ email: CUSTOMER.email }, { phone: CUSTOMER.phone }],
  }).select('+password');

  const payload = {
    email: CUSTOMER.email,
    phone: CUSTOMER.phone,
    fullName: CUSTOMER.fullName,
    dateOfBirth: new Date(1992, 4, 22),
    gender: 'male',
    role: 'customer',
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    isBlocked: false,
    loyaltyTier: 'silver',
    totalPoints: 2400,
    pointsHistory: [
      {
        points: 2400,
        reason: 'Diem seed cho customer co lich su khieu nai',
        type: 'earn',
        createdAt: new Date(2026, 3, 10, 9, 0),
        expiresAt: new Date(2027, 3, 10, 9, 0),
        isExpired: false,
      },
    ],
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

async function createComplaint(customer, admin, operator, spec, index) {
  const createdAt = new Date(2026, 4, 1 + index * 5, 10 + index, 15, 0);
  const resolvedAt = spec.status === 'resolved' ? new Date(2026, 4, 2 + index * 5, 15, 30, 0) : null;

  const complaint = new Complaint({
    ticketNumber: spec.ticketNumber,
    subject: spec.subject,
    description: spec.description,
    category: spec.category,
    priority: spec.priority,
    status: spec.status,
    userId: customer._id,
    userEmail: customer.email,
    userPhone: customer.phone,
    operatorId: operator?._id,
    assignedTo: spec.status !== 'open' ? admin._id : undefined,
    assignedAt: spec.status !== 'open' ? createdAt : undefined,
    notes: spec.notes.map((note, noteIndex) => ({
      content: note.content,
      addedBy: note.role === 'admin' ? admin._id : customer._id,
      addedByRole: note.role,
      isInternal: note.isInternal || false,
      createdAt: new Date(createdAt.getTime() + (noteIndex + 1) * 60 * 60 * 1000),
    })),
    resolution: spec.resolution,
    resolvedBy: resolvedAt ? admin._id : undefined,
    resolvedAt,
    satisfactionRating: spec.satisfactionRating,
    satisfactionFeedback: spec.satisfactionFeedback,
    createdAt,
    updatedAt: resolvedAt || createdAt,
  });

  await complaint.save();
  return complaint;
}

async function seedComplaintCustomer() {
  await connectDB();

  const [operator, admin, customerResult] = await Promise.all([
    findOperator(),
    findOrCreateAdmin(),
    upsertCustomer(),
  ]);

  await Complaint.deleteMany({ userId: customerResult.doc._id });
  await Complaint.deleteMany({
    ticketNumber: { $in: COMPLAINTS.map((complaint) => complaint.ticketNumber) },
  });

  const complaints = [];
  for (let index = 0; index < COMPLAINTS.length; index += 1) {
    const complaint = await createComplaint(
      customerResult.doc,
      admin,
      operator,
      COMPLAINTS[index],
      index
    );
    complaints.push(`${complaint.ticketNumber} (${complaint.status})`);
  }

  logger.success('Seed complaint customer completed.');
  logger.info('COMPLAINT CUSTOMER SUMMARY');
  logger.info(`Email: ${CUSTOMER.email}`);
  logger.info(`Password: ${CUSTOMER.password}`);
  logger.info(`Phone: ${CUSTOMER.phone}`);
  logger.info(`Complaints: ${complaints.join(', ')}`);
}

seedComplaintCustomer()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed complaint customer failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
