/**
 * Quản lý nhà xe — System-admin portal.
 *
 * Faithful port of the design package's `admin-operators.jsx` view, wired
 * to REAL backend data (`/admin/operators` + the new
 * `/admin/operators/statistics`) instead of the design's hard-coded `OPS`
 * sample array.
 *
 * Honesty-over-pixel-match substitutions (design → truthful equivalent):
 *  • KPI #4 "Tổng doanh thu / tháng 42,3 tỷ" → "Tạm ngưng" count. There is
 *    no per-operator *monthly* revenue in the data model; the four KPIs now
 *    mirror the real tab buckets.
 *  • Tabs: added a real "Từ chối" bucket the design omitted (rejected is a
 *    genuine verification state).
 *  • Column "Đội xe / Tài xế" + "Tuyến" → "Liên hệ" (email/phone) — fleet,
 *    driver and route counts are not stored on the operator document, so
 *    fabricating them would be dishonest.
 *  • Column "Gói" (Enterprise/Pro/Starter) → "Hoa hồng" (real
 *    `commissionRate` %). There is no subscription-plan concept.
 *  • "Doanh thu / tháng" → "Doanh thu tích lũy" (real lifetime
 *    `totalRevenue`, labelled accurately).
 *  • Header CTA "Nhập danh sách / Thêm nhà xe" → "Làm mới". Operators
 *    self-register; admins approve/reject, they do not create operators and
 *    there is no bulk-import endpoint.
 *  • Filter "Mọi gói dịch vụ" + "Xuất Excel" dropped (no such data / no
 *    export endpoint); the real, working sort control is kept.
 *
 * Per the proven operator-portal redesign convention, the page chrome uses
 * the VXN design system while AntD is retained only for modals / forms /
 * toasts (which render in a portal outside the scoped `.vxn-admin` tokens).
 */
import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, message } from 'antd';
import dayjs from 'dayjs';
import { adminOperators } from '../../services/adminApi';
import { getOperatorDisplayName } from '../../utils/operatorDisplay';
import {
  PageHeader,
  Btn,
  Chip,
  Card,
  Tabs,
  SearchInput,
  Select,
  Table,
  Pager,
  KpiCard,
  Skeleton,
  VxnIcon,
  ShortMoney,
} from '../../components/admin/vxn';

const { TextArea } = Input;

const PAGE_SIZE = 20;

const SORT_OPTS = [
  { value: 'createdAt:desc', label: 'Sắp xếp: Mới nhất' },
  { value: 'createdAt:asc', label: 'Sắp xếp: Cũ nhất' },
  { value: 'totalRevenue:desc', label: 'Sắp xếp: Doanh thu' },
  { value: 'averageRating:desc', label: 'Sắp xếp: Đánh giá' },
  { value: 'companyName:asc', label: 'Sắp xếp: Tên A→Z' },
];

const STATUS_TONE = {
  active: { tone: 'success', label: 'Đang hoạt động' },
  pending: { tone: 'saffron', label: 'Chờ duyệt' },
  suspended: { tone: 'danger', label: 'Tạm ngưng' },
  rejected: { tone: 'neutral', label: 'Đã từ chối' },
};

function statusOf(o) {
  if (o.verificationStatus === 'rejected') return 'rejected';
  if (o.isSuspended) return 'suspended';
  if (o.verificationStatus === 'pending') return 'pending';
  return 'active';
}

function tabParams(tab) {
  switch (tab) {
    case 'active':
      return { verificationStatus: 'approved', isSuspended: 'false' };
    case 'pending':
      return { verificationStatus: 'pending' };
    case 'suspended':
      return { isSuspended: 'true' };
    case 'rejected':
      return { verificationStatus: 'rejected' };
    default:
      return {};
  }
}

