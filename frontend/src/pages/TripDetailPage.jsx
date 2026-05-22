import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Empty, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  StarFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import RouteMiniMap from '../components/customer/RouteMiniMap';
import ReviewsSection from '../components/ReviewsSection';
import { getAvailableSeats, getTripDetails } from '../services/bookingApi';
import useBookingStore from '../store/bookingStore';
import { formatBusType } from '../utils/busType';
import { getOperatorDisplayName } from '../utils/operatorDisplay';
import { extractSeatAvailability, mergeSeatAvailabilityIntoTrip } from '../utils/seatAvailability';

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatDateTime = (value) => (value ? dayjs(value).format('HH:mm · DD/MM/YYYY') : 'Đang cập nhật');

const defaultPolicyItems = [
  'Đổi chuyến miễn phí trước 24h',
  'Trẻ em dưới 1m miễn vé',
];

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

const getStopAddress = (stop) => {
  const title = getStopTitle(stop, '');
  return stop?.address && stop.address !== title ? stop.address : '';
};

const asFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const hasCoordinates = (point) => {
  const lat = asFiniteNumber(point?.coordinates?.lat);
  const lng = asFiniteNumber(point?.coordinates?.lng);
  return lat !== null && lng !== null;
};

const normalizeSearchText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const pointMatchesLocation = (point, location) => {
  const locationKeys = [location?.city, location?.station, location?.address]
    .map(normalizeSearchText)
    .filter(Boolean);

  if (locationKeys.length === 0 && location?.province) {
    locationKeys.push(normalizeSearchText(location.province));
  }

  if (locationKeys.length === 0) return false;

  const pointText = [point?.name, point?.station, point?.address, point?.city, point?.province]
    .map(normalizeSearchText)
    .filter(Boolean)
    .join(' ');
  if (!pointText) return false;

  return locationKeys.some((key) => pointText.includes(key));
};

const getRouteMapEndpoint = (location, candidates = [], prefer = 'first') => {
  if (hasCoordinates(location)) return location;

  const geocodedCandidates = candidates.filter(hasCoordinates);
  const matched = geocodedCandidates.find((candidate) => pointMatchesLocation(candidate, location));
  if (matched) return matched;

  return prefer === 'last'
    ? geocodedCandidates[geocodedCandidates.length - 1] || location
    : geocodedCandidates[0] || location;
};

const toRouteMapPoint = (point, { key, type, fallbackLabel, fallbackAddress, fallbackCity }) => ({
  key,
  type,
  label: getStopTitle(point, fallbackLabel),
  address: getStopAddress(point) || point?.address || fallbackAddress,
  city: point?.city || fallbackCity,
  coordinates: point?.coordinates,
});

const getStopTimeValue = (departureTime, stop) => {
  const estimatedMinutes = Number(stop?.estimatedArrivalMinutes);

  if (departureTime && Number.isFinite(estimatedMinutes)) {
    return dayjs(departureTime).add(estimatedMinutes, 'minute').toISOString();
  }

  return stop?.arrivalTime || stop?.time || null;
};

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

const getAmenityLabel = (amenity = '') => {
  const value = amenity.toLowerCase();
  if (value.includes('wifi')) return 'WiFi';
  if (value.includes('air') || value.includes('ac') || value.includes('máy lạnh')) return 'Máy lạnh';
  if (value.includes('charger') || value.includes('usb') || value.includes('sạc')) return 'Sạc USB';
  if (value.includes('water') || value.includes('nước')) return 'Nước uống';
  if (value.includes('blanket') || value.includes('chăn')) return 'Chăn ấm';
  return amenity;
};

