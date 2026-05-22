const Employee = require('../models/Employee');
const BusOperator = require('../models/BusOperator');
const Trip = require('../models/Trip');

/**
 * Employee Service
 * Business logic cho quản lý nhân viên
 */
class EmployeeService {
  static async ensureUniqueContact(operatorId, employeeData, excludeEmployeeId = null) {
    const or = [];

    if (employeeData.phone) {
      or.push({ phone: String(employeeData.phone).trim() });
    }

    if (employeeData.email && String(employeeData.email).trim()) {
      or.push({ email: String(employeeData.email).trim().toLowerCase() });
    }

    if (or.length === 0) return;

    const query = { operatorId, $or: or };
    if (excludeEmployeeId) {
      query._id = { $ne: excludeEmployeeId };
    }

    const existing = await Employee.findOne(query).select('phone email');
    if (!existing) return;

    if (employeeData.phone && existing.phone === String(employeeData.phone).trim()) {
      throw new Error('Số điện thoại nhân viên đã tồn tại');
    }

    throw new Error('Email nhân viên đã tồn tại');
  }

  static handleDuplicateKey(error) {
    if (error?.code !== 11000) throw error;

    if (error.keyPattern?.phone || error.keyValue?.phone) {
      throw new Error('Số điện thoại nhân viên đã tồn tại');
    }

    if (error.keyPattern?.email || error.keyValue?.email) {
      throw new Error('Email nhân viên đã tồn tại');
    }

    if (error.keyPattern?.employeeCode || error.keyValue?.employeeCode) {
      throw new Error('Mã nhân viên đã tồn tại');
    }

    throw new Error('Thông tin nhân viên đã tồn tại');
  }

  /**
   * Tạo nhân viên mới
   * @param {ObjectId} operatorId - ID của nhà xe
   * @param {Object} employeeData - Dữ liệu nhân viên
   * @returns {Promise<Employee>}
   */
  static async create(operatorId, employeeData) {
    // Verify operator exists
    const operator = await BusOperator.findById(operatorId);
    if (!operator) {
      throw new Error('Nhà xe không tồn tại');
    }

    // Validate role-specific fields
    if (employeeData.role === 'driver') {
      if (!employeeData.licenseNumber) {
        throw new Error('Số giấy phép lái xe là bắt buộc cho tài xế');
      }
      if (!employeeData.licenseClass) {
        throw new Error('Hạng giấy phép là bắt buộc cho tài xế');
      }
      if (!employeeData.licenseExpiry) {
        throw new Error('Ngày hết hạn giấy phép là bắt buộc cho tài xế');
      }

      // Check license is not expired
      if (new Date(employeeData.licenseExpiry) <= new Date()) {
        throw new Error('Giấy phép lái xe đã hết hạn');
      }
    }

    // Check if employeeCode already exists for this operator
    const existingEmployee = await Employee.findOne({
      operatorId,
      employeeCode: employeeData.employeeCode,
    });

    if (existingEmployee) {
      throw new Error('Mã nhân viên đã tồn tại');
    }

    await this.ensureUniqueContact(operatorId, employeeData);

    // Create employee
    let employee;
    try {
      employee = await Employee.create({
        operatorId,
        ...employeeData,
      });
    } catch (error) {
      this.handleDuplicateKey(error);
    }

    // Return without password
    return Employee.findById(employee._id).select('-password');
  }

