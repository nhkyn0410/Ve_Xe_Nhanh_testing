import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import useAdminAuthStore from '../../store/adminAuthStore';
import { adminAuth } from '../../services/adminApi';
import heroLandscape from '../../assets/brand/hero-landscape.jpg';
import logoMark from '../../assets/brand/logo-icon_background_white.svg';

const iconStyle = { fontSize: 16, color: '#5E6165', opacity: 0.7 };

const AdminLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAdminAuthStore();

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
      const response = await adminAuth.login({ email: email.trim(), password });
      if (response.status === 'success') {
        const { user, accessToken } = response.data;
        login(user, accessToken);
        message.success('Đăng nhập thành công!');
        navigate('/admin/dashboard');
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
      {/* Photo + deep teal overlay */}
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
          background:
            'linear-gradient(120deg, rgba(0,40,55,.85) 0%, rgba(0,40,55,.6) 60%, rgba(0,40,55,.85) 100%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <AdminBrand />
        <div
          className="flex items-center gap-4 text-[13px] font-medium"
          style={{ color: 'rgba(255,255,255,.8)' }}
        >
          <span>v1.1</span>
          <span style={{ color: 'rgba(255,255,255,.35)' }}>·</span>
          <span className="cursor-default">Tài liệu</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-104px)] max-w-[1280px] grid-cols-1 items-center gap-10 px-8 pb-16 lg:grid-cols-[1fr_400px] lg:gap-12 lg:px-16">
        {/* Left admin tone copy */}
        <div className="hidden flex-col gap-4 text-white lg:flex">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: 'rgba(0,71,107,.92)', color: '#fff' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white opacity-90" />
            Internal · Admin
          </span>
          <h1 className="m-0 text-[38px] font-bold leading-[1.2] tracking-[-0.01em]">
            Vé Xe Nhanh
            <br />
            Admin Portal
          </h1>
          <p
            className="m-0 max-w-[400px] text-[14px] leading-[1.6]"
            style={{ color: 'rgba(255,255,255,.78)' }}
          >
            Bảng điều khiển dành riêng cho quản trị viên Vé Xe Nhanh. Truy cập được giám sát và lưu
            vết.
          </p>
          <div className="mt-2 text-[12px]" style={{ color: 'rgba(255,255,255,.55)' }}>
            © 2026 Vé Xe Nhanh JSC · Tất cả hoạt động đăng nhập được ghi nhận.
          </div>
        </div>

        {/* Compact corner card */}
        <div
          className="rounded-[8px] bg-white p-8 sm:p-9"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0,0,0,.5)',
          }}
        >
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: '#00476B' }}
          >
            Admin Sign-in
          </div>
          <h2 className="m-0 mb-6 mt-1.5 text-[22px] font-bold" style={{ color: '#181C22' }}>
            Đăng nhập quản trị
          </h2>

          <div className="flex flex-col gap-3.5">
            <Field label="Email quản trị viên" required error={errors.email}>
              <InputBox
                value={email}
                onChange={setEmail}
                placeholder="admin@vexenhanh.vn"
                leadingIcon={<MailOutlined style={iconStyle} />}
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
                leadingIcon={<LockOutlined style={iconStyle} />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="grid h-6 w-6 cursor-pointer place-items-center border-0 bg-transparent p-0"
                    aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {reveal ? (
                      <EyeInvisibleOutlined style={iconStyle} />
                    ) : (
                      <EyeOutlined style={iconStyle} />
                    )}
                  </button>
                }
                onKeyDown={onEnter}
                error={!!errors.password}
              />
            </Field>

            <div
              className="flex items-center justify-center gap-1.5 rounded-[8px] border px-3 py-2 text-center text-[12px]"
              style={{ borderColor: '#DFE2EC', color: '#64748B', background: '#F9F9FF' }}
            >
              <SafetyOutlined style={{ fontSize: 14, opacity: 0.7 }} />
              Kết nối được mã hóa · TLS 1.3
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="mt-1 h-[46px] w-full cursor-pointer rounded-[4px] border-0 text-[15px] font-semibold text-white transition disabled:opacity-60"
              style={{
                background: '#00476B',
                boxShadow: '0 10px 15px -3px rgba(0,100,129,0.2)',
              }}
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Local primitives ──────────────────────────────────────────────────

const AdminBrand = () => (
  <Link to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
    <img src={logoMark} alt="Vé Xe Nhanh" className="h-14 w-auto" />
  </Link>
);

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

export default AdminLoginPage;
