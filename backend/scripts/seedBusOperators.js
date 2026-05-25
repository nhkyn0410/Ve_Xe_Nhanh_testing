/* eslint-disable no-await-in-loop, security/detect-object-injection */
/**
 * Seed approved bus operators.
 *
 * Idempotent: upserts by stable seed email and does not clear other data.
 * Usage:
 *   node scripts/seedBusOperators.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

const BusOperator = require('../src/models/BusOperator');

const SEED_OPERATORS = [
  {
    code: 'SVE',
    companyName: 'VXN Seed - Sao Viet Express',
    operatorName: 'Sao Viet Express',
    email: 'seed.operator.sve@vexenhanh.vn',
    phone: '0901100001',
    businessLicense: 'VXN-SEED-OP-SVE',
    taxCode: '0319000001',
    rating: 4.7,
    city: 'Ha Noi',
    district: 'Cau Giay',
    ward: 'Dich Vong',
    street: '24 Duy Tan',
    bankCode: 'SVE',
  },
  {
    code: 'NPL',
    companyName: 'VXN Seed - Nam Phuong Limousine',
    operatorName: 'Nam Phuong Limousine',
    email: 'seed.operator.npl@vexenhanh.vn',
    phone: '0901100002',
    businessLicense: 'VXN-SEED-OP-NPL',
    taxCode: '0319000002',
    rating: 4.6,
    city: 'TP. Ho Chi Minh',
    district: 'Quan 1',
    ward: 'Ben Nghe',
    street: '112 Le Loi',
    bankCode: 'NPL',
  },
  {
    code: 'MPX',
    companyName: 'VXN Seed - Mekong Express',
    operatorName: 'Mekong Express',
    email: 'seed.operator.mpx@vexenhanh.vn',
    phone: '0901100003',
    businessLicense: 'VXN-SEED-OP-MPX',
    taxCode: '0319000003',
    rating: 4.5,
    city: 'Can Tho',
    district: 'Ninh Kieu',
    ward: 'An Cu',
    street: '38 Hoa Binh',
    bankCode: 'MPX',
  },
  {
    code: 'BDL',
    companyName: 'VXN Seed - Binh Dinh Limousine',
    operatorName: 'Binh Dinh Limousine',
    email: 'seed.operator.bdl@vexenhanh.vn',
    phone: '0901100004',
    businessLicense: 'VXN-SEED-OP-BDL',
    taxCode: '0319000004',
    rating: 4.4,
    city: 'Binh Dinh',
    district: 'Quy Nhon',
    ward: 'Le Loi',
    street: '09 Nguyen Tat Thanh',
    bankCode: 'BDL',
  },
  {
    code: 'HVL',
    companyName: 'VXN Seed - Hai Van Travel',
    operatorName: 'Hai Van Travel',
    email: 'seed.operator.hvl@vexenhanh.vn',
    phone: '0901100005',
    businessLicense: 'VXN-SEED-OP-HVL',
    taxCode: '0319000005',
    rating: 4.8,
    city: 'Da Nang',
    district: 'Hai Chau',
    ward: 'Thach Thang',
    street: '55 Bach Dang',
    bankCode: 'HVL',
  },
  {
    code: 'THB',
    companyName: 'VXN Seed - Thien Huong Bus',
    operatorName: 'Thien Huong Bus',
    email: 'seed.operator.thb@vexenhanh.vn',
    phone: '0901100006',
    businessLicense: 'VXN-SEED-OP-THB',
    taxCode: '0319000006',
    rating: 4.3,
    city: 'Thua Thien Hue',
    district: 'Hue',
    ward: 'Phu Hoi',
    street: '18 Hung Vuong',
    bankCode: 'THB',
  },
  {
    code: 'DNX',
    companyName: 'VXN Seed - Dai Nam Xanh',
    operatorName: 'Dai Nam Xanh',
    email: 'seed.operator.dnx@vexenhanh.vn',
    phone: '0901100007',
    businessLicense: 'VXN-SEED-OP-DNX',
    taxCode: '0319000007',
    rating: 4.6,
    city: 'Khanh Hoa',
    district: 'Nha Trang',
    ward: 'Loc Tho',
    street: '72 Tran Phu',
    bankCode: 'DNX',
  },
  {
    code: 'MTA',
    companyName: 'VXN Seed - Minh Tam An Phu',
    operatorName: 'Minh Tam An Phu',
    email: 'seed.operator.mta@vexenhanh.vn',
    phone: '0901100008',
    businessLicense: 'VXN-SEED-OP-MTA',
    taxCode: '0319000008',
    rating: 4.5,
    city: 'Lam Dong',
    district: 'Da Lat',
    ward: 'Phuong 1',
    street: '06 Nguyen Chi Thanh',
    bankCode: 'MTA',
  },
];

function buildOperatorPayload(spec) {
  return {
    companyName: spec.companyName,
    operatorName: spec.operatorName,
    email: spec.email,
    phone: spec.phone,
    password: 'operator123',
    businessLicense: spec.businessLicense,
    taxCode: spec.taxCode,
    logo: null,
    description: `${spec.operatorName} la nha xe seed dung de kiem thu tuyen, chuyen va nhan vien tren he thong Ve Xe Nhanh.`,
    website: `https://${spec.code.toLowerCase()}seed.vexenhanh.vn`,
    address: {
      street: spec.street,
      ward: spec.ward,
      district: spec.district,
      city: spec.city,
      country: 'Vietnam',
    },
    bankInfo: {
      bankName: 'Vietcombank',
      accountNumber: `1900${spec.phone.slice(-6)}`,
      accountHolder: spec.operatorName.toUpperCase(),
    },
    verificationStatus: 'approved',
    verifiedAt: new Date(2026, 0, 15),
    averageRating: spec.rating,
    totalReviews: 80 + SEED_OPERATORS.findIndex((operator) => operator.code === spec.code) * 9,
    commissionRate: 5,
    isActive: true,
    isSuspended: false,
    suspensionReason: null,
    suspendedAt: null,
  };
}

async function upsertOperator(spec) {
  const existing = await BusOperator.findOne({
    $or: [{ email: spec.email }, { businessLicense: spec.businessLicense }],
  }).select('+password');
  const payload = buildOperatorPayload(spec);

  if (existing) {
    const updates = { ...payload };
    delete updates.password;
    Object.assign(existing, updates);
    await existing.save();
    return { doc: existing, created: false };
  }

  const operator = new BusOperator(payload);
  await operator.save();
  return { doc: operator, created: true };
}

async function seedBusOperators() {
  await connectDB();

  let created = 0;
  let updated = 0;

  logger.info(`Seeding ${SEED_OPERATORS.length} approved bus operators...`);

  for (let i = 0; i < SEED_OPERATORS.length; i += 1) {
    const spec = SEED_OPERATORS[i];
    const result = await upsertOperator(spec);
    if (result.created) created += 1;
    else updated += 1;
  }

  logger.success(`Seed bus operators completed: +${created} created, ${updated} updated.`);
  logger.info('Default seed operator password: operator123');
}

seedBusOperators()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed bus operators failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
