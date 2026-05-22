import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircleOutlined,
  BookOutlined,
  MailOutlined,
  PhoneOutlined,
  DownloadOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Bus } from 'lucide-react';
import heroLandscape from '../../assets/brand/hero-landscape.jpg';
import logoMark from '../../assets/brand/logo-icon_background_white.svg';

const OperatorRegisterSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Submission context — passed from OperatorRegisterPage via navigate state.
  const {
    companyName = 'Nhà xe Phương Trang',
    email = 'lienhe@phuongtrang.vn',
    submittedAt,
  } = location.state || {};

  // SLA target = 24h after submission. Stable per-mount via useMemo so the
  // displayed value doesn't drift on rerenders.
  const slaText = useMemo(() => {
    const submitted = submittedAt ? new Date(submittedAt) : new Date();
    const target = new Date(submitted.getTime() + 24 * 60 * 60 * 1000);
    const hh = String(target.getHours()).padStart(2, '0');
    const mm = String(target.getMinutes()).padStart(2, '0');
    const today = new Date();
    const sameDay = target.toDateString() === today.toDateString();
    return sameDay ? `${hh}:${mm} hôm nay` : `${hh}:${mm} ngày mai`;
  }, [submittedAt]);

  // Reproducible-looking receipt code derived from time so each session
  // shows a stable value (avoids hydration jitter).
  const receiptCode = useMemo(() => {
    const submitted = submittedAt ? new Date(submittedAt) : new Date();
    const yy = submitted.getFullYear();
    const ord = Math.floor((submitted.getTime() / 1000) % 99999)
      .toString()
      .padStart(5, '0');
    return `VXN-${yy}-${ord}`;
  }, [submittedAt]);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ fontFamily: 'Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Photo + dark overlay (Variant B aesthetic) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${heroLandscape})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,40,55,.7) 0%, rgba(0,40,55,.78) 100%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <img src={logoMark} alt="Vé Xe Nhanh" className="h-14 w-auto" />
        </Link>
        <div
          className="hidden items-center gap-4 text-[13px] font-medium sm:flex"
          style={{ color: 'rgba(255,255,255,.85)' }}
        >
          <span>Tài liệu hướng dẫn</span>
          <span style={{ color: 'rgba(255,255,255,.3)' }}>·</span>
          <span>Hotline 1900 6067</span>
        </div>
      </div>

      {/* Centered card */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-120px)] items-center justify-center px-4 pb-10 sm:px-8 lg:px-16">
        <div
          className="w-full max-w-[820px] rounded-[14px] bg-white px-7 py-9 text-center sm:px-12 sm:py-10 lg:px-14"
          style={{ boxShadow: '0 32px 80px -16px rgba(0,0,0,.5)' }}
        >
          {/* Success badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em]"
            style={{ background: '#ECFDF3', color: '#007A4F' }}
          >
            <CheckCircleOutlined style={{ fontSize: 14 }} />
            Đã gửi thành công
          </div>

          <h1
            className="m-0 mt-5 text-[28px] font-bold leading-[1.2] tracking-[-0.015em] sm:text-[36px]"
            style={{ color: '#181C22' }}
          >
            Cảm ơn <span style={{ color: '#00476B' }}>{companyName}</span>!
          </h1>
          <p
            className="m-0 mx-auto mt-2 max-w-[560px] text-[14px] leading-[1.55] sm:text-[15px]"
            style={{ color: '#475569' }}
          >
            Hồ sơ của bạn đã đến tay đội duyệt. Hãy chuẩn bị sẵn sàng để cung cấp thêm thông tin nếu
            cần thiết và chờ email phản hồi từ chúng tôi.
          </p>

          {/* SLA countdown card */}
          <div
            className="mx-auto mt-7 flex max-w-[600px] items-center gap-4 rounded-[12px] border p-4 text-left sm:gap-[18px] sm:p-[18px]"
            style={{
              background: 'linear-gradient(135deg, #FFF7E6 0%, #FFEAC7 100%)',
              borderColor: '#F3D9A4',
            }}
          >
            <div
              className="grid h-16 w-16 flex-none place-items-center rounded-full"
              style={{
                background: 'linear-gradient(135deg, #FFEAC7 0%, #F3B132 100%)',
                boxShadow: '0 8px 24px -8px rgba(232,155,38,.55)',
              }}
            >
              <Bus size={28} color="#9B6518" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div
                className="text-[12px] font-medium uppercase tracking-[0.06em]"
                style={{ color: '#D18A1E' }}
              >
                Dự kiến phản hồi
              </div>
              <div
                className="m-0 mb-0.5 mt-1 text-[20px] font-bold sm:text-[22px]"
                style={{ color: '#181C22' }}
              >
                Trước <span style={{ color: '#D18A1E' }}>{slaText}</span>
              </div>
              <div className="text-[12px]" style={{ color: '#475569' }}>
                Cam kết phản hồi trong vòng 24 giờ làm việc.
              </div>
            </div>
          </div>

          {/* What to do next */}
          <div className="mt-7 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
            <NextStep
              Icon={BookOutlined}
              title="Đọc hướng dẫn"
              body="Sổ tay đối tác giúp bạn lên kế hoạch tuyến và giá vé."
            />
            <NextStep
              Icon={MailOutlined}
              title="Kiểm tra hộp thư"
              body={`Email xác nhận đã được gửi tới ${email}.`}
            />
            <NextStep
              Icon={PhoneOutlined}
              title="Liên hệ hỗ trợ"
              body="Hotline 1900 6067 nếu hồ sơ cần bổ sung gấp."
            />
          </div>

          {/* Primary CTA — Về trang chủ */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-7 inline-flex h-[46px] cursor-pointer items-center justify-center gap-2 rounded-[4px] border-0 px-6 text-[15px] font-semibold text-white"
            style={{
              background: '#00506A',
              boxShadow: '0 10px 15px -3px rgba(0,100,129,0.2)',
            }}
          >
            <HomeOutlined style={{ fontSize: 16 }} />
            Về trang chủ
          </button>

          {/* Footer · receipt meta */}
          <div
            className="mt-7 flex flex-col items-center justify-between gap-2 border-t pt-4 text-[13px] sm:flex-row"
            style={{ borderColor: '#DFE2EC', color: '#475569' }}
          >
            <span>
              Mã hồ sơ:{' '}
              <strong
                style={{
                  color: '#181C22',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                }}
              >
                {receiptCode}
              </strong>
            </span>
            <span
              className="inline-flex cursor-default items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: '#00476B' }}
            >
              Tải biên nhận PDF
              <DownloadOutlined style={{ fontSize: 13 }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NextStep = ({ Icon, title, body }) => (
  <div
    className="rounded-[10px] border p-3.5"
    style={{ background: '#F9F9FF', borderColor: '#DFE2EC' }}
  >
    <div
      className="mb-2.5 grid h-8 w-8 place-items-center rounded-[8px]"
      style={{ background: '#D4E3FF' }}
    >
      <Icon style={{ fontSize: 16, color: '#00476B' }} />
    </div>
    <div className="text-[13px] font-semibold" style={{ color: '#181C22' }}>
      {title}
    </div>
    <div className="mt-1 text-[12px] leading-[1.5]" style={{ color: '#475569' }}>
      {body}
    </div>
  </div>
);

export default OperatorRegisterSuccessPage;
