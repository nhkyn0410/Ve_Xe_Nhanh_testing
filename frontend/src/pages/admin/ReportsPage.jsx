/**
 * System-admin · Báo cáo — faithful VXN port of the "Trang admin hệ thống"
 * design package admin-reports.jsx, wired to the real
 * GET /admin/reports/overview endpoint.
 *
 * Honesty-over-pixel-match: the design depicts a report subsystem that does
 * not exist in this backend — a fake "Mẫu báo cáo" template catalog with
 * download buttons, a fabricated 4-quarter revenue projection, and a
 * "Lịch sử xuất báo cáo" export-history table with synthetic file sizes.
 * None of that is backed by data. It is rebuilt here as a REAL analytics
 * report center:
 *   • the fake KPI tiles → real revenue / tickets / new-users / cancel rate
 *   • the fake template grid → a true system-wide indicator grid
 *   • the fake YoY column   → real bookings·tickets per route
 *   • the projected QuarterChart → the real daily revenue trend
 *   • the fake export history → real Top nhà xe theo doanh thu
 *   • the fake "Báo cáo tùy chỉnh" CTA → a working client-side CSV export
 *     of exactly the real data on screen.
 */
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { message } from 'antd';
import { adminReports } from '../../services/adminApi';
import {
  PageHeader, Btn, Select, Card, Table, KpiCard, Skeleton, EmptyState,
  VxnIcon, MoneyVND, ShortMoney,
} from '../../components/admin/vxn';

const PERIODS = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
  { value: '365', label: '12 tháng' },
];

const num = (v) => Number(v || 0).toLocaleString('vi-VN');
const prov = (x) => (x && typeof x === 'object' ? (x.province || x.name || x.city || '') : (x || ''));
const routeLabel = (r) =>
  r.routeName || `${prov(r.origin)} → ${prov(r.destination)}`.replace(/^ → $/, '').trim() || '—';
const pct = (v) => (v == null ? null : `${Math.abs(Number(v)).toFixed(1)}%`);

/* Responsive daily-revenue area chart — the proven dashboard pattern, reused
   here in place of the design's fabricated QuarterChart projection. */
