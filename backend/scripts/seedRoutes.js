/* eslint-disable no-await-in-loop, security/detect-object-injection */
/**
 * Seed routes for bus operators created by seedBusOperators.js.
 *
 * Route pickup, dropoff, and middle stops are built from StopPoint records.
 * Run seedBusOperators.js, then seedStopPoints.js, before this script.
 *
 * Idempotent: upserts by routeCode and does not clear other data.
 * Usage:
 *   node scripts/seedRoutes.js
 *   node scripts/seedRoutes.js --per-operator=2
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const logger = require('../src/utils/logger');

const BusOperator = require('../src/models/BusOperator');
const Route = require('../src/models/Route');
const StopPoint = require('../src/models/StopPoint');

const DEFAULT_ROUTES_PER_OPERATOR = 2;
const MAX_ROUTES_PER_OPERATOR = 5;
const MIN_ACTIVE_STOPS_PER_OPERATOR = 5;

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

function getArgNumber(name, fallback, max) {
  const raw = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!raw) return fallback;

  const value = Number(raw.split('=')[1]);
  if (!Number.isFinite(value) || value <= 0) return fallback;

  return Math.min(Math.round(value), max);
}

function roundTo(value, step) {
  return Math.max(step, Math.round(value / step) * step);
}

function haversineKm(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return 220;

  const radius = 6371;
  const toRad = (degree) => (degree * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return Math.round(radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
}

function locationFromStop(stop) {
  return {
    city: stop.city || stop.province || stop.name,
    province: stop.province || stop.city || stop.name,
    station: stop.name,
    address: stop.address,
    coordinates: stop.coordinates,
  };
}

function pointFromStop(stop) {
  return {
    stopId: stop._id,
    name: stop.name,
    address: stop.address,
    coordinates: stop.coordinates,
  };
}

function uniqueStops(stops) {
  const seen = new Set();
  const out = [];

  stops.forEach((stop) => {
    if (stop?._id) {
      const key = stop._id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(stop);
      }
    }
  });

  return out;
}

function notSameStop(left, right) {
  return left && right && !left._id.equals(right._id);
}

function pickRouteStops(stops, operatorIndex, routeIndex) {
  const total = stops.length;
  const originIndex = (operatorIndex * 3 + routeIndex * 5) % total;
  let destinationIndex = (originIndex + Math.floor(total / 2) + routeIndex + 2) % total;

  if (destinationIndex === originIndex) {
    destinationIndex = (destinationIndex + 1) % total;
  }

  const origin = stops[originIndex];
  const destination = stops[destinationIndex];

  const pickupPoints = uniqueStops([
    origin,
    stops[(originIndex + 1) % total],
    stops[(originIndex + 2) % total],
  ])
    .filter((stop) => notSameStop(stop, destination))
    .slice(0, 3);

  const dropoffPoints = uniqueStops([
    destination,
    stops[(destinationIndex + 1) % total],
    stops[(destinationIndex + 2) % total],
  ])
    .filter((stop) => notSameStop(stop, origin))
    .slice(0, 3);

  const middleCandidates = [];
  for (let i = 1; i <= 10; i += 1) {
    middleCandidates.push(stops[(originIndex + i * 2 + routeIndex) % total]);
  }

  const blockedIds = new Set(
    [origin, destination, ...pickupPoints, ...dropoffPoints].map((stop) => stop._id.toString())
  );
  const middleStops = uniqueStops(middleCandidates)
    .filter((stop) => !blockedIds.has(stop._id.toString()))
    .slice(0, 3);

  return { origin, destination, pickupPoints, dropoffPoints, middleStops };
}

function buildRoutePayload(operator, seedInfo, stops, operatorIndex, routeIndex) {
  const { origin, destination, pickupPoints, dropoffPoints, middleStops } = pickRouteStops(
    stops,
    operatorIndex,
    routeIndex
  );
  const distance = Math.max(35, haversineKm(origin.coordinates, destination.coordinates));
  const estimatedDuration = Math.min(
    2820,
    Math.max(75, Math.round((distance / 55) * 60) + middleStops.length * 20)
  );
  const basePrice = roundTo(Math.max(80000, distance * 900), 10000);
  const routeNumber = String(routeIndex + 1).padStart(2, '0');

  return {
    operatorId: operator._id,
    routeCode: `VXN-${seedInfo.code}-${routeNumber}`,
    routeName: `${origin.city || origin.name} - ${destination.city || destination.name}`,
    origin: locationFromStop(origin),
    destination: locationFromStop(destination),
    pickupPoints: pickupPoints.map(pointFromStop),
    dropoffPoints: dropoffPoints.map(pointFromStop),
    stops: middleStops.map((stop, index) => ({
      ...pointFromStop(stop),
      order: index + 1,
      estimatedArrivalMinutes: Math.round(
        ((index + 1) * estimatedDuration) / (middleStops.length + 1)
      ),
      stopDuration: index % 2 === 0 ? 15 : 20,
    })),
    distance,
    estimatedDuration,
    basePrice,
    isActive: true,
  };
}

async function upsertRoute(data) {
  const existing = await Route.findOne({ routeCode: data.routeCode });

  if (existing) {
    Object.assign(existing, data);
    await existing.save();
    return { doc: existing, created: false };
  }

  const route = new Route(data);
  await route.save();
  return { doc: route, created: true };
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

async function getActiveStops(operatorId) {
  return StopPoint.find({
    operatorId,
    status: 'active',
  }).sort({ province: 1, city: 1, stopCode: 1 });
}

async function seedRoutes() {
  const routesPerOperator = getArgNumber(
    'per-operator',
    DEFAULT_ROUTES_PER_OPERATOR,
    MAX_ROUTES_PER_OPERATOR
  );

  await connectDB();

  const seedOperators = await findSeedOperators();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  logger.info(`Seeding ${routesPerOperator} route(s) per seed operator from stop_points...`);

  for (let operatorIndex = 0; operatorIndex < seedOperators.length; operatorIndex += 1) {
    const { operator, seedInfo } = seedOperators[operatorIndex];
    const stops = await getActiveStops(operator._id);

    if (stops.length < MIN_ACTIVE_STOPS_PER_OPERATOR) {
      skipped += 1;
      logger.warn(
        `Skip ${seedInfo.code}: needs at least ${MIN_ACTIVE_STOPS_PER_OPERATOR} active stop_points, found ${stops.length}.`
      );
    } else {
      for (let routeIndex = 0; routeIndex < routesPerOperator; routeIndex += 1) {
        const payload = buildRoutePayload(operator, seedInfo, stops, operatorIndex, routeIndex);
        const result = await upsertRoute(payload);
        if (result.created) created += 1;
        else updated += 1;
      }
    }
  }

  if (created + updated === 0) {
    throw new Error(
      'No routes were seeded. Run seed:operators, then seed:stops, then seed:routes.'
    );
  }

  logger.success(
    `Seed routes completed: +${created} created, ${updated} updated, ${skipped} operator(s) skipped.`
  );
}

seedRoutes()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed routes failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  });