  /**
   * Lấy danh sách nhân viên của operator
   * @param {ObjectId} operatorId
   * @param {Object} filters - { role, status, search }
   * @param {Object} options - { page, limit, sortBy, sortOrder }
   * @returns {Promise<Object>}
   */
  static async getByOperator(operatorId, filters = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const query = { operatorId };

    // Apply filters
    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { fullName: new RegExp(filters.search, 'i') },
        { employeeCode: new RegExp(filters.search, 'i') },
        { phone: new RegExp(filters.search, 'i') },
      ];
    }

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Employee.countDocuments(query),
    ]);

    return {
      employees,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy thông tin nhân viên theo ID
   * @param {ObjectId} employeeId
   * @param {ObjectId} operatorId - For authorization
   * @returns {Promise<Employee>}
   */
  static async getById(employeeId, operatorId) {
    const employee = await Employee.findOne({
      _id: employeeId,
      operatorId,
    }).select('-password');

    if (!employee) {
      throw new Error('Không tìm thấy nhân viên');
    }

    return employee;
  }

  /**
   * Cập nhật thông tin nhân viên
   * @param {ObjectId} employeeId
   * @param {ObjectId} operatorId - For authorization
   * @param {Object} updateData
   * @returns {Promise<Employee>}
   */
  static async update(employeeId, operatorId, updateData) {
    const employee = await Employee.findOne({
      _id: employeeId,
      operatorId,
    });

    if (!employee) {
      throw new Error('Không tìm thấy nhân viên');
    }

    // Prevent changing operatorId
    delete updateData.operatorId;

    // Prevent changing employeeCode (use this as immutable identifier)
    delete updateData.employeeCode;

    // If changing to driver role, validate driver-specific fields
    if (updateData.role === 'driver') {
      const licenseNumber =
        updateData.licenseNumber || employee.licenseNumber;
      const licenseClass = updateData.licenseClass || employee.licenseClass;
      const licenseExpiry = updateData.licenseExpiry || employee.licenseExpiry;

      if (!licenseNumber || !licenseClass || !licenseExpiry) {
        throw new Error(
          'Tài xế phải có đầy đủ thông tin giấy phép lái xe',
        );
      }

      if (new Date(licenseExpiry) <= new Date()) {
        throw new Error('Giấy phép lái xe đã hết hạn');
      }
    }

    // If updating license expiry for existing driver, validate it's not expired
    if (employee.role === 'driver' && updateData.licenseExpiry) {
      if (new Date(updateData.licenseExpiry) <= new Date()) {
        throw new Error('Giấy phép lái xe đã hết hạn');
      }
    }

    await this.ensureUniqueContact(operatorId, updateData, employeeId);

    // Update fields
    Object.assign(employee, updateData);

    try {
      await employee.save();
    } catch (error) {
      this.handleDuplicateKey(error);
    }

    return Employee.findById(employee._id).select('-password');
  }

  /**
   * Xóa nhân viên (soft delete - terminate)
   * @param {ObjectId} employeeId
   * @param {ObjectId} operatorId - For authorization
   * @returns {Promise<void>}
   */
  static async delete(employeeId, operatorId) {
    const employee = await Employee.findOne({
      _id: employeeId,
      operatorId,
    });

    if (!employee) {
      throw new Error('Không tìm thấy nhân viên');
    }

    // Soft delete: mark as terminated
    employee.status = 'terminated';
    employee.terminationDate = new Date();

    await employee.save();
  }

  /**
   * Thay đổi trạng thái nhân viên
   * @param {ObjectId} employeeId
   * @param {ObjectId} operatorId
   * @param {String} newStatus
   * @returns {Promise<Employee>}
   */
  static async changeStatus(employeeId, operatorId, newStatus) {
    const employee = await Employee.findOne({
      _id: employeeId,
      operatorId,
    });

    if (!employee) {
      throw new Error('Không tìm thấy nhân viên');
    }

    // Validate status
    const validStatuses = ['active', 'on_leave', 'suspended', 'terminated'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Trạng thái không hợp lệ');
    }

    employee.status = newStatus;

    // Set termination date if terminating
    if (newStatus === 'terminated' && !employee.terminationDate) {
      employee.terminationDate = new Date();
    }

    await employee.save();

    return Employee.findById(employee._id).select('-password');
  }

  /**
   * Lấy thống kê nhân viên
   * @param {ObjectId} operatorId
   * @returns {Promise<Object>}
   */
  static async getStatistics(operatorId) {
    const mongoose = require('mongoose');

    // Handle both ObjectId and string for test compatibility
    let operatorObjectId;
    try {
      operatorObjectId = new mongoose.Types.ObjectId(operatorId);
    } catch (error) {
      operatorObjectId = operatorId;
    }

    const [
      totalEmployees,
      employeesByRole,
      employeesByStatus,
      driversWithExpiringLicense,
    ] = await Promise.all([
      // Total employees
      Employee.countDocuments({ operatorId: operatorObjectId }),

      // Employees by role
      Employee.aggregate([
        { $match: { operatorId: operatorObjectId } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      // Employees by status
      Employee.aggregate([
        { $match: { operatorId: operatorObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Drivers with license expiring soon (within 30 days)
      Employee.countDocuments({
        operatorId: operatorObjectId,
        role: 'driver',
        licenseExpiry: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          $gt: new Date(),
        },
      }),
    ]);

    // Format results
    const roleStats = {};
    employeesByRole.forEach((item) => {
      roleStats[item._id] = item.count;
    });

    const statusStats = {};
    employeesByStatus.forEach((item) => {
      statusStats[item._id] = item.count;
    });

    return {
      totalEmployees,
      totalDrivers: roleStats.driver || 0,
      totalTripManagers: roleStats.trip_manager || 0,
      activeEmployees: statusStats.active || 0,
      onLeave: statusStats.on_leave || 0,
      suspended: statusStats.suspended || 0,
      terminated: statusStats.terminated || 0,
      driversWithExpiringLicense,
      employeesByRole: roleStats,
      employeesByStatus: statusStats,
    };
  }

  /**
   * Lấy danh sách nhân viên có thể assign vào chuyến
   * @param {ObjectId} operatorId
   * @param {String} role - 'driver' hoặc 'trip_manager'
   * @returns {Promise<Array>}
   */
  static async getAvailableForTrips(operatorId, role) {
    const validRoles = ['driver', 'trip_manager'];
    if (!validRoles.includes(role)) {
      throw new Error('Role không hợp lệ');
    }

    const query = {
      operatorId,
      role,
      status: 'active',
    };

    // For drivers, ensure license is valid
    if (role === 'driver') {
      query.licenseExpiry = { $gt: new Date() };
    }

    const employees = await Employee.find(query)
      .select('-password')
      .sort({ fullName: 1 });

    return employees;
  }

  /**
   * Find employee by employee code (for login)
   * @param {String} employeeCode
   * @returns {Promise<Employee>}
   */
  static async findByEmployeeCode(employeeCode) {
    const employee = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
    }).select('+password');

    return employee;
  }

  /**
   * Get trips assigned to employee (driver or trip manager)
   * @param {ObjectId} employeeId
   * @param {Object} filters - { status, fromDate, toDate }
   * @returns {Promise<Array>}
   */
  static async getAssignedTrips(employeeId, filters = {}) {
    const Trip = require('../models/Trip');

    // Find employee to get role
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Không tìm thấy nhân viên');
    }

    // Build query based on employee role
    const query = {};

    if (employee.role === 'driver') {
      query.driverId = employeeId;
    } else if (employee.role === 'trip_manager') {
      query.tripManagerId = employeeId;
    } else {
      return []; // Invalid role for trip assignment
    }

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.fromDate && filters.toDate) {
      query.departureTime = {
        $gte: new Date(filters.fromDate),
        $lte: new Date(filters.toDate),
      };
    }

    // Get trips with populated data
    const trips = await Trip.find(query)
      .populate('routeId', 'routeName departureCity arrivalCity')
      .populate('busId', 'busNumber plateNumber seatCapacity seatLayout')
      .populate('driverId', 'fullName phone employeeCode')
      .populate('tripManagerId', 'fullName phone employeeCode')
      .populate('operatorId', 'operatorName companyName')
      .sort({ departureTime: -1 })
      .lean();

    // Transform data to match frontend expectations (route instead of routeId, etc.)
    const transformedTrips = trips.map(trip => ({
      ...trip,
      route: trip.routeId,
      bus: trip.busId,
      driver: trip.driverId,
      tripManager: trip.tripManagerId,
      operator: trip.operatorId,
    }));

    return transformedTrips;
  }

  /**
   * Authenticate employee (for trip manager login)
   * @param {String} employeeCode
   * @param {String} password
   * @param {ObjectId} operatorId
   * @returns {Promise<Employee>}
   */
  static async authenticate(employeeCode, password, operatorId) {
    const employee = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
      operatorId,
    }).select('+password');

    if (!employee) {
      throw new Error('Thông tin đăng nhập không chính xác');
    }

    // Check status
    if (employee.status === 'terminated') {
      throw new Error('Tài khoản đã bị chấm dứt');
    }

    if (employee.status === 'suspended') {
      throw new Error('Tài khoản đã bị tạm ngưng');
    }

    // Compare password
    const isMatch = await employee.comparePassword(password);

    if (!isMatch) {
      throw new Error('Thông tin đăng nhập không chính xác');
    }

    // Return without password
    return Employee.findById(employee._id).select('-password');
  }

  /**
   * Change employee password
   * @param {ObjectId} employeeId
   * @param {String} currentPassword
   * @param {String} newPassword
   * @returns {Promise<void>}
   */
  static async changePassword(
    employeeId,
    currentPassword,
    newPassword,
  ) {
    const employee = await Employee.findById(employeeId).select(
      '+password',
    );

    if (!employee) {
      throw new Error('Không tìm thấy nhân viên');
    }

    // Verify current password
    const isMatch = await employee.comparePassword(currentPassword);

    if (!isMatch) {
      throw new Error('Mật khẩu hiện tại không chính xác');
    }

    // Update password
    employee.password = newPassword;
    await employee.save();
  }

  /**
   * Reset employee password (by operator)
   * @param {ObjectId} employeeId
   * @param {ObjectId} operatorId
   * @param {String} newPassword
   * @returns {Promise<void>}
   */
  static async resetPassword(employeeId, operatorId, newPassword) {
    const employee = await Employee.findOne({
      _id: employeeId,
      operatorId,
    });

    if (!employee) {
      throw new Error('Không tìm thấy nhân viên');
    }

    employee.password = newPassword;
    await employee.save();
  }
}

module.exports = EmployeeService;
