import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Upload,
  message,
} from 'antd';
import {
  BellOutlined,
  CameraOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  DeleteOutlined,
  EditOutlined,
  GiftOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  PhoneOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomerShell from '../../components/customer/CustomerShell';
import CustomerBreadcrumb from '../../components/customer/CustomerBreadcrumb';
import {
  ACCOUNT_MENU_ITEMS,
  accountBreadcrumbItem,
} from '../../components/customer/accountMenu';
import useAuthStore from '../../store/authStore';
import {
  addSavedPassenger,
  changePassword,
  deleteAvatar,
  getUserProfile,
  removeSavedPassenger,
  updateProfile,
  uploadAvatar,
} from '../../services/customerApi';
import { getCustomerTickets } from '../../services/ticketApi';

// ============================================================================
// Constants & helpers
// ============================================================================

const TIER_META = {
  bronze: { label: 'HẠNG BRONZE', tone: '#8C5A2C', bg: '#FCE9D2' },
  silver: { label: 'HẠNG SILVER', tone: '#5B6470', bg: '#E2E8F0' },
  gold: { label: 'HẠNG GOLD', tone: '#A8741A', bg: '#FFE9C4' },
  platinum: { label: 'HẠNG PLATINUM', tone: '#0F8458', bg: '#D1FAE5' },
};

const GENDER_LABEL = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
};

const formatDateLong = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '—');

const formatMonthYear = (value) => (value ? dayjs(value).format('[tháng] M, YYYY') : '—');

const initialsOf = (name = '') => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

const maskIdCard = (id = '') => {
  if (!id) return '';
  const trimmed = String(id).trim();
  if (trimmed.length <= 6) return trimmed;
  return `${trimmed.slice(0, 6)}••••${trimmed.slice(-4)}`;
};

const getResponseUser = (response) => response?.data?.user || response?.user || null;

// ============================================================================
// Account sidebar
// ============================================================================

const SIDEBAR_ITEMS = [
  { key: 'profile', label: 'Hồ sơ', icon: UserOutlined, scroll: 'top' },
  { key: 'passengers', label: 'Hành khách đã lưu', icon: TeamOutlined, scroll: 'passengers' },
  { key: 'security', label: 'Bảo mật', icon: SafetyCertificateOutlined, scroll: 'security' },
  { key: 'payment', label: 'Thanh toán', icon: CreditCardOutlined, soon: true },
  { key: 'voucher-wallet', label: 'Ví voucher', icon: GiftOutlined, path: '/voucher-wallet' },
  { key: 'notifications', label: 'Thông báo', icon: BellOutlined, soon: true },
  { key: 'reviews', label: 'Đánh giá của tôi', icon: EditOutlined, path: '/my-reviews' },
  { key: 'help', label: 'Hỗ trợ', icon: QuestionCircleOutlined, path: '/khieu-nai' },
];

