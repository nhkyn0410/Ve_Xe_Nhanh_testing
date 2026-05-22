import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Badge,
  Space,
  Drawer,
  Typography,
} from 'antd';
import {
  HomeOutlined,
  SearchOutlined,
  FileTextOutlined,
  StarOutlined,
  CustomerServiceOutlined,
  TrophyOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  BellOutlined,
  SettingOutlined,
  RocketOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const { Header } = Layout;
const { Text } = Typography;

const CustomerHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công');
    navigate('/');
  };

  // Main navigation items
  const mainMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Trang chủ',
    },
    {
      key: '/trips',
      icon: <SearchOutlined />,
      label: 'Tìm chuyến',
    },
    {
      key: '/tickets/lookup',
      icon: <FileTextOutlined />,
      label: 'Tra cứu vé',
    },
    {
      key: '/news',
      icon: <NotificationOutlined />,
      label: 'Tin tức',
    },
  ];

  // User dropdown menu items
  const userMenuItems = isAuthenticated
    ? [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Thông tin cá nhân',
          onClick: () => navigate('/profile'),
        },
        {
          key: 'my-tickets',
          icon: <FileTextOutlined />,
          label: 'Vé của tôi',
          onClick: () => navigate('/my-tickets'),
        },
        {
          key: 'divider-1',
          type: 'divider',
        },
        {
          key: 'my-reviews',
          icon: <StarOutlined />,
          label: 'Đánh giá của tôi',
          onClick: () => navigate('/my-reviews'),
        },
        {
          key: 'complaints',
          icon: <CustomerServiceOutlined />,
          label: 'Hỗ trợ khách hàng',
          onClick: () => navigate('/complaints'),
        },
        {
          key: 'divider-2',
          type: 'divider',
        },
        {
          key: 'loyalty',
          icon: <TrophyOutlined />,
          label: 'Loyalty Program',
          onClick: () => navigate('/loyalty'),
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: 'Cài đặt',
          onClick: () => navigate('/settings'),
        },
        {
          key: 'divider-3',
          type: 'divider',
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Đăng xuất',
          danger: true,
          onClick: handleLogout,
        },
      ]
    : [
        {
          key: 'login',
          icon: <LoginOutlined />,
          label: 'Đăng nhập',
          onClick: () => navigate('/login'),
        },
        {
          key: 'register',
          icon: <UserOutlined />,
          label: 'Đăng ký',
          onClick: () => navigate('/register'),
        },
      ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <Header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
      <div className="max-w-8xl mx-auto flex items-center justify-between h-full">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <RocketOutlined className="text-white text-xl relative z-10" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xl font-bold bg-gradient-to-r from-primary-600 to-red-600 bg-clip-text text-transparent">
              Vé xe nhanh
            </div>
            <Text className="text-xs text-neutral-500 flex items-center gap-1">
              <RocketOutlined className="text-primary-500" />
              Đặt vé xe khách
            </Text>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={mainMenuItems.map(item => ({
              ...item,
              className: 'hover:text-primary-500 transition-colors font-medium px-4',
            }))}
            onClick={handleMenuClick}
            className="border-0 bg-transparent"
            style={{ minWidth: 0 }}
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Tablet Navigation */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {mainMenuItems.slice(0, 3).map((item) => (
              <Button
                key={item.key}
                type="text"
                icon={item.icon}
                onClick={() => handleMenuClick({ key: item.key })}
                className={`hover:bg-primary-50 hover:text-primary-500 transition-colors ${
                  location.pathname === item.key ? 'text-primary-600 bg-primary-50' : ''
                }`}
                title={item.label}
              />
            ))}
          </div>

          {/* Notifications */}
          {isAuthenticated && (
            <Badge count={0} showZero={false}>
              <Button
                type="text"
                icon={<BellOutlined className="text-lg" />}
                className="hover:bg-primary-50 hover:text-primary-500 transition-colors"
              />
            </Badge>
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
              overlayClassName="min-w-[200px]"
            >
              <Button
                type="text"
                className="flex items-center gap-3 hover:bg-primary-50 h-auto px-3 py-2 rounded-lg transition-colors"
              >
                <Avatar
                  size={32}
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  className="bg-gradient-to-r from-primary-500 to-red-500 shadow-md"
                />
                <div className="text-left hidden xl:block">
                  <div className="text-sm font-medium text-neutral-700">
                    {user?.fullName || 'User'}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {user?.email}
                  </div>
                </div>
              </Button>
            </Dropdown>
          ) : (
            <Space size="middle" className="hidden sm:flex">
              <Button
                type="text"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                className="hover:text-primary-500 transition-colors"
              >
                <span className="hidden md:inline">Đăng nhập</span>
              </Button>
              <Button
                type="primary"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-primary-500 to-red-500 border-0 shadow-md hover:shadow-lg transition-all"
              >
                <span className="hidden md:inline">Đăng ký</span>
                <span className="md:hidden">Đăng ký</span>
              </Button>
            </Space>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          className="lg:hidden"
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileMenuOpen(true)}
          size="large"
        />
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-red-500 rounded-lg flex items-center justify-center">
              <RocketOutlined className="text-white text-sm" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-red-600 bg-clip-text text-transparent">
              Vé xe nhanh
            </span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={320}
        className="mobile-drawer"
      >
        <div className="space-y-6">
          {/* User Info (if authenticated) */}
          {isAuthenticated && user && (
            <div className="p-4 bg-gradient-to-r from-primary-50 to-red-50 rounded-xl border border-primary-100">
              <div className="flex items-center gap-3">
                <Avatar
                  size={56}
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  className="bg-gradient-to-r from-primary-500 to-red-500 shadow-lg"
                />
                <div>
                  <div className="font-semibold text-neutral-800">
                    {user.fullName}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {user.email}
                  </div>
                  <div className="text-xs text-primary-600 mt-1">
                    Thành viên Vé xe nhanh
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Menu */}
          <div>
            <Text className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 block">
              Điều hướng
            </Text>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={mainMenuItems}
              onClick={handleMenuClick}
              className="border-0 bg-transparent"
            />
          </div>

          {/* User Menu */}
          <div className="border-t border-neutral-200 pt-4">
            <Text className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 block">
              {isAuthenticated ? 'Tài khoản' : 'Đăng nhập'}
            </Text>
            <Menu
              mode="inline"
              items={userMenuItems}
              className="border-0 bg-transparent"
            />
          </div>
        </div>
      </Drawer>
    </Header>
  );
};

export default CustomerHeader;
