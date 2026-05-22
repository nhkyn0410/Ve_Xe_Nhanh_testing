import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin, message } from 'antd';
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  HistoryOutlined,
  PercentageOutlined,
  SafetyOutlined,
  StarFilled,
  ThunderboltFilled,
  TrophyFilled,
} from '@ant-design/icons';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import { accountBreadcrumbItem } from '../components/customer/accountMenu';
import RedeemPointsModal from '../components/RedeemPointsModal';
import useAuthStore from '../store/authStore';
import { getLoyaltyOverview, getLoyaltyHistory } from '../services/loyaltyApi';

// ============================================================================
// Tier metadata
// ============================================================================

const TIERS = [
  {
    key: 'bronze',
    label: 'Bronze',
    min: 0,
    multiplier: '1.0×',
    discount: '0%',
    tone: '#8C5A2C',
  },
  {
    key: 'silver',
    label: 'Silver',
    min: 2000,
    multiplier: '1.2×',
    discount: '5%',
    tone: '#5B6470',
  },
  {
    key: 'gold',
    label: 'Gold',
    min: 5000,
    multiplier: '1.5×',
    discount: '10%',
    tone: '#A8741A',
  },
  {
    key: 'platinum',
    label: 'Platinum',
    min: 10000,
    multiplier: '2.0×',
    discount: '15%',
    tone: '#0F8458',
  },
];

const TIER_INDEX = TIERS.reduce((m, t, i) => ({ ...m, [t.key]: i }), {});

const formatNumber = (n) =>
  Number.isFinite(n) ? n.toLocaleString('vi-VN') : '0';

const formatVND = (n) =>
  Number.isFinite(n)
    ? `${n.toLocaleString('vi-VN')}đ`
    : '0đ';

// Build benefit cards for a tier
const buildBenefits = (tierKey, multiplier, discount) => {
  const list = [
    {
      icon: PercentageOutlined,
      title: `Giảm ${discount} mọi chuyến`,
      sub: 'Áp dụng tự động khi đặt vé',
    },
    {
      icon: StarFilled,
      title: `Tích điểm ${multiplier}`,
      sub: 'Cộng vào mọi chuyến đi',
    },
  ];
  if (tierKey === 'gold' || tierKey === 'platinum') {
    list.push({
      icon: CustomerServiceOutlined,
      title: 'CSKH ưu tiên',
      sub: 'Tổng đài riêng 1900 6868',
    });
  }
  if (tierKey === 'platinum') {
    list.push({
      icon: SafetyOutlined,
      title: 'Hoàn 100% phí huỷ',
      sub: 'Áp dụng cho 2 vé/tháng',
    });
  } else if (tierKey === 'gold') {
    list.push({
      icon: SafetyOutlined,
      title: 'Huỷ vé linh hoạt',
      sub: 'Miễn phí trước 12h khởi hành',
    });
  } else if (tierKey === 'silver') {
    list.push({
      icon: CustomerServiceOutlined,
      title: 'Hỗ trợ ưu tiên',
      sub: 'Trả lời trong 30 phút',
    });
  } else {
    list.push({
      icon: ThunderboltFilled,
      title: 'Tích điểm cơ bản',
      sub: 'Mỗi 10.000đ = 1 điểm',
    });
  }
  return list;
};

// ============================================================================
// Subcomponents
// ============================================================================

