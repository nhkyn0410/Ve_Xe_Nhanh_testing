/**
 * System-admin · Tuyến đường — faithful VXN port of the "Trang admin hệ thống"
 * design package admin-system-routes.jsx, wired to the real
 * GET /admin/routes (+ /admin/routes/statistics) endpoints added for this
 * cross-operator oversight view.
 *
 * Honesty-over-pixel-match: the design's rows are hard-coded mock routes with
 * fabricated "tần suất / chuyến/tháng / tỷ lệ lấp đầy" numbers and a fake
 * operator dropdown. This is rebuilt on real Route records enriched with
 * REAL trip-derived metrics (live trip count, upcoming trips, average seat
 * occupancy from actual bookings). The fabricated distance-bucket KPIs are
 * replaced with true counts; filters (search · cự ly · trạng thái) are all
 * server-backed and functional; the fake row kebab is dropped (this is a
 * read-only oversight screen — there is no admin route-mutation endpoint).
 */
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { adminRoutes } from '../../services/adminApi';
import {
  PageHeader, Btn, Card, Chip, Table, Pager, SearchInput, Select,
  KpiCard, Skeleton, MoneyVND,
} from '../../components/admin/vxn';

const PAGE_SIZE = 20;

const BANDS = [
  { value: 'all', label: 'Mọi cự ly' },
  { value: 'short', label: 'Nội tỉnh (< 100 km)' },
  { value: 'medium', label: 'Liên tỉnh (100–300 km)' },
  { value: 'long', label: 'Đường dài (> 300 km)' },
];
const STATUSES = [
  { value: 'all', label: 'Mọi trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Tạm ngưng' },
];

