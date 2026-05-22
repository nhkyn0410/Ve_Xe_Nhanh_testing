/**
 * System-admin · Chuyến xe — faithful VXN port of the "Trang admin hệ thống"
 * design package admin-system-trips.jsx, wired to the real
 * GET /admin/trips (+ /admin/trips/statistics) endpoints added for this
 * cross-operator oversight view.
 *
 * Honesty-over-pixel-match: design rows are mock trips with fabricated codes
 * and a fake "delayed" status + "Bản đồ trực tiếp" CTA that have no backing
 * data. Rebuilt on real Trip records: real seat occupancy (bookedSeats vs
 * totalSeats), the canonical 4-state Trip lifecycle, real KPIs from
 * /admin/trips/statistics, server-backed status tabs + date lens + search,
 * and a working CSV export. The fabricated "delayed" tab and live-map button
 * are dropped; the row chevron is removed (read-only — no admin trip
 * mutation endpoint).
 */
import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { message } from 'antd';
import { adminTrips } from '../../services/adminApi';
import {
  PageHeader, Btn, Card, Tabs, Table, Pager, SearchInput, Select,
  KpiCard, Skeleton, MoneyVND,
} from '../../components/admin/vxn';

const PAGE_SIZE = 20;

const RANGES = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Khởi hành hôm nay' },
  { value: 'upcoming', label: 'Sắp khởi hành' },
  { value: 'past', label: 'Đã qua' },
];

const STATUS = {
  scheduled: { label: 'Sắp khởi hành', fg: '#1D4ED8', dot: '#3B82F6' },
  ongoing: { label: 'Đang chạy', fg: '#B45309', dot: '#F59E0B' },
  completed: { label: 'Hoàn thành', fg: '#15803D', dot: '#22C55E' },
  cancelled: { label: 'Đã hủy', fg: '#475569', dot: '#94A3B8' },
};

const num = (v) => Number(v || 0).toLocaleString('vi-VN');
const routeLabel = (r) =>
  r?.routeName ||
  (r?.origin && r?.destination ? `${r.origin.city || r.origin.province || '?'} → ${r.destination.city || r.destination.province || '?'}` : '—');
const occColor = (sold, total) => {
  if (!total) return 'var(--vxn-teal-700)';
  const ratio = sold / total;
  return sold === total ? '#15803D' : ratio > 0.7 ? '#F59E0B' : 'var(--vxn-teal-700)';
};