const TierHero = ({ profile, currentTier, nextTier, points, onRedeem, onHistory }) => {
  const tierMeta =
    TIERS.find((t) => t.key === currentTier?.name) || TIERS[0];
  const totalPoints = points?.total ?? 0;
  const valueVND = totalPoints * 1000;
  const teaser = nextTier && !nextTier.isMaxTier
    ? `Còn ${formatNumber(nextTier.pointsNeeded)} điểm để lên ${
        TIERS.find((t) => t.key === nextTier.name)?.label || 'hạng kế tiếp'
      }.`
    : 'Bạn đã đạt hạng cao nhất — cảm ơn bạn đã đồng hành cùng VXN!';

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white shadow-[0_18px_40px_-18px_rgba(15,73,89,0.45)]"
      style={{
        background:
          'linear-gradient(110deg, #0F4859 0%, #1E5566 45%, #2D6477 100%)',
      }}
    >
      {/* saffron radial */}
      <div
        className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(232,155,38,0.45), transparent 65%)',
        }}
      />
      <div className="relative grid grid-cols-1 gap-6 p-7 sm:p-9 lg:grid-cols-[1fr_240px] lg:items-center lg:gap-8">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.06em]"
            style={{
              background: 'rgba(255,255,255,0.14)',
              color: '#FFD58A',
            }}
          >
            <StarFilled style={{ fontSize: 12 }} /> HẠNG HIỆN TẠI ·{' '}
            {tierMeta.label.toUpperCase()}
          </span>
          <h2 className="mt-3 mb-1.5 text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">
            Cảm ơn{' '}
            <span style={{ color: '#FFB44E' }}>
              {profile?.fullName || profile?.email || 'bạn'}
            </span>
          </h2>
          <p className="m-0 max-w-xl text-[13.5px] leading-relaxed text-white/75">
            Bạn đang được giảm {tierMeta.discount} mọi chuyến, tích điểm{' '}
            {tierMeta.multiplier}, ưu tiên CSKH. {teaser}
          </p>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[11px] font-medium tracking-[0.1em] text-white/55">
              ĐIỂM HIỆN CÓ
            </span>
            <span className="text-[44px] font-bold leading-none tracking-tight sm:text-[52px]">
              {formatNumber(totalPoints)}
            </span>
            <span className="text-[13px] text-white/60">
              ≈ {formatVND(valueVND)} giảm
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 lg:items-end">
          <Button
            type="primary"
            size="large"
            onClick={onRedeem}
            className="!h-11 !w-full !rounded-xl !text-[14px] !font-semibold lg:!w-auto lg:!min-w-[200px]"
            style={{ background: '#F3B132', borderColor: '#F3B132', color: '#1A1A1A' }}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            disabled={!points?.total || points.total < 100}
          >
            Đổi điểm lấy ưu đãi
          </Button>
          <Button
            size="large"
            onClick={onHistory}
            className="!h-11 !w-full !rounded-xl !border-0 !bg-white/95 !text-[14px] !font-semibold !text-vxn-ink lg:!w-auto lg:!min-w-[200px]"
            icon={<HistoryOutlined />}
          >
            Xem lịch sử điểm
          </Button>
        </div>
      </div>
    </div>
  );
};

