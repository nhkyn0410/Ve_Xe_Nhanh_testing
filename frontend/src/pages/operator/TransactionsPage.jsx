import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, message, Dropdown } from 'antd';
import dayjs from 'dayjs';
import { paymentsApi } from '../../services/operatorApi';
import {
  PageHeader,
  Select,
  SearchInput,
  StatPill,
  Chip,
  RowIconBtn,
  PageBtn,
} from '../../components/operator/vxn';

const { RangePicker } = DatePicker;
const PAGE_SIZE = 10;

const METHOD_META = {
  vnpay: { label: 'VNPay', c: '#1D4ED8', t: 'VNP' },
  momo: { label: 'MoMo', c: '#A50064', t: 'MO' },
  zalopay: { label: 'ZaloPay', c: '#0068FF', t: 'Z' },
  cash: { label: 'Tiền mặt', c: '#475569', t: '₫' },
  atm_card: { label: 'Thẻ ATM', c: '#0F766E', t: 'TH' },
  credit_card: { label: 'Thẻ tín dụng', c: '#0F766E', t: 'TH' },
  debit_card: { label: 'Thẻ ghi nợ', c: '#0F766E', t: 'TH' },
};

const cityOf = (loc) => loc?.city || loc?.station || loc?.province || '';
const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

const compactVnd = (n) => {
  const v = Number(n || 0);
  if (v >= 1e9) return `₫ ${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `₫ ${Math.round(v / 1e6)}M`;
  if (v >= 1e3) return `₫ ${Math.round(v / 1e3)}K`;
  return `₫ ${v}`;
};

function statusGroup(s) {
  if (s === 'completed') return 'success';
  if (s === 'pending' || s === 'processing') return 'pending';
  if (s === 'refunded' || s === 'partial_refund') return 'refunded';
  return 'failed';
}

function statusChip(g) {
  switch (g) {
    case 'success':
      return (
        <Chip tone="success" dot>
          Thành công
        </Chip>
      );
    case 'pending':
      return (
        <Chip tone="warn" dot>
          Chờ xử lý
        </Chip>
      );
    case 'refunded':
      return (
        <Chip tone="danger" dot>
          Hoàn tiền
        </Chip>
      );
    default:
      return (
        <Chip tone="neutral" dot>
          Thất bại
        </Chip>
      );
  }
}

const TransactionsPage = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const [range, setRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [methodF, setMethodF] = useState('all');
  const [sort, setSort] = useState('time');
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundForm] = Form.useForm();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const loadData = async () => {
    setLoading(true);
    const fromDate = range[0].startOf('day').toISOString();
    const toDate = range[1].endOf('day').toISOString();

    const [payRes, statRes] = await Promise.allSettled([
      paymentsApi.getOperatorPayments({ fromDate, toDate }),
      paymentsApi.getStatistics({ fromDate, toDate }),
    ]);

    if (payRes.status === 'fulfilled') {
      const body = payRes.value;
      setPayments(Array.isArray(body?.data) ? body.data : body?.data?.payments || []);
    } else {
      message.error('Không thể tải danh sách giao dịch');
      setPayments([]);
    }
    if (statRes.status === 'fulfilled') {
      setStats(statRes.value?.data || null);
    } else {
      setStats(null);
    }
    setLoading(false);
  };

  const enriched = useMemo(
    () =>
      payments.map((p) => {
        const booking = p.bookingId || {};
        const trip = booking.tripId || {};
        const route = trip.routeId || {};
        const seats = Array.isArray(booking.seats)
          ? booking.seats.map((s) => s.seatNumber).filter(Boolean)
          : [];
        const meta = METHOD_META[p.paymentMethod] || {
          label: p.paymentMethod || '—',
          c: '#475569',
          t: '?',
        };
        return {
          raw: p,
          id: p._id,
          payCode: p.paymentCode || `#${String(p._id).slice(-8).toUpperCase()}`,
          bookingCode: booking.bookingCode || '—',
          name:
            p.customerId?.fullName ||
            booking.contactInfo?.name ||
            booking.seats?.[0]?.passengerName ||
            'Khách lẻ',
          phone: p.customerId?.phone || booking.contactInfo?.phone || '—',
          route:
            route.routeName ||
            `${cityOf(route.origin)} → ${cityOf(route.destination)}` ||
            '—',
          seats: seats.length ? seats.join(', ') : '—',
          amount: p.amount || 0,
          refundAmount: p.refundAmount || 0,
          method: meta.label,
          methodMeta: meta,
          rawMethod: p.paymentMethod,
          rawStatus: p.status,
          status: statusGroup(p.status),
          createdAt: p.createdAt,
          time: p.createdAt ? dayjs(p.createdAt).format('DD/MM HH:mm') : '—',
        };
      }),
    [payments]
  );

  const filtered = useMemo(
    () =>
      enriched
        .filter(
          (t) =>
            !q ||
            [t.payCode, t.bookingCode, t.name, t.phone, t.route]
              .join(' ')
              .toLowerCase()
              .includes(q.toLowerCase())
        )
        .filter((t) => statusF === 'all' || t.status === statusF)
        .filter((t) => {
          if (methodF === 'all') return true;
          if (methodF === 'card') return /card/.test(t.rawMethod || '');
          return t.rawMethod === methodF;
        })
        .sort((a, b) => {
          if (sort === 'time')
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          if (sort === 'amount') return b.amount - a.amount;
          if (sort === 'status') return a.status.localeCompare(b.status);
          return 0;
        }),
    [enriched, q, statusF, methodF, sort]
  );

  useEffect(() => {
    setPage(1);
  }, [q, statusF, methodF, sort, range]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const out = [];
    const s = Math.max(1, currentPage - 2);
    const e = Math.min(totalPages, currentPage + 2);
    for (let i = s; i <= e; i += 1) out.push(i);
    return out;
  }, [currentPage, totalPages]);

  const kpi = useMemo(() => {
    if (stats) {
      const pending = Math.max(
        0,
        (stats.totalPayments || 0) -
          (stats.completedPayments || 0) -
          (stats.failedPayments || 0) -
          (stats.refundedPayments || 0)
      );
      return {
        revenue: stats.completedAmount || 0,
        success: stats.completedPayments || 0,
        avg: stats.avgPaymentAmount || 0,
        pending,
        refunded: stats.refundedPayments || 0,
        refundAmount: stats.totalRefundAmount || 0,
        failed: stats.failedPayments || 0,
      };
    }
    const success = enriched.filter((t) => t.status === 'success');
    return {
      revenue: success.reduce((s, t) => s + t.amount, 0),
      success: success.length,
      avg: success.length
        ? success.reduce((s, t) => s + t.amount, 0) / success.length
        : 0,
      pending: enriched.filter((t) => t.status === 'pending').length,
      refunded: enriched.filter((t) => t.status === 'refunded').length,
      refundAmount: enriched.reduce((s, t) => s + t.refundAmount, 0),
      failed: enriched.filter((t) => t.status === 'failed').length,
    };
  }, [stats, enriched]);

  const openRefund = (p) => {
    const remaining = (p.amount || 0) - (p.refundAmount || 0);
    setRefundTarget(p);
    refundForm.setFieldsValue({ amount: remaining, reason: '' });
  };

  const submitRefund = async () => {
    try {
      const values = await refundForm.validateFields();
      await paymentsApi.processRefund(refundTarget._id, {
        amount: values.amount,
        reason: values.reason,
      });
      message.success('Hoàn tiền thành công');
      setRefundTarget(null);
      refundForm.resetFields();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(
        typeof error === 'string' ? error : error?.message || 'Hoàn tiền thất bại'
      );
    }
  };

  const rowMenu = (t) => ({
    items: [
      { key: 'view', label: 'Xem chi tiết' },
      t.rawStatus === 'completed'
        ? { key: 'refund', label: 'Hoàn tiền', danger: true }
        : null,
    ].filter(Boolean),
    onClick: ({ key }) => {
      if (key === 'view') setDetail(t);
      else if (key === 'refund') openRefund(t.raw);
    },
  });

  return (
    <>
      <PageHeader
        title="Quản lý giao dịch"
        description="Theo dõi toàn bộ giao dịch bán vé, hoàn tiền và đối soát thanh toán theo ngày."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatPill
          label="Doanh thu kỳ này"
          value={loading ? '—' : compactVnd(kpi.revenue)}
          hint="Tổng tiền giao dịch thành công"
          tone="teal"
        />
        <StatPill
          label="Giao dịch thành công"
          value={loading ? '—' : kpi.success.toLocaleString('vi-VN')}
          hint={`Trung bình ${compactVnd(kpi.avg)}/giao dịch`}
          tone="success"
        />
        <StatPill
          label="Chờ xử lý"
          value={loading ? '—' : String(kpi.pending)}
          hint="Cần đối soát"
          tone="warn"
        />
        <StatPill
          label="Hoàn tiền"
          value={loading ? '—' : String(kpi.refunded)}
          hint={`Tổng ${compactVnd(kpi.refundAmount)} hoàn lại`}
        />
        <StatPill
          label="Thất bại"
          value={loading ? '—' : String(kpi.failed)}
          hint="Giao dịch lỗi / huỷ"
          tone="danger"
        />
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--vxn-border)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: 0,
        }}
      >
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Tìm mã GD, mã đặt vé, khách hàng, số ĐT…"
        />
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <RangePicker
            value={range}
            onChange={(r) => r && setRange(r)}
            allowClear={false}
            format="DD/MM/YYYY"
            style={{ height: 40 }}
          />
          <Select
            value={methodF}
            onChange={setMethodF}
            options={[
              { value: 'all', label: 'Tất cả PT thanh toán' },
              { value: 'vnpay', label: 'VNPay' },
              { value: 'momo', label: 'MoMo' },
              { value: 'zalopay', label: 'ZaloPay' },
              { value: 'cash', label: 'Tiền mặt' },
              { value: 'card', label: 'Thẻ ngân hàng' },
            ]}
          />
          <Select
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'success', label: 'Thành công' },
              { value: 'pending', label: 'Chờ xử lý' },
              { value: 'refunded', label: 'Hoàn tiền' },
              { value: 'failed', label: 'Thất bại' },
            ]}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'time', label: 'Sắp xếp: Mới nhất' },
              { value: 'amount', label: 'Sắp xếp: Số tiền ↓' },
              { value: 'status', label: 'Sắp xếp: Trạng thái' },
            ]}
          />
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--vxn-border)',
          borderRadius: 12,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                'Mã giao dịch',
                'Khách hàng',
                'Tuyến / Ghế',
                'Số tiền',
                'Phương thức',
                'Trạng thái',
                'Thời gian',
                '',
              ].map((c, i) => (
                <th
                  key={i}
                  style={{
                    background: '#F4F6FB',
                    textAlign: 'left',
                    padding: '12px 16px',
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
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: 40, textAlign: 'center', color: 'var(--vxn-fg-5)' }}
                >
                  Đang tải giao dịch…
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((t, i) => {
                const m = t.methodMeta;
                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom:
                        i < pageRows.length - 1
                          ? '1px solid var(--vxn-border)'
                          : 0,
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          color: 'var(--vxn-teal-800)',
                          font: '600 13px var(--font-mono)',
                        }}
                      >
                        {t.payCode}
                      </span>
                      <div
                        style={{
                          font: '400 11px var(--font-mono)',
                          color: 'var(--vxn-fg-5)',
                          marginTop: 2,
                        }}
                      >
                        {t.bookingCode}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          font: '600 14px var(--font-display)',
                          color: 'var(--vxn-ink)',
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          font: '400 12px var(--font-mono)',
                          color: 'var(--vxn-fg-5)',
                          marginTop: 2,
                        }}
                      >
                        {t.phone}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          font: '500 13.5px var(--font-display)',
                          color: 'var(--vxn-ink)',
                        }}
                      >
                        {t.route}
                      </div>
                      <div
                        style={{
                          font: '400 12px var(--font-display)',
                          color: 'var(--vxn-fg-5)',
                          marginTop: 2,
                        }}
                      >
                        Ghế {t.seats}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        font: '600 14px var(--font-display)',
                        color: 'var(--vxn-ink)',
                      }}
                    >
                      {vnd(t.amount)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: `${m.c}1F`,
                            color: m.c,
                            display: 'grid',
                            placeItems: 'center',
                            font: '700 10px var(--font-display)',
                          }}
                        >
                          {m.t}
                        </span>
                        <span
                          style={{
                            font: '400 13.5px var(--font-display)',
                            color: 'var(--vxn-fg-2)',
                          }}
                        >
                          {t.method}
                        </span>
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{statusChip(t.status)}</td>
                    <td
                      style={{
                        padding: '14px 16px',
                        font: '400 12.5px var(--font-display)',
                        color: 'var(--vxn-fg-5)',
                      }}
                    >
                      {t.time}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 4,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <RowIconBtn
                          icon="eye"
                          title="Xem chi tiết"
                          onClick={() => setDetail(t)}
                        />
                        <Dropdown
                          trigger={['click']}
                          menu={rowMenu(t)}
                          placement="bottomRight"
                        >
                          <span>
                            <RowIconBtn icon="ellipsis-vertical" title="Thao tác" />
                          </span>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: 40, textAlign: 'center', color: 'var(--vxn-fg-5)' }}
                >
                  Không có giao dịch nào trong khoảng thời gian đã chọn.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid var(--vxn-border)',
            background: '#FBFCFE',
          }}
        >
          <span
            style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}
          >
            Hiển thị {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}{' '}
            giao dịch
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PageBtn
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </PageBtn>
            {pageNumbers.map((n) => (
              <PageBtn key={n} active={n === currentPage} onClick={() => setPage(n)}>
                {n}
              </PageBtn>
            ))}
            <PageBtn
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </PageBtn>
          </div>
        </div>
      </div>

      <Modal
        title="Chi tiết giao dịch"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={560}
      >
        {detail && (
          <div style={{ display: 'grid', gap: 12, paddingTop: 8 }}>
            {[
              ['Mã giao dịch', detail.payCode],
              ['Mã đặt vé', detail.bookingCode],
              ['Khách hàng', `${detail.name} · ${detail.phone}`],
              ['Tuyến', detail.route],
              ['Ghế', detail.seats],
              ['Số tiền', vnd(detail.amount)],
              [
                'Đã hoàn',
                detail.refundAmount ? vnd(detail.refundAmount) : 'Không',
              ],
              ['Phương thức', detail.method],
              ['Trạng thái', detail.rawStatus],
              [
                'Thời gian',
                detail.createdAt
                  ? dayjs(detail.createdAt).format('DD/MM/YYYY HH:mm')
                  : '—',
              ],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  font: '400 13.5px var(--font-display)',
                }}
              >
                <span style={{ color: 'var(--vxn-fg-5)' }}>{k}</span>
                <span
                  style={{ color: 'var(--vxn-ink)', fontWeight: 500, textAlign: 'right' }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        title="Hoàn tiền giao dịch"
        open={!!refundTarget}
        onOk={submitRefund}
        onCancel={() => {
          setRefundTarget(null);
          refundForm.resetFields();
        }}
        okText="Xác nhận hoàn tiền"
        okType="danger"
        cancelText="Hủy"
      >
        {refundTarget && (
          <Form form={refundForm} layout="vertical">
            <p
              style={{
                font: '400 13px var(--font-display)',
                color: 'var(--vxn-fg-5)',
                marginBottom: 12,
              }}
            >
              Giao dịch {refundTarget.paymentCode} · Tổng{' '}
              {vnd(refundTarget.amount)}
              {refundTarget.refundAmount
                ? ` · Đã hoàn ${vnd(refundTarget.refundAmount)}`
                : ''}
            </p>
            <Form.Item
              name="amount"
              label="Số tiền hoàn (VNĐ)"
              rules={[
                { required: true, message: 'Nhập số tiền hoàn' },
                { type: 'number', min: 1, message: 'Số tiền không hợp lệ' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
            <Form.Item
              name="reason"
              label="Lý do hoàn tiền"
              rules={[{ required: true, message: 'Nhập lý do hoàn tiền' }]}
            >
              <Input.TextArea rows={3} placeholder="Lý do hoàn tiền cho khách" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};

export default TransactionsPage;
