const mongoose = require('mongoose');

const CoordinatesSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      min: [-90, 'Vĩ độ phải từ -90 đến 90'],
      max: [90, 'Vĩ độ phải từ -90 đến 90'],
    },
    lng: {
      type: Number,
      min: [-180, 'Kinh độ phải từ -180 đến 180'],
      max: [180, 'Kinh độ phải từ -180 đến 180'],
    },
  },
  { _id: false }
);

const StopPointSchema = new mongoose.Schema(
  {
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Operator ID là bắt buộc'],
      index: true,
    },
    stopCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tên điểm dừng là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tên điểm dừng không được quá 200 ký tự'],
    },
    type: {
      type: String,
      enum: {
        values: ['bus_station', 'rest_stop', 'office', 'roadside', 'other'],
        message: 'Loại điểm dừng không hợp lệ',
      },
      default: 'bus_station',
      index: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Địa chỉ không được quá 500 ký tự'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [120, 'Thành phố không được quá 120 ký tự'],
    },
    province: {
      type: String,
      trim: true,
      maxlength: [120, 'Tỉnh/thành không được quá 120 ký tự'],
    },
    coordinates: {
      type: CoordinatesSchema,
      default: undefined,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Trạng thái điểm dừng không hợp lệ',
      },
      default: 'active',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Ghi chú không được quá 1000 ký tự'],
    },
  },
  {
    collection: 'stop_points',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

StopPointSchema.index({ operatorId: 1, stopCode: 1 }, { unique: true, sparse: true });
StopPointSchema.index({ operatorId: 1, status: 1, type: 1 });
StopPointSchema.index({ operatorId: 1, name: 1, address: 1 });

StopPointSchema.pre('validate', function (next) {
  if (!this.stopCode && this._id) {
    this.stopCode = `SP-${this._id.toString().slice(-6).toUpperCase()}`;
  }
  next();
});

const StopPoint = mongoose.model('StopPoint', StopPointSchema);

module.exports = StopPoint;
