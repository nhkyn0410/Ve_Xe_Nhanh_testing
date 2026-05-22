import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Spin } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import AuthShell from '../../components/auth/AuthShell';
import customerApi from '../../services/customerApi';

const SIDE = {
  eyebrow: 'XÁC THỰC EMAIL',
  headline: 'Kích hoạt tài khoản.',
  body: 'Xác thực email giúp bảo vệ tài khoản và nhận thông báo về chuyến đi của bạn.',
};

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [email, setEmail] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const res = await customerApi.verifyEmail(token);
        if (res.status === 'success') {
          setEmail(res.data?.user?.email || '');
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        setErrMsg(typeof err === 'string' ? err : 'Xác thực email thất bại.');
        setStatus('error');
      }
    })();
  }, [token]);

  return (
    <AuthShell side={SIDE}>
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Spin size="large" />
          <p className="m-0 text-[14px] text-vxn-fg-3">
            Đang xác thực email của bạn…
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col gap-5">
          <h1 className="m-0 text-[32px] font-semibold tracking-tight text-vxn-ink">
            Xác thực thành công
          </h1>
          <div className="flex flex-col gap-2 rounded-[10px] bg-vxn-bg-soft p-4">
            <div className="flex items-center gap-2.5">
              <CheckCircleFilled style={{ fontSize: 18, color: '#047857' }} />
              <span className="text-[14px] font-semibold text-vxn-ink">
                {email ? (
                  <>
                    Email{' '}
                    <span className="text-vxn-teal-800">{email}</span> đã được
                    xác thực
                  </>
                ) : (
                  'Email của bạn đã được xác thực'
                )}
              </span>
            </div>
            <p className="m-0 pl-7 text-[13px] leading-[1.55] text-vxn-fg-3">
              Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập và bắt
              đầu đặt vé.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="h-12 w-full rounded-[10px] border-0 text-[15px] font-semibold text-white transition hover:opacity-95"
            style={{ background: '#E89B26' }}
          >
            Đăng nhập ngay →
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="h-12 w-full rounded-[10px] border border-vxn-border bg-white text-[15px] font-semibold text-vxn-fg-2 transition hover:border-vxn-teal-700 hover:text-vxn-teal-700"
          >
            Về trang chủ
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col gap-5">
          <h1 className="m-0 text-[32px] font-semibold tracking-tight text-vxn-ink">
            Không thể xác thực
          </h1>
          <div className="flex flex-col gap-2 rounded-[10px] bg-vxn-bg-soft p-4">
            <div className="flex items-center gap-2.5">
              <CloseCircleFilled style={{ fontSize: 18, color: '#DC2626' }} />
              <span className="text-[14px] font-semibold text-vxn-ink">
                Liên kết xác thực không hợp lệ
              </span>
            </div>
            <p className="m-0 pl-7 text-[13px] leading-[1.55] text-vxn-fg-3">
              {errMsg ||
                'Liên kết xác thực đã hết hạn hoặc đã được sử dụng. Hãy đăng nhập để yêu cầu gửi lại.'}
            </p>
          </div>
          <Link
            to="/login"
            className="grid h-12 w-full place-items-center rounded-[10px] border-0 text-[15px] font-semibold text-white transition hover:opacity-95"
            style={{ background: '#036672' }}
          >
            Về trang đăng nhập
          </Link>
        </div>
      )}
    </AuthShell>
  );
};

export default VerifyEmailPage;
