const Route = require('../models/Route');
const BusOperator = require('../models/BusOperator');
const Trip = require('../models/Trip');

/**
 * Route Service
 * Xử lý logic liên quan đến routes
 */
class RouteService {
  /**
   * Tạo tuyến đường mới
   * @param {String} operatorId - Operator ID
   * @param {Object} routeData - Route data
   * @returns {Object} Route
   */
  static async create(operatorId, routeData) {
    // Verify operator exists and is approved
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

    // Check if route code already exists
    const existingRoute = await Route.findByRouteCode(routeData.routeCode);
    if (existingRoute) {
      throw new Error('Mã tuyến đường đã tồn tại');
    }

    // Create route
    const route = await Route.create({
      ...routeData,
      operatorId,
    });

    return route;
  }

  /**
   * Lấy danh sách routes của operator
   * @param {String} operatorId - Operator ID
   * @param {Object} filters - Filters
   * @param {Object} options - Pagination options
   * @returns {Object} Routes và pagination info
   */
  static async getByOperator(operatorId, filters = {}, options = {}) {
    const { isActive, search } = filters;

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build query
    const query = { operatorId };

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    if (search) {
      query.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { routeCode: { $regex: search, $options: 'i' } },
        { 'origin.city': { $regex: search, $options: 'i' } },
        { 'destination.city': { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query
    const routes = await Route.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Route.countDocuments(query);

    // Enrich each route with derived operational metrics from real trips:
    //  - tripsPerDay: average number of (non-cancelled) trips scheduled per active day
    //  - priceFrom:   lowest ticket fare offered on the route
    const routeIds = routes.map((r) => r._id);
    let tripMap = new Map();

    if (routeIds.length > 0) {
      const tripAgg = await Trip.aggregate([
        { $match: { routeId: { $in: routeIds }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: {
              routeId: '$routeId',
              day: { $dateToString: { format: '%Y-%m-%d', date: '$departureTime' } },
            },
            dayCount: { $sum: 1 },
            minPrice: { $min: { $ifNull: ['$finalPrice', '$basePrice'] } },
          },
        },
        {
          $group: {
            _id: '$_id.routeId',
            totalTrips: { $sum: '$dayCount' },
            distinctDays: { $sum: 1 },
            minPrice: { $min: '$minPrice' },
          },
        },
      ]);

      tripMap = new Map(tripAgg.map((t) => [String(t._id), t]));
    }

    const enrichedRoutes = routes.map((route) => {
      const obj = typeof route.toObject === 'function' ? route.toObject() : route;
      const agg = tripMap.get(String(route._id));

      obj.tripsPerDay = agg ? Math.round(agg.totalTrips / Math.max(agg.distinctDays, 1)) : 0;
      obj.priceFrom = agg && agg.minPrice != null ? agg.minPrice : 0;

      return obj;
    });

    return {
      routes: enrichedRoutes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy danh sách điểm dừng tổng hợp của operator
   * Gom toàn bộ bến đầu/cuối, điểm đón, điểm trả và điểm dừng nghỉ từ mọi tuyến
   * thành một danh mục điểm dừng duy nhất kèm số tuyến & lượt/ngày thực tế.
   * @param {String} operatorId - Operator ID
   * @returns {Array} Stops
   */
  static async getStops(operatorId) {
    const routes = await Route.find({ operatorId });

    // Average non-cancelled trips/day per route (real data)
    const routeIds = routes.map((r) => r._id);
    const tripMap = new Map();

    if (routeIds.length > 0) {
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
    }

    const map = new Map();

    const addPoint = (point, route) => {
      const name = (point.name || '').trim();
      if (!name) return;

      const city = (point.city || '').trim();
      const key = `${point.type}|${name.toLowerCase()}|${city.toLowerCase()}`;

      let s = map.get(key);
      if (!s) {
        s = {
          type: point.type,
          name,
          address: point.address || '',
          city,
          routeIds: new Set(),
          dailyTrips: 0,
          anyActive: false,
        };
        map.set(key, s);
      }

      if (!s.address && point.address) s.address = point.address;
      s.routeIds.add(String(route._id));
      s.dailyTrips += tripMap.get(String(route._id)) || 0;
      if (route.isActive) s.anyActive = true;
    };

    routes.forEach((r) => {
      if (r.origin && r.origin.station) {
        addPoint(
          {
            type: 'bus_station',
            name: r.origin.station,
            address: r.origin.address,
            city: r.origin.city,
          },
          r
        );
      }
      if (r.destination && r.destination.station) {
        addPoint(
          {
            type: 'bus_station',
            name: r.destination.station,
            address: r.destination.address,
            city: r.destination.city,
          },
          r
        );
      }
      (r.pickupPoints || []).forEach((p) =>
        addPoint(
          { type: 'pickup', name: p.name, address: p.address, city: r.origin && r.origin.city },
          r
        )
      );
      (r.dropoffPoints || []).forEach((p) =>
        addPoint(
          {
            type: 'pickup',
            name: p.name,
            address: p.address,
            city: r.destination && r.destination.city,
          },
          r
        )
      );
      (r.stops || []).forEach((p) =>
        addPoint({ type: 'rest_stop', name: p.name, address: p.address, city: '' }, r)
      );
    });

    return [...map.values()]
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .map((s, i) => ({
        code: `ST-${String(i + 1).padStart(3, '0')}`,
        name: s.name,
        address: s.address,
        city: s.city,
        type: s.type,
        routes: s.routeIds.size,
        dailyTrips: s.dailyTrips,
        status: s.anyActive ? 'active' : 'inactive',
      }));
  }

  /**
   * Lấy thông tin route theo ID
   * @param {String} routeId - Route ID
   * @param {String} operatorId - Operator ID (for authorization)
   * @returns {Object} Route
   */
  static async getById(routeId, operatorId = null) {
    const route = await Route.findById(routeId).populate('operatorId', 'operatorName companyName email phone');

    if (!route) {
      throw new Error('Tuyến đường không tồn tại');
    }

    // If operatorId is provided, check ownership
    if (operatorId && route.operatorId._id.toString() !== operatorId.toString()) {
      throw new Error('Bạn không có quyền truy cập tuyến đường này');
    }

    return route;
  }

  /**
   * Cập nhật route
   * @param {String} routeId - Route ID
   * @param {String} operatorId - Operator ID (for authorization)
   * @param {Object} updateData - Update data
   * @returns {Object} Updated route
   */
  static async update(routeId, operatorId, updateData) {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Tuyến đường không tồn tại');
    }

    // Check ownership
    if (route.operatorId.toString() !== operatorId.toString()) {
      throw new Error('Bạn không có quyền cập nhật tuyến đường này');
    }

    // If route code is being changed, check for duplicates
    if (updateData.routeCode && updateData.routeCode !== route.routeCode) {
      const existingRoute = await Route.findByRouteCode(updateData.routeCode);
      if (existingRoute) {
        throw new Error('Mã tuyến đường đã tồn tại');
      }
    }

    // Don't allow changing operatorId
    delete updateData.operatorId;

    // Update route
    Object.assign(route, updateData);
    await route.save();

    return route;
  }

  /**
   * Xóa route
   * @param {String} routeId - Route ID
   * @param {String} operatorId - Operator ID (for authorization)
   * @returns {Boolean} Success
   */
  static async delete(routeId, operatorId) {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Tuyến đường không tồn tại');
    }

    // Check ownership
    if (route.operatorId.toString() !== operatorId.toString()) {
      throw new Error('Bạn không có quyền xóa tuyến đường này');
    }

    // TODO: Check if route has active trips before deleting
    // For now, we'll just deactivate instead of hard delete
    await route.deactivate();

    // If you want hard delete, use:
    // await Route.findByIdAndDelete(routeId);

    return true;
  }

  /**
   * Kích hoạt/vô hiệu hóa route
   * @param {String} routeId - Route ID
   * @param {String} operatorId - Operator ID (for authorization)
   * @param {Boolean} isActive - Active status
   * @returns {Object} Updated route
   */
  static async toggleActive(routeId, operatorId, isActive) {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Tuyến đường không tồn tại');
    }

    // Check ownership
    if (route.operatorId.toString() !== operatorId.toString()) {
      throw new Error('Bạn không có quyền thay đổi trạng thái tuyến đường này');
    }

    if (isActive) {
      await route.activate();
    } else {
      await route.deactivate();
    }

    return route;
  }

  /**
   * Tìm kiếm routes (public)
   * @param {Object} filters - Search filters
   * @param {Object} options - Pagination options
   * @returns {Object} Routes và pagination info
   */
  static async search(filters = {}, options = {}) {
    const { originCity, destinationCity, operatorId } = filters;

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build query
    const query = { isActive: true };

    if (originCity) {
      query['origin.city'] = { $regex: originCity, $options: 'i' };
    }

    if (destinationCity) {
      query['destination.city'] = { $regex: destinationCity, $options: 'i' };
    }

    if (operatorId) {
      query.operatorId = operatorId;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query
    const routes = await Route.find(query)
      .populate('operatorId', 'operatorName companyName averageRating logo')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Route.countDocuments(query);

    return {
      routes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Thêm điểm đón
   * @param {String} routeId - Route ID
   * @param {String} operatorId - Operator ID (for authorization)
   * @param {Object} point - Pickup point data
   * @returns {Object} Updated route
   */
  static async addPickupPoint(routeId, operatorId, point) {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Tuyến đường không tồn tại');
    }

    // Check ownership
    if (route.operatorId.toString() !== operatorId.toString()) {
      throw new Error('Bạn không có quyền thêm điểm đón cho tuyến đường này');
    }

    await route.addPickupPoint(point);

    return route;
  }

  /**
   * Xóa điểm đón
   * @param {String} routeId - Route ID
   * @param {String} operatorId - Operator ID (for authorization)
   * @param {String} pointId - Point ID
   * @returns {Object} Updated route
   */
  static async removePickupPoint(routeId, operatorId, pointId) {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Tuyến đường không tồn tại');
    }

    // Check ownership
    if (route.operatorId.toString() !== operatorId.toString()) {
      throw new Error('Bạn không có quyền xóa điểm đón từ tuyến đường này');
    }

    await route.removePickupPoint(pointId);

    return route;
  }

  /**
   * Thêm điểm trả
   * @param {String} routeId - Route ID
   * @param {String} operatorId - Operator ID (for authorization)
   * @param {Object} point - Dropoff point data
   * @returns {Object} Updated route
   */
  static async addDropoffPoint(routeId, operatorId, point) {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Tuyến đường không tồn tại');
    }

    // Check ownership
    if (route.operatorId.toString() !== operatorId.toString()) {
      throw new Error('Bạn không có quyền thêm điểm trả cho tuyến đường này');
    }

    await route.addDropoffPoint(point);

    return route;
  }

  /**
   * Xóa điểm trả
   * @param {String} routeId - Route ID
   * @param {String} operatorId - Operator ID (for authorization)
   * @param {String} pointId - Point ID
   * @returns {Object} Updated route
   */
  static async removeDropoffPoint(routeId, operatorId, pointId) {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Tuyến đường không tồn tại');
    }

    // Check ownership
    if (route.operatorId.toString() !== operatorId.toString()) {
      throw new Error('Bạn không có quyền xóa điểm trả từ tuyến đường này');
    }

    await route.removeDropoffPoint(pointId);

    return route;
  }
}

module.exports = RouteService;
