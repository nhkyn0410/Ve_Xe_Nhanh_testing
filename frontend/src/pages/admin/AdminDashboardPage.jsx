/**
 * System-admin · Tổng quan — faithful port of the "Trang admin hệ thống"
 * design package admin-dashboard.jsx, wired to the real
 * GET /admin/reports/overview + /admin/complaints/statistics endpoints.
 *
 * Honesty-over-pixel-match: the design's fabricated cards that have no
 * backing data (realtime "system health", hard-coded "regional split",
 * synthetic activity feed) are replaced with real operations data — same
 * card visuals, true numbers.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { message } from 'antd';
import { adminReports, adminComplaints } from '../../services/adminApi';
import {
  PageHeader, Btn, KpiCard, Card, Skeleton, MoneyVND, ShortMoney, VxnIcon,
} from '../../components/admin/vxn';

const PERIODS = [
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
  { key: '90', label: '90 ngày' },
];

/* Faithful port of the design's RevenueChart (gradient area sparkline). */
function RevenueChart({ trend }) {
  const data = trend.length ? trend.map((d) => d.revenue) : [0, 0];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const W = 100, H = 36;
  const span = Math.max(1, max - min);
  const pts = data.map((v, i) => {
    const x = data.length === 1 ? W : (i / (data.length - 1)) * W;
    const y = H - ((v - min) / span) * H * 0.85 - 2;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ');
  const area = `${path} L ${W},${H} L 0,${H} Z`;
  const fmtTick = (t) => (trend[t] ? dayjs(trend[t].date).format('DD/MM') : '');
  const ticks = trend.length
    ? [0, Math.floor(trend.length / 4), Math.floor(trend.length / 2), Math.floor((trend.length * 3) / 4), trend.length - 1]
    : [];
  return (
    <div style={{ position: 'relative', height: 200 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="adm-rev-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#006481" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#006481" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#adm-rev-grad)" />
        <path d={path} stroke="#006481" strokeWidth="0.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {pts.length > 0 && (
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="0.9" fill="#E89B26" stroke="#fff" strokeWidth="0.4" />
        )}
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: -4,
        display: 'flex', justifyContent: 'space-between',
        font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)',
      }}>
        {ticks.map((t, i) => <span key={i}>{fmtTick(t)}</span>)}
      </div>
    </div>
  );
}

