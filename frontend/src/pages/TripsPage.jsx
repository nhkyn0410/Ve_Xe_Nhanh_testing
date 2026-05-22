import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AutoComplete, Button, DatePicker, Empty, Form, Select, Slider, Spin } from 'antd';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  SearchOutlined,
  StarFilled,
  SwapOutlined,
  UserOutlined,
  WifiOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import CustomerShell from '../components/customer/CustomerShell';
import ContentBanners from '../components/customer/ContentBanners';
import useBookingStore from '../store/bookingStore';
import { getAvailableSeats, searchTrips } from '../services/bookingApi';
import { formatBusType } from '../utils/busType';
import { getOperatorDisplayName } from '../utils/operatorDisplay';
import { extractSeatAvailability } from '../utils/seatAvailability';

const cityOptions = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nha Trang',
  'Huế',
  'Vũng Tàu',
  'Đà Lạt',
  'Quy Nhơn',
  'Phan Thiết',
  'Hạ Long',
  'Sapa',
  'Phú Quốc',
  'Buôn Ma Thuột',
];

const passengerOptions = Array.from({ length: 6 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1} người lớn`,
}));

const { RangePicker } = DatePicker;

const timeSlots = [
  { key: 'early', label: '00:00 — 06:00', start: 0, end: 6 },
  { key: 'morning', label: '06:00 — 12:00', start: 6, end: 12 },
  { key: 'afternoon', label: '12:00 — 18:00', start: 12, end: 18 },
  { key: 'night', label: '18:00 — 24:00', start: 18, end: 24 },
];

const amenityOptions = [
  { key: 'wifi', label: 'WiFi', icon: WifiOutlined },
  { key: 'ac', label: 'Máy lạnh', icon: SafetyCertificateOutlined },
  { key: 'charger', label: 'Sạc', icon: ThunderboltOutlined },
  { key: 'water', label: 'Nước', icon: SafetyCertificateOutlined },
];

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const getDateRangeLabel = ({ fromDate, toDate }) => {
  if (!fromDate && !toDate) return '';

  if (fromDate && toDate) {
    const from = dayjs(fromDate);
    const to = dayjs(toDate);

    if (from.isSame(to, 'day')) {
      return from.format('DD/MM/YYYY');
    }

    return `${from.format('DD/MM/YYYY')} - ${to.format('DD/MM/YYYY')}`;
  }

  if (fromDate) return `Từ ${dayjs(fromDate).format('DD/MM/YYYY')}`;
  return `Đến ${dayjs(toDate).format('DD/MM/YYYY')}`;
};

const getRouteLabel = ({ fromCity, toCity }) => {
  if (fromCity && toCity) return `${fromCity} → ${toCity}`;
  if (fromCity) return `từ ${fromCity}`;
  if (toCity) return `đến ${toCity}`;
  return 'đang mở bán';
};

const matchesCity = (value, keyword) => {
  if (!keyword) return true;
  return String(value || '')
    .toLowerCase()
    .includes(String(keyword).trim().toLowerCase());
};

const isInDateRange = (departureTime, fromDate, toDate) => {
  if (!fromDate && !toDate) return true;
  if (!departureTime) return false;

  const departure = dayjs(departureTime);
  const start = fromDate ? dayjs(fromDate).startOf('day') : null;
  const end = toDate ? dayjs(toDate).endOf('day') : null;

  if (start && departure.isBefore(start)) return false;
  if (end && departure.isAfter(end)) return false;
  return true;
};

const formatDuration = (departureTime, arrivalTime) => {
  if (!departureTime || !arrivalTime) return 'Đang cập nhật';

  const diff = dayjs(arrivalTime).diff(dayjs(departureTime), 'minute');
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return `${hours}h ${minutes}m`;
};

const normalizeRouteStops = (stops = []) =>
  Array.isArray(stops)
    ? [...stops]
        .filter((stop) => stop && (stop.name || stop.address))
        .sort((a, b) => {
          const orderA = Number.isFinite(Number(a.order))
            ? Number(a.order)
            : Number.MAX_SAFE_INTEGER;
          const orderB = Number.isFinite(Number(b.order))
            ? Number(b.order)
            : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        })
    : [];

const getStopTitle = (stop, fallback = 'Điểm dừng') =>
  stop?.name || stop?.station || stop?.address || fallback;

const getEntityId = (entity) => {
  if (!entity || typeof entity !== 'object') return entity;
  return entity.id || Reflect.get(entity, '_id');
};

const getInitials = (name = 'NX') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const normalizeAmenity = (amenity = '') => {
  const value = amenity.toLowerCase();
  if (value.includes('wifi')) return 'wifi';
  if (value.includes('air') || value.includes('ac') || value.includes('máy lạnh')) return 'ac';
  if (value.includes('charger') || value.includes('usb') || value.includes('sạc')) return 'charger';
  if (value.includes('water') || value.includes('nước')) return 'water';
  return value;
};

const amenityMeta = {
  wifi: { label: 'WiFi', icon: WifiOutlined },
  ac: { label: 'Máy lạnh', icon: SafetyCertificateOutlined },
  charger: { label: 'Sạc USB', icon: ThunderboltOutlined },
  water: { label: 'Nước uống', icon: SafetyCertificateOutlined },
  toilet: { label: 'Toilet', icon: SafetyCertificateOutlined },
  blanket: { label: 'Chăn ấm', icon: SafetyCertificateOutlined },
};

const getAmenityMeta = (amenity) => {
  if (amenityMeta[amenity]) return amenityMeta[amenity];
  return { label: amenity || 'Đang cập nhật', icon: SafetyCertificateOutlined };
};

const normalizeTrip = (trip) => {
  const route = trip.routeId || trip.route || {};
  const bus = trip.busId || trip.bus || {};
  const operator = trip.operatorId || trip.operator || {};
  const fromCity = route.origin?.city || route.origin?.province || trip.fromCity || 'Điểm đi';
  const toCity =
    route.destination?.city || route.destination?.province || trip.toCity || 'Điểm đến';
  const finalPrice =
    trip.finalPrice || trip.pricing?.finalPrice || trip.basePrice || trip.pricing?.basePrice || 0;
  const basePrice = trip.basePrice || trip.pricing?.basePrice || finalPrice;
  const availableSeats = trip.availableSeats ?? trip.seats?.available ?? 0;
  const totalSeats = trip.totalSeats ?? trip.seats?.total ?? 0;
  const stops = normalizeRouteStops(route.stops);
  let tag = null;

  if (trip.discount) {
    tag = `GIẢM ${trip.discount}%`;
  } else if (availableSeats > 0 && availableSeats < 5) {
    tag = 'SẮP HẾT CHỖ';
  }

  return {
    raw: trip,
    id: getEntityId(trip),
    fromCity,
    toCity,
    fromStation: route.origin?.station || route.origin?.address || fromCity,
    toStation: route.destination?.station || route.destination?.address || toCity,
    stops,
    routeName: route.routeName || route.name || `${fromCity} → ${toCity}`,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    departLabel: trip.departureTime ? dayjs(trip.departureTime).format('HH:mm') : '--:--',
    arriveLabel: trip.arrivalTime ? dayjs(trip.arrivalTime).format('HH:mm') : '--:--',
    dateLabel: trip.departureTime ? dayjs(trip.departureTime).format('DD/MM/YYYY') : '--/--/----',
    duration:
      typeof trip.duration === 'string'
        ? trip.duration
        : trip.duration?.formatted || formatDuration(trip.departureTime, trip.arrivalTime),
    operatorId: getEntityId(operator),
    operatorName: getOperatorDisplayName(operator, trip.operatorName || 'Nhà xe'),
    operatorRating: operator.averageRating || operator.rating?.average || trip.operatorRating || 0,
    operatorReviews: operator.totalReviews || operator.rating?.total || 0,
    busType: formatBusType(bus.busType || trip.busType, 'Xe khách'),
    busNumber: bus.busNumber || trip.busNumber || 'Đang cập nhật',
    amenities: (bus.amenities || trip.amenities || []).map(normalizeAmenity),
    basePrice,
    finalPrice,
    discount: trip.discount || trip.pricing?.discount || 0,
    availableSeats,
    totalSeats,
    tag,
  };
};

const CompactField = ({ icon: Icon, label, children, last = false }) => (
  <div
    className={`flex min-h-[72px] flex-col justify-center gap-1 bg-white px-4 py-2 ${last ? '' : 'border-b border-vxn-border lg:border-b-0 lg:border-r'}`}
  >
    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-vxn-fg-5">
      <Icon className="text-[12px] text-vxn-teal-700" />
      {label}
    </div>
    {children}
  </div>
);

const SearchSummaryBar = ({ form, initialValues, loading, onSearch, onSwap, browseMode }) => (
  <div className="sticky top-16 z-30 border-b border-vxn-border bg-white px-4 py-5 shadow-sm lg:top-0 lg:px-8">
    <Form form={form} initialValues={initialValues} onFinish={onSearch}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-stretch">
        <div className="grid flex-1 overflow-hidden rounded-xl border border-vxn-border bg-white lg:grid-cols-[1fr_44px_1fr_1.35fr_0.9fr]">
          <CompactField icon={EnvironmentOutlined} label="Điểm đi">
            <Form.Item name="fromCity" style={{ marginBottom: 0 }}>
              <AutoComplete
                options={cityOptions.map((city) => ({ value: city }))}
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().includes(inputValue.toLowerCase())
                }
                placeholder="Tất cả điểm đi"
                className="vxn-compact-input"
                allowClear
              />
            </Form.Item>
          </CompactField>

          <div className="grid min-h-[44px] place-items-center border-b border-vxn-border bg-white lg:border-b-0 lg:border-r">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-vxn-border bg-white text-vxn-fg-2 transition hover:border-vxn-teal-600 hover:text-vxn-teal-800"
              onClick={onSwap}
              aria-label="Đổi điểm đi và điểm đến"
            >
              <SwapOutlined />
            </button>
          </div>

          <CompactField icon={EnvironmentOutlined} label="Điểm đến">
            <Form.Item name="toCity" style={{ marginBottom: 0 }}>
              <AutoComplete
                options={cityOptions.map((city) => ({ value: city }))}
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().includes(inputValue.toLowerCase())
                }
                placeholder="Tất cả điểm đến"
                className="vxn-compact-input"
                allowClear
              />
            </Form.Item>
          </CompactField>

          <CompactField icon={CalendarOutlined} label="Khoảng ngày">
            <Form.Item name="dateRange" style={{ marginBottom: 0 }}>
              <RangePicker
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                allowClear
                suffixIcon={null}
                className="w-full"
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Form.Item>
          </CompactField>

          <CompactField icon={UserOutlined} label="Hành khách" last>
            <Form.Item
              name="passengers"
              rules={[{ required: true, message: 'Vui lòng chọn số khách!' }]}
              style={{ marginBottom: 0 }}
            >
              <Select options={passengerOptions} suffixIcon={null} />
            </Form.Item>
          </CompactField>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<SearchOutlined />}
          className="h-[74px] rounded-md border-0 bg-vxn-teal-700 px-8 text-base font-semibold hover:!bg-vxn-teal-800 xl:min-w-[132px]"
        >
          {browseMode ? 'Lọc chuyến' : 'Tìm lại'}
        </Button>
      </div>
    </Form>
  </div>
);

const FilterGroup = ({ title, children }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between text-[13px] font-semibold text-vxn-ink">
      {title}
      <span className="text-xs text-vxn-fg-5">⌃</span>
    </div>
    {children}
  </div>
);

const ToggleRow = ({ label, count, active, onClick }) => (
  <button
    type="button"
    className={`flex w-full items-center gap-2 rounded-md border-0 bg-transparent py-1.5 text-left text-[13px] transition ${active ? 'font-medium text-vxn-ink' : 'text-vxn-fg-2 hover:text-vxn-teal-800'}`}
    onClick={onClick}
  >
    <span
      className={`grid h-4 w-4 place-items-center rounded border ${active ? 'border-vxn-teal-700 bg-vxn-teal-700 text-white' : 'border-vxn-border-strong bg-white text-transparent'}`}
    >
      <CheckOutlined className="text-[10px]" />
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {typeof count === 'number' && <span className="text-xs text-vxn-fg-5">{count}</span>}
  </button>
);

const FiltersSidebar = ({
  maxPrice,
  priceRange,
  onPriceChange,
  timeSlot,
  onTimeSlotChange,
  busTypes,
  selectedBusTypes,
  onToggleBusType,
  operators,
  selectedOperators,
  onToggleOperator,
  selectedAmenities,
  onToggleAmenity,
  onReset,
}) => (
  <aside className="border-r border-vxn-border bg-white px-5 py-6 lg:sticky lg:top-[198px] lg:h-[calc(100svh-198px)] lg:self-start lg:overflow-y-auto lg:overscroll-contain xl:top-[114px] xl:h-[calc(100svh-114px)]">
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2 text-base font-semibold text-vxn-ink">
        <FilterOutlined className="text-vxn-teal-700" />
        Bộ lọc
      </div>
      <button
        type="button"
        className="border-0 bg-transparent text-[13px] font-medium text-vxn-teal-800"
        onClick={onReset}
      >
        Xóa hết
      </button>
    </div>

    <div className="flex flex-col gap-6">
      <FilterGroup title="Khoảng giá">
        <Slider
          range
          min={0}
          max={maxPrice}
          step={10000}
          value={priceRange}
          onChange={onPriceChange}
          tooltip={{ formatter: formatCurrency }}
        />
        <div className="flex justify-between text-[13px] font-medium text-vxn-fg-2">
          <span>{formatCurrency(priceRange[0])}</span>
          <span>{formatCurrency(priceRange[1])}</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Giờ khởi hành">
        <div className="grid grid-cols-2 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot.key}
              type="button"
              className={`rounded-lg border px-3 py-2 text-left transition ${timeSlot === slot.key ? 'border-vxn-teal-700 bg-[#D4E3FF] text-vxn-teal-900' : 'border-vxn-border bg-white text-vxn-fg-2 hover:border-vxn-teal-300'}`}
              onClick={() => onTimeSlotChange(timeSlot === slot.key ? '' : slot.key)}
            >
              <span className="block text-[12px] font-medium">{slot.label}</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Loại xe">
        <div>
          {busTypes.map((type) => (
            <ToggleRow
              key={type}
              label={type}
              active={selectedBusTypes.includes(type)}
              onClick={() => onToggleBusType(type)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Nhà xe">
        <div>
          {operators.slice(0, 8).map((operator) => (
            <ToggleRow
              key={operator.id}
              label={operator.name}
              count={operator.count}
              active={selectedOperators.includes(operator.id)}
              onClick={() => onToggleOperator(operator.id)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Tiện ích">
        <div className="flex flex-wrap gap-2">
          {amenityOptions.map((item) => {
            const Icon = item.icon;
            const active = selectedAmenities.includes(item.key);

            return (
              <button
                key={item.key}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? 'border-vxn-teal-700 bg-[#D4E3FF] text-vxn-teal-900' : 'border-vxn-border bg-white text-vxn-fg-2 hover:border-vxn-teal-300'}`}
                onClick={() => onToggleAmenity(item.key)}
              >
                <Icon className="text-[12px]" />
                {item.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>
    </div>
  </aside>
);