function RevenueTrend({ trend }) {
  const data = trend.length ? trend.map((d) => Number(d.revenue) || 0) : [0, 0];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const W = 100, H = 34;
  const span = Math.max(1, max - min);
  const pts = data.map((v, i) => {
    const x = data.length === 1 ? W : (i / (data.length - 1)) * W;
    const y = H - ((v - min) / span) * H * 0.84 - 2;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ');
  const area = `${path} L ${W},${H} L 0,${H} Z`;
  const ticks = trend.length
    ? [0, Math.floor(trend.length / 4), Math.floor(trend.length / 2), Math.floor((trend.length * 3) / 4), trend.length - 1]
    : [];
  return (
    <div style={{ position: 'relative', height: 190 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="adm-rpt-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#006481" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#006481" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#adm-rpt-grad)" />
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
        {ticks.map((t, i) => <span key={i}>{trend[t] ? dayjs(trend[t].date).format('DD/MM') : ''}</span>)}
      </div>
    </div>
  );
}

/* CSV of exactly the real on-screen data — the honest replacement for the
   design's "Báo cáo tùy chỉnh" / per-template download buttons. */
function buildCsv(data) {
  const ov = data.overview || {};
  const rev = data.revenue || {};
  const g = data.growth || {};
  const dr = data.dateRange || {};
  const esc = (c) => {
    const s = String(c == null ? '' : c);
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const line = (arr) => arr.map(esc).join(',');
  const L = [];
  L.push(line(['Báo cáo tổng quan hệ thống — Vé Xe Nhanh']));
  L.push(line([
    'Kỳ báo cáo',
    `${dayjs(dr.start).format('DD/MM/YYYY')} - ${dayjs(dr.end).format('DD/MM/YYYY')}`,
  ]));
  L.push(line(['Xuất lúc', dayjs().format('DD/MM/YYYY HH:mm')]));
  L.push('');
  L.push(line(['CHỈ SỐ', 'GIÁ TRỊ']));
  L.push(line(['Tổng doanh thu (đ)', rev.totalRevenue || 0]));
  L.push(line(['Tăng trưởng doanh thu (%)', g.revenueGrowth ?? '']));
  L.push(line(['Vé đã bán', rev.totalTickets || 0]));
  L.push(line(['Giá trị TB/đơn (đ)', Math.round(rev.averageOrderValue || 0)]));
  L.push(line(['Tổng đặt vé', ov.totalBookings || 0]));
  L.push(line(['Đặt vé đã thanh toán', ov.paidBookings || 0]));
  L.push(line(['Đặt vé đã hủy', ov.cancelledBookings || 0]));
  L.push(line(['Tỷ lệ hủy (%)', ov.cancellationRate ?? '']));
  L.push(line(['Tổng chuyến xe', ov.totalTrips || 0]));
  L.push(line(['Chuyến hoàn thành', ov.completedTrips || 0]));
  L.push(line(['Tổng người dùng', ov.totalUsers || 0]));
  L.push(line(['Khách hàng mới', ov.newUsers || 0]));
  L.push(line(['Khách hàng hoạt động', ov.activeUsers || 0]));
  L.push(line(['Tổng nhà xe', ov.totalOperators || 0]));
  L.push(line(['Nhà xe đã duyệt', ov.approvedOperators || 0]));
  L.push(line(['Nhà xe chờ duyệt', ov.pendingOperators || 0]));
  L.push('');
  L.push(line(['DOANH THU THEO NGÀY']));
  L.push(line(['Ngày', 'Doanh thu (đ)', 'Đặt vé', 'Vé']));
  (data.revenueTrend || []).forEach((d) =>
    L.push(line([dayjs(d.date).format('DD/MM/YYYY'), d.revenue || 0, d.bookings || 0, d.tickets || 0])));
  L.push('');
  L.push(line(['TOP TUYẾN THEO DOANH THU']));
  L.push(line(['#', 'Tuyến', 'Doanh thu (đ)', 'Đặt vé', 'Vé']));
  (data.topRoutes || []).forEach((r, i) =>
    L.push(line([i + 1, routeLabel(r), r.totalRevenue || 0, r.totalBookings || 0, r.totalTickets || 0])));
  L.push('');
  L.push(line(['TOP NHÀ XE THEO DOANH THU']));
  L.push(line(['#', 'Nhà xe', 'Doanh thu (đ)', 'Đặt vé', 'Vé']));
  (data.topOperators || []).forEach((o, i) =>
    L.push(line([i + 1, o.companyName || '', o.totalRevenue || 0, o.totalBookings || 0, o.totalTickets || 0])));
  return `﻿${L.join('\r\n')}`;
}

function rankCell(_, i) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 4,
      background: i === 0 ? 'var(--vxn-saffron-600)' : 'var(--vxn-bg-mist)',
      color: i === 0 ? '#fff' : 'var(--vxn-fg-3)',
      display: 'grid', placeItems: 'center', font: '600 11px var(--font-display)',
    }}>{i + 1}</div>
  );
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const endDate = dayjs();
        const startDate = endDate.subtract(Number(period), 'day');
        const res = await adminReports.getSystemOverview({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        if (!alive) return;
        if (res?.success) setData(res.data);
        else setData(null);
      } catch (err) {
        if (alive) {
          setData(null);
          message.error(typeof err === 'string' ? err : 'Không thể tải dữ liệu báo cáo');
        }
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
  const topRoutes = data?.topRoutes || [];
  const topOperators = data?.topOperators || [];
  const dr = data?.dateRange || {};

  const totalRev = Number(rev.totalRevenue) || 0;
  const days = Math.max(1, trend.length);
  const avgPerDay = totalRev / days;
  const peakDay = trend.reduce((m, d) => (d.revenue > m.revenue ? d : m), { revenue: 0, date: null });
  const periodLabel = (PERIODS.find((p) => p.value === period) || {}).label || `${period} ngày`;
  const rangeText = dr.start
    ? `${dayjs(dr.start).format('DD/MM')}–${dayjs(dr.end).format('DD/MM/YYYY')}`
    : periodLabel;

  const handleExport = () => {
    if (!data) return;
    try {
      const blob = new Blob([buildCsv(data)], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-vexenhanh-${dayjs(dr.start).format('YYYYMMDD')}-${dayjs(dr.end).format('YYYYMMDD')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success('Đã xuất báo cáo CSV');
    } catch {
      message.error('Không thể xuất báo cáo');
    }
  };

  const STATS = [
    { label: 'Tổng người dùng', value: num(ov.totalUsers), sub: `${num(ov.activeUsers)} đang hoạt động`, icon: 'users', color: '#2563EB' },
    { label: 'Khách hàng mới', value: num(ov.newUsers), sub: `trong ${periodLabel}`, icon: 'user-plus', color: '#15803D' },
    { label: 'Tổng nhà xe', value: num(ov.totalOperators), sub: `${num(ov.approvedOperators)} đã duyệt`, icon: 'building-2', color: '#E89B26' },
    { label: 'Nhà xe chờ duyệt', value: num(ov.pendingOperators), sub: 'cần xét duyệt', icon: 'clock', color: '#B45309' },
    { label: 'Tổng chuyến xe', value: num(ov.totalTrips), sub: `${num(ov.completedTrips)} hoàn thành`, icon: 'route', color: '#0EA5E9' },
    { label: 'Tổng đặt vé', value: num(ov.totalBookings), sub: `${num(ov.paidBookings)} đã thanh toán`, icon: 'ticket', color: '#8B5CF6' },
    { label: 'Đặt vé đã hủy', value: num(ov.cancelledBookings), sub: `tỷ lệ ${ov.cancellationRate || 0}%`, icon: 'circle-x', color: '#B91C1C' },
    { label: 'Giá trị TB / đơn', value: MoneyVND(Math.round(rev.averageOrderValue || 0)), sub: 'mỗi đơn đặt vé', icon: 'receipt', color: '#E89B26' },
  ];

  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Trung tâm phân tích — số liệu thực từ toàn hệ thống Vé Xe Nhanh: doanh thu, đặt vé, tăng trưởng, top tuyến và top nhà xe theo kỳ."
        cta={(
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Select value={period} onChange={setPeriod} options={PERIODS} />
            <Btn kind="ghost" icon="download" onClick={handleExport} disabled={loading || !data}>
              Xuất CSV
            </Btn>
          </div>
        )}
      />

      {/* KPI strip — all real */}
      <div className="admin-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {loading && !data ? (
          [0, 1, 2, 3].map((i) => <Card key={i} padding={20}><Skeleton height={92} /></Card>)
        ) : (
          <>
            <KpiCard label="Tổng doanh thu" value={`${ShortMoney(totalRev)} đ`}
              delta={pct(growth.revenueGrowth)} deltaTone={Number(growth.revenueGrowth) >= 0 ? 'up' : 'down'}
              sub="vs kỳ trước" icon="banknote" iconBg="#DCFCE7" accent="var(--vxn-teal-700)" />
            <KpiCard label="Vé đã bán" value={num(rev.totalTickets)}
              delta={pct(growth.bookingsGrowth)} deltaTone={Number(growth.bookingsGrowth) >= 0 ? 'up' : 'down'}
              sub={`${num(ov.totalBookings)} đơn đặt`} icon="ticket" iconBg="#FEF3D7" accent="var(--vxn-saffron-600)" />
            <KpiCard label="Khách hàng mới" value={num(ov.newUsers)}
              delta={pct(growth.usersGrowth)} deltaTone={Number(growth.usersGrowth) >= 0 ? 'up' : 'down'}
              sub={`trên ${num(ov.totalUsers)} tài khoản`} icon="users-round" iconBg="#DBEAFE" accent="#2563EB" />
            <KpiCard label="Tỷ lệ hủy" value={`${ov.cancellationRate || 0}%`}
              sub={`${num(ov.cancelledBookings)} / ${num(ov.totalBookings)} đơn`}
              icon="circle-x" iconBg="#FEE2E2" accent="#B91C1C" />
          </>
        )}
      </div>

      {/* Real system-wide indicators — replaces the fabricated template catalog */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          font: '600 13px var(--font-display)', letterSpacing: '0.08em', color: 'var(--vxn-fg-4)',
          textTransform: 'uppercase', marginBottom: 12,
        }}>Chỉ số toàn hệ thống · {periodLabel}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {loading && !data
            ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12, padding: 18 }}>
                <Skeleton height={56} />
              </div>
            ))
            : STATS.map((s) => (
              <div key={s.label} style={{
                background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12,
                padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${s.color}18`, color: s.color,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <VxnIcon name={s.icon} size={20} color={s.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    font: '500 11px var(--font-display)', letterSpacing: '0.06em',
                    color: 'var(--vxn-fg-5)', textTransform: 'uppercase',
                  }}>{s.label}</div>
                  <div style={{ font: '600 20px var(--font-display)', color: 'var(--vxn-ink)', marginTop: 4 }}>{s.value}</div>
                  <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-4)', marginTop: 4 }}>{s.sub}</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginBottom: 24 }}>
        <Card title="Top tuyến doanh thu" subtitle={`${rangeText} · Tổng ${ShortMoney(totalRev)} đ`} padding={0}>
          {loading && !data ? (
            <div style={{ padding: 24 }}><Skeleton height={220} /></div>
          ) : (
            <Table
              columns={[
                { key: 'rank', label: '#', width: 44, render: rankCell },
                {
                  key: 'route', label: 'Tuyến', render: (r) => (
                    <span style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{routeLabel(r)}</span>
                  ),
                },
                {
                  key: 'rev', label: 'Doanh thu', align: 'right', render: (r) => (
                    <span style={{ font: '600 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>
                      {ShortMoney(r.totalRevenue)} đ
                    </span>
                  ),
                },
                {
                  key: 'vol', label: 'Đặt vé · Vé', align: 'right', render: (r) => (
                    <span style={{ font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-4)' }}>
                      {num(r.totalBookings)} đơn · {num(r.totalTickets)} vé
                    </span>
                  ),
                },
              ]}
              rows={topRoutes}
              empty="Chưa có dữ liệu tuyến trong kỳ."
            />
          )}
        </Card>

        <Card title="Doanh thu theo ngày" subtitle={`${periodLabel} gần nhất · VND`}>
          {loading && !data ? (
            <Skeleton height={190} />
          ) : trend.length === 0 ? (
            <EmptyState icon="line-chart" title="Chưa có dữ liệu" hint="Không có giao dịch doanh thu nào trong kỳ đã chọn." />
          ) : (
            <>
              <RevenueTrend trend={trend} />
              <div style={{
                marginTop: 18, padding: 14, borderRadius: 8, background: 'var(--vxn-bg-mist)',
                font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.55,
              }}>
                Tổng <strong style={{ color: 'var(--vxn-ink)', fontWeight: 600 }}>{ShortMoney(totalRev)} đ</strong> trong {periodLabel}
                {' · '}trung bình <strong style={{ color: 'var(--vxn-teal-800)' }}>{ShortMoney(avgPerDay)} đ</strong>/ngày
                {peakDay.date && (
                  <> · cao nhất <strong style={{ color: 'var(--vxn-ink)', fontWeight: 600 }}>{ShortMoney(peakDay.revenue)} đ</strong> ngày {dayjs(peakDay.date).format('DD/MM')}</>
                )}.
              </div>
            </>
          )}
        </Card>
      </div>

      <Card title="Top nhà xe theo doanh thu" subtitle={`${rangeText} · ${num(ov.approvedOperators)} nhà xe đã duyệt`} padding={0}>
        {loading && !data ? (
          <div style={{ padding: 24 }}><Skeleton height={240} /></div>
        ) : (
          <Table
            columns={[
              { key: 'rank', label: '#', width: 44, render: rankCell },
              {
                key: 'op', label: 'Nhà xe', render: (o) => (
                  <span style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{o.companyName || '—'}</span>
                ),
              },
              {
                key: 'bookings', label: 'Đặt vé', align: 'right', render: (o) => (
                  <span style={{ color: 'var(--vxn-fg-2)', font: '400 13px var(--font-display)' }}>{num(o.totalBookings)}</span>
                ),
              },
              {
                key: 'tickets', label: 'Vé', align: 'right', render: (o) => (
                  <span style={{ color: 'var(--vxn-fg-2)', font: '400 13px var(--font-display)' }}>{num(o.totalTickets)}</span>
                ),
              },
              {
                key: 'rev', label: 'Doanh thu', align: 'right', render: (o) => (
                  <span style={{ font: '600 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>
                    {ShortMoney(o.totalRevenue)} đ
                  </span>
                ),
              },
            ]}
            rows={topOperators}
            empty="Chưa có dữ liệu nhà xe trong kỳ."
          />
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