const SystemTripsPage = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('all');
  const [range, setRange] = useState('all');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQd(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { setPage(1); }, [qd, tab, range]);

  const buildParams = useCallback((overrides = {}) => {
    const p = { page, limit: PAGE_SIZE };
    if (tab !== 'all') p.status = tab;
    if (range !== 'all') p.range = range;
    if (qd) p.search = qd;
    return { ...p, ...overrides };
  }, [page, tab, range, qd]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await adminTrips.getTrips(buildParams());
        if (!alive) return;
        if (res?.status === 'success') {
          setRows(Array.isArray(res.data) ? res.data : []);
          setTotal(res.pagination?.total || 0);
        } else {
          setRows([]);
          setTotal(0);
        }
      } catch (err) {
        if (alive) {
          setRows([]);
          setTotal(0);
          message.error(typeof err === 'string' ? err : 'Không thể tải danh sách chuyến xe');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [buildParams]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminTrips.getStatistics();
        if (alive && res?.status === 'success') setStats(res.data);
      } catch {
        /* KPI strip is non-critical */
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminTrips.getTrips(buildParams({ page: 1, limit: 1000 }));
      const list = res?.status === 'success' && Array.isArray(res.data) ? res.data : [];
      if (!list.length) {
        message.info('Không có chuyến nào để xuất');
        return;
      }
      const esc = (c) => {
        const s = String(c == null ? '' : c);
        return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const head = ['Mã chuyến', 'Tuyến', 'Nhà xe', 'Xe', 'Khởi hành', 'Đến', 'Giá (đ)', 'Đã bán', 'Tổng ghế', 'Lấp đầy (%)', 'Trạng thái'];
      const body = list.map((t) => [
        String(t._id).slice(-8).toUpperCase(),
        routeLabel(t.routeId),
        t.operatorId?.companyName || '',
        t.busId?.busNumber || '',
        t.departureTime ? dayjs(t.departureTime).format('DD/MM/YYYY HH:mm') : '',
        t.arrivalTime ? dayjs(t.arrivalTime).format('DD/MM/YYYY HH:mm') : '',
        t.finalPrice || t.basePrice || 0,
        t.soldSeats ?? 0,
        t.totalSeats ?? 0,
        t.occupancy == null ? '' : t.occupancy,
        STATUS[t.status]?.label || t.status,
      ]);
      const csv = `﻿${[head, ...body].map((row) => row.map(esc).join(',')).join('\r\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chuyen-xe-vexenhanh-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success(`Đã xuất ${list.length} chuyến`);
    } catch (err) {
      message.error(typeof err === 'string' ? err : 'Không thể xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'Tất cả', count: stats?.total ?? 0 },
    { key: 'scheduled', label: 'Sắp khởi hành', count: stats?.byStatus?.scheduled ?? 0 },
    { key: 'ongoing', label: 'Đang chạy', count: stats?.byStatus?.ongoing ?? 0 },
    { key: 'completed', label: 'Hoàn thành', count: stats?.byStatus?.completed ?? 0 },
    { key: 'cancelled', label: 'Đã hủy', count: stats?.byStatus?.cancelled ?? 0 },
  ];

  const columns = [
    {
      key: 'code', label: 'Mã chuyến', render: (t) => (
        <code style={{ font: '600 13px var(--font-mono, ui-monospace)', color: 'var(--vxn-ink)' }}>
          {String(t._id).slice(-8).toUpperCase()}
        </code>
      ),
    },
    {
      key: 'route', label: 'Tuyến', render: (t) => (
        <div>
          <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{routeLabel(t.routeId)}</div>
          <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
            {(t.operatorId?.companyName || '—')}{t.busId?.busNumber ? ` · ${t.busId.busNumber}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'time', label: 'Giờ đi → đến', render: (t) => (
        <div>
          <div style={{ font: '600 13.5px var(--font-display)', color: 'var(--vxn-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{t.departureTime ? dayjs(t.departureTime).format('HH:mm') : '—'}</span>
            <span style={{ color: 'var(--vxn-fg-5)' }}>→</span>
            <span>{t.arrivalTime ? dayjs(t.arrivalTime).format('HH:mm') : '—'}</span>
          </div>
          <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
            {t.departureTime ? dayjs(t.departureTime).format('DD/MM/YYYY') : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'price', label: 'Giá', align: 'right', render: (t) => (
        <span style={{ font: '600 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>
          {MoneyVND(t.finalPrice || t.basePrice || 0)}
        </span>
      ),
    },
    {
      key: 'occ', label: 'Lấp đầy', render: (t) => {
        const totalS = t.totalSeats || 0;
        const sold = t.soldSeats || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, height: 6, borderRadius: 4, background: 'var(--vxn-bg-mist)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalS ? Math.min(100, (sold / totalS) * 100) : 0}%`, background: occColor(sold, totalS) }} />
            </div>
            <span style={{ font: '600 12.5px var(--font-display)', color: 'var(--vxn-ink)', minWidth: 56 }}>{sold}/{totalS}</span>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Trạng thái', render: (t) => {
        const s = STATUS[t.status] || { label: t.status, fg: 'var(--vxn-fg-3)', dot: '#94A3B8' };
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 12.5px var(--font-display)', color: s.fg }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
            {s.label}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Chuyến xe"
        description="Toàn bộ chuyến xe đang lên lịch, đang chạy và đã hoàn thành trên hệ thống — tỷ lệ lấp đầy tính trực tiếp từ ghế đã đặt thực tế."
        cta={(
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Select value={range} onChange={setRange} options={RANGES} />
            <Btn kind="ghost" icon="download" onClick={handleExport} disabled={exporting || loading}>
              {exporting ? 'Đang xuất…' : 'Xuất CSV'}
            </Btn>
          </div>
        )}
      />

      <div className="admin-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {!stats ? (
          [0, 1, 2, 3].map((i) => <Card key={i} padding={20}><Skeleton height={84} /></Card>)
        ) : (
          <>
            <KpiCard label="Khởi hành hôm nay" value={num(stats.today)}
              sub="trên toàn hệ thống" icon="route" iconBg="#DBEAFE" accent="#2563EB" />
            <KpiCard label="Đang chạy" value={num(stats.ongoing)}
              sub="đang khai thác" icon="navigation-2" iconBg="#FEF3C7" accent="var(--vxn-saffron-600)" />
            <KpiCard label="Hoàn thành / Tổng" value={`${num(stats.completed)} / ${num(stats.total)}`}
              sub={`${num(stats.cancelled)} đã hủy`} icon="circle-check" iconBg="#DCFCE7" accent="#15803D" />
            <KpiCard label="Lấp đầy trung bình" value={`${num(stats.avgOccupancy)}%`}
              sub="trên mọi chuyến có ghế" icon="users" iconBg="#FEE2E2" accent="#B91C1C" />
          </>
        )}
      </div>

      <Card padding={0}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--vxn-border-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm mã chuyến, tuyến, biển số xe…" />
        </div>

        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={44} />)}
          </div>
        ) : (
          <Table
            dense
            columns={columns}
            rows={rows}
            empty="Không tìm thấy chuyến xe nào khớp bộ lọc."
          />
        )}

        {!loading && total > 0 && (
          <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </Card>
    </div>
  );
};

export default SystemTripsPage;
