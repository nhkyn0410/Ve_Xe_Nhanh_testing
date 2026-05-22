import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Pagination, Spin, message } from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  TrophyFilled,
  RiseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import { accountBreadcrumbItem } from '../components/customer/accountMenu';
import { getLoyaltyHistory, getLoyaltyOverview } from '../services/loyaltyApi';

dayjs.locale('vi');

// ============================================================================
// Helpers
// ============================================================================

const TIER_LABEL = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

const FILTERS = [
  { key: '', label: 'Tất cả' },
  { key: 'earn', label: 'Tích điểm' },
  { key: 'redeem', label: 'Đổi điểm' },
  { key: 'expire', label: 'Hết hạn' },
];

const TYPE_META = {
  earn: {
    label: 'Tích điểm',
    chipBg: '#D1FAE5',
    chipFg: '#0F8458',
    pointsFg: '#0F8458',
    sign: '+',
  },
  redeem: {
    label: 'Đổi điểm',
    chipBg: '#FFE9C4',
    chipFg: '#A8741A',
    pointsFg: '#A8741A',
    sign: '−',
  },
  expire: {
    label: 'Hết hạn',
    chipBg: '#E5E7EB',
    chipFg: '#5B6470',
    pointsFg: '#94A3B8',
    sign: '−',
  },
};

const formatNumber = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString('vi-VN')
    : String(n ?? '0');

const buildRef = (entry) => {
  if (entry.tripId) {
    const id =
      typeof entry.tripId === 'object'
        ? entry.tripId._id || entry.tripId.id
        : entry.tripId;
    if (id) return `TRIP-${String(id).slice(-6).toUpperCase()}`;
  }
  if (entry._id) return `LOG-${String(entry._id).slice(-6).toUpperCase()}`;
  return '—';
};

// ============================================================================
// Subcomponents
// ============================================================================

const StatTile = ({ label, value, sub, tone }) => (
  <div className="rounded-2xl border border-vxn-border bg-white p-5 shadow-sm">
    <div className="text-[11px] font-medium tracking-[0.06em] text-vxn-fg-5">
      {label}
    </div>
    <div
      className="mt-1.5 text-[26px] font-bold tracking-tight"
      style={{ color: tone || '#1F1F2A' }}
    >
      {value}
    </div>
    {sub && (
      <div className="mt-1 text-[12px] text-vxn-fg-5">{sub}</div>
    )}
  </div>
);