const PALETTE = ['#E89B26', '#006481', '#1D4ED8', '#00613D', '#D18A1E'];
function brandColor(id = '') {
  const idx =
    String(id)
      .split('')
      .reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[idx];
}
function initials(name = 'NX') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function OperatorCell({ op }) {
  const st = statusOf(op);
  const bg =
    st === 'pending'
      ? 'var(--vxn-saffron-500)'
      : st === 'suspended'
        ? '#FCA5A5'
        : st === 'rejected'
          ? 'var(--vxn-fg-5)'
          : brandColor(op._id);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
      {op.logo ? (
        <img
          src={op.logo}
          alt={getOperatorDisplayName(op, 'Nhà xe')}
          style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: bg,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            font: '600 14px var(--font-display)',
            flexShrink: 0,
          }}
        >
          {initials(getOperatorDisplayName(op, 'NX'))}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
          {getOperatorDisplayName(op, '—')}
        </div>
        <div
          style={{
            font: '400 12px var(--font-display)',
            color: 'var(--vxn-fg-5)',
            marginTop: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <code style={{ font: '500 11.5px ui-monospace, monospace' }}>
            #{String(op._id).slice(-6).toUpperCase()}
          </code>
          <span>·</span>
          <span>{dayjs(op.createdAt).format('MM/YYYY')}</span>
        </div>
      </div>
    </div>
  );
}

function NumCell({ main, sub }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>{main}</div>
      <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

function RatingCell({ rating, count }) {
  if (!rating) return <span style={{ color: 'var(--vxn-fg-5)' }}>—</span>;
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          font: '600 13.5px var(--font-display)',
          color: 'var(--vxn-ink)',
        }}
      >
        <VxnIcon name="star" size={14} color="var(--vxn-saffron-600)" />
        {Number(rating).toFixed(1)}
      </div>
      <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
        {count || 0} đánh giá
      </div>
    </div>
  );
}

const iconActStyle = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  color: 'var(--vxn-fg-4)',
};

const OperatorManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // Detail
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reject / suspend (reason) modals
  const [reasonModal, setReasonModal] = useState(null); // { type:'reject'|'suspend', op }
  const [reasonForm] = Form.useForm();
  const [reasonLoading, setReasonLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminOperators.getStatistics();
      if (res?.data) setStats(res.data);
    } catch {
      /* statistics are non-fatal */
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, reloadKey]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQd(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Reset to first page whenever the query shape changes
  useEffect(() => {
    setPage(1);
  }, [tab, qd, sort]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [sortBy, sortOrder] = sort.split(':');
        const params = {
          page,
          limit: PAGE_SIZE,
          sortBy,
          sortOrder,
          ...tabParams(tab),
        };
        if (qd.trim()) params.search = qd.trim();
        const res = await adminOperators.getOperators(params);
        if (alive && res.status === 'success') {
          setRows(res.data.operators || []);
          setTotal(res.data.pagination?.total || 0);
        }
      } catch (e) {
        if (alive) {
          message.error(typeof e === 'string' ? e : 'Không thể tải danh sách nhà xe');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, tab, qd, sort, reloadKey]);

  const refresh = () => {
    setReloadKey((k) => k + 1);
  };

  const openDetail = async (op) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await adminOperators.getOperatorById(op._id);
      if (res.status === 'success') setDetail(res.data.operator);
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Không thể tải thông tin chi tiết');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const doApprove = (op) => {
    Modal.confirm({
      title: 'Duyệt hồ sơ nhà xe',
      content: `Xác nhận duyệt nhà xe "${getOperatorDisplayName(op, 'nhà xe')}"? Nhà xe sẽ có thể vận hành ngay sau khi duyệt.`,
      okText: 'Duyệt',
      cancelText: 'Hủy',
      okButtonProps: { type: 'primary' },
      onOk: async () => {
        try {
          const res = await adminOperators.approveOperator(op._id);
          if (res.status === 'success') {
            message.success('Đã duyệt nhà xe');
            refresh();
          }
        } catch (e) {
          message.error(typeof e === 'string' ? e : 'Không thể duyệt nhà xe');
        }
      },
    });
  };

  const doResume = (op) => {
    Modal.confirm({
      title: 'Khôi phục hoạt động',
      content: `Xác nhận khôi phục hoạt động cho nhà xe "${getOperatorDisplayName(op, 'nhà xe')}"?`,
      okText: 'Khôi phục',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await adminOperators.resumeOperator(op._id);
          if (res.status === 'success') {
            message.success('Đã khôi phục nhà xe');
            refresh();
          }
        } catch (e) {
          message.error(typeof e === 'string' ? e : 'Không thể khôi phục nhà xe');
        }
      },
    });
  };

  const openReason = (type, op) => {
    reasonForm.resetFields();
    setReasonModal({ type, op });
  };

  const submitReason = async (values) => {
    if (!reasonModal) return;
    const { type, op } = reasonModal;
    setReasonLoading(true);
    try {
      const res =
        type === 'reject'
          ? await adminOperators.rejectOperator(op._id, values.reason)
          : await adminOperators.suspendOperator(op._id, values.reason);
      if (res.status === 'success') {
        message.success(type === 'reject' ? 'Đã từ chối nhà xe' : 'Đã tạm ngưng nhà xe');
        setReasonModal(null);
        refresh();
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Thao tác thất bại');
    } finally {
      setReasonLoading(false);
    }
  };

  const columns = [
    { key: 'op', label: 'Nhà xe', render: (o) => <OperatorCell op={o} /> },
    {
      key: 'city',
      label: 'Trụ sở',
      render: (o) => (
        <span style={{ color: 'var(--vxn-fg-3)' }}>{o.address?.city || '—'}</span>
      ),
    },
    {
      key: 'contact',
      label: 'Liên hệ',
      render: (o) => (
        <div>
          <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
            {o.email}
          </div>
          <div
            style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}
          >
            {o.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'trips',
      label: 'Chuyến tích lũy',
      align: 'right',
      render: (o) => (
        <NumCell
          main={Number(o.totalTrips || 0).toLocaleString('vi-VN')}
          sub="chuyến đã chạy"
        />
      ),
    },
    {
      key: 'rev',
      label: 'Doanh thu tích lũy',
      align: 'right',
      render: (o) => (
        <div
          style={{
            font: '600 14px var(--font-display)',
            color: o.totalRevenue > 0 ? 'var(--vxn-ink)' : 'var(--vxn-fg-5)',
          }}
        >
          {o.totalRevenue > 0 ? ShortMoney(o.totalRevenue) + 'đ' : '—'}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Đánh giá',
      align: 'center',
      render: (o) => <RatingCell rating={o.averageRating} count={o.totalReviews} />,
    },
    {
      key: 'commission',
      label: 'Hoa hồng',
      align: 'center',
      render: (o) => (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 9px',
            borderRadius: 4,
            background: 'var(--vxn-bg-mist)',
            color: 'var(--vxn-fg-2)',
            border: '1px solid var(--vxn-border)',
            font: '600 12px var(--font-display)',
          }}
        >
          {o.commissionRate ?? 5}%
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (o) => {
        const s = STATUS_TONE[statusOf(o)];
        return (
          <Chip tone={s.tone} dot>
            {s.label}
          </Chip>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (o) => {
        const st = statusOf(o);
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <button title="Xem chi tiết" style={iconActStyle} onClick={() => openDetail(o)}>
              <VxnIcon name="eye" size={16} />
            </button>
            {o.verificationStatus === 'pending' && (
              <>
                <button
                  title="Duyệt"
                  style={{ ...iconActStyle, color: '#15803D' }}
                  onClick={() => doApprove(o)}
                >
                  <VxnIcon name="check" size={16} />
                </button>
                <button
                  title="Từ chối"
                  style={{ ...iconActStyle, color: '#B91C1C' }}
                  onClick={() => openReason('reject', o)}
                >
                  <VxnIcon name="x" size={16} />
                </button>
              </>
            )}
            {o.verificationStatus === 'approved' &&
              (st === 'suspended' ? (
                <button
                  title="Khôi phục"
                  style={{ ...iconActStyle, color: '#15803D' }}
                  onClick={() => doResume(o)}
                >
                  <VxnIcon name="play" size={16} />
                </button>
              ) : (
                <button
                  title="Tạm ngưng"
                  style={{ ...iconActStyle, color: '#B91C1C' }}
                  onClick={() => openReason('suspend', o)}
                >
                  <VxnIcon name="ban" size={16} />
                </button>
              ))}
          </div>
        );
      },
    },
  ];

  const kpiValue = (n) =>
    stats ? Number(n || 0).toLocaleString('vi-VN') : <Skeleton width={44} height={26} />;

  return (
    <div>
      <PageHeader
        title="Quản lý nhà xe"
        description="Quản lý các đối tác nhà xe trên nền tảng Vé Xe Nhanh — duyệt hồ sơ, theo dõi hiệu suất, giám sát trạng thái vận hành."
        cta={
          <Btn kind="ghost" icon="refresh-cw" onClick={refresh}>
            Làm mới
          </Btn>
        }
      />

      <div
        className="admin-grid"
        style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        <KpiCard
          label="Tổng nhà xe"
          value={kpiValue(stats?.total)}
          sub="Đối tác đã đăng ký"
          icon="building-2"
          iconBg="#DBEAFE"
        />
        <KpiCard
          label="Đang hoạt động"
          value={kpiValue(stats?.active)}
          sub="đã duyệt & vận hành"
          icon="circle-check"
          iconBg="#DCFCE7"
        />
        <KpiCard
          label="Chờ duyệt"
          value={kpiValue(stats?.pending)}
          sub="hồ sơ đang xem xét"
          icon="hourglass"
          iconBg="#FEF3D7"
          accent="var(--vxn-saffron-500)"
        />
        <KpiCard
          label="Tạm ngưng"
          value={kpiValue(stats?.suspended)}
          sub="đang bị khóa hoạt động"
          icon="ban"
          iconBg="#FEE2E2"
          accent="#DC2626"
        />
      </div>

      <Card padding={0}>
        <Tabs
          tabs={[
            { key: 'all', label: 'Tất cả', count: stats?.total },
            { key: 'active', label: 'Đang hoạt động', count: stats?.active },
            { key: 'pending', label: 'Chờ duyệt', count: stats?.pending },
            { key: 'suspended', label: 'Tạm ngưng', count: stats?.suspended },
            { key: 'rejected', label: 'Từ chối', count: stats?.rejected },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--vxn-border-muted)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tên công ty, email, SĐT…" />
          <Select value={sort} onChange={setSort} options={SORT_OPTS} />
          <div style={{ flex: 1 }} />
          <Btn kind="ghost" icon="refresh-cw" onClick={refresh}>
            Làm mới
          </Btn>
        </div>

        <Table
          columns={columns}
          rows={rows}
          empty={
            loading ? 'Đang tải danh sách nhà xe…' : 'Không có nhà xe nào khớp bộ lọc hiện tại.'
          }
        />
        <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
      </Card>

      {/* Detail modal */}
      <Modal
        title="Chi tiết nhà xe"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={760}
      >
        {detailLoading || !detail ? (
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={20} width="40%" />
            <Skeleton height={14} />
            <Skeleton height={14} width="80%" />
            <Skeleton height={14} width="60%" />
          </div>
        ) : (
          <DetailBody op={detail} />
        )}
      </Modal>

      {/* Reject / Suspend reason modal */}
      <Modal
        title={reasonModal?.type === 'reject' ? 'Từ chối hồ sơ nhà xe' : 'Tạm ngưng nhà xe'}
        open={!!reasonModal}
        onCancel={() => setReasonModal(null)}
        onOk={() => reasonForm.submit()}
        confirmLoading={reasonLoading}
        okText={reasonModal?.type === 'reject' ? 'Từ chối' : 'Tạm ngưng'}
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <p style={{ color: 'var(--vxn-fg-3)', marginTop: 0 }}>
          {reasonModal?.type === 'reject'
            ? `Bạn đang từ chối hồ sơ đăng ký của "${getOperatorDisplayName(reasonModal?.op, 'nhà xe')}".`
            : `Bạn đang tạm ngưng hoạt động của "${getOperatorDisplayName(reasonModal?.op, 'nhà xe')}".`}
        </p>
        <Form form={reasonForm} layout="vertical" onFinish={submitReason}>
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <TextArea rows={4} placeholder="Nhập lý do cụ thể để nhà xe nắm rõ…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ───────── Detail body (real operator fields) ───────── */
function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--vxn-border-muted)' }}>
      <div style={{ width: 180, flexShrink: 0, font: '500 13px var(--font-display)', color: 'var(--vxn-fg-4)' }}>
        {label}
      </div>
      <div style={{ flex: 1, font: '400 13.5px var(--font-display)', color: 'var(--vxn-fg-1)' }}>
        {children || '—'}
      </div>
    </div>
  );
}

function DetailBody({ op }) {
  const st = statusOf(op);
  const s = STATUS_TONE[st];
  const addr = [
    op.address?.street,
    op.address?.ward,
    op.address?.district,
    op.address?.city,
    op.address?.country,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '4px 0 18px' }}>
        {op.logo ? (
          <img
            src={op.logo}
            alt={getOperatorDisplayName(op, 'Nhà xe')}
            style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: brandColor(op._id),
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              font: '600 18px var(--font-display)',
            }}
          >
            {initials(getOperatorDisplayName(op, 'NX'))}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>
            {getOperatorDisplayName(op, '—')}
          </div>
          <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-4)', marginTop: 2 }}>
            {op.email} · {op.phone}
          </div>
        </div>
        <Chip tone={s.tone} dot>
          {s.label}
        </Chip>
      </div>

      <Row label="Mã hệ thống">
        <code style={{ font: '500 12.5px ui-monospace, monospace' }}>{op._id}</code>
      </Row>
      <Row label="Địa chỉ">{addr}</Row>
      <Row label="Giấy phép kinh doanh">{op.businessLicense}</Row>
      <Row label="Mã số thuế">{op.taxCode}</Row>
      <Row label="Website">
        {op.website ? (
          <a href={op.website} target="_blank" rel="noreferrer" style={{ color: 'var(--vxn-teal-700)' }}>
            {op.website}
          </a>
        ) : null}
      </Row>
      <Row label="Hoa hồng nền tảng">{(op.commissionRate ?? 5) + '%'}</Row>
      <Row label="Đánh giá">
        {op.averageRating
          ? `${Number(op.averageRating).toFixed(1)} / 5 · ${op.totalReviews || 0} đánh giá`
          : 'Chưa có đánh giá'}
      </Row>
      <Row label="Chuyến · Doanh thu tích lũy">
        {`${Number(op.totalTrips || 0).toLocaleString('vi-VN')} chuyến · ${ShortMoney(op.totalRevenue)}đ`}
      </Row>
      <Row label="Ngày đăng ký">{dayjs(op.createdAt).format('DD/MM/YYYY HH:mm')}</Row>
      {op.verifiedAt && (
        <Row label="Ngày duyệt / xử lý">{dayjs(op.verifiedAt).format('DD/MM/YYYY HH:mm')}</Row>
      )}
      {op.bankInfo?.bankName && (
        <Row label="Tài khoản nhận tiền">
          {`${op.bankInfo.bankName} · ${op.bankInfo.accountNumber || ''} · ${
            op.bankInfo.accountHolder || ''
          }`}
        </Row>
      )}
      {op.description && <Row label="Giới thiệu">{op.description}</Row>}
      {op.verificationStatus === 'rejected' && op.rejectionReason && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 8,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            font: '400 13px var(--font-display)',
          }}
        >
          <strong>Lý do từ chối:</strong> {op.rejectionReason}
        </div>
      )}
      {op.isSuspended && op.suspensionReason && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 8,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#B45309',
            font: '400 13px var(--font-display)',
          }}
        >
          <strong>Lý do tạm ngưng:</strong> {op.suspensionReason}
        </div>
      )}
    </div>
  );
}

export default OperatorManagementPage;
