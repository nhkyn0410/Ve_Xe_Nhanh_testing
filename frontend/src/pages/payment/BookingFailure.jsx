import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomerShell from '../../components/customer/CustomerShell';
import CustomerBreadcrumb from '../../components/customer/CustomerBreadcrumb';
import PaymentResultCard from '../../components/customer/PaymentResultCard';

const BOOKING_STEPS = [
  { key: 'seats', label: 'Chọn ghế' },
  { key: 'passenger', label: 'Thông tin hành khách' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'done', label: 'Hoàn tất' },
];

const BookingStepper = ({ current = 3 }) => (
  <div className="border-b border-vxn-border bg-white px-4 py-4 lg:px-8">
    <ol className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      {BOOKING_STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < current;
        const active = stepNumber === current;
        return (
          <li key={step.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold ${
                  done || active ? 'bg-vxn-teal-700 text-white' : 'bg-vxn-bg-cloud text-vxn-fg-5'
                }`}
              >
                {done ? <CheckOutlined className="text-[12px]" /> : stepNumber}
              </span>
              <span
                className={`text-sm ${
                  active
                    ? 'font-semibold text-vxn-ink'
                    : done
                      ? 'font-medium text-vxn-fg-2'
                      : 'text-vxn-fg-5'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < BOOKING_STEPS.length - 1 && (
              <span className={`h-px w-10 ${done ? 'bg-vxn-teal-700' : 'bg-vxn-border'}`} />
            )}
          </li>
        );
      })}
    </ol>
  </div>
);

const HINTS = {
  failure: [
    'Thẻ/ ví không đủ số dư',
    'Mã OTP nhập sai hoặc đã hết hạn',
    'Ngân hàng từ chối giao dịch theo chính sách',
    'Đã hết thời gian giữ ghế (10 phút)',
  ],
  error: [
    'Cổng thanh toán đang gián đoạn',
    'Kết nối Internet không ổn định',
    'Giao dịch chưa được ghi nhận, vui lòng thử lại sau ít phút',
    'Nếu đã trừ tiền, hệ thống sẽ tự hoàn trong 24h',
  ],
};

const BookingFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Detect kind: explicit ?kind=error or /payment/error route → error; otherwise failure
  const explicitKind = (searchParams.get('kind') || '').toLowerCase();
  const isErrorRoute = location.pathname.includes('/payment/error');
  const kind = explicitKind === 'error' || isErrorRoute ? 'error' : 'failure';

  const subMessage = searchParams.get('message');
  const bookingCode = searchParams.get('bookingCode') || searchParams.get('orderId');
  const reason = searchParams.get('reason');
  const transactionId =
    searchParams.get('transactionId') || searchParams.get('vnp_TxnRef');

  const failureData = [
    ['Mã đơn', bookingCode || '—'],
    [
      'Lý do',
      reason ||
        subMessage ||
        (kind === 'error'
          ? 'Hệ thống tạm thời gián đoạn'
          : 'Ngân hàng từ chối giao dịch'),
    ],
    ['Mã GD', transactionId || '—'],
  ];

  const errorData = [
    ['Mã đơn', bookingCode || '—'],
    [
      'Lỗi',
      reason || subMessage || 'Connection timeout (HTTP 504)',
    ],
    ['Thời điểm', dayjs().format('DD/MM/YYYY · HH:mm')],
  ];

  const data = kind === 'error' ? errorData : failureData;

  const handleRetry = () => {
    if (bookingCode) {
      navigate(`/booking/passenger-info?retry=${bookingCode}`);
    } else {
      navigate('/');
    }
  };

  const handleSecondary = () => {
    if (kind === 'error') {
      window.open('tel:1900xxxx', '_self');
    } else {
      navigate('/booking/passenger-info');
    }
  };

  return (
    <CustomerShell activeKey="buy">
      <BookingStepper current={3} />

      <div className="px-4 py-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <CustomerBreadcrumb
            className="mb-5"
            items={[
              { label: 'Hành trình', to: '/my-tickets' },
              { label: 'Thanh toán' },
              { label: kind === 'error' ? 'Lỗi cổng' : 'Thất bại' },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
            <PaymentResultCard
              kind={kind}
              subtitle={subMessage || undefined}
              data={data}
              ctas={
                kind === 'error'
                  ? [
                      { kind: 'primary', label: 'Thử lại trong 1 phút', onClick: handleRetry },
                      { kind: 'ghost', label: 'Liên hệ CSKH', onClick: handleSecondary },
                    ]
                  : [
                      { kind: 'primary', label: 'Thử thanh toán lại', onClick: handleRetry },
                      { kind: 'ghost', label: 'Đổi phương thức', onClick: handleSecondary },
                    ]
              }
            />

            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-vxn-border bg-white p-6">
                <h3 className="m-0 text-[16px] font-semibold text-vxn-ink">
                  {kind === 'error'
                    ? 'Bạn có thể thử các bước sau'
                    : 'Một số nguyên nhân thường gặp'}
                </h3>
                <ul className="mt-4 space-y-2.5 text-[13.5px] text-vxn-fg-2">
                  {HINTS[kind].map((hint) => (
                    <li key={hint} className="flex items-start gap-2.5">
                      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-vxn-teal-700" />
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-vxn-border bg-vxn-bg-mist p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-vxn-teal-700 text-white">
                    ?
                  </div>
                  <div>
                    <p className="m-0 text-[14px] font-semibold text-vxn-ink">
                      Cần hỗ trợ ngay?
                    </p>
                    <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                      Hotline CSKH:{' '}
                      <a
                        href="tel:1900xxxx"
                        className="font-semibold text-vxn-teal-700"
                      >
                        1900 xxxx
                      </a>{' '}
                      · Trực 24/7
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
};

export default BookingFailure;
