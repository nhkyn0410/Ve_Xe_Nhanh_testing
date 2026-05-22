import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, message, Modal } from 'antd';
import {
  ArrowLeftOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  SyncOutlined,
  TagOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import heroImage from '../assets/brand/hero-landscape.jpg';
import { requestTicketLookupOTP, verifyTicketLookupOTP } from '../services/ticketApi';
import { cancelBookingGuest } from '../services/bookingApi';
import { formatBusType } from '../utils/busType';
import { getOperatorDisplayName } from '../utils/operatorDisplay';

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60; // 5 minutes

const CANCEL_REASONS = [
  'Tôi đổi kế hoạch',
  'Tìm được chuyến tốt hơn',
  'Lý do sức khoẻ',
  'Lý do gia đình',
  'Đặt nhầm vé',
  'Khác',
];

const TABS = [
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'past', label: 'Đã đi' },
  { key: 'cancelled', label: 'Đã huỷ' },
  { key: 'all', label: 'Tất cả' },
];

const formatCurrency = (v = 0) => `${Number(v || 0).toLocaleString('vi-VN')}đ`;
const formatTime = (v) => (v ? dayjs(v).format('HH:mm') : '--:--');
const formatDateShort = (v) => (v ? dayjs(v).format('ddd, DD/MM/YYYY') : '—');
const formatDateLong = (v) => (v ? dayjs(v).format('dddd, D [tháng] M, YYYY') : '—');
const normalizePhone = (value = '') => {
  const normalized = value.replace(/[\s().-]/g, '');
  return /^84\d{9}$/.test(normalized) ? `+${normalized}` : normalized;
};

/**
 * Compute refund estimate based on backend cancellation policy:
 *  - >= 2h before departure  → 100% refund
 *  - < 2h before departure   → cancellable but NO refund
 *  - departed                → cannot cancel
 */
const calcRefund = (totalPrice = 0, departureTime) => {
  if (!departureTime) {
    return {
      canCancel: true,
      refundPercent: null,
      refundAmount: null,
      fee: null,
      hoursUntilDeparture: null,
      label: 'Theo chính sách nhà xe',
      tone: 'info',
    };
  }
  const dep = dayjs(departureTime);
  const now = dayjs();
  const hoursUntilDeparture = dep.diff(now, 'minute') / 60;

  if (hoursUntilDeparture <= 0) {
    return {
      canCancel: false,
      refundPercent: 0,
      refundAmount: 0,
      fee: totalPrice,
      hoursUntilDeparture,
      label: 'Chuyến đã khởi hành',
      tone: 'danger',
    };
  }
  if (hoursUntilDeparture >= 2) {
    return {
      canCancel: true,
      refundPercent: 100,
      refundAmount: totalPrice,
      fee: 0,
      hoursUntilDeparture,
      label: 'Hoàn 100% giá vé',
      tone: 'success',
    };
  }
  return {
    canCancel: true,
    refundPercent: 0,
    refundAmount: 0,
    fee: totalPrice,
    hoursUntilDeparture,
    label: 'Huỷ được · không hoàn tiền',
    tone: 'warning',
  };
};

const operatorColor = (str = '') => {
  const palette = [
    '#0EA5E9',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EF4444',
    '#0F8458',
    '#6366F1',
    '#EC4899',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000;
  }
  return palette[hash % palette.length];
};

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

/** Bucket a looked-up ticket into the same tabs MyTicketsPage uses. */
const ticketBucket = (t) => {
  if (t.status === 'cancelled') return 'cancelled';
  if (t.status === 'used' || t.status === 'expired') return 'past';
  const dep = t.tripInfo?.departureTime;
  if (dep && dayjs(dep).isBefore(dayjs())) return 'past';
  return 'upcoming';
};

const relativeDeparture = (departureTime, status) => {
  if (!departureTime) return '';
  const dep = dayjs(departureTime);
  const now = dayjs();
  if (status === 'cancelled') return 'Đã huỷ';
  if (status === 'used' || dep.isBefore(now)) {
    const diffDays = now.diff(dep, 'day');
    return `Đã đi · cách đây ${diffDays} ngày`;
  }
  const diffDays = dep.diff(now, 'day');
  const diffHours = dep.diff(now, 'hour');
  if (diffDays >= 1) return `Còn ${diffDays} ngày`;
  if (diffHours >= 1) return `Còn ${diffHours} giờ`;
  return 'Sắp khởi hành';
};

const STATUS_META = {
  valid: { tone: 'success', label: 'CÒN HIỆU LỰC' },
  used: { tone: 'neutral', label: 'ĐÃ DÙNG' },
  cancelled: { tone: 'danger', label: 'ĐÃ HUỶ' },
  expired: { tone: 'warning', label: 'HẾT HẠN' },
};

const StatusChip = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.valid;
  const map = {
    success: 'bg-emerald-100 text-emerald-700',
    neutral: 'bg-slate-200 text-slate-700',
    danger: 'bg-rose-100 text-rose-700',
    warning: 'bg-amber-100 text-amber-800',
  };
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide ${map[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
};

const StepIndicator = ({ current, total }) => (
  <span className="inline-flex h-7 items-center rounded-full bg-vxn-teal-50 px-3 text-[11px] font-semibold tracking-[0.08em] text-vxn-teal-700">
    BƯỚC {current} / {total}
  </span>
);

const ContactPicker = ({ method, onChange }) => (
  <div className="inline-grid grid-cols-2 rounded-xl bg-vxn-bg-mist p-1">
    {[
      { key: 'phone', label: 'Số điện thoại', icon: PhoneOutlined },
      { key: 'email', label: 'Email', icon: MailOutlined },
    ].map(({ key, label, icon: Icon }) => {
      const on = method === key;
      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`inline-flex h-9 min-w-[132px] items-center justify-center gap-1.5 rounded-lg border-0 px-4 text-[13px] font-medium transition ${
            on
              ? 'bg-white text-vxn-ink shadow-[0_2px_6px_rgba(15,23,42,.07)]'
              : 'bg-transparent text-vxn-fg-3 hover:text-vxn-ink'
          }`}
        >
          <Icon style={{ fontSize: 13 }} /> {label}
        </button>
      );
    })}
  </div>
);

