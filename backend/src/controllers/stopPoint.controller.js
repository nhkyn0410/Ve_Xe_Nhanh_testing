const StopPointService = require('../services/stopPoint.service');
const logger = require('../utils/logger');

exports.getMyStops = async (req, res, next) => {
  try {
    const operatorId = req.userId;
    const { type, status, search, page, limit, sortBy, sortOrder } = req.query;

    const result = await StopPointService.getByOperator(
      operatorId,
      { type, status, search },
      { page, limit, sortBy, sortOrder }
    );

    res.status(200).json({
      status: 'success',
      data: {
        stops: result.stops,
        pagination: result.pagination,
        total: result.pagination.total,
      },
    });
  } catch (error) {
    logger.error('Lỗi lấy danh sách điểm dừng:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Lấy danh sách điểm dừng thất bại',
    });
  }
};

exports.create = async (req, res, next) => {
  try {
    const operatorId = req.userId;
    const stop = await StopPointService.create(operatorId, req.body);

    res.status(201).json({
      status: 'success',
      message: 'Tạo điểm dừng thành công',
      data: { stop },
    });
  } catch (error) {
    logger.error('Lỗi tạo điểm dừng:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Tạo điểm dừng thất bại',
    });
  }
};

exports.getById = async (req, res, next) => {
  try {
    const operatorId = req.userId;
    const stop = await StopPointService.getById(req.params.id, operatorId);

    res.status(200).json({
      status: 'success',
      data: { stop },
    });
  } catch (error) {
    logger.error('Lỗi lấy điểm dừng:', error);
    res.status(404).json({
      status: 'error',
      message: error.message || 'Không tìm thấy điểm dừng',
    });
  }
};

exports.update = async (req, res, next) => {
  try {
    const operatorId = req.userId;
    const stop = await StopPointService.update(req.params.id, operatorId, req.body);

    res.status(200).json({
      status: 'success',
      message: 'Cập nhật điểm dừng thành công',
      data: { stop },
    });
  } catch (error) {
    logger.error('Lỗi cập nhật điểm dừng:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Cập nhật điểm dừng thất bại',
    });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const operatorId = req.userId;
    const stop = await StopPointService.delete(req.params.id, operatorId);

    res.status(200).json({
      status: 'success',
      message: 'Đã ngừng sử dụng điểm dừng',
      data: { stop },
    });
  } catch (error) {
    logger.error('Lỗi xóa điểm dừng:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Xóa điểm dừng thất bại',
    });
  }
};
