import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  BankOutlined,
  UploadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { operatorAuth } from '../../services/operatorApi';
import heroLandscape from '../../assets/brand/hero-landscape.jpg';
import logoMark from '../../assets/brand/logo-icon_background_white.svg';

const iconStyle = { fontSize: 16, color: '#5E6165', opacity: 0.7 };

const OperatorRegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [reveal2, setReveal2] = useState(false);
  const [agree, setAgree] = useState(true);
  const [form, setForm] = useState({
    companyName: '',
    taxCode: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [errors, setErrors] = useState({});

  const update = (k) => (v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.companyName.trim() || form.companyName.trim().length < 3)
      e.companyName = 'Tên nhà xe phải có ít nhất 3 ký tự';
    if (!form.taxCode.trim()) e.taxCode = 'Vui lòng nhập mã số thuế';
    else if (!/^[0-9]{10}(-[0-9]{3})?$/.test(form.taxCode.trim()))
      e.taxCode = 'Mã số thuế không hợp lệ';
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9]{10,11}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Số điện thoại phải có 10-11 chữ số';
    if (!form.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Email không hợp lệ';
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ trụ sở';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 8) e.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Mật khẩu không khớp';
    if (!agree) e.agree = 'Vui lòng đồng ý điều khoản đối tác';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (loading || !validate()) return;
    setLoading(true);
    try {
      const payload = {
        companyName: form.companyName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\s/g, ''),
        password: form.password,
        taxCode: form.taxCode.trim(),
        address: form.address.trim(),
        businessLicense: licenseFile ? licenseFile.name : 'pending-upload',
      };
      const response = await operatorAuth.register(payload);
      if (response.status === 'success') {
        message.success('Đăng ký thành công! Tài khoản đang chờ xét duyệt.');
        navigate('/operator/register-success', {
          state: {
            companyName: payload.companyName,
            email: payload.email,
            submittedAt: new Date().toISOString(),
          },
          replace: true,
        });
      }
    } catch (error) {
      message.error(error?.message || error || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        message.error('Tệp vượt quá 5MB');
        return;
      }
      setLicenseFile(f);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ fontFamily: 'Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Photo background */}
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
            'linear-gradient(95deg, rgba(0,40,55,.25) 0%, rgba(0,40,55,.55) 60%, rgba(0,40,55,.85) 100%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoMark} alt="Vé Xe Nhanh" className="h-14 w-auto" />
        </Link>
        <div className="flex items-center gap-5">
          <span className="hidden text-[13px] sm:inline" style={{ color: 'rgba(255,255,255,.8)' }}>
            Đã có tài khoản?
          </span>
          <Link
            to="/operator/login"
            className="grid h-9 cursor-pointer place-items-center rounded-[4px] border px-4 text-[13px] font-semibold backdrop-blur"
            style={{
              background: 'rgba(255,255,255,.14)',
              borderColor: 'rgba(255,255,255,.3)',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-100px)] max-w-[1280px] grid-cols-1 items-start gap-10 px-8 pb-12 lg:grid-cols-[340px_1fr] lg:gap-12 lg:px-16">
        {/* Marketing side */}
        <div className="flex flex-col gap-5 text-white lg:pt-4">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: 'rgba(232,155,38,.95)', color: '#fff' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white opacity-90" />
            Đăng ký nhà xe · Miễn phí
          </span>
          <h1 className="m-0 text-[36px] font-bold leading-[1.18] tracking-[-0.01em]">
            Mở bán vé trực tuyến trong&nbsp;24 giờ.
          </h1>
          <div className="mt-2 flex flex-col gap-[18px]">
            <MarketingPoint
              Icon={CheckCircleOutlined}
              title="Xác minh nhanh"
              body="Đội ngũ duyệt hồ sơ trong vòng 1 ngày làm việc."
            />
            <MarketingPoint
              Icon={RiseOutlined}
              title="Tăng tỷ lệ lấp đầy"
              body="Hiển thị trên vexenhanh.vn và mạng lưới đại lý."
            />
            <MarketingPoint
              Icon={BarChartOutlined}
              title="Báo cáo doanh thu"
              body="Đối soát tự động, xuất hóa đơn điện tử."
            />
          </div>
          <div
            className="mt-4 inline-flex w-fit items-center gap-3 rounded-[8px] border px-4 py-3.5 backdrop-blur"
            style={{
              background: 'rgba(255,255,255,.08)',
              borderColor: 'rgba(255,255,255,.18)',
            }}
          >
            <PhoneOutlined style={{ color: '#fff', opacity: 0.85 }} />
            <span className="text-[13px] font-medium text-white">
              Hotline đối tác: <strong>1900 6067</strong>
            </span>
          </div>
        </div>

        {/* Big card · right */}
        <div
          className="flex max-h-[calc(100vh-140px)] flex-col gap-4 overflow-y-auto rounded-[10px] bg-white p-7 sm:p-9"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0,0,0,.45)',
          }}
        >
          <div>
            <h2
              className="m-0 mt-1.5 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: '#181C22' }}
            >
              Đăng ký tài khoản nhà xe
            </h2>
            <p className="m-0 mt-1.5 text-[14px]" style={{ color: '#475569' }}>
              Cung cấp thông tin doanh nghiệp để chúng tôi xác minh và kích hoạt cổng bán vé.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Tên nhà xe" required error={errors.companyName} colSpan={2}>
              <InputBox
                value={form.companyName}
                onChange={update('companyName')}
                placeholder="vd. Công ty TNHH Vận tải Phương Trang"
                leadingIcon={<ShopOutlined style={iconStyle} />}
                error={!!errors.companyName}
              />
            </Field>
            <Field label="Mã số thuế" required error={errors.taxCode}>
              <InputBox
                value={form.taxCode}
                onChange={update('taxCode')}
                placeholder="0301234567"
                leadingIcon={<BankOutlined style={iconStyle} />}
                error={!!errors.taxCode}
              />
            </Field>
            <Field label="Số điện thoại" required error={errors.phone}>
              <InputBox
                value={form.phone}
                onChange={update('phone')}
                placeholder="0901 234 567"
                leadingIcon={<PhoneOutlined style={iconStyle} />}
                error={!!errors.phone}
              />
            </Field>
            <Field label="Email liên hệ" required error={errors.email} colSpan={2}>
              <InputBox
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="lienhe@phuongtrang.vn"
                leadingIcon={<MailOutlined style={iconStyle} />}
                error={!!errors.email}
              />
            </Field>
            <Field label="Địa chỉ trụ sở" required error={errors.address} colSpan={2}>
              <InputBox
                value={form.address}
                onChange={update('address')}
                placeholder="Số 486 Trần Phú, P.5, Q.5, TP.HCM"
                leadingIcon={<EnvironmentOutlined style={iconStyle} />}
                error={!!errors.address}
              />
            </Field>
            <Field
              label="Mật khẩu"
              required
              error={errors.password}
              hint={!errors.password ? 'Tối thiểu 8 ký tự, có chữ và số' : undefined}
            >
              <InputBox
                type={reveal ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••••"
                leadingIcon={<LockOutlined style={iconStyle} />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="grid h-6 w-6 cursor-pointer place-items-center border-0 bg-transparent p-0"
                    aria-label="toggle"
                    tabIndex={-1}
                  >
                    {reveal ? (
                      <EyeInvisibleOutlined style={iconStyle} />
                    ) : (
                      <EyeOutlined style={iconStyle} />
                    )}
                  </button>
                }
                error={!!errors.password}
              />
            </Field>
            <Field
              label="Xác nhận mật khẩu"
              required
              error={errors.confirmPassword}
              hint={!errors.confirmPassword ? 'Nhập lại để xác nhận' : undefined}
            >
              <InputBox
                type={reveal2 ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="••••••••••"
                leadingIcon={<LockOutlined style={iconStyle} />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setReveal2((r) => !r)}
                    className="grid h-6 w-6 cursor-pointer place-items-center border-0 bg-transparent p-0"
                    aria-label="toggle"
                    tabIndex={-1}
                  >
                    {reveal2 ? (
                      <EyeInvisibleOutlined style={iconStyle} />
                    ) : (
                      <EyeOutlined style={iconStyle} />
                    )}
                  </button>
                }
                error={!!errors.confirmPassword}
              />
            </Field>
            <Field
              label="Giấy phép kinh doanh vận tải"
              required
              hint="Tệp PDF hoặc ảnh JPG, tối đa 5MB"
              colSpan={2}
            >
              <FileDrop
                file={licenseFile}
                onPick={onPickFile}
                onClear={() => setLicenseFile(null)}
              />
            </Field>
          </div>

          <div className="mt-2 flex flex-col gap-3.5">
            <button
              type="button"
              onClick={() => setAgree((a) => !a)}
              className="inline-flex cursor-pointer items-start gap-2 border-0 bg-transparent p-0 text-left text-[13px]"
              style={{ color: '#404753' }}
            >
              <span
                className="mt-[1px] grid h-4 w-4 flex-none place-items-center rounded-[4px] transition-colors"
                style={{
                  background: agree ? '#00506A' : '#fff',
                  border: `1px solid ${agree ? '#00506A' : '#CBD5E1'}`,
                }}
              >
                {agree && (
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
              <span>
                Tôi đồng ý với{' '}
                <span
                  style={{
                    color: '#00476B',
                    textDecoration: 'underline',
                  }}
                >
                  Điều khoản đối tác
                </span>{' '}
                và{' '}
                <span
                  style={{
                    color: '#00476B',
                    textDecoration: 'underline',
                  }}
                >
                  Chính sách bảo mật
                </span>
                .
              </span>
            </button>
            {errors.agree && (
              <span className="text-[12px]" style={{ color: '#DC2626' }}>
                {errors.agree}
              </span>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="h-[46px] w-full cursor-pointer rounded-[4px] border-0 text-[15px] font-semibold text-white transition disabled:opacity-60"
              style={{
                background: '#E89B26',
                boxShadow: '0 4px 12px -4px rgba(232,155,38,.45)',
              }}
            >
              {loading ? 'Đang gửi…' : 'Gửi hồ sơ đăng ký'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Local primitives ──────────────────────────────────────────────────

const Field = ({ label, required, error, hint, children, colSpan = 1 }) => (
  <label
    className="flex flex-col gap-1.5"
    style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}
  >
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
      placeholder={placeholder}
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

const FileDrop = ({ file, onPick, onClear }) => {
  const sizeKB = file ? (file.size / 1024).toFixed(0) : null;
  return (
    <div
      className="flex items-center gap-3 rounded-[8px] p-3.5"
      style={{
        border: '1px dashed #CBD5E1',
        background: '#F9F9FF',
      }}
    >
      <div
        className="grid h-10 w-10 flex-none place-items-center rounded-[8px]"
        style={{ background: '#D4E3FF' }}
      >
        <UploadOutlined style={{ fontSize: 18, color: '#475569' }} />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="truncate text-[14px] font-medium" style={{ color: '#181C22' }}>
          {file ? file.name : 'Kéo & thả tệp vào đây hoặc bấm chọn'}
        </div>
        <div className="mt-0.5 text-[12px]" style={{ color: '#64748B' }}>
          {file ? `${sizeKB} KB · Đã chọn` : 'PDF hoặc JPG · tối đa 5MB'}
        </div>
      </div>
      <label
        className="flex h-8 cursor-pointer items-center rounded-[6px] border bg-white px-3.5 text-[13px] font-medium"
        style={{ color: '#404753', borderColor: '#CBD5E1' }}
      >
        {file ? 'Đổi tệp' : 'Chọn tệp'}
        <input
          type="file"
          accept=".pdf,image/jpeg,image/png"
          onChange={onPick}
          className="hidden"
        />
      </label>
      {file && (
        <button
          type="button"
          onClick={onClear}
          className="text-[12px]"
          style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Xoá
        </button>
      )}
    </div>
  );
};

const MarketingPoint = ({ Icon, title, body }) => (
  <div className="flex items-start gap-3.5">
    <div
      className="grid h-9 w-9 flex-none place-items-center rounded-[10px] border backdrop-blur"
      style={{
        background: 'rgba(255,255,255,.14)',
        borderColor: 'rgba(255,255,255,.25)',
      }}
    >
      <Icon style={{ fontSize: 16, color: '#fff' }} />
    </div>
    <div>
      <div className="text-[14px] font-semibold text-white">{title}</div>
      <div className="mt-0.5 text-[13px]" style={{ color: 'rgba(255,255,255,.78)' }}>
        {body}
      </div>
    </div>
  </div>
);

export default OperatorRegisterPage;
