import {
  CheckCircleFilled,
  CloseCircleFilled,
  WarningFilled,
} from '@ant-design/icons';

const VARIANT_CONFIG = {
  success: {
    label: 'SUCCESS',
    title: 'Thanh toán thành công',
    sub: 'Vé điện tử đã được gửi tới email và SMS của bạn.',
    Icon: CheckCircleFilled,
    iconColor: '#0F8458',
    bgColor: '#E8F8EF',
    accentBar: '#0F8458',
    chipBg: '#D6F1E2',
    chipFg: '#0F8458',
  },
  failure: {
    label: 'FAILURE',
    title: 'Thanh toán thất bại',
    sub: 'Ngân hàng đã từ chối giao dịch. Ghế vẫn được giữ trong vài phút — bạn có thể thử lại.',
    Icon: CloseCircleFilled,
    iconColor: '#C0392B',
    bgColor: '#FDECEA',
    accentBar: '#C0392B',
    chipBg: '#F8D7D3',
    chipFg: '#C0392B',
  },
  error: {
    label: 'ERROR',
    title: 'Có lỗi từ cổng thanh toán',
    sub: 'Hệ thống tạm thời gián đoạn. Đơn hàng chưa bị trừ tiền.',
    Icon: WarningFilled,
    iconColor: '#B7791F',
    bgColor: '#FEF3C7',
    accentBar: '#B7791F',
    chipBg: '#FDE7B6',
    chipFg: '#92561A',
  },
};

const isMonoLabel = (label = '') =>
  /mã|code|gd/i.test(label);

const PaymentResultCard = ({
  kind = 'success',
  title,
  subtitle,
  data = [],
  ctas = [],
  className = '',
}) => {
  const cfg = VARIANT_CONFIG[kind] || VARIANT_CONFIG.success;
  const Icon = cfg.Icon;
  const headerTitle = title || cfg.title;
  const headerSub = subtitle || cfg.sub;

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-2xl border border-vxn-border bg-white shadow-sm ${className}`}
    >
      <div
        className="flex flex-col items-center gap-3 px-7 py-9 text-center"
        style={{
          background: cfg.bgColor,
          borderBottom: `4px solid ${cfg.accentBar}`,
        }}
      >
        <div
          className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white"
          style={{ boxShadow: `0 0 0 6px ${cfg.bgColor}` }}
        >
          <Icon style={{ fontSize: 40, color: cfg.iconColor }} />
        </div>
        <h2 className="m-0 text-[22px] font-semibold tracking-tight text-vxn-ink">
          {headerTitle}
        </h2>
        <p className="m-0 max-w-[320px] text-[13px] leading-5 text-vxn-fg-3">
          {headerSub}
        </p>
        <span
          className="mt-1 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em]"
          style={{ background: cfg.chipBg, color: cfg.chipFg }}
        >
          {cfg.label}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-6 py-6">
        {data.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="text-vxn-fg-4">{label}</span>
            <span
              className={`text-right font-medium text-vxn-ink ${
                isMonoLabel(label) ? 'font-mono tracking-tight' : ''
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {ctas.length > 0 && (
        <div className="mt-auto flex flex-col gap-2.5 px-6 pb-6">
          {ctas.map(({ kind: btnKind = 'primary', label, onClick, disabled }) => {
            const isSaffron = btnKind === 'saffron';
            const isGhost = btnKind === 'ghost';
            const base =
              'h-11 rounded-lg border text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60';
            const tone = isSaffron
              ? 'border-vxn-saffron-600 bg-vxn-saffron-600 text-white hover:bg-vxn-saffron-700'
              : isGhost
                ? 'border-vxn-border-strong bg-white text-vxn-ink hover:bg-vxn-bg-mist'
                : 'border-vxn-teal-700 bg-vxn-teal-700 text-white hover:bg-vxn-teal-800';
            return (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`${base} ${tone}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentResultCard;