const num = (v) => Number(v || 0).toLocaleString('vi-VN');
const loc = (x) => (x ? [x.city, x.province].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') : '—');
const fmtDur = (mins) => {
  const m = Number(mins) || 0;
  if (m <= 0) return '—';
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} phút`;
  return r ? `${h}h ${r}p` : `${h}h`;
};
const occColor = (o) => (o >= 80 ? '#15803D' : o >= 60 ? '#F59E0B' : '#EF4444');

const SystemRoutesPage = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [band, setBand] = useState('all');
  const [active, setActive] = useState('all');
  const [exporting, setExporting] = useState(false);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQd(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [qd, band, active]);

  const buildParams = useCallback((overrides = {}) => {
    const p = { page, limit: PAGE_SIZE, sort: 'name' };
    if (qd) p.search = qd;
    if (band !== 'all') p.band = band;
    if (active !== 'all') p.isActive = active;
    return { ...p, ...overrides };
  }, [page, qd, band, active]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await adminRoutes.getRoutes(buildParams());
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
          message.error(typeof err === 'string' ? err : 'Không thể tải danh sách tuyến đường');
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
        const res = await adminRoutes.getStatistics();
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
      const res = await adminRoutes.getRoutes(buildParams({ page: 1, limit: 1000 }));
      const list = res?.status === 'success' && Array.isArray(res.data) ? res.data : [];
      if (!list.length) {
        message.info('Không có tuyến nào để xuất');
        return;
      }
      const esc = (c) => {
        const s = String(c == null ? '' : c);
        return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const head = ['Mã tuyến', 'Tên tuyến', 'Điểm đi', 'Điểm đến', 'Nhà xe', 'Quãng đường (km)', 'Thời gian (phút)', 'Giá vé (đ)', 'Trạng thái', 'Tổng chuyến', 'Chuyến sắp tới', 'Đã hoàn thành', 'Lấp đầy TB (%)'];
      const body = list.map((r) => [
        r.routeCode, r.routeName, loc(r.origin), loc(r.destination),
        r.operatorId?.companyName || '', r.distance ?? '', r.estimatedDuration ?? '',
        r.basePrice ?? 0, r.isActive ? 'Đang hoạt động' : 'Tạm ngưng',
        r.tripsTotal ?? 0, r.tripsUpcoming ?? 0, r.tripsCompleted ?? 0,
        r.avgOccupancy == null ? '' : r.avgOccupancy,
      ]);
      const csv = `﻿${[head, ...body].map((row) => row.map(esc).join(',')).join('\r\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tuyen-duong-vexenhanh-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success(`Đã xuất ${list.length} tuyến`);
    } catch (err) {
      message.error(typeof err === 'string' ? err : 'Không thể xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: 'route', label: 'Tuyến', render: (r) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
            <span>{loc(r.origin)}</span>
            <span style={{ color: 'var(--vxn-fg-5)' }}>→</span>
            <span>{loc(r.destination)}</span>
          </div>
          <code style={{ font: '500 11.5px var(--font-mono, ui-monospace)', color: 'var(--vxn-fg-5)' }}>{r.routeCode}</code>
        </div>
      ),
    },
    {
      key: 'op', label: 'Nhà xe', render: (r) => (
        <span style={{ color: 'var(--vxn-fg-2)' }}>{r.operatorId?.companyName || '— (chưa gán)'}</span>
      ),
    },
    {
      key: 'dist', label: 'Quãng đường', align: 'right', render: (r) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{num(r.distance)} km</div>
          <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>~ {fmtDur(r.estimatedDuration)}</div>
        </div>
      ),
    },
    {
      key: 'price', label: 'Giá vé', align: 'right', render: (r) => (
        r.basePrice > 0
          ? <span style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{MoneyVND(r.basePrice)}</span>
          : <span style={{ font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Chưa đặt giá</span>
      ),
    },
    {
      key: 'trips', label: 'Chuyến', align: 'right', render: (r) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '600 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{num(r.tripsTotal)}</div>
          <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
            {r.tripsUpcoming ? `${num(r.tripsUpcoming)} sắp tới` : `${num(r.tripsCompleted)} hoàn thành`}
          </div>
        </div>
      ),
    },
    {
      key: 'occ', label: 'Lấp đầy TB', align: 'left', width: 170, render: (r) => (
        r.avgOccupancy == null ? (
          <span style={{ font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Chưa có chuyến</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 6, borderRadius: 4, background: 'var(--vxn-bg-mist)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, r.avgOccupancy)}%`, background: occColor(r.avgOccupancy) }} />
            </div>
            <span style={{ font: '600 13px var(--font-display)', color: 'var(--vxn-ink)', minWidth: 36 }}>{r.avgOccupancy}%</span>
          </div>
        )
      ),
    },
    {
      key: 'status', label: 'Trạng thái', render: (r) => (
        r.isActive ? <Chip tone="success" dot>Đang hoạt động</Chip> : <Chip tone="neutral" dot>Tạm ngưng</Chip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tuyến đường"
        description="Toàn bộ tuyến đường đang khai thác của các nhà xe đối tác — số liệu chuyến và tỷ lệ lấp đầy tính trực tiếp từ dữ liệu vận hành thực."
        cta={(
          <Btn kind="ghost" icon="download" onClick={handleExport} disabled={exporting || loading}>
            {exporting ? 'Đang xuất…' : 'Xuất CSV'}
          </Btn>
        )}
      />

      <div className="admin-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {!stats ? (
          [0, 1, 2, 3].map((i) => <Card key={i} padding={20}><Skeleton height={84} /></Card>)
        ) : (
          <>
            <KpiCard label="Tổng tuyến" value={num(stats.total)}
              sub={`${num(stats.operatorsWithRoutes)} nhà xe khai thác`} icon="map" iconBg="#DBEAFE" accent="#2563EB" />
            <KpiCard label="Đang hoạt động" value={num(stats.active)}
              sub={`trên tổng ${num(stats.total)} tuyến`} icon="route" iconBg="#DCFCE7" accent="#15803D" />
            <KpiCard label="Tạm ngưng" value={num(stats.inactive)}
              sub="đang vô hiệu hóa" icon="circle-pause" iconBg="#FEE2E2" accent="#B91C1C" />
            <KpiCard label="Cự ly trung bình" value={`${num(stats.avgDistance)} km`}
              sub={`${num(stats.longHaul)} tuyến đường dài`} icon="ruler" iconBg="#FEF3C7" accent="var(--vxn-saffron-600)" />
          </>
        )}
      </div>

      <Card padding={0}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--vxn-border-muted)',
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm tuyến, mã tuyến, tỉnh/thành…" />
          <Select value={band} onChange={setBand} options={BANDS} />
          <Select value={active} onChange={setActive} options={STATUSES} />
        </div>

        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={48} />)}
          </div>
        ) : (
          <Table
            columns={columns}
            rows={rows}
            empty="Không tìm thấy tuyến đường nào khớp bộ lọc."
          />
        )}

        {!loading && total > 0 && (
          <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </Card>
    </div>
  );
};

export default SystemRoutesPage;
