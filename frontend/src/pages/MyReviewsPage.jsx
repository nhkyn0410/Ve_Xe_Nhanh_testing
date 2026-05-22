import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Image, Pagination, Spin, message } from 'antd';
import { StarFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import { accountBreadcrumbItem } from '../components/customer/accountMenu';
import { getMyReviews, getPendingReviews } from '../services/reviewApi';
import CreateReviewModal from '../components/CreateReviewModal';
import { getOperatorDisplayName } from '../utils/operatorDisplay';

dayjs.extend(relativeTime);
dayjs.locale('vi');

// ============================================================================
// Constants & helpers
// ============================================================================

const TEAL = '#036672';
const SAFFRON = '#E89B26';
const STAR_EMPTY = '#D9DCE1';

const PAGE_SIZE = 8;

const STATUS_CHIP = {
  published: { bg: '#D8F5E6', fg: '#0F8458', label: 'Đã đăng' },
  pending: { bg: '#FFF1DC', fg: '#B7791F', label: 'Chờ duyệt' },
  reported: { bg: '#FDE5E5', fg: '#C0392B', label: 'Bị báo cáo' },
};

const DETAIL_FIELDS = [
  { key: 'vehicleRating', label: 'Xe' },
  { key: 'driverRating', label: 'Tài xế' },
  { key: 'punctualityRating', label: 'Đúng giờ' },
  { key: 'serviceRating', label: 'Phục vụ' },
];

const fmtDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '');

const operatorName = (entity) => {
  const op = entity?.operatorId;
  if (op && typeof op === 'object') {
    return getOperatorDisplayName(op, null);
  }
  return null;
};

const routeName = (booking) => {
  const route = booking?.tripId?.routeId;
  if (!route) return null;
  if (route.origin?.city && route.destination?.city) {
    return `${route.origin.city} → ${route.destination.city}`;
  }
  return route.routeName || null;
};

// ============================================================================
// Subcomponents
// ============================================================================

const Stars = ({ value = 0, size = 15 }) => (
  <span className="inline-flex items-center" style={{ gap: 2 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <StarFilled
        key={s}
        style={{
          fontSize: size,
          color: s <= Math.round(value) ? SAFFRON : STAR_EMPTY,
        }}
      />
    ))}
  </span>
);

const StatusChip = ({ review }) => {
  const cfg = review.isReported
    ? STATUS_CHIP.reported
    : review.isPublished
      ? STATUS_CHIP.published
      : STATUS_CHIP.pending;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
};

