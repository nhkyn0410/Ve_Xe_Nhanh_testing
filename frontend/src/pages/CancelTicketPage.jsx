import { useEffect, useMemo, useState } from 'react';
import { Button, Input, message, Modal, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MailOutlined,
  PhoneOutlined,
  QrcodeOutlined,
  SearchOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import { cancelBookingGuest, getBookingByCode } from '../services/bookingApi';
import { formatBusType } from '../utils/busType';
import { getOperatorDisplayName } from '../utils/operatorDisplay';

const REASONS = [
  'Tôi đổi kế hoạch',
  'Tìm được chuyến tốt hơn',
  'Lý do sức khoẻ',
  'Lý do gia đình',
  'Đặt nhầm vé',
  'Khác',
];

const POLICY_TIERS = [
  {
    key: 'full',
    icon: CheckCircleOutlined,
    color: '#0F8458',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    title: 'Hoàn 100% tiền vé',
    desc: 'Khi hủy trước ít nhất 2 giờ so với giờ khởi hành.',
  },
  {
    key: 'partial',
    icon: WarningOutlined,
    color: '#B86A1B',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    title: 'Hủy được · không hoàn tiền',
    desc: 'Khi hủy trong vòng 2 giờ trước giờ khởi hành, vé sẽ được hủy và ghế nhả ra nhưng không hoàn tiền.',
  },
  {
    key: 'none',
    icon: StopOutlined,
    color: '#C0392B',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    title: 'Không thể hủy',
    desc: 'Khi chuyến xe đã khởi hành hoặc vé đã được sử dụng.',
  },
];

const formatCurrency = (v = 0) => `${Number(v || 0).toLocaleString('vi-VN')}đ`;
const formatTime = (v) => (v ? dayjs(v).format('HH:mm') : '--:--');
const formatDateShort = (v) =>
  v ? dayjs(v).format('ddd, DD/MM/YYYY') : '—';

const operatorInitials = (name = '') => {
  if (!name) return 'NX';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

/**
 * Compute refund based on the backend cancellation policy:
 *  - >= 2h before departure  → 100% refund
 *  - 0 ≤ hours < 2           → 0% refund (still cancellable, no money back)
 *  - < 0 (already departed)  → cannot cancel
 */
const calcRefund = (totalPrice, departureTime) => {
  const total = Number(totalPrice || 0);
  if (!departureTime) {
    // When we don't have departure info (e.g. email-only lookup that skipped
    // booking fetch), allow cancellation but flag the refund as unknown — the
    // backend will compute the real refund based on actual booking data.
    return {
      canCancel: true,
      refundPercent: null,
      refundAmount: null,
      fee: null,
      hoursUntilDeparture: null,
      policyLabel: 'Chưa rõ — tính theo chính sách nhà xe',
      policyTone: 'info',
    };
  }
  const now = dayjs();
  const dep = dayjs(departureTime);
  const hoursUntilDeparture = dep.diff(now, 'hour', true);

  if (hoursUntilDeparture < 0) {
    return {
      canCancel: false,
      refundPercent: 0,
      refundAmount: 0,
      fee: total,
      hoursUntilDeparture,
      policyLabel: 'Chuyến đã khởi hành',
      policyTone: 'danger',
    };
  }
  if (hoursUntilDeparture >= 2) {
    return {
      canCancel: true,
      refundPercent: 100,
      refundAmount: total,
      fee: 0,
      hoursUntilDeparture,
      policyLabel: 'Hủy trước 2 giờ khởi hành',
      policyTone: 'success',
    };
  }
  return {
    canCancel: true,
    refundPercent: 0,
    refundAmount: 0,
    fee: total,
    hoursUntilDeparture,
    policyLabel: 'Hủy trong 2 giờ trước khởi hành',
    policyTone: 'warning',
  };
};

const StatusChip = ({ tone = 'neutral', icon: Icon, children }) => {
  const map = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-vxn-teal-50 text-vxn-teal-800',
    neutral: 'bg-slate-100 text-slate-700',
  };
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold tracking-[0.08em] ${map[tone]}`}
    >
      {Icon && <Icon style={{ fontSize: 12 }} />}
      {children}
    </span>
  );
};

const ReasonGrid = ({ value, onChange }) => (
  <div className="grid gap-2.5 sm:grid-cols-2">
    {REASONS.map((label) => {
      const on = value === label;
      return (
        <label
          key={label}
          className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-[13px] transition ${
            on
              ? 'border-vxn-saffron-600 bg-vxn-saffron-50 text-vxn-ink'
              : 'border-vxn-border bg-white text-vxn-fg-2 hover:border-vxn-saffron-300 hover:bg-vxn-bg-soft'
          }`}
        >
          <span
            className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
              on ? 'border-vxn-saffron-600' : 'border-vxn-border-strong'
            }`}
          >
            {on && (
              <span className="h-2 w-2 rounded-full bg-vxn-saffron-600" />
            )}
          </span>
          <input
            type="radio"
            name="cancel-reason"
            value={label}
            checked={on}
            onChange={() => onChange(label)}
            className="sr-only"
          />
          <span>{label}</span>
        </label>
      );
    })}
  </div>
);

const BookingFoundCard = ({ booking, refund }) => {
  const tripInfo = booking?.tripInfo || {};
  const trip = booking?.tripId || {};
  const route = trip?.routeId || {};
  const fromCity =
    tripInfo.origin?.city || route.fromCity || trip.fromCity || '—';
  const toCity =
    tripInfo.destination?.city || route.toCity || trip.toCity || '—';
  const dep = tripInfo.departureTime || trip.departureTime;
  const arr = tripInfo.arrivalTime || trip.arrivalTime;
  const operatorName = getOperatorDisplayName(booking?.operatorId, tripInfo.operatorName || 'Nhà xe');
  const seats = (booking?.seats || booking?.passengers || [])
    .map((s) => s.seatNumber)
    .filter(Boolean)
    .join(', ');
  const passengerCount =
    booking?.passengers?.length || booking?.seats?.length || 0;
  const busType = formatBusType(tripInfo.busType || trip.busType, '');
  const plate = tripInfo.busNumber || trip.busNumber || '';
  const accent =
    refund?.policyTone === 'success'
      ? '#0F8458'
      : refund?.policyTone === 'warning'
        ? '#E89B26'
        : '#C0392B';

  return (
    <div className="grid overflow-hidden rounded-2xl border border-vxn-border bg-white shadow-sm lg:grid-cols-[4px_minmax(0,1fr)]">
      <div style={{ background: accent }} />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip tone="success" icon={CheckCircleOutlined}>
            VÉ ĐƯỢC TÌM THẤY
          </StatusChip>
          <span className="font-mono text-[12px] tracking-wide text-vxn-fg-3">
            {booking?.bookingCode}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-vxn-teal-700 text-[13px] font-bold text-white">
            {operatorInitials(operatorName)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-vxn-ink">
              {operatorName}
            </div>
            <div className="truncate text-[12px] text-vxn-fg-5">
              {busType}
              {plate ? ` · ${plate}` : ''}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[90px]">
            <div className="text-[11px] font-medium tracking-wide text-vxn-fg-5">
              {formatTime(dep)}
            </div>
            <div className="text-[18px] font-bold leading-[1.1] text-vxn-ink">
              {fromCity}
            </div>
          </div>
          <div className="flex flex-1 items-center gap-2 text-[12px] text-vxn-fg-5">
            <span>{formatDateShort(dep)}</span>
            <div className="relative h-[2px] flex-1 bg-vxn-bg-fog">
              <CarOutlined
                style={{
                  position: 'absolute',
                  top: -7,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  padding: '0 4px',
                  fontSize: 14,
                  color: '#E89B26',
                }}
              />
            </div>
            <span>{formatTime(arr)}</span>
          </div>
          <div className="min-w-[90px] text-right">
            <div className="text-[11px] font-medium tracking-wide text-vxn-fg-5">
              {formatTime(arr)}
            </div>
            <div className="text-[18px] font-bold leading-[1.1] text-vxn-ink">
              {toCity}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-vxn-border pt-2.5 text-[12px] text-vxn-fg-3">
          {passengerCount > 0 && (
            <span>
              <strong className="text-vxn-ink">{passengerCount}</strong> hành
              khách
              {seats && (
                <>
                  {' '}
                  · ghế <strong className="text-vxn-ink">{seats}</strong>
                </>
              )}
            </span>
          )}
          {(booking?.finalPrice || booking?.totalPrice || booking?.totalAmount) && (
            <>
              <span className="text-vxn-fg-5">·</span>
              <span>
                <strong className="text-vxn-ink">
                  {formatCurrency(
                    booking?.finalPrice ||
                      booking?.totalPrice ||
                      booking?.totalAmount ||
                      0
                  )}
                </strong>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const RefundSidebar = ({ refund, booking }) => {
  if (!booking || !refund) {
    // Empty / policy-info state
    return (
      <div className="rounded-2xl border border-vxn-border bg-white p-5 shadow-sm">
        <h3 className="m-0 text-[15px] font-semibold text-vxn-ink">
          Chính sách hủy vé
        </h3>
        <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-vxn-fg-3">
          Tiền hoàn được tính theo khoảng thời gian giữa thời điểm hủy và giờ
          khởi hành.
        </p>
        <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
          {POLICY_TIERS.map((t) => {
            const Icon = t.icon;
            return (
              <li
                key={t.key}
                className={`flex gap-2.5 rounded-[10px] ${t.bg} px-3 py-2.5`}
              >
                <Icon
                  style={{
                    color: t.color,
                    fontSize: 16,
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <div className="min-w-0">
                  <div className={`text-[12.5px] font-semibold ${t.text}`}>
                    {t.title}
                  </div>
                  <div className="text-[12px] leading-snug text-vxn-fg-3">
                    {t.desc}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 rounded-xl border-l-4 border-vxn-teal-400 bg-vxn-teal-50 p-3 text-[12px] leading-relaxed text-vxn-teal-800">
          Tiền hoàn được chuyển về phương thức thanh toán ban đầu trong vòng
          3–7 ngày làm việc.
        </div>
      </div>
    );
  }

  // Active refund estimate
  const total =
    booking.finalPrice || booking.totalPrice || booking.totalAmount || 0;
  const refundTone = refund.policyTone;
  const isUnknown = refund.refundAmount === null;
  const refundBox =
    refundTone === 'success'
      ? 'bg-emerald-50 text-emerald-700'
      : refundTone === 'warning'
        ? 'bg-amber-50 text-amber-800'
        : refundTone === 'info'
          ? 'bg-vxn-teal-50 text-vxn-teal-800'
          : 'bg-rose-50 text-rose-700';
  const refundLabel =
    refundTone === 'success'
      ? 'Hoàn lại'
      : refundTone === 'warning'
        ? 'Không hoàn tiền'
        : refundTone === 'info'
          ? 'Tính theo chính sách nhà xe'
          : 'Không áp dụng';

  return (
    <div className="rounded-2xl border border-vxn-border bg-white p-5 shadow-sm">
      <h3 className="m-0 text-[15px] font-semibold text-vxn-ink">
        Số tiền hoàn dự kiến
      </h3>
      <div className="mt-3.5 flex flex-col gap-2 text-[13px] text-vxn-fg-3">
        {total > 0 && (
          <div className="flex items-center justify-between">
            <span>Đã thanh toán</span>
            <span className="font-medium text-vxn-ink">
              {formatCurrency(total)}
            </span>
          </div>
        )}
        {!isUnknown && (
          <div className="flex items-center justify-between">
            <span>Phí hủy ({100 - refund.refundPercent}%)</span>
            <span
              className={`font-medium ${
                refund.fee > 0 ? 'text-rose-600' : 'text-vxn-ink'
              }`}
            >
              {refund.fee > 0
                ? `-${formatCurrency(refund.fee)}`
                : formatCurrency(0)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span>Chính sách</span>
          <span className="text-right font-medium text-vxn-ink">
            {refund.policyLabel}
          </span>
        </div>
        {refund.hoursUntilDeparture != null && refund.hoursUntilDeparture >= 0 && (
          <div className="flex items-center justify-between">
            <span>Còn cách khởi hành</span>
            <span className="font-medium text-vxn-ink">
              {refund.hoursUntilDeparture >= 1
                ? `${Math.floor(refund.hoursUntilDeparture)}h ${Math.round(
                    (refund.hoursUntilDeparture - Math.floor(refund.hoursUntilDeparture)) * 60
                  )}p`
                : `${Math.max(0, Math.round(refund.hoursUntilDeparture * 60))} phút`}
            </span>
          </div>
        )}
      </div>

      <div
        className={`mt-4 flex items-baseline justify-between rounded-[10px] px-4 py-3 ${refundBox}`}
      >
        <span className="text-[13px] font-semibold">{refundLabel}</span>
        <span className="text-[22px] font-bold">
          {isUnknown ? '—' : formatCurrency(refund.refundAmount)}
        </span>
      </div>

      <p className="m-0 mt-3 text-[12px] leading-relaxed text-vxn-fg-5">
        {isUnknown
          ? 'Hệ thống sẽ tính số tiền hoàn chính xác dựa trên giờ khởi hành thực tế sau khi xác nhận.'
          : refund.refundAmount > 0
            ? 'Tiền sẽ được hoàn về cùng phương thức thanh toán ban đầu trong vòng 3–7 ngày làm việc.'
            : 'Vé sẽ được hủy ngay khi xác nhận. Hệ thống sẽ gửi email xác nhận tới hộp thư bạn đã đăng ký.'}
      </p>
    </div>
  );
};

const CancelTicketPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState('form'); // 'form' | 'success'
  const [loading, setLoading] = useState(false);

  const [bookingCode, setBookingCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState(REASONS[0]);

  const [booking, setBooking] = useState(null);
  const [cancelResult, setCancelResult] = useState(null);

  // Auto-fill from location.state (passed by GuestTicketLookupPage)
  useEffect(() => {
    if (!location.state) return;
    const { bookingId, email: stEmail, phone: stPhone } = location.state;
    if (bookingId) setBookingCode(bookingId);
    if (stEmail) setEmail(stEmail);
    if (stPhone) setPhone(stPhone);
  }, [location.state]);

  const refund = useMemo(() => {
    if (!booking) return null;
    const total =
      booking.finalPrice || booking.totalPrice || booking.totalAmount || 0;
    const dep =
      booking?.tripInfo?.departureTime ||
      booking?.tripId?.departureTime ||
      booking?.departureTime;
    return calcRefund(total, dep);
  }, [booking]);

  const handleLookup = async () => {
    if (!bookingCode.trim()) {
      message.error('Vui lòng nhập mã đặt vé');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      message.error('Vui lòng nhập số điện thoại hoặc email đặt vé');
      return;
    }
    setLoading(true);
    try {
      const response = await getBookingByCode(bookingCode.trim(), {
        phone: phone.trim(),
        email: email.trim(),
      });
      const data = response.data?.booking || response.booking || response.data;

      if (!data) {
        message.error('Không tìm thấy vé khớp với thông tin trên');
        return;
      }

      setBooking(data);
      message.success('Đã tìm thấy vé');
    } catch (error) {
      console.error('Lookup booking error:', error);
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          'Không tìm thấy vé. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBooking(null);
    setCancelResult(null);
    setBookingCode('');
    setPhone('');
    setEmail('');
    setReason(REASONS[0]);
    setView('form');
  };

  const handleConfirmCancel = () => {
    if (!booking) {
      message.error('Vui lòng tra cứu vé trước khi hủy');
      return;
    }
    if (refund && !refund.canCancel) {
      message.error('Không thể hủy vé này. ' + (refund.policyLabel || ''));
      return;
    }

    Modal.confirm({
      title: 'Xác nhận hủy vé',
      icon: <ExclamationCircleOutlined style={{ color: '#C0392B' }} />,
      content: (
        <div className="pt-2 text-[13px] text-vxn-fg-3">
          <p className="m-0">
            Hành động này sẽ hủy vĩnh viễn vé{' '}
            <strong className="font-mono text-vxn-ink">
              {booking.bookingCode}
            </strong>{' '}
            và không thể hoàn tác.
          </p>
          {refund?.refundAmount === null ? (
            <p className="m-0 mt-2">
              Số tiền hoàn sẽ được tính theo chính sách của nhà xe dựa trên
              giờ khởi hành thực tế.
            </p>
          ) : refund && refund.refundAmount > 0 ? (
            <p className="m-0 mt-2">
              Bạn sẽ được hoàn{' '}
              <strong className="text-emerald-700">
                {formatCurrency(refund.refundAmount)}
              </strong>{' '}
              ({refund.refundPercent}%) trong 3–7 ngày làm việc.
            </p>
          ) : (
            <p className="m-0 mt-2 text-amber-700">
              Vé này không được hoàn tiền do hủy trong 2 giờ trước khởi hành.
            </p>
          )}
        </div>
      ),
      okText: 'Xác nhận hủy vé',
      cancelText: 'Để sau',
      okButtonProps: { danger: true, size: 'large' },
      cancelButtonProps: { size: 'large' },
      width: 460,
      onOk: async () => {
        setLoading(true);
        try {
          const response = await cancelBookingGuest({
            bookingId: booking.bookingCode || bookingCode.trim(),
            email: email.trim(),
            phone: phone.trim(),
            reason: reason || 'Khách hủy vé',
          });
          if (response.status === 'success' || response.success) {
            // Prefer the backend-reported refund (authoritative); fall back to
            // the client-side estimate when the backend doesn't return one.
            const backendRefund =
              response.data?.refund ||
              response.data?.refundInfo ||
              response.data?.cancellation?.refund;
            const backendAmount =
              backendRefund?.refundAmount ??
              backendRefund?.amount ??
              null;
            const backendPercent =
              backendRefund?.refundPercentage ??
              backendRefund?.refundPercent ??
              null;
            setCancelResult({
              bookingCode: booking.bookingCode || bookingCode.trim(),
              refundAmount:
                backendAmount != null
                  ? backendAmount
                  : refund?.refundAmount === null
                    ? null
                    : (refund?.refundAmount ?? 0),
              refundPercent:
                backendPercent != null
                  ? backendPercent
                  : refund?.refundPercent === null
                    ? null
                    : (refund?.refundPercent ?? 0),
              fromBackend: backendAmount != null,
            });
            setView('success');
            message.success('Hủy vé thành công');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            message.error(response.message || 'Không thể hủy vé');
          }
        } catch (error) {
          console.error('Cancel booking error:', error);
          message.error(
            error?.response?.data?.message ||
              error?.message ||
              'Không thể hủy vé. Vui lòng thử lại.'
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <CustomerShell activeKey="lookup">
      {/* Page header with breadcrumb */}
      <div className="border-b border-vxn-border bg-white">
        <div className="px-4 pt-6 lg:px-8">
          <CustomerBreadcrumb
            className="mb-3"
            items={[
              { label: 'Tra cứu vé', to: '/tra-cuu-ve' },
              { label: 'Hủy vé khách' },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <button
              type="button"
              onClick={() => navigate('/tra-cuu-ve')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-vxn-border bg-white px-3 text-[13px] font-medium text-vxn-fg-2 transition hover:border-vxn-teal-400 hover:text-vxn-teal-700"
            >
              <ArrowLeftOutlined style={{ fontSize: 12 }} /> Quay lại trang tra
              cứu vé
            </button>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-vxn-fg-4">
              <InfoCircleOutlined style={{ fontSize: 12 }} />
              Mẹo: bạn có thể huỷ vé trực tiếp ngay trên trang tra cứu sau khi
              xác thực OTP — không cần nhập lại tại đây.
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT column */}
          <div className="flex flex-col gap-6">
            {view === 'form' && (
              <>
                <div>
                  <StatusChip tone="info" icon={InfoCircleOutlined}>
                    KHÔNG CẦN ĐĂNG NHẬP
                  </StatusChip>
                  <h1 className="m-0 mt-3 text-[32px] font-semibold leading-tight tracking-tight text-vxn-ink">
                    Hủy vé khách
                  </h1>
                  <p className="m-0 mt-2.5 text-[15px] leading-relaxed text-vxn-fg-3">
                    Khách hàng không có tài khoản vẫn có thể hủy vé tại đây.
                    Tiền hoàn được tính theo chính sách của nhà xe.
                  </p>
                </div>

                {/* Verification card */}
                <div className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm">
                  <h3 className="m-0 text-[16px] font-semibold text-vxn-ink">
                    Xác thực vé
                  </h3>
                  <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                    Nhập mã đặt vé và một trong hai (SĐT hoặc email) bạn đã
                    dùng khi đặt vé.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-vxn-fg-3">
                        Mã đặt vé *
                      </label>
                      <Input
                        size="large"
                        prefix={
                          <QrcodeOutlined style={{ color: '#94A3B8' }} />
                        }
                        placeholder="VXN-XXXX-XXXX"
                        value={bookingCode}
                        onChange={(e) => {
                          setBookingCode(e.target.value.toUpperCase());
                          setBooking(null);
                        }}
                        onPressEnter={handleLookup}
                        disabled={!!booking}
                        className="!h-12 !rounded-lg !font-mono"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-vxn-fg-3">
                        Số điện thoại đặt vé
                      </label>
                      <Input
                        size="large"
                        prefix={
                          <PhoneOutlined style={{ color: '#94A3B8' }} />
                        }
                        placeholder="0901 234 567"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setBooking(null);
                        }}
                        onPressEnter={handleLookup}
                        disabled={!!booking}
                        maxLength={12}
                        className="!h-12 !rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[12px] font-medium text-vxn-fg-3">
                        Email đặt vé{' '}
                        <span className="text-vxn-fg-5">(tùy chọn)</span>
                      </label>
                      <Input
                        size="large"
                        prefix={
                          <MailOutlined style={{ color: '#94A3B8' }} />
                        }
                        placeholder="ban@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setBooking(null);
                        }}
                        onPressEnter={handleLookup}
                        disabled={!!booking}
                        className="!h-12 !rounded-lg"
                      />
                    </div>
                  </div>

                  {!booking && (
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<SearchOutlined />}
                      onClick={handleLookup}
                      loading={loading}
                      className="!mt-5 !h-12 !rounded-lg !text-[15px] !font-semibold"
                      style={{ background: '#036672', borderColor: '#036672' }}
                    >
                      Tra cứu vé
                    </Button>
                  )}
                </div>

                {/* Loading placeholder */}
                {loading && !booking && (
                  <div className="rounded-2xl border border-dashed border-vxn-border bg-white p-10 text-center">
                    <Spin
                      indicator={
                        <LoadingOutlined
                          style={{ fontSize: 36, color: '#036672' }}
                          spin
                        />
                      }
                    />
                    <p className="mt-4 text-[14px] text-vxn-fg-3">
                      Đang tra cứu vé...
                    </p>
                  </div>
                )}

                {/* Booking found + reason + cancel actions */}
                {booking && (
                  <>
                    <BookingFoundCard booking={booking} refund={refund} />

                    {refund?.policyTone === 'warning' && (
                      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-800">
                        <WarningOutlined
                          style={{
                            color: '#B86A1B',
                            fontSize: 18,
                            marginTop: 2,
                          }}
                        />
                        <div>
                          <strong>Lưu ý:</strong> Bạn đang hủy trong vòng 2 giờ
                          trước khởi hành. Vé sẽ được hủy và ghế nhả ra, nhưng{' '}
                          <strong>không được hoàn tiền</strong>.
                        </div>
                      </div>
                    )}

                    {refund?.policyTone === 'danger' && (
                      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-[13px] leading-relaxed text-rose-800">
                        <StopOutlined
                          style={{
                            color: '#C0392B',
                            fontSize: 18,
                            marginTop: 2,
                          }}
                        />
                        <div>
                          <strong>Không thể hủy vé:</strong>{' '}
                          {refund.policyLabel}. Vui lòng liên hệ tổng đài để
                          được hỗ trợ.
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm">
                      <h3 className="m-0 text-[16px] font-semibold text-vxn-ink">
                        Lý do hủy vé
                      </h3>
                      <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                        Chia sẻ lý do giúp chúng tôi cải thiện dịch vụ.
                      </p>
                      <div className="mt-4">
                        <ReasonGrid value={reason} onChange={setReason} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        size="large"
                        block
                        onClick={() => {
                          setBooking(null);
                        }}
                        icon={<ArrowLeftOutlined />}
                        className="!h-12 !rounded-lg sm:!flex-1"
                      >
                        Chọn vé khác
                      </Button>
                      <Button
                        danger
                        type="primary"
                        size="large"
                        block
                        loading={loading}
                        disabled={refund && !refund.canCancel}
                        onClick={handleConfirmCancel}
                        className="!h-12 !rounded-lg !text-[15px] !font-semibold sm:!flex-[2]"
                      >
                        Xác nhận hủy vé
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            {view === 'success' && cancelResult && (
              <div className="overflow-hidden rounded-2xl border border-vxn-border bg-white shadow-sm">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-7">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_8px_20px_-8px_rgba(15,132,88,.55)]">
                    <CheckCircleOutlined style={{ fontSize: 32 }} />
                  </div>
                  <h2 className="m-0 mt-4 text-center text-[26px] font-semibold leading-tight tracking-tight text-vxn-ink">
                    Hủy vé thành công
                  </h2>
                  <p className="m-0 mt-2 text-center text-[14px] leading-relaxed text-vxn-fg-3">
                    Vé{' '}
                    <strong className="font-mono text-vxn-ink">
                      {cancelResult.bookingCode}
                    </strong>{' '}
                    đã được hủy. Bạn sẽ nhận được email xác nhận trong vài
                    phút.
                  </p>
                </div>

                <div className="grid divide-y divide-vxn-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                  <div className="p-5">
                    <div className="text-[12px] font-medium tracking-wide text-vxn-fg-5">
                      SỐ TIỀN HOÀN
                    </div>
                    {cancelResult.refundAmount === null ? (
                      <>
                        <div className="mt-1 text-[20px] font-bold text-vxn-ink">
                          Đang tính
                        </div>
                        <div className="mt-1 text-[12px] text-vxn-fg-3">
                          Sẽ thông báo qua email khi nhà xe xác nhận.
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className={`mt-1 text-[24px] font-bold ${
                            cancelResult.refundAmount > 0
                              ? 'text-emerald-700'
                              : 'text-vxn-fg-3'
                          }`}
                        >
                          {formatCurrency(cancelResult.refundAmount)}
                        </div>
                        <div className="mt-1 text-[12px] text-vxn-fg-3">
                          {cancelResult.refundAmount > 0
                            ? `${cancelResult.refundPercent}% giá vé · 3–7 ngày làm việc`
                            : 'Không hoàn tiền theo chính sách hủy'}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-[12px] font-medium tracking-wide text-vxn-fg-5">
                      PHƯƠNG THỨC HOÀN
                    </div>
                    <div className="mt-1 text-[15px] font-semibold text-vxn-ink">
                      Cùng phương thức thanh toán
                    </div>
                    <div className="mt-1 text-[12px] text-vxn-fg-3">
                      Hệ thống sẽ tự động xử lý hoàn tiền.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-vxn-border bg-vxn-bg-soft p-5 sm:flex-row">
                  <Button
                    size="large"
                    block
                    onClick={() => navigate('/tra-cuu-ve')}
                    icon={<SearchOutlined />}
                    className="!h-11 !rounded-lg sm:!flex-1"
                  >
                    Tra cứu vé khác
                  </Button>
                  <Button
                    size="large"
                    block
                    onClick={handleReset}
                    className="!h-11 !rounded-lg sm:!flex-1"
                  >
                    Hủy vé khác
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<HomeOutlined />}
                    onClick={() => navigate('/')}
                    className="!h-11 !rounded-lg sm:!flex-1"
                    style={{
                      background: '#036672',
                      borderColor: '#036672',
                    }}
                  >
                    Về trang chủ
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT column: refund estimate / policy */}
          <div className="flex flex-col gap-4">
            <RefundSidebar refund={refund} booking={booking} />

            {/* Support card */}
            <div className="rounded-2xl border border-vxn-border bg-white p-5 shadow-sm">
              <h3 className="m-0 text-[14px] font-semibold text-vxn-ink">
                Cần hỗ trợ?
              </h3>
              <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-vxn-fg-3">
                Tổng đài hoạt động 24/7. Vui lòng cung cấp mã đặt vé khi liên
                hệ để được xử lý nhanh hơn.
              </p>
              <div className="mt-3 flex flex-col gap-2 text-[13px]">
                <a
                  href="tel:19000000"
                  className="inline-flex items-center gap-2 text-vxn-teal-700 hover:text-vxn-teal-800"
                >
                  <PhoneOutlined style={{ fontSize: 13 }} />
                  <span className="font-semibold">1900-0000</span>
                </a>
                <a
                  href="mailto:support@vexenhanh.vn"
                  className="inline-flex items-center gap-2 text-vxn-teal-700 hover:text-vxn-teal-800"
                >
                  <MailOutlined style={{ fontSize: 13 }} />
                  <span>support@vexenhanh.vn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
};

export default CancelTicketPage;
