import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import {
  IdcardOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import useTripManagerAuthStore from '../../store/tripManagerAuthStore';
import api from '../../services/api';
import heroLandscape from '../../assets/brand/hero-landscape.jpg';
import logoMark from '../../assets/brand/logo-icon_background_white.svg';

const iconStyle = { fontSize: 16, color: '#5E6165', opacity: 0.7 };

const TripManagerLoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useTripManagerAuthStore();

  const validate = () => {
    const next = {};
    if (!employeeCode.trim()) next.employeeCode = 'Vui lòng nhập mã nhân viên';
    if (!password) next.password = 'Vui lòng nhập mật khẩu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const response = await api.post('/employees/login', {
        employeeCode: employeeCode.trim(),
        password,
      });
      if (response.status === 'success') {
        const { token, employee } = response.data;
        if (employee.role !== 'trip_manager' && employee.role !== 'driver') {
          message.error('Bạn không có quyền truy cập trang này');
          return;
        }
        login({ ...employee, role: employee.role }, token);
        message.success('Đăng nhập thành công');
        navigate('/trip-manager/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
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
      {/* Photo + soft staff overlay */}
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
            'linear-gradient(120deg, rgba(0,40,55,.55) 0%, rgba(43,126,173,.35) 50%, rgba(0,40,55,.7) 100%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <img src={logoMark} alt="Vé Xe Nhanh" className="h-14 w-auto" />
        </Link>
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-104px)] max-w-[1280px] grid-cols-1 items-center gap-10 px-8 pb-16 lg:grid-cols-[1fr_400px] lg:gap-12 lg:px-16">
        {/* Left welcome copy */}
        <div className="hidden flex-col gap-5 text-white lg:flex">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: 'rgba(43,126,173,.95)', color: '#fff' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white opacity-90" />
            Nhân viên
          </span>
          <h1
            className="m-0 text-[42px] font-bold leading-[1.15] tracking-[-0.01em]"
            style={{ textShadow: '0 2px 24px rgba(0,40,55,.35)' }}
          >
            Chào ca làm,
            <br />
            chúc một ngày suôn&nbsp;sẻ.
          </h1>
        </div>

        {/* Compact corner card */}
        <div
          className="rounded-[8px] bg-white p-8 sm:p-9"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0,0,0,.4)',
          }}
        >
          <div
            className="text-[16px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: '#2B7EAD' }}
          >
            Đăng nhập
          </div>
          <h2 className="m-0 mb-5 mt-1.5 text-[22px] font-bold" style={{ color: '#181C22' }}>
            Bắt đầu ca làm
          </h2>

          <div className="flex flex-col gap-3.5">
            <Field
              label="Mã nhân viên"
              required
              hint={!errors.employeeCode ? 'Ví dụ: NV-00482' : undefined}
              error={errors.employeeCode}
            >
              <InputBox
                value={employeeCode}
                onChange={(v) => setEmployeeCode(v.toUpperCase())}
                placeholder="NV-00482"
                leadingIcon={<IdcardOutlined style={iconStyle} />}
                onKeyDown={onEnter}
                autoFocus
                fontWeight={500}
                error={!!errors.employeeCode}
              />
            </Field>
            <Field label="Mật khẩu" required error={errors.password}>
              <InputBox
                type={reveal ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="••••••"
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

            <button
              type="button"
              onClick={() => setTrustDevice((t) => !t)}
              className="-mt-1 inline-flex cursor-pointer items-center gap-2 self-start border-0 bg-transparent p-0 text-[13px]"
              style={{ color: '#404753' }}
            >
              <span
                className="grid h-4 w-4 place-items-center rounded-[4px] transition-colors"
                style={{
                  background: trustDevice ? '#2B7EAD' : '#fff',
                  border: `1px solid ${trustDevice ? '#2B7EAD' : '#CBD5E1'}`,
                }}
              >
                {trustDevice && (
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
              Đây là thiết bị cá nhân (giữ đăng nhập)
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="mt-1 h-[46px] w-full cursor-pointer rounded-[4px] border-0 text-[15px] font-semibold text-white transition disabled:opacity-60"
              style={{
                background: '#2B7EAD',
                boxShadow: '0 10px 15px -3px rgba(0,100,129,0.2)',
              }}
            >
              {loading ? 'Đang đăng nhập…' : 'Vào ca làm việc'}
            </button>
          </div>

          <div
            className="mt-5 flex items-center justify-center border-t pt-4 text-[12px]"
            style={{ borderColor: '#DFE2EC', color: '#64748B' }}
          >
            <span>Quên mã/mật khẩu? Liên hệ quản lý ca.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Local primitives ──────────────────────────────────────────────────

const Field = ({ label, required, error, hint, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="flex items-center gap-1 text-[13px] font-medium" style={{ color: '#404753' }}>
      {label}
      {required && <span style={{ color: '#DC2626' }}>*</span>}
    </span>
    {children}
    {(error || hint) && (
      <span className="text-[12px]" style={{ color: error ? '#DC2626' : '#64748B' }}>
        {error || hint}
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
  fontWeight = 400,
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
        fontWeight,
        color: '#181C22',
        fontFamily: 'inherit',
      }}
    />
    {trailing}
  </div>
);

export default TripManagerLoginPage;
