import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { LockOutlined, CheckCircleFilled, WarningFilled } from '@ant-design/icons';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import PasswordStrength, {
  scorePassword,
} from '../../components/auth/PasswordStrength';
import customerApi from '../../services/customerApi';

const SIDE = {
  eyebrow: 'ĐẶT LẠI MẬT KHẨU',
  headline: 'Chọn mật khẩu mới.',
  body: 'Hãy chọn một mật khẩu đủ mạnh để giữ tài khoản và lịch sử chuyến đi của bạn an toàn.',
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const next = {};
    const { checks } = scorePassword(password);
    if (!(checks.length && checks.upper && checks.digit))
      next.password = 'Tối thiểu 8 ký tự, gồm chữ hoa và số';
    if (confirm !== password)
      next.confirm = 'Mật khẩu xác nhận không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const res = await customerApi.resetPassword(token, password);
      if (res.status === 'success') setDone(true);
    } catch (err) {
      message.error(
        err || 'Liên kết đặt lại không hợp lệ hoặc đã hết hạn.'
      );
    } finally {
      setLoading(false);
    }
  };

  // No token → the link is invalid / opened directly.
  if (!token) {
    return (
      <AuthShell side={SIDE}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 rounded-[10px] bg-vxn-bg-soft p-4">
            <div className="flex items-center gap-2.5">
              <WarningFilled style={{ fontSize: 18, color: '#E89B26' }} />
              <span className="text-[14px] font-semibold text-vxn-ink">
                Liên kết không hợp lệ
              </span>
            </div>
            <p className="m-0 pl-7 text-[13px] leading-[1.55] text-vxn-fg-3">
              Liên kết đặt lại mật khẩu thiếu mã xác thực hoặc đã hết hạn. Hãy
              yêu cầu một liên kết mới.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="h-12 w-full rounded-[10px] border-0 text-[15px] font-semibold text-white transition hover:opacity-95"
            style={{ background: '#036672' }}
          >
            Yêu cầu liên kết mới
          </button>
          <Link
            to="/login"
            className="text-center text-[13px] font-medium text-vxn-teal-800 hover:text-vxn-teal-700"
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell side={SIDE}>
      {done ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 rounded-[10px] bg-vxn-bg-soft p-4">
            <div className="flex items-center gap-2.5">
              <CheckCircleFilled style={{ fontSize: 18, color: '#047857' }} />
              <span className="text-[14px] font-semibold text-vxn-ink">
                Đặt lại mật khẩu thành công
              </span>
            </div>
            <p className="m-0 pl-7 text-[13px] leading-[1.55] text-vxn-fg-3">
              Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại bằng mật khẩu
              mới.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="h-12 w-full rounded-[10px] border-0 text-[15px] font-semibold text-white transition hover:opacity-95"
            style={{ background: '#036672' }}
          >
            Đăng nhập ngay →
          </button>
        </div>
      ) : (
        <>
          <h1 className="m-0 text-[32px] font-semibold tracking-tight text-vxn-ink">
            Đặt mật khẩu mới
          </h1>
          <p className="m-0 mb-7 mt-2 text-[14px] leading-[1.5] text-vxn-fg-3">
            Liên kết đã được xác thực. Hãy chọn một mật khẩu mới mạnh hơn.
          </p>

          <div className="flex flex-col gap-3.5">
            <div>
              <AuthField
                label="Mật khẩu mới"
                name="password"
                type="password"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  setErrors((e) => ({ ...e, password: undefined }));
                }}
                icon={LockOutlined}
                placeholder="Tạo mật khẩu mới"
                autoComplete="new-password"
                error={errors.password}
                hint={password ? undefined : 'Tối thiểu 8 ký tự · gồm chữ hoa & số'}
                autoFocus
              />
              {password && (
                <div className="mt-2">
                  <PasswordStrength value={password} />
                </div>
              )}
            </div>
            <AuthField
              label="Xác nhận mật khẩu"
              name="confirm"
              type="password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                setErrors((e) => ({ ...e, confirm: undefined }));
              }}
              icon={LockOutlined}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              error={errors.confirm}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="mt-1.5 h-12 w-full rounded-[10px] border-0 text-[15px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              style={{ background: '#036672' }}
            >
              {loading ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}
            </button>
            <Link
              to="/login"
              className="text-center text-[13px] font-medium text-vxn-teal-800 hover:text-vxn-teal-700"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
};

export default ResetPasswordPage;
