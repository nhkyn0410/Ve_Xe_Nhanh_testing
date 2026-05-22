import { useNavigate } from 'react-router-dom';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export const BLOG_CAT_LABELS = {
  news: 'Tin tức',
  guide: 'Cẩm nang',
  promotion: 'Khuyến mãi',
  travel_tips: 'Mẹo du lịch',
  company: 'VXN',
  other: 'Khác',
};

const CARD_GRADIENT =
  'linear-gradient(135deg, #DCE6F1 0%, #F4EFE6 50%, #FDE7C2 100%)';

const authorName = (author) =>
  (author && typeof author === 'object' && author.fullName) || 'VXN Editorial';

/**
 * Shared blog/news card used by the list and detail (related) screens.
 * Matches flow-content.jsx BlogCard: white card, 170px image header with a
 * category chip, title, 2-line excerpt clamp, footer author · date · views.
 */
const BlogCard = ({ post }) => {
  const navigate = useNavigate();
  if (!post) return null;

  const date = post.publishedAt || post.createdAt;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/news/${post.slug}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/news/${post.slug}`);
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-vxn-border bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(0,40,60,0.25)]"
    >
      <div
        className="relative h-[170px] overflow-hidden"
        style={{ background: CARD_GRADIENT }}
      >
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <span className="absolute left-3.5 top-3.5 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-vxn-fg-2 shadow-sm">
          {BLOG_CAT_LABELS[post.category] || 'Tin tức'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-[18px]">
        <h3 className="m-0 line-clamp-2 text-[16px] font-semibold leading-[1.3] text-vxn-ink transition group-hover:text-vxn-teal-700">
          {post.title}
        </h3>
        <p className="m-0 line-clamp-2 text-[13px] leading-[1.5] text-vxn-fg-3">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-2.5 text-[11px] text-vxn-fg-5">
          <span className="truncate">{authorName(post.author)}</span>
          <span>·</span>
          <span className="shrink-0">
            {date ? dayjs(date).format('DD/MM/YYYY') : ''}
          </span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1">
            <EyeOutlined style={{ fontSize: 11 }} />
            {Number(post.viewCount || 0).toLocaleString('vi-VN')}
          </span>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
