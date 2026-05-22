import { Link, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  ThunderboltOutlined,
  StarOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import heroLandscape from '../../assets/brand/hero-landscape.jpg';
import logoMark from '../../assets/brand/logo-icon_background_white.svg';

// Full VXN logo (icon + wordmark) — light variant for the white form panel.
const BrandMark = () => (
  <Link to="/" className="flex w-fit items-center" aria-label="Về trang chủ Vé Xe Nhanh">
    <img src={logoMark} alt="Vé Xe Nhanh" className="h-14 w-auto" />
  </Link>
);

// Honest capability highlights — every one maps to a real feature of the app.
const DEFAULT_POINTS = [
  { icon: ThunderboltOutlined, label: 'Đặt vé nhanh' },
  { icon: StarOutlined, label: 'Tích điểm thành viên' },
  { icon: QrcodeOutlined, label: 'Tra cứu vé bằng OTP' },
];

/**
 * Full-bleed split-screen auth layout.
 * Left = brand + form (children); right = hero image + value proposition.
 * Collapses to a single centred column below the `lg` breakpoint.
 */
const AuthShell = ({
  side = {},
  children,
  contentMaxWidth = 420,
}) => {
  const navigate = useNavigate();
  const {
    eyebrow = 'CẨM NANG · ƯU ĐÃI · TÍCH ĐIỂM',
    headline = 'Đi xa hơn với mỗi hành trình.',
    body = 'Đặt vé, tích điểm thành viên và theo dõi mọi chuyến đi trong một tài khoản.',
    points = DEFAULT_POINTS,
  } = side;

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Left — brand + form */}
      <div className="relative flex min-h-screen flex-col gap-7 px-6 py-10 sm:px-12 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between gap-4">
          <BrandMark />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-vxn-border bg-white px-3 text-[13px] font-medium text-vxn-fg-2 shadow-sm transition hover:border-vxn-teal-700 hover:text-vxn-teal-700"
          >
            <HomeOutlined />
            Trang chủ
          </button>
        </div>

        <div
          className="mx-auto flex w-full flex-1 flex-col justify-center"
          style={{ maxWidth: contentMaxWidth }}
        >
          {children}
        </div>

        <div className="mx-auto flex w-full max-w-[520px] items-center justify-between text-[12px] text-vxn-fg-5 lg:absolute lg:bottom-8 lg:left-16 lg:right-16 lg:mx-0 lg:max-w-none">
          <span>© 2026 Vé Xe Nhanh JSC</span>
          <span className="flex gap-1.5">
            <button
              type="button"
              onClick={() => navigate('/faq')}
              className="border-0 bg-transparent p-0 text-vxn-fg-3 hover:text-vxn-teal-700"
            >
              Trợ giúp
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => navigate('/tin-tuc')}
              className="border-0 bg-transparent p-0 text-vxn-fg-3 hover:text-vxn-teal-700"
            >
              Cẩm nang
            </button>
          </span>
        </div>
      </div>

      {/* Right — hero panel (hidden on small screens) */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,71,107,.45) 0%, rgba(0,40,60,.68) 100%), url(${heroLandscape})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex h-full flex-col justify-between px-14 py-12 text-white">
          <div className="flex h-14 items-center">
            <span
              className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white"
              style={{ background: '#E89B26' }}
            >
              {eyebrow}
            </span>
          </div>
          <div>
            <h2 className="m-0 max-w-[480px] text-[38px] font-semibold leading-[1.15] tracking-tight">
              {headline}
            </h2>
            <p className="m-0 mb-8 mt-3.5 max-w-[460px] text-[16px] leading-[1.5] text-white/85">
              {body}
            </p>
            <div className="flex gap-3">
              {points.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3.5 backdrop-blur"
                  style={{ background: 'rgba(255,255,255,.12)' }}
                >
                  <Icon style={{ fontSize: 18, color: '#F8BF4E' }} />
                  <span className="text-[13px] font-medium text-white/90">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