function Stat({ label, value, delta, deltaTone }) {
  return (
    <div>
      <div style={{
        font: '500 11px var(--font-display)', letterSpacing: '0.06em',
        color: 'var(--vxn-fg-5)', textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{ font: '600 18px var(--font-display)', color: 'var(--vxn-ink)', marginTop: 4 }}>{value}</div>
      {delta && (
        <div style={{
          font: '500 11.5px var(--font-display)',
          color: deltaTone === 'up' ? '#15803D' : deltaTone === 'down' ? '#B91C1C' : 'var(--vxn-fg-4)',
          marginTop: 2,
        }}>
          {deltaTone === 'up' && '↑ '}{deltaTone === 'down' && '↓ '}{delta}
        </div>
      )}
    </div>
  );
}

const CMP_TONE = {
  open: { bg: 'var(--vxn-info-bg)', fg: 'var(--vxn-teal-800)', icon: 'message-square-warning' },
  in_progress: { bg: 'var(--vxn-warning-bg)', fg: 'var(--vxn-warning-fg)', icon: 'hourglass' },
  resolved: { bg: '#DCFCE7', fg: '#15803D', icon: 'circle-check' },
  closed: { bg: 'var(--vxn-bg-mist)', fg: 'var(--vxn-fg-3)', icon: 'archive' },
  rejected: { bg: 'var(--vxn-danger-bg)', fg: 'var(--vxn-danger-fg)', icon: 'ban' },
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [cmpStats, setCmpStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const endDate = dayjs();
        const startDate = endDate.subtract(Number(period), 'day');
        const [ov, cs, rc] = await Promise.allSettled([
          adminReports.getSystemOverview({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
          adminComplaints.getStatistics(),
          adminComplaints.getComplaints({ limit: 6, page: 1, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);
        if (!alive) return;
        if (ov.status === 'fulfilled' && ov.value?.success) setData(ov.value.data);
        if (cs.status === 'fulfilled' && cs.value?.success) setCmpStats(cs.value.data);
        if (rc.status === 'fulfilled') {
          const list = rc.value?.data?.complaints || rc.value?.data?.docs || rc.value?.data || [];
          setRecent(Array.isArray(list) ? list.slice(0, 6) : []);
        }
      } catch (err) {
        message.error(typeof err === 'string' ? err : 'Không thể tải dữ liệu tổng quan');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [period]);

  const ov = data?.overview || {};
  const rev = data?.revenue || {};
  const growth = data?.growth || {};
  const trend = (data?.revenueTrend || []).map((d) => ({ ...d, revenue: Number(d.revenue) || 0 }));
  const topOperators = data?.topOperators || [];
  const topRoutes = data?.topRoutes || [];

  const totalRev = Number(rev.totalRevenue) || 0;
  const days = Math.max(1, trend.length);
  const avgPerDay = totalRev / days;
  const peakDay = trend.reduce((m, d) => (d.revenue > m.revenue ? d : m), { revenue: 0, date: null });
  const opMax = topOperators.reduce((m, o) => Math.max(m, Number(o.totalRevenue) || 0), 0) || 1;
  const rtMax = topRoutes.reduce((m, r) => Math.max(m, Number(r.totalRevenue) || 0), 0) || 1;

  const today = dayjs();
  const fmtToday = today.format('dddd, DD/MM/YYYY');
  const openComplaints = cmpStats?.byStatus?.open ?? cmpStats?.open ?? cmpStats?.totalOpen ?? 0;
  const urgentComplaints = cmpStats?.byPriority?.urgent ?? cmpStats?.urgent ?? 0;

  return (
    <div>
      <PageHeader
        title="Tổng quan hệ thống"
        description={`Hoạt động toàn nền tảng Vé Xe Nhanh — ${fmtToday.charAt(0).toUpperCase()}${fmtToday.slice(1)}`}
        cta={(
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                height: 36, padding: '0 14px', borderRadius: 999,
                border: '1px solid ' + (period === p.key ? 'var(--vxn-teal-700)' : 'var(--vxn-border)'),
                background: period === p.key ? 'var(--vxn-teal-700)' : '#fff',
                color: period === p.key ? '#fff' : 'var(--vxn-fg-3)',
                font: '500 13px var(--font-display)', cursor: 'pointer',
              }}>{p.label}</button>
            ))}
          </div>
        )}
      />

      {/* KPI strip — all real */}
      <div className="admin-grid" style={{ marginBottom: 20 }}>
        {loading && !data ? (
          [0, 1, 2, 3, 4].map((i) => (
            <Card key={i} padding={20}><Skeleton height={92} /></Card>
          ))
        ) : (
          <>
            <KpiCard label={`Doanh thu ${period} ngày`} value={ShortMoney(totalRev) + ' đ'}
              delta={growth.revenueGrowth != null ? `${Math.abs(growth.revenueGrowth)}%` : null}
              deltaTone={growth.revenueGrowth >= 0 ? 'up' : 'down'} sub="vs kỳ trước"
              icon="banknote" iconBg="#E0F2FE" accent="var(--vxn-teal-700)" />
            <KpiCard label="Vé đã bán" value={Number(rev.totalTickets || 0).toLocaleString('vi-VN')}
              delta={growth.bookingsGrowth != null ? `${Math.abs(growth.bookingsGrowth)}%` : null}
              deltaTone={growth.bookingsGrowth >= 0 ? 'up' : 'down'}
              sub={`trên ${Number(ov.totalTrips || 0).toLocaleString('vi-VN')} chuyến`}
              icon="ticket" iconBg="#FEF3D7" accent="var(--vxn-saffron-600)" />
            <KpiCard label="Nhà xe hoạt động" value={`${ov.approvedOperators || 0} / ${ov.totalOperators || 0}`}
              delta={ov.pendingOperators ? `${ov.pendingOperators} chờ duyệt` : null}
              deltaTone={ov.pendingOperators ? 'down' : 'flat'} sub="đã được duyệt"
              icon="building-2" iconBg="#DBEAFE" accent="#2563EB" />
            <KpiCard label="Khách hàng tích cực" value={Number(ov.activeUsers || 0).toLocaleString('vi-VN')}
              delta={ov.newUsers != null ? `+${Number(ov.newUsers).toLocaleString('vi-VN')}` : null}
              deltaTone="up" sub={`mới trong ${period} ngày`}
              icon="users-round" iconBg="#DCFCE7" accent="#15803D" />
            <KpiCard label="Khiếu nại đang mở" value={Number(openComplaints).toLocaleString('vi-VN')}
              delta={urgentComplaints ? `${urgentComplaints} ưu tiên cao` : null}
              deltaTone={urgentComplaints ? 'down' : 'flat'} sub="cần xử lý"
              icon="message-square-warning" iconBg="#FEE2E2" accent="#B91C1C" />
          </>
        )}
      </div>

      {/* Revenue trend | Operations summary */}
      <div className="admin-grid-2" style={{ marginBottom: 20 }}>
        <Card title="Doanh thu hệ thống" subtitle={`${period} ngày gần nhất · VND`}>
          {loading && !data ? <Skeleton height={200} /> : <RevenueChart trend={trend} />}
          <div style={{ display: 'flex', gap: 32, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--vxn-border-muted)', flexWrap: 'wrap' }}>
            <Stat label={`Tổng ${period} ngày`} value={ShortMoney(totalRev) + ' đ'}
              delta={growth.revenueGrowth != null ? `${growth.revenueGrowth}%` : null}
              deltaTone={growth.revenueGrowth >= 0 ? 'up' : 'down'} />
            <Stat label="Trung bình / ngày" value={ShortMoney(avgPerDay) + ' đ'} />
            <Stat label="Cao nhất"
              value={ShortMoney(peakDay.revenue) + ' đ'}
              delta={peakDay.date ? dayjs(peakDay.date).format('DD/MM') : null} />
            <Stat label="Giá trị TB / vé" value={MoneyVND(Math.round(rev.averageOrderValue || 0))} />
          </div>
        </Card>

        <Card title="Tổng quan vận hành" subtitle={`Trong ${period} ngày gần nhất`}>
          {[
            { label: 'Tổng chuyến xe', sub: 'đã lên lịch trong kỳ', value: Number(ov.totalTrips || 0).toLocaleString('vi-VN'), tone: 'ok' },
            { label: 'Chuyến hoàn thành', sub: 'đã khai thác xong', value: Number(ov.completedTrips || 0).toLocaleString('vi-VN'), tone: 'ok' },
            { label: 'Tổng lượt đặt vé', sub: `${Number(ov.paidBookings || 0).toLocaleString('vi-VN')} đã thanh toán`, value: Number(ov.totalBookings || 0).toLocaleString('vi-VN'), tone: 'ok' },
            { label: 'Tỷ lệ hủy / hoàn', sub: 'trên tổng đặt vé', value: `${ov.cancellationRate || 0}%`, tone: Number(ov.cancellationRate) > 10 ? 'warn' : 'ok' },
          ].map((h, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--vxn-border-muted)' : 'none',
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: h.tone === 'ok' ? '#15803D' : '#E89B26',
                boxShadow: h.tone === 'ok' ? '0 0 0 4px rgba(21,128,61,.12)' : '0 0 0 4px rgba(232,155,38,.12)',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{h.label}</div>
                <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-4)', marginTop: 2 }}>{h.sub}</div>
              </div>
              <div style={{ font: '600 16px var(--font-display)', color: 'var(--vxn-fg-2)' }}>{h.value}</div>
            </div>
          ))}
          {Number(ov.pendingOperators) > 0 && (
            <div style={{
              marginTop: 14, padding: 12, borderRadius: 8, background: 'var(--vxn-info-bg)',
              display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
            }} onClick={() => navigate('/admin/operators')}>
              <VxnIcon name="shield-alert" size={18} color="var(--vxn-teal-800)" style={{ marginTop: 1 }} />
              <div style={{ font: '400 12.5px var(--font-display)', color: 'var(--vxn-teal-800)' }}>
                Có <strong>{ov.pendingOperators}</strong> nhà xe đang chờ duyệt hồ sơ. Nhấn để xử lý ngay.
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Top operators | Top routes (both real) */}
      <div className="admin-grid-2" style={{ marginBottom: 20 }}>
        <Card title="Top nhà xe theo doanh thu" subtitle={`${period} ngày gần nhất`}
          action={<a onClick={() => navigate('/admin/operators')} style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-700)', cursor: 'pointer' }}>Xem tất cả →</a>}
          padding={0}>
          {topOperators.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Chưa có dữ liệu doanh thu trong kỳ.</div>
          ) : topOperators.slice(0, 6).map((op, i, arr) => (
            <div key={op._id || i} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 14, alignItems: 'center',
              padding: '14px 24px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--vxn-border-muted)' : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: i === 0 ? 'var(--vxn-saffron-600)' : 'var(--vxn-bg-mist)',
                color: i === 0 ? '#fff' : 'var(--vxn-fg-3)',
                font: '600 12px var(--font-display)', display: 'grid', placeItems: 'center',
              }}>{i + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{op.companyName || '—'}</div>
                <div style={{ marginTop: 6, position: 'relative', height: 4, borderRadius: 4, background: 'var(--vxn-bg-mist)', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    width: `${((Number(op.totalRevenue) || 0) / opMax) * 100}%`,
                    background: i === 0 ? 'var(--vxn-saffron-600)' : 'var(--vxn-teal-700)', borderRadius: 4,
                  }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 120 }}>
                <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{ShortMoney(op.totalRevenue)} đ</div>
                <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
                  {Number(op.totalTickets || 0).toLocaleString('vi-VN')} vé · {Number(op.totalBookings || 0).toLocaleString('vi-VN')} đơn
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Top tuyến đường" subtitle="Theo doanh thu trong kỳ" padding={0}>
          {topRoutes.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Chưa có dữ liệu tuyến trong kỳ.</div>
          ) : topRoutes.slice(0, 6).map((r, i, arr) => (
            <div key={r._id || i} style={{
              padding: '14px 24px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--vxn-border-muted)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.routeName || `${r.origin?.province || r.origin || ''} → ${r.destination?.province || r.destination || ''}`}
                </span>
                <span style={{ color: 'var(--vxn-ink)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  <strong>{ShortMoney(r.totalRevenue)} đ</strong>
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: 'var(--vxn-bg-mist)', marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${((Number(r.totalRevenue) || 0) / rtMax) * 100}%`, background: i === 0 ? 'var(--vxn-teal-700)' : 'var(--vxn-teal-500)', borderRadius: 6 }} />
              </div>
              <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 6 }}>
                {Number(r.totalBookings || 0).toLocaleString('vi-VN')} đặt vé · {Number(r.totalTickets || 0).toLocaleString('vi-VN')} vé
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent activity — real recent complaints */}
      <Card title="Hoạt động gần đây" subtitle="Khiếu nại mới nhất toàn hệ thống"
        action={<Btn kind="ghost" icon="arrow-right" onClick={() => navigate('/admin/complaints')}>Xem khiếu nại</Btn>}>
        {recent.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
            Không có hoạt động khiếu nại gần đây.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recent.map((c, i) => {
              const tone = CMP_TONE[c.status] || CMP_TONE.open;
              return (
                <div key={c._id || i} onClick={() => navigate('/admin/complaints')} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', cursor: 'pointer',
                  borderBottom: i < recent.length - 1 ? '1px solid var(--vxn-border-muted)' : 'none',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, background: tone.bg, color: tone.fg,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <VxnIcon name={tone.icon} size={18} color={tone.fg} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.subject || c.title || 'Khiếu nại'}
                    </div>
                    <div style={{ font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-4)', marginTop: 3 }}>
                      {(c.customerId?.fullName || c.customer?.fullName || c.customerName || 'Khách hàng')}
                      {c.operatorId?.companyName ? ` · ${c.operatorId.companyName}` : ''}
                    </div>
                  </div>
                  <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', whiteSpace: 'nowrap' }}>
                    {c.createdAt ? dayjs(c.createdAt).fromNow?.() || dayjs(c.createdAt).format('DD/MM HH:mm') : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
