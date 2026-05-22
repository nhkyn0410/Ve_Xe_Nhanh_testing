/**
 * Quản lý khiếu nại — System-admin portal.
 *
 * Faithful port of the design package's `admin-complaints.jsx` master–detail
 * view, wired to REAL backend data (`/admin/complaints` +
 * `/admin/complaints/statistics` + status / priority / assign / resolve)
 * instead of the design's hard-coded `COMPLAINTS` sample array.
 *
 * Honesty-over-pixel-match substitutions (design → truthful equivalent):
 *  • KPI #3 "Đã giải quyết tuần này 142 · hài lòng 4.6/5" → real all-time
 *    `resolved` count with the real satisfaction average / rating count
 *    (the statistics endpoint is not windowed by week, so the label is
 *    corrected to avoid implying a 7-day figure).
 *  • KPI #4 fabricated "−12% so với tháng trước" delta dropped — real
 *    `avgResolutionTime` (ms) is formatted truthfully; no trend data exists.
 *  • KPI #5 "SLA vi phạm 3" → "Chưa phân công" (`stats.unassigned`). The
 *    Complaint model has NO SLA field, so an SLA-breach counter would be
 *    fabricated; unassigned is the genuine attention metric.
 *  • Hard-coded deltas on KPI #1/#2 removed; subs now carry real context.
 *  • Tabs: the design folds closed+rejected into one "Đóng" tab; the real
 *    enum keeps them distinct, so a separate truthful "Từ chối" tab is
 *    added and counts come from real `stats.byStatus`.
 *  • Detail "SLA còn lại" chip → "Thời gian xử lý" (age createdAt→now, or
 *    createdAt→resolvedAt once resolved) — a neutral, truthful duration with
 *    no fake breach colouring.
 *  • Detail body quote (fabricated lost-luggage story) → the real
 *    `description`. Internal-notes list renders the real `notes[]` (role +
 *    Internal badge) instead of the design's three invented notes; the
 *    addedBy user is not populated by the API, so the role is shown.
 *  • Header CTA "Xuất báo cáo / Tạo khiếu nại" → "Làm mới". There is no
 *    export endpoint and admins do not author complaints (customers do).
 *  • Footer "Thêm note" dropped (no admin add-note endpoint). "Phân công"
 *    → "Nhận xử lý" (assign to the signed-in admin via the real assign
 *    endpoint, which also moves open → in_progress). A real status Select
 *    is added so the core admin transitions are actually operable.
 *
 * Per the proven operator/admin redesign convention the page chrome uses the
 * VXN design system; AntD is retained only for the resolve modal/form/toasts
 * (which render in a portal outside the scoped `.vxn-admin` tokens).
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Form, Input, message } from 'antd';
import dayjs from 'dayjs';
import { adminComplaints } from '../../services/adminApi';
import useAdminAuthStore from '../../store/adminAuthStore';
import {
  PageHeader,
  Btn,
  Card,
  Tabs,
  SearchInput,
  Select,
  Pager,
  KpiCard,
  Skeleton,
  EmptyState,
  VxnIcon,
  MoneyVND,
} from '../../components/admin/vxn';

const { TextArea } = Input;

const PAGE_SIZE = 20;

/* ───────── design taxonomy (verbatim — matches the real enums) ───────── */
const CATEGORY = {
  booking: { label: 'Đặt vé', icon: 'ticket' },
  payment: { label: 'Thanh toán', icon: 'wallet' },
  service: { label: 'Dịch vụ', icon: 'sparkles' },
  driver: { label: 'Tài xế', icon: 'user-round' },
  vehicle: { label: 'Phương tiện', icon: 'bus' },
  refund: { label: 'Hoàn tiền', icon: 'undo-2' },
  technical: { label: 'Kỹ thuật', icon: 'cpu' },
  other: { label: 'Khác', icon: 'circle-help' },
};

const PRIORITY = {
  urgent: { label: 'Khẩn cấp', bg: '#FEE2E2', fg: '#B91C1C' },
  high: { label: 'Cao', bg: '#FEF2E0', fg: '#B45309' },
  medium: { label: 'Trung bình', bg: '#FEF3C7', fg: '#92400E' },
  low: { label: 'Thấp', bg: 'var(--vxn-bg-mist)', fg: 'var(--vxn-fg-3)' },
};