const ReviewCard = ({ review }) => {
  const title =
    operatorName(review) || `Chuyến ${fmtDate(review?.tripId?.departureTime)}`;
  const tripDate = review?.tripId?.departureTime;
  const subtitle = tripDate
    ? `Chuyến ngày ${fmtDate(tripDate)}`
    : `Đánh giá ${dayjs(review.createdAt).fromNow()}`;

  const detailItems = DETAIL_FIELDS.filter((f) => review[f.key]);

  return (
    <div className="flex flex-col rounded-2xl border border-vxn-border bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-vxn-ink">
            {title}
          </div>
          <div className="mt-0.5 text-[12px] text-vxn-fg-5">{subtitle}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Stars value={review.overallRating} size={15} />
          <span className="text-[12px] font-medium text-vxn-fg-4">
            {Number(review.overallRating || 0).toFixed(1)}/5
          </span>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="mb-0 mt-3 text-[13px] leading-relaxed text-vxn-fg-2">
          {review.comment}
        </p>
      )}

      {/* Detailed ratings (only those provided) */}
      {detailItems.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {detailItems.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1.5 text-[12px] text-vxn-fg-4"
            >
              <span>{f.label}</span>
              <Stars value={review[f.key]} size={11} />
            </span>
          ))}
        </div>
      )}

      {/* Images */}
      {review.images?.length > 0 && (
        <div className="mt-3">
          <Image.PreviewGroup>
            <div className="flex flex-wrap gap-2">
              {review.images.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={`Ảnh đánh giá ${i + 1}`}
                  width={72}
                  height={72}
                  className="rounded-lg object-cover"
                />
              ))}
            </div>
          </Image.PreviewGroup>
        </div>
      )}

      {/* Operator response */}
      {review.operatorResponse && (
        <div
          className="mt-3 rounded-lg px-3 py-2.5"
          style={{ background: '#F1F6F6', borderLeft: `3px solid ${TEAL}` }}
        >
          <div
            className="text-[12px] font-medium"
            style={{ color: TEAL }}
          >
            {operatorName(review) || 'Nhà xe'} đã phản hồi
            {review.operatorResponseDate
              ? ` · ${dayjs(review.operatorResponseDate).fromNow()}`
              : ''}
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-vxn-fg-2">
            {review.operatorResponse}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-vxn-border pt-3">
        <StatusChip review={review} />
        <span className="text-[12px] text-vxn-fg-5">
          Đánh giá {dayjs(review.createdAt).fromNow()}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// Page
// ============================================================================

const MyReviewsPage = () => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [pending, setPending] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalBooking, setModalBooking] = useState(null);

  const fetchReviews = useCallback(async (targetPage) => {
    const res = await getMyReviews({ page: targetPage, limit: PAGE_SIZE });
    if (res?.success) {
      setReviews(res.reviews || []);
      setTotalReviews(res.pagination?.totalReviews || 0);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await getPendingReviews();
      if (res?.success) {
        setPending(res.pending || []);
      }
    } catch (err) {
      // Awaiting-review card is supplementary — never block the page on it.
      console.warn('Pending reviews fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchReviews(page), fetchPending()]);
      } catch (err) {
        console.error('Error loading reviews:', err);
        if (!cancelled) message.error('Không thể tải đánh giá của bạn');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, fetchReviews, fetchPending]);

  const handlePageChange = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewCreated = async () => {
    setModalBooking(null);
    setPage(1);
    await Promise.all([fetchReviews(1), fetchPending()]);
  };

  const subtitle =
    totalReviews > 0
      ? `${totalReviews} đánh giá đã viết · giúp người sau chọn nhà xe tốt hơn.`
      : 'Chia sẻ trải nghiệm để giúp người sau chọn nhà xe tốt hơn.';

  return (
    <CustomerShell activeKey="member">
      {/* Header */}
      <div className="border-b border-vxn-border bg-white">
        <div className="px-4 pt-6 lg:px-8">
          <CustomerBreadcrumb
            className="mb-3"
            items={[
              accountBreadcrumbItem(),
              { label: 'Đánh giá của tôi' },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-3 pb-5">
            <div>
              <h1 className="m-0 text-[26px] font-semibold tracking-tight text-vxn-ink sm:text-[28px]">
                Đánh giá của tôi
              </h1>
              <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Awaiting-review card */}
              {pending.length > 0 && (
                <div
                  className="flex items-center gap-4 rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(110deg, #FFF6E2, #FFE9C4)',
                    border: '1px solid #F2C677',
                  }}
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white">
                    <StarFilled style={{ fontSize: 26, color: '#B7791F' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold text-vxn-ink">
                      {pending.length} chuyến đang chờ đánh giá
                    </div>
                    <div className="mt-0.5 text-[13px] text-vxn-fg-3">
                      {routeName(pending[0])
                        ? `${routeName(pending[0])} · `
                        : ''}
                      Nhận 50 điểm thưởng khi đánh giá chuyến đi của bạn.
                    </div>
                  </div>
                  <Button
                    onClick={() => setModalBooking(pending[0])}
                    className="!h-9 shrink-0 !rounded-lg !border-0 !text-[13px] !font-medium !text-white"
                    style={{ background: SAFFRON }}
                  >
                    Viết đánh giá
                  </Button>
                </div>
              )}

              {/* Reviews grid */}
              {reviews.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {reviews.map((review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                  {totalReviews > PAGE_SIZE && (
                    <div className="mt-2 flex justify-center">
                      <Pagination
                        current={page}
                        total={totalReviews}
                        pageSize={PAGE_SIZE}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        showTotal={(t) => `Tổng ${t} đánh giá`}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-vxn-border bg-white py-16">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="text-[13px] text-vxn-fg-4">
                        {pending.length > 0
                          ? 'Bạn chưa viết đánh giá nào. Hãy đánh giá chuyến đi gần đây của bạn.'
                          : 'Bạn chưa có đánh giá nào.'}
                      </span>
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateReviewModal
        visible={!!modalBooking}
        booking={modalBooking}
        onClose={() => setModalBooking(null)}
        onReviewCreated={handleReviewCreated}
      />
    </CustomerShell>
  );
};

export default MyReviewsPage;
