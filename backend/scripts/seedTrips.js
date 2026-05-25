/* eslint-disable no-await-in-loop, security/detect-object-injection */
/**
 * Seed scheduled trips from 2026-05-22 through 2026-06-30.
 *
 * Uses routes, buses, drivers, and trip managers that belong to the same
 * seed bus operator. Idempotent: upserts by recurringGroupId.
 *
 * Usage:
 *   node scripts/seedTrips.js
 *   node scripts/seedTrips.js --trips=15 --year=2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

const BusOperator = require('../src/models/BusOperator');
const Bus = require('../src/models/Bus');
const Employee = require('../src/models/Employee');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');

const DEFAULT_TRIP_COUNT = 15;
const DEFAULT_YEAR = 2026;
const MAX_TRIP_COUNT = 60;
const TRIP_SEED_PREFIX = 'VXN-SEED-TRIP';

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

const DEPARTURE_SLOTS = [
  { hour: 23, minute: 30 },
  { hour: 6, minute: 0 },
  { hour: 7, minute: 15 },
  { hour: 8, minute: 30 },
  { hour: 10, minute: 0 },
  { hour: 13, minute: 15 },
  { hour: 15, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 15 },
];

function getArgNumber(name, fallback, max) {
  const raw = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!raw) return fallback;

  const value = Number(raw.split('=')[1]);
  if (!Number.isFinite(value) || value <= 0) return fallback;

  return Math.min(Math.round(value), max);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function buildTripDates(count, year) {
  const dates = [];
  const maxOffset = 39; // 2026-05-22 to 2026-06-30 inclusive.

  for (let i = 0; i < count; i += 1) {
    const offset = count === 1 ? 0 : Math.round((i * maxOffset) / (count - 1));
    const slot = DEPARTURE_SLOTS[i % DEPARTURE_SLOTS.length];
    dates.push(new Date(year, 4, 22 + offset, slot.hour, slot.minute, 0, 0));
  }

  return dates;
}

function roundTo(value, step) {
  return Math.max(step, Math.round(value / step) * step);
}

function tripSeedCode(index) {
  return `${TRIP_SEED_PREFIX}-${String(index + 1).padStart(3, '0')}`;
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

async function loadOperatorResources(operator, seedInfo) {
  const routePrefix = `VXN-${seedInfo.code}-`;
  const busPrefix = `VXN-${seedInfo.code}-`;

  const [routes, buses, drivers, managers] = await Promise.all([
    Route.find({
      operatorId: operator._id,
      isActive: true,
    }).sort({ routeCode: 1 }),
    Bus.find({
      operatorId: operator._id,
      status: 'active',
    }).sort({ busNumber: 1 }),
    Employee.find({
      operatorId: operator._id,
      role: 'driver',
      status: 'active',
      licenseExpiry: { $gt: new Date() },
    }).sort({ employeeCode: 1 }),
    Employee.find({
      operatorId: operator._id,
      role: 'trip_manager',
      status: 'active',
    }).sort({ employeeCode: 1 }),
  ]);

  const seedRoutes = routes.filter((route) => route.routeCode?.startsWith(routePrefix));
  const seedBuses = buses.filter((bus) => bus.busNumber?.startsWith(busPrefix));

  if (!seedRoutes.length) {
    throw new Error(`Operator ${seedInfo.code} has no active seed routes. Run seed:routes first.`);
  }

  if (!seedBuses.length) {
    throw new Error(`Operator ${seedInfo.code} has no active seed buses. Run seed:buses first.`);
  }

  if (!drivers.length || !managers.length) {
    throw new Error(
      `Operator ${seedInfo.code} needs active drivers and trip managers. Run seed:employees first.`
    );
  }

  return { routes: seedRoutes, buses: seedBuses, drivers, managers };
}

async function upsertTrip(data) {
  const existing = await Trip.findOne({ recurringGroupId: data.recurringGroupId });

  if (existing) {
    const bookedSeats = existing.bookedSeats || [];
    Object.assign(existing, data);
    existing.bookedSeats = bookedSeats;
    existing.availableSeats = Math.max(0, data.totalSeats - bookedSeats.length);
    await existing.save();
    return { doc: existing, created: false };
  }

  const trip = new Trip(data);
  await trip.save();
  return { doc: trip, created: true };
}

async function seedTrips() {
  const tripCount = getArgNumber('trips', DEFAULT_TRIP_COUNT, MAX_TRIP_COUNT);
  const year = getArgNumber('year', DEFAULT_YEAR, 2100);

  await connectDB();

  const seedOperators = await findSeedOperators();
  const resourcesByOperator = new Map();
  const seedRoutes = [];

  for (let operatorIndex = 0; operatorIndex < seedOperators.length; operatorIndex += 1) {
    const { operator, seedInfo } = seedOperators[operatorIndex];
    const resources = await loadOperatorResources(operator, seedInfo);
    resourcesByOperator.set(operator._id.toString(), resources);

    resources.routes.forEach((route) => {
      seedRoutes.push(route);
    });
  }

  if (!seedRoutes.length) {
    throw new Error('No seed routes found. Run seed:routes before seed:trips.');
  }

  const tripDates = buildTripDates(tripCount, year);
  let created = 0;
  let updated = 0;

  logger.info(`Seeding ${tripCount} trips from 2026-05-22 through 2026-06-30...`);

  for (let tripIndex = 0; tripIndex < tripCount; tripIndex += 1) {
    const route = seedRoutes[tripIndex % seedRoutes.length];
    const resources = resourcesByOperator.get(route.operatorId.toString());
    const bus = resources.buses[tripIndex % resources.buses.length];
    const driver = resources.drivers[tripIndex % resources.drivers.length];
    const manager = resources.managers[tripIndex % resources.managers.length];
    const departureTime = tripDates[tripIndex];
    const basePrice = roundTo((route.basePrice || 120000) + (tripIndex % 4) * 10000, 10000);

    const result = await upsertTrip({
      routeId: route._id,
      busId: bus._id,
      operatorId: route.operatorId,
      driverId: driver._id,
      tripManagerId: manager._id,
      departureTime,
      arrivalTime: addMinutes(departureTime, route.estimatedDuration || 240),
      basePrice,
      discount: tripIndex % 5 === 0 ? 5 : 0,
      finalPrice: basePrice,
      totalSeats: bus.seatLayout.totalSeats,
      availableSeats: bus.seatLayout.totalSeats,
      bookedSeats: [],
      status: 'scheduled',
      isRecurring: false,
      recurringGroupId: tripSeedCode(tripIndex),
      notes: 'Seed trip generated for the 2026-05-22 to 2026-06-30 operating window.',
      journey: {
        currentStopIndex: -1,
        currentStatus: 'preparing',
        stoppedAt: [],
        statusHistory: [],
      },
    });

    if (result.created) created += 1;
    else updated += 1;
  }

  logger.success(`Seed trips completed: +${created} created, ${updated} updated.`);
}

seedTrips()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed trips failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