const STATUS = {
  open: { label: 'Mới', fg: '#1D4ED8', dot: '#3B82F6' },
  in_progress: { label: 'Đang xử lý', fg: '#B45309', dot: '#F59E0B' },
  resolved: { label: 'Đã giải quyết', fg: '#15803D', dot: '#22C55E' },
  closed: { label: 'Đóng', fg: '#475569', dot: '#94A3B8' },
  rejected: { label: 'Từ chối', fg: '#B91C1C', dot: '#EF4444' },
};

const PRIORITY_OPTS = [
  { value: 'all', label: 'Mọi mức ưu tiên' },
  { value: 'urgent', label: 'Khẩn cấp' },
  { value: 'high', label: 'Cao' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'low', label: 'Thấp' },
];

const STATUS_OPTS = [
  { value: 'open', label: 'Trạng thái: Mới' },
  { value: 'in_progress', label: 'Trạng thái: Đang xử lý' },
  { value: 'resolved', label: 'Trạng thái: Đã giải quyết' },
  { value: 'closed', label: 'Trạng thái: Đóng' },
  { value: 'rejected', label: 'Trạng thái: Từ chối' },
];

/* ───────── small honest time helpers (no plugin / global side-effects) ── */
function relTime(d) {
  if (!d) return '—';
  const ms = Date.now() - new Date(d).getTime();
  if (ms < 0) return dayjs(d).format('DD/MM/YY');
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd} ngày trước`;
  return dayjs(d).format('DD/MM/YY');
}

function fmtDur(ms) {
  ms = Number(ms || 0);
  if (ms <= 0) return '—';
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${Math.max(1, m)} phút`;
  const h = ms / 3600000;
  if (h < 24) return `${h.toFixed(1).replace('.0', '')} giờ`;
  const dd = ms / 86400000;
  return `${dd.toFixed(1).replace('.0', '')} ngày`;
}

/* ───────── list row ───────── */
function ComplaintRow({ c, selected, onClick }) {
  const s = STATUS[c.status] || STATUS.open;
  const p = PRIORITY[c.priority] || PRIORITY.medium;
  const cat = CATEGORY[c.category] || CATEGORY.other;
  const operator = c.operatorId?.businessName;
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--vxn-border-muted)',
        borderLeft: '3px solid ' + (selected ? 'var(--vxn-teal-700)' : 'transparent'),
        background: selected ? 'rgba(0,100,129,0.04)' : '#fff',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 4,
            background: p.bg, color: p.fg,
            font: '600 11px var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}
        >
          {p.label}
        </span>
        <code style={{ font: '500 12px var(--font-mono, ui-monospace)', color: 'var(--vxn-fg-4)' }}>
          {c.ticketNumber}
        </code>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)',
          }}
        >
          <VxnIcon name={cat.icon} size={12} color="var(--vxn-fg-5)" />
          {cat.label}
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            font: '500 12px var(--font-display)', color: s.fg,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
          {s.label}
        </span>
      </div>
      <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)', marginBottom: 4 }}>
        {c.subject}
      </div>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', gap: 12,
          font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-4)',
        }}
      >
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong style={{ color: 'var(--vxn-fg-2)', fontWeight: 500 }}>
            {c.userId?.fullName || c.userEmail || 'Khách hàng'}
          </strong>
          {operator && <> · {operator}</>}
        </span>
        <span style={{ whiteSpace: 'nowrap' }}>
          {c.assignedTo
            ? <>👤 {c.assignedTo.fullName || c.assignedTo.email}</>
            : <span style={{ color: '#B45309' }}>Chưa phân công</span>}
          <span style={{ marginLeft: 12 }}>· {relTime(c.updatedAt || c.createdAt)}</span>
        </span>
      </div>
    </div>
  );
}

