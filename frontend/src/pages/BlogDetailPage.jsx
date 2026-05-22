import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Empty, Spin, message } from 'antd';
import { ArrowLeftOutlined, HeartOutlined, HeartFilled, ShareAltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import BlogCard, { BLOG_CAT_LABELS } from '../components/content/BlogCard';
import { getBlogBySlug, likeBlog } from '../services/contentApi';

const initials = (name = 'VXN') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

// Estimate reading time from the (HTML) content — ~200 words/min, min 1.
const readMinutes = (html = '') => {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = text ? text.split(' ').length : 0;
  return Math.max(1, Math.round(words / 200));
};

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    window.scrollTo({ top: 0 });
    (async () => {
      try {
        const res = await getBlogBySlug(slug);
        if (cancelled) return;
        if (res?.status === 'success' && res.data?.blog) {
          setBlog(res.data.blog);
          setRelated(res.data.relatedBlogs || []);
          setLikeCount(res.data.blog.likeCount || 0);
          setLiked(false);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Load blog failed:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const readTime = useMemo(() => readMinutes(blog?.content), [blog]);

  const handleLike = async () => {
    if (liked || !blog?._id) return;
    setLiked(true);
    setLikeCount((c) => c + 1);
    try {
      await likeBlog(blog._id);
    } catch (err) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      message.error('Không thể thực hiện. Vui lòng thử lại.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: blog?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        message.success('Đã sao chép liên kết bài viết');
      }
    } catch {
      /* user cancelled share — no-op */
    }
  };

  const author = blog?.author;
  const authorLabel = (author && typeof author === 'object' && author.fullName) || 'VXN Editorial';
  const catLabel = BLOG_CAT_LABELS[blog?.category] || 'Tin tức';

  return (
    <CustomerShell activeKey="news">
      <style>{`
        .vxn-article p { margin: 0 0 16px; }
        .vxn-article h2 {
          font-size: 26px; font-weight: 600; line-height: 1.25;
          color: #181C22; margin: 28px 0 14px; letter-spacing: -.01em;
        }
        .vxn-article strong { font-weight: 600; color: #181C22; }
        .vxn-article .vxn-lead {
          font-size: 19px; font-weight: 500; line-height: 1.55;
          color: #2D3138; letter-spacing: -.005em; margin: 0 0 8px;
        }
        .vxn-article .vxn-tip {
          padding: 22px; border-radius: 12px; background: #F1F3FD;
          border-left: 4px solid #E89B26; margin: 20px 0;
        }
        .vxn-article .vxn-tip-label {
          font-size: 12px; font-weight: 600; letter-spacing: .05em;
          color: #D18A1E; margin-bottom: 6px;
        }
        .vxn-article .vxn-tip-body {
          font-size: 16px; font-weight: 500; line-height: 1.5; color: #181C22;
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="border-b border-vxn-border bg-white">
        <CustomerBreadcrumb
          className="px-4 py-3 lg:px-8"
          items={[
            { label: 'Cẩm nang & tin tức', to: '/news' },
            blog ? { label: blog.title } : null,
          ]}
        />
      </div>

      <div className="px-4 py-8 lg:px-8">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : notFound || !blog ? (
          <div className="mx-auto max-w-[640px] rounded-2xl border border-vxn-border bg-white py-16">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-[13px] text-vxn-fg-4">Không tìm thấy bài viết này.</span>
              }
            >
              <button
                type="button"
                onClick={() => navigate('/news')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-vxn-border bg-white px-4 text-[13px] font-medium text-vxn-fg-2 hover:border-vxn-teal-700 hover:text-vxn-teal-700"
              >
                <ArrowLeftOutlined /> Về trang Cẩm nang
              </button>
            </Empty>
          </div>
        ) : (
          <article className="mx-auto flex max-w-[108rem] flex-col gap-6">
            {/* Title block */}
            <div>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white"
                style={{ background: '#E89B26' }}
              >
                {catLabel.toUpperCase()}
              </span>
              <h1 className="m-0 mt-3.5 text-[28px] font-semibold leading-[1.15] tracking-tight text-vxn-ink sm:text-[40px]">
                {blog.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[13px] text-vxn-fg-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full text-[14px] font-semibold text-vxn-teal-700"
                    style={{
                      background: 'linear-gradient(135deg, #DBEAFE, #fff)',
                    }}
                  >
                    {initials(authorLabel)}
                  </span>
                  <div>
                    <div className="text-[13px] font-medium text-vxn-ink">{authorLabel}</div>
                    <div className="text-[11px] text-vxn-fg-5">Biên tập viên VXN</div>
                  </div>
                </div>
                <span className="text-vxn-fg-5">·</span>
                <span>{dayjs(blog.publishedAt || blog.createdAt).format('DD/MM/YYYY')}</span>
                <span className="text-vxn-fg-5">·</span>
                <span>Đọc {readTime} phút</span>
                <span className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={handleLike}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition ${
                      liked
                        ? 'border-vxn-saffron-400 bg-vxn-saffron-50 text-vxn-saffron-700'
                        : 'border-vxn-border bg-white text-vxn-fg-2 hover:border-vxn-saffron-400'
                    }`}
                  >
                    {liked ? <HeartFilled style={{ color: '#E89B26' }} /> : <HeartOutlined />}
                    {likeCount}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-vxn-border bg-white px-3 text-[13px] font-medium text-vxn-fg-2 transition hover:border-vxn-teal-700 hover:text-vxn-teal-700"
                  >
                    <ShareAltOutlined /> Chia sẻ
                  </button>
                </span>
              </div>
            </div>

            {/* Hero image */}
            {blog.featuredImage && (
              <div className="h-[220px] overflow-hidden rounded-2xl sm:h-[380px]">
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Body */}
            <div
              className="vxn-article text-[16px] leading-[1.75] text-vxn-fg-2"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-vxn-border pt-5">
                {blog.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-vxn-bg-mist px-3 py-1.5 text-[12px] font-medium text-vxn-fg-2"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <div className="mt-4">
                <h3 className="m-0 mb-4 text-[18px] font-semibold text-vxn-ink">
                  Bài viết liên quan
                </h3>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((p) => (
                    <BlogCard key={p._id} post={p} />
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </div>
    </CustomerShell>
  );
};

export default BlogDetailPage;