const normalizeTrip = (trip) => {
  const route = trip.route || trip.routeId || {};
  const bus = trip.bus || trip.busId || {};
  const operator = trip.operator || trip.operatorId || {};
  const pricing = trip.pricing || {};
  const seats = trip.seats || {};
  const fromCity = route.origin?.city || route.origin?.province || 'Điểm đi';
  const toCity = route.destination?.city || route.destination?.province || 'Điểm đến';
  const finalPrice = pricing.finalPrice || trip.finalPrice || pricing.basePrice || trip.basePrice || 0;
  const basePrice = pricing.basePrice || trip.basePrice || finalPrice;

  return {
    raw: trip,
    id: getEntityId(trip),
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    route: {
      ...route,
      fromCity,
      toCity,
      fromAddress: route.origin?.address || route.origin?.station || fromCity,
      toAddress: route.destination?.address || route.destination?.station || toCity,
      name: route.name || route.routeName || `${fromCity} → ${toCity}`,
      code: route.code || route.routeCode,
      pickupPoints: route.pickupPoints || [],
      dropoffPoints: route.dropoffPoints || [],
      stops: normalizeRouteStops(route.stops),
    },
    bus: {
      ...bus,
      busType: formatBusType(bus.busType || trip.busType, ''),
      amenities: bus.amenities || [],
    },
    operator: {
      ...operator,
      id: getEntityId(operator),
      operatorName: getOperatorDisplayName(operator, 'Nhà xe'),
      companyName: operator.companyName || 'Nhà xe',
      ratingAverage: operator.rating?.average || operator.averageRating || 0,
      ratingTotal: operator.rating?.total || operator.totalReviews || 0,
    },
    duration: typeof trip.duration === 'string'
      ? trip.duration
      : trip.duration?.formatted || formatDuration(trip.departureTime, trip.arrivalTime),
    pricing: {
      basePrice,
      finalPrice,
      discount: pricing.discount || trip.discount || 0,
    },
    seats: {
      total: seats.total || trip.totalSeats || 0,
      available: seats.available ?? trip.availableSeats ?? 0,
      bookedSeatNumbers: seats.bookedSeatNumbers || [],
      heldSeatNumbers: seats.heldSeatNumbers || [],
      occupancyRate: seats.occupancyRate || 0,
    },
    policies: trip.policies,
    cancellationPolicy: trip.cancellationPolicy,
    notes: trip.notes,
  };
};

const InfoCard = ({ children, className = '' }) => (
  <section className={`rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm ${className}`}>
    {children}
  </section>
);

const SectionTitle = ({ eyebrow, title, children }) => (
  <div className="mb-4 flex flex-col gap-1">
    {eyebrow && <span className="text-xs font-semibold uppercase tracking-[0.08em] text-vxn-teal-700">{eyebrow}</span>}
    <h2 className="m-0 text-xl font-bold tracking-[-0.01em] text-vxn-ink">{title}</h2>
    {children && <p className="m-0 text-sm leading-6 text-vxn-fg-3">{children}</p>}
  </div>
);

const getTimelineDotClass = (type) => {
  if (type === 'stop') return 'bg-vxn-saffron-600';
  if (type === 'end') return 'bg-vxn-teal-900';
  return 'bg-vxn-teal-700';
};

