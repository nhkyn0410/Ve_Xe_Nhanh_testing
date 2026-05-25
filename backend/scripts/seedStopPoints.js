/**
 * Seed ~200 stop points for operator stop catalog.
 *
 * Idempotent: upserts by { operatorId, stopCode } and does not clear other data.
 * Usage:
 *   node backend/scripts/seedStopPoints.js
 *   node backend/scripts/seedStopPoints.js --count=200
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

const BusOperator = require('../src/models/BusOperator');
const StopPoint = require('../src/models/StopPoint');

const DEFAULT_COUNT = 200;
const SEED_OPERATOR_EMAILS = [
  'seed.operator.sve@vexenhanh.vn',
  'seed.operator.npl@vexenhanh.vn',
  'seed.operator.mpx@vexenhanh.vn',
  'seed.operator.bdl@vexenhanh.vn',
  'seed.operator.hvl@vexenhanh.vn',
  'seed.operator.thb@vexenhanh.vn',
  'seed.operator.dnx@vexenhanh.vn',
  'seed.operator.mta@vexenhanh.vn',
];

const TYPE_CYCLE = [
  'bus_station',
  'rest_stop',
  'roadside',
  'office',
  'bus_station',
  'rest_stop',
  'bus_station',
  'other',
];

const TYPE_LABEL = {
  bus_station: 'Bến xe',
  rest_stop: 'Trạm dừng chân',
  roadside: 'Điểm đón/trả',
  office: 'Văn phòng',
  other: 'Điểm dừng',
};

const LOCATIONS = [
  { city: 'Quận 1', province: 'TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009 },
  { city: 'Thủ Đức', province: 'TP. Hồ Chí Minh', lat: 10.8494, lng: 106.7537 },
  { city: 'Bình Thạnh', province: 'TP. Hồ Chí Minh', lat: 10.8057, lng: 106.7075 },
  { city: 'Quận 5', province: 'TP. Hồ Chí Minh', lat: 10.754, lng: 106.6635 },
  { city: 'Ba Đình', province: 'Hà Nội', lat: 21.034, lng: 105.814 },
  { city: 'Hoàn Kiếm', province: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { city: 'Cầu Giấy', province: 'Hà Nội', lat: 21.0362, lng: 105.7906 },
  { city: 'Long Biên', province: 'Hà Nội', lat: 21.0458, lng: 105.8786 },
  { city: 'Hải Châu', province: 'Đà Nẵng', lat: 16.0678, lng: 108.2208 },
  { city: 'Liên Chiểu', province: 'Đà Nẵng', lat: 16.0718, lng: 108.1498 },
  { city: 'Ninh Kiều', province: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
  { city: 'Cái Răng', province: 'Cần Thơ', lat: 10.0027, lng: 105.751 },
  { city: 'TP. Đà Lạt', province: 'Lâm Đồng', lat: 11.9404, lng: 108.4583 },
  { city: 'Bảo Lộc', province: 'Lâm Đồng', lat: 11.5475, lng: 107.8077 },
  { city: 'TP. Nha Trang', province: 'Khánh Hòa', lat: 12.2388, lng: 109.1967 },
  { city: 'Cam Ranh', province: 'Khánh Hòa', lat: 11.9214, lng: 109.1591 },
  { city: 'TP. Huế', province: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909 },
  { city: 'Đông Hà', province: 'Quảng Trị', lat: 16.8163, lng: 107.1003 },
  { city: 'TP. Vinh', province: 'Nghệ An', lat: 18.6796, lng: 105.6813 },
  { city: 'TP. Thanh Hóa', province: 'Thanh Hóa', lat: 19.8067, lng: 105.7852 },
  { city: 'TP. Hải Phòng', province: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
  { city: 'TP. Hạ Long', province: 'Quảng Ninh', lat: 20.9712, lng: 107.0448 },
  { city: 'TP. Lào Cai', province: 'Lào Cai', lat: 22.4856, lng: 103.9707 },
  { city: 'Sa Pa', province: 'Lào Cai', lat: 22.3352, lng: 103.8438 },
  { city: 'TP. Quy Nhơn', province: 'Bình Định', lat: 13.782, lng: 109.219 },
  { city: 'Tuy Hòa', province: 'Phú Yên', lat: 13.0955, lng: 109.3209 },
  { city: 'TP. Phan Thiết', province: 'Bình Thuận', lat: 10.9333, lng: 108.1 },
  { city: 'TP. Vũng Tàu', province: 'Bà Rịa - Vũng Tàu', lat: 10.4114, lng: 107.1362 },
  { city: 'TP. Rạch Giá', province: 'Kiên Giang', lat: 10.0125, lng: 105.0809 },
  { city: 'TP. Cà Mau', province: 'Cà Mau', lat: 9.1768, lng: 105.1524 },
];

const ROAD_NAMES = [
  'Quốc lộ 1A',
  'Quốc lộ 13',
  'Quốc lộ 20',
  'Quốc lộ 51',
  'Đường Võ Nguyên Giáp',
  'Đường Nguyễn Văn Linh',
  'Đường Trần Phú',
  'Đường Lê Lợi',
  'Đường Nguyễn Trãi',
  'Đường Hùng Vương',
  'Đường Điện Biên Phủ',
  'Đường Phạm Văn Đồng',
];

const STOP_NAMES = {
  bus_station: [
    'Trung tâm',
    'Phía Bắc',
    'Phía Nam',
    'Liên tỉnh',
    'Mới',
    'Cửa ngõ',
    'Khu Đông',
    'Khu Tây',
  ],
  rest_stop: [
    'Minh Phát',
    'Sao Mai',
    'An Bình',
    'Hoàng Gia',
    'Đại Lộc',
    'Thiên Phú',
    'Tân Thành',
    'Hải Đăng',
  ],
  roadside: [
    'Ngã tư',
    'Cầu vượt',
    'Chợ trung tâm',
    'Cổng khu công nghiệp',
    'Bệnh viện tỉnh',
    'Trường đại học',
    'Siêu thị',
    'Cây xăng',
  ],
  office: [
    'Chi nhánh trung tâm',
    'Phòng vé chính',
    'Văn phòng giao dịch',
    'Điểm bán vé',
    'Chi nhánh phía Đông',
    'Chi nhánh phía Tây',
  ],
  other: [
    'Điểm trung chuyển',
    'Bãi xe hợp đồng',
    'Khu đón khách',
    'Điểm hẹn',
    'Trạm kỹ thuật',
    'Khu chờ khách',
  ],
};

function getCountArg() {
  const raw = process.argv.find((arg) => arg.startsWith('--count='));
  if (!raw) return DEFAULT_COUNT;

  const value = Number(raw.split('=')[1]);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_COUNT;

  return Math.min(Math.round(value), 1000);
}

function jitter(base, index, scale = 0.018) {
  const offset = ((index % 9) - 4) * scale;
  return Number((base + offset).toFixed(6));
}

function buildStop(operatorId, index) {
  const type = TYPE_CYCLE[index % TYPE_CYCLE.length];
  const location = LOCATIONS[index % LOCATIONS.length];
  const namePool = STOP_NAMES[type];
  const nameSuffix = namePool[index % namePool.length];
  const road = ROAD_NAMES[index % ROAD_NAMES.length];
  const number = 10 + ((index * 17) % 260);

  const name =
    type === 'bus_station'
      ? `${TYPE_LABEL[type]} ${nameSuffix} ${location.province}`
      : `${TYPE_LABEL[type]} ${nameSuffix} ${location.city}`;

  return {
    operatorId,
    stopCode: `SP-${String(index + 1).padStart(4, '0')}`,
    name,
    type,
    address: `${number} ${road}, ${location.city}, ${location.province}`,
    city: location.city,
    province: location.province,
    coordinates: {
      lat: jitter(location.lat, index),
      lng: jitter(location.lng, index, 0.021),
    },
    status: index % 23 === 0 ? 'inactive' : 'active',
    notes: `Seed điểm dừng ${index + 1} dùng cho cấu hình tuyến và điểm lên/xuống xe.`,
  };
}

async function findTargetOperators() {
  const baseFilter = {
    verificationStatus: 'approved',
    isActive: true,
    isSuspended: false,
  };
  const seedOrder = new Map(SEED_OPERATOR_EMAILS.map((email, index) => [email, index]));
  const seedOperators = await BusOperator.find({
    ...baseFilter,
    email: { $in: SEED_OPERATOR_EMAILS },
  });

  seedOperators.sort(
    (left, right) =>
      (seedOrder.get(left.email) ?? Number.MAX_SAFE_INTEGER) -
      (seedOrder.get(right.email) ?? Number.MAX_SAFE_INTEGER)
  );

  const remainingLimit = Math.max(0, 30 - seedOperators.length);
  const otherOperators =
    remainingLimit > 0
      ? await BusOperator.find({
          ...baseFilter,
          _id: { $nin: seedOperators.map((operator) => operator._id) },
        })
          .sort({ createdAt: 1 })
          .limit(remainingLimit)
      : [];

  return [...seedOperators, ...otherOperators];
}

async function seedStopPoints() {
  const targetCount = getCountArg();
  await connectDB();

  const operators = await findTargetOperators();

  if (!operators.length) {
    throw new Error('Không có nhà xe approved. Hãy chạy seed chính trước khi seed stop_points.');
  }

  logger.info(`Đang seed ${targetCount} điểm dừng cho ${operators.length} nhà xe...`);

  const ops = [];
  for (let i = 0; i < targetCount; i += 1) {
    const operator = operators[i % operators.length];
    const doc = buildStop(operator._id, i);

    ops.push({
      updateOne: {
        filter: { operatorId: operator._id, stopCode: doc.stopCode },
        update: { $set: doc },
        upsert: true,
      },
    });
  }

  const result = await StopPoint.bulkWrite(ops, { ordered: false });
  const total = await StopPoint.countDocuments({
    operatorId: { $in: operators.map((operator) => operator._id) },
  });

  logger.success(
    `Seed stop_points xong: upserted=${result.upsertedCount || 0}, modified=${
      result.modifiedCount || 0
    }, totalForSeedOperators=${total}`
  );
}

seedStopPoints()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed stop_points thất bại:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
