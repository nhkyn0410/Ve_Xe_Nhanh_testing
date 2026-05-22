import { useEffect, useState } from 'react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { getBanners, trackBannerClick, trackBannerView } from '../../services/contentApi';

// Reusable promotional banner strip — sourced from the real
// GET /api/v1/content/banners?position=<position> endpoint (Banner model).
// `position` must be one of the Banner model enum values:
//   homepage | booking | routes | footer
// Renders nothing when there is no active banner (no fabricated placeholder).
const ContentBanners = ({
  position = 'homepage',
  className = '',
  containerClassName = 'mx-auto grid w-full max-w-[1180px] gap-4',
}) => {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let alive = true;
    getBanners(position)
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setBanners(list);
        list.forEach((b) => {
          if (b?._id) trackBannerView(b._id).catch(() => {});
        });
      })
      .catch(() => {
        /* no banner / endpoint unavailable → render nothing */
      });
    return () => {
      alive = false;
    };
  }, [position]);

  if (banners.length === 0) return null;

  const renderMedia = (banner) => (
    <div className="relative w-full overflow-hidden aspect-[16/7] sm:aspect-[1440/400]">
      <picture>
        {banner.mobileImageUrl && (
          <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />
        )}
        <img
          src={banner.imageUrl}
          alt={banner.title || 'Banner'}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </picture>
      {(banner.title || banner.description || (banner.linkUrl && banner.linkText)) && (
        <div className="absolute inset-0 flex flex-col justify-end bg-[linear-gradient(180deg,rgba(0,40,60,0)_35%,rgba(0,40,60,.66)_100%)] p-5 sm:p-7">
          {banner.title && (
            <div className="text-xl font-semibold text-white drop-shadow sm:text-2xl">
              {banner.title}
            </div>
          )}
          {banner.description && (
            <div className="mt-1 max-w-[680px] text-sm text-white/90 drop-shadow sm:text-base">
              {banner.description}
            </div>
          )}
          {banner.linkUrl && banner.linkText && (
            <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-vxn-saffron-500 px-3.5 py-2 text-sm font-semibold text-vxn-ink">
              {banner.linkText}
              <ArrowRightOutlined className="text-[12px]" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className={className}>
      <div className={containerClassName}>
        {banners.map((banner) => {
          const isExternal = /^https?:\/\//i.test(banner.linkUrl || '');
          return (
            <div
              key={banner._id}
              className="group relative overflow-hidden rounded-2xl border border-vxn-border bg-vxn-bg-soft shadow-sm"
            >
              {banner.linkUrl ? (
                <a
                  href={banner.linkUrl}
                  onClick={() => {
                    if (banner._id) trackBannerClick(banner._id).catch(() => {});
                  }}
                  className="block"
                  {...(isExternal
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {renderMedia(banner)}
                </a>
              ) : (
                renderMedia(banner)
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContentBanners;
