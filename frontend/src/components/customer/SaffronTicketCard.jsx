import { useMemo } from 'react';
import { ArrowRightOutlined, TagOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getOperatorDisplayName } from '../../utils/operatorDisplay';

const formatTime = (value) => (value ? dayjs(value).format('HH:mm') : '--:--');
const formatDate = (value) => {
  if (!value) return '';
  const dateText = dayjs(value).format('dddd · DD/MM/YYYY');
  return dateText.charAt(0).toUpperCase() + dateText.slice(1);
};
const cityOf = (info) =>
  info?.city || info?.station || info?.name || info?.address?.split(',').pop()?.trim() || '';

const SaffronTicketCard = ({ booking = {}, ticket = null, className = '' }) => {
  const trip = booking?.tripId || {};
  const route = trip?.routeId || {};

  const fromCity = useMemo(
    () => cityOf(route?.origin) || booking?.tripInfo?.origin?.city || 'Điểm đi',
    [route, booking]
  );
  const toCity = useMemo(
    () => cityOf(route?.destination) || booking?.tripInfo?.destination?.city || 'Điểm đến',
    [route, booking]
  );

  const departureTime = trip?.departureTime || booking?.tripInfo?.departureTime;
  const arrivalTime = trip?.arrivalTime || booking?.tripInfo?.arrivalTime;

  const seatLabels = useMemo(() => {
    let rawSeats = booking?.seats;
    if (!rawSeats || rawSeats.length === 0) {
      rawSeats = booking?.seatNumbers || ticket?.seatNumbers;
    }
    if (!rawSeats || rawSeats.length === 0) {
      rawSeats = ticket?.passengers?.map((p) => p.seatNumber);
    }
    if (Array.isArray(rawSeats) && rawSeats.length > 0) {
      return rawSeats
        .map((s) => s?.seatNumber || s)
        .filter(Boolean)
        .join(', ');
    }
    return '—';
  }, [booking, ticket]);

  const operatorName =
    getOperatorDisplayName(booking?.operatorId, '') ||
    getOperatorDisplayName(trip?.operatorId, '') ||
    booking?.tripInfo?.operatorName ||
    'Nhà xe';

  const code = booking?.bookingCode || ticket?.ticketCode || '—';

  const plate =
    trip?.busId?.busNumber ||
    trip?.busId?.licensePlate ||
    trip?.busInfo?.busNumber ||
    trip?.busInfo?.licensePlate ||
    booking?.tripInfo?.busNumber ||
    ticket?.tripInfo?.busNumber ||
    booking?.tripInfo?.bus?.busNumber ||
    booking?.tripInfo?.bus?.licensePlate ||
    '—';

  // Honest status — a cash booking that is confirmed is NOT yet paid.
  const cancelled = booking?.status === 'cancelled';
  const paid = booking?.paymentStatus === 'paid';
  const confirmed = booking?.status === 'confirmed';
  const statusChip = cancelled
    ? { label: 'ĐÃ HUỶ', bg: '#C0392B' }
    : paid
      ? { label: 'SẴN SÀNG ĐI', bg: '#1E9E5B' }
      : confirmed
        ? { label: 'ĐÃ XÁC NHẬN', bg: '#0F8458' }
        : { label: 'CHỜ THANH TOÁN', bg: '#475569' };

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] ${className}`}
      style={{
        background: 'linear-gradient(135deg, #FFF6E2 0%, #FFE9C4 60%, #FFD9A0 100%)',
        border: '1px solid #F2C677',
        boxShadow: '0 12px 30px -10px rgba(232,155,38,.4)',
      }}
    >
      <div
        className="pointer-events-none absolute"
        style={{
          top: -60,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(243,177,50,.5), transparent 70%)',
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px]">
        {/* Left content */}
        <div className="relative flex flex-col gap-5 p-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm">
              <TagOutlined style={{ fontSize: 22, color: '#A8741A' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold tracking-[0.06em] text-[#A8741A]">
                VÉ XE NHANH
              </div>
              <div className="text-[12px] text-vxn-fg-3 truncate">Vé chuyến · {operatorName}</div>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide"
              style={{ background: statusChip.bg, color: '#fff' }}
            >
              {statusChip.label}
            </span>
          </div>

          <div>
            <div
              className="font-display tracking-[-0.02em] text-vxn-ink"
              style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}
            >
              {fromCity} <span className="text-[#A8741A]">→</span> {toCity}
            </div>
            <div className="mt-2 text-[17px] font-semibold text-vxn-fg-2">
              {formatDate(departureTime)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div
              className="min-w-[136px] rounded-[10px] bg-white px-8 py-3"
              style={{ border: '1px solid rgba(232,155,38,.3)' }}
            >
              <div className="text-[24px] font-bold leading-none text-vxn-ink">
                {formatTime(departureTime)}
              </div>
            </div>
            <ArrowRightOutlined style={{ fontSize: 20, color: '#A8741A' }} />
            <div
              className="min-w-[136px] rounded-[10px] bg-white px-8 py-3"
              style={{ border: '1px solid rgba(232,155,38,.3)' }}
            >
              <div className="text-[24px] font-bold leading-none text-vxn-ink">
                {formatTime(arrivalTime)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-vxn-fg-2">
            <div>
              <span className="text-vxn-fg-5">Ghế </span>
              <strong className="text-[#A8741A]">{seatLabels}</strong>
            </div>
            <div>
              <span className="text-vxn-fg-5">Mã </span>
              <strong className="font-mono text-vxn-ink">{code}</strong>
            </div>
            <div>
              <span className="text-vxn-fg-5">BS </span>
              <strong className="text-vxn-ink">{plate}</strong>
            </div>
          </div>
        </div>

        {/* Right QR section */}
        <div
          className="relative flex flex-col items-center justify-center gap-2.5 p-6"
          style={{
            background: 'rgba(255,255,255,.7)',
            backdropFilter: 'blur(6px)',
            borderLeft: '2px dashed #E89B26',
          }}
        >
          {/* perforation dots */}
          <span
            className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full"
            style={{ background: '#E89B26' }}
          />
          <span
            className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full"
            style={{ background: '#E89B26' }}
          />

          {ticket?.qrCode ? (
            <div className="rounded-xl bg-white p-3 shadow">
              <img
                src={ticket.qrCode}
                alt="QR Code"
                className="block"
                style={{ width: 180, height: 180 }}
              />
            </div>
          ) : (
            <div
              className="grid h-[180px] w-[180px] place-items-center rounded-xl bg-white text-center text-[12px] text-vxn-fg-4 shadow"
              style={{ border: '1px dashed rgba(232,155,38,.5)' }}
            >
              Mã QR đang được tạo
            </div>
          )}

          <span className="text-center font-mono text-[13px] tracking-[0.06em] text-vxn-ink">
            {code}
          </span>
          <span className="text-center text-[12px] font-medium text-[#A8741A]">Lên xe quét mã</span>
        </div>
      </div>
    </div>
  );
};

export default SaffronTicketCard;