const OtpInputs = ({ value, onChange, error, disabled }) => {
  const refs = useRef([]);
  const digits = useMemo(() => {
    const arr = Array(OTP_LENGTH).fill('');
    (value || '')
      .split('')
      .slice(0, OTP_LENGTH)
      .forEach((c, i) => {
        arr[i] = c;
      });
    return arr;
  }, [value]);

  const setDigit = (i, d) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join(''));
  };

  const handleKey = (e, i) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleChange = (e, i) => {
    const v = e.target.value.replace(/[^0-9]/g, '');
    if (!v) {
      setDigit(i, '');
      return;
    }
    const chars = v.split('').slice(0, OTP_LENGTH - i);
    const next = digits.slice();
    chars.forEach((c, idx) => {
      next[i + idx] = c;
    });
    onChange(next.join(''));
    const nextIdx = Math.min(i + chars.length, OTP_LENGTH - 1);
    refs.current[nextIdx]?.focus();
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
    if (!text) return;
    e.preventDefault();
    onChange(text.slice(0, OTP_LENGTH));
    refs.current[Math.min(text.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
      {digits.map((d, i) => {
        const filled = Boolean(d);
        return (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={d}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKey(e, i)}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            className={`h-16 w-14 rounded-[10px] border bg-white text-center text-[28px] font-bold tracking-tight outline-none transition disabled:opacity-60 ${
              error
                ? 'border-rose-400 text-rose-700'
                : filled
                  ? 'border-vxn-teal-700 bg-[#E6F4F8] text-vxn-ink'
                  : 'border-vxn-border text-vxn-fg-4'
            } focus:border-vxn-teal-700 focus:shadow-[0_0_0_3px_rgba(3,102,114,.12)]`}
          />
        );
      })}
    </div>
  );
};