const TimelinePoint = ({ type, time, city, address, meta, isLast = false }) => (
  <div className="grid grid-cols-[86px_20px_1fr] gap-4">
    <div>
      <div className="text-xl font-bold text-vxn-ink">{time ? dayjs(time).format('HH:mm') : '--:--'}</div>
      <div className="text-xs text-vxn-fg-5">{time ? dayjs(time).format('DD/MM') : '--/--'}</div>
    </div>
    <div className="relative flex justify-center">
      <span
        className={`relative z-10 mt-1 h-3.5 w-3.5 rounded-full ${getTimelineDotClass(type)}`}
      />
      {!isLast && <span className="absolute top-4 h-full w-px bg-vxn-border-strong" />}
    </div>
    <div className={isLast ? 'pb-0' : 'pb-6'}>
      {meta && <div className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-vxn-fg-5">{meta}</div>}
      <div className="font-semibold text-vxn-ink">{city}</div>
      <div className="mt-1 text-sm leading-6 text-vxn-fg-3">{address}</div>
    </div>
  </div>
);

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { setSelectedTrip } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [detailResponse, seatsResponse] = await Promise.all([
          getTripDetails(tripId),
          getAvailableSeats(tripId).catch(() => null),
        ]);
        if (!active) return;

        if (detailResponse.status === 'success' && detailResponse.data?.trip) {
          const availability = extractSeatAvailability(seatsResponse);
          const nextTrip = mergeSeatAvailabilityIntoTrip(detailResponse.data.trip, availability);
          setTrip(nextTrip);
          setSelectedTrip(nextTrip);
        } else {
          toast.error('Không tìm thấy thông tin chuyến xe');
          navigate('/trips');
        }
      } catch (error) {
        toast.error(typeof error === 'string' ? error : 'Có lỗi xảy ra khi tải chuyến xe');
        navigate('/trips');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [navigate, setSelectedTrip, tripId]);

  const view = useMemo(() => (trip ? normalizeTrip(trip) : null), [trip]);

  const handleContinue = () => {
    setSelectedTrip(trip);
    navigate(`/booking/seats/${tripId}`);
  };

  if (loading) {
    return (
      <CustomerShell activeKey="buy" mainClassName="bg-vxn-bg-soft">
        <div className="grid min-h-screen place-items-center">
          <div className="text-center">
            <Spin size="large" />
            <div className="mt-4 text-sm font-medium text-vxn-fg-3">Đang tải thông tin chuyến xe...</div>
          </div>
        </div>
      </CustomerShell>
    );
  }

  if (!view) {
    return (
      <CustomerShell activeKey="buy" mainClassName="bg-vxn-bg-soft">
        <div className="grid min-h-screen place-items-center px-4">
          <Empty description="Không tìm thấy chuyến xe" />
        </div>
      </CustomerShell>
    );
  }

  const timelineItems = [
    {
      key: 'origin',
      type: 'start',
      time: view.departureTime,
      city: view.route.fromCity,
      address: view.route.fromAddress,
      meta: 'Khởi hành',
    },
    ...view.route.stops.map((stop, index) => ({
      key: getEntityId(stop) || `${stop.name || stop.address}-${index}`,
      type: 'stop',
      time: getStopTimeValue(view.departureTime, stop),
      city: getStopTitle(stop, `Điểm dừng ${index + 1}`),
      address: getStopAddress(stop) || 'Địa chỉ đang cập nhật',
      meta: stop.stopDuration
        ? `Điểm dừng ${index + 1} · dừng ${stop.stopDuration} phút`
        : `Điểm dừng ${index + 1}`,
    })),
    {
      key: 'destination',
      type: 'end',
      time: view.arrivalTime,
      city: view.route.toCity,
      address: view.route.toAddress,
      meta: 'Đến nơi dự kiến',
    },
  ];
  const originMapEndpoint = getRouteMapEndpoint(
    view.route.origin,
    view.route.pickupPoints,
    'first'
  );
  const destinationMapEndpoint = getRouteMapEndpoint(
    view.route.destination,
    view.route.dropoffPoints,
    'last'
  );
  const routeMapPoints = [
    toRouteMapPoint(originMapEndpoint, {
      key: 'origin-map',
      type: 'start',
      fallbackLabel: view.route.origin?.station || view.route.fromCity,
      fallbackAddress: view.route.fromAddress,
      fallbackCity: view.route.fromCity,
    }),
    ...view.route.stops.map((stop, index) => ({
      key: getEntityId(stop) || `stop-map-${index + 1}`,
      type: 'stop',
      label: getStopTitle(stop, `Điểm dừng ${index + 1}`),
      address: getStopAddress(stop) || stop?.address,
      coordinates: stop?.coordinates,
    })),
    toRouteMapPoint(destinationMapEndpoint, {
      key: 'destination-map',
      type: 'end',
      fallbackLabel: view.route.destination?.station || view.route.toCity,
      fallbackAddress: view.route.toAddress,
      fallbackCity: view.route.toCity,
    }),
  ];

  return (
    <CustomerShell activeKey="buy" mainClassName="bg-vxn-bg-soft">
      <div className="sticky top-16 z-30 border-b border-vxn-border bg-white px-4 py-4 shadow-sm lg:top-0 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CustomerBreadcrumb
            items={[
              { label: 'Tìm chuyến', to: '/trips' },
              { label: `${view.route.fromCity} → ${view.route.toCity}` },
            ]}
          />
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-[20px] border border-vxn-border bg-white shadow-sm">
              <div className="relative min-h-[260px] bg-[linear-gradient(135deg,#07364C_0%,#006481_55%,#E89B26_140%)] p-6 text-white lg:p-8">
                <div className="pointer-events-none absolute right-[-80px] top-[-120px] h-80 w-80 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute bottom-[-120px] right-[120px] h-72 w-72 rounded-full bg-vxn-saffron-500/25" />
                <div className="relative z-10 flex min-h-[210px] flex-col justify-between gap-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/85">
                        <CalendarOutlined /> {formatDateTime(view.departureTime)}
                      </div>
                      <h1 className="m-0 max-w-2xl text-3xl font-bold tracking-[-0.03em] lg:text-4xl">
                        {view.route.fromCity} → {view.route.toCity}
                      </h1>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/78">
                        {view.route.name}{view.route.code ? ` · ${view.route.code}` : ''} · {view.bus.busType || 'Xe khách'} · {view.duration}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/12 px-4 py-3 text-right backdrop-blur">
                      <div className="text-xs uppercase tracking-[0.08em] text-white/70">Giá từ</div>
                      <div className="mt-1 text-3xl font-bold text-vxn-saffron-500">{formatCurrency(view.pricing.finalPrice)}</div>
                      <div className="text-xs text-white/70">/ vé · đã gồm thuế</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white/12 p-4 backdrop-blur">
                      <ClockCircleOutlined className="mb-2 text-lg text-vxn-saffron-500" />
                      <div className="text-xs text-white/70">Thời lượng</div>
                      <div className="font-semibold">{view.duration}</div>
                    </div>
                    <div className="rounded-xl bg-white/12 p-4 backdrop-blur">
                      <CarOutlined className="mb-2 text-lg text-vxn-saffron-500" />
                      <div className="text-xs text-white/70">Dòng xe</div>
                      <div className="font-semibold">{view.bus.busType || 'Đang cập nhật'}</div>
                    </div>
                    <div className="rounded-xl bg-white/12 p-4 backdrop-blur">
                      <SafetyCertificateOutlined className="mb-2 text-lg text-vxn-saffron-500" />
                      <div className="text-xs text-white/70">Ghế trống</div>
                      <div className="font-semibold">{view.seats.available}/{view.seats.total} chỗ</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <InfoCard>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-vxn-teal-700 text-xl font-bold text-white">
                    {getInitials(view.operator.operatorName)}
                  </span>
                  <div>
                    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-vxn-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-vxn-teal-800">
                      <CheckCircleOutlined /> Nhà xe đối tác
                    </div>
                    <h2 className="m-0 text-xl font-bold text-vxn-ink">{view.operator.operatorName}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-vxn-fg-3">
                      <span className="inline-flex items-center gap-1.5">
                        <StarFilled className="text-vxn-saffron-600" />
                        <strong className="text-vxn-ink">{Number(view.operator.ratingAverage || 0).toFixed(1)}</strong>
                        ({Number(view.operator.ratingTotal || 0).toLocaleString('vi-VN')} đánh giá)
                      </span>
                      {view.operator.phone && <span className="inline-flex items-center gap-1.5"><PhoneOutlined /> {view.operator.phone}</span>}
                      {view.operator.email && <span className="inline-flex items-center gap-1.5"><MailOutlined /> {view.operator.email}</span>}
                    </div>
                  </div>
                </div>
                {view.operator.id && (
                  <Button onClick={() => navigate(`/operators/${view.operator.id}`)}>
                    Xem trang nhà xe
                  </Button>
                )}
              </div>
            </InfoCard>

            <InfoCard>
              <SectionTitle eyebrow="Lộ trình" title="Thời gian và điểm dừng">
                {view.route.stops.length > 0
                  ? `Theo dõi đầy đủ ${view.route.stops.length} điểm dừng trung gian của chuyến xe.`
                  : 'Theo dõi mốc khởi hành, điểm đến và thời lượng dự kiến của chuyến xe.'}
              </SectionTitle>
              <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <RouteMiniMap
                  points={routeMapPoints}
                  title="Bản đồ lộ trình"
                  subtitle={`${view.route.fromCity} → ${view.route.toCity}`}
                  heightClassName="h-[280px]"
                />
                <div className="rounded-2xl bg-vxn-bg-soft p-5">
                  {timelineItems.map((item, index) => (
                    <TimelinePoint
                      key={item.key}
                      type={item.type}
                      time={item.time}
                      city={item.city}
                      address={item.address}
                      meta={item.meta}
                      isLast={index === timelineItems.length - 1}
                    />
                  ))}
                </div>
              </div>
            </InfoCard>

            <InfoCard>
              <SectionTitle eyebrow="Tiện nghi" title="Thông tin xe">
                {view.bus.busNumber ? `Biển số ${view.bus.busNumber}` : 'Thông tin phương tiện sẽ được nhà xe cập nhật trước giờ chạy.'}
              </SectionTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-vxn-bg-soft p-4">
                  <div className="text-xs text-vxn-fg-5">Loại xe</div>
                  <div className="mt-1 font-semibold text-vxn-ink">{view.bus.busType || 'Đang cập nhật'}</div>
                </div>
                <div className="rounded-xl bg-vxn-bg-soft p-4">
                  <div className="text-xs text-vxn-fg-5">Số ghế</div>
                  <div className="mt-1 font-semibold text-vxn-ink">{view.seats.total} ghế</div>
                </div>
                <div className="rounded-xl bg-vxn-bg-soft p-4">
                  <div className="text-xs text-vxn-fg-5">Còn trống</div>
                  <div className="mt-1 font-semibold text-vxn-ink">{view.seats.available} ghế</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {view.bus.amenities.length > 0 ? view.bus.amenities.map((amenity) => (
                  <span key={amenity} className="inline-flex items-center gap-1.5 rounded-full bg-vxn-teal-50 px-3 py-1.5 text-sm font-medium text-vxn-teal-900">
                    <SafetyCertificateOutlined className="text-xs" /> {getAmenityLabel(amenity)}
                  </span>
                )) : <span className="text-sm text-vxn-fg-4">Tiện nghi đang được cập nhật.</span>}
              </div>
            </InfoCard>

            <InfoCard>
              <SectionTitle eyebrow="Chính sách" title="Lưu ý trước khi đặt" />
              <div className="grid gap-3 sm:grid-cols-2">
                {defaultPolicyItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl bg-vxn-bg-soft p-4">
                    <CheckCircleOutlined className="mt-0.5 text-vxn-teal-700" />
                    <span className="text-sm font-medium leading-6 text-vxn-ink">{item}</span>
                  </div>
                ))}
              </div>
              {(view.policies || view.cancellationPolicy || view.notes) && (
                <div className="mt-4 space-y-3 border-t border-vxn-border pt-4 text-sm leading-6 text-vxn-fg-2">
                  {view.policies && <p className="m-0 whitespace-pre-line">{view.policies}</p>}
                  {view.cancellationPolicy && <p className="m-0 whitespace-pre-line">{view.cancellationPolicy}</p>}
                  {view.notes && <p className="m-0 whitespace-pre-line">{view.notes}</p>}
                </div>
              )}
            </InfoCard>

            <InfoCard>
              <SectionTitle eyebrow="Đánh giá" title="Trải nghiệm hành khách" />
              <ReviewsSection tripId={tripId} />
            </InfoCard>
          </div>

          <aside className="xl:sticky xl:top-[88px] xl:self-start">
            <div className="overflow-hidden rounded-[18px] border border-vxn-border bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]">
              <div className="border-b border-vxn-border bg-vxn-teal-900 px-5 py-4 text-white">
                <div className="text-xs uppercase tracking-[0.08em] text-white/65">Tóm tắt chuyến</div>
                <div className="mt-1 text-lg font-bold">{view.route.fromCity} → {view.route.toCity}</div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <div className="text-xs text-vxn-fg-5">Giá vé</div>
                  <div className="mt-1 text-3xl font-bold text-vxn-saffron-700">{formatCurrency(view.pricing.finalPrice)}</div>
                  {view.pricing.discount > 0 && (
                    <div className="mt-1 text-xs text-vxn-fg-5">
                      Giá gốc <span className="line-through">{formatCurrency(view.pricing.basePrice)}</span> · giảm {view.pricing.discount}%
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-vxn-bg-soft p-3 text-sm">
                  <div>
                    <div className="text-xs text-vxn-fg-5">Khởi hành</div>
                    <div className="font-semibold text-vxn-ink">{formatDateTime(view.departureTime)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-vxn-fg-5">Đến nơi</div>
                    <div className="font-semibold text-vxn-ink">{formatDateTime(view.arrivalTime)}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-vxn-fg-2">
                  <div className="flex items-start gap-2">
                    <ClockCircleOutlined className="mt-1 text-vxn-teal-700" />
                    <span>Thời lượng dự kiến · {view.duration}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CarOutlined className="mt-1 text-vxn-teal-700" />
                    <span>{view.bus.busType || 'Đang cập nhật loại xe'} · {view.seats.available}/{view.seats.total} ghế trống</span>
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  className="h-12 rounded-md border-0 bg-vxn-teal-700 font-semibold hover:!bg-vxn-teal-800"
                  onClick={handleContinue}
                >
                  Đặt vé · Chọn ghế
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-vxn-fg-5">
                  <CheckCircleOutlined className="text-vxn-teal-700" /> Chọn ghế và điểm đón ở bước tiếp theo
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </CustomerShell>
  );
};

export default TripDetailPage;
