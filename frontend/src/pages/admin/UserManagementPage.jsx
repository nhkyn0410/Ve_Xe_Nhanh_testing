/**
 * Quản lý khách hàng — System-admin portal.
 *
 * Faithful port of the design package's `admin-customers.jsx` view, wired
 * to REAL backend data (`/admin/users` + `/admin/users/statistics`) instead
 * of the design's hard-coded `CUSTOMERS` sample array.
 *
 * Honesty-over-pixel-match substitutions (design → truthful equivalent):
 *  • Tier-strip counts come from the real `usersByTier` aggregation; the
 *    threshold/benefit sub-labels are kept verbatim because they exactly
 *    match the real `User.updateLoyaltyTier` / `getTierBenefits` rules
 *    (≥10k→platinum 15%, ≥5k→gold 10%, ≥2k→silver 5%, 0+→bronze).
 *  • Column "Điểm ≈ đ" → just real `totalPoints`. There is no
 *    point→VND conversion rate in the system, so the "≈ đ" was fabricated.
 *  • Column "Chuyến gần nhất" → "Hoạt động gần nhất" (real `lastLogin`).
 *    Per-user last-trip date is not on the user list payload.
 *  • Header CTA "Tặng điểm thủ công / Gửi email hàng loạt" → "Làm mới".
 *    No manual-points or bulk-email endpoint exists.
 *  • "Xuất Excel" dropped (no export endpoint). A real Role filter is
 *    added so this remains the full user manager it is in the backend.
 *
 * Page chrome uses the VXN design system; AntD is retained only for
 * modals / forms / toasts (proven operator-portal redesign convention).
 */
import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, message, Tag } from 'antd';
import dayjs from 'dayjs';
import { adminUsers } from '../../services/adminApi';
import {
  PageHeader,
  Btn,
  Chip,
  Card,
  SearchInput,
  Select,
  Table,
  Pager,
  VxnIcon,
  MoneyVND,
  Skeleton,
} from '../../components/admin/vxn';

const PAGE_SIZE = 20;

const TIER = {
  bronze: { label: 'Bronze', bg: '#F1E4D3', fg: '#7A4F1B', solid: '#A86D3A' },
  silver: { label: 'Silver', bg: '#E5E7EB', fg: '#374151', solid: '#9CA3AF' },
  gold: { label: 'Gold', bg: '#FEF3C7', fg: '#92400E', solid: '#D97706' },
  platinum: { label: 'Platinum', bg: '#E0F2FE', fg: '#075985', solid: '#0EA5E9' },
};

const TIER_SUB = {
  platinum: '≥ 10.000 điểm · ưu đãi 15%',
  gold: '≥ 5.000 điểm · ưu đãi 10%',
  silver: '≥ 2.000 điểm · ưu đãi 5%',
  bronze: '0+ điểm · không ưu đãi',
};

const STATUS_TONE = {
  active: { tone: 'success', label: 'Đang hoạt động' },
  inactive: { tone: 'neutral', label: 'Chưa kích hoạt' },
  blocked: { tone: 'danger', label: 'Bị khóa' },
};

const ROLE_OPTS = [
  { value: 'customer', label: 'Khách hàng' },
  { value: 'operator', label: 'Nhà xe' },
  { value: 'trip_manager', label: 'Quản lý chuyến' },
  { value: 'admin', label: 'Admin' },
  { value: 'all', label: 'Tất cả vai trò' },
];

const TIER_OPTS = [
  { value: 'all', label: 'Tất cả hạng' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
];

const STATUS_OPTS = [
  { value: 'all', label: 'Mọi trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Chưa kích hoạt' },
  { value: 'blocked', label: 'Bị khóa' },
];

function statusOf(u) {
  if (u.isBlocked) return 'blocked';
  if (!u.isActive) return 'inactive';
  return 'active';
}

function statusParams(s) {
  switch (s) {
    case 'active':
      return { isActive: 'true', isBlocked: 'false' };
    case 'inactive':
      return { isActive: 'false' };
    case 'blocked':
      return { isBlocked: 'true' };
    default:
      return {};
  }
}

function initials(name = 'KH') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function TierCard({ tier, count }) {
  const t = TIER[tier];
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--vxn-border)',
        borderRadius: 12,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 90,
          height: 90,
          background: t.bg,
          borderRadius: '50%',
          transform: 'translate(30%, -30%)',
          opacity: 0.6,
        }}
      />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.solid }} />
          <div
            style={{
              font: '600 11.5px var(--font-display)',
              letterSpacing: '0.1em',
              color: t.fg,
              textTransform: 'uppercase',
            }}
          >
            {t.label}
          </div>
        </div>
        <div
          style={{
            font: '600 28px var(--font-display)',
            color: 'var(--vxn-ink)',
            marginTop: 12,
            letterSpacing: '-0.02em',
          }}
        >
          {count == null ? <Skeleton width={64} height={26} /> : Number(count).toLocaleString('vi-VN')}
        </div>
        <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-4)', marginTop: 4 }}>
          {TIER_SUB[tier]}
        </div>
      </div>
    </div>
  );
}