const TierLadder = ({ currentTierKey, totalPoints }) => {
  const overallPct = Math.min(100, Math.max(0, (totalPoints / 10000) * 100));
  return (
    <section className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="m-0 text-[17px] font-semibold text-vxn-ink">
          Hạng thành viên
        </h3>
        <span className="cursor-default text-[12.5px] font-medium text-vxn-teal-700">
          Tích điểm — Đổi quà — Lên hạng
        </span>
      </div>
      <div className="mb-5 h-2 rounded-full bg-vxn-bg-fog">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${overallPct}%`,
            background:
              'linear-gradient(90deg, #B45309 0%, #94A3B8 25%, #E89B26 50%, #1F4E9E 100%)',
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TIERS.map((tier) => {
          const isCurrent = tier.key === currentTierKey;
          const isReached =
            TIER_INDEX[tier.key] <= TIER_INDEX[currentTierKey || 'bronze'];
          return (
            <div
              key={tier.key}
              className="relative rounded-xl border p-4 transition"
              style={{
                background: isCurrent
                  ? 'linear-gradient(135deg, #FFF6E2, #FFE9C4)'
                  : isReached
                    ? '#FBFBFA'
                    : 'var(--vxn-bg-soft, #F7F8FA)',
                borderColor: isCurrent ? '#E89B26' : 'var(--vxn-border, #E5E7EB)',
              }}
            >
              {isCurrent && (
                <span className="absolute right-2.5 top-2.5 text-[10px] font-bold tracking-[0.06em] text-vxn-saffron-700">
                  BẠN ĐANG Ở ĐÂY
                </span>
              )}
              <div
                className="text-[17px] font-bold text-vxn-ink"
                style={{ color: isReached ? tier.tone : '#94A3B8' }}
              >
                {tier.label}
              </div>
              <div className="mt-0.5 text-[11.5px] text-vxn-fg-5">
                Từ {formatNumber(tier.min)} điểm
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[12px] text-vxn-fg-3">
                  <span>Hệ số điểm</span>
                  <strong className="text-vxn-ink">{tier.multiplier}</strong>
                </div>
                <div className="flex items-center justify-between text-[12px] text-vxn-fg-3">
                  <span>Giảm giá</span>
                  <strong className="text-vxn-ink">{tier.discount}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const BenefitsCard = ({ tierKey, multiplier, discount }) => {
  const tier = TIERS.find((t) => t.key === tierKey) || TIERS[0];
  const benefits = buildBenefits(tierKey, multiplier || tier.multiplier, discount || tier.discount);
  return (
    <section className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm sm:p-7">
      <h3 className="m-0 mb-5 text-[17px] font-semibold text-vxn-ink">
        Ưu đãi {tier.label} của bạn
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {benefits.map(({ icon: Icon, title, sub }) => (
          <div
            key={title}
            className="flex gap-3 rounded-xl bg-vxn-bg-soft p-4 transition hover:bg-vxn-bg-mist"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white">
              <Icon style={{ fontSize: 16, color: '#A8741A' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-vxn-ink">
                {title}
              </div>
              <div className="mt-0.5 text-[12px] text-vxn-fg-5">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ExpiringCard = ({ items, onRedeem }) => {
  if (!items || items.length === 0) return null;
  const totalExpiring = items.reduce((s, i) => s + (i.points || 0), 0);
  return (
    <section className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm sm:p-7">
      <h3 className="m-0 mb-3 text-[17px] font-semibold text-vxn-ink">
        Điểm sắp hết hạn
      </h3>
      <p className="m-0 mb-3 text-[12.5px] text-vxn-fg-4">
        Hãy đổi điểm trước khi hết hạn để không bị mất giá trị.
      </p>
      <div className="flex flex-col gap-2">
        {items.slice(0, 4).map((item, idx) => (
          <div
            key={item._id || idx}
            className="flex items-center gap-2.5 rounded-lg bg-amber-50 p-3"
          >
            <ClockCircleOutlined style={{ fontSize: 14, color: '#B45309' }} />
            <span className="text-[13px] font-semibold text-amber-700">
              {formatNumber(item.points)} điểm
            </span>
            <span className="ml-auto text-[11.5px] text-vxn-fg-3">
              Hết hạn{' '}
              {item.expiresAt
                ? new Date(item.expiresAt).toLocaleDateString('vi-VN')
                : '—'}
            </span>
          </div>
        ))}
      </div>
      <Button
        type="primary"
        block
        onClick={onRedeem}
        className="!mt-4 !h-10 !rounded-lg !text-[13px] !font-semibold"
        style={{ background: '#036672', borderColor: '#036672' }}
      >
        Đổi ngay {formatNumber(totalExpiring)} điểm
      </Button>
    </section>
  );
};

// ============================================================================
// Main page
// ============================================================================

const LoyaltyOverviewPage = () => {
  const navigate = useNavigate();
  const { user: storedUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [expiringItems, setExpiringItems] = useState([]);
  const [redeemOpen, setRedeemOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLoyaltyOverview();
      if (response?.success) {
        setOverview(response);
      } else {
        // tolerate legacy wrapped data shape
        setOverview(response?.data || null);
      }
    } catch (error) {
      console.error('Loyalty overview error:', error);
      message.error(error?.message || 'Không thể tải thông tin VXN Plus');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExpiringItems = useCallback(async () => {
    try {
      // Pull a window of recent earn entries, filter to ones expiring in next 30 days
      const response = await getLoyaltyHistory({ page: 1, limit: 40, type: 'earn' });
      const list = response?.history || response?.data?.history || [];
      const thirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const upcoming = list
        .filter(
          (e) =>
            e.expiresAt &&
            !e.isExpired &&
            new Date(e.expiresAt).getTime() <= thirtyDays
        )
        .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
      setExpiringItems(upcoming);
    } catch (error) {
      console.warn('Fetch expiring items failed:', error);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchExpiringItems();
  }, [fetchOverview, fetchExpiringItems]);

  const handleRedeemSuccess = () => {
    setRedeemOpen(false);
    fetchOverview();
    fetchExpiringItems();
  };

  const currentTierKey = overview?.currentTier?.name || 'bronze';
  const currentMultiplier =
    overview?.currentTier?.benefits?.pointsMultiplier
      ? `${overview.currentTier.benefits.pointsMultiplier}×`
      : null;
  const currentDiscount =
    overview?.currentTier?.benefits?.discountPercentage != null
      ? `${overview.currentTier.benefits.discountPercentage}%`
      : null;

  const profileSafe = useMemo(
    () => storedUser || overview?.user || null,
    [storedUser, overview]
  );

  return (
    <CustomerShell activeKey="member">
      {/* Page header */}
      <div className="border-b border-vxn-border bg-white">
        <div className="px-4 pt-6 lg:px-8">
          <CustomerBreadcrumb
            className="mb-3"
            items={[
              accountBreadcrumbItem(),
              { label: 'VXN Plus' },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-3 pb-5">
            <div>
              <h1 className="m-0 flex items-center gap-2 text-[26px] font-semibold tracking-tight text-vxn-ink sm:text-[28px]">
                <TrophyFilled style={{ color: '#E89B26' }} />
                VXN Plus — chương trình thành viên
              </h1>
              <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                Tích điểm sau mỗi chuyến · 1 điểm = 1.000đ giảm khi đặt vé kế
                tiếp.
              </p>
            </div>
            <Button
              type="text"
              onClick={() => navigate('/loyalty/history')}
              className="!text-[13px] !font-semibold !text-vxn-teal-700"
              icon={<HistoryOutlined />}
            >
              Xem lịch sử điểm
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          {loading || !overview ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-vxn-border bg-white">
              <Spin size="large" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <TierHero
                profile={profileSafe}
                currentTier={overview.currentTier}
                nextTier={overview.nextTier}
                points={overview.points}
                onRedeem={() => setRedeemOpen(true)}
                onHistory={() => navigate('/loyalty/history')}
              />
              <TierLadder
                currentTierKey={currentTierKey}
                totalPoints={overview.points?.total ?? 0}
              />
              <div
                className={
                  expiringItems.length > 0
                    ? 'grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]'
                    : ''
                }
              >
                <BenefitsCard
                  tierKey={currentTierKey}
                  multiplier={currentMultiplier}
                  discount={currentDiscount}
                />
                {expiringItems.length > 0 && (
                  <ExpiringCard
                    items={expiringItems}
                    onRedeem={() => setRedeemOpen(true)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Redeem points modal — only mount once overview is loaded so currentPoints is defined */}
      {overview?.points?.total != null && (
        <RedeemPointsModal
          open={redeemOpen}
          onCancel={() => setRedeemOpen(false)}
          onSuccess={handleRedeemSuccess}
          currentPoints={overview.points.total}
        />
      )}
    </CustomerShell>
  );
};

export default LoyaltyOverviewPage;
