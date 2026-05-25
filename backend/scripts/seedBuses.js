/* eslint-disable no-await-in-loop, security/detect-object-injection */
/**
 * Seed buses for bus operators created by seedBusOperators.js.
 *
 * Idempotent: upserts by busNumber and does not clear other data.
 * Usage:
 *   node scripts/seedBuses.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

const BusOperator = require('../src/models/BusOperator');
const Bus = require('../src/models/Bus');

const SEED_OPERATORS = [
  { code: 'SVE', email: 'seed.operator.sve@vexenhanh.vn' },
  { code: 'NPL', email: 'seed.operator.npl@vexenhanh.vn' },
  { code: 'MPX', email: 'seed.operator.mpx@vexenhanh.vn' },
  { code: 'BDL', email: 'seed.operator.bdl@vexenhanh.vn' },
  { code: 'HVL', email: 'seed.operator.hvl@vexenhanh.vn' },
  { code: 'THB', email: 'seed.operator.thb@vexenhanh.vn' },
  { code: 'DNX', email: 'seed.operator.dnx@vexenhanh.vn' },
  { code: 'MTA', email: 'seed.operator.mta@vexenhanh.vn' },
];

function oneFloorLayout(rows) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const layout = [];

  for (let row = 0; row < rows; row += 1) {
    const label = letters[row];
    layout.push([`${label}1`, `${label}2`, 'AISLE', `${label}3`, `${label}4`]);
  }

  return {
    floors: 1,
    rows,
    columns: 5,
    layout,
    totalSeats: rows * 4,
  };
}

function buildBusSpecs(operator, seedInfo) {
  const { code } = seedInfo;

  return [
    {
      operatorId: operator._id,
      busNumber: `VXN-${code}-01`,
      busType: 'limousine',
      status: 'active',
      amenities: ['wifi', 'ac', 'water', 'charging', 'entertainment'],
      seatLayout: oneFloorLayout(9),
    },
    {
      operatorId: operator._id,
      busNumber: `VXN-${code}-02`,
      busType: 'sleeper',
      status: 'active',
      amenities: ['wifi', 'ac', 'water', 'blanket', 'pillow'],
      seatLayout: oneFloorLayout(10),
    },
  ];
}

async function upsertBus(data) {
  const existing = await Bus.findOne({ busNumber: data.busNumber });

  if (existing) {
    Object.assign(existing, data);
    await existing.save();
    return { doc: existing, created: false };
  }

  const bus = new Bus(data);
  await bus.save();
  return { doc: bus, created: true };
}

async function findSeedOperators() {
  const emails = SEED_OPERATORS.map((operator) => operator.email);
  const operators = await BusOperator.find({
    email: { $in: emails },
    verificationStatus: 'approved',
    isActive: true,
    isSuspended: false,
  });
  const operatorsByEmail = new Map(operators.map((operator) => [operator.email, operator]));

  const missing = SEED_OPERATORS.filter((operator) => !operatorsByEmail.has(operator.email));
  if (missing.length) {
    throw new Error(
      `Missing approved seed operators: ${missing.map((operator) => operator.code).join(', ')}. Run seed:operators first.`
    );
  }

  return SEED_OPERATORS.map((seedInfo) => ({
    seedInfo,
    operator: operatorsByEmail.get(seedInfo.email),
  }));
}

async function seedBuses() {
  await connectDB();

  const seedOperators = await findSeedOperators();
  let created = 0;
  let updated = 0;

  logger.info(`Seeding buses for ${seedOperators.length} seed operators...`);

  for (let operatorIndex = 0; operatorIndex < seedOperators.length; operatorIndex += 1) {
    const { operator, seedInfo } = seedOperators[operatorIndex];
    const busSpecs = buildBusSpecs(operator, seedInfo);

    for (let busIndex = 0; busIndex < busSpecs.length; busIndex += 1) {
      const result = await upsertBus(busSpecs[busIndex]);
      if (result.created) created += 1;
      else updated += 1;
    }
  }

  logger.success(`Seed buses completed: +${created} created, ${updated} updated.`);
}

seedBuses()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed buses failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
