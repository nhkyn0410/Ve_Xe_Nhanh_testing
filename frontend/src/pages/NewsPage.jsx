import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Input, Spin, message } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomerShell from '../components/customer/CustomerShell';
import ContentBanners from '../components/customer/ContentBanners';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import BlogCard, { BLOG_CAT_LABELS } from '../components/content/BlogCard';
import { getBlogs } from '../services/contentApi';

const HERO_IMG =
  'https://tinviettravel.com.vn/uploads/tours/2019_10/lang-biang-da-lat.jpg';

// Tab order mirrors flow-content.jsx BLOG_CATEGORIES.
const CAT_ORDER = ['news', 'guide', 'promotion', 'travel_tips', 'company', 'other'];

const norm = (s = '') => s.toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const authorName = (author) =>
  (author && typeof author === 'object' && author.fullName) || 'VXN Editorial';

const NewsPage = () => {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getBlogs({ limit: 100, sort: '-publishedAt' });
        if (!cancelled && (res?.status === 'success' || res?.data)) {
          setBlogs(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Load blogs failed:', err);
        if (!cancelled) message.error('Không thể tải bài viết. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = useMemo(() => {
    const counts = blogs.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {});
    const present = CAT_ORDER.filter((k) => counts[k]).map((k) => ({
      key: k,
      label: BLOG_CAT_LABELS[k],
      count: counts[k],
    }));
    return [{ key: 'all', label: 'Tất cả', count: blogs.length }, ...present];
  }, [blogs]);

  const filtered = useMemo(() => {
    const q = norm(search.trim());
    return blogs.filter((b) => {
      if (activeCat !== 'all' && b.category !== activeCat) return false;
      if (!q) return true;
      return (
        norm(b.title).includes(q) ||
        norm(b.excerpt).includes(q) ||
        (b.tags || []).some((t) => norm(t).includes(q))
      );
    });
  }, [blogs, activeCat, search]);

  const featured = filtered[0];
  const sideCards = filtered.slice(1, 3);
  const gridCards = filtered.slice(3);

  return (
    <CustomerShell activeKey="news">
      {/* Breadcrumb */}
      <div className="border-b border-vxn-border bg-white">
        <CustomerBreadcrumb
          className="px-4 py-3 lg:px-8"
          items={[{ label: 'Cẩm nang & tin tức' }]}
        />
      </div>

      {/* Hero */}
      <div className="relative h-[240px] overflow-hidden sm:h-[280px]">
        <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0 flex flex-col justify-center px-6 lg:px-14"
          style={{
            background: 'linear-gradient(90deg, rgba(0,30,45,.78) 0%, rgba(0,30,45,.32) 100%)',
          }}
        >
          <span
            className="mb-3.5 inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white"
            style={{ background: '#E89B26' }}
          >
            CẨM NANG &amp; TIN TỨC
          </span>
          <h1 className="m-0 max-w-[720px] text-[30px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            Đi xa hơn với mỗi hành trình
          </h1>
          <p className="m-0 mt-3 max-w-[540px] text-[14px] text-white/85 sm:text-[16px]">
            Mẹo chọn xe, gợi ý cung đường đẹp, ưu đãi và quy định mới từ Vé Xe Nhanh.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[108rem] flex-col gap-6">
          <ContentBanners position="routes" containerClassName="grid gap-4" />

          {/* Tabs + search */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((t) => {
                const on = activeCat === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveCat(t.key)}
                    style={on ? { background: '#E89B26', borderColor: '#E89B26' } : undefined}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition ${
                      on
                        ? 'font-semibold text-white'
                        : 'border-vxn-border bg-white font-medium text-vxn-fg-2 hover:border-vxn-saffron-400'
                    }`}
                  >
                    {t.label}
                    <span className={`text-[11px] ${on ? 'text-white/75' : 'text-vxn-fg-5'}`}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="lg:ml-auto lg:w-72">
              <Input
                allowClear
                size="large"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bài viết..."
                prefix={<SearchOutlined className="text-vxn-fg-5" />}
                className="!rounded-lg"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Spin size="large" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-vxn-border bg-white py-16">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-[13px] text-vxn-fg-4">
                    Không tìm thấy bài viết phù hợp.
                  </span>
                }
              />
            </div>
          ) : (
            <>
              {/* Featured row */}
              <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.6fr_1fr_1fr]">
                <article
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/news/${featured.slug}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/news/${featured.slug}`);
                    }
                  }}
                  className="group relative flex min-h-[300px] cursor-pointer flex-col justify-end overflow-hidden rounded-2xl p-7 text-white sm:min-h-[380px]"
                  style={{ background: '#0b3a4a' }}
                >
                  {featured.featuredImage && (
                    <img
                      src={featured.featuredImage}
                      alt={featured.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, rgba(0,40,60,0) 28%, rgba(0,40,60,.88))',
                    }}
                  />
                  <div className="relative">
                    <div className="mb-3.5 flex flex-wrap gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white"
                        style={{ background: '#E89B26' }}
                      >
                        {(BLOG_CAT_LABELS[featured.category] || 'Tin tức').toUpperCase()}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white">
                        BÀI NỔI BẬT
                      </span>
                    </div>
                    <h2 className="m-0 max-w-[480px] text-[24px] font-semibold leading-[1.15] tracking-tight sm:text-[30px]">
                      {featured.title}
                    </h2>
                    <p className="m-0 mt-3 max-w-[460px] text-[14px] leading-[1.5] text-white/85 line-clamp-2">
                      {featured.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-2.5 text-[12px] text-white/70">
                      <span>{authorName(featured.author)}</span>
                      <span>·</span>
                      <span>
                        {dayjs(featured.publishedAt || featured.createdAt).format('DD/MM/YYYY')}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <EyeOutlined style={{ fontSize: 12 }} />
                        {Number(featured.viewCount || 0).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </article>

                {sideCards.map((p) => (
                  <BlogCard key={p._id} post={p} />
                ))}
              </div>

              {/* Remaining grid */}
              {gridCards.length > 0 && (
                <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                  {gridCards.map((p) => (
                    <BlogCard key={p._id} post={p} />
                  ))}
                </div>
              )}

              {/* CTA — links to the FAQ page (functional, no fake newsletter form) */}
              <div
                className="flex flex-col items-start gap-5 rounded-2xl p-8 text-white sm:flex-row sm:items-center"
                style={{
                  background: 'linear-gradient(110deg, #036672, #024a52)',
                }}
              >
                <div className="flex-1">
                  <h3 className="m-0 text-[20px] font-semibold sm:text-[22px]">
                    Chưa tìm thấy điều bạn cần?
                  </h3>
                  <p className="m-0 mt-1.5 text-[14px] text-white/75">
                    Xem giải đáp nhanh hơn 100 câu hỏi thường gặp về đặt vé, thanh toán và đổi/huỷ
                    vé.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/faq')}
                  className="inline-flex h-11 shrink-0 items-center rounded-lg border-0 px-6 text-[14px] font-semibold text-white transition hover:opacity-95"
                  style={{ background: '#E89B26' }}
                >
                  Câu hỏi thường gặp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </CustomerShell>
  );
};

export default NewsPage;
