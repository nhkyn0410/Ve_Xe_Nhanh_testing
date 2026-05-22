import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { reportsApi } from '../../services/reportApi';
import {
  PageHeader,
  Btn,
  Select,
  StatPill,
  Chip,
  Panel,
  BarChart,
  Donut,
} from '../../components/operator/vxn';

const compactVnd = (n) => {
  const v = Number(n || 0);
  if (v >= 1e9) return `₫ ${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `₫ ${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `₫ ${Math.round(v / 1e3)}K`;
  return `₫ ${v}`;
};
const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

const METHOD_COLOR = {
  vnpay: '#1D4ED8',
  momo: '#A50064',
  zalopay: '#0068FF',
  cash: '#475569',
  atm_card: '#0F766E',
  credit_card: '#0F766E',
  debit_card: '#0F766E',
  bank_transfer: '#0F766E',
};
const METHOD_LABEL = {
  vnpay: 'VNPay',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  cash: 'Tiền mặt',
  atm_card: 'Thẻ ATM',
  credit_card: 'Thẻ tín dụng',
  debit_card: 'Thẻ ghi nợ',
  bank_transfer: 'Chuyển khoản',
};

const PERIODS = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '12m', label: '12 tháng' },
  { value: 'ytd', label: 'Từ đầu năm' },
];

function periodRange(p) {
  const end = dayjs();
  if (p === '7d') return [end.subtract(7, 'day'), end];
  if (p === '30d') return [end.subtract(30, 'day'), end];
  if (p === 'ytd') return [end.startOf('year'), end];
  return [end.subtract(12, 'month'), end]; // 12m default
}

function operatorToken() {
  try {
    const raw = localStorage.getItem('operator-auth-storage');
    if (raw) {
      const { state } = JSON.parse(raw);
      if (state?.token) return state.token;
    }
  } catch {
    /* ignore */
  }
  return localStorage.getItem('operator-token') || '';
}