const AccountSidebar = ({ activeKey = 'profile', onScrollTo, onNavigate }) => {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 flex flex-col gap-1">
        <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-vxn-fg-5">
          Tài khoản
        </div>
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.soon) {
                  message.info('Tính năng sắp ra mắt');
                  return;
                }
                if (item.path) {
                  onNavigate?.(item.path);
                  return;
                }
                onScrollTo?.(item.scroll);
              }}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-left text-[13px] transition ${
                isActive
                  ? 'border border-vxn-border bg-white font-semibold text-vxn-ink shadow-sm'
                  : 'border border-transparent bg-transparent font-medium text-vxn-fg-3 hover:bg-vxn-bg-mist hover:text-vxn-ink'
              }`}
            >
              <Icon
                style={{
                  fontSize: 16,
                  color: isActive ? '#E89B26' : '#94A3B8',
                }}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.soon && (
                <span className="rounded-full bg-vxn-bg-mist px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-vxn-fg-4">
                  Sắp ra mắt
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

const AccountFeatureGrid = ({ onNavigate }) => {
  const actions = ACCOUNT_MENU_ITEMS.filter((item) => item.key !== 'profile');

  return (
    <section className="rounded-2xl border border-vxn-border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-[16px] font-semibold text-vxn-ink">
            Tiện ích tài khoản
          </h3>
          <p className="m-0 mt-0.5 text-[12px] text-vxn-fg-4">
            Chuyển nhanh đến các chức năng cá nhân thường dùng.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.to)}
              className="group flex items-start gap-3 rounded-xl border border-vxn-border bg-vxn-bg-soft p-4 text-left transition hover:-translate-y-0.5 hover:border-vxn-saffron-300 hover:bg-white hover:shadow-sm"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-vxn-teal-700 shadow-sm transition group-hover:bg-vxn-saffron-50 group-hover:text-vxn-saffron-700">
                <Icon style={{ fontSize: 17 }} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-vxn-ink">
                  {item.label}
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-vxn-fg-4">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

// ============================================================================
// Hero card
// ============================================================================

const HeroCard = ({ profile, totalTrips, uploading, uploadProps }) => {
  const tier = TIER_META[profile?.loyaltyTier] || TIER_META.bronze;
  const initial = initialsOf(profile?.fullName || profile?.email || 'KH');

  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-vxn-border bg-white p-6 shadow-sm sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-7">
      {/* Avatar with pencil overlay */}
      <div className="relative justify-self-center lg:justify-self-start">
        <Upload {...uploadProps}>
          <button
            type="button"
            className="relative grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-full border-0 text-white shadow-[0_8px_24px_-6px_rgba(232,155,38,.4)]"
            style={{
              background: profile?.avatar
                ? `url(${profile.avatar}) center/cover`
                : 'linear-gradient(135deg, #E89B26 0%, #A8741A 100%)',
              font: '600 36px var(--font-display, "Be Vietnam Pro")',
            }}
            aria-label="Thay đổi ảnh đại diện"
          >
            {!profile?.avatar && initial}
            {uploading && (
              <span className="absolute inset-0 grid place-items-center bg-black/40">
                <Spin />
              </span>
            )}
          </button>
        </Upload>
        <Upload {...uploadProps}>
          <span className="absolute bottom-0.5 right-0.5 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-white text-vxn-fg-2 shadow-[0_2px_6px_rgba(0,0,0,.15)]">
            <CameraOutlined style={{ fontSize: 12 }} />
          </span>
        </Upload>
      </div>

      {/* Identity */}
      <div className="text-center lg:text-left">
        <h2 className="m-0 text-[22px] font-semibold leading-tight text-vxn-ink sm:text-[24px]">
          {profile?.fullName || 'Khách hàng'}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-vxn-fg-3 lg:justify-start">
          {profile?.email && (
            <span className="inline-flex items-center gap-1.5">
              <MailOutlined style={{ fontSize: 13 }} />
              {profile.email}
            </span>
          )}
          {profile?.email && profile?.phone && <span className="text-vxn-fg-5">·</span>}
          {profile?.phone && (
            <span className="inline-flex items-center gap-1.5">
              <PhoneOutlined style={{ fontSize: 13 }} />
              {profile.phone}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: tier.bg, color: tier.tone }}
          >
            <StarFilled style={{ fontSize: 11 }} /> {tier.label}
          </span>
          {profile?.isEmailVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircleFilled style={{ fontSize: 11 }} /> Email đã xác thực
            </span>
          )}
          {profile?.isPhoneVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircleFilled style={{ fontSize: 11 }} /> SĐT đã xác thực
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 border-t border-dashed border-vxn-border pt-4 text-center sm:grid-cols-2 lg:border-l lg:border-t-0 lg:border-dashed lg:pl-6 lg:pt-0 lg:text-right">
        <div>
          <div className="text-[11px] tracking-wide text-vxn-fg-5">Thành viên từ</div>
          <div className="mt-0.5 text-[14px] font-semibold text-vxn-ink">
            {formatMonthYear(profile?.createdAt)}
          </div>
        </div>
        <div>
          <div className="text-[11px] tracking-wide text-vxn-fg-5">Đã đi cùng VXN</div>
          <div className="mt-0.5 text-[20px] font-bold text-vxn-saffron-700 sm:text-[22px]">
            {totalTrips ?? '—'}{' '}
            <span className="text-[12px] font-medium text-vxn-fg-4">chuyến</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Pair (read-only field)
// ============================================================================

const Pair = ({ label, value, verified }) => (
  <div>
    <div className="text-[12px] font-medium text-vxn-fg-5">{label}</div>
    <div className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-vxn-ink">
      <span className="truncate">{value || '—'}</span>
      {verified && <CheckCircleFilled style={{ fontSize: 14, color: '#0F8458' }} />}
    </div>
  </div>
);

// ============================================================================
// Personal info card
// ============================================================================

const PersonalInfoCard = ({ profile, onEdit }) => (
  <section
    id="profile-section"
    className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm sm:p-7"
  >
    <div className="mb-5 flex items-center justify-between gap-2">
      <div>
        <h3 className="m-0 text-[18px] font-semibold text-vxn-ink">Thông tin cá nhân</h3>
        <p className="m-0 mt-1 text-[12.5px] text-vxn-fg-4">
          Email và SĐT đã xác thực sẽ được dùng để gửi vé và OTP.
        </p>
      </div>
      <Button
        type="text"
        icon={<EditOutlined />}
        onClick={onEdit}
        className="!text-[13px] !font-medium !text-vxn-teal-700"
      >
        Chỉnh sửa
      </Button>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Pair label="Họ và tên" value={profile?.fullName} />
      <Pair
        label="Ngày sinh"
        value={profile?.dateOfBirth ? formatDateLong(profile.dateOfBirth) : ''}
      />
      <Pair label="Giới tính" value={GENDER_LABEL[profile?.gender] || ''} />
      <Pair label="CMND/CCCD" value={profile?.idCard ? maskIdCard(profile.idCard) : ''} />
      <Pair label="Email" value={profile?.email} verified={profile?.isEmailVerified} />
      <Pair label="Số điện thoại" value={profile?.phone} verified={profile?.isPhoneVerified} />
    </div>
  </section>
);

// ============================================================================
// Saved passengers card
// ============================================================================

const PASSENGER_COLORS = [
  { bg: '#FFE9C4', text: '#A8741A' },
  { bg: '#DBEAFE', text: '#036672' },
  { bg: '#FFE9C4', text: '#A8741A' },
  { bg: '#D1FAE5', text: '#0F8458' },
  { bg: '#FCE9D2', text: '#B86A1B' },
];

const SavedPassengersCard = ({ passengers = [], onAdd, onRemove, removingId }) => {
  const count = passengers.length;
  const max = 5;
  const remaining = Math.max(max - count, 0);

  return (
    <section
      id="passengers-section"
      className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-[18px] font-semibold text-vxn-ink">Hành khách thường đi</h3>
          <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
            Lưu <strong className="text-vxn-ink">{count}/5</strong> hành khách để đặt vé nhanh hơn
            lần sau.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAdd}
          disabled={count >= max}
          className="!h-9 !rounded-lg !text-[13px] !font-semibold"
          style={{ background: '#036672', borderColor: '#036672' }}
        >
          Thêm hành khách
        </Button>
      </div>
      {count === 0 ? (
        <div className="rounded-xl border border-dashed border-vxn-border-strong bg-vxn-bg-soft p-8 text-center">
          <div className="mx-auto mb-2.5 grid h-12 w-12 place-items-center rounded-full bg-vxn-bg-mist">
            <TeamOutlined style={{ fontSize: 20, color: '#94A3B8' }} />
          </div>
          <p className="m-0 text-[13px] text-vxn-fg-3">
            Bạn chưa lưu hành khách nào. Lưu sẵn để bước chọn ghế nhanh hơn ở lần đặt vé sau.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {passengers.map((p, idx) => {
            const color = PASSENGER_COLORS[idx % PASSENGER_COLORS.length];
            const lastInitial = p.fullName?.split(' ').filter(Boolean).slice(-1)[0]?.[0] || '?';
            const isRemoving = removingId === p._id;
            return (
              <div
                key={p._id || `${p.fullName}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-vxn-border bg-white p-4 transition hover:border-vxn-saffron-300"
              >
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-semibold"
                  style={{ background: color.bg, color: color.text }}
                >
                  {lastInitial.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-vxn-ink">
                    {p.fullName}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-vxn-fg-5">
                    {p.phone} · {maskIdCard(p.idCard)}
                  </div>
                </div>
                <Popconfirm
                  title="Xoá hành khách?"
                  description={`Xoá "${p.fullName}" khỏi danh sách lưu sẵn?`}
                  okText="Xoá"
                  cancelText="Đóng"
                  okButtonProps={{ danger: true, loading: isRemoving }}
                  onConfirm={() => onRemove(p._id)}
                  placement="topRight"
                >
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-vxn-fg-4 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Xoá ${p.fullName}`}
                    disabled={isRemoving}
                  >
                    <DeleteOutlined style={{ fontSize: 14 }} />
                  </button>
                </Popconfirm>
              </div>
            );
          })}
          {remaining > 0 && (
            <button
              type="button"
              onClick={onAdd}
              className="grid place-items-center gap-2 rounded-xl border border-dashed border-vxn-border-strong bg-vxn-bg-soft p-4 text-[13px] font-medium text-vxn-fg-4 transition hover:border-vxn-saffron-400 hover:bg-vxn-saffron-50/40 hover:text-vxn-saffron-700"
            >
              <div className="flex items-center gap-2">
                <PlusOutlined style={{ fontSize: 14 }} />
                Còn {remaining} vị trí — thêm hành khách
              </div>
            </button>
          )}
        </div>
      )}
    </section>
  );
};

// ============================================================================
// Security card
// ============================================================================

const SecurityRow = ({ title, subtitle, actionLabel, onAction, disabled, badge }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-vxn-bg-soft p-4">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-medium text-vxn-ink">{title}</span>
        {badge && (
          <span className="rounded-full bg-vxn-bg-mist px-2 py-0.5 text-[10px] font-semibold tracking-wide text-vxn-fg-4">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[12px] text-vxn-fg-5">{subtitle}</div>
    </div>
    <Button
      type="text"
      onClick={onAction}
      disabled={disabled}
      className="!h-9 !rounded-lg !text-[13px] !font-semibold !text-vxn-teal-700 disabled:!text-vxn-fg-5"
    >
      {actionLabel}
    </Button>
  </div>
);

const SecurityCard = ({ profile, onChangePassword }) => (
  <section
    id="security-section"
    className="rounded-2xl border border-vxn-border bg-white p-6 shadow-sm sm:p-7"
  >
    <div className="mb-5 flex items-center justify-between gap-2">
      <h3 className="m-0 text-[18px] font-semibold text-vxn-ink">Bảo mật</h3>
    </div>
    <div className="flex flex-col gap-2.5">
      <SecurityRow
        title="Mật khẩu"
        subtitle={
          profile?.passwordChangedAt
            ? `Đã đổi ${dayjs(profile.passwordChangedAt).fromNow?.() || `cách đây ${dayjs().diff(dayjs(profile.passwordChangedAt), 'day')} ngày`}`
            : 'Bảo vệ tài khoản bằng mật khẩu mạnh, đổi định kỳ 90 ngày.'
        }
        actionLabel="Đổi mật khẩu"
        onAction={onChangePassword}
      />
      <SecurityRow
        title="Xác thực 2 lớp (2FA)"
        subtitle="Bảo vệ tài khoản bằng OTP gửi qua SMS hoặc Authenticator."
        actionLabel="Bật"
        disabled
        badge="Sắp ra mắt"
      />
      <SecurityRow
        title="Phiên đăng nhập"
        subtitle="Quản lý các thiết bị đang đăng nhập vào tài khoản."
        actionLabel="Quản lý"
        disabled
        badge="Sắp ra mắt"
      />
    </div>
  </section>
);

// ============================================================================
// Modals: edit profile / change password / add passenger
// ============================================================================

const EditProfileModal = ({ open, profile, onCancel, onSubmit, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && profile) {
      form.setFieldsValue({
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
      });
    }
  }, [open, profile, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <EditOutlined style={{ color: '#036672' }} />
          <span>Chỉnh sửa thông tin cá nhân</span>
        </div>
      }
      onCancel={onCancel}
      onOk={handleOk}
      okText="Lưu thay đổi"
      cancelText="Đóng"
      confirmLoading={loading}
      destroyOnHidden
      centered
      width={560}
    >
      <Form form={form} layout="vertical" preserve={false} className="mt-2">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên' },
              { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              {
                pattern: /^0\d{9}$/,
                message: 'SĐT phải bắt đầu bằng 0 và có 10 chữ số',
              },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="0901 234 567" />
          </Form.Item>
          <Form.Item name="dateOfBirth" label="Ngày sinh">
            <DatePicker
              className="!w-full"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
              disabledDate={(c) => c && c > dayjs().endOf('day')}
            />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select
              allowClear
              placeholder="Chọn giới tính"
              options={[
                { value: 'male', label: 'Nam' },
                { value: 'female', label: 'Nữ' },
                { value: 'other', label: 'Khác' },
              ]}
            />
          </Form.Item>
        </div>
        <Form.Item label="Email">
          <Input prefix={<MailOutlined />} value={profile?.email || ''} disabled />
        </Form.Item>
        <p className="m-0 -mt-2 text-[12px] text-vxn-fg-5">
          Email là định danh chính, không thể thay đổi. Liên hệ hỗ trợ nếu cần cập nhật.
        </p>
      </Form>
    </Modal>
  );
};

const ChangePasswordModal = ({ open, onCancel, onSubmit, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) form.resetFields();
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <LockOutlined style={{ color: '#036672' }} />
          <span>Đổi mật khẩu</span>
        </div>
      }
      onCancel={onCancel}
      onOk={handleOk}
      okText="Đổi mật khẩu"
      cancelText="Đóng"
      confirmLoading={loading}
      destroyOnHidden
      centered
      width={480}
    >
      <Form form={form} layout="vertical" preserve={false} className="mt-2">
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: 'Phải có chữ hoa, chữ thường và số',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Tối thiểu 6 ký tự, có chữ hoa & số"
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Nhập lại mật khẩu mới"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const AddPassengerModal = ({ open, onCancel, onSubmit, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) form.resetFields();
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <TeamOutlined style={{ color: '#036672' }} />
          <span>Thêm hành khách thường đi</span>
        </div>
      }
      onCancel={onCancel}
      onOk={handleOk}
      okText="Lưu hành khách"
      cancelText="Đóng"
      confirmLoading={loading}
      destroyOnHidden
      centered
      width={500}
    >
      <Form form={form} layout="vertical" preserve={false} className="mt-2">
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[
            { required: true, message: 'Vui lòng nhập họ tên' },
            { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Trần Văn B" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            {
              pattern: /^0\d{9}$/,
              message: 'SĐT phải bắt đầu bằng 0 và có 10 chữ số',
            },
          ]}
        >
          <Input prefix={<MobileOutlined />} placeholder="0901 234 567" />
        </Form.Item>
        <Form.Item
          name="idCard"
          label="CMND / CCCD"
          rules={[
            { required: true, message: 'Vui lòng nhập CMND/CCCD' },
            {
              pattern: /^\d{9}(\d{3})?$/,
              message: 'CMND 9 số hoặc CCCD 12 số',
            },
          ]}
        >
          <Input prefix={<IdcardOutlined />} placeholder="0790951234567" maxLength={12} />
        </Form.Item>
        <p className="m-0 -mt-1 text-[12px] text-vxn-fg-5">
          Thông tin được mã hoá và chỉ dùng để điền nhanh khi đặt vé. Tối đa 5 hành khách.
        </p>
      </Form>
    </Modal>
  );
};

// ============================================================================
// Main page
// ============================================================================

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: storedUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(storedUser);
  const [loading, setLoading] = useState(true);
  const [totalTrips, setTotalTrips] = useState(null);

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passengerOpen, setPassengerOpen] = useState(false);
  const [addingPassenger, setAddingPassenger] = useState(false);
  const [removingPassengerId, setRemovingPassengerId] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Section refs for scroll
  const topRef = useRef(null);
  const passengersRef = useRef(null);
  const securityRef = useRef(null);

  const syncProfile = useCallback(
    (next) => {
      if (!next) return;
      setProfile(next);
      updateUser(next);
    },
    [updateUser]
  );

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      const nextUser = getResponseUser(response);
      syncProfile(nextUser);
    } catch (error) {
      message.error(error?.message || 'Không thể tải hồ sơ cá nhân');
    } finally {
      setLoading(false);
    }
  }, [syncProfile]);

  const fetchTripCount = useCallback(async () => {
    try {
      const response = await getCustomerTickets({
        type: 'past',
        limit: 1,
        page: 1,
      });
      const total =
        response?.data?.pagination?.total ??
        response?.data?.total ??
        response?.data?.tickets?.length ??
        0;
      setTotalTrips(total);
    } catch (error) {
      // Non-fatal — keep totalTrips null so UI shows "—"
      console.warn('Fetch trip count failed:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchTripCount();
  }, [fetchProfile, fetchTripCount]);

  // ----- Avatar upload props
  const handleUploadAvatar = async ({ file, onSuccess, onError }) => {
    try {
      setUploadingAvatar(true);
      const response = await uploadAvatar(file);
      syncProfile(getResponseUser(response));
      message.success('Cập nhật ảnh đại diện thành công');
      onSuccess?.(response);
    } catch (error) {
      message.error(error?.message || 'Không thể upload ảnh');
      onError?.(error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadProps = useMemo(
    () => ({
      accept: 'image/png,image/jpeg,image/jpg,image/gif,image/webp',
      showUploadList: false,
      customRequest: handleUploadAvatar,
      beforeUpload: (file) => {
        const isImage = file.type?.startsWith('image/');
        if (!isImage) {
          message.error('Chỉ chấp nhận file ảnh');
          return Upload.LIST_IGNORE;
        }
        if (file.size / 1024 / 1024 >= 5) {
          message.error('Ảnh phải nhỏ hơn 5MB');
          return Upload.LIST_IGNORE;
        }
        return true;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ----- Profile edit submit
  const handleProfileSubmit = async (values) => {
    try {
      setSavingProfile(true);
      const payload = {
        fullName: values.fullName?.trim(),
        phone: values.phone?.trim(),
        gender: values.gender,
      };
      if (values.dateOfBirth) {
        payload.dateOfBirth = values.dateOfBirth.format('YYYY-MM-DD');
      }
      const response = await updateProfile(payload);
      syncProfile(getResponseUser(response));
      message.success(response?.message || 'Cập nhật hồ sơ thành công');
      setEditOpen(false);
    } catch (error) {
      message.error(error?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  // ----- Change password
  const handleChangePassword = async (values) => {
    try {
      setChangingPassword(true);
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Đổi mật khẩu thành công');
      setPasswordOpen(false);
    } catch (error) {
      message.error(error?.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  // ----- Saved passengers CRUD
  const handleAddPassenger = async (values) => {
    try {
      setAddingPassenger(true);
      const response = await addSavedPassenger({
        fullName: values.fullName?.trim(),
        phone: values.phone?.trim(),
        idCard: values.idCard?.trim(),
      });
      syncProfile(getResponseUser(response));
      message.success('Đã thêm hành khách thường đi');
      setPassengerOpen(false);
    } catch (error) {
      message.error(error?.message || 'Không thể thêm hành khách');
    } finally {
      setAddingPassenger(false);
    }
  };

  const handleRemovePassenger = async (passengerId) => {
    if (!passengerId) return;
    try {
      setRemovingPassengerId(passengerId);
      const response = await removeSavedPassenger(passengerId);
      syncProfile(getResponseUser(response));
      message.success('Đã xoá hành khách');
    } catch (error) {
      message.error(error?.message || 'Không thể xoá hành khách');
    } finally {
      setRemovingPassengerId(null);
    }
  };

  // ----- Avatar delete
  const handleDeleteAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const response = await deleteAvatar();
      syncProfile(getResponseUser(response));
      message.success('Đã xoá ảnh đại diện');
    } catch (error) {
      message.error(error?.message || 'Không thể xoá ảnh');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ----- Sidebar scroll
  const handleScrollTo = useCallback((target) => {
    const map = {
      top: topRef,
      passengers: passengersRef,
      security: securityRef,
    };
    const el = map[target]?.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleAccountNavigate = useCallback(
    (to) => {
      navigate(to);

      const hashTarget = {
        '/profile#passengers': 'passengers',
        '/profile#security': 'security',
      }[to];

      if (hashTarget) {
        requestAnimationFrame(() => handleScrollTo(hashTarget));
      }
    },
    [handleScrollTo, navigate]
  );

  useEffect(() => {
    if (loading) return;

    const hashTarget = {
      '#passengers': 'passengers',
      '#security': 'security',
    }[location.hash];

    if (hashTarget) {
      requestAnimationFrame(() => handleScrollTo(hashTarget));
    }
  }, [handleScrollTo, location.hash, loading]);

  return (
    <CustomerShell activeKey="member">
      {/* Page header */}
      <div className="border-b border-vxn-border bg-white">
        <div className="px-4 pt-6 lg:px-8" ref={topRef}>
          <CustomerBreadcrumb
            className="mb-3"
            items={[accountBreadcrumbItem()]}
          />
          <div className="flex flex-wrap items-end justify-between gap-3 pb-5">
            <div>
              <h1 className="m-0 text-[28px] font-semibold tracking-tight text-vxn-ink">
                Tài khoản của tôi
              </h1>
              <p className="m-0 mt-1 text-[13px] text-vxn-fg-3">
                Quản lý thông tin cá nhân, mật khẩu và hành khách thường đi.
              </p>
            </div>
            {profile?.avatar && (
              <Popconfirm
                title="Xoá ảnh đại diện?"
                description="Avatar hiện tại sẽ bị xoá khỏi hồ sơ."
                okText="Xoá"
                cancelText="Đóng"
                okButtonProps={{ danger: true }}
                onConfirm={handleDeleteAvatar}
              >
                <Button
                  icon={<DeleteOutlined />}
                  className="!h-9 !rounded-lg !text-[13px]"
                  loading={uploadingAvatar}
                  danger
                >
                  Xoá avatar
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[108rem] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <AccountSidebar
            activeKey="profile"
            onScrollTo={handleScrollTo}
            onNavigate={(p) => navigate(p)}
          />

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-vxn-border bg-white">
              <Spin size="large" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <HeroCard
                profile={profile}
                totalTrips={totalTrips}
                uploading={uploadingAvatar}
                uploadProps={uploadProps}
              />
              <AccountFeatureGrid onNavigate={handleAccountNavigate} />
              <PersonalInfoCard
                profile={profile}
                onEdit={() => setEditOpen(true)}
              />
              <div ref={passengersRef}>
                <SavedPassengersCard
                  passengers={profile?.savedPassengers || []}
                  onAdd={() => setPassengerOpen(true)}
                  onRemove={handleRemovePassenger}
                  removingId={removingPassengerId}
                />
              </div>
              <div ref={securityRef}>
                <SecurityCard profile={profile} onChangePassword={() => setPasswordOpen(true)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        open={editOpen}
        profile={profile}
        onCancel={() => setEditOpen(false)}
        onSubmit={handleProfileSubmit}
        loading={savingProfile}
      />
      <ChangePasswordModal
        open={passwordOpen}
        onCancel={() => setPasswordOpen(false)}
        onSubmit={handleChangePassword}
        loading={changingPassword}
      />
      <AddPassengerModal
        open={passengerOpen}
        onCancel={() => setPassengerOpen(false)}
        onSubmit={handleAddPassenger}
        loading={addingPassenger}
      />
    </CustomerShell>
  );
};

export default ProfilePage;
