import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { MailOutlined, LockOutlined, QrcodeOutlined } from '@ant-design/icons';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import useAuthStore from '../../store/authStore';
import customerApi from '../../services/customerApi';

const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const from = location.state?.from?.pathname || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!identifier.trim()) next.identifier = 'Vui lòng nhập email hoặc số điện thoại';
    if (!password) next.password = 'Vui lòng nhập mật khẩu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const response = await customerApi.login({
        identifier: identifier.trim(),
        password,
        rememberMe: remember,
      });
      if (response.status === 'success') {
        const { user, accessToken } = response.data;
        login({ ...user, role: 'customer' }, accessToken);
        message.success('Đăng nhập thành công!');
        navigate(from, { replace: true });
      }
    } catch (error) {
      message.error(
        error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onEnter = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <AuthShell
      side={{
        eyebrow: 'TÍCH ĐIỂM · ƯU ĐÃI THÀNH VIÊN',
        headline: 'Chào mừng trở lại.',
        body: 'Đăng nhập để tích điểm, đặt vé nhanh và theo dõi mọi chuyến đi trong một tài khoản.',
      }}
    >
      <h1 className="m-0 text-[32px] font-semibold tracking-tight text-vxn-ink">
        Đăng nhập
      </h1>
      <p className="m-0 mb-7 mt-2 text-[14px] text-vxn-fg-3">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="font-medium text-vxn-teal-800 hover:text-vxn-teal-700"
        >
          Đăng ký miễn phí →
        </Link>
      </p>

      <div className="flex flex-col gap-4">
        <AuthField
          label="Email hoặc số điện thoại"
          name="identifier"
          value={identifier}
          onChange={(v) => setIdentifier(v)}
          icon={MailOutlined}
          placeholder="email@vidu.com hoặc 09xxxxxxxx"
          autoComplete="username"
          error={errors.identifier}
          onKeyDown={onEnter}
          autoFocus
        />
        <AuthField
          label="Mật khẩu"
          name="password"
          type="password"
          value={password}
          onChange={(v) => setPassword(v)}
          icon={LockOutlined}
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          error={errors.password}
          onKeyDown={onEnter}
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRemember((r) => !r)}
            className="inline-flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] text-vxn-fg-2"
          >
            <span
              className="grid h-[18px] w-[18px] place-items-center rounded transition-colors"
              style={{
                background: remember ? '#E89B26' : '#fff',
                border: remember ? '1.5px solid #E89B26' : '1.5px solid #DFE2EC',
              }}
            >
              {remember && (
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
            Ghi nhớ đăng nhập
          </button>
          <Link
            to="/forgot-password"
            className="text-[13px] font-medium text-vxn-teal-800 hover:text-vxn-teal-700"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 h-12 w-full rounded-[10px] border-0 text-[15px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          style={{ background: '#036672' }}
        >
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-[10px] bg-vxn-bg-soft p-3.5">
        <QrcodeOutlined style={{ fontSize: 18, color: '#E89B26', marginTop: 2 }} />
        <div className="text-[12px] leading-[1.5] text-vxn-fg-3">
          Đặt vé không cần tài khoản?{' '}
          <Link
            to="/tra-cuu-ve"
            className="font-medium text-vxn-teal-800 hover:text-vxn-teal-700"
          >
            Tra cứu vé bằng mã đặt chỗ →
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default CustomerLoginPage;