const ReportsPage = () => {
  const [period, setPeriod] = useState('12m');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [startDate, endDate] = useMemo(() => {
    const [s, e] = periodRange(period);
    return [s.format('YYYY-MM-DD'), e.format('YYYY-MM-DD')];
  }, [period]);

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const body = await reportsApi.getRevenueReport({ startDate, endDate });
      setData(body?.data || null);
    } catch (error) {
      message.error(
        typeof error === 'string'
          ? error
          : error?.message || 'Không thể tải báo cáo doanh thu'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const base =
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const qs = new URLSearchParams({ startDate, endDate, format: 'pdf' });
      const resp = await fetch(
        `${base}/operators/reports/revenue?${qs.toString()}`,
        { headers: { Authorization: `Bearer ${operatorToken()}` } }
      );
      if (!resp.ok) throw new Error('export failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-doanh-thu-${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success('Đã xuất báo cáo PDF');
    } catch {
      message.error('Không thể xuất báo cáo PDF');
    } finally {
      setExporting(false);
    }
  };

  const summary = data?.summary || {};
  const growth = data?.growthMetrics?.growth || { revenue: 0, bookings: 0 };
  const cancel = data?.cancellationReport || {};
  const topRoutes = data?.topRoutes || [];
  const byMethod = data?.revenueByPaymentMethod || [];
  const trend = data?.revenueTrend || [];
  const cancByRoute = cancel.cancellationsByRoute || [];

  const chart = useMemo(() => {
    if (!trend.length) return { data: [], labels: [] };
    const n = Math.min(12, trend.length);
    const size = Math.ceil(trend.length / n);
    const out = [];
    const labels = [];
    for (let i = 0; i < trend.length; i += size) {
      const slice = trend.slice(i, i + size);
      const rev = slice.reduce((s, d) => s + (d.revenue || 0), 0);
      out.push({ v1: Math.round(rev / 1e6) });
      labels.push(dayjs(slice[0].date).format('DD/MM'));
    }
    return { data: out, labels };
  }, [trend]);

  const donut = useMemo(() => {
    const segments = byMethod.map((p) => ({
      value: p.count || 0,
      color: METHOD_COLOR[p.paymentMethod] || '#94A3B8',
      label: METHOD_LABEL[p.paymentMethod] || p.paymentMethod || 'Khác',
      revenue: p.revenue || 0,
    }));
    const totalTx = segments.reduce((s, x) => s + x.value, 0);
    const top = [...byMethod].sort(
      (a, b) => (b.revenue || 0) - (a.revenue || 0)
    )[0];
    return { segments, totalTx, top };
  }, [byMethod]);

  const cancRate = Number(cancel.cancellationRate || 0);

  return (
    <>
      <PageHeader
        title="Báo cáo"
        description="Phân tích doanh thu, tuyến hiệu quả nhất và phương thức thanh toán theo khoảng thời gian đã chọn."
        cta={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Select value={period} onChange={setPeriod} options={PERIODS} />
            <Btn kind="ghost" icon="printer" onClick={() => window.print()}>
              In
            </Btn>
            <Btn
              kind="primary"
              icon="download"
              onClick={exportPDF}
              disabled={exporting || loading}
            >
              {exporting ? 'Đang xuất…' : 'Xuất báo cáo PDF'}
            </Btn>
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatPill
          label="Doanh thu kỳ này"
          value={loading ? '—' : compactVnd(summary.totalRevenue)}
          hint={
            loading
              ? ' '
              : `${growth.revenue >= 0 ? '↗ +' : '↘ '}${growth.revenue}% so với kỳ trước`
          }
          tone="teal"
        />
        <StatPill
          label="Vé đã bán"
          value={
            loading
              ? '—'
              : Number(summary.totalTickets || 0).toLocaleString('vi-VN')
          }
          hint={
            loading
              ? ' '
              : `${Number(summary.totalBookings || 0).toLocaleString('vi-VN')} đơn đặt vé`
          }
        />
        <StatPill
          label="Giá trị TB / đơn"
          value={loading ? '—' : compactVnd(summary.averageBookingValue)}
          hint="Doanh thu / số đơn"
          tone="success"
        />
        <StatPill
          label="Tỷ lệ hủy vé"
          value={loading ? '—' : `${cancRate.toFixed(1)}%`}
          hint={
            loading
              ? ' '
              : `${Number(cancel.totalCancelled || 0).toLocaleString('vi-VN')}/${Number(
                  cancel.totalBookings || 0
                ).toLocaleString('vi-VN')} đơn`
          }
          tone={cancRate > 10 ? 'danger' : 'warn'}
        />
      </div>

      <Panel
        title="Xu hướng doanh thu theo kỳ"
        action={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              font: '400 12px var(--font-display)',
              color: 'var(--vxn-fg-5)',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: '#2B7EAD',
              }}
            />
            Doanh thu (triệu ₫)
          </span>
        }
        padding={24}
      >
        {loading ? (
          <div
            style={{
              padding: 80,
              textAlign: 'center',
              color: 'var(--vxn-fg-5)',
              font: '400 13.5px var(--font-display)',
            }}
          >
            Đang tải dữ liệu…
          </div>
        ) : chart.data.length ? (
          <BarChart
            data={chart.data}
            labels={chart.labels}
            width={1080}
            height={280}
          />
        ) : (
          <div
            style={{
              padding: 80,
              textAlign: 'center',
              color: 'var(--vxn-fg-5)',
              font: '400 13.5px var(--font-display)',
            }}
          >
            Chưa có doanh thu trong khoảng thời gian đã chọn.
          </div>
        )}
      </Panel>

      <div style={{ height: 16 }} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Panel title="Top tuyến doanh thu cao nhất" padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Tuyến', 'Số đơn', 'Doanh thu', 'Tỷ lệ hủy'].map(
                  (c, i) => (
                    <th
                      key={i}
                      style={{
                        background: '#FBFCFE',
                        textAlign: 'left',
                        padding: '10px 20px',
                        font: '500 11px var(--font-display)',
                        letterSpacing: '.05em',
                        textTransform: 'uppercase',
                        color: 'var(--vxn-fg-5)',
                        borderBottom: '1px solid var(--vxn-border)',
                      }}
                    >
                      {c}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {!loading &&
                topRoutes.map((r, i) => {
                  const rate = Number(r.cancellationRate || 0);
                  return (
                    <tr
                      key={r.routeId || i}
                      style={{
                        borderBottom:
                          i < topRoutes.length - 1
                            ? '1px solid var(--vxn-border)'
                            : 0,
                      }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-grid',
                            placeItems: 'center',
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: i < 3 ? '#FEF3D7' : 'var(--vxn-bg-mist)',
                            color:
                              i < 3
                                ? 'var(--vxn-saffron-700)'
                                : 'var(--vxn-fg-3)',
                            font: '700 12px var(--font-display)',
                          }}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          font: '500 13.5px var(--font-display)',
                          color: 'var(--vxn-ink)',
                        }}
                      >
                        {r.routeName ||
                          `${r.origin || '?'} → ${r.destination || '?'}`}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          font: '400 13.5px var(--font-display)',
                          color: 'var(--vxn-fg-2)',
                        }}
                      >
                        {Number(r.bookings || 0).toLocaleString('vi-VN')}
                      </td>
                      <td
                        style={{
                          padding: '14px 20px',
                          font: '600 14px var(--font-display)',
                          color: 'var(--vxn-ink)',
                        }}
                      >
                        {(Number(r.totalRevenue || 0) / 1e6).toFixed(1)}M ₫
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Chip
                          tone={
                            rate > 15
                              ? 'danger'
                              : rate > 10
                                ? 'warn'
                                : 'success'
                          }
                        >
                          {rate.toFixed(1)}%
                        </Chip>
                      </td>
                    </tr>
                  );
                })}
              {!loading && topRoutes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: 'center',
                      color: 'var(--vxn-fg-5)',
                      font: '400 13px var(--font-display)',
                    }}
                  >
                    Chưa có dữ liệu tuyến trong kỳ.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: 'center',
                      color: 'var(--vxn-fg-5)',
                      font: '400 13px var(--font-display)',
                    }}
                  >
                    Đang tải…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Phương thức thanh toán" padding={20}>
          {donut.segments.length ? (
            <>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 24 }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Donut segments={donut.segments} size={150} thickness={20} />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          font: '700 22px var(--font-display)',
                          color: 'var(--vxn-ink)',
                          lineHeight: 1,
                        }}
                      >
                        {donut.totalTx.toLocaleString('vi-VN')}
                      </div>
                      <div
                        style={{
                          font: '400 11px var(--font-display)',
                          color: 'var(--vxn-fg-5)',
                          marginTop: 2,
                        }}
                      >
                        giao dịch
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {donut.segments.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: s.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          font: '500 13px var(--font-display)',
                          color: 'var(--vxn-fg-2)',
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          font: '600 13px var(--font-display)',
                          color: 'var(--vxn-ink)',
                        }}
                      >
                        {donut.totalTx
                          ? Math.round((s.value / donut.totalTx) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  background: 'var(--vxn-bg-mist)',
                  borderRadius: 8,
                  font: '400 12.5px var(--font-display)',
                  color: 'var(--vxn-fg-3)',
                }}
              >
                <strong style={{ color: 'var(--vxn-ink)' }}>Ghi chú:</strong>{' '}
                {donut.top
                  ? `${
                      METHOD_LABEL[donut.top.paymentMethod] ||
                      donut.top.paymentMethod
                    } dẫn đầu với ${compactVnd(
                      donut.top.revenue
                    )} doanh thu (${Number(
                      donut.top.count || 0
                    ).toLocaleString('vi-VN')} giao dịch).`
                  : 'Chưa có giao dịch trong kỳ.'}
              </div>
            </>
          ) : (
            <div
              style={{
                padding: 60,
                textAlign: 'center',
                color: 'var(--vxn-fg-5)',
                font: '400 13px var(--font-display)',
              }}
            >
              {loading
                ? 'Đang tải…'
                : 'Chưa có giao dịch thanh toán trong kỳ.'}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Hủy & hoàn vé theo tuyến" padding={0}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Tuyến', 'Số vé hủy', 'Tiền hoàn'].map((c, i) => (
                <th
                  key={i}
                  style={{
                    background: '#FBFCFE',
                    textAlign: i === 0 ? 'left' : 'right',
                    padding: '10px 20px',
                    font: '500 11px var(--font-display)',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    color: 'var(--vxn-fg-5)',
                    borderBottom: '1px solid var(--vxn-border)',
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading &&
              cancByRoute.map((r, i) => (
                <tr
                  key={r.routeId || i}
                  style={{
                    borderBottom:
                      i < cancByRoute.length - 1
                        ? '1px solid var(--vxn-border)'
                        : 0,
                  }}
                >
                  <td
                    style={{
                      padding: '14px 20px',
                      font: '500 13.5px var(--font-display)',
                      color: 'var(--vxn-ink)',
                    }}
                  >
                    {r.routeName || '—'}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      textAlign: 'right',
                      font: '600 14px var(--font-display)',
                      color: 'var(--vxn-danger-fg)',
                    }}
                  >
                    {Number(r.count || 0).toLocaleString('vi-VN')}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      textAlign: 'right',
                      font: '500 13.5px var(--font-display)',
                      color: 'var(--vxn-fg-2)',
                    }}
                  >
                    {vnd(r.refundedAmount)}
                  </td>
                </tr>
              ))}
            {!loading && cancByRoute.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--vxn-fg-5)',
                    font: '400 13px var(--font-display)',
                  }}
                >
                  Không có vé hủy trong kỳ — tín hiệu tốt.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--vxn-fg-5)',
                    font: '400 13px var(--font-display)',
                  }}
                >
                  Đang tải…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
};

export default ReportsPage;
