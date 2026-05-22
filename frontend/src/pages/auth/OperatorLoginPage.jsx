import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import { MailOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Bus } from 'lucide-react';
import useOperatorAuthStore from '../../store/operatorAuthStore';
import { operatorAuth } from '../../services/operatorApi';
import heroLandscape from '../../assets/brand/hero-landscape.jpg';
import logoMark from '../../assets/brand/logo-icon_background_white.svg';

const OperatorLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useOperatorAuthStore();

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Email không hợp lệ';
    if (!password) next.password = 'Vui lòng nhập mật khẩu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const response = await operatorAuth.login({ email: email.trim(), password });
      if (response.status === 'success') {
        const { operator, accessToken } = response.data;
        login({ ...operator, role: 'operator' }, accessToken);
        message.success('Đăng nhập thành công!');
        navigate('/operator/dashboard');
      }
    } catch (error) {
      message.error(
        error?.message || error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onEnter = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ fontFamily: 'Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Full-bleed background photo + overlay */}
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
          background: 'linear-gradient(180deg, rgba(0,40,55,.3) 0%, rgba(0,40,55,.6) 100%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoMark} alt="Vé Xe Nhanh" className="h-14 w-auto" />
        </Link>
        <div className="inline-flex h-8 items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 text-[13px] font-medium text-white backdrop-blur">
          <span
            className="grid h-3.5 w-[22px] place-items-center rounded-sm"
            style={{ background: '#DA251D' }}
          >
            <span style={{ color: '#FFCD00', fontSize: 9, lineHeight: 1 }}>★</span>
          </span>
          VI
        </div>
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-104px)] max-w-[1280px] grid-cols-1 items-center gap-10 px-8 pb-16 lg:grid-cols-[1fr_440px] lg:gap-16 lg:px-16">
        {/* Left — cinematic marketing block */}
        <div className="hidden text-white lg:block">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
            style={{ background: 'rgba(232,155,38,.95)' }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: '#fff', opacity: 0.9 }}
            />
            Cổng nhà xe
          </span>
          <h1
            className="m-0 mt-5 text-[56px] font-bold leading-[1.05] tracking-[-0.02em]"
            style={{ textShadow: '0 2px 32px rgba(0,40,55,.4)' }}
          >
            Mỗi chuyến xe
            <br />
            là một <span style={{ color: '#F3B132' }}>hành trình</span>
            <br />
            đáng được&nbsp;quản lý&nbsp;tốt.
          </h1>
          <p className="m-0 mt-5 max-w-[460px] text-[17px] leading-[1.5] text-white/85">
            Đăng nhập để theo dõi lịch trình, lấp đầy ghế trống và đối soát doanh thu trong một bảng
            điều khiển duy nhất.
          </p>
          <div
            className="mt-7 flex gap-7 border-t pt-5"
            style={{ borderColor: 'rgba(255,255,255,.18)' }}
          >
            {[
              ['480+', 'nhà xe đang dùng'],
              ['12k', 'chuyến mỗi tuần'],
              ['98%', 'đối soát tự động'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-[28px] font-bold text-white">{n}</div>
                <div className="text-[12px] text-white/70">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — floating card */}
        <div
          className="flex flex-col rounded-[10px] bg-white/[0.97] p-8 sm:p-9"
          style={{
            backdropFilter: 'blur(12px)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,.45)',
          }}
        >
          <h2 className="m-0 text-[26px] font-bold tracking-[-0.01em]" style={{ color: '#181C22' }}>
            Đăng nhập nhà xe
          </h2>
          <p className="m-0 mb-6 mt-1.5 text-[14px]" style={{ color: '#475569' }}>
            Dùng tài khoản đối tác đã được xác minh.
          </p>

          <div className="flex flex-col gap-4">
            <Field label="Email doanh nghiệp" required error={errors.email}>
              <InputBox
                value={email}
                onChange={setEmail}
                placeholder="lienhe@phuongtrang.vn"
                leadingIcon={
                  <MailOutlined style={{ fontSize: 16, color: '#5E6165', opacity: 0.7 }} />
                }
                onKeyDown={onEnter}
                autoFocus
                error={!!errors.email}
              />
            </Field>
            <Field label="Mật khẩu" required error={errors.password}>
              <InputBox
                type={reveal ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="••••••••••"
                leadingIcon={
                  <LockOutlined style={{ fontSize: 16, color: '#5E6165', opacity: 0.7 }} />
                }
                trailing={
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="grid h-6 w-6 cursor-pointer place-items-center border-0 bg-transparent p-0"
                    aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {reveal ? (
                      <EyeInvisibleOutlined
                        style={{ fontSize: 16, color: '#5E6165', opacity: 0.7 }}
                      />
                    ) : (
                      <EyeOutlined style={{ fontSize: 16, color: '#5E6165', opacity: 0.7 }} />
                    )}
                  </button>
                }
                onKeyDown={onEnter}
                error={!!errors.password}
              />
            </Field>

            <div className="-mt-0.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRemember((r) => !r)}
                className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-[13px]"
                style={{ color: '#404753' }}
              >
                <span
                  className="grid h-4 w-4 place-items-center rounded-[4px] transition-colors"
                  style={{
                    background: remember ? '#00506A' : '#fff',
                    border: `1px solid ${remember ? '#00506A' : '#CBD5E1'}`,
                  }}
                >
                  {remember && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                Giữ đăng nhập 14 ngày
              </button>
              <Link
                to="/forgot-password"
                className="text-[13px] font-medium hover:opacity-80"
                style={{ color: '#00476B', textDecoration: 'none' }}
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="h-[46px] w-full cursor-pointer rounded-[4px] border-0 text-[15px] font-semibold text-white transition disabled:opacity-60"
              style={{
                background: '#00506A',
                boxShadow: '0 10px 15px -3px rgba(0,100,129,0.2)',
              }}
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </div>

          {/* Sub-card — register CTA (saffron gradient) */}
          <div
            className="mt-8 flex items-center gap-3.5 rounded-[10px] border p-4"
            style={{
              background: 'linear-gradient(135deg, #FFF7E6 0%, #FFEAC7 100%)',
              borderColor: '#F3D9A4',
            }}
          >
            <div
              className="grid h-11 w-11 flex-none place-items-center rounded-[10px]"
              style={{ background: '#E89B26' }}
            >
              <Bus className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold" style={{ color: '#181C22' }}>
                Trở thành đối tác
              </div>
              <div className="mt-0.5 text-[12px]" style={{ color: '#475569' }}>
                Đăng ký nhà xe trong 5 phút, kích hoạt sau 1 ngày.
              </div>
            </div>
            <Link
              to="/operator/register"
              className="grid h-[34px] flex-none cursor-pointer place-items-center rounded-[4px] border-0 px-3.5 text-[13px] font-semibold text-white"
              style={{ background: '#E89B26', textDecoration: 'none' }}
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Local primitives ──────────────────────────────────────────────────
const Field = ({ label, required, error, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="flex items-center gap-1 text-[13px] font-medium" style={{ color: '#404753' }}>
      {label}
      {required && <span style={{ color: '#DC2626' }}>*</span>}
    </span>
    {children}
    {error && (
      <span className="text-[12px]" style={{ color: '#DC2626' }}>
        {error}
      </span>
    )}
  </label>
);

const InputBox = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  leadingIcon,
  trailing,
  onKeyDown,
  autoFocus,
  error,
}) => (
  <div
    className="flex h-[42px] items-center gap-2 rounded-[8px] bg-white px-3"
    style={{
      border: `1px solid ${error ? '#DC2626' : '#DFE2EC'}`,
    }}
  >
    {leadingIcon}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        flex: 1,
        minWidth: 0,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        padding: 0,
        fontSize: 14,
        fontWeight: 400,
        color: '#181C22',
        fontFamily: 'inherit',
      }}
    />
    {trailing}
  </div>
);

export default OperatorLoginPage;