const SortRow = ({ total, criteria, sortBy, onSortChange }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-vxn-border bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="text-sm font-medium text-vxn-ink">
      <strong className="text-vxn-teal-700">{total} chuyến</strong> {getRouteLabel(criteria)}
      {getDateRangeLabel(criteria) ? ` · ${getDateRangeLabel(criteria)}` : ''}
    </div>
    <div className="flex flex-wrap gap-1 rounded-lg bg-vxn-bg-soft p-1">
      {[
        ['time', 'Sớm nhất'],
        ['price', 'Giá thấp'],
        ['rating', 'Đánh giá'],
        ['seats', 'Còn nhiều chỗ'],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={`rounded-md border-0 px-3 py-1.5 text-[13px] font-medium transition ${sortBy === value ? 'bg-white text-vxn-ink shadow-sm' : 'bg-transparent text-vxn-fg-3 hover:text-vxn-teal-800'}`}
          onClick={() => onSortChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

const TripCard = ({ trip, onSelect, onOperatorClick }) => {
  const amenityItems = trip.amenities.length > 0 ? trip.amenities : ['Đang cập nhật'];
  const seatCountLabel = trip.totalSeats
    ? `${trip.availableSeats}/${trip.totalSeats}`
    : `${trip.availableSeats}`;
  const stopCountLabel =
    trip.stops.length > 0
      ? `${trip.stops.length} điểm dừng trung gian`
      : 'Không có điểm dừng trung gian';
  const seatUrgent = trip.availableSeats > 0 && trip.availableSeats < 5;

  return (
    <article className="overflow-hidden rounded-[18px] border border-vxn-border bg-white shadow-[0_18px_44px_-30px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:border-vxn-teal-300 hover:shadow-[0_24px_54px_-32px_rgba(0,100,129,0.42)]">
      <div className="grid xl:grid-cols-[178px_minmax(0,1fr)_218px]">
        <button
          type="button"
          className="flex items-center gap-3 border-0 border-b border-[#E8EDF4] bg-[#F4FAFB] p-4 text-left transition hover:bg-[#EDF7F9] xl:flex-col xl:items-start xl:justify-between xl:border-b-0 xl:border-r xl:p-5"
          onClick={onOperatorClick}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-vxn-teal-700 text-base font-bold text-white shadow-sm xl:h-14 xl:w-14 xl:text-lg">
            {getInitials(trip.operatorName)}
          </span>
          <span className="min-w-0 flex-1 xl:flex-none">
            <span className="block truncate text-sm font-bold text-vxn-ink">
              {trip.operatorName}
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-xs text-vxn-fg-3">
              <StarFilled className="text-vxn-saffron-600" />
              <strong className="text-vxn-ink">
                {Number(trip.operatorRating || 0).toFixed(1)}
              </strong>
              <span>({Number(trip.operatorReviews || 0).toLocaleString('vi-VN')})</span>
            </span>
          </span>
          {trip.tag && (
            <span className="rounded-full bg-[#FFE9C4] px-2.5 py-1 text-[10px] font-semibold text-vxn-saffron-700">
              {trip.tag}
            </span>
          )}
        </button>

        <div className="min-w-0 p-4 xl:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-[17px] font-semibold text-vxn-ink">
              <EnvironmentOutlined className="shrink-0 text-[15px] text-vxn-teal-700" />
              <span className="truncate">{trip.fromCity}</span>
              <ArrowRightOutlined className="shrink-0 text-[14px] text-vxn-fg-5" />
              <span className="truncate">{trip.toCity}</span>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-vxn-bg-soft px-3 py-1 text-[13px] font-medium text-vxn-fg-3">
              {trip.dateLabel} · {trip.busType}
            </span>
          </div>

          <div className="grid grid-cols-[90px_minmax(0,1fr)_90px] items-start gap-4 sm:grid-cols-[116px_minmax(0,1fr)_116px]">
            <div className="text-right">
              <div className="text-[35px] font-bold leading-none text-vxn-ink">
                {trip.departLabel}
              </div>
              <div className="mt-1 line-clamp-2 text-[15px] leading-6 text-vxn-fg-5">
                {trip.fromStation}
              </div>
            </div>

            <div className="pt-3">
              <div className="mb-2 flex items-center justify-center gap-2 text-[14px] font-semibold uppercase tracking-[0.04em] text-vxn-fg-5">
                <span>{trip.duration}</span>
              </div>
              <div className="relative h-2">
                <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-vxn-border-strong" />
                <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-vxn-teal-700 shadow" />
                {trip.stops.map((stop, index) => (
                  <span
                    key={getEntityId(stop) || `${stop.name || stop.address}-${index}`}
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-vxn-saffron-600 shadow"
                    style={{ left: `${((index + 1) / (trip.stops.length + 1)) * 100}%` }}
                    title={getStopTitle(stop, `Điểm dừng ${index + 1}`)}
                  />
                ))}
                <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-vxn-teal-700 shadow" />
              </div>
              <div className="mt-3 text-center text-[15px] font-medium text-vxn-fg-4">
                {stopCountLabel}
              </div>
            </div>

            <div>
              <div className="text-[35px] font-bold leading-none text-vxn-ink">
                {trip.arriveLabel}
              </div>
              <div className="mt-1 line-clamp-2 text-[15px] leading-6 text-vxn-fg-5">
                {trip.toStation}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 border-t border-vxn-border bg-[#FFF9ED] p-4 text-center xl:border-l xl:border-t-0 xl:p-5">
          <div className="w-full">
            {trip.discount > 0 && (
              <div className="mb-1 flex items-center justify-center gap-2">
                <span className="text-xs text-vxn-fg-5 line-through">
                  {formatCurrency(trip.basePrice)}
                </span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                  -{trip.discount}%
                </span>
              </div>
            )}
            <div className="text-[30px] font-bold leading-none tracking-[-0.01em] text-vxn-saffron-700">
              {formatCurrency(trip.finalPrice)}
            </div>
            <div className="mt-1 text-[11px] text-vxn-fg-5">/ vé · đã gồm thuế</div>
            <div
              className={`mx-auto mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                seatUrgent
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-vxn-teal-100 bg-[#E7F4FA] text-vxn-teal-900'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  seatUrgent ? 'bg-red-500' : 'bg-vxn-teal-700'
                }`}
              />
              Còn {seatCountLabel} chỗ
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-vxn-border bg-[#F7FAFC] px-4 py-4 xl:grid-cols-[178px_minmax(0,1fr)_218px] xl:items-stretch xl:gap-0 xl:p-0">
        <div className="xl:col-span-2 xl:px-5 xl:py-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-vxn-fg-5">
            Tiện ích
          </div>
          <div className="flex flex-wrap gap-2.5">
            {amenityItems.slice(0, 4).map((amenity) => {
              const { label, icon: Icon } = getAmenityMeta(amenity);

              return (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-2 rounded-lg border border-vxn-border bg-white px-3 py-2 text-sm font-medium text-vxn-ink"
                >
                  <Icon className="text-[14px] text-vxn-teal-700" />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col justify-center xl:w-[218px] xl:px-0 xl:py-4">
          <Button
            type="primary"
            className="h-11 rounded-md border-0 bg-vxn-teal-700 text-[15px] font-semibold hover:!bg-vxn-teal-800 xl:w-full"
            onClick={onSelect}
            block
          >
            Chọn chuyến <ArrowRightOutlined className="text-xs" />
          </Button>
        </div>
      </div>
    </article>
  );
};

const TripsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchCriteria, setSelectedTrip, setSearchCriteria } = useBookingStore();
  const [form] = Form.useForm();
  const isSearchResultsPage = location.pathname === '/search-results';

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeCriteria, setActiveCriteria] = useState({
    fromCity: '',
    toCity: '',
    fromDate: null,
    toDate: null,
    passengers: 1,
  });
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [sortBy, setSortBy] = useState('time');
  const [timeSlot, setTimeSlot] = useState('');
  const [selectedBusTypes, setSelectedBusTypes] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const operatorIdFromUrl = params.get('operatorId');

  const initialValues = useMemo(() => {
    if (!isSearchResultsPage) {
      return {
        fromCity: undefined,
        toCity: undefined,
        dateRange: undefined,
        passengers: 1,
      };
    }

    const fromDate = searchCriteria.fromDate || searchCriteria.date || null;
    const toDate = searchCriteria.toDate || searchCriteria.date || null;

    return {
      fromCity: searchCriteria.fromCity || undefined,
      toCity: searchCriteria.toCity || undefined,
      dateRange: fromDate && toDate ? [dayjs(fromDate), dayjs(toDate)] : undefined,
      passengers: searchCriteria.passengers || 1,
    };
  }, [isSearchResultsPage, searchCriteria]);

  const fetchTrips = async (criteria = {}) => {
    try {
      setLoading(true);
      const query = Object.fromEntries(
        Object.entries(criteria).filter(
          ([, value]) => value !== undefined && value !== null && value !== ''
        )
      );
      const response = await searchTrips(query);
      const nextTrips =
        response.status === 'success' ? (response.data?.trips || []).map(normalizeTrip) : [];

      setTrips(nextTrips);

      if (nextTrips.length > 0) {
        const nextMaxPrice =
          Math.ceil(Math.max(...nextTrips.map((trip) => trip.finalPrice), 1000000) / 10000) * 10000;
        setMaxPrice(nextMaxPrice);
        setPriceRange([0, nextMaxPrice]);
      } else {
        setMaxPrice(1000000);
        setPriceRange([0, 1000000]);
      }
    } catch (error) {
      setTrips([]);
      toast.error(typeof error === 'string' ? error : 'Có lỗi xảy ra khi tải chuyến xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fromDate = isSearchResultsPage
      ? searchCriteria.fromDate || searchCriteria.date || null
      : null;
    const toDate = isSearchResultsPage
      ? searchCriteria.toDate || searchCriteria.date || null
      : null;
    const nextCriteria = isSearchResultsPage
      ? {
          fromCity: searchCriteria.fromCity || '',
          toCity: searchCriteria.toCity || '',
          fromDate,
          toDate,
          passengers: searchCriteria.passengers || 1,
        }
      : {
          fromCity: '',
          toCity: '',
          fromDate: null,
          toDate: null,
          passengers: 1,
        };
    const apiCriteria = {
      passengers: nextCriteria.passengers,
      operatorId: operatorIdFromUrl,
    };

    if (isSearchResultsPage && fromDate && toDate && dayjs(fromDate).isSame(dayjs(toDate), 'day')) {
      apiCriteria.date = fromDate;
    }

    setActiveCriteria(nextCriteria);
    form.setFieldsValue(initialValues);
    fetchTrips(apiCriteria);
  }, [
    form,
    initialValues,
    isSearchResultsPage,
    location.search,
    operatorIdFromUrl,
    searchCriteria,
  ]);

  const busTypes = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.busType).filter(Boolean))),
    [trips]
  );

  const operators = useMemo(() => {
    const map = new Map();

    trips.forEach((trip) => {
      if (!trip.operatorId) return;
      const current = map.get(trip.operatorId) || {
        id: trip.operatorId,
        name: trip.operatorName,
        count: 0,
      };
      current.count += 1;
      map.set(trip.operatorId, current);
    });

    return Array.from(map.values());
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const selectedSlot = timeSlots.find((slot) => slot.key === timeSlot);

    return trips
      .filter((trip) => matchesCity(trip.fromCity, activeCriteria.fromCity))
      .filter((trip) => matchesCity(trip.toCity, activeCriteria.toCity))
      .filter((trip) =>
        isInDateRange(trip.departureTime, activeCriteria.fromDate, activeCriteria.toDate)
      )
      .filter((trip) => trip.finalPrice >= priceRange[0] && trip.finalPrice <= priceRange[1])
      .filter(
        (trip) =>
          !selectedSlot ||
          (dayjs(trip.departureTime).hour() >= selectedSlot.start &&
            dayjs(trip.departureTime).hour() < selectedSlot.end)
      )
      .filter((trip) => selectedBusTypes.length === 0 || selectedBusTypes.includes(trip.busType))
      .filter(
        (trip) => selectedOperators.length === 0 || selectedOperators.includes(trip.operatorId)
      )
      .filter(
        (trip) =>
          selectedAmenities.length === 0 ||
          selectedAmenities.every((amenity) => trip.amenities.includes(amenity))
      )
      .sort((a, b) => {
        if (sortBy === 'price') return a.finalPrice - b.finalPrice;
        if (sortBy === 'rating') return b.operatorRating - a.operatorRating;
        if (sortBy === 'seats') return b.availableSeats - a.availableSeats;
        return new Date(a.departureTime) - new Date(b.departureTime);
      });
  }, [
    trips,
    activeCriteria,
    priceRange,
    timeSlot,
    selectedBusTypes,
    selectedOperators,
    selectedAmenities,
    sortBy,
  ]);

  const visibleTripIds = useMemo(
    () =>
      filteredTrips
        .map((trip) => trip.id)
        .filter(Boolean)
        .join('|'),
    [filteredTrips]
  );

  useEffect(() => {
    if (!visibleTripIds) return undefined;

    let cancelled = false;
    const tripIds = visibleTripIds.split('|').filter(Boolean);

    const refreshSeatCounts = async () => {
      const updates = await Promise.all(
        tripIds.map(async (tripId) => {
          try {
            const response = await getAvailableSeats(tripId);
            const availability = extractSeatAvailability(response);

            if (!availability) return null;
            return {
              tripId,
              availableSeats: availability.availableSeats,
              totalSeats: availability.totalSeats,
            };
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;

      const updateMap = new Map(updates.filter(Boolean).map((update) => [update.tripId, update]));

      if (updateMap.size === 0) return;

      setTrips((currentTrips) =>
        currentTrips.map((trip) => {
          const update = updateMap.get(trip.id);
          if (!update) return trip;

          const nextTotalSeats = update.totalSeats || trip.totalSeats;
          if (trip.availableSeats === update.availableSeats && trip.totalSeats === nextTotalSeats) {
            return trip;
          }

          return {
            ...trip,
            availableSeats: update.availableSeats,
            totalSeats: nextTotalSeats,
          };
        })
      );
    };

    refreshSeatCounts();
    const timer = setInterval(refreshSeatCounts, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [visibleTripIds]);

  const handleSearch = async (values) => {
    try {
      setSearchLoading(true);
      const [rangeStart, rangeEnd] = values.dateRange || [];
      const fromDate = rangeStart ? dayjs(rangeStart).format('YYYY-MM-DD') : null;
      const toDate = rangeEnd ? dayjs(rangeEnd).format('YYYY-MM-DD') : null;
      const nextCriteria = {
        fromCity: values.fromCity || '',
        toCity: values.toCity || '',
        fromDate,
        toDate,
        date: fromDate && toDate && fromDate === toDate ? fromDate : null,
        passengers: values.passengers || 1,
      };
      const apiCriteria = {
        passengers: nextCriteria.passengers,
        operatorId: operatorIdFromUrl,
      };

      if (nextCriteria.date) {
        apiCriteria.date = nextCriteria.date;
      }

      if (isSearchResultsPage) {
        setSearchCriteria(nextCriteria);
      }
      setActiveCriteria(nextCriteria);
      setTimeSlot('');
      setSelectedBusTypes([]);
      setSelectedOperators([]);
      setSelectedAmenities([]);
      setSortBy('time');
      await fetchTrips(apiCriteria);

      if (isSearchResultsPage && location.pathname !== '/search-results') {
        navigate('/search-results');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSwapCities = () => {
    const values = form.getFieldsValue();
    form.setFieldsValue({ fromCity: values.toCity, toCity: values.fromCity });
  };

  const toggleValue = (setter, value) => {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const resetFilters = () => {
    const nextCriteria = {
      fromCity: '',
      toCity: '',
      fromDate: null,
      toDate: null,
      date: null,
      passengers: activeCriteria.passengers || 1,
    };

    form.setFieldsValue({
      fromCity: undefined,
      toCity: undefined,
      dateRange: undefined,
      passengers: nextCriteria.passengers,
    });
    setActiveCriteria(nextCriteria);
    if (isSearchResultsPage) {
      setSearchCriteria(nextCriteria);
    }
    setPriceRange([0, maxPrice]);
    setTimeSlot('');
    setSelectedBusTypes([]);
    setSelectedOperators([]);
    setSelectedAmenities([]);
    fetchTrips({ passengers: nextCriteria.passengers, operatorId: operatorIdFromUrl });
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip.raw);
    navigate(`/trips/${trip.id}`);
  };

  let tripListContent;

  if (loading) {
    tripListContent = (
      <div className="grid min-h-[360px] place-items-center rounded-xl border border-vxn-border bg-white">
        <Spin size="large" />
      </div>
    );
  } else if (filteredTrips.length === 0) {
    tripListContent = (
      <div className="rounded-xl border border-vxn-border bg-white py-16">
        <Empty description="Không tìm thấy chuyến phù hợp" />
      </div>
    );
  } else {
    tripListContent = filteredTrips.map((trip) => (
      <TripCard
        key={trip.id}
        trip={trip}
        onSelect={() => handleTripSelect(trip)}
        onOperatorClick={() => trip.operatorId && navigate(`/operators/${trip.operatorId}`)}
      />
    ));
  }

  return (
    <CustomerShell activeKey={isSearchResultsPage ? 'buy' : 'trips'} mainClassName="bg-vxn-bg-soft">
      <SearchSummaryBar
        form={form}
        initialValues={initialValues}
        loading={searchLoading}
        onSearch={handleSearch}
        onSwap={handleSwapCities}
        browseMode={!isSearchResultsPage}
      />

      <div className="grid items-start lg:grid-cols-[280px_minmax(0,1fr)]">
        <FiltersSidebar
          maxPrice={maxPrice}
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          timeSlot={timeSlot}
          onTimeSlotChange={setTimeSlot}
          busTypes={busTypes}
          selectedBusTypes={selectedBusTypes}
          onToggleBusType={(value) => toggleValue(setSelectedBusTypes, value)}
          operators={operators}
          selectedOperators={selectedOperators}
          onToggleOperator={(value) => toggleValue(setSelectedOperators, value)}
          selectedAmenities={selectedAmenities}
          onToggleAmenity={(value) => toggleValue(setSelectedAmenities, value)}
          onReset={resetFilters}
        />

        <section className="min-w-0 px-4 py-6 lg:px-8">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
            <ContentBanners position="booking" containerClassName="grid gap-4" />

            <SortRow
              total={filteredTrips.length}
              criteria={activeCriteria}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {tripListContent}
          </div>
        </section>
      </div>
    </CustomerShell>
  );
};

export default TripsPage;
