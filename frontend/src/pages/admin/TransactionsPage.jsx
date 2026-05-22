/**
 * System-admin · Giao dịch — faithful VXN port of the "Trang admin hệ thống"
 * design package admin-system-tx.jsx, wired to the real GET /admin/payments
 * (+ /admin/payments/statistics) endpoints added for this cross-operator
 * reconciliation view.
 *
 * Honesty-over-pixel-match: the design rows are mock transactions with
 * fabricated TRX codes, a fabricated "Hoa hồng hệ thống 8%" KPI (the Payment
 * model has no commission field) and a fake realtime "Tình trạng cổng thanh
 * toán" gateway-health feed — none have backing data. Rebuilt on real Payment
 * records: real paymentCode, real amount & refundAmount, the canonical
 * 7-state Payment lifecycle and the real paymentMethod enum. KPIs come from
 * /admin/payments/statistics; the fabricated commission KPI is replaced with
 * a real success-rate KPI and the fake gateway-health card is replaced with a
 * truthful status-distribution card. The row kebab is removed (read-only —
 * no admin payment-mutation endpoint) and the unbacked "Đối soát" button is
 * dropped in favour of a working CSV export.
 */
import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { message } from 'antd';
import { adminPayments } from '../../services/adminApi';
import {
  PageHeader, Btn, Card, Table, Pager, SearchInput, Select,
  KpiCard, Skeleton, MoneyVND, ShortMoney,
} from '../../components/admin/vxn';

const PAGE_SIZE = 20;

const RANGES = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
];

const METHOD_LOGO = {
  vnpay: { name: 'VNPay', bg: '#0066CC', fg: '#fff', letter: 'V' },
  momo: { name: 'MoMo', bg: '#A50064', fg: '#fff', letter: 'M' },
  zalopay: { name: 'ZaloPay', bg: '#0068FF', fg: '#fff', letter: 'Z' },
  credit_card: { name: 'Thẻ tín dụng', bg: '#1F2937', fg: '#fff', letter: 'C' },
  debit_card: { name: 'Thẻ ghi nợ', bg: '#334155', fg: '#fff', letter: 'D' },
  atm_card: { name: 'Thẻ ATM', bg: '#0F766E', fg: '#fff', letter: 'A' },
  cash: { name: 'Tiền mặt', bg: '#64748B', fg: '#fff', letter: '₫' },
};
const methodOf = (m) => METHOD_LOGO[m] || { name: m || '—', bg: '#94A3B8', fg: '#fff', letter: '?' };

const STATUS_TX = {
  completed: { label: 'Thành công', fg: '#15803D', dot: '#22C55E' },
  pending: { label: 'Chờ xử lý', fg: '#B45309', dot: '#F59E0B' },
  processing: { label: 'Đang xử lý', fg: '#B45309', dot: '#F59E0B' },
  failed: { label: 'Thất bại', fg: '#B91C1C', dot: '#EF4444' },
  cancelled: { label: 'Đã hủy', fg: '#475569', dot: '#94A3B8' },
  refunded: { label: 'Đã hoàn', fg: '#475569', dot: '#94A3B8' },
  partial_refund: { label: 'Hoàn một phần', fg: '#475569', dot: '#94A3B8' },
};
const statusOf = (s) => STATUS_TX[s] || { label: s || '—', fg: 'var(--vxn-fg-3)', dot: '#94A3B8' };

const STATUS_OPTIONS = [
  { value: 'all', label: 'Mọi trạng thái' },
  { value: 'completed', label: 'Thành công' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'refunded', label: 'Đã hoàn' },
  { value: 'partial_refund', label: 'Hoàn một phần' },
];

const METHOD_OPTIONS = [
  { value: 'all', label: 'Mọi phương thức' },
  { value: 'vnpay', label: 'VNPay' },
  { value: 'momo', label: 'MoMo' },
  { value: 'zalopay', label: 'ZaloPay' },
  { value: 'credit_card', label: 'Thẻ tín dụng' },
  { value: 'debit_card', label: 'Thẻ ghi nợ' },
  { value: 'atm_card', label: 'Thẻ ATM' },
  { value: 'cash', label: 'Tiền mặt' },
];

const num = (v) => Number(v || 0).toLocaleString('vi-VN');
const isRefund = (s) => s === 'refunded' || s === 'partial_refund';

