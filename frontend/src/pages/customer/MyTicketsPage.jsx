import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal, Spin, message } from 'antd';
import {
  CarOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  PlusOutlined,
  QrcodeOutlined,
  SearchOutlined,
  StarOutlined,
  SyncOutlined,
  TagOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomerShell from '../../components/customer/CustomerShell';
import CustomerBreadcrumb from '../../components/customer/CustomerBreadcrumb';
import { accountBreadcrumbItem } from '../../components/customer/accountMenu';
import { getCustomerTickets, cancelTicket, resendTicket } from '../../services/ticketApi';
import { formatBusType } from '../../utils/busType';
import { getOperatorDisplayName } from '../../utils/operatorDisplay';

const TABS = [
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'past', label: 'Đã đi' },
  { key: 'cancelled', label: 'Đã huỷ' },
  { key: 'all', label: 'Tất cả' },
];

const STATUS_META = {
  valid: { tone: 'success', label: 'CÒN HIỆU LỰC' },
  used: { tone: 'neutral', label: 'ĐÃ DÙNG' },
  cancelled: { tone: 'danger', label: 'ĐÃ HUỶ' },
  expired: { tone: 'warning', label: 'HẾT HẠN' },
};

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatDateLong = (value) => (value ? dayjs(value).format('dddd, D [tháng] M, YYYY') : '—');

const formatTime = (value) => (value ? dayjs(value).format('HH:mm') : '--:--');

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