/* ───────── internal note ───────── */
function Note({ note }) {
  const internal = !!note.isInternal;
  const roleLabel = note.addedByRole === 'admin' ? 'Quản trị viên' : 'Khách hàng';
  return (
    <div
      style={{
        background: internal ? 'var(--vxn-warning-bg)' : '#F0F9FF',
        border: '1px solid ' + (internal ? '#FDE68A' : '#BAE6FD'),
        borderRadius: 8, padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          font: '500 12px var(--font-display)', marginBottom: 6,
        }}
      >
        <strong style={{ color: 'var(--vxn-ink)', fontWeight: 600 }}>{roleLabel}</strong>
        <span style={{ flex: 1 }} />
        {internal && (
          <span
            style={{
              padding: '1px 7px', borderRadius: 4, background: '#FEF3C7', color: '#92400E',
              font: '600 10px var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
          >
            Internal
          </span>
        )}
        <span style={{ color: 'var(--vxn-fg-5)' }}>{relTime(note.createdAt)}</span>
      </div>
      <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.5 }}>
        {note.content}
      </div>
    </div>
  );
}

/* ───────── detail panel ───────── */
function ComplaintDetail({ c, adminId, onAssign, onChangeStatus, onResolve, busy }) {
  if (!c) {
    return (
      <div style={{ position: 'sticky', top: 93 }}>
        <Card padding={0}>
          <EmptyState
            icon="inbox"
            title="Chưa chọn khiếu nại"
            hint="Chọn một khiếu nại trong danh sách bên trái để xem chi tiết và xử lý."
          />
        </Card>
      </div>
    );
  }

  const s = STATUS[c.status] || STATUS.open;
  const p = PRIORITY[c.priority] || PRIORITY.medium;
  const cat = CATEGORY[c.category] || CATEGORY.other;
  const terminal = c.status === 'resolved' || c.status === 'closed' || c.status === 'rejected';
  const assignedToMe = c.assignedTo && adminId && String(c.assignedTo._id) === String(adminId);
  const endRef = c.resolvedAt || (terminal ? c.updatedAt : Date.now());
  const procMs = new Date(endRef).getTime() - new Date(c.createdAt).getTime();
  const amount = c.bookingId?.totalPrice;

  return (
    <div style={{ position: 'sticky', top: 93 }}>
      <Card padding={0}>
        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--vxn-border-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <code style={{ font: '600 13px var(--font-mono, ui-monospace)', color: 'var(--vxn-fg-4)' }}>
              {c.ticketNumber}
            </code>
            <span
              style={{
                padding: '2px 8px', borderRadius: 4, background: p.bg, color: p.fg,
                font: '600 11px var(--font-display)', textTransform: 'uppercase',
              }}
            >
              {p.label}
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                font: '500 12px var(--font-display)', color: s.fg,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
              {s.label}
            </span>
          </div>
          <div style={{ font: '600 17px var(--font-display)', color: 'var(--vxn-ink)', lineHeight: 1.35 }}>
            {c.subject}
          </div>
        </div>

        {/* facts */}
        <dl
          style={{
            margin: 0, padding: '14px 24px',
            display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 10, columnGap: 16,
            font: '400 13px var(--font-display)',
          }}
        >
          <dt style={{ color: 'var(--vxn-fg-5)' }}>Khách hàng</dt>
          <dd style={{ margin: 0, color: 'var(--vxn-ink)', fontWeight: 500 }}>
            {c.userId?.fullName || 'N/A'}
          </dd>
          <dt style={{ color: 'var(--vxn-fg-5)' }}>Liên hệ</dt>
          <dd style={{ margin: 0, color: 'var(--vxn-fg-2)' }}>
            {c.userEmail}
            {c.userPhone ? ` · ${c.userPhone}` : ''}
          </dd>
          {c.operatorId?.businessName && (
            <>
              <dt style={{ color: 'var(--vxn-fg-5)' }}>Nhà xe</dt>
              <dd style={{ margin: 0, color: 'var(--vxn-fg-2)' }}>{c.operatorId.businessName}</dd>
            </>
          )}
          <dt style={{ color: 'var(--vxn-fg-5)' }}>Phân loại</dt>
          <dd style={{ margin: 0, color: 'var(--vxn-fg-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <VxnIcon name={cat.icon} size={14} color="var(--vxn-fg-4)" />
            {cat.label}
          </dd>
          <dt style={{ color: 'var(--vxn-fg-5)' }}>Phụ trách</dt>
          <dd style={{ margin: 0, color: 'var(--vxn-fg-2)' }}>
            {c.assignedTo ? (
              c.assignedTo.fullName || c.assignedTo.email
            ) : (
              <span style={{ color: '#B45309' }}>
                Chưa phân công
                {!terminal && adminId && (
                  <>
                    {' · '}
                    <span
                      onClick={busy ? undefined : onAssign}
                      style={{
                        color: 'var(--vxn-teal-700)',
                        cursor: busy ? 'default' : 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Nhận xử lý
                    </span>
                  </>
                )}
              </span>
            )}
          </dd>
          <dt style={{ color: 'var(--vxn-fg-5)' }}>Tạo lúc</dt>
          <dd style={{ margin: 0, color: 'var(--vxn-fg-2)' }}>
            {dayjs(c.createdAt).format('DD/MM/YY HH:mm')}
          </dd>
          {c.bookingId?.bookingCode && (
            <>
              <dt style={{ color: 'var(--vxn-fg-5)' }}>Mã đặt vé</dt>
              <dd style={{ margin: 0, color: 'var(--vxn-fg-2)' }}>
                <code style={{ font: '500 12.5px var(--font-mono, ui-monospace)' }}>
                  {c.bookingId.bookingCode}
                </code>
              </dd>
            </>
          )}
          {amount != null && (
            <>
              <dt style={{ color: 'var(--vxn-fg-5)' }}>Số tiền liên quan</dt>
              <dd style={{ margin: 0, color: 'var(--vxn-ink)', fontWeight: 600 }}>{MoneyVND(amount)}</dd>
            </>
          )}
          <dt style={{ color: 'var(--vxn-fg-5)' }}>Thời gian xử lý</dt>
          <dd style={{ margin: 0 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 10px', borderRadius: 999,
                background: 'var(--vxn-bg-mist)', color: 'var(--vxn-fg-3)',
                font: '600 12px var(--font-display)',
              }}
            >
              <VxnIcon name="clock" size={12} color="var(--vxn-fg-4)" />
              {fmtDur(procMs)}
              {!terminal && ' (đang mở)'}
            </span>
          </dd>
        </dl>

        {/* description */}
        <div style={{ padding: '0 24px 16px' }}>
          <div
            style={{
              background: 'var(--vxn-bg-mist)', borderRadius: 8, padding: 14,
              font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)',
              lineHeight: 1.55, whiteSpace: 'pre-wrap',
            }}
          >
            {c.description}
          </div>
        </div>

        {/* resolution */}
        {c.resolution && (
          <div style={{ padding: '0 24px 16px' }}>
            <div
              style={{
                background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 14,
              }}
            >
              <div
                style={{
                  font: '600 12px var(--font-display)', letterSpacing: '0.06em',
                  color: '#15803D', textTransform: 'uppercase', marginBottom: 6,
                }}
              >
                Phương án giải quyết
              </div>
              <div
                style={{
                  font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)',
                  lineHeight: 1.55, whiteSpace: 'pre-wrap',
                }}
              >
                {c.resolution}
              </div>
              {c.resolvedAt && (
                <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 8 }}>
                  Giải quyết lúc {dayjs(c.resolvedAt).format('DD/MM/YY HH:mm')}
                  {c.resolvedBy?.fullName ? ` · ${c.resolvedBy.fullName}` : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {/* internal notes */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--vxn-border-muted)' }}>
          <div
            style={{
              font: '600 12px var(--font-display)', letterSpacing: '0.08em',
              color: 'var(--vxn-fg-5)', textTransform: 'uppercase', marginBottom: 12,
            }}
          >
            Ghi chú nội bộ · {c.notes?.length || 0}
          </div>
          {c.notes && c.notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {c.notes.map((n, i) => (
                <Note key={n._id || i} note={n} />
              ))}
            </div>
          ) : (
            <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)', fontStyle: 'italic' }}>
              Chưa có ghi chú nào cho khiếu nại này.
            </div>
          )}
        </div>

        {/* actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--vxn-border-muted)',
            background: 'var(--vxn-bg-fog)',
            display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center',
          }}
        >
          <Select value={c.status} onChange={onChangeStatus} options={STATUS_OPTS} />
          {!terminal && adminId && !assignedToMe && (
            <Btn kind="ghost" icon="user-plus" onClick={busy ? undefined : onAssign}>
              Nhận xử lý
            </Btn>
          )}
          {!terminal && (
            <Btn kind="primary" icon="check" onClick={busy ? undefined : onResolve}>
              Đánh dấu đã giải quyết
            </Btn>
          )}
        </div>
      </Card>
    </div>
  );
}

const ComplaintManagementPage = () => {
  const { admin } = useAdminAuthStore();
  const adminId = admin?._id || admin?.id || null;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);

  const [tab, setTab] = useState('all');
  const [priority, setPriority] = useState('all');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');

  const [selId, setSelId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveForm] = Form.useForm();
  const [resolveLoading, setResolveLoading] = useState(false);

  const bump = useCallback(() => setReloadKey((k) => k + 1), []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQd(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // fetch list
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const params = { page, limit: PAGE_SIZE, sort: '-createdAt' };
        if (tab !== 'all') params.status = tab;
        if (priority !== 'all') params.priority = priority;
        if (qd) params.search = qd;

        const res = await adminComplaints.getComplaints(params);
        if (!alive) return;
        if (res?.status === 'success') {
          const list = Array.isArray(res.data) ? res.data : [];
          setRows(list);
          setTotal(res.pagination?.total ?? list.length);
        } else {
          setRows([]);
          setTotal(0);
        }
      } catch (e) {
        if (alive) {
          message.error(typeof e === 'string' ? e : 'Không thể tải danh sách khiếu nại');
          setRows([]);
          setTotal(0);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tab, priority, qd, page, reloadKey]);

  // fetch stats
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminComplaints.getStatistics();
        if (alive && res?.status === 'success') setStats(res.data);
      } catch {
        /* stats are non-critical chrome */
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  // keep a valid selection
  useEffect(() => {
    if (rows.length === 0) {
      setSelId(null);
      return;
    }
    setSelId((cur) => (cur && rows.some((r) => r._id === cur) ? cur : rows[0]._id));
  }, [rows]);

  const sel = useMemo(() => rows.find((r) => r._id === selId) || null, [rows, selId]);

  const byStatus = useMemo(() => {
    const m = {};
    (stats?.byStatus || []).forEach((s) => {
      m[s._id] = s.count;
    });
    return m;
  }, [stats]);

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'Tất cả', count: stats?.total },
      { key: 'open', label: 'Mới', count: byStatus.open },
      { key: 'in_progress', label: 'Đang xử lý', count: byStatus.in_progress },
      { key: 'resolved', label: 'Đã giải quyết', count: byStatus.resolved },
      { key: 'closed', label: 'Đã đóng', count: byStatus.closed },
      { key: 'rejected', label: 'Từ chối', count: byStatus.rejected },
    ],
    [stats, byStatus]
  );

  const changeTab = (k) => {
    setTab(k);
    setPage(1);
  };
  const changePriority = (v) => {
    setPriority(v);
    setPage(1);
  };
  const changeSearch = (v) => {
    setQ(v);
    setPage(1);
  };

  const assignToMe = async () => {
    if (!sel || !adminId) return;
    try {
      setBusy(true);
      const res = await adminComplaints.assignComplaint(sel._id, adminId);
      if (res?.status === 'success') {
        message.success('Đã nhận xử lý khiếu nại này');
        bump();
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Không thể phân công khiếu nại');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (next) => {
    if (!sel || next === sel.status) return;
    if (next === 'resolved') {
      openResolve();
      return;
    }
    try {
      setBusy(true);
      const res = await adminComplaints.updateStatus(sel._id, next);
      if (res?.status === 'success') {
        message.success('Đã cập nhật trạng thái');
        bump();
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Không thể cập nhật trạng thái');
    } finally {
      setBusy(false);
    }
  };

  const openResolve = () => {
    resolveForm.resetFields();
    setResolveOpen(true);
  };

  const submitResolve = async (values) => {
    if (!sel) return;
    try {
      setResolveLoading(true);
      const res = await adminComplaints.resolveComplaint(sel._id, values.resolution);
      if (res?.status === 'success') {
        message.success('Đã giải quyết khiếu nại');
        setResolveOpen(false);
        bump();
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Không thể giải quyết khiếu nại');
    } finally {
      setResolveLoading(false);
    }
  };

  const sat = stats?.satisfaction || { avgRating: 0, totalRatings: 0 };

  return (
    <div>
      <PageHeader
        title="Quản lý khiếu nại"
        description="Hỗ trợ và xử lý khiếu nại từ khách hàng — phân loại, giao việc, theo dõi tiến độ, ghi chú nội bộ."
        cta={
          <Btn kind="ghost" icon="refresh-cw" onClick={bump}>
            Làm mới
          </Btn>
        }
      />

      <div
        className="admin-grid"
        style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <KpiCard
          label="Mới"
          value={stats ? stats.open ?? 0 : '—'}
          delta={stats && stats.open > 0 ? 'cần tiếp nhận' : null}
          deltaTone="down"
          sub="chờ xử lý"
          icon="circle-alert"
          iconBg="#FEE2E2"
          accent="#EF4444"
        />
        <KpiCard
          label="Đang xử lý"
          value={stats ? stats.inProgress ?? 0 : '—'}
          sub="đang được xử lý"
          icon="hourglass"
          iconBg="#FEF3C7"
          accent="#F59E0B"
        />
        <KpiCard
          label="Đã giải quyết"
          value={stats ? stats.resolved ?? 0 : '—'}
          sub={
            sat.totalRatings > 0
              ? `hài lòng ${Number(sat.avgRating).toFixed(1)}/5 · ${sat.totalRatings} đánh giá`
              : 'chưa có đánh giá hài lòng'
          }
          icon="circle-check"
          iconBg="#DCFCE7"
          accent="#22C55E"
        />
        <KpiCard
          label="Thời gian xử lý TB"
          value={stats ? fmtDur(stats.avgResolutionTime) : '—'}
          sub="trên các ca đã xử lý"
          icon="clock"
          iconBg="#DBEAFE"
          accent="#3B82F6"
        />
        <KpiCard
          label="Chưa phân công"
          value={stats ? stats.unassigned ?? 0 : '—'}
          delta={stats && stats.unassigned > 0 ? 'cần phân công' : null}
          deltaTone="down"
          sub={stats ? `tổng ${Number(stats.total).toLocaleString('vi-VN')} khiếu nại` : ''}
          icon="triangle-alert"
          iconBg="#FED7AA"
          accent="#EA580C"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        {/* list */}
        <Card padding={0}>
          <Tabs tabs={tabs} active={tab} onChange={changeTab} />

          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--vxn-border-muted)',
              display: 'flex',
              gap: 10,
            }}
          >
            <SearchInput
              value={q}
              onChange={changeSearch}
              placeholder="Tìm theo mã, chủ đề, mô tả, email…"
            />
            <Select value={priority} onChange={changePriority} options={PRIORITY_OPTS} />
          </div>

          <div>
            {loading ? (
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} height={58} radius={8} />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="Không có khiếu nại"
                hint="Không tìm thấy khiếu nại nào khớp với bộ lọc hiện tại."
              />
            ) : (
              rows.map((c) => (
                <ComplaintRow
                  key={c._id}
                  c={c}
                  selected={sel?._id === c._id}
                  onClick={() => setSelId(c._id)}
                />
              ))
            )}
          </div>

          {!loading && rows.length > 0 && (
            <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
          )}
        </Card>

        {/* detail */}
        <ComplaintDetail
          c={sel}
          adminId={adminId}
          busy={busy}
          onAssign={assignToMe}
          onChangeStatus={changeStatus}
          onResolve={openResolve}
        />
      </div>

      {/* resolve modal — AntD (portal, outside scoped tokens) */}
      <Modal
        title="Giải quyết khiếu nại"
        open={resolveOpen}
        onCancel={() => setResolveOpen(false)}
        onOk={() => resolveForm.submit()}
        confirmLoading={resolveLoading}
        okText="Giải quyết"
        cancelText="Hủy"
        width={600}
      >
        {sel && (
          <p style={{ marginTop: 0, color: '#64748b' }}>
            <strong>{sel.ticketNumber}</strong> — {sel.subject}
          </p>
        )}
        <Form form={resolveForm} layout="vertical" onFinish={submitResolve}>
          <Form.Item
            name="resolution"
            label="Phương án giải quyết"
            rules={[{ required: true, message: 'Vui lòng nhập phương án giải quyết' }]}
          >
            <TextArea rows={6} placeholder="Mô tả chi tiết cách giải quyết khiếu nại…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ComplaintManagementPage;
