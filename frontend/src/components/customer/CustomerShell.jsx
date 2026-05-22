import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Drawer } from 'antd';
import {
  CloseOutlined,
  CustomerServiceOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  MenuOutlined,
  PlusSquareOutlined,
  QrcodeOutlined,
  QuestionCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import logoText from '../../assets/brand/Logo_text.svg';
import useAuthStore from '../../store/authStore';
import CustomerFooter from './CustomerFooter';

const sidebarNav = [
  {
    key: 'explore',
    label: 'Khám phá',
    icon: GlobalOutlined,
    path: '/tin-tuc',
  },
  { key: 'home', label: 'Trang chủ', icon: EnvironmentOutlined, path: '/' },
  { key: 'trips', label: 'Mua vé', icon: FileTextOutlined, path: '/trips' },
  {
    key: 'addons',
    label: 'Dịch vụ bổ trợ',
    icon: PlusSquareOutlined,
    path: '/dich-vu-bo-tro',
  },
  {
    key: 'tickets',
    label: 'Hành trình',
    icon: EnvironmentOutlined,
    path: '/my-tickets',
  },
  { key: 'member', label: 'Thành viên', icon: StarOutlined, path: '/loyalty' },
];

const sidebarSupport = [
  {
    key: 'lookup',
    label: 'Tra cứu vé',
    icon: QrcodeOutlined,
    path: '/tra-cuu-ve',
  },
  {
    key: 'complaints',
    label: 'Khiếu nại',
    icon: CustomerServiceOutlined,
    path: '/khieu-nai',
  },
  {
    key: 'faq',
    label: 'Câu hỏi thường gặp',
    icon: QuestionCircleOutlined,
    path: '/faq',
  },
];

const getInitials = (user) => {
  const name = user?.fullName || user?.name || user?.email || 'KH';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const resolveActiveKey = (pathname, activeKey) => {
  if (activeKey) return activeKey === 'buy' ? 'trips' : activeKey;
  if (
    pathname.startsWith('/my-tickets') ||
    pathname.startsWith('/tickets') ||
    pathname.startsWith('/tra-cuu-ve') ||
    pathname.startsWith('/hanh-trinh')
  )
    return 'tickets';
  if (
    pathname.startsWith('/kham-pha') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/news') ||
    pathname.startsWith('/tin-tuc')
  )
    return 'explore';
  if (pathname.startsWith('/faq') || pathname.startsWith('/cau-hoi-thuong-gap')) return 'faq';
  if (pathname.startsWith('/complaints') || pathname.startsWith('/khieu-nai')) return 'complaints';
  if (pathname.startsWith('/dich-vu-bo-tro')) return 'addons';
  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/loyalty') ||
    pathname.startsWith('/voucher-wallet') ||
    pathname.startsWith('/my-reviews') ||
    pathname.startsWith('/thanh-vien')
  ) {
    return 'member';
  }
  if (
    pathname.startsWith('/trips') ||
    pathname.startsWith('/search-results') ||
    pathname.startsWith('/mua-ve') ||
    pathname.startsWith('/booking') ||
    pathname.startsWith('/payment')
  )
    return 'trips';
  return pathname === '/' ? 'home' : 'explore';
};

export const CustomerSidebarContent = ({ activeKey, signedIn, user, onLogout, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentActiveKey = resolveActiveKey(location.pathname, activeKey);

  const goTo = (path) => {
    onClose?.();
    navigate(path);
  };

  return (
    <div className="flex h-full w-full flex-col justify-between bg-vxn-teal-700 text-white">
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto pt-7">
        <button
          type="button"
          className="mx-6 flex items-center justify-start rounded-lg border-0 bg-transparent p-0"
          onClick={() => goTo('/')}
          aria-label="Về trang chủ Vé Xe Nhanh"
        >
          <img src={logoText} alt="Vé Xe Nhanh" className="h-auto w-auto max-w-[138px]" />
        </button>

        <div className="px-4">
          <div className="h-px bg-white/[0.16]" />
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {sidebarNav.map((item) => {
            const Icon = item.icon;
            const active = currentActiveKey === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={`flex h-[42px] items-center gap-3 rounded-lg border-0 px-3.5 text-left text-[15px] transition ${
                  active
                    ? 'bg-white/[0.13] font-medium text-white'
                    : 'bg-transparent font-normal text-white/[0.86] hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => goTo(item.path)}
              >
                <Icon className="text-[18px]" />
                <span className="min-w-0 flex-1">{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-vxn-saffron-500" />}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pt-3">
          <div className="h-px bg-white/[0.16]" />
        </div>

        <nav className="flex flex-col gap-0.5 px-4">
          {sidebarSupport.map((item) => {
            const Icon = item.icon;
            const active = currentActiveKey === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={`flex h-10 items-center gap-3 rounded-lg border-0 px-3 text-left text-[14px] font-normal transition ${
                  active
                    ? 'bg-white/[0.10] text-white'
                    : 'bg-transparent text-white/[0.78] hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => goTo(item.path)}
              >
                <Icon className="text-[17px]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.16] p-5">
        {signedIn ? (
          <>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border-0 bg-transparent px-1 py-2 text-left"
              onClick={() => goTo('/profile')}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-vxn-saffron-600 text-sm font-semibold text-white ring-2 ring-white/20">
                {getInitials(user)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">
                  {user?.fullName || user?.name || 'Khách hàng'}
                </span>
                <span className="block text-xs text-white/[0.65]">Thành viên VXN</span>
              </span>
            </button>
            <button
              type="button"
              className="h-[42px] rounded border border-white/[0.35] bg-transparent text-[14px] font-medium text-white transition hover:bg-white/10"
              onClick={() => {
                onClose?.();
                onLogout();
              }}
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="h-[42px] rounded border-0 bg-vxn-saffron-600 text-[15px] font-medium text-white transition hover:bg-vxn-saffron-700"
              onClick={() => goTo('/register')}
            >
              Đăng ký
            </button>
            <button
              type="button"
              className="h-[42px] rounded border border-white/[0.40] bg-transparent text-[15px] font-medium text-white transition hover:bg-white/10"
              onClick={() => goTo('/login')}
            >
              Đăng nhập
            </button>
          </>
        )}

        <div className="px-1 pt-2 text-xs text-white/[0.70]">
          <span>v.1.1 · vexenhanh.vn</span>
        </div>
      </div>
    </div>
  );
};

export const CustomerMobileTopBar = ({ activeKey, signedIn, user, onLogout }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-vxn-teal-700 px-4 text-white lg:hidden">
        <button
          type="button"
          className="border-0 bg-transparent p-0"
          onClick={() => navigate('/')}
          aria-label="Trang chủ"
        >
          <img src={logoText} alt="Vé Xe Nhanh" className="h-8 w-auto max-w-[132px]" />
        </button>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/25 bg-white/10 text-white"
          onClick={() => setOpen(true)}
          aria-label="Mở menu"
        >
          <MenuOutlined />
        </button>
      </div>

      <Drawer
        placement="left"
        width={280}
        open={open}
        closeIcon={false}
        onClose={() => setOpen(false)}
        className="vxn-mobile-drawer"
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg border border-white/25 bg-white/10 text-white"
          onClick={() => setOpen(false)}
          aria-label="Đóng menu"
        >
          <CloseOutlined />
        </button>
        <CustomerSidebarContent
          activeKey={activeKey}
          signedIn={signedIn}
          user={user}
          onLogout={onLogout}
          onClose={() => setOpen(false)}
        />
      </Drawer>
    </>
  );
};

const CustomerShell = ({
  children,
  activeKey,
  className = '',
  hideFooter = false,
  mainClassName = 'bg-vxn-bg-soft',
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công');
    navigate('/');
  };

  return (
    <div className={`min-h-screen bg-vxn-bg-soft font-sans text-vxn-fg-1 lg:flex ${className}`}>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 self-start lg:flex">
        <CustomerSidebarContent
          activeKey={activeKey}
          signedIn={isAuthenticated}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      <CustomerMobileTopBar
        activeKey={activeKey}
        signedIn={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />

      <main className={`flex min-w-0 flex-1 flex-col ${mainClassName}`}>
        <div className="min-w-0 flex-1">{children}</div>
        {!hideFooter && <CustomerFooter />}
      </main>
    </div>
  );
};

export default CustomerShell;