function CustomerCell({ u }) {
  const t = TIER[u.loyaltyTier] || TIER.bronze;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
      {u.avatar ? (
        <img
          src={u.avatar}
          alt={u.fullName}
          style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: t.solid,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            font: '600 13px var(--font-display)',
            flexShrink: 0,
          }}
        >
          {initials(u.fullName || u.email)}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
          {u.fullName || 'Chưa đặt tên'}
        </div>
        <div
          style={{
            font: '400 11.5px ui-monospace, monospace',
            color: 'var(--vxn-fg-5)',
            marginTop: 2,
          }}
        >
          #{String(u._id).slice(-8).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function TierBadge({ tier }) {
  const t = TIER[tier] || TIER.bronze;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        font: '600 11.5px var(--font-display)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.solid }} />
      {t.label}
    </span>
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

const UserManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);

  const [role, setRole] = useState('customer');
  const [tier, setTier] = useState('all');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Block / reset-password
  const [blockUser, setBlockUser] = useState(null);
  const [blockForm] = Form.useForm();
  const [blockLoading, setBlockLoading] = useState(false);

  const [pwUser, setPwUser] = useState(null);
  const [pwForm] = Form.useForm();
  const [pwLoading, setPwLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminUsers.getStatistics();
      if (res?.data) setStats(res.data);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, reloadKey]);

  useEffect(() => {
    const t = setTimeout(() => setQd(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [role, tier, status, qd]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: PAGE_SIZE,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          ...statusParams(status),
        };
        if (role !== 'all') params.role = role;
        if (tier !== 'all') params.loyaltyTier = tier;
        if (qd.trim()) params.search = qd.trim();
        const res = await adminUsers.getUsers(params);
        if (alive && res.success) {
          setRows(res.data.users || []);
          setTotal(res.data.pagination?.total || 0);
        }
      } catch (e) {
        if (alive) message.error(typeof e === 'string' ? e : 'Không thể tải danh sách người dùng');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, role, tier, status, qd, reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  const openDetail = async (u) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await adminUsers.getUserById(u._id);
      if (res.success) setDetail(res.data);
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Không thể tải thông tin chi tiết');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const submitBlock = async (values) => {
    setBlockLoading(true);
    try {
      const res = await adminUsers.blockUser(blockUser._id, values.reason);
      if (res.success) {
        message.success('Đã khóa tài khoản');
        setBlockUser(null);
        refresh();
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Không thể khóa tài khoản');
    } finally {
      setBlockLoading(false);
    }
  };

  const doUnblock = (u) => {
    Modal.confirm({
      title: 'Mở khóa tài khoản',
      content: `Xác nhận mở khóa tài khoản "${u.fullName || u.email}"?`,
      okText: 'Mở khóa',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await adminUsers.unblockUser(u._id);
          if (res.success) {
            message.success('Đã mở khóa tài khoản');
            refresh();
          }
        } catch (e) {
          message.error(typeof e === 'string' ? e : 'Không thể mở khóa tài khoản');
        }
      },
    });
  };

  const submitPw = async (values) => {
    setPwLoading(true);
    try {
      const res = await adminUsers.resetPassword(pwUser._id, values.newPassword);
      if (res.success) {
        message.success('Đã đặt lại mật khẩu');
        setPwUser(null);
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Không thể đặt lại mật khẩu');
    } finally {
      setPwLoading(false);
    }
  };

  const columns = [
    { key: 'cu', label: 'Khách hàng', render: (u) => <CustomerCell u={u} /> },
    {
      key: 'contact',
      label: 'Liên hệ',
      render: (u) => (
        <div>
          <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
            {u.email}
          </div>
          <div
            style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}
          >
            {u.phone || '—'}
            {u.address?.city ? ` · ${u.address.city}` : ''}
          </div>
        </div>
      ),
    },
    { key: 'tier', label: 'Hạng', render: (u) => <TierBadge tier={u.loyaltyTier} /> },
    {
      key: 'points',
      label: 'Điểm',
      align: 'right',
      render: (u) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
            {Number(u.totalPoints || 0).toLocaleString('vi-VN')}
          </div>
          <div
            style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}
          >
            điểm tích lũy
          </div>
        </div>
      ),
    },
    {
      key: 'bookings',
      label: 'Đặt vé · Chi tiêu',
      align: 'right',
      render: (u) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>
            {Number(u.totalBookings || 0).toLocaleString('vi-VN')} vé
          </div>
          <div
            style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}
          >
            {MoneyVND(u.totalSpent || 0)}
          </div>
        </div>
      ),
    },
    {
      key: 'last',
      label: 'Hoạt động gần nhất',
      render: (u) => (
        <div style={{ color: 'var(--vxn-fg-3)', font: '400 13px var(--font-display)' }}>
          {u.lastLogin ? dayjs(u.lastLogin).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (u) => {
        const s = STATUS_TONE[statusOf(u)];
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
      render: (u) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <button title="Xem chi tiết" style={iconActStyle} onClick={() => openDetail(u)}>
            <VxnIcon name="eye" size={16} />
          </button>
          {u.isBlocked ? (
            <button
              title="Mở khóa"
              style={{ ...iconActStyle, color: '#15803D' }}
              onClick={() => doUnblock(u)}
            >
              <VxnIcon name="lock-open" size={16} />
            </button>
          ) : (
            <button
              title="Khóa tài khoản"
              style={{ ...iconActStyle, color: '#B91C1C' }}
              onClick={() => {
                blockForm.resetFields();
                setBlockUser(u);
              }}
            >
              <VxnIcon name="lock" size={16} />
            </button>
          )}
          <button
            title="Đặt lại mật khẩu"
            style={iconActStyle}
            onClick={() => {
              pwForm.resetFields();
              setPwUser(u);
            }}
          >
            <VxnIcon name="key-round" size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý khách hàng"
        description="Khách hàng đang sử dụng nền tảng, phân hạng thành viên (loyalty tiers) và lịch sử điểm tích lũy."
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
        <TierCard tier="platinum" count={stats?.usersByTier?.platinum ?? null} />
        <TierCard tier="gold" count={stats?.usersByTier?.gold ?? null} />
        <TierCard tier="silver" count={stats?.usersByTier?.silver ?? null} />
        <TierCard tier="bronze" count={stats?.usersByTier?.bronze ?? null} />
      </div>

      <Card padding={0}>
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
          <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tên, email, SĐT…" />
          <Select value={role} onChange={setRole} options={ROLE_OPTS} />
          <Select value={tier} onChange={setTier} options={TIER_OPTS} />
          <Select value={status} onChange={setStatus} options={STATUS_OPTS} />
          <div style={{ flex: 1 }} />
          <Btn kind="ghost" icon="refresh-cw" onClick={refresh}>
            Làm mới
          </Btn>
        </div>

        <Table
          columns={columns}
          rows={rows}
          empty={loading ? 'Đang tải danh sách…' : 'Không có người dùng nào khớp bộ lọc.'}
        />
        <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
      </Card>

      {/* Detail modal */}
      <Modal
        title="Chi tiết người dùng"
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
          </div>
        ) : (
          <DetailBody data={detail} />
        )}
      </Modal>

      {/* Block modal */}
      <Modal
        title="Khóa tài khoản"
        open={!!blockUser}
        onCancel={() => setBlockUser(null)}
        onOk={() => blockForm.submit()}
        confirmLoading={blockLoading}
        okText="Khóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <p style={{ color: 'var(--vxn-fg-3)', marginTop: 0 }}>
          Bạn đang khóa tài khoản &quot;{blockUser?.fullName || blockUser?.email}&quot;. Người dùng
          sẽ không thể đăng nhập sau khi bị khóa.
        </p>
        <Form form={blockForm} layout="vertical" onFinish={submitBlock}>
          <Form.Item
            name="reason"
            label="Lý do khóa"
            rules={[{ required: true, message: 'Vui lòng nhập lý do khóa tài khoản' }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập lý do khóa tài khoản…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset-password modal */}
      <Modal
        title="Đặt lại mật khẩu"
        open={!!pwUser}
        onCancel={() => setPwUser(null)}
        onOk={() => pwForm.submit()}
        confirmLoading={pwLoading}
        okText="Đặt lại"
        cancelText="Hủy"
        destroyOnClose
      >
        <p style={{ color: 'var(--vxn-fg-3)', marginTop: 0 }}>
          Đặt lại mật khẩu cho &quot;{pwUser?.fullName || pwUser?.email}&quot;.
        </p>
        <Form form={pwForm} layout="vertical" onFinish={submitPw}>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ───────── Detail body (real user + booking stats) ───────── */
const PS_TONE = {
  paid: 'green',
  pending: 'orange',
  cancelled: 'red',
  refunded: 'purple',
};

function Row({ label, children }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: '10px 0',
        borderBottom: '1px solid var(--vxn-border-muted)',
      }}
    >
      <div
        style={{
          width: 160,
          flexShrink: 0,
          font: '500 13px var(--font-display)',
          color: 'var(--vxn-fg-4)',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, font: '400 13.5px var(--font-display)', color: 'var(--vxn-fg-1)' }}>
        {children || '—'}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--vxn-bg-soft)',
        border: '1px solid var(--vxn-border-muted)',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{label}</div>
      <div style={{ font: '700 20px var(--font-display)', color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function DetailBody({ data }) {
  const { user, stats, recentBookings } = data;
  const t = TIER[user.loyaltyTier] || TIER.bronze;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '4px 0 18px' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: t.solid,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            font: '600 18px var(--font-display)',
          }}
        >
          {initials(user.fullName || user.email)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>
            {user.fullName || 'Chưa đặt tên'}
          </div>
          <div
            style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-4)', marginTop: 2 }}
          >
            {user.email} · {user.phone || 'chưa có SĐT'}
          </div>
        </div>
        <TierBadge tier={user.loyaltyTier} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <MiniStat label="Tổng đặt vé" value={stats.totalBookings} color="var(--vxn-teal-700)" />
        <MiniStat label="Đã thanh toán" value={stats.paidBookings} color="#15803D" />
        <MiniStat label="Đã hủy" value={stats.cancelledBookings} color="#B91C1C" />
        <MiniStat label="Tổng chi tiêu" value={MoneyVND(stats.totalSpent)} color="var(--vxn-ink)" />
      </div>

      <Row label="Vai trò">{user.role}</Row>
      <Row label="Điểm tích lũy">
        {Number(user.totalPoints || 0).toLocaleString('vi-VN')} điểm
      </Row>
      <Row label="Ngày đăng ký">{dayjs(user.createdAt).format('DD/MM/YYYY HH:mm')}</Row>
      <Row label="Đăng nhập gần nhất">
        {user.lastLogin ? dayjs(user.lastLogin).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập'}
      </Row>
      {user.isBlocked && (
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
          <strong>Đã khóa:</strong> {user.blockedReason || 'Không có lý do'}
          {user.blockedAt ? ` · ${dayjs(user.blockedAt).format('DD/MM/YYYY HH:mm')}` : ''}
        </div>
      )}

      {recentBookings && recentBookings.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              font: '600 14px var(--font-display)',
              color: 'var(--vxn-ink)',
              marginBottom: 10,
            }}
          >
            Đặt vé gần đây
          </div>
          <Table
            columns={[
              { key: 'code', label: 'Mã vé', render: (b) => b.bookingCode },
              {
                key: 'route',
                label: 'Tuyến',
                render: (b) => b.tripId?.routeId?.routeName || '—',
              },
              {
                key: 'seats',
                label: 'Ghế',
                align: 'center',
                render: (b) => b.seats?.length || 0,
              },
              {
                key: 'price',
                label: 'Tổng tiền',
                align: 'right',
                render: (b) => MoneyVND(b.finalPrice),
              },
              {
                key: 'ps',
                label: 'Trạng thái',
                render: (b) => <Tag color={PS_TONE[b.paymentStatus]}>{b.paymentStatus}</Tag>,
              },
            ]}
            rows={recentBookings}
            dense
          />
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