const TabBar = ({ activeKey, counts, onChange, search, onSearch, onFilter }) => (
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
        <Button icon={<FilterOutlined />} onClick={onFilter} className="!h-9 !rounded-lg">
          Lọc
        </Button>
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

const TicketRow = ({
  ticket,
  onShowQR,
  onResend,
  onCancel,
  onRebook,
  onReview,
  onTrackRefund,
  onOpenDetail,
}) => {
  const status = ticket.status;
  const meta = STATUS_META[status] || STATUS_META.valid;
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

  const isPaid = ticket.totalPrice > 0;
  const refundAmount =
    ticket.refundAmount ||
    (status === 'cancelled' ? Math.round((ticket.totalPrice || 0) * 0.9) : 0);

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
          {status === 'cancelled' && refundAmount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <SyncOutlined spin style={{ fontSize: 11 }} /> Hoàn {formatCurrency(refundAmount)}{' '}
              đang xử lý
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-vxn-fg-4 transition group-hover:text-vxn-saffron-700">
            Xem chi tiết
            <span aria-hidden="true" className="transition group-hover:translate-x-0.5"></span>
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
        <div className="mb-2 text-[11px] text-vxn-fg-5">
          {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </div>

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
            <Button
              size="middle"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(ticket);
              }}
              className="!h-9 !w-full !rounded-lg"
            >
              Huỷ vé
            </Button>
          </>
        )}
        {status === 'used' && (
          <>
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
            <Button
              size="middle"
              icon={<StarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onReview(ticket);
              }}
              className="!h-9 !w-full !rounded-lg"
            >
              Đánh giá chuyến
            </Button>
          </>
        )}
        {status === 'cancelled' && (
          <>
            <Button
              size="middle"
              onClick={(e) => {
                e.stopPropagation();
                onTrackRefund(ticket);
              }}
              className="!h-9 !w-full !rounded-lg"
            >
              Theo dõi hoàn tiền
            </Button>
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
          </>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ activeTab }) => {
  const copy = {
    upcoming: 'Bạn chưa có chuyến sắp tới. Hãy đặt một vé mới để bắt đầu.',
    past: 'Bạn chưa có vé nào đã đi. Lịch sử sẽ hiển thị tại đây sau khi hoàn thành chuyến.',
    cancelled: 'Không có vé bị huỷ. Mọi vé đã huỷ sẽ được lưu trữ ở đây.',
    all: 'Chưa có vé nào trong tài khoản của bạn.',
  };
  return (
    <div className="rounded-2xl border border-dashed border-vxn-border bg-white p-10 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-vxn-bg-mist">
        <TagOutlined style={{ fontSize: 22, color: '#475569' }} />
      </div>
      <p className="m-0 text-[14px] text-vxn-fg-3">{copy[activeTab] || copy.all}</p>
    </div>
  );
};

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [counts, setCounts] = useState({});

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrTicket, setQrTicket] = useState(null);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async (tab = activeTab, search = searchText) => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (tab && tab !== 'all') params.type = tab;
      if (search) params.search = search;
      const response = await getCustomerTickets(params);
      if (response.success) {
        const fetched = response.data?.tickets || [];
        setTickets(fetched);
        setCounts((prev) => ({ ...prev, [tab]: fetched.length }));
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Fetch tickets error:', error);
      message.error('Không thể tải danh sách vé');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(activeTab, searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchTickets(activeTab, searchText);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const featuredTicket = useMemo(() => {
    return tickets
      .filter((t) => t.status === 'valid')
      .sort((a, b) => dayjs(a.tripInfo?.departureTime).diff(dayjs(b.tripInfo?.departureTime)))[0];
  }, [tickets]);

  const handleShowQR = (ticket) => {
    setQrTicket(ticket);
    setQrModalVisible(true);
  };

  const handleOpenDetail = (ticket) => {
    if (!ticket) return;
    const code = ticket.bookingId?.bookingCode || ticket.bookingCode || ticket.ticketCode;
    if (!code) {
      message.warning('Không tìm thấy mã đặt vé');
      return;
    }
    const phone = ticket.bookingId?.contactInfo?.phone || ticket.contactInfo?.phone;
    const queryStr = phone ? `?phone=${phone}` : '';
    navigate(`/booking/confirmation/${code}${queryStr}`);
  };

  const handleResend = async (ticketId) => {
    try {
      await resendTicket(ticketId);
      message.success('Đã gửi lại vé qua email và SMS');
    } catch (error) {
      console.error('Resend error:', error);
      message.error('Không thể gửi lại vé');
    }
  };

  const handleCancelOpen = (ticket) => {
    setSelectedTicket(ticket);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedTicket) return;
    try {
      await cancelTicket(selectedTicket._id, cancelReason);
      message.success('Huỷ vé thành công. Tiền sẽ được hoàn lại trong 3-5 ngày làm việc.');
      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedTicket(null);
      fetchTickets(activeTab, searchText);
    } catch (error) {
      console.error('Cancel error:', error);
      message.error('Không thể huỷ vé');
    }
  };

  const handleRebook = (ticket) => {
    const origin = ticket.tripInfo?.origin?.city || '';
    const destination = ticket.tripInfo?.destination?.city || '';
    navigate(
      `/search-results?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`
    );
  };

  const handleReview = (ticket) => {
    navigate(`/my-reviews?ticketId=${ticket._id}`);
  };

  const handleTrackRefund = () => {
    navigate('/complaints');
  };

  const allCount = tickets.length;
  const tabCounts = {
    upcoming: counts.upcoming ?? (activeTab === 'upcoming' ? allCount : 0),
    past: counts.past ?? (activeTab === 'past' ? allCount : 0),
    cancelled: counts.cancelled ?? (activeTab === 'cancelled' ? allCount : 0),
    all: counts.all ?? (activeTab === 'all' ? allCount : 0),
  };

  return (
    <CustomerShell activeKey="tickets">
      <div className="border-b border-vxn-border bg-white">
        <div className="px-4 pt-6 lg:px-8">
          <CustomerBreadcrumb
            className="mb-4"
            items={[
              accountBreadcrumbItem(),
              { label: 'Hành trình của tôi' },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-3 pb-5">
            <div>
              <h1 className="m-0 text-[28px] font-semibold tracking-tight text-vxn-ink">
                Vé của tôi
              </h1>
              <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                Quản lý tất cả vé đã đặt qua Vé Xe Nhanh.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                icon={<QrcodeOutlined />}
                onClick={() => navigate('/tickets/lookup')}
                className="!h-10 !rounded-lg"
              >
                Tra cứu vé khách
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

        <TabBar
          activeKey={activeTab}
          counts={tabCounts}
          onChange={setActiveTab}
          search={searchText}
          onSearch={setSearchText}
          onFilter={() => message.info('Bộ lọc nâng cao sẽ được mở trong bản kế tiếp.')}
        />
      </div>

      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          {activeTab === 'upcoming' && (
            <FeaturedBanner ticket={featuredTicket} onView={handleShowQR} />
          )}

          {loading ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-vxn-border bg-white p-10">
              <Spin size="large" />
              <p className="text-[13px] text-vxn-fg-3">Đang tải danh sách vé...</p>
            </div>
          ) : tickets.length > 0 ? (
            tickets.map((t) => (
              <TicketRow
                key={t._id}
                ticket={t}
                onShowQR={handleShowQR}
                onResend={handleResend}
                onCancel={handleCancelOpen}
                onRebook={handleRebook}
                onReview={handleReview}
                onTrackRefund={handleTrackRefund}
                onOpenDetail={handleOpenDetail}
              />
            ))
          ) : (
            <EmptyState activeTab={activeTab} />
          )}
        </div>
      </div>

      {/* QR Modal */}
      <Modal
        title={null}
        open={qrModalVisible}
        onCancel={() => {
          setQrModalVisible(false);
          setQrTicket(null);
        }}
        footer={null}
        closable={false}
        centered
        width={520}
      >
        {qrTicket && (
          <div className="relative pb-3 pt-2 text-center">
            <button
              type="button"
              onClick={() => setQrModalVisible(false)}
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
              {formatDateLong(qrTicket.tripInfo?.departureTime)} ·{' '}
              {formatTime(qrTicket.tripInfo?.departureTime)}
            </div>

            <div
              className="mx-auto mt-5 inline-block rounded-2xl p-4"
              style={{
                background: 'linear-gradient(135deg, #FFF6E2 0%, #FFE9C4 60%, #FFD9A0 100%)',
                border: '1px solid #F2C677',
              }}
            >
              <div className="rounded-xl bg-white p-3">
                <img src={qrTicket.qrCode} alt="QR Code" style={{ width: 280, height: 280 }} />
              </div>
            </div>

            <p className="mt-4 font-mono text-[14px] text-vxn-ink">{qrTicket.ticketCode}</p>
            <p className="mt-1 text-[12px] text-vxn-fg-3">
              Vui lòng xuất trình mã QR khi lên xe · Có mặt trước giờ khởi hành 20 phút
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => handleResend(qrTicket._id)} className="!h-10 !rounded-lg">
                Gửi lại email
              </Button>
              <Button
                type="primary"
                onClick={() => setQrModalVisible(false)}
                className="!h-10 !rounded-lg"
                style={{ background: '#036672', borderColor: '#036672' }}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        title="Huỷ vé"
        open={cancelModalVisible}
        onOk={handleCancelConfirm}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelReason('');
          setSelectedTicket(null);
        }}
        okText="Xác nhận huỷ"
        cancelText="Đóng"
        okButtonProps={{ danger: true }}
        centered
      >
        <div className="flex flex-col gap-4 pt-1">
          <p className="m-0 text-[14px] text-vxn-ink">Bạn có chắc chắn muốn huỷ vé này?</p>

          {selectedTicket && (
            <div className="rounded-lg bg-vxn-bg-mist p-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-vxn-fg-5">Mã vé</span>
                <span className="font-mono font-semibold text-vxn-ink">
                  {selectedTicket.ticketCode}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-vxn-fg-5">Tuyến</span>
                <span className="font-medium text-vxn-ink">
                  {selectedTicket.tripInfo?.origin?.city} →{' '}
                  {selectedTicket.tripInfo?.destination?.city}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-vxn-fg-5">Khởi hành</span>
                <span className="font-medium text-vxn-ink">
                  {dayjs(selectedTicket.tripInfo?.departureTime).format('HH:mm · DD/MM/YYYY')}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-[13px] font-medium text-vxn-ink">
              Lý do huỷ vé (không bắt buộc)
            </label>
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: thay đổi lịch trình..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-[12.5px] text-amber-900">
            <p className="m-0 font-semibold">Chính sách huỷ vé:</p>
            <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
              <li>Huỷ trước 2 giờ khởi hành: hoàn 100% giá vé</li>
              <li>Huỷ trong 2 giờ trước khởi hành: không hoàn tiền</li>
              <li>Sau khi xe khởi hành: không thể huỷ vé</li>
            </ul>
          </div>
        </div>
      </Modal>
    </CustomerShell>
  );
};

export default MyTicketsPage;
