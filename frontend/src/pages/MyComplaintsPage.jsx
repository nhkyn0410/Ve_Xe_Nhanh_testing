import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Empty, Input, Modal, Rate, Spin, message } from 'antd';
import { PlusOutlined, PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import { accountBreadcrumbItem } from '../components/customer/accountMenu';
import useAuthStore from '../store/authStore';
import {
  getMyComplaints,
  getComplaintById,
  addNote,
  addSatisfactionRating,
  getCategoryLabel,
  getPriorityLabel,
} from '../services/complaintApi';
import CreateComplaintModal from '../components/CreateComplaintModal';
import { getOperatorDisplayName } from '../utils/operatorDisplay';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { TextArea } = Input;

// ============================================================================
// Constants & helpers
// ============================================================================

const CHIP = {
  open: { bg: '#E1F0F1', fg: '#036672', label: 'Mới mở' },
  in_progress: { bg: '#FFF1DC', fg: '#B7791F', label: 'Đang xử lý' },
  resolved: { bg: '#D8F5E6', fg: '#0F8458', label: 'Đã giải quyết' },
  closed: { bg: '#E9EBEF', fg: '#5B6470', label: 'Đã đóng' },
  rejected: { bg: '#FDE5E5', fg: '#C0392B', label: 'Từ chối' },
};

const DOT_COLOR = {
  customer: '#036672',
  admin: '#0F8458',
  danger: '#DC2626',
  neutral: '#94A3B8',
};

const fmtDateTime = (d) => (d ? dayjs(d).format('DD/MM/YYYY, HH:mm') : '');
const fmtShort = (d) => (d ? dayjs(d).format('DD/MM') : '');

const resolveOperator = (c) => {
  const op = c?.operatorId;
  if (op && typeof op === 'object') {
    return getOperatorDisplayName(op, op.fullName || null);
  }
  const fromBooking = c?.bookingId?.operatorId;
  if (fromBooking && typeof fromBooking === 'object') {
    return getOperatorDisplayName(fromBooking, null);
  }
  return null;
};

const resolveTrip = (c) => {
  const t = c?.tripId;
  if (!t || typeof t !== 'object') return null;
  const r = t.route;
  if (r && typeof r === 'object') {
    if (r.origin && r.destination) return `${r.origin} → ${r.destination}`;
    if (r.from && r.to) return `${r.from} → ${r.to}`;
    if (r.name) return r.name;
  }
  if (t.from && t.to) return `${t.from} → ${t.to}`;
  return null;
};

// Refs that some endpoints return populated (objects) and others return
// as raw ObjectIds. When merging a leaner response onto richer state,
// keep whichever copy is the populated object so display data (e.g. the
// related booking code) does not vanish after a note/rating action.
const POPULATED_REFS = ['bookingId', 'assignedTo', 'resolvedBy', 'userId'];

const mergeComplaint = (prev, next) => {
  if (!prev) return next;
  if (!next) return prev;
  const merged = { ...prev, ...next };
  POPULATED_REFS.forEach((k) => {
    const p = prev[k];
    const n = next[k];
    if (p && typeof p === 'object' && (!n || typeof n !== 'object')) {
      merged[k] = p;
    }
  });
  return merged;
};

/** Build an ordered processing timeline from a complaint document. */
const buildTimeline = (c, meName) => {
  if (!c) return [];
  const ev = [];
  ev.push({
    date: fmtDateTime(c.createdAt),
    body: 'Bạn đã tạo khiếu nại',
    by: meName || 'Khách hàng',
    kind: 'customer',
  });
  if (c.assignedTo) {
    ev.push({
      date: c.assignedAt ? fmtDateTime(c.assignedAt) : null,
      body: 'CSKH tiếp nhận và bắt đầu xử lý',
      by: `${c.assignedTo.fullName || 'CSKH'} · VXN`,
      kind: 'admin',
    });
  }
  (c.notes || []).forEach((n) => {
    const isCustomer = n.addedByRole === 'customer';
    ev.push({
      date: fmtDateTime(n.createdAt),
      body: n.content,
      by:
        n.addedBy?.fullName ||
        (isCustomer ? meName || 'Bạn' : 'CSKH · VXN'),
      kind: isCustomer ? 'customer' : 'admin',
    });
  });
  if (c.resolvedAt || (c.status === 'resolved' && c.resolution)) {
    ev.push({
      date: c.resolvedAt ? fmtDateTime(c.resolvedAt) : null,
      body: c.resolution
        ? `Đã giải quyết: ${c.resolution}`
        : 'Khiếu nại đã được giải quyết',
      by: c.resolvedBy?.fullName ? `${c.resolvedBy.fullName} · VXN` : null,
      kind: 'admin',
    });
  }
  if (c.status === 'rejected') {
    ev.push({
      date: c.rejectedAt ? fmtDateTime(c.rejectedAt) : null,
      body: c.rejectionReason
        ? `Khiếu nại bị từ chối: ${c.rejectionReason}`
        : 'Khiếu nại bị từ chối',
      by: null,
      kind: 'danger',
    });
  }
  if (c.closedAt) {
    ev.push({
      date: fmtDateTime(c.closedAt),
      body: 'Khiếu nại đã đóng',
      by: null,
      kind: 'neutral',
    });
  }
  if (c.satisfactionRating) {
    ev.push({
      date: null,
      body: `Bạn đã đánh giá ${c.satisfactionRating}/5${
        c.satisfactionFeedback ? ` — “${c.satisfactionFeedback}”` : ''
      }`,
      by: meName || 'Bạn',
      kind: 'customer',
    });
  }
  if (c.status === 'resolved' && !c.satisfactionRating) {
    ev.push({
      date: 'Đang chờ',
      body: 'Chờ bạn xác nhận giải pháp',
      by: null,
      kind: 'pending',
      pending: true,
    });
  }
  return ev;
};

// ============================================================================
// Subcomponents
// ============================================================================

const ComplaintChip = ({ status, size = 'sm' }) => {
  const cfg = CHIP[status] || CHIP.open;
  const lg = size === 'lg';
  return (
    <span
      className="inline-flex items-center rounded-full font-medium"
      style={{
        gap: 6,
        padding: lg ? '6px 14px' : '4px 10px',
        background: cfg.bg,
        color: cfg.fg,
        fontSize: lg ? 13 : 11,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: cfg.fg,
        }}
      />
      {cfg.label}
    </span>
  );
};

const ListCard = ({ complaint, active, onSelect }) => {
  const op = resolveOperator(complaint);
  const sub = [op, fmtShort(complaint.createdAt)].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      onClick={onSelect}
      className="block w-full rounded-xl border bg-white p-4 text-left transition"
      style={{
        borderColor: active ? '#036672' : 'var(--vxn-border, #E5E7EB)',
        boxShadow: active ? '0 8px 20px -8px rgba(0,100,129,.18)' : 'none',
      }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-vxn-fg-4">
          #{complaint.ticketNumber}
        </span>
        <ComplaintChip status={complaint.status} />
      </div>
      <div className="text-[14px] font-medium leading-snug text-vxn-ink line-clamp-2">
        {complaint.subject}
      </div>
      {sub && (
        <div className="mt-1 text-[12px] text-vxn-fg-5">{sub}</div>
      )}
    </button>
  );
};

const InfoCell = ({ label, value }) => (
  <div>
    <div className="text-[10px] font-medium tracking-[0.08em] text-vxn-fg-5">
      {label}
    </div>
    <div className="mt-1 text-[14px] font-medium text-vxn-ink">{value}</div>
  </div>
);

const TimelineRow = ({ ev, last }) => {
  const dotColor = ev.pending ? '#fff' : DOT_COLOR[ev.kind] || DOT_COLOR.admin;
  const dotBorder = ev.pending
    ? '#B7BCC6'
    : DOT_COLOR[ev.kind] || DOT_COLOR.admin;
  return (
    <div className="relative" style={{ paddingBottom: last ? 0 : 14 }}>
      <span
        style={{
          position: 'absolute',
          left: -20,
          top: 4,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: dotColor,
          border: `2px solid ${dotBorder}`,
        }}
      />
      {ev.date && (
        <div className="text-[12px] font-medium text-vxn-fg-5">{ev.date}</div>
      )}
      <div className="mt-0.5 text-[14px] font-medium leading-relaxed text-vxn-ink">
        {ev.body}
      </div>
      {ev.by && (
        <div className="mt-0.5 text-[12px] text-vxn-fg-5">{ev.by}</div>
      )}
    </div>
  );
};

// ============================================================================
// Main page
// ============================================================================

const MyComplaintsPage = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { user } = useAuthStore();

  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(routeId || null);
  const [detail, setDetail] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [sendingNote, setSendingNote] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const meName = user?.fullName || user?.name;

  const fetchList = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await getMyComplaints({
        page: 1,
        limit: 50,
        sort: '-createdAt',
      });
      if (res?.status === 'success') {
        setList(res.data || []);
        return res.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching complaints:', error);
      message.error(error?.message || 'Không thể tải danh sách khiếu nại');
      return [];
    } finally {
      setListLoading(false);
    }
  }, []);

  // Initial list load
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Keep selection in sync with the URL param
  useEffect(() => {
    if (routeId) setSelectedId(routeId);
  }, [routeId]);

  // Auto-select the first complaint when nothing is chosen
  useEffect(() => {
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0]._id);
    }
  }, [list, selectedId]);

  // Resolve detail whenever the selected complaint changes.
  // The customer list endpoint already returns full documents (notes,
  // attachments, populated bookingId). We seed from it for an instant
  // render, then best-effort enrich via getComplaintById — that endpoint
  // currently has a backend Operator-populate bug, so we fall back
  // silently to the (complete) list data rather than blocking the UI.
  // Seed the detail panel from the (complete) list document. Keyed on
  // both selectedId and list so a deep-link arriving before the list
  // loads still renders once the data is in. The guard keeps any
  // enriched/merged detail from being clobbered when the list is patched.
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetail((prev) =>
      prev && prev._id === selectedId
        ? prev
        : list.find((c) => c._id === selectedId) || prev || null
    );
  }, [selectedId, list]);

  // Best-effort enrichment via getComplaintById. That endpoint currently
  // has a backend Operator-populate bug, so we fall back silently to the
  // (complete) list data rather than blocking the UI. Merged over the
  // seeded detail so populated refs are preserved.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getComplaintById(selectedId);
        if (!cancelled && res?.status === 'success' && res.data) {
          setDetail((prev) => mergeComplaint(prev, res.data));
        }
      } catch (err) {
        console.warn(
          'Complaint detail enrichment failed; using list data:',
          err
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleSelect = (id) => {
    if (id === selectedId) return;
    setNoteText('');
    setSelectedId(id);
    navigate(`/complaints/${id}`, { replace: false });
  };

  const patchListItem = (updated) => {
    if (!updated?._id) return;
    setList((prev) =>
      prev.map((c) =>
        c._id === updated._id ? mergeComplaint(c, updated) : c
      )
    );
  };

  const handleSendNote = async () => {
    const content = noteText.trim();
    if (content.length < 5) {
      message.warning('Phản hồi phải có ít nhất 5 ký tự');
      return;
    }
    try {
      setSendingNote(true);
      const res = await addNote(selectedId, { content });
      if (res?.status === 'success') {
        setDetail((prev) => mergeComplaint(prev, res.data));
        patchListItem(res.data);
        setNoteText('');
        message.success('Đã gửi phản hồi');
      }
    } catch (error) {
      console.error('Error sending note:', error);
      message.error(error?.message || 'Không thể gửi phản hồi');
    } finally {
      setSendingNote(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingValue) {
      message.warning('Vui lòng chọn số sao');
      return;
    }
    try {
      setRatingSubmitting(true);
      const res = await addSatisfactionRating(selectedId, {
        rating: ratingValue,
        feedback: ratingFeedback.trim(),
      });
      if (res?.status === 'success') {
        setDetail((prev) => mergeComplaint(prev, res.data));
        patchListItem(res.data);
        setRatingOpen(false);
        setRatingValue(0);
        setRatingFeedback('');
        message.success('Cảm ơn bạn đã xác nhận giải pháp!');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      message.error(error?.message || 'Không thể gửi đánh giá');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleCreated = async (created) => {
    setCreateOpen(false);
    const fresh = await fetchList();
    const newId = created?._id || fresh?.[0]?._id;
    if (newId) {
      setSelectedId(newId);
      navigate(`/complaints/${newId}`, { replace: true });
    }
  };

  const timeline = useMemo(
    () => buildTimeline(detail, meName),
    [detail, meName]
  );

  const infoPairs = useMemo(() => {
    if (!detail) return [];
    const pairs = [];
    const op = resolveOperator(detail);
    const trip = resolveTrip(detail);
    if (op) pairs.push(['NHÀ XE', op]);
    if (trip) pairs.push(['CHUYẾN', trip]);
    pairs.push(['DANH MỤC', getCategoryLabel(detail.category)]);
    pairs.push(['MỨC ĐỘ', getPriorityLabel(detail.priority)]);
    return pairs;
  }, [detail]);

  const canReply =
    detail && detail.status !== 'closed' && detail.status !== 'rejected';
  const canAccept =
    detail &&
    (detail.status === 'resolved' || detail.status === 'closed') &&
    !detail.satisfactionRating;

  return (
    <CustomerShell activeKey="complaints">
      {/* Header */}
      <div className="border-b border-vxn-border bg-white">
        <div className="px-4 pt-6 lg:px-8">
          <CustomerBreadcrumb
            className="mb-3"
            items={[
              accountBreadcrumbItem(),
              { label: 'Khiếu nại' },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-3 pb-5">
            <div>
              <h1 className="m-0 text-[26px] font-semibold tracking-tight text-vxn-ink sm:text-[28px]">
                Khiếu nại của tôi
              </h1>
              <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                Theo dõi xử lý phản hồi, gửi khiếu nại mới khi cần.
              </p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
              className="!h-9 !rounded-lg !text-[13px] !font-medium"
              style={{ background: '#036672', borderColor: '#036672' }}
            >
              Gửi khiếu nại
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          {listLoading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Spin size="large" />
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-vxn-border bg-white px-6 py-16 shadow-sm">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-[13px] text-vxn-fg-4">
                    Bạn chưa có khiếu nại nào. Khi gặp vấn đề với chuyến đi,
                    hãy gửi khiếu nại để được hỗ trợ.
                  </span>
                }
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateOpen(true)}
                  style={{ background: '#036672', borderColor: '#036672' }}
                >
                  Gửi khiếu nại
                </Button>
              </Empty>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
              {/* Master list */}
              <div className="flex flex-col gap-2.5">
                {list.map((c) => (
                  <ListCard
                    key={c._id}
                    complaint={c}
                    active={c._id === selectedId}
                    onSelect={() => handleSelect(c._id)}
                  />
                ))}
              </div>

              {/* Detail */}
              <div className="flex flex-col gap-4">
                {!detail ? (
                  <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-vxn-border bg-white shadow-sm">
                    <Spin size="large" />
                  </div>
                ) : (
                  <>
                    {/* Summary card */}
                    <div className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm">
                      <div className="mb-3.5 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="m-0 text-[22px] font-semibold text-vxn-ink">
                            {detail.subject}
                          </h2>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-vxn-fg-3">
                            <span className="font-mono">
                              #{detail.ticketNumber}
                            </span>
                            <span className="text-vxn-border-strong">·</span>
                            <span>Tạo lúc {fmtDateTime(detail.createdAt)}</span>
                            {detail.bookingId?.bookingCode && (
                              <>
                                <span className="text-vxn-border-strong">
                                  ·
                                </span>
                                <span>
                                  Liên quan vé{' '}
                                  <strong className="font-mono text-vxn-ink">
                                    {detail.bookingId.bookingCode}
                                  </strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ComplaintChip status={detail.status} size="lg" />
                      </div>

                      <div
                        className="grid gap-4 border-y border-vxn-border py-3.5"
                        style={{
                          gridTemplateColumns: `repeat(${Math.max(
                            infoPairs.length,
                            1
                          )}, minmax(0,1fr))`,
                        }}
                      >
                        {infoPairs.map(([l, v]) => (
                          <InfoCell key={l} label={l} value={v} />
                        ))}
                      </div>

                      <p className="m-0 mt-4 whitespace-pre-line text-[14px] leading-relaxed text-vxn-fg-2">
                        {detail.description}
                      </p>

                      {detail.attachments?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {detail.attachments.map((f, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-vxn-border bg-vxn-bg-soft px-2.5 py-1 text-[12px] text-vxn-fg-3"
                            >
                              <PaperClipOutlined />
                              {f.fileName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timeline + reply */}
                    <div className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm">
                      <h3 className="m-0 mb-3.5 text-[16px] font-semibold text-vxn-ink">
                        Dòng thời gian xử lý
                      </h3>
                      <div className="relative flex flex-col pl-5">
                        <span
                          style={{
                            position: 'absolute',
                            left: 7,
                            top: 8,
                            bottom: 8,
                            width: 2,
                            background: 'var(--vxn-bg-fog, #EEF1F3)',
                          }}
                        />
                        {timeline.map((ev, i) => (
                          <TimelineRow
                            key={i}
                            ev={ev}
                            last={i === timeline.length - 1}
                          />
                        ))}
                      </div>

                      {canReply ? (
                        <div className="mt-5 rounded-xl border border-vxn-border p-4">
                          <div className="mb-2 text-[13px] font-medium text-vxn-fg-3">
                            Phản hồi của bạn
                          </div>
                          <TextArea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Nhập phản hồi tại đây..."
                            autoSize={{ minRows: 3, maxRows: 6 }}
                            maxLength={1000}
                          />
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              type="primary"
                              loading={sendingNote}
                              onClick={handleSendNote}
                              className="!rounded-lg"
                              style={{
                                background: '#036672',
                                borderColor: '#036672',
                              }}
                            >
                              Gửi phản hồi
                            </Button>
                            {canAccept && (
                              <Button
                                onClick={() => setRatingOpen(true)}
                                className="!rounded-lg !font-medium !text-white"
                                style={{
                                  background: '#E89B26',
                                  borderColor: '#E89B26',
                                }}
                              >
                                Chấp nhận giải pháp
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-xl bg-vxn-bg-soft px-4 py-3 text-[13px] text-vxn-fg-4">
                          Khiếu nại đã{' '}
                          {detail.status === 'closed' ? 'đóng' : 'bị từ chối'} —
                          không thể thêm phản hồi mới.
                          {canAccept && (
                            <Button
                              size="small"
                              onClick={() => setRatingOpen(true)}
                              className="!ml-3 !rounded-lg !font-medium !text-white"
                              style={{
                                background: '#E89B26',
                                borderColor: '#E89B26',
                              }}
                            >
                              Đánh giá
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create complaint modal */}
      <CreateComplaintModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSuccess={handleCreated}
      />

      {/* Accept-solution / rating modal */}
      <Modal
        title="Xác nhận & đánh giá giải pháp"
        open={ratingOpen}
        onCancel={() => setRatingOpen(false)}
        okText="Gửi đánh giá"
        cancelText="Để sau"
        confirmLoading={ratingSubmitting}
        onOk={handleSubmitRating}
        okButtonProps={{
          style: { background: '#036672', borderColor: '#036672' },
        }}
        destroyOnHidden
      >
        <p className="mb-2 text-[13px] text-vxn-fg-3">
          Bạn hài lòng thế nào với cách xử lý khiếu nại này?
        </p>
        <Rate
          value={ratingValue}
          onChange={setRatingValue}
          style={{ fontSize: 30 }}
        />
        <div className="mt-4">
          <div className="mb-1.5 text-[13px] font-medium text-vxn-fg-3">
            Nhận xét (tùy chọn)
          </div>
          <TextArea
            value={ratingFeedback}
            onChange={(e) => setRatingFeedback(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về việc xử lý khiếu nại..."
            autoSize={{ minRows: 3, maxRows: 5 }}
            maxLength={500}
          />
        </div>
      </Modal>
    </CustomerShell>
  );
};

export default MyComplaintsPage;
