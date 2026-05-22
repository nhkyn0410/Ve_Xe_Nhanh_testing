/**
 * System-admin · Quản lý đánh giá — faithful VXN port of the "Trang admin hệ
 * thống" design package admin-reviews.jsx, wired to the real GET /admin/reviews
 * (+ /admin/reviews/statistics) and the real moderation endpoints
 * PUT /admin/reviews/:id/{publish,unpublish,clear-report} added for this
 * cross-operator moderation view.
 *
 * Honesty-over-pixel-match: the design rows are mock reviews. Rebuilt entirely
 * on the real Review model — real overall + detailed ratings, real
 * comment/images, real operator response, real isPublished/isReported flags.
 * The design's fabricated reviewer "tier" maps to the real User.loyaltyTier;
 * the "IMG" placeholders are replaced with the real uploaded photos; the
 * fabricated operator dropdown (no operator-list endpoint) is dropped; the
 * row action buttons now perform real moderation against the new endpoints
 * and the eye button opens a real detail dialog built from loaded data.
 */
import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { message, Modal } from 'antd';
import { adminReviews } from '../../services/adminApi';
import {
  PageHeader, Btn, Chip, Card, Pager, SearchInput, Select,
  KpiCard, Skeleton, VxnIcon,
} from '../../components/admin/vxn';

const PAGE_SIZE = 20;

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unanswered', label: 'Chưa phản hồi' },
  { key: 'reported', label: 'Bị báo cáo' },
  { key: 'unpublished', label: 'Chờ duyệt' },
];

const RATING_OPTIONS = [
  { value: 'all', label: 'Mọi mức sao' },
  { value: '5', label: '5 sao' },
  { value: '4', label: '4 sao' },
  { value: '3', label: '3 sao' },
  { value: '2', label: '2 sao' },
  { value: '1', label: '1 sao' },
];

const TIER = {
  platinum: { label: 'Platinum', tone: 'info' },
  gold: { label: 'Gold', tone: 'saffron' },
  silver: { label: 'Silver', tone: 'neutral' },
  bronze: { label: 'Bronze', tone: 'neutral' },
};

const num = (v) => Number(v || 0).toLocaleString('vi-VN');
const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

function Stars({ rating = 0 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{
            width: 14,
            height: 14,
            display: 'inline-block',
            color: s <= rating ? '#F59E0B' : '#E5E7EB',
            font: '600 16px monospace',
            lineHeight: '14px',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

const actBtn = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: '1px solid var(--vxn-border)',
  background: '#fff',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
};
const actBtnPrimary = { ...actBtn, background: '#15803D', border: '1px solid #15803D' };

function ReviewItem({ r, last, busy, onView, onPublish, onUnpublish, onClearReport }) {
  return (
    <div
      style={{
        padding: '20px 24px',
        borderBottom: last ? 'none' : '1px solid var(--vxn-border-muted)',
        display: 'grid',
        gridTemplateColumns: '48px 1fr auto',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--vxn-teal-700)',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          font: '600 14px var(--font-display)',
          overflow: 'hidden',
        }}
      >
        {r.user?.avatar ? (
          <img src={r.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials(r.user?.name)
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
            {r.user?.name || 'Khách ẩn danh'}
          </strong>
          {r.user?.tier && TIER[r.user.tier] && (
            <Chip tone={TIER[r.user.tier].tone}>{TIER[r.user.tier].label}</Chip>
          )}
          {!r.isPublished && (
            <span
              style={{
                padding: '1px 7px',
                borderRadius: 4,
                background: '#FEF3C7',
                color: '#92400E',
                font: '600 10.5px var(--font-display)',
                textTransform: 'uppercase',
              }}
            >
              Chờ duyệt
            </span>
          )}
          {r.isReported && (
            <span
              style={{
                padding: '1px 7px',
                borderRadius: 4,
                background: '#FEE2E2',
                color: '#B91C1C',
                font: '600 10.5px var(--font-display)',
                textTransform: 'uppercase',
              }}
            >
              Bị báo cáo
            </span>
          )}
        </div>
        <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
          {[r.route, r.operator, r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY') : null]
            .filter(Boolean)
            .join(' · ')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Stars rating={r.overallRating} />
          <span style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
            {Number(r.overallRating || 0).toFixed(1)}
          </span>
          <span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
            {[
              r.vehicleRating && `Xe ${r.vehicleRating}`,
              r.driverRating && `Tài xế ${r.driverRating}`,
              r.punctualityRating && `Đúng giờ ${r.punctualityRating}`,
              r.serviceRating && `Phục vụ ${r.serviceRating}`,
            ]
              .filter(Boolean)
              .map((s) => `· ${s} `)}
          </span>
        </div>

        {r.comment && (
          <div
            style={{
              font: '400 13.5px var(--font-display)',
              color: 'var(--vxn-fg-2)',
              marginTop: 10,
              lineHeight: 1.55,
            }}
          >
            {r.comment}
          </div>
        )}

        {r.images?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {r.images.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer">
                <img
                  src={src}
                  alt=""
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    objectFit: 'cover',
                    border: '1px solid var(--vxn-border)',
                    display: 'block',
                  }}
                />
              </a>
            ))}
          </div>
        )}

        {r.operatorResponse && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: 'var(--vxn-bg-mist)',
              borderLeft: '3px solid var(--vxn-teal-700)',
            }}
          >
            <div
              style={{
                font: '600 12px var(--font-display)',
                color: 'var(--vxn-teal-800)',
                marginBottom: 4,
              }}
            >
              ↳ {r.operator || 'Nhà xe'} phản hồi
            </div>
            <div
              style={{
                font: '400 13px var(--font-display)',
                color: 'var(--vxn-fg-2)',
                lineHeight: 1.55,
              }}
            >
              {r.operatorResponse}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <button style={actBtn} title="Xem chi tiết" onClick={() => onView(r)} disabled={busy}>
          <VxnIcon name="eye" size={16} style={{ opacity: 0.55 }} />
        </button>
        {!r.isPublished && (
          <button style={actBtnPrimary} title="Duyệt" onClick={() => onPublish(r)} disabled={busy}>
            <VxnIcon name="check" size={16} color="#fff" />
          </button>
        )}
        {r.isReported && (
          <button style={actBtn} title="Bỏ báo cáo" onClick={() => onClearReport(r)} disabled={busy}>
            <VxnIcon name="flag-off" size={16} style={{ opacity: 0.55 }} />
          </button>
        )}
        {r.isPublished && (
          <button style={actBtn} title="Ẩn" onClick={() => onUnpublish(r)} disabled={busy}>
            <VxnIcon name="eye-off" size={16} style={{ opacity: 0.55 }} />
          </button>
        )}
      </div>
    </div>
  );
}

