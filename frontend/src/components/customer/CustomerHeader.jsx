import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Drawer, Dropdown, Layout, Menu } from 'antd';
import {
  BellOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  PhoneOutlined,
  SearchOutlined,
  SettingOutlined,
  StarOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import logoMark from '../../assets/brand/Logo_notext.svg';
import logoText from '../../assets/brand/Logo_text.svg';
import useAuthStore from '../../store/authStore';

const { Header } = Layout;

const mainMenuItems = [
  { key: '/', icon: <HomeOutlined />, label: 'Trang chủ' },
  { key: '/trips', icon: <SearchOutlined />, label: 'Tìm chuyến' },
  { key: '/tickets/lookup', icon: <FileTextOutlined />, label: 'Tra cứu vé' },
  { key: '/news', icon: <CustomerServiceOutlined />, label: 'Tin tức' },
];

const getSelectedKey = (pathname) => {
  if (pathname === '/search-results' || pathname.startsWith('/trips')) return '/trips';
  if (pathname.startsWith('/tickets')) return '/tickets/lookup';
  if (pathname.startsWith('/news')) return '/news';
  return pathname === '/' ? '/' : '';
};

const CustomerHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const selectedKey = getSelectedKey(location.pathname);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công');
    navigate('/');
  };

  const userMenuItems = isAuthenticated
    ? [
        { key: 'profile', icon: <UserOutlined />, label: 'Thông tin cá nhân', onClick: () => navigate('/profile') },
        { key: 'my-tickets', icon: <FileTextOutlined />, label: 'Vé của tôi', onClick: () => navigate('/my-tickets') },
        { key: 'divider-1', type: 'divider' },
        { key: 'my-reviews', icon: <StarOutlined />, label: 'Đánh giá của tôi', onClick: () => navigate('/my-reviews') },
        { key: 'complaints', icon: <CustomerServiceOutlined />, label: 'Hỗ trợ khách hàng', onClick: () => navigate('/complaints') },
        { key: 'loyalty', icon: <TrophyOutlined />, label: 'VXN Plus', onClick: () => navigate('/loyalty') },
        { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt', onClick: () => navigate('/settings') },
        { key: 'divider-2', type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout },
      ]
    : [
        { key: 'login', icon: <LoginOutlined />, label: 'Đăng nhập', onClick: () => navigate('/login') },
        { key: 'register', icon: <UserOutlined />, label: 'Đăng ký', onClick: () => navigate('/register') },
      ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <Header className="sticky top-0 z-50 h-auto bg-white/95 px-0 leading-none shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between gap-4 border-b border-vxn-border px-4 sm:px-6 lg:px-8 xl:px-12">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex min-w-0 items-center gap-3 border-0 bg-transparent p-0 text-left"
          aria-label="Về trang chủ Vé Xe Nhanh"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-vxn-teal-700 shadow-vxn">
            <img src={logoMark} alt="" className="h-7 w-7" />
          </span>
          <span className="hidden min-w-0 flex-col sm:flex">
            <img src={logoText} alt="Vé Xe Nhanh" className="h-8 w-auto max-w-[150px]" />
            <span className="mt-1 text-xs font-medium text-vxn-fg-5">Đặt vé xe khách toàn quốc</span>
          </span>
        </button>

        <nav className="hidden min-w-0 flex-1 justify-center lg:flex" aria-label="Điều hướng chính">
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={mainMenuItems}
            onClick={handleMenuClick}
            className="border-0 bg-transparent font-medium"
            style={{ minWidth: 0 }}
          />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-vxn-bg-mist px-3 py-2 text-sm font-medium text-vxn-fg-2 md:flex">
            <PhoneOutlined className="text-vxn-teal-700" />
            <span>1900 6067</span>
          </div>

          <div className="hidden items-center gap-1 md:flex lg:hidden">
            {mainMenuItems.slice(0, 3).map((item) => (
              <Button
                key={item.key}
                type="text"
                icon={item.icon}
                onClick={() => handleMenuClick({ key: item.key })}
                className={selectedKey === item.key ? 'bg-primary-50 text-primary-700' : 'hover:bg-primary-50 hover:text-primary-700'}
                aria-label={item.label}
              />
            ))}
          </div>

          {isAuthenticated && (
            <Badge count={0} showZero={false}>
              <Button
                type="text"
                icon={<BellOutlined className="text-lg" />}
                className="hover:bg-primary-50 hover:text-primary-700"
                aria-label="Thông báo"
              />
            </Badge>
          )}

          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button type="text" className="flex h-auto items-center gap-3 rounded-lg px-2 py-2 hover:bg-primary-50">
                <Avatar size={34} src={user?.avatar} icon={<UserOutlined />} className="bg-gradient-primary shadow-sm" />
                <span className="hidden text-left xl:block">
                  <span className="block text-sm font-semibold text-vxn-ink">{user?.fullName || 'Tài khoản'}</span>
                  <span className="block max-w-[180px] truncate text-xs text-vxn-fg-5">{user?.email || 'Thành viên VXN'}</span>
                </span>
              </Button>
            </Dropdown>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button type="text" icon={<LoginOutlined />} onClick={() => navigate('/login')} className="hover:text-primary-700">
                Đăng nhập
              </Button>
              <Button type="primary" onClick={() => navigate('/register')} className="border-0 bg-gradient-primary font-semibold shadow-vxn">
                Đăng ký
              </Button>
            </div>
          )}

          <Button
            className="lg:hidden"
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            size="large"
            aria-label="Mở menu"
          />
        </div>
      </div>

      <Drawer
        title={
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-vxn-teal-700">
              <img src={logoMark} alt="" className="h-6 w-6" />
            </span>
            <img src={logoText} alt="Vé Xe Nhanh" className="h-8 w-auto" />
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={320}
        className="mobile-drawer"
      >
        <div className="space-y-6">
          {isAuthenticated && user && (
            <div className="rounded-xl border border-vxn-border bg-vxn-bg-mist p-4">
              <div className="flex items-center gap-3">
                <Avatar size={52} src={user?.avatar} icon={<UserOutlined />} className="bg-gradient-primary shadow-sm" />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-vxn-ink">{user.fullName}</div>
                  <div className="truncate text-sm text-vxn-fg-3">{user.email}</div>
                  <div className="mt-1 text-xs font-medium text-primary-700">Thành viên Vé Xe Nhanh</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-vxn-fg-5">Điều hướng</div>
            <Menu mode="inline" selectedKeys={[selectedKey]} items={mainMenuItems} onClick={handleMenuClick} className="border-0 bg-transparent" />
          </div>

          <div className="border-t border-vxn-border pt-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-vxn-fg-5">
              {isAuthenticated ? 'Tài khoản' : 'Đăng nhập'}
            </div>
            <Menu mode="inline" items={userMenuItems} className="border-0 bg-transparent" />
          </div>
        </div>
      </Drawer>
    </Header>
  );
};

export default CustomerHeader;