const HeroPanel = () => (
  <div
    className="relative hidden overflow-hidden rounded-2xl text-white shadow-[0_18px_40px_-20px_rgba(2,32,45,.45)] lg:flex"
    style={{ minHeight: 480 }}
  >
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(0,40,60,.25) 0%, rgba(0,40,60,.85) 100%), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
    <div className="relative flex flex-col justify-end gap-3 p-9">
      <span className="inline-flex h-7 w-fit items-center rounded-full bg-vxn-saffron-600 px-3 text-[11px] font-semibold tracking-[0.08em] text-white">
        KHÔNG CẦN ĐĂNG NHẬP
      </span>
      <h2 className="m-0 max-w-[360px] text-[28px] font-semibold leading-tight">
        Tra cứu vé khách bằng số điện thoại hoặc email
      </h2>
      <p className="m-0 max-w-[400px] text-[15px] leading-relaxed text-white/85">
        Mọi vé đặt qua VXN — kể cả không có tài khoản — đều có thể tra cứu qua OTP. Vé hợp lệ hiển
        thị QR ngay sau khi xác thực.
      </p>
      <ul className="mt-4 flex flex-col gap-1.5 text-[13px] text-white/85">
        {[
          'Bảo mật bằng OTP 6 số gửi qua SMS hoặc email',
          'Hiển thị QR vé để xuất trình khi lên xe',
          'Hỗ trợ huỷ vé khách trực tiếp từ tra cứu',
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <CheckCircleOutlined style={{ color: '#FFD078', fontSize: 14, marginTop: 3 }} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const TabBar = ({ activeKey, counts, onChange, search, onSearch }) => (
  <div className="border-b border-vxn-border bg-white px-4 lg:px-8">
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {TABS.map((tab) => {
        const on = activeKey === tab.key;
        const n = counts[tab.key] ?? 0;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`relative inline-flex h-12 items-center gap-2 border-0 bg-transparent px-4 text-[14px] transition ${
              on ? 'font-semibold text-vxn-ink' : 'font-medium text-vxn-fg-3 hover:text-vxn-ink'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`inline-grid h-[22px] min-w-[22px] place-items-center rounded-full px-[7px] text-[11px] font-semibold ${
                on ? 'bg-vxn-saffron-600 text-white' : 'bg-vxn-bg-cloud text-vxn-fg-3'
              }`}
            >
              {n}
            </span>
            <span
              className={`absolute inset-x-2 bottom-0 h-[2px] rounded-t-full transition ${
                on ? 'bg-vxn-saffron-600' : 'bg-transparent'
              }`}
            />
          </button>
        );
      })}

      <div className="ml-auto flex items-center gap-2 py-2">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Tìm mã vé hoặc tuyến"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="!h-9 !rounded-lg"
          style={{ width: 240 }}
        />
      </div>
    </div>
  </div>
);

const FeaturedBanner = ({ ticket, onView }) => {
  if (!ticket) return null;
  const dep = ticket.tripInfo?.departureTime;
  const diffDays = dayjs(dep).diff(dayjs(), 'day');
  const eyebrow = `CHUYẾN GẦN NHẤT · ${diffDays >= 1 ? `${diffDays} NGÀY NỮA` : 'HÔM NAY'}`;
  const route = `${ticket.tripInfo?.origin?.city || ''} → ${ticket.tripInfo?.destination?.city || ''}`;
  const operatorName = getOperatorDisplayName(ticket.operatorId, 'Nhà xe');
  const seats =
    ticket.passengers
      ?.map((p) => p.seatNumber)
      .filter(Boolean)
      .join(', ') || '—';
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl px-6 py-5 text-white sm:flex-row sm:items-center sm:gap-6"
      style={{
        background: 'linear-gradient(110deg, #00476B 0%, #00506A 60%, #036672 100%)',
      }}
    >
      <div
        className="grid h-14 w-14 shrink-0 place-items-center rounded-xl"
        style={{ background: 'rgba(255,255,255,.15)' }}
      >
        <CarOutlined style={{ fontSize: 26, color: '#fff' }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium tracking-[0.06em] text-[#FFD078]">{eyebrow}</div>
        <div className="mt-1 truncate text-[18px] font-semibold">
          {route} · {operatorName}
        </div>
        <div className="mt-0.5 text-[13px] text-white/75">
          {formatDateLong(dep)} · {formatTime(dep)} · Ghế {seats}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onView(ticket)}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border-0 bg-vxn-saffron-600 px-5 text-[14px] font-semibold text-white transition hover:bg-vxn-saffron-700"
      >
        Xem QR vé →
      </button>
    </div>
  );
};

const TimelineBetween = ({ date, hint }) => (
  <div className="flex min-w-[120px] flex-1 flex-col items-center">
    <div className="text-[11px] text-vxn-fg-5">{date}</div>
    <div className="relative my-1.5 h-[2px] w-full bg-vxn-bg-fog">
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
    <div className="text-[11px] text-vxn-fg-5">{hint}</div>
  </div>
);

const TicketRow = ({ ticket, onShowQR, onCancel, onRebook, onOpenDetail, canCancel }) => {
  const status = ticket.status;
  const accentBar =
    status === 'cancelled'
      ? '#C0392B'
      : status === 'used' || status === 'expired'
        ? '#94A3B8'
        : '#E89B26';

  const handleStopBubble = (e) => {
    e.stopPropagation();
  };
  const handleRowKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetail?.(ticket);
    }
  };

  const operatorName = getOperatorDisplayName(ticket.operatorId, 'Nhà xe');
  const opColor = operatorColor(operatorName);
  const opInitials = operatorInitials(operatorName);
  const busType = formatBusType(ticket.tripInfo?.busType, '');
  const plate = ticket.tripInfo?.busNumber || '';

  const fromCity = ticket.tripInfo?.origin?.city || '—';
  const toCity = ticket.tripInfo?.destination?.city || '—';
  const fromStation = ticket.tripInfo?.pickupPoint?.name || ticket.tripInfo?.origin?.station || '';
  const toStation =
    ticket.tripInfo?.dropoffPoint?.name || ticket.tripInfo?.destination?.station || '';

  const dep = ticket.tripInfo?.departureTime;
  const arr = ticket.tripInfo?.arrivalTime;
  const seats =
    ticket.passengers
      ?.map((p) => p.seatNumber)
      .filter(Boolean)
      .join(', ') || '—';
  const passengerCount = ticket.passengers?.length || 0;

  // Honest payment label — only assert a state we actually know.
  const payStatus = ticket.paymentStatus || ticket.bookingId?.paymentStatus;
  const payLabel =
    payStatus === 'paid'
      ? 'Đã thanh toán'
      : payStatus === 'pending' || payStatus === 'unpaid'
        ? 'Chưa thanh toán'
        : null;

  // Only show a refund pill when the backend actually reported one.
  const refundAmount = typeof ticket.refundAmount === 'number' ? ticket.refundAmount : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail?.(ticket)}
      onKeyDown={handleRowKey}
      className="group grid cursor-pointer overflow-hidden rounded-2xl border border-vxn-border bg-white shadow-sm outline-none transition hover:-translate-y-[1px] hover:border-vxn-saffron-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-vxn-saffron-400/60 lg:grid-cols-[4px_minmax(0,1fr)_220px]"
    >
      <div style={{ background: accentBar }} />

      {/* Middle pane */}
      <div className="flex flex-col gap-3.5 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="grid h-9 w-9 place-items-center rounded-lg text-[13px] font-bold text-white"
            style={{ background: opColor }}
          >
            {opInitials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-vxn-ink">{operatorName}</div>
            <div className="truncate text-[12px] text-vxn-fg-5">
              {busType}
              {plate ? ` · ${plate}` : ''}
            </div>
          </div>
          <span className="ml-auto font-mono text-[12px] tracking-wide text-vxn-fg-3">
            {ticket.ticketCode}
          </span>
          <StatusChip status={status} />
        </div>

        <div className="flex items-center gap-4">
          <div className="min-w-[110px]">
            <div className="text-[11px] font-medium tracking-wide text-vxn-fg-5">
              {formatTime(dep)}
            </div>
            <div className="text-[22px] font-bold leading-[1.1] text-vxn-ink">{fromCity}</div>
            <div className="mt-0.5 text-[12px] text-vxn-fg-5">{fromStation}</div>
          </div>

          <TimelineBetween
            date={dayjs(dep).format('ddd, DD/MM/YYYY')}
            hint={relativeDeparture(dep, status)}
          />

          <div className="min-w-[110px] text-right">
            <div className="text-[11px] font-medium tracking-wide text-vxn-fg-5">
              {formatTime(arr)}
            </div>
            <div className="text-[22px] font-bold leading-[1.1] text-vxn-ink">{toCity}</div>
            <div className="mt-0.5 text-[12px] text-vxn-fg-5">{toStation}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-vxn-border pt-3">
          <span className="text-[12px] text-vxn-fg-3">
            <strong className="text-vxn-ink">{passengerCount}</strong> hành khách · ghế{' '}
            <strong className="text-vxn-ink">{seats}</strong>
          </span>
          {status === 'cancelled' && refundAmount != null && refundAmount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <SyncOutlined spin style={{ fontSize: 11 }} /> Hoàn {formatCurrency(refundAmount)}{' '}
              đang xử lý
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-vxn-fg-4 transition group-hover:text-vxn-saffron-700">
            Xem chi tiết
            <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </div>

      {/* Right pane */}
      <div
        className="flex flex-col items-end justify-center gap-1.5 border-t border-vxn-border bg-vxn-bg-soft p-5 lg:border-l lg:border-t-0 lg:border-dashed"
        onClick={handleStopBubble}
      >
        <div className="text-[22px] font-bold text-vxn-ink">
          {formatCurrency(ticket.totalPrice || 0)}
        </div>
        {payLabel && <div className="mb-2 text-[11px] text-vxn-fg-5">{payLabel}</div>}

        {status === 'valid' && (
          <>
            <Button
              type="primary"
              size="middle"
              icon={<QrcodeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onShowQR(ticket);
              }}
              className="!h-9 !w-full !rounded-lg"
              style={{ background: '#036672', borderColor: '#036672' }}
            >
              Xem QR vé
            </Button>
            {canCancel && (
              <Button
                size="middle"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(ticket);
                }}
                className="!h-9 !w-full !rounded-lg"
              >
                Huỷ vé
              </Button>
            )}
          </>
        )}
        {(status === 'used' || status === 'expired') && (
          <Button
            size="middle"
            onClick={(e) => {
              e.stopPropagation();
              onRebook(ticket);
            }}
            className="!h-9 !w-full !rounded-lg"
          >
            Đặt lại chuyến này
          </Button>
        )}
        {status === 'cancelled' && (
          <Button
            type="primary"
            size="middle"
            onClick={(e) => {
              e.stopPropagation();
              onRebook(ticket);
            }}
            className="!h-9 !w-full !rounded-lg"
            style={{ background: '#036672', borderColor: '#036672' }}
          >
            Đặt vé lại
          </Button>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ activeTab, noneAtAll, searching }) => {
  let copy;
  if (noneAtAll) {
    copy =
      'Không tìm thấy vé nào khớp với thông tin của bạn. Vui lòng kiểm tra lại số điện thoại / email đã dùng khi đặt vé.';
  } else if (searching) {
    copy = 'Không có vé nào khớp với từ khoá tìm kiếm.';
  } else {
    copy =
      {
        upcoming: 'Không có vé sắp tới trong số vé tra cứu được.',
        past: 'Chưa có vé đã đi trong số vé tra cứu được.',
        cancelled: 'Không có vé đã huỷ trong số vé tra cứu được.',
        all: 'Không có vé nào.',
      }[activeTab] || 'Không có vé nào.';
  }
  return (
    <div className="rounded-2xl border border-dashed border-vxn-border bg-white p-10 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-vxn-bg-mist">
        <TagOutlined style={{ fontSize: 22, color: '#475569' }} />
      </div>
      <p className="m-0 text-[14px] text-vxn-fg-3">{copy}</p>
    </div>
  );
};

const GuestTicketLookupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: contact, 2: otp, 3: tickets
  const [loading, setLoading] = useState(false);

  const [method, setMethod] = useState('phone');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);

  const [tickets, setTickets] = useState([]);
  const [qrTicket, setQrTicket] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);

  // Client-side tab + search over the verified ticket set.
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchText, setSearchText] = useState('');

  // Cancel modal state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTicket, setCancelTicket] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Countdown for OTP TTL
  useEffect(() => {
    if (step !== 2) return undefined;
    setSecondsLeft(OTP_TTL_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const countdownLabel = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [secondsLeft]);

  const lookupData = useMemo(
    () => (method === 'phone' ? { phone: normalizePhone(contact) } : { email: contact.trim() }),
    [method, contact]
  );

  const maskedTarget = useMemo(() => {
    if (method === 'phone') {
      const v = contact.replace(/\D/g, '');
      if (v.length < 4) return v;
      return `${v.slice(0, -4).replace(/.(?=.{2}$)/g, '•')}${v.slice(-4)}`;
    }
    const [u, d] = contact.split('@');
    if (!u || !d) return contact;
    return `${u[0]}${'•'.repeat(Math.max(u.length - 2, 1))}${u.slice(-1)}@${d}`;
  }, [method, contact]);

  // Tab buckets + counts + search, all derived from the verified set.
  const buckets = useMemo(() => {
    const b = { upcoming: [], past: [], cancelled: [] };
    tickets.forEach((t) => {
      b[ticketBucket(t)].push(t);
    });
    return b;
  }, [tickets]);

  const tabCounts = {
    upcoming: buckets.upcoming.length,
    past: buckets.past.length,
    cancelled: buckets.cancelled.length,
    all: tickets.length,
  };

  const filteredTickets = useMemo(() => {
    const base = activeTab === 'all' ? tickets : buckets[activeTab] || [];
    const q = searchText.trim().toLowerCase();
    if (!q) return base;
    return base.filter((t) => {
      const code = (t.ticketCode || '').toLowerCase();
      const from = (t.tripInfo?.origin?.city || '').toLowerCase();
      const to = (t.tripInfo?.destination?.city || '').toLowerCase();
      const op = getOperatorDisplayName(t.operatorId, '').toLowerCase();
      return (
        code.includes(q) ||
        from.includes(q) ||
        to.includes(q) ||
        op.includes(q) ||
        `${from} ${to}`.includes(q)
      );
    });
  }, [activeTab, searchText, tickets, buckets]);

  const featuredTicket = useMemo(
    () =>
      [...buckets.upcoming].sort((a, b) =>
        dayjs(a.tripInfo?.departureTime).diff(dayjs(b.tripInfo?.departureTime))
      )[0],
    [buckets]
  );

  const validateContact = () => {
    if (method === 'phone') {
      const v = normalizePhone(contact);
      if (!/^(0\d{9}|\+84\d{9})$/.test(v)) {
        message.error('Số điện thoại phải có dạng 0901234567, +84901234567 hoặc 84901234567');
        return false;
      }
      return true;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      message.error('Email không hợp lệ');
      return false;
    }
    return true;
  };

  const handleRequestOTP = async () => {
    if (!validateContact()) return;
    setLoading(true);
    try {
      const response = await requestTicketLookupOTP(lookupData);
      if (response.status === 'success' || response.success) {
        setStep(2);
        setOtp('');
        setOtpError('');
        message.success(
          method === 'phone'
            ? `Đã gửi mã OTP đến số ${maskedTarget}`
            : `Đã gửi mã OTP đến email ${maskedTarget}`
        );
      }
    } catch (error) {
      console.error('Request OTP error:', error);
      message.error(
        (typeof error === 'string' && error) ||
          error?.response?.data?.message ||
          error?.message ||
          'Không thể gửi OTP. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtpError('');
    setOtp('');
    setLoading(true);
    try {
      const response = await requestTicketLookupOTP(lookupData);
      if (response.status === 'success' || response.success) {
        setSecondsLeft(OTP_TTL_SECONDS);
        message.success('Đã gửi lại mã OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      message.error((typeof error === 'string' && error) || 'Không thể gửi lại OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== OTP_LENGTH) {
      setOtpError('Mã OTP phải đủ 6 chữ số');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const response = await verifyTicketLookupOTP({
        ...lookupData,
        otp,
      });
      if (response.status === 'success' || response.success) {
        setTickets(response.data?.tickets || []);
        setActiveTab('upcoming');
        setSearchText('');
        setStep(3);
        message.success(
          response.data?.tickets?.length
            ? `Tìm thấy ${response.data.tickets.length} vé`
            : 'Không tìm thấy vé nào'
        );
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      const msg =
        (typeof error === 'string' && error) ||
        error?.response?.data?.message ||
        error?.message ||
        'Mã OTP không đúng hoặc đã hết hạn';
      setOtpError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setContact('');
    setOtp('');
    setOtpError('');
    setTickets([]);
    setActiveTab('upcoming');
    setSearchText('');
  };

  const handleShowQR = (ticket) => {
    setQrTicket(ticket);
    setQrOpen(true);
  };

  const handleOpenDetail = (ticket) => {
    if (!ticket) return;
    const code = ticket.bookingId?.bookingCode || ticket.bookingCode || ticket.ticketCode;
    if (!code) {
      message.warning('Không tìm thấy mã đặt vé');
      return;
    }
    const phone =
      ticket.bookingId?.contactInfo?.phone ||
      ticket.contactInfo?.phone ||
      (method === 'phone' ? contact.replace(/\D/g, '') : '');
    const email =
      ticket.bookingId?.contactInfo?.email ||
      ticket.contactInfo?.email ||
      (method === 'email' ? contact.trim() : '');
    const detailParams = new URLSearchParams();

    if (phone) detailParams.set('phone', phone);
    if (!phone && email) detailParams.set('email', email);

    const queryStr = detailParams.toString() ? `?${detailParams.toString()}` : '';
    navigate(`/booking/confirmation/${code}${queryStr}`);
  };

  const handleRebook = (ticket) => {
    const origin = ticket.tripInfo?.origin?.city || '';
    const destination = ticket.tripInfo?.destination?.city || '';
    navigate(
      `/search-results?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`
    );
  };

  const canCancelTicket = (ticket) => {
    if (ticket.status !== 'valid') return false;
    return dayjs().isBefore(dayjs(ticket.tripInfo?.departureTime));
  };

  const handleCancel = (ticket) => {
    setCancelTicket(ticket);
    setCancelReason('');
    setCancelOpen(true);
  };

  const closeCancelModal = () => {
    if (cancelLoading) return;
    setCancelOpen(false);
    setCancelTicket(null);
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelTicket) return;
    const refund = calcRefund(cancelTicket.totalPrice || 0, cancelTicket.tripInfo?.departureTime);
    if (!refund.canCancel) {
      message.error('Vé này không thể huỷ được nữa');
      return;
    }
    if (!cancelReason) {
      message.warning('Vui lòng chọn lý do huỷ vé');
      return;
    }

    // Use the booking's actual contact info (works for both phone- and
    // email-based lookup paths) and fall back to the contact used for lookup.
    const bookingPhone =
      cancelTicket.bookingId?.contactInfo?.phone ||
      cancelTicket.contactInfo?.phone ||
      lookupData.phone ||
      '';
    const bookingEmail =
      cancelTicket.bookingId?.contactInfo?.email ||
      cancelTicket.contactInfo?.email ||
      lookupData.email ||
      '';
    const bookingId =
      cancelTicket.bookingId?.bookingCode || cancelTicket.bookingCode || cancelTicket.ticketCode;

    setCancelLoading(true);
    try {
      const response = await cancelBookingGuest({
        bookingId,
        email: bookingEmail,
        phone: bookingPhone,
        reason: cancelReason,
      });

      // Prefer backend-reported refund over the client estimate.
      const backendRefund =
        response?.data?.refund ||
        response?.data?.refundInfo ||
        response?.data?.cancellation?.refund;
      const refundAmount =
        backendRefund?.refundAmount ?? backendRefund?.amount ?? refund.refundAmount ?? 0;

      message.success(
        refundAmount > 0
          ? `Huỷ vé thành công. Hoàn ${formatCurrency(refundAmount)} trong 3-5 ngày làm việc.`
          : 'Huỷ vé thành công. Vé không thuộc diện hoàn tiền.'
      );

      // Update the local ticket list so the row reflects the cancelled state.
      setTickets((prev) =>
        prev.map((t) => {
          const sameTicket =
            (t._id && t._id === cancelTicket._id) ||
            (t.ticketCode && t.ticketCode === cancelTicket.ticketCode);
          if (!sameTicket) return t;
          return {
            ...t,
            status: 'cancelled',
            refundAmount,
          };
        })
      );

      setCancelOpen(false);
      setCancelTicket(null);
      setCancelReason('');
    } catch (error) {
      console.error('Cancel ticket error:', error);
      message.error(
        error?.response?.data?.message || error?.message || 'Không thể huỷ vé. Vui lòng thử lại.'
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const totalSteps = 2;
  const hasSearch = searchText.trim().length > 0;

  return (
    <CustomerShell activeKey="lookup">
      {step !== 3 ? (
        <>
          <div className="border-b border-vxn-border bg-white">
            <div className="px-4 pt-6 lg:px-8">
              <CustomerBreadcrumb className="mb-4" items={[{ label: 'Tra cứu vé khách' }]} />
            </div>
          </div>

          <div className="px-4 py-8 lg:px-8">
            <div className="mx-auto grid w-full max-w-[108rem] gap-8 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
              {/* LEFT: form column */}
              <div className="flex flex-col gap-6">
                {step === 1 && (
                  <>
                    <div>
                      <StepIndicator current={1} total={totalSteps} />
                      <h1 className="m-0 mt-3 text-[34px] font-semibold leading-tight tracking-tight text-vxn-ink">
                        Tra cứu vé khách
                      </h1>
                      <p className="m-0 mt-3 text-[15px] leading-relaxed text-vxn-fg-3">
                        Nhập số điện thoại hoặc email đã dùng khi đặt vé. Hệ thống sẽ gửi{' '}
                        <strong className="text-vxn-ink">mã OTP 6 số</strong> để xác thực, và hiển
                        thị toàn bộ vé liên kết.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm">
                      <div className="mb-4">
                        <ContactPicker method={method} onChange={setMethod} />
                      </div>

                      <label className="mb-1.5 block text-[12px] font-medium text-vxn-fg-3">
                        {method === 'phone' ? 'Số điện thoại đặt vé *' : 'Email đặt vé *'}
                      </label>
                      <Input
                        size="large"
                        prefix={
                          method === 'phone' ? (
                            <PhoneOutlined style={{ color: '#94A3B8' }} />
                          ) : (
                            <MailOutlined style={{ color: '#94A3B8' }} />
                          )
                        }
                        placeholder={method === 'phone' ? '0901 234 567' : 'ban@example.com'}
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        onPressEnter={handleRequestOTP}
                        maxLength={method === 'phone' ? 16 : 80}
                        type={method === 'phone' ? 'tel' : 'email'}
                        className="!h-12 !rounded-lg"
                      />

                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<SearchOutlined />}
                        onClick={handleRequestOTP}
                        loading={loading}
                        className="!mt-5 !h-12 !rounded-lg !text-[15px] !font-semibold"
                        style={{ background: '#036672', borderColor: '#036672' }}
                      >
                        Gửi mã OTP
                      </Button>

                      <div className="mt-4 rounded-xl border-l-4 border-vxn-teal-400 bg-vxn-teal-50 p-3.5 text-[12.5px] leading-relaxed text-vxn-teal-800">
                        <strong>Lưu ý:</strong> Chỉ cần một trong hai (SĐT hoặc email) bạn đã dùng
                        khi đặt vé. Mã OTP có hiệu lực 5 phút.
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <StepIndicator current={2} total={totalSteps} />
                      <h1 className="m-0 mt-3 text-[34px] font-semibold leading-tight tracking-tight text-vxn-ink">
                        Nhập mã OTP để xem vé
                      </h1>
                      <p className="m-0 mt-3 text-[15px] leading-relaxed text-vxn-fg-3">
                        Đã gửi mã 6 số tới <strong className="text-vxn-ink">{maskedTarget}</strong>.
                        Mã có hiệu lực 5 phút.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-vxn-border bg-white p-7 shadow-sm">
                      <OtpInputs
                        value={otp}
                        onChange={(v) => {
                          setOtp(v);
                          if (otpError) setOtpError('');
                        }}
                        error={!!otpError}
                        disabled={loading}
                      />

                      {otpError && (
                        <p className="mt-3 text-center text-[12.5px] font-medium text-rose-600">
                          {otpError}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-center gap-4 text-[13px] text-vxn-fg-3">
                        <span className="inline-flex items-center gap-1.5">
                          <ClockCircleOutlined style={{ fontSize: 13 }} />
                          Còn lại {countdownLabel}
                        </span>
                        <span className="text-vxn-fg-5">·</span>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={loading || secondsLeft > OTP_TTL_SECONDS - 30}
                          className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-semibold text-vxn-teal-700 hover:text-vxn-teal-800 disabled:cursor-not-allowed disabled:text-vxn-fg-5"
                        >
                          <ReloadOutlined style={{ fontSize: 12 }} />
                          Gửi lại mã
                        </button>
                      </div>

                      <Button
                        type="primary"
                        block
                        size="large"
                        onClick={handleVerifyOTP}
                        loading={loading}
                        disabled={otp.length !== OTP_LENGTH}
                        className="!mt-5 !h-12 !rounded-lg !text-[15px] !font-semibold"
                        style={{ background: '#036672', borderColor: '#036672' }}
                      >
                        Xác nhận & xem vé
                      </Button>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="mx-auto mt-4 flex items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-medium text-vxn-teal-700 hover:text-vxn-teal-800"
                      >
                        <ArrowLeftOutlined style={{ fontSize: 12 }} />
                        Đổi {method === 'phone' ? 'số điện thoại' : 'email'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT: hero */}
              <HeroPanel />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* MyTickets-style header band */}
          <div className="border-b border-vxn-border bg-white">
            <div className="px-4 pt-6 lg:px-8">
              <CustomerBreadcrumb className="mb-4" items={[{ label: 'Tra cứu vé khách' }]} />
              <div className="flex flex-wrap items-end justify-between gap-3 pb-5">
                <div>
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-100 px-3 text-[11px] font-semibold tracking-[0.08em] text-emerald-700">
                    <CheckCircleOutlined style={{ fontSize: 12 }} />
                    XÁC THỰC THÀNH CÔNG
                  </span>
                  <h1 className="m-0 mt-2.5 text-[28px] font-semibold tracking-tight text-vxn-ink">
                    Vé tra cứu của bạn
                  </h1>
                  <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                    {method === 'phone' ? 'Số điện thoại' : 'Email'}:{' '}
                    <strong className="text-vxn-ink">{maskedTarget}</strong> · {tickets.length} vé
                    liên kết
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                    className="!h-10 !rounded-lg"
                  >
                    Tra cứu vé khác
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/')}
                    className="!h-10 !rounded-lg"
                    style={{ background: '#036672', borderColor: '#036672' }}
                  >
                    Đặt vé mới
                  </Button>
                </div>
              </div>
            </div>

            {tickets.length > 0 && (
              <TabBar
                activeKey={activeTab}
                counts={tabCounts}
                onChange={setActiveTab}
                search={searchText}
                onSearch={setSearchText}
              />
            )}
          </div>

          <div className="px-4 py-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              {activeTab === 'upcoming' && !hasSearch && (
                <FeaturedBanner ticket={featuredTicket} onView={handleShowQR} />
              )}

              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <TicketRow
                    key={t._id || t.ticketCode}
                    ticket={t}
                    onShowQR={handleShowQR}
                    onCancel={handleCancel}
                    onRebook={handleRebook}
                    onOpenDetail={handleOpenDetail}
                    canCancel={canCancelTicket(t)}
                  />
                ))
              ) : (
                <EmptyState
                  activeTab={activeTab}
                  noneAtAll={tickets.length === 0}
                  searching={hasSearch}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* QR Modal */}
      <Modal
        title={null}
        open={qrOpen}
        onCancel={() => {
          setQrOpen(false);
          setQrTicket(null);
        }}
        footer={null}
        closable={false}
        centered
        width={520}
      >
        {qrTicket && (
          <div className="relative pb-2 pt-1 text-center">
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="absolute right-0 top-0 grid h-9 w-9 place-items-center rounded-full border-0 bg-vxn-bg-mist text-vxn-fg-3 hover:bg-vxn-bg-cloud"
              aria-label="Đóng"
            >
              <CloseOutlined />
            </button>
            <div className="mb-2 text-[12px] font-semibold tracking-[0.08em] text-[#A8741A]">
              VÉ ĐIỆN TỬ
            </div>
            <div className="text-[18px] font-semibold text-vxn-ink">
              {qrTicket.tripInfo?.origin?.city} → {qrTicket.tripInfo?.destination?.city}
            </div>
            <div className="mt-0.5 text-[13px] text-vxn-fg-3">
              {dayjs(qrTicket.tripInfo?.departureTime).format('dddd, D [tháng] M, YYYY · HH:mm')}
            </div>

            <div
              className="mx-auto mt-5 inline-block rounded-2xl p-4"
              style={{
                background: 'linear-gradient(135deg, #FFF6E2 0%, #FFE9C4 60%, #FFD9A0 100%)',
                border: '1px solid #F2C677',
              }}
            >
              <div className="rounded-xl bg-white p-3">
                {qrTicket.qrCode ? (
                  <img src={qrTicket.qrCode} alt="QR Code" style={{ width: 280, height: 280 }} />
                ) : (
                  <div
                    className="grid place-items-center text-vxn-fg-5"
                    style={{ width: 280, height: 280 }}
                  >
                    <QrcodeOutlined style={{ fontSize: 64 }} />
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 font-mono text-[14px] text-vxn-ink">{qrTicket.ticketCode}</p>
            <p className="mt-1 text-[12px] text-vxn-fg-3">
              Vui lòng xuất trình mã QR khi lên xe · Có mặt trước giờ khởi hành 20 phút
            </p>
          </div>
        )}
      </Modal>

      {/* Cancel Ticket Modal — in-page, no re-verification */}
      <Modal
        open={cancelOpen}
        title={null}
        footer={null}
        closable={false}
        centered
        width={640}
        onCancel={closeCancelModal}
        maskClosable={!cancelLoading}
        keyboard={!cancelLoading}
        destroyOnHidden
      >
        {cancelTicket &&
          (() => {
            const refund = calcRefund(
              cancelTicket.totalPrice || 0,
              cancelTicket.tripInfo?.departureTime
            );
            const operatorName = getOperatorDisplayName(cancelTicket.operatorId, 'Nhà xe');
            const fromCity = cancelTicket.tripInfo?.origin?.city || '—';
            const toCity = cancelTicket.tripInfo?.destination?.city || '—';
            const dep = cancelTicket.tripInfo?.departureTime;
            const arr = cancelTicket.tripInfo?.arrivalTime;
            const seats =
              cancelTicket.passengers
                ?.map((p) => p.seatNumber)
                .filter(Boolean)
                .join(', ') || '—';
            const passengerCount = cancelTicket.passengers?.length || 0;

            const toneMap = {
              success: {
                bg: 'bg-emerald-50',
                text: 'text-emerald-800',
                accent: '#0F8458',
                icon: CheckCircleOutlined,
              },
              warning: {
                bg: 'bg-amber-50',
                text: 'text-amber-800',
                accent: '#B86A1B',
                icon: WarningOutlined,
              },
              danger: {
                bg: 'bg-rose-50',
                text: 'text-rose-800',
                accent: '#C0392B',
                icon: StopOutlined,
              },
              info: {
                bg: 'bg-vxn-teal-50',
                text: 'text-vxn-teal-800',
                accent: '#036672',
                icon: InfoCircleOutlined,
              },
            };
            const tone = toneMap[refund.tone] || toneMap.info;
            const ToneIcon = tone.icon;

            return (
              <div className="flex flex-col gap-5 px-1 py-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="m-0 text-[20px] font-semibold leading-tight text-vxn-ink">
                      Huỷ vé khách
                    </h3>
                    <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                      Bạn đã xác thực OTP. Chọn lý do và xác nhận huỷ — không cần nhập lại thông
                      tin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCancelModal}
                    disabled={cancelLoading}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-0 bg-vxn-bg-mist text-vxn-fg-3 transition hover:bg-vxn-bg-cloud disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Đóng"
                  >
                    <CloseOutlined />
                  </button>
                </div>

                {/* Booking summary */}
                <div className="rounded-xl border border-vxn-border bg-vxn-bg-soft p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="font-semibold text-vxn-ink">{operatorName}</span>
                    {cancelTicket.tripInfo?.busType && (
                      <>
                        <span className="text-vxn-fg-5">·</span>
                        <span className="text-vxn-fg-3">
                          {formatBusType(cancelTicket.tripInfo.busType, '')}
                        </span>
                      </>
                    )}
                    <span className="ml-auto font-mono text-[12px] text-vxn-fg-4">
                      {cancelTicket.ticketCode}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] tracking-wide text-vxn-fg-5">
                        {formatTime(dep)}
                      </div>
                      <div className="truncate text-[18px] font-bold leading-tight text-vxn-ink">
                        {fromCity}
                      </div>
                    </div>
                    <div className="flex-1 px-1 text-center">
                      <div className="relative h-[2px] bg-vxn-bg-fog">
                        <CarOutlined
                          style={{
                            position: 'absolute',
                            top: -7,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#F4F6F8',
                            padding: '0 4px',
                            fontSize: 13,
                            color: '#E89B26',
                          }}
                        />
                      </div>
                      <div className="mt-2 text-[11px] text-vxn-fg-5">{formatDateShort(dep)}</div>
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="text-[11px] tracking-wide text-vxn-fg-5">
                        {formatTime(arr)}
                      </div>
                      <div className="truncate text-[18px] font-bold leading-tight text-vxn-ink">
                        {toCity}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-vxn-border pt-2.5 text-[12px] text-vxn-fg-3">
                    <span>
                      <strong className="text-vxn-ink">{passengerCount}</strong> hành khách
                    </span>
                    <span className="text-vxn-fg-5">·</span>
                    <span>
                      ghế <strong className="text-vxn-ink">{seats}</strong>
                    </span>
                    <span className="text-vxn-fg-5">·</span>
                    <span>
                      <strong className="text-vxn-ink">
                        {formatCurrency(cancelTicket.totalPrice || 0)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Refund estimate */}
                <div
                  className={`flex items-start gap-3 rounded-xl border-l-4 ${tone.bg} p-3.5`}
                  style={{ borderLeftColor: tone.accent }}
                >
                  <ToneIcon style={{ color: tone.accent, fontSize: 18, marginTop: 2 }} />
                  <div className="min-w-0 flex-1">
                    <div className={`text-[13.5px] font-semibold ${tone.text}`}>{refund.label}</div>
                    {refund.canCancel && refund.refundAmount != null && (
                      <div className={`mt-0.5 text-[12.5px] ${tone.text} opacity-90`}>
                        Số tiền hoàn dự kiến:{' '}
                        <strong className="text-[14px]">
                          {refund.refundAmount > 0
                            ? formatCurrency(refund.refundAmount)
                            : 'Không hoàn tiền'}
                        </strong>
                        {typeof refund.hoursUntilDeparture === 'number' && (
                          <span className="ml-1.5">
                            · Còn{' '}
                            {refund.hoursUntilDeparture >= 1
                              ? `${Math.floor(refund.hoursUntilDeparture)} giờ`
                              : `${Math.max(
                                  Math.round(refund.hoursUntilDeparture * 60),
                                  0
                                )} phút`}{' '}
                            tới giờ khởi hành
                          </span>
                        )}
                      </div>
                    )}
                    {!refund.canCancel && (
                      <div className={`mt-0.5 text-[12.5px] ${tone.text} opacity-90`}>
                        Vé không thể huỷ vì chuyến đã khởi hành.
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason chips */}
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-vxn-ink">
                    Lý do huỷ <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CANCEL_REASONS.map((r) => {
                      const on = cancelReason === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setCancelReason(r)}
                          disabled={cancelLoading || !refund.canCancel}
                          className={`h-10 rounded-lg border px-3 text-[12.5px] leading-tight transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            on
                              ? 'border-vxn-saffron-600 bg-vxn-saffron-50 font-semibold text-vxn-saffron-700 ring-1 ring-vxn-saffron-600'
                              : 'border-vxn-border bg-white text-vxn-fg-2 hover:border-vxn-saffron-300 hover:bg-vxn-saffron-50/40'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Policy reminder */}
                <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-[12.5px] text-amber-900">
                  <p className="m-0 font-semibold">Chính sách huỷ vé:</p>
                  <ul className="m-0 ml-4 mt-1 list-disc space-y-0.5">
                    <li>Huỷ trước 2 giờ khởi hành: hoàn 100% giá vé</li>
                    <li>Huỷ trong 2 giờ trước khởi hành: không hoàn tiền</li>
                    <li>Sau khi xe khởi hành: không thể huỷ vé</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    onClick={closeCancelModal}
                    disabled={cancelLoading}
                    className="!h-11 !rounded-lg !px-5 sm:!w-auto"
                    block
                  >
                    Đóng
                  </Button>
                  <Button
                    danger
                    type="primary"
                    loading={cancelLoading}
                    disabled={!refund.canCancel || !cancelReason}
                    onClick={handleCancelConfirm}
                    className="!h-11 !rounded-lg !px-5 sm:!w-auto"
                    icon={!cancelLoading && <ExclamationCircleOutlined />}
                    block
                  >
                    {refund.canCancel ? 'Xác nhận huỷ vé' : 'Không thể huỷ'}
                  </Button>
                </div>
              </div>
            );
          })()}
      </Modal>
    </CustomerShell>
  );
};

export default GuestTicketLookupPage;
