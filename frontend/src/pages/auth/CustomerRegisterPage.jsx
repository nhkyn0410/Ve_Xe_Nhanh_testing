import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
} from '@ant-design/icons';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import PasswordStrength, {
  scorePassword,
} from '../../components/auth/PasswordStrength';
import useAuthStore from '../../store/authStore';
import customerApi from '../../services/customerApi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9}$/;

const CustomerRegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2)
      next.fullName = 'Vui lòng nhập họ và tên';
    if (!EMAIL_RE.test(form.email.trim()))
      next.email = 'Email không hợp lệ';
    if (!PHONE_RE.test(form.phone.trim()))
      next.phone = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0';
    const { checks } = scorePassword(form.password);
    if (!(checks.length && checks.upper && checks.digit))
      next.password = 'Tối thiểu 8 ký tự, gồm chữ hoa và số';
    if (form.confirmPassword !== form.password)
      next.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (!agree) next.agree = 'Vui lòng đồng ý với điều khoản dịch vụ';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const response = await customerApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      if (response.status === 'success') {
        const { user, accessToken } = response.data;
        login({ ...user, role: 'customer' }, accessToken);
        message.success('Đăng ký thành công! Chào mừng bạn đến với Vé Xe Nhanh.');
        navigate('/');
      }
    } catch (error) {
      message.error(error || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      contentMaxWidth={480}
      side={{
        eyebrow: 'MIỄN PHÍ · TÍCH ĐIỂM MỖI CHUYẾN',
        headline: 'Tạo tài khoản miễn phí.',
        body: 'Tài khoản VXN giúp bạn đặt vé nhanh hơn, tích điểm thành viên sau mỗi chuyến đi và quản lý mọi hành trình ở một nơi.',
      }}
    >
      <h1 className="m-0 text-[32px] font-semibold tracking-tight text-vxn-ink">
        Tạo tài khoản VXN
      </h1>
      <p className="m-0 mb-6 mt-2 text-[14px] text-vxn-fg-3">
        Đã có tài khoản?{' '}
        <Link
          to="/login"
          className="font-medium text-vxn-teal-800 hover:text-vxn-teal-700"
        >
          Đăng nhập →
        </Link>
      </p>

      <div className="flex flex-col gap-3.5">
        <AuthField
          label="Họ và tên"
          name="fullName"
          value={form.fullName}
          onChange={set('fullName')}
          icon={UserOutlined}
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          error={errors.fullName}
          autoFocus
        />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AuthField
            label="Email"
            name="email"
            value={form.email}
            onChange={set('email')}
            icon={MailOutlined}
            placeholder="email@vidu.com"
            autoComplete="email"
            error={errors.email}
          />
          <AuthField
            label="Số điện thoại"
            name="phone"
            value={form.phone}
            onChange={set('phone')}
            icon={PhoneOutlined}
            placeholder="09xxxxxxxx"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
            error={errors.phone}
          />
        </div>
        <div>
          <AuthField
            label="Mật khẩu"
            name="password"
            type="password"
            value={form.password}
            onChange={set('password')}
            icon={LockOutlined}
            placeholder="Tạo mật khẩu"
            autoComplete="new-password"
            error={errors.password}
            hint={
              form.password ? undefined : 'Tối thiểu 8 ký tự · gồm chữ hoa & số'
            }
          />
          {form.password && (
            <div className="mt-2">
              <PasswordStrength value={form.password} />
            </div>
          )}
        </div>
        <AuthField
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          icon={LockOutlined}
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <div>
          <button
            type="button"
            onClick={() => {
              setAgree((a) => !a);
              setErrors((e) => ({ ...e, agree: undefined }));
            }}
            className="flex items-start gap-2.5 border-0 bg-transparent p-0 text-left text-[13px] leading-[1.5] text-vxn-fg-2"
          >
            <span
              className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded transition-colors"
              style={{
                background: agree ? '#E89B26' : '#fff',
                border: agree ? '1.5px solid #E89B26' : '1.5px solid #DFE2EC',
              }}
            >
              {agree && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
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
            <span>
              Tôi đồng ý với{' '}
              <Link to="/faq" className="text-vxn-teal-800 hover:underline">
                Điều khoản dịch vụ
              </Link>{' '}
              và{' '}
              <Link to="/faq" className="text-vxn-teal-800 hover:underline">
                Chính sách quyền riêng tư
              </Link>{' '}
              của Vé Xe Nhanh.
            </span>
          </button>
          {errors.agree && (
            <span className="mt-1 block text-[12px] text-[#DC2626]">
              {errors.agree}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-1.5 h-12 w-full rounded-[10px] border-0 text-[15px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          style={{ background: '#E89B26' }}
        >
          {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
        </button>
      </div>
    </AuthShell>
  );
};

export default CustomerRegisterPage;
