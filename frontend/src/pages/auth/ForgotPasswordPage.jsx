import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { MailOutlined, CheckCircleFilled } from '@ant-design/icons';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import customerApi from '../../services/customerApi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const handleSubmit = async () => {
    if (loading) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError('Email không hợp lệ');
      return;
    }
    setLoading(true);
    try {
      const res = await customerApi.forgotPassword(email.trim());
      if (res.status === 'success') {
        setSent(true);
        // In development the backend returns the reset token directly
        // (no email service) — surface it so the flow stays usable.
        setDevToken(res.data?.resetToken || null);
      }
    } catch (err) {
      message.error(err || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      side={{
        eyebrow: 'KHÔI PHỤC TÀI KHOẢN',
        headline: 'Quên mật khẩu? Không sao.',
        body: 'Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu để bạn truy cập lại an toàn.',
      }}
    >
      {sent ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 rounded-[10px] bg-vxn-bg-soft p-4">
            <div className="flex items-center gap-2.5">
              <CheckCircleFilled style={{ fontSize: 18, color: '#047857' }} />
              <span className="text-[14px] font-semibold text-vxn-ink">
                Đã gửi yêu cầu đặt lại mật khẩu
              </span>
            </div>
            <p className="m-0 pl-7 text-[13px] leading-[1.55] text-vxn-fg-3">
              Nếu <span className="font-medium text-vxn-fg-2">{email.trim()}</span>{' '}
              khớp với một tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu
              trong ít phút. Kiểm tra cả hộp thư spam.
            </p>
          </div>

          {devToken && (
            <div className="rounded-[10px] border border-dashed border-vxn-border bg-white p-4">
              <p className="m-0 text-[12px] font-medium text-vxn-fg-4">
                Môi trường thử nghiệm — chưa có dịch vụ email
              </p>
              <p className="m-0 mt-1 text-[12px] leading-[1.5] text-vxn-fg-3">
                Hệ thống trả thẳng liên kết đặt lại để bạn tiếp tục:
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate(`/reset-password?token=${encodeURIComponent(devToken)}`)
                }
                className="mt-3 h-11 w-full rounded-[10px] border-0 text-[14px] font-semibold text-white transition hover:opacity-95"
                style={{ background: '#036672' }}
              >
                Đặt lại mật khẩu ngay →
              </button>
            </div>
          )}

          <Link
            to="/login"
            className="text-center text-[13px] font-medium text-vxn-teal-800 hover:text-vxn-teal-700"
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <>
          <h1 className="m-0 text-[32px] font-semibold tracking-tight text-vxn-ink">
            Quên mật khẩu?
          </h1>
          <p className="m-0 mb-7 mt-2 text-[14px] leading-[1.5] text-vxn-fg-3">
            Nhập email tài khoản — chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </p>

          <div className="flex flex-col gap-4">
            <AuthField
              label="Email tài khoản"
              name="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                setError(undefined);
              }}
              icon={MailOutlined}
              placeholder="email@vidu.com"
              autoComplete="email"
              error={error}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="h-12 w-full rounded-[10px] border-0 text-[15px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              style={{ background: '#036672' }}
            >
              {loading ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}
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

export default ForgotPasswordPage;