const ReviewsPage = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('all');
  const [rating, setRating] = useState('all');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [exporting, setExporting] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [statsTick, setStatsTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setQd(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { setPage(1); }, [qd, tab, rating]);

  const buildParams = useCallback((overrides = {}) => {
    const p = { page, limit: PAGE_SIZE };
    if (tab !== 'all') p.tab = tab;
    if (rating !== 'all') p.rating = rating;
    if (qd) p.search = qd;
    return { ...p, ...overrides };
  }, [page, tab, rating, qd]);

  const [listTick, setListTick] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await adminReviews.getReviews(buildParams());
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
          message.error(typeof err === 'string' ? err : 'Không thể tải danh sách đánh giá');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [buildParams, listTick]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminReviews.getStatistics();
        if (alive && res?.status === 'success') setStats(res.data);
      } catch {
        /* KPI strip is non-critical */
      }
    })();
    return () => { alive = false; };
  }, [statsTick]);

  const refresh = () => {
    setListTick((n) => n + 1);
    setStatsTick((n) => n + 1);
  };

  const runAction = (r, fn, confirmText, okMessage) => {
    Modal.confirm({
      title: confirmText,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        setActingId(r._id);
        try {
          const res = await fn(r._id);
          if (res?.status === 'success') {
            message.success(res.message || okMessage);
            setDetail(null);
            refresh();
          } else {
            message.error(res?.message || 'Thao tác thất bại');
          }
        } catch (err) {
          message.error(typeof err === 'string' ? err : 'Thao tác thất bại');
        } finally {
          setActingId(null);
        }
      },
    });
  };

  const onPublish = (r) =>
    runAction(r, adminReviews.publish, `Duyệt & hiển thị đánh giá của ${r.user?.name || 'khách'}?`, 'Đã duyệt đánh giá');
  const onUnpublish = (r) =>
    runAction(r, adminReviews.unpublish, `Ẩn đánh giá của ${r.user?.name || 'khách'} khỏi hệ thống?`, 'Đã ẩn đánh giá');
  const onClearReport = (r) =>
    runAction(r, adminReviews.clearReport, 'Bỏ đánh dấu báo cáo cho đánh giá này?', 'Đã bỏ đánh dấu báo cáo');

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminReviews.getReviews(buildParams({ page: 1, limit: 1000 }));
      const list = res?.status === 'success' && Array.isArray(res.data) ? res.data : [];
      if (!list.length) {
        message.info('Không có đánh giá nào để xuất');
        return;
      }
      const esc = (c) => {
        const s = String(c == null ? '' : c);
        return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const head = [
        'Khách hàng', 'Hạng', 'Nhà xe', 'Tuyến', 'Ngày', 'Tổng điểm',
        'Xe', 'Tài xế', 'Đúng giờ', 'Phục vụ', 'Bình luận', 'Số ảnh',
        'Đã duyệt', 'Bị báo cáo', 'Phản hồi NX',
      ];
      const body = list.map((r) => [
        r.user?.name || '',
        TIER[r.user?.tier]?.label || '',
        r.operator || '',
        r.route || '',
        r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY') : '',
        r.overallRating ?? '',
        r.vehicleRating ?? '',
        r.driverRating ?? '',
        r.punctualityRating ?? '',
        r.serviceRating ?? '',
        r.comment || '',
        r.images?.length || 0,
        r.isPublished ? 'Có' : 'Không',
        r.isReported ? 'Có' : 'Không',
        r.operatorResponse ? 'Có' : 'Không',
      ]);
      const csv = `﻿${[head, ...body].map((row) => row.map(esc).join(',')).join('\r\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh-gia-vexenhanh-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success(`Đã xuất ${list.length} đánh giá`);
    } catch (err) {
      message.error(typeof err === 'string' ? err : 'Không thể xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  const tabCount = (key) => {
    if (!stats) return null;
    if (key === 'all') return stats.total;
    if (key === 'unanswered') return stats.needResponse;
    if (key === 'reported') return stats.reported;
    if (key === 'unpublished') return stats.unpublished;
    return null;
  };

  return (
    <div>
      <PageHeader
        title="Quản lý đánh giá"
        description="Đánh giá khách hàng để lại sau chuyến đi — duyệt nội dung, xử lý báo cáo, theo dõi phản hồi của nhà xe."
        cta={(
          <Btn kind="ghost" icon="download" onClick={handleExport} disabled={exporting || loading}>
            {exporting ? 'Đang xuất…' : 'Xuất CSV'}
          </Btn>
        )}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div
          className="admin-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}
        >
          {!stats ? (
            [0, 1, 2, 3].map((i) => <Card key={i} padding={20}><Skeleton height={84} /></Card>)
          ) : (
            <>
              <KpiCard label="Tổng đánh giá" value={num(stats.total)}
                sub="trên toàn hệ thống" icon="message-square" iconBg="#DBEAFE" accent="#2563EB" />
              <KpiCard label="Điểm TB hệ thống" value={Number(stats.avgRating || 0).toFixed(2)}
                sub="trên thang 5.00" icon="star" iconBg="#FEF3C7" accent="var(--vxn-saffron-600)" />
              <KpiCard label="Cần phản hồi" value={num(stats.needResponse)}
                sub="nhà xe chưa trả lời" icon="message-square" iconBg="#FEE2E2" accent="#B91C1C" />
              <KpiCard label="Bị báo cáo" value={num(stats.reported)}
                sub={`${num(stats.unpublished)} đang chờ duyệt`} icon="flag" iconBg="#FED7AA" accent="#EA580C" />
            </>
          )}
        </div>

        <Card title="Phân phối điểm" subtitle="Toàn bộ đánh giá">
          {!stats ? (
            <Skeleton height={180} />
          ) : stats.total === 0 ? (
            <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)', padding: '12px 0' }}>
              Chưa có đánh giá nào.
            </div>
          ) : (
            stats.distribution.map((d) => (
              <div
                key={d.star}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 8,
                  font: '400 12.5px var(--font-display)',
                }}
              >
                <span
                  style={{
                    width: 38,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    font: '600 13px var(--font-display)',
                    color: 'var(--vxn-ink)',
                  }}
                >
                  {d.star} <span style={{ color: '#F59E0B' }}>★</span>
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 6,
                    background: 'var(--vxn-bg-mist)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${d.pct}%`,
                      background: d.star >= 4 ? '#22C55E' : d.star === 3 ? '#F59E0B' : '#EF4444',
                      borderRadius: 6,
                    }}
                  />
                </div>
                <span style={{ minWidth: 78, textAlign: 'right', color: 'var(--vxn-fg-3)' }}>
                  {num(d.count)} <span style={{ color: 'var(--vxn-fg-5)' }}>({d.pct}%)</span>
                </span>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card padding={0}>
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px 0', borderBottom: '1px solid var(--vxn-border)', flexWrap: 'wrap' }}>
          {TABS.map((t) => {
            const on = tab === t.key;
            const c = tabCount(t.key);
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  padding: '12px 14px',
                  font: `${on ? 600 : 500} 13.5px var(--font-display)`,
                  color: on ? 'var(--vxn-teal-800)' : 'var(--vxn-fg-3)',
                  borderBottom: `2px solid ${on ? 'var(--vxn-teal-700)' : 'transparent'}`,
                  marginBottom: -1,
                }}
              >
                {t.label}
                {c != null && (
                  <span style={{ color: 'var(--vxn-fg-5)', fontWeight: 500 }}> ({num(c)})</span>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--vxn-border-muted)',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <SearchInput value={q} onChange={setQ} placeholder="Tìm theo nội dung, khách hàng, nhà xe…" />
          <Select value={rating} onChange={setRating} options={RATING_OPTIONS} />
        </div>

        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={96} />)}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', font: '400 14px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
            Không tìm thấy đánh giá nào khớp bộ lọc.
          </div>
        ) : (
          rows.map((r, i) => (
            <ReviewItem
              key={r._id}
              r={r}
              last={i === rows.length - 1}
              busy={actingId === r._id}
              onView={setDetail}
              onPublish={onPublish}
              onUnpublish={onUnpublish}
              onClearReport={onClearReport}
            />
          ))
        )}

        {!loading && total > 0 && (
          <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </Card>

      <Modal
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        title="Chi tiết đánh giá"
        width={620}
      >
        {detail && (
          <div style={{ font: '400 13.5px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <strong style={{ font: '600 15px var(--font-display)', color: 'var(--vxn-ink)' }}>
                {detail.user?.name || 'Khách ẩn danh'}
              </strong>
              {detail.user?.tier && TIER[detail.user.tier] && (
                <Chip tone={TIER[detail.user.tier].tone}>{TIER[detail.user.tier].label}</Chip>
              )}
              <Chip tone={detail.isPublished ? 'success' : 'warn'}>
                {detail.isPublished ? 'Đang hiển thị' : 'Chờ duyệt'}
              </Chip>
              {detail.isReported && <Chip tone="danger">Bị báo cáo</Chip>}
            </div>
            <div style={{ color: 'var(--vxn-fg-5)', marginBottom: 12 }}>
              {[detail.route, detail.operator, detail.createdAt ? dayjs(detail.createdAt).format('DD/MM/YYYY HH:mm') : null]
                .filter(Boolean)
                .join(' · ')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Stars rating={detail.overallRating} />
              <strong style={{ color: 'var(--vxn-ink)' }}>{Number(detail.overallRating || 0).toFixed(1)}</strong>
              <span style={{ color: 'var(--vxn-fg-5)' }}>
                {[
                  detail.vehicleRating && `Xe ${detail.vehicleRating}`,
                  detail.driverRating && `Tài xế ${detail.driverRating}`,
                  detail.punctualityRating && `Đúng giờ ${detail.punctualityRating}`,
                  detail.serviceRating && `Phục vụ ${detail.serviceRating}`,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
            {detail.comment && <p style={{ margin: '0 0 12px' }}>{detail.comment}</p>}
            {detail.images?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {detail.images.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img
                      src={src}
                      alt=""
                      style={{ width: 88, height: 88, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--vxn-border)', display: 'block' }}
                    />
                  </a>
                ))}
              </div>
            )}
            {detail.isReported && detail.reportReason && (
              <div style={{ padding: 12, borderRadius: 8, background: '#FEF2F2', borderLeft: '3px solid #EF4444', marginBottom: 12 }}>
                <div style={{ font: '600 12px var(--font-display)', color: '#B91C1C', marginBottom: 4 }}>Lý do báo cáo</div>
                {detail.reportReason}
              </div>
            )}
            {detail.operatorResponse && (
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--vxn-bg-mist)', borderLeft: '3px solid var(--vxn-teal-700)' }}>
                <div style={{ font: '600 12px var(--font-display)', color: 'var(--vxn-teal-800)', marginBottom: 4 }}>
                  ↳ {detail.operator || 'Nhà xe'} phản hồi
                  {detail.respondedAt ? ` · ${dayjs(detail.respondedAt).format('DD/MM/YYYY')}` : ''}
                </div>
                {detail.operatorResponse}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {detail.isReported && (
                <Btn kind="ghost" icon="flag-off" onClick={() => onClearReport(detail)}>Bỏ báo cáo</Btn>
              )}
              {detail.isPublished ? (
                <Btn kind="ghost" icon="eye-off" onClick={() => onUnpublish(detail)}>Ẩn đánh giá</Btn>
              ) : (
                <Btn kind="primary" icon="check" onClick={() => onPublish(detail)}>Duyệt đánh giá</Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;
