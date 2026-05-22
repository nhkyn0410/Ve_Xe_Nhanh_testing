/**
 * Operator Dashboard — faithful port of the "Trang quản lý nhà xe"
 * design package view-dashboard.jsx, wired to live operator data:
 *   • GET /operators/dashboard/stats   (KPIs, trends, upcoming trips)
 *   • GET /operators/buses             (fleet status donut)
 *   • GET /operators/payments          (recent transactions)
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useOperatorAuthStore from '../../store/operatorAuthStore';
import { dashboardApi, busesApi, paymentsApi } from '../../services/operatorApi';
import { getOperatorDisplayName } from '../../utils/operatorDisplay';
import {
  PageHeader, Btn, Select, Chip, Panel, TextLink, Donut, BarChart, Sparkline, KpiCard, VxnIcon,
} from '../../components/operator/vxn';

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const PERIOD_OPTS = [
  { value: 'day', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Năm nay' },
];

const BUS_STATUS_META = {
  active:      { label: 'Sẵn sàng',  color: '#15803D' },
  available:   { label: 'Sẵn sàng',  color: '#15803D' },
  in_trip:     { label: 'Đang chạy', color: '#1D4ED8' },
  on_trip:     { label: 'Đang chạy', color: '#1D4ED8' },
  maintenance: { label: 'Bảo dưỡng', color: '#B45309' },
  inactive:    { label: 'Ngừng hoạt động', color: '#64748B' },
  suspended:   { label: 'Tạm ngưng', color: '#B91C1C' },
};

const METHOD_LABEL = {
  vnpay: 'VNPay', momo: 'MoMo', zalopay: 'ZaloPay', cash: 'Tiền mặt',
  atm_card: 'Thẻ ATM', credit_card: 'Thẻ tín dụng', debit_card: 'Thẻ ghi nợ',
};

function moneyShort(n) {
  const v = Number(n) || 0;
  if (v >= 1e9) return `₫ ${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `₫ ${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `₫ ${(v / 1e3).toFixed(0)}K`;
  return `₫ ${v.toLocaleString('vi-VN')}`;
}

function relTime(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return dayjs(d).format('DD/MM HH:mm');
}

function txStatusChip(status) {
  if (status === 'completed') return <Chip tone="success" dot>Thành công</Chip>;
  if (status === 'pending' || status === 'processing') return <Chip tone="warn" dot>Chờ xử lý</Chip>;
  if (status === 'refunded' || status === 'partial_refund') return <Chip tone="danger" dot>Hoàn tiền</Chip>;
  return <Chip tone="neutral" dot>Thất bại</Chip>;
}

function routeOf(p) {
  const r = p?.bookingId?.tripId?.routeId;
  if (r?.routeName) return r.routeName;
  if (r?.origin?.city && r?.destination?.city) return `${r.origin.city} → ${r.destination.city}`;
  return p?.bookingId?.bookingCode || '—';
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { operator: user } = useOperatorAuthStore();
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const [statRes, busRes, payRes] = await Promise.allSettled([
        dashboardApi.getStats({ period }),
        busesApi.getMyBuses({ limit: 200 }),
        paymentsApi.getOperatorPayments(),
      ]);
      if (!alive) return;
      if (statRes.status === 'fulfilled' && statRes.value?.success) {
        setStats(statRes.value.data);
      }
      if (busRes.status === 'fulfilled' && busRes.value?.success) {
        const d = busRes.value.data;
        setBuses(Array.isArray(d) ? d : d?.buses || d?.docs || []);
      }
      if (payRes.status === 'fulfilled' && payRes.value?.success) {
        const d = payRes.value.data;
        setRecentTx((Array.isArray(d) ? d : d?.payments || []).slice(0, 6));
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [period]);

  const today = dayjs();
  const dateLabel = `${WEEKDAYS[today.day()]}, ${today.format('DD/MM/YYYY')}`;
  const operatorDisplayName = getOperatorDisplayName(user, 'nhà xe');

  const trend = stats?.trends?.bookings || [];
  const revSpark = trend.map((t) => Math.round((t.revenue || 0) / 1e6));
  const cntSpark = trend.map((t) => t.count || 0);

  const fleetSeg = useMemo(() => {
    const groups = {};
    buses.forEach((b) => {
      const key = b?.status || 'inactive';
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).map(([k, v]) => ({
      value: v,
      color: BUS_STATUS_META[k]?.color || '#94A3B8',
      label: BUS_STATUS_META[k]?.label || k,
    }));
  }, [buses]);
  const fleetTotal = buses.length;

  const rev = stats?.revenue || {};
  const trips = stats?.trips || {};
  const tickets = stats?.tickets || {};
  const bookings = stats?.bookings || {};

  const revBars = trend.map((t) => ({ v1: Math.round((t.revenue || 0) / 1e6) }));
  const revLabels = trend.map((t) => String(t.period));
  const cntBars = trend.map((t) => ({ v1: t.count || 0 }));

  const upcoming = stats?.upcomingTrips || [];

  // "Cần xử lý" — derived from real data, not fabricated.
  const alerts = [];
  if ((bookings.pending || 0) > 0) {
    alerts.push({ kind: 'warn', title: `${bookings.pending} đơn đang chờ xử lý`, sub: 'Cần xác nhận hoặc đối soát thanh toán' });
  }
  if ((bookings.cancellationRate || 0) > 10) {
    alerts.push({ kind: 'danger', title: `Tỷ lệ hủy cao: ${Number(bookings.cancellationRate).toFixed(1)}%`, sub: 'Vượt ngưỡng cảnh báo 10%' });
  }
  const lowOcc = upcoming.filter((t) => {
    const tot = t.totalSeats || 0;
    return tot > 0 && (t.bookedSeats?.length || 0) / tot < 0.4;
  });
  if (lowOcc.length) {
    alerts.push({ kind: 'info', title: `${lowOcc.length} chuyến sắp đi tỉ lệ lấp đầy thấp`, sub: 'Cân nhắc khuyến mãi để tăng vé bán' });
  }
  if ((trips.ongoing || 0) > 0) {
    alerts.push({ kind: 'success', title: `${trips.ongoing} chuyến đang vận hành`, sub: `${trips.completed || 0} chuyến đã hoàn thành kỳ này` });
  }
  const alertColor = (kind) => ({
    danger: { bg: 'var(--vxn-danger-bg)', fg: 'var(--vxn-danger-fg)' },
    warn: { bg: 'var(--vxn-warning-bg)', fg: 'var(--vxn-warning-fg)' },
    info: { bg: 'var(--vxn-info-bg)', fg: 'var(--vxn-teal-800)' },
    success: { bg: '#DCFCE7', fg: '#15803D' },
  }[kind]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Tổng quan hoạt động ${operatorDisplayName} — ${dateLabel}.`}
        cta={
          <div style={{ display: 'flex', gap: 10 }}>
            <Select value={period} onChange={setPeriod} options={PERIOD_OPTS} />
            <Btn kind="primary" icon="download" onClick={() => navigate('/operator/reports')}>
              Xuất báo cáo
            </Btn>
          </div>
        }
      />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Doanh thu kỳ này"
          value={moneyShort(rev.totalRevenue)}
          delta={`${(rev.revenueGrowth || 0) >= 0 ? '+' : ''}${Number(rev.revenueGrowth || 0).toFixed(1)}%`}
          deltaTone={(rev.revenueGrowth || 0) >= 0 ? 'up' : 'down'}
          sub="so với kỳ trước"
          spark={revSpark}
          color="var(--vxn-teal-700)"
          fill="rgba(0,100,129,0.10)"
          Spark={Sparkline}
        />
        <KpiCard
          label="Chuyến xe"
          value={(trips.total || 0).toLocaleString('vi-VN')}
          delta={`${trips.completed || 0} hoàn thành`}
          deltaTone="up"
          sub={`${trips.ongoing || 0} đang chạy · ${upcoming.length} sắp đi`}
          spark={cntSpark}
          color="#1D4ED8"
          fill="rgba(29,78,216,0.10)"
          Spark={Sparkline}
        />
        <KpiCard
          label="Vé đã bán"
          value={((tickets.used || 0) + (tickets.valid || 0)).toLocaleString('vi-VN')}
          delta={`${Math.round(trips.occupancyRate || 0)}% lấp đầy`}
          deltaTone="up"
          sub={`${trips.totalBooked || 0} / ${trips.totalSeats || 0} ghế`}
          spark={cntSpark}
          color="#15803D"
          fill="rgba(21,128,61,0.10)"
          Spark={Sparkline}
        />
        <KpiCard
          label="Cần xử lý"
          value={(bookings.pending || 0).toLocaleString('vi-VN')}
          delta={`${Number(bookings.cancellationRate || 0).toFixed(1)}% tỷ lệ hủy`}
          deltaTone={(bookings.cancellationRate || 0) > 10 ? 'down' : 'up'}
          sub={`${bookings.confirmed || 0} đã xác nhận · ${bookings.total || 0} tổng đơn`}
          spark={cntSpark}
          color="var(--vxn-danger-fg)"
          fill="rgba(239,68,68,0.10)"
          Spark={Sparkline}
        />
      </div>

      {/* Row 2: revenue chart + upcoming trips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        <Panel
          title="Doanh thu theo kỳ"
          action={
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#2B7EAD' }} /> Doanh thu (triệu ₫)
              </span>
            </div>
          }
          padding={20}
        >
          {revBars.length ? (
            <BarChart data={revBars} labels={revLabels} width={620} height={240} />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
              {loading ? 'Đang tải…' : 'Chưa có dữ liệu doanh thu'}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
              Tổng kỳ: <strong style={{ color: 'var(--vxn-ink)' }}>{moneyShort(rev.totalRevenue)}</strong>
              <span style={{ color: (rev.revenueGrowth || 0) >= 0 ? '#15803D' : 'var(--vxn-danger-fg)', marginLeft: 12 }}>
                {(rev.revenueGrowth || 0) >= 0 ? '↗' : '↘'} {Number(rev.revenueGrowth || 0).toFixed(1)}%
              </span>
            </div>
            <TextLink onClick={() => navigate('/operator/reports')}>Xem báo cáo đầy đủ</TextLink>
          </div>
        </Panel>

        <Panel
          title="Chuyến sắp khởi hành"
          action={<TextLink onClick={() => navigate('/operator/trips')}>Tất cả</TextLink>}
          padding={0}
        >
          <div>
            {upcoming.length === 0 && (
              <div style={{ padding: '24px 20px', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
                {loading ? 'Đang tải…' : 'Không có chuyến sắp khởi hành'}
              </div>
            )}
            {upcoming.slice(0, 5).map((t, i) => {
              const tot = t.totalSeats || 0;
              const booked = t.bookedSeats?.length || 0;
              const occ = tot > 0 ? Math.round((booked / tot) * 100) : 0;
              return (
                <div key={t._id || i} style={{
                  padding: '14px 20px',
                  borderBottom: i < Math.min(upcoming.length, 5) - 1 ? '1px solid var(--vxn-border)' : 0,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
                        {t.routeId?.routeName || 'Tuyến'}
                      </div>
                      <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
                        {t.busId?.busNumber || '—'} · {dayjs(t.departureTime).format('DD/MM HH:mm')} · {booked}/{tot} ghế
                      </div>
                    </div>
                    <span style={{ font: '600 13px var(--font-display)', color: 'var(--vxn-teal-800)' }}>{occ}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#E5E8F1', overflow: 'hidden' }}>
                    <div style={{
                      width: `${occ}%`, height: '100%',
                      background: occ > 90 ? '#15803D' : 'var(--vxn-teal-700)', borderRadius: 3,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Row 3: fleet donut + bookings bars + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 16, marginBottom: 16 }}>
        <Panel title="Tình trạng đội xe" padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Donut segments={fleetSeg.length ? fleetSeg : [{ value: 1, color: '#E5E8F1', label: '—' }]} size={150} thickness={20} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <div style={{ font: '700 28px var(--font-display)', color: 'var(--vxn-ink)', lineHeight: 1 }}>{fleetTotal}</div>
                  <div style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>tổng xe</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(fleetSeg.length ? fleetSeg : []).map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>{s.label}</span>
                  <span style={{ font: '600 13px var(--font-display)', color: 'var(--vxn-ink)' }}>{s.value}</span>
                </div>
              ))}
              {!fleetSeg.length && (
                <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
                  {loading ? 'Đang tải…' : 'Chưa có xe nào'}
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel
          title="Mật độ đặt vé theo kỳ"
          action={<span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Số đơn / mốc thời gian</span>}
          padding={20}
        >
          {cntBars.length ? (
            <BarChart data={cntBars} labels={revLabels} width={460} height={200} color="#226A92" />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
              {loading ? 'Đang tải…' : 'Chưa có dữ liệu'}
            </div>
          )}
        </Panel>

        <Panel title="Cần xử lý" action={<TextLink onClick={() => navigate('/operator/transactions')}>Xem hết</TextLink>} padding={0}>
          <div>
            {alerts.length === 0 && (
              <div style={{ padding: '24px 20px', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
                {loading ? 'Đang tải…' : 'Không có cảnh báo nào'}
              </div>
            )}
            {alerts.map((a, i) => {
              const c = alertColor(a.kind);
              const icon = { danger: 'triangle-alert', warn: 'wrench', info: 'message-square-warning', success: 'circle-check' }[a.kind];
              return (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '14px 20px',
                  borderBottom: i < alerts.length - 1 ? '1px solid var(--vxn-border)' : 0,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: c.bg, color: c.fg,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <VxnIcon name={icon} size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{a.title}</div>
                    <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{a.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Row 4: recent transactions */}
      <Panel
        title="Giao dịch gần đây"
        action={<TextLink onClick={() => navigate('/operator/transactions')}>Xem tất cả</TextLink>}
        padding={0}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Mã GD', 'Khách hàng', 'Tuyến', 'Số tiền', 'PT thanh toán', 'Trạng thái', 'Thời gian'].map((c, i) => (
                <th key={i} style={{
                  background: '#FBFCFE', textAlign: 'left', padding: '10px 16px',
                  font: '500 11px var(--font-display)', letterSpacing: '.05em',
                  textTransform: 'uppercase', color: 'var(--vxn-fg-5)',
                  borderBottom: '1px solid var(--vxn-border)',
                }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTx.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
                {loading ? 'Đang tải…' : 'Chưa có giao dịch'}
              </td></tr>
            )}
            {recentTx.map((t, i) => (
              <tr key={t._id || t.paymentCode || i} style={{ borderBottom: i < recentTx.length - 1 ? '1px solid var(--vxn-border)' : 0 }}>
                <td style={{ padding: '12px 16px', font: '500 13px var(--font-mono)', color: 'var(--vxn-teal-800)' }}>#{t.paymentCode}</td>
                <td style={{ padding: '12px 16px', font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>
                  {t.customerId?.fullName || t.bookingId?.contactInfo?.name || 'Khách lẻ'}
                </td>
                <td style={{ padding: '12px 16px', font: '400 13.5px var(--font-display)', color: 'var(--vxn-fg-2)' }}>{routeOf(t)}</td>
                <td style={{ padding: '12px 16px', font: '600 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{(t.amount || 0).toLocaleString('vi-VN')} ₫</td>
                <td style={{ padding: '12px 16px', font: '400 13.5px var(--font-display)', color: 'var(--vxn-fg-2)' }}>{METHOD_LABEL[t.paymentMethod] || t.paymentMethod}</td>
                <td style={{ padding: '12px 16px' }}>{txStatusChip(t.status)}</td>
                <td style={{ padding: '12px 16px', font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{relTime(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
};

export default DashboardPage;
