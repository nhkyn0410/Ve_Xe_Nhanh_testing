const mongoose = require('mongoose');
const StopPoint = require('../models/StopPoint');
const BusOperator = require('../models/BusOperator');
const Route = require('../models/Route');
const Trip = require('../models/Trip');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalize = (value = '') => String(value).trim().toLowerCase();

class StopPointService {
  static async ensureOperatorCanWrite(operatorId) {
    const operator = await BusOperator.findById(operatorId);
    if (!operator) {
      throw new Error('Nhà xe không tồn tại');
    }
    if (operator.verificationStatus !== 'approved') {
      throw new Error('Nhà xe chưa được duyệt. Vui lòng chờ admin phê duyệt.');
    }
    if (operator.isSuspended) {
      throw new Error('Nhà xe đang bị tạm ngưng');
    }
    return operator;
  }

  static cleanPayload(data = {}) {
    const payload = {
      name: data.name,
      type: data.type || 'bus_station',
      address: data.address,
      city: data.city,
      province: data.province,
      status: data.status || 'active',
      notes: data.notes,
    };

    const lat = data.coordinates?.lat ?? data.lat;
    const lng = data.coordinates?.lng ?? data.lng;
    if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
      payload.coordinates = { lat: Number(lat), lng: Number(lng) };
    } else {
      payload.coordinates = undefined;
    }

    if (data.stopCode) payload.stopCode = data.stopCode;

    return payload;
  }

  static async ensureNoDuplicate(operatorId, payload, excludedId = null) {
    const query = {
      operatorId,
      name: new RegExp(`^${escapeRegex(normalize(payload.name))}$`, 'i'),
      address: new RegExp(`^${escapeRegex(normalize(payload.address || ''))}$`, 'i'),
      city: new RegExp(`^${escapeRegex(normalize(payload.city || ''))}$`, 'i'),
    };

    if (excludedId) {
      query._id = { $ne: excludedId };
    }

    const existing = await StopPoint.findOne(query);
    if (existing) {
      throw new Error('Điểm dừng đã tồn tại trong danh mục của nhà xe');
    }
  }

  static async getTripMap(routeIds) {
    const tripMap = new Map();
    if (!routeIds.length) return tripMap;

    const tripAgg = await Trip.aggregate([
      { $match: { routeId: { $in: routeIds }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            routeId: '$routeId',
            day: { $dateToString: { format: '%Y-%m-%d', date: '$departureTime' } },
          },
          dayCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.routeId',
          totalTrips: { $sum: '$dayCount' },
          distinctDays: { $sum: 1 },
        },
      },
    ]);

    tripAgg.forEach((t) => {
      tripMap.set(String(t._id), Math.round(t.totalTrips / Math.max(t.distinctDays, 1)));
    });

    return tripMap;
  }

  static pointMatchesStop(point, stop) {
    if (!point) return false;
    if (point.stopId && String(point.stopId) === String(stop._id)) return true;
    return (
      normalize(point.name) === normalize(stop.name) &&
      normalize(point.address || '') === normalize(stop.address || '')
    );
  }

  static async getUsageMap(operatorId, stops) {
    const routes = await Route.find({ operatorId }).select(
      'routeCode routeName pickupPoints dropoffPoints stops isActive'
    );
    const tripMap = await this.getTripMap(routes.map((route) => route._id));
    const usageMap = new Map(stops.map((stop) => [String(stop._id), { routeRefs: [], dailyTrips: 0 }]));

    stops.forEach((stop) => {
      const usage = usageMap.get(String(stop._id));

      routes.forEach((route) => {
        const roles = [];
        if ((route.pickupPoints || []).some((point) => this.pointMatchesStop(point, stop))) {
          roles.push('pickup');
        }
        if ((route.dropoffPoints || []).some((point) => this.pointMatchesStop(point, stop))) {
          roles.push('dropoff');
        }
        if ((route.stops || []).some((point) => this.pointMatchesStop(point, stop))) {
          roles.push('journey_stop');
        }

        if (!roles.length) return;

        usage.routeRefs.push({
          routeId: route._id,
          routeCode: route.routeCode,
          routeName: route.routeName,
          roles,
          isActive: route.isActive,
        });
        usage.dailyTrips += tripMap.get(String(route._id)) || 0;
      });
    });

    return usageMap;
  }

  static async getByOperator(operatorId, filters = {}, options = {}) {
    const { type, status, search } = filters;
    const { page = 1, limit = 200, sortBy = 'name', sortOrder = 'asc' } = options;

    const query = { operatorId };
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { stopCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { province: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 200, 1), 500);
    const skip = (pageNumber - 1) * limitNumber;

    const stops = await StopPoint.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNumber);
    const total = await StopPoint.countDocuments(query);
    const usageMap = await this.getUsageMap(operatorId, stops);

    return {
      stops: stops.map((stop) => {
        const obj = stop.toObject();
        const usage = usageMap.get(String(stop._id)) || { routeRefs: [], dailyTrips: 0 };
        obj.code = obj.stopCode;
        obj.routes = usage.routeRefs.length;
        obj.routeRefs = usage.routeRefs;
        obj.dailyTrips = usage.dailyTrips;
        return obj;
      }),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    };
  }

  static async create(operatorId, data) {
    await this.ensureOperatorCanWrite(operatorId);
    const payload = this.cleanPayload(data);
    await this.ensureNoDuplicate(operatorId, payload);

    return StopPoint.create({
      ...payload,
      operatorId,
    });
  }

  static async getById(id, operatorId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Điểm dừng không hợp lệ');
    }

    const stop = await StopPoint.findOne({ _id: id, operatorId });
    if (!stop) {
      throw new Error('Điểm dừng không tồn tại');
    }
    return stop;
  }

  static async update(id, operatorId, data) {
    await this.ensureOperatorCanWrite(operatorId);
    const stop = await this.getById(id, operatorId);
    const payload = this.cleanPayload(data);
    await this.ensureNoDuplicate(operatorId, payload, stop._id);

    delete payload.operatorId;
    Object.assign(stop, payload);
    await stop.save();
    return stop;
  }

  static async delete(id, operatorId) {
    await this.ensureOperatorCanWrite(operatorId);
    const stop = await this.getById(id, operatorId);
    stop.status = 'inactive';
    await stop.save();
    return stop;
  }
}

module.exports = StopPointService;