const TransactionsPage = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [range, setRange] = useState('all');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQd(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { setPage(1); }, [qd, status, method, range]);

  const buildParams = useCallback((overrides = {}) => {
    const p = { page, limit: PAGE_SIZE };
    if (status !== 'all') p.status = status;
    if (method !== 'all') p.method = method;
    if (range !== 'all') p.range = range;
    if (qd) p.search = qd;
    return { ...p, ...overrides };
  }, [page, status, method, range, qd]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await adminPayments.getPayments(buildParams());
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
          message.error(typeof err === 'string' ? err : 'Không thể tải danh sách giao dịch');
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
        const res = await adminPayments.getStatistics();
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
      const res = await adminPayments.getPayments(buildParams({ page: 1, limit: 1000 }));
      const list = res?.status === 'success' && Array.isArray(res.data) ? res.data : [];
      if (!list.length) {
        message.info('Không có giao dịch nào để xuất');
        return;
      }
      const esc = (c) => {
        const s = String(c == null ? '' : c);
        return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const head = ['Mã giao dịch', 'Mã booking', 'Khách hàng', 'Nhà xe', 'Số tiền (đ)', 'Hoàn (đ)', 'Phương thức', 'Trạng thái', 'Thời gian'];
      const body = list.map((p) => [
        p.paymentCode || String(p._id).slice(-10).toUpperCase(),
        p.bookingCode || '',
        p.customer?.name || '',
        p.operator || '',
        p.amount || 0,
        p.refundAmount || 0,
        methodOf(p.paymentMethod).name,
        statusOf(p.status).label,
        p.createdAt ? dayjs(p.createdAt).format('DD/MM/YYYY HH:mm') : '',
      ]);
      const csv = `﻿${[head, ...body].map((row) => row.map(esc).join(',')).join('\r\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `giao-dich-vexenhanh-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success(`Đã xuất ${list.length} giao dịch`);
    } catch (err) {
      message.error(typeof err === 'string' ? err : 'Không thể xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  const methodTotalCount = stats?.methodBreakdown?.reduce((a, m) => a + (m.count || 0), 0) || 0;
  const statusTotalCount = stats
    ? Object.values(stats.byStatus || {}).reduce((a, n) => a + n, 0)
    : 0;

  const columns = [
    {
      key: 'code', label: 'Mã giao dịch', render: (p) => (
        <div>
          <code style={{ font: '600 12.5px var(--font-mono, ui-monospace)', color: 'var(--vxn-ink)' }}>
            {p.paymentCode || String(p._id).slice(-10).toUpperCase()}
          </code>
          {p.bookingCode && (
            <div style={{ font: '400 11px var(--font-mono, ui-monospace)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
              {p.bookingCode}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'customer', label: 'Khách hàng / Nhà xe', render: (p) => (
        <div>
          <div style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-ink)' }}>
            {p.customer?.name || 'Khách vãng lai'}
          </div>
          <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
            {p.operator || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'amount', label: 'Số tiền', align: 'right', render: (p) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{
            font: '600 14px var(--font-display)',
            color: p.status === 'failed' || p.status === 'cancelled' ? 'var(--vxn-fg-5)' : 'var(--vxn-ink)',
            textDecoration: p.status === 'failed' || p.status === 'cancelled' ? 'line-through' : 'none',
          }}>
            {MoneyVND(p.amount)}
          </div>
          {isRefund(p.status) && p.refundAmount > 0 && (
            <div style={{ font: '500 11px var(--font-display)', color: '#B91C1C', marginTop: 2 }}>
              −{MoneyVND(p.refundAmount)} hoàn
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'method', label: 'PT thanh toán', render: (p) => {
        const l = methodOf(p.paymentMethod);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 4, background: l.bg, color: l.fg,
              display: 'grid', placeItems: 'center', font: '600 11px var(--font-display)',
            }}>{l.letter}</span>
            <span style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>{l.name}</span>
          </span>
        );
      },
    },
    {
      key: 'status', label: 'Trạng thái', render: (p) => {
        const s = statusOf(p.status);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '500 12.5px var(--font-display)', color: s.fg }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
            {s.label}
          </span>
        );
      },
    },
    {
      key: 't', label: 'Thời gian', align: 'right', render: (p) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '500 12.5px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
            {p.createdAt ? dayjs(p.createdAt).format('HH:mm') : '—'}
          </div>
          <div style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
            {p.createdAt ? dayjs(p.createdAt).format('DD/MM/YYYY') : ''}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Giao dịch"
        description="Toàn bộ giao dịch thanh toán trên hệ thống — số tiền, hoàn tiền và trạng thái tính trực tiếp từ bản ghi thanh toán thực tế."
        cta={(
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Select value={range} onChange={setRange} options={RANGES} />
            <Btn kind="ghost" icon="download" onClick={handleExport} disabled={exporting || loading}>
              {exporting ? 'Đang xuất…' : 'Xuất CSV'}
            </Btn>
          </div>
        )}
      />

      <div className="admin-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {!stats ? (
          [0, 1, 2, 3, 4].map((i) => <Card key={i} padding={20}><Skeleton height={84} /></Card>)
        ) : (
          <>
            <KpiCard label="Giao dịch hôm nay" value={num(stats.today?.count)}
              sub={`${ShortMoney(stats.today?.amount)} phát sinh hôm nay`} icon="receipt" iconBg="#DBEAFE" accent="#2563EB" />
            <KpiCard label="Tổng tiền đã thu" value={ShortMoney(stats.completedAmount)}
              sub="giao dịch thành công" icon="banknote" iconBg="#DCFCE7" accent="#15803D" />
            <KpiCard label="Tỷ lệ thành công" value={`${stats.successRate}%`}
              sub={`${num(stats.completed)} / ${num(stats.total)} giao dịch`} icon="circle-check" iconBg="#FEF3C7" accent="var(--vxn-saffron-600)" />
            <KpiCard label="Hoàn tiền" value={ShortMoney(stats.totalRefundAmount)}
              sub={`${num(stats.refunded)} giao dịch hoàn`} icon="undo-2" iconBg="#FEE2E2" accent="#B91C1C" />
            <KpiCard label="Thất bại" value={num(stats.failed)}
              sub={`${stats.failureRate}% tỷ lệ thất bại`} icon="circle-x" iconBg="#FED7AA" accent="#C2410C" />
          </>
        )}
      </div>

      <div className="admin-grid-2" style={{ marginBottom: 20 }}>
        <Card title="Phương thức thanh toán" subtitle="Phân bổ trên toàn bộ giao dịch">
          {!stats ? (
            <Skeleton height={180} />
          ) : !stats.methodBreakdown?.length ? (
            <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)', padding: '12px 0' }}>
              Chưa có giao dịch nào.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.methodBreakdown.map((m) => {
                const l = methodOf(m.method);
                const pct = methodTotalCount ? Math.round((m.count / methodTotalCount) * 100) : 0;
                return (
                  <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6, background: l.bg, color: l.fg,
                      display: 'grid', placeItems: 'center', font: '600 13px var(--font-display)',
                    }}>{l.letter}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
                        <span>{l.name} · {num(m.count)} GD</span>
                        <span style={{ color: 'var(--vxn-ink)' }}>{MoneyVND(m.totalAmount)}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 4, background: 'var(--vxn-bg-mist)', overflow: 'hidden', marginTop: 6 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: l.bg, borderRadius: 4 }} />
                      </div>
                    </div>
                    <span style={{ font: '600 13px var(--font-display)', color: 'var(--vxn-ink)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Phân bổ theo trạng thái" subtitle="Vòng đời thanh toán toàn hệ thống">
          {!stats ? (
            <Skeleton height={180} />
          ) : statusTotalCount === 0 ? (
            <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)', padding: '12px 0' }}>
              Chưa có giao dịch nào.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(stats.byStatus || {})
                .filter(([, c]) => c > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => {
                  const s = statusOf(key);
                  const pct = statusTotalCount ? Math.round((count / statusTotalCount) * 100) : 0;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
                          <span style={{ color: s.fg }}>{s.label}</span>
                          <span style={{ color: 'var(--vxn-ink)' }}>{num(count)}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 4, background: 'var(--vxn-bg-mist)', overflow: 'hidden', marginTop: 6 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: s.dot, borderRadius: 4 }} />
                        </div>
                      </div>
                      <span style={{ font: '600 13px var(--font-display)', color: 'var(--vxn-ink)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      <Card padding={0}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--vxn-border-muted)',
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm mã giao dịch, booking, khách hàng…" />
          <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <Select value={method} onChange={setMethod} options={METHOD_OPTIONS} />
          <div style={{ flex: 1 }} />
          <span style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
            {num(total)} giao dịch
            {stats && (
              <> · <strong style={{ color: 'var(--vxn-ink)' }}>{MoneyVND(stats.completedAmount)}</strong> đã thu</>
            )}
          </span>
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
            empty="Không tìm thấy giao dịch nào khớp bộ lọc."
          />
        )}

        {!loading && total > 0 && (
          <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </Card>
    </div>
  );
};

export default TransactionsPage;
