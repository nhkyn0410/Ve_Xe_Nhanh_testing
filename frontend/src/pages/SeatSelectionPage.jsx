import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Empty, Spin, message } from 'antd';
import {
  ArrowLeftOutlined,
  CarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import SeatMapComponent from '../components/SeatMapComponent';
import { getAvailableSeats, getTripDetails } from '../services/bookingApi';
import useBookingStore from '../store/bookingStore';
import { getOperatorDisplayName } from '../utils/operatorDisplay';
import { extractSeatAvailability, mergeSeatAvailabilityIntoTrip } from '../utils/seatAvailability';

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatDateTime = (value) => (value ? dayjs(value).format('HH:mm · DD/MM/YYYY') : 'Đang cập nhật');

const formatDuration = (departureTime, arrivalTime) => {
  if (!departureTime || !arrivalTime) return 'Đang cập nhật';
  const diff = dayjs(arrivalTime).diff(dayjs(departureTime), 'minute');
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h ${minutes}m`;
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

  return {
    raw: trip,
    id: trip.id || trip._id,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    route: {
      ...route,
      fromCity,
      toCity,
      fromAddress: route.origin?.address || route.origin?.station || fromCity,
      toAddress: route.destination?.address || route.destination?.station || toCity,
      name: route.name || route.routeName || `${fromCity} → ${toCity}`,
      pickupPoints: route.pickupPoints || [],
      dropoffPoints: route.dropoffPoints || [],
    },
    bus,
    operator: {
      ...operator,
      operatorName: getOperatorDisplayName(operator, 'Nhà xe'),
      companyName: operator.companyName || 'Nhà xe',
    },
    duration: typeof trip.duration === 'string'
      ? trip.duration
      : trip.duration?.formatted || formatDuration(trip.departureTime, trip.arrivalTime),
    pricing: {
      basePrice: pricing.basePrice || trip.basePrice || finalPrice,
      finalPrice,
      discount: pricing.discount || trip.discount || 0,
    },
    seats: {
      total: seats.total || trip.totalSeats || 0,
      available: seats.available ?? trip.availableSeats ?? 0,
      bookedSeatNumbers: seats.bookedSeatNumbers || [],
      heldSeatNumbers: seats.heldSeatNumbers || [],
    },
  };
};

const BOOKING_STEPS = [
  { key: 'seats', label: 'Chọn ghế' },
  { key: 'passenger', label: 'Thông tin hành khách' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'done', label: 'Hoàn tất' },
];

const BookingStepper = ({ current = 1 }) => (
  <div className="border-b border-vxn-border bg-white px-4 py-4 lg:px-8">
    <ol className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      {BOOKING_STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < current;
        const active = stepNumber === current;
        return (
          <li key={step.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold ${
                  done || active ? 'bg-vxn-teal-700 text-white' : 'bg-vxn-bg-cloud text-vxn-fg-5'
                }`}
              >
                {done ? <CheckOutlined className="text-[12px]" /> : stepNumber}
              </span>
              <span
                className={`text-sm ${
                  active ? 'font-semibold text-vxn-ink' : done ? 'font-medium text-vxn-fg-2' : 'text-vxn-fg-5'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < BOOKING_STEPS.length - 1 && (
              <span className={`h-px w-10 ${done ? 'bg-vxn-teal-700' : 'bg-vxn-border'}`} />
            )}
          </li>
        );
      })}
    </ol>
  </div>
);

const PointOption = ({ point, selected, onClick, time }) => (
  <button
    type="button"
    className={`w-full rounded-xl border p-4 text-left transition ${
      selected ? 'border-vxn-teal-700 bg-vxn-teal-50 shadow-sm' : 'border-vxn-border bg-white hover:border-vxn-teal-300'
    }`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-vxn-ink">{point.name || point.address || 'Điểm dừng'}</div>
        <div className="mt-1 text-sm leading-5 text-vxn-fg-3">{point.address || point.name}</div>
      </div>
      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-vxn-teal-800 shadow-sm">
        {time ? dayjs(time).format('HH:mm') : '--:--'}
      </span>
    </div>
  </button>
);

const SeatSelectionPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const {
    selectedSeats,
    setSelectedTrip,
    setPickupPoint,
    setDropoffPoint,
    clearSeats,
  } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        clearSeats();
        setSelectedPickup(null);
        setSelectedDropoff(null);

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
          setAvailableSeats(availability?.availableSeatNumbers || []);
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
  }, [tripId]);

  const view = useMemo(() => (trip ? normalizeTrip(trip) : null), [trip]);

  const selectedSeatNumbers = selectedSeats.map((seat) => seat.seatNumber);
  const totalPrice = view ? view.pricing.finalPrice * selectedSeats.length : 0;

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      message.warning('Vui lòng chọn ghế');
      return;
    }
    if (!selectedPickup) {
      message.warning('Vui lòng chọn điểm đón');
      return;
    }
    if (!selectedDropoff) {
      message.warning('Vui lòng chọn điểm trả');
      return;
    }
    setSelectedTrip(trip);
    setPickupPoint(selectedPickup);
    setDropoffPoint(selectedDropoff);
    navigate('/booking/passenger-info');
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

  return (
    <CustomerShell activeKey="buy" mainClassName="bg-vxn-bg-soft">
      <div className="sticky top-16 z-30 bg-white shadow-sm lg:top-0">
        <div className="border-b border-vxn-border bg-white px-4 py-4 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CustomerBreadcrumb
              items={[
                { label: 'Tìm chuyến', to: '/trips' },
                {
                  label: `${view.route.fromCity} → ${view.route.toCity}`,
                  to: `/trips/${tripId}`,
                },
                { label: 'Chọn ghế' },
              ]}
            />
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/trips/${tripId}`)}>
              Quay lại chi tiết chuyến
            </Button>
          </div>
        </div>

        <BookingStepper current={1} />
      </div>

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-vxn-teal-700">Bước 1</span>
                <h2 className="m-0 text-xl font-bold tracking-[-0.01em] text-vxn-ink">Chọn điểm đón và điểm trả</h2>
                <p className="m-0 text-sm leading-6 text-vxn-fg-3">
                  Chọn nơi đón và nơi trả phù hợp với hành trình của bạn.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-3 text-sm font-semibold text-vxn-ink">Điểm đón</div>
                  <div className="space-y-2">
                    {view.route.pickupPoints.length > 0 ? view.route.pickupPoints.map((point, index) => (
                      <PointOption
                        key={`${point.name || point.address}-${index}`}
                        point={point}
                        time={view.departureTime}
                        selected={selectedPickup === point}
                        onClick={() => setSelectedPickup(point)}
                      />
                    )) : (
                      <PointOption
                        point={{ name: view.route.fromCity, address: view.route.fromAddress }}
                        time={view.departureTime}
                        selected={selectedPickup?.address === view.route.fromAddress}
                        onClick={() => setSelectedPickup({ name: view.route.fromCity, address: view.route.fromAddress })}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-vxn-ink">Điểm trả</div>
                  <div className="space-y-2">
                    {view.route.dropoffPoints.length > 0 ? view.route.dropoffPoints.map((point, index) => (
                      <PointOption
                        key={`${point.name || point.address}-${index}`}
                        point={point}
                        time={view.arrivalTime}
                        selected={selectedDropoff === point}
                        onClick={() => setSelectedDropoff(point)}
                      />
                    )) : (
                      <PointOption
                        point={{ name: view.route.toCity, address: view.route.toAddress }}
                        time={view.arrivalTime}
                        selected={selectedDropoff?.address === view.route.toAddress}
                        onClick={() => setSelectedDropoff({ name: view.route.toCity, address: view.route.toAddress })}
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-vxn-teal-700">Bước 2</span>
                  <h2 className="m-0 text-xl font-bold tracking-[-0.01em] text-vxn-ink">Chọn ghế</h2>
                  <p className="m-0 text-sm leading-6 text-vxn-fg-3">
                    Ghế đang giữ hoặc đã bán sẽ không thể chọn.
                  </p>
                </div>
                <div className="text-sm text-vxn-fg-3">
                  Đã chọn:{' '}
                  <strong className="text-vxn-ink">
                    {selectedSeatNumbers.length > 0 ? selectedSeatNumbers.join(', ') : 'Chưa chọn'}
                  </strong>
                </div>
              </div>
              <div className="rounded-2xl border border-vxn-border bg-vxn-bg-soft p-4">
                <SeatMapComponent
                  seatLayout={view.bus.seatLayout}
                  bookedSeats={view.seats.bookedSeatNumbers}
                  heldSeats={view.seats.heldSeatNumbers}
                  availableSeats={availableSeats}
                  seatPrice={view.pricing.finalPrice}
                  showPrice
                />
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-[152px] xl:self-start">
            <div className="overflow-hidden rounded-[18px] border border-vxn-border bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]">
              <div className="border-b border-vxn-border bg-vxn-teal-900 px-5 py-4 text-white">
                <div className="text-xs uppercase tracking-[0.08em] text-white/65">Chuyến đi</div>
                <div className="mt-1 text-lg font-bold">{view.route.fromCity} → {view.route.toCity}</div>
                <div className="mt-1 text-xs text-white/70">
                  {formatDateTime(view.departureTime)} · {view.duration}
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="space-y-2 text-sm text-vxn-fg-2">
                  <div className="flex items-start gap-2">
                    <EnvironmentOutlined className="mt-1 text-vxn-teal-700" />
                    <span>
                      {selectedPickup
                        ? `${selectedPickup.name || view.route.fromCity}${selectedPickup.address ? ` · ${selectedPickup.address}` : ''}`
                        : 'Chưa chọn điểm đón'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <EnvironmentOutlined className="mt-1 text-vxn-saffron-700" />
                    <span>
                      {selectedDropoff
                        ? `${selectedDropoff.name || view.route.toCity}${selectedDropoff.address ? ` · ${selectedDropoff.address}` : ''}`
                        : 'Chưa chọn điểm trả'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ClockCircleOutlined className="mt-1 text-vxn-teal-700" />
                    <span>{formatDateTime(view.arrivalTime)} (dự kiến đến)</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-vxn-border bg-vxn-bg-soft p-4">
                  <div className="mb-3 flex items-center justify-between text-sm font-medium text-vxn-fg-3">
                    <span>Ghế đã chọn ({selectedSeats.length})</span>
                    {selectedSeats.length > 0 && (
                      <button
                        type="button"
                        className="border-0 bg-transparent p-0 text-xs font-medium text-vxn-teal-800"
                        onClick={() => clearSeats()}
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                  {selectedSeats.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSeats.map((seat) => (
                        <div
                          key={seat.seatNumber}
                          className="flex items-center justify-between rounded-lg border border-vxn-border bg-white px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-8 w-8 place-items-center rounded-md bg-vxn-teal-700 text-xs font-semibold text-white">
                              {seat.seatNumber}
                            </span>
                            <span className="text-vxn-fg-2">
                              {seat.floor === 2 ? 'Tầng trên' : 'Tầng dưới'}
                            </span>
                          </div>
                          <span className="font-semibold text-vxn-ink">
                            {formatCurrency(view.pricing.finalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-vxn-border-strong p-4 text-center text-sm text-vxn-fg-5">
                      Chưa chọn ghế nào
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-dashed border-vxn-border-strong p-4">
                  <div className="flex items-center justify-between text-sm text-vxn-fg-3">
                    <span>{selectedSeats.length || 0} vé</span>
                    <span>{formatCurrency(view.pricing.finalPrice)} / vé</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-vxn-border pt-3">
                    <span className="font-semibold text-vxn-ink">Tổng tạm tính</span>
                    <span className="text-xl font-bold text-vxn-saffron-700">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  className="h-12 rounded-md border-0 bg-vxn-teal-700 font-semibold hover:!bg-vxn-teal-800"
                  onClick={handleContinue}
                  disabled={selectedSeats.length === 0}
                >
                  Tiếp tục → Thông tin hành khách
                </Button>
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-vxn-border bg-transparent text-sm font-medium text-vxn-fg-2 transition hover:border-vxn-teal-700 hover:text-vxn-teal-800"
                  onClick={() => navigate('/trips')}
                >
                  <CarOutlined /> Đổi chuyến khác
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </CustomerShell>
  );
};

export default SeatSelectionPage;
