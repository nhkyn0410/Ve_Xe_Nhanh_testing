/* eslint-disable no-await-in-loop, security/detect-object-injection */
/**
 * Seed employees for bus operators created by seedBusOperators.js.
 *
 * Idempotent: upserts by { operatorId, employeeCode } and keeps existing
 * passwords on update.
 * Usage:
 *   node scripts/seedEmployees.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

const BusOperator = require('../src/models/BusOperator');
const Employee = require('../src/models/Employee');

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

const DRIVER_NAMES = [
  ['Tran Minh Khang', 'Nguyen Quoc Bao'],
  ['Pham Duc Anh', 'Le Van Thanh'],
  ['Vo Minh Tri', 'Dang Huu Phuc'],
  ['Huynh Gia Huy', 'Do Thanh Son'],
  ['Bui Quang Hieu', 'Nguyen Tan Dat'],
  ['Tran Van Phu', 'Le Minh Nhat'],
  ['Phan Hoang Nam', 'Mai Duc Thinh'],
  ['Nguyen Huu Loc', 'Truong Anh Tuan'],
];

const MANAGER_NAMES = [
  ['Le Thi Thu Ha', 'Nguyen Ngoc Mai'],
  ['Tran Phuong Linh', 'Pham Khanh Vy'],
  ['Hoang My Duyen', 'Dang Thanh Nhan'],
  ['Vo Hoai An', 'Nguyen Bao Chau'],
  ['Bui Minh Thu', 'Le Quoc Khanh'],
  ['Pham Gia Han', 'Tran Minh Quan'],
  ['Nguyen Thanh Truc', 'Do Anh Khoa'],
  ['Mai Phuong Anh', 'Huynh Bao Ngoc'],
];

function dateOfBirth(operatorIndex, employeeIndex) {
  return new Date(
    1983 + ((operatorIndex + employeeIndex) % 12),
    operatorIndex % 12,
    10 + employeeIndex
  );
}

function phoneFor(operatorIndex, employeeIndex) {
  return `096${operatorIndex + 1}${String(employeeIndex + 1).padStart(6, '0')}`;
}

function buildEmployeeSpecs(operator, seedInfo, operatorIndex) {
  const driverNames = DRIVER_NAMES[operatorIndex % DRIVER_NAMES.length];
  const managerNames = MANAGER_NAMES[operatorIndex % MANAGER_NAMES.length];
  const { code } = seedInfo;

  return [
    {
      operatorId: operator._id,
      employeeCode: `SEED-${code}-DRV-01`,
      fullName: driverNames[0],
      phone: phoneFor(operatorIndex, 0),
      email: `seed.${code.toLowerCase()}.driver01@vexenhanh.vn`,
      idCard: `079${String(operatorIndex + 1).padStart(3, '0')}000001`,
      address: `${operator.operatorName || operator.companyName}, ${operator.address?.city || 'Vietnam'}`,
      dateOfBirth: dateOfBirth(operatorIndex, 0),
      password: 'driver123',
      role: 'driver',
      licenseNumber: `GPLX-${code}-0001`,
      licenseClass: 'E',
      licenseExpiry: new Date(2031, 11, 31),
      status: 'active',
      hireDate: new Date(2024, operatorIndex % 12, 5),
    },
    {
      operatorId: operator._id,
      employeeCode: `SEED-${code}-DRV-02`,
      fullName: driverNames[1],
      phone: phoneFor(operatorIndex, 1),
      email: `seed.${code.toLowerCase()}.driver02@vexenhanh.vn`,
      idCard: `079${String(operatorIndex + 1).padStart(3, '0')}000002`,
      address: `${operator.operatorName || operator.companyName}, ${operator.address?.city || 'Vietnam'}`,
      dateOfBirth: dateOfBirth(operatorIndex, 1),
      password: 'driver123',
      role: 'driver',
      licenseNumber: `GPLX-${code}-0002`,
      licenseClass: operatorIndex % 2 === 0 ? 'E' : 'D',
      licenseExpiry: new Date(2031, 11, 31),
      status: 'active',
      hireDate: new Date(2024, operatorIndex % 12, 12),
    },
    {
      operatorId: operator._id,
      employeeCode: `SEED-${code}-TM-01`,
      fullName: managerNames[0],
      phone: phoneFor(operatorIndex, 2),
      email: `seed.${code.toLowerCase()}.manager01@vexenhanh.vn`,
      idCard: `079${String(operatorIndex + 1).padStart(3, '0')}000003`,
      address: `${operator.operatorName || operator.companyName}, ${operator.address?.city || 'Vietnam'}`,
      dateOfBirth: dateOfBirth(operatorIndex, 2),
      password: 'manager123',
      role: 'trip_manager',
      status: 'active',
      hireDate: new Date(2024, operatorIndex % 12, 18),
    },
    {
      operatorId: operator._id,
      employeeCode: `SEED-${code}-TM-02`,
      fullName: managerNames[1],
      phone: phoneFor(operatorIndex, 3),
      email: `seed.${code.toLowerCase()}.manager02@vexenhanh.vn`,
      idCard: `079${String(operatorIndex + 1).padStart(3, '0')}000004`,
      address: `${operator.operatorName || operator.companyName}, ${operator.address?.city || 'Vietnam'}`,
      dateOfBirth: dateOfBirth(operatorIndex, 3),
      password: 'manager123',
      role: 'trip_manager',
      status: 'active',
      hireDate: new Date(2024, operatorIndex % 12, 24),
    },
  ];
}

async function upsertEmployee(data) {
  const existing = await Employee.findOne({
    operatorId: data.operatorId,
    employeeCode: data.employeeCode,
  }).select('+password');

  if (existing) {
    const updates = { ...data };
    delete updates.password;
    Object.assign(existing, updates);
    await existing.save();
    return { doc: existing, created: false };
  }

  const employee = new Employee(data);
  await employee.save();
  return { doc: employee, created: true };
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

async function seedEmployees() {
  await connectDB();

  const seedOperators = await findSeedOperators();
  let created = 0;
  let updated = 0;

  logger.info(`Seeding employees for ${seedOperators.length} seed operators...`);

  for (let operatorIndex = 0; operatorIndex < seedOperators.length; operatorIndex += 1) {
    const { operator, seedInfo } = seedOperators[operatorIndex];
    const employeeSpecs = buildEmployeeSpecs(operator, seedInfo, operatorIndex);

    for (let specIndex = 0; specIndex < employeeSpecs.length; specIndex += 1) {
      const spec = employeeSpecs[specIndex];
      const result = await upsertEmployee(spec);
      if (result.created) created += 1;
      else updated += 1;
    }
  }

  logger.success(`Seed employees completed: +${created} created, ${updated} updated.`);
  logger.info('Default seed employee passwords: driver123 / manager123');
}

seedEmployees()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed employees failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
