import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Modal, Spin, message } from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  PhoneOutlined,
  PrinterOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBookingByCode, cancelBooking, cancelBookingGuest } from '../services/bookingApi';
import api from '../services/api';
import useBookingStore from '../store/bookingStore';
import useAuthStore from '../store/authStore';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import RouteMiniMap from '../components/customer/RouteMiniMap';
import SaffronTicketCard from '../components/customer/SaffronTicketCard';
import { getOperatorDisplayName } from '../utils/operatorDisplay';

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const formatTime = (value) => (value ? dayjs(value).format('HH:mm') : '--:--');
const formatDateLong = (value) => (value ? dayjs(value).format('dddd · DD/MM/YYYY') : '—');
const formatDateTime = (value) => (value ? dayjs(value).format('HH:mm · DD/MM/YYYY') : '—');

const getEntityId = (entity) => {
  if (!entity || typeof entity !== 'object') return entity;
  return entity.id || Reflect.get(entity, '_id');
};

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} giờ ${m} phút`;
  if (h) return `${h} giờ`;
  return `${m} phút`;
};

const paymentMethodLabel = (method) => {
  switch (method) {
    case 'vnpay':
      return 'VNPay';
    case 'momo':
      return 'Ví MoMo';
    case 'zalopay':
      return 'ZaloPay';
    case 'cash':
      return 'Tiền mặt khi lên xe';
    default:
      return method ? method.toUpperCase() : '—';
  }
};

const normalizeMapCoordinates = (coords) => {
  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng ?? coords?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const googleMapsDirectionsLink = (coords, address) => {
  const point = normalizeMapCoordinates(coords);
  const destination = point ? `${point.lat},${point.lng}` : address;
  if (!destination) return null;

  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const osmPickupMap = (coords, queryText) => {
  const point = normalizeMapCoordinates(coords);
  if (!point) {
    return queryText
      ? {
          link: `https://www.openstreetmap.org/search?query=${encodeURIComponent(queryText)}`,
          embed: null,
        }
      : { link: null, embed: null };
  }

  const delta = 0.006;
  const bbox = [
    point.lng - delta,
    point.lat - delta,
    point.lng + delta,
    point.lat + delta,
  ]
    .map((value) => value.toFixed(6))
    .join(',');

  return {
    link: `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=17/${point.lat}/${point.lng}`,
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox
    )}&layer=mapnik&marker=${point.lat}%2C${point.lng}`,
  };
};

const Card = ({ title, icon: Icon, children, className = '' }) => (
  <section className={`rounded-2xl border border-vxn-border bg-white p-6 ${className}`}>
    {title && (
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && <Icon style={{ fontSize: 18, color: '#00506A' }} />}
        <h3 className="m-0 text-[15px] font-semibold text-vxn-ink">{title}</h3>
      </div>
    )}
    {children}
  </section>
);

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-3">
    <dt className="text-vxn-fg-5">{label}</dt>
    <dd className="m-0 text-right font-medium text-vxn-ink">{children}</dd>
  </div>
);

const BookingConfirmationPage = () => {
  const { bookingCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetBooking } = useBookingStore();
  const { user, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [ticket, setTicket] = useState(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const phoneParam = searchParams.get('phone') || user?.phone;
  const emailParam = searchParams.get('email') || user?.email;

  const loadBooking = async () => {
    const response = await getBookingByCode(bookingCode, {
      phone: phoneParam || undefined,
      email: emailParam || undefined,
    });
    if ((response.success || response.status === 'success') && response.data) {
      return response.data.booking || response.data;
    }
    return null;
  };

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await loadBooking();
        if (data) setBooking(data);
      } catch (error) {
        console.error('Fetch booking error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingCode) {
      fetchBooking();
    } else {
      setLoading(false);
    }

    resetBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingCode]);

  useEffect(() => {
    const fetchTicket = async () => {
      const bookingId = getEntityId(booking);
      if (!bookingId) return;
      try {
        const response = await api.get(`/tickets/booking/${bookingId}`);
        if (response.success && response.data?.ticket) {
          setTicket(response.data.ticket);
        }
      } catch (error) {
        console.error('Failed to fetch ticket:', error);
      }
    };
    fetchTicket();
  }, [booking]);

  if (loading) {
    return (
      <CustomerShell activeKey="tickets">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <p className="text-[14px] text-vxn-fg-3">Đang tải thông tin vé...</p>
        </div>
      </CustomerShell>
    );
  }

  if (!booking) {
    return (
      <CustomerShell activeKey="tickets">
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-vxn-border bg-white p-8 text-center">
            <h2 className="m-0 text-[20px] font-semibold text-vxn-ink">
              Không tìm thấy thông tin đặt vé
            </h2>
            <p className="mt-2 text-[13px] text-vxn-fg-3">
              Mã đặt vé không tồn tại hoặc đã bị xoá. Vui lòng kiểm tra lại.
            </p>
            <Button type="primary" size="large" className="mt-5" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
          </div>
        </div>
      </CustomerShell>
    );
  }

  // ---- Derive display data from the populated booking ----
  const trip = booking?.tripId || {};
  const route = trip?.routeId || {};
  const origin = route?.origin || {};
  const destination = route?.destination || {};

  const fromCity =
    origin.city || booking?.pickupPoint?.name || booking?.tripInfo?.origin?.city || 'Điểm đi';
  const toCity =
    destination.city ||
    booking?.dropoffPoint?.name ||
    booking?.tripInfo?.destination?.city ||
    'Điểm đến';

  const depTime = trip?.departureTime || booking?.tripInfo?.departureTime;
  const arrTime = trip?.arrivalTime || booking?.tripInfo?.arrivalTime;

  const fromStation = origin.station || booking?.pickupPoint?.name || fromCity;
  const fromAddress = booking?.pickupPoint?.address || origin.address || '';
  const toStation = destination.station || booking?.dropoffPoint?.name || toCity;
  const toAddress = booking?.dropoffPoint?.address || destination.address || '';

  const durationMin =
    trip?.duration || (depTime && arrTime ? dayjs(arrTime).diff(dayjs(depTime), 'minute') : 0);
  const durationText = formatDuration(durationMin);

  const operator = booking?.operatorId || {};
  const operatorName =
    getOperatorDisplayName(operator, '') ||
    getOperatorDisplayName(trip?.operatorId, 'Nhà xe');
  const operatorPhone = operator.phone || '';
  const operatorEmail = operator.email || '';

  const code = booking?.bookingCode || ticket?.ticketCode || '—';

  let rawSeats = booking?.seats;
  if (!rawSeats || rawSeats.length === 0) rawSeats = booking?.seatNumbers || ticket?.seatNumbers;
  if (!rawSeats || rawSeats.length === 0) rawSeats = ticket?.passengers?.map((p) => p.seatNumber);
  const seats = Array.isArray(rawSeats) ? rawSeats : [];
  const seatLabel =
    seats
      .map((s) => s?.seatNumber || s)
      .filter(Boolean)
      .join(', ') || '—';

  const totalPrice = booking?.totalPrice ?? booking?.finalPrice ?? 0;
  const finalPrice = booking?.finalPrice ?? totalPrice;
  const discount = (booking?.discount || 0) + (booking?.voucherDiscount || 0);

  const isCancelled = booking?.status === 'cancelled';
  const isPaid = booking?.paymentStatus === 'paid';
  const isCash = booking?.paymentMethod === 'cash';
  const canCancel = booking?.canBeCancelled && !isCancelled;

  const payStatusText = isPaid
    ? 'Đã thanh toán'
    : 'Chưa thanh toán';
  const paymentStatusText = isCash && !isPaid ? 'Thanh toán tiền mặt khi lên xe' : payStatusText;

  const pickupCoordinates = booking?.pickupPoint?.coordinates || origin.coordinates;
  const dropoffCoordinates = booking?.dropoffPoint?.coordinates || destination.coordinates;
  const pickupDirectionsLink = googleMapsDirectionsLink(
    pickupCoordinates,
    fromAddress || fromStation
  );
  const pickupMap = osmPickupMap(pickupCoordinates, fromAddress || fromStation);
  const pickupDropoffMapPoints = [
    {
      key: 'booking-pickup-map',
      type: 'start',
      label: fromStation,
      address: fromAddress || fromCity,
      city: fromCity,
      coordinates: pickupCoordinates,
    },
    {
      key: 'booking-dropoff-map',
      type: 'end',
      label: toStation,
      address: toAddress || toCity,
      city: toCity,
      coordinates: dropoffCoordinates,
    },
  ];

  const handleShare = async () => {
    const shareData = {
      title: `Vé Xe Nhanh · ${fromCity} → ${toCity}`,
      text: `Vé ${code} · ${fromCity} → ${toCity} · ${formatDateLong(depTime)}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        message.success('Đã sao chép liên kết vé vào bộ nhớ tạm');
      }
    } catch {
      /* user dismissed the share sheet — no action needed */
    }
  };

  const handleCancel = async () => {
    const bookingId = getEntityId(booking);
    if (!bookingId) return;
    setCancelling(true);
    try {
      const contactEmail = booking?.contactInfo?.email;
      const contactPhone = booking?.contactInfo?.phone || phoneParam;
      if (!isAuthenticated && contactEmail && contactPhone) {
        await cancelBookingGuest({
          bookingId,
          email: contactEmail,
          phone: contactPhone,
          reason: cancelReason,
        });
      } else {
        await cancelBooking(bookingId, cancelReason);
      }
      message.success('Đã gửi yêu cầu huỷ vé. Tiền hoàn (nếu có) xử lý theo chính sách nhà xe.');
      setCancelOpen(false);
      setCancelReason('');
      const refreshed = await loadBooking();
      if (refreshed) setBooking(refreshed);
    } catch (error) {
      message.error(typeof error === 'string' ? error : 'Không thể huỷ vé. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <CustomerShell activeKey="tickets">
      <div className="border-b border-vxn-border bg-white">
        <div className="px-4 pt-6 lg:px-8">
          <CustomerBreadcrumb
            className="mb-4"
            items={[
              { label: 'Vé của tôi', to: '/my-tickets' },
              { label: `${fromCity} → ${toCity}` },
            ]}
          />

          <div className="flex flex-wrap items-end justify-between gap-3 pb-5">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate('/my-tickets')}
                className="mb-2 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-medium text-vxn-fg-3 hover:text-vxn-teal-700"
              >
                <ArrowLeftOutlined style={{ fontSize: 12 }} /> Quay lại danh sách vé
              </button>
              <h1 className="m-0 text-[26px] font-semibold tracking-tight text-vxn-ink">
                Vé · {fromCity} → {toCity}
              </h1>
              <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                {formatDateLong(depTime)} · {formatTime(depTime)} → {formatTime(arrTime)} · Mã{' '}
                <span className="font-mono font-semibold text-vxn-ink">{code}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
                className="!h-10 !rounded-lg"
              >
                In / Lưu PDF
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                className="!h-10 !rounded-lg"
              >
                Chia sẻ
              </Button>
              {canCancel && (
                <Button danger onClick={() => setCancelOpen(true)} className="!h-10 !rounded-lg">
                  Huỷ vé
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto grid max-w-[108rem] gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="flex min-w-0 flex-col gap-5 ">
            {isCancelled && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                Vé này đã bị huỷ. Nếu cần hỗ trợ hoàn tiền, vui lòng liên hệ nhà xe hoặc tổng đài Vé
                Xe Nhanh.
              </div>
            )}

            <SaffronTicketCard booking={booking} ticket={ticket} />

            {/* Itinerary timeline */}
            <Card title="Hành trình chi tiết" icon={EnvironmentOutlined}>
              <div className="flex flex-col">
                {[
                  {
                    time: formatTime(depTime),
                    title: `Khởi hành · ${fromCity}`,
                    sub: [fromStation, fromAddress].filter(Boolean).join(' · '),
                    solid: true,
                  },
                  {
                    time: formatTime(arrTime),
                    title: `Đến nơi · ${toCity}`,
                    sub: [toStation, toAddress].filter(Boolean).join(' · '),
                    solid: true,
                  },
                ].map((s, i, arr) => {
                  const last = i === arr.length - 1;
                  return (
                    <div key={s.title} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className="h-4 w-4 rounded-full border-2"
                          style={{
                            borderColor: '#E89B26',
                            background: s.solid ? '#E89B26' : '#fff',
                          }}
                        />
                        {!last && (
                          <span
                            className="my-1 w-0.5 flex-1 bg-vxn-bg-fog"
                            style={{ minHeight: 40 }}
                          />
                        )}
                      </div>
                      <div className={`min-w-0 ${last ? '' : 'pb-5'}`}>
                        <div className="flex flex-wrap items-baseline gap-x-2.5">
                          <span className="text-[14px] font-bold text-vxn-ink">{s.time}</span>
                          <span className="text-[14px] font-medium text-vxn-ink">{s.title}</span>
                        </div>
                        {s.sub && (
                          <div className="mt-0.5 text-[12.5px] leading-relaxed text-vxn-fg-5">
                            {s.sub}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {durationText && (
                <div className="mt-3 flex items-center gap-2 border-t border-dashed border-vxn-border pt-3 text-[12.5px] text-vxn-fg-3">
                  <ClockCircleOutlined style={{ fontSize: 14, color: '#94a3b8' }} />
                  Tổng thời gian di chuyển dự kiến:{' '}
                  <strong className="text-vxn-ink">{durationText}</strong>
                </div>
              )}
            </Card>

            {/* Passenger & payment — real data */}
            <Card title="Hành khách & Thanh toán">
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <dl className="space-y-3 text-[13.5px]">
                  <Row label="Người đặt">{booking?.contactInfo?.name || '—'}</Row>
                  <Row label="Điện thoại">{booking?.contactInfo?.phone || '—'}</Row>
                  <Row label="Email">
                    <span className="break-all">{booking?.contactInfo?.email || '—'}</span>
                  </Row>
                  <Row label="Ghế đã đặt">
                    <span className="font-semibold text-[#A8741A]">{seatLabel}</span>
                  </Row>
                </dl>
                <dl className="space-y-3 text-[13.5px]">
                  <Row label="Phương thức">{paymentMethodLabel(booking?.paymentMethod)}</Row>
                  <div className="flex justify-between gap-3">
                    <dt className="text-vxn-fg-5">Trạng thái</dt>
                    <dd
                      className={`m-0 text-right font-semibold ${
                        isPaid ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {paymentStatusText}
                    </dd>
                  </div>
                  <Row label="Thời điểm đặt">{formatDateTime(booking?.createdAt)}</Row>
                  {booking?.paidAt && (
                    <Row label="Thanh toán lúc">{formatDateTime(booking.paidAt)}</Row>
                  )}
                </dl>
              </div>

              <div className="mt-5 border-t border-vxn-border pt-4">
                <div className="flex justify-between text-[13.5px]">
                  <span className="text-vxn-fg-5">Giá vé ({seats.length || 1} ghế)</span>
                  <span className="font-medium text-vxn-ink">{formatCurrency(totalPrice)}</span>
                </div>
                {discount > 0 && (
                  <div className="mt-2 flex justify-between text-[13.5px] text-emerald-600">
                    <span>Giảm giá</span>
                    <span>−{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3">
                  <span className="text-[14px] font-medium text-vxn-ink">
                    {isPaid ? 'Tổng đã thanh toán' : 'Tổng cần thanh toán'}
                  </span>
                  <span className="text-[20px] font-bold text-[#A8741A]">
                    {formatCurrency(finalPrice)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Boarding rules — honest general guidance */}
            <Card title="Quy định lên xe">
              <ul className="m-0 list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-vxn-fg-2">
                <li>
                  Có mặt tại điểm đón trước giờ khởi hành ít nhất <strong>20 phút</strong>.
                </li>
                <li>Mang theo CMND/CCCD trùng với thông tin trên vé.</li>
                <li>Xuất trình mã đặt vé hoặc mã QR cho nhân viên khi lên xe.</li>
                <li>Hành lý xách tay gọn nhẹ theo quy định của nhà xe.</li>
                <li>Liên hệ nhà xe nếu cần hỗ trợ đổi hoặc huỷ trước giờ khởi hành.</li>
              </ul>
            </Card>
          </div>

          {/* Right column */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <Card title="Liên hệ nhà xe" icon={PhoneOutlined} className="!p-5">
              <div className="space-y-2 text-[12.5px] leading-5 text-vxn-fg-2">
                <div className="text-[13.5px] font-semibold text-vxn-ink">{operatorName}</div>
                {operatorPhone && (
                  <div>
                    Hotline:{' '}
                    <a
                      href={`tel:${operatorPhone}`}
                      className="font-semibold text-vxn-teal-700 hover:underline"
                    >
                      {operatorPhone}
                    </a>
                  </div>
                )}
                {operatorEmail && (
                  <div className="break-all">
                    Email:{' '}
                    <a
                      href={`mailto:${operatorEmail}`}
                      className="font-medium text-vxn-teal-700 hover:underline"
                    >
                      {operatorEmail}
                    </a>
                  </div>
                )}
                {!operatorPhone && !operatorEmail && (
                  <div className="text-vxn-fg-5">
                    Nhà xe chưa cập nhật thông tin liên hệ trực tiếp.
                  </div>
                )}
              </div>
              {operatorPhone && (
                <a
                  href={`tel:${operatorPhone}`}
                  className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-vxn-border bg-white text-[13px] font-medium text-vxn-ink transition hover:border-vxn-teal-700 hover:text-vxn-teal-700"
                >
                  <PhoneOutlined /> Gọi nhà xe
                </a>
              )}
            </Card>

            <Card title="Điểm đón" icon={EnvironmentOutlined} className="!p-5">
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-vxn-fg-5">
                    Điểm đón
                  </div>
                  <div className="mt-1 text-[13.5px] font-semibold text-vxn-ink">{fromStation}</div>
                  {fromAddress && (
                    <div className="mt-0.5 text-[12.5px] leading-relaxed text-vxn-fg-3">
                      {fromAddress}
                    </div>
                  )}
                  {pickupDirectionsLink && (
                    <a
                      href={pickupDirectionsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex h-8 items-center gap-2 rounded-lg border border-vxn-border bg-white px-2.5 text-[12.5px] font-medium text-vxn-ink transition hover:border-vxn-teal-700 hover:text-vxn-teal-700"
                    >
                      <EnvironmentOutlined /> Chỉ đường
                    </a>
                  )}
                </div>
                <div>
                  {pickupMap.embed ? (
                    <div className="aspect-square overflow-hidden rounded-xl border border-vxn-border bg-vxn-bg-soft">
                      <iframe
                        title="Bản đồ điểm đón"
                        src={pickupMap.embed}
                        className="h-full w-full border-0"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <RouteMiniMap
                      points={pickupDropoffMapPoints}
                      title="Bản đồ lộ trình"
                      subtitle={`${fromCity} → ${toCity}`}
                      className="!rounded-xl"
                      heightClassName="aspect-square"
                      compact
                    />
                  )}
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/my-tickets')} className="!h-11 !rounded-lg" block>
                Vé của tôi
              </Button>
              <Button
                type="primary"
                icon={<HomeOutlined />}
                onClick={() => navigate('/')}
                className="!h-11 !rounded-lg"
                style={{ background: '#036672', borderColor: '#036672' }}
                block
              >
                Về trang chủ
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        title="Huỷ vé"
        open={cancelOpen}
        onOk={handleCancel}
        onCancel={() => {
          setCancelOpen(false);
          setCancelReason('');
        }}
        okText="Xác nhận huỷ"
        cancelText="Đóng"
        okButtonProps={{ danger: true, loading: cancelling }}
        centered
      >
        <div className="flex flex-col gap-4 pt-1">
          <p className="m-0 text-[14px] text-vxn-ink">Bạn có chắc chắn muốn huỷ vé này?</p>
          <div className="rounded-lg bg-vxn-bg-mist p-4 text-[13px]">
            <div className="flex justify-between">
              <span className="text-vxn-fg-5">Mã đặt vé</span>
              <span className="font-mono font-semibold text-vxn-ink">{code}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-vxn-fg-5">Tuyến</span>
              <span className="font-medium text-vxn-ink">
                {fromCity} → {toCity}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-vxn-fg-5">Khởi hành</span>
              <span className="font-medium text-vxn-ink">{formatDateTime(depTime)}</span>
            </div>
          </div>
          <div>
            <div id="cancel-reason-label" className="mb-2 block text-[13px] font-medium text-vxn-ink">
              Lý do huỷ vé (không bắt buộc)
            </div>
            <Input.TextArea
              id="cancel-reason"
              aria-labelledby="cancel-reason-label"
              rows={3}
              placeholder="Ví dụ: thay đổi lịch trình..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-[12.5px] text-amber-900">
            <p className="m-0 font-semibold">Lưu ý:</p>
            <p className="m-0 mt-1">
              Mức hoàn tiền phụ thuộc vào thời điểm huỷ và chính sách của nhà xe. Vé đã khởi hành
              không thể huỷ.
            </p>
          </div>
        </div>
      </Modal>
    </CustomerShell>
  );
};

export default BookingConfirmationPage;