const FilterChips = ({ active, counts, onChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    {FILTERS.map((f) => {
      const isActive = active === f.key;
      const count = counts?.[f.key || 'all'];
      return (
        <button
          key={f.key || 'all'}
          type="button"
          onClick={() => onChange(f.key)}
          className={`rounded-lg px-3.5 py-1.5 text-[13px] transition ${
            isActive
              ? 'bg-vxn-bg-mist font-semibold text-vxn-ink'
              : 'bg-transparent font-medium text-vxn-fg-3 hover:bg-vxn-bg-soft hover:text-vxn-ink'
          }`}
        >
          {f.label}
          {Number.isFinite(count) && (
            <span className="ml-1.5 text-vxn-fg-5">({count})</span>
          )}
        </button>
      );
    })}
  </div>
);

const HistoryTable = ({ items }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-vxn-bg-soft">
          {['ĐIỂM', 'MÔ TẢ', 'THAM CHIẾU', 'NGÀY', 'LOẠI'].map((h, i) => (
            <th
              key={h}
              className={`border-b border-vxn-border px-6 py-3 text-[11px] font-medium tracking-[0.08em] text-vxn-fg-5 ${
                i === 0 ? 'text-right' : 'text-left'
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((entry) => {
          const meta = TYPE_META[entry.type] || TYPE_META.expire;
          const dateStr = entry.createdAt
            ? dayjs(entry.createdAt).format('DD/MM/YYYY')
            : '—';
          const refStr = buildRef(entry);
          return (
            <tr
              key={entry._id || `${entry.createdAt}-${entry.points}`}
              className="transition hover:bg-vxn-bg-soft/60"
            >
              <td
                className="border-b border-vxn-border px-6 py-3.5 text-right text-[16px] font-semibold tabular-nums"
                style={{ color: meta.pointsFg }}
              >
                {meta.sign} {formatNumber(Math.abs(entry.points || 0))}
              </td>
              <td className="border-b border-vxn-border px-6 py-3.5 text-[14px] text-vxn-ink">
                {entry.reason || '—'}
              </td>
              <td className="border-b border-vxn-border px-6 py-3.5 font-mono text-[12.5px] text-vxn-fg-4">
                {refStr}
              </td>
              <td className="border-b border-vxn-border px-6 py-3.5 text-[13px] text-vxn-fg-3">
                {dateStr}
              </td>
              <td className="border-b border-vxn-border px-6 py-3.5">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ background: meta.chipBg, color: meta.chipFg }}
                >
                  {meta.label}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ============================================================================
// Main page
// ============================================================================

const LoyaltyHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 20;

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLoyaltyHistory({
        page: currentPage,
        limit: pageSize,
        type: filterType || undefined,
      });
      // Endpoint returns at root level (success: true, history, pagination, user)
      const items = response?.history || response?.data?.history || [];
      const pagination =
        response?.pagination || response?.data?.pagination || {};
      const u = response?.user || response?.data?.user || null;
      setHistory(items);
      setTotalRecords(pagination.totalRecords || 0);
      setUser(u);
    } catch (error) {
      console.error('Loyalty history error:', error);
      message.error(error?.message || 'Không thể tải lịch sử điểm');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterType]);

  const fetchOverview = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await getLoyaltyOverview();
      const data = response?.success ? response : response?.data || null;
      setOverview(data);
    } catch (error) {
      console.warn('Loyalty overview fetch failed:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const points = overview?.points;
  const tierKey = user?.loyaltyTier || overview?.currentTier?.name;
  const tierLabel = tierKey ? TIER_LABEL[tierKey] || tierKey : 'Bronze';

  const stats = useMemo(
    () => [
      {
        label: 'ĐIỂM HIỆN CÓ',
        value: formatNumber(user?.totalPoints ?? points?.total ?? 0),
        sub: `Hạng ${tierLabel}`,
        tone: '#036672',
      },
      {
        label: 'ĐÃ TÍCH',
        value: `+ ${formatNumber(points?.totalEarned ?? 0)}`,
        sub: 'Tất cả thời gian',
        tone: '#0F8458',
      },
      {
        label: 'ĐÃ ĐỔI',
        value: `− ${formatNumber(points?.totalRedeemed ?? 0)}`,
        sub: 'Tất cả thời gian',
        tone: '#A8741A',
      },
      {
        label: 'HẾT HẠN',
        value: `− ${formatNumber(points?.totalExpired ?? 0)}`,
        sub:
          points?.expiringSoon > 0
            ? `${formatNumber(points.expiringSoon)} sắp hết hạn`
            : 'Tất cả thời gian',
        tone: '#94A3B8',
      },
    ],
    [user, points, tierLabel]
  );

  const handleFilter = (key) => {
    setFilterType(key);
    setCurrentPage(1);
  };

  return (
    <CustomerShell activeKey="member">
      {/* Page header */}
      <div className="border-b border-vxn-border bg-white">
        <div className="px-4 pt-6 lg:px-8">
          <CustomerBreadcrumb
            className="mb-3"
            items={[
              accountBreadcrumbItem(),
              { label: 'VXN Plus', to: '/loyalty' },
              { label: 'Lịch sử điểm' },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-3 pb-5">
            <div>
              <h1 className="m-0 flex items-center gap-2 text-[26px] font-semibold tracking-tight text-vxn-ink sm:text-[28px]">
                <TrophyFilled style={{ color: '#E89B26' }} />
                Lịch sử điểm
              </h1>
              <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                Mọi giao dịch tích, đổi và hết hạn điểm thành viên — sắp xếp
                mới nhất trước.
              </p>
            </div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/loyalty')}
              className="!h-9 !rounded-lg !text-[13px] !font-medium"
            >
              Về VXN Plus
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          {/* Stats */}
          {statsLoading && !overview ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[100px] animate-pulse rounded-2xl border border-vxn-border bg-vxn-bg-soft"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <StatTile key={s.label} {...s} />
              ))}
            </div>
          )}

          {/* History */}
          <section className="overflow-hidden rounded-2xl border border-vxn-border bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vxn-border px-6 py-3.5">
              <FilterChips active={filterType} onChange={handleFilter} />
              <div className="inline-flex items-center gap-2 text-[12.5px] text-vxn-fg-3">
                <ClockCircleOutlined style={{ fontSize: 13 }} />
                Tất cả thời gian
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Spin size="large" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-[13px] text-vxn-fg-4">
                      {filterType
                        ? 'Không có giao dịch nào trong nhóm này.'
                        : 'Bạn chưa có giao dịch điểm nào. Đặt vé và nhận điểm thưởng sau mỗi chuyến đi!'}
                    </span>
                  }
                >
                  {!filterType && (
                    <div className="mt-3 flex justify-center gap-2">
                      <Button
                        type="primary"
                        onClick={() => navigate('/')}
                        style={{
                          background: '#036672',
                          borderColor: '#036672',
                        }}
                        icon={<RiseOutlined />}
                      >
                        Tìm chuyến mới
                      </Button>
                      <Button
                        onClick={() => navigate('/loyalty')}
                        icon={<GiftOutlined />}
                      >
                        Về VXN Plus
                      </Button>
                    </div>
                  )}
                </Empty>
              </div>
            ) : (
              <>
                <HistoryTable items={history} />
                {totalRecords > pageSize && (
                  <div className="flex justify-center border-t border-vxn-border px-6 py-4">
                    <Pagination
                      current={currentPage}
                      total={totalRecords}
                      pageSize={pageSize}
                      onChange={(p) => {
                        setCurrentPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      showSizeChanger={false}
                      showTotal={(t) => `Tổng ${formatNumber(t)} giao dịch`}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </CustomerShell>
  );
};

export default LoyaltyHistoryPage;
