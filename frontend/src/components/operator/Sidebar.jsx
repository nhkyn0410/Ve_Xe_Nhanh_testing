/**
 * Operator portal sidebar — faithful port of the "Trang quản lý nhà xe"
 * design package chrome.jsx Sidebar, adapted to React Router.
 * White surface, 232px, 9 nav items, sticky, logout footer.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useOperatorAuthStore from '../../store/operatorAuthStore';
import logoMark from '../../assets/brand/logo-icon_background_white_notext.svg';
import { VxnIcon } from './vxn';

const OP_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-grid', path: '/operator/dashboard' },
  { key: 'routes', label: 'Quản lý tuyến đường', icon: 'map', path: '/operator/routes' },
  { key: 'stops', label: 'Quản lý điểm dừng', icon: 'map-pin', path: '/operator/stops' },
  { key: 'buses', label: 'Quản lý đội xe', icon: 'bus', path: '/operator/buses' },
  { key: 'employees', label: 'Quản lý nhân viên', icon: 'contact', path: '/operator/employees' },
  { key: 'trips', label: 'Quản lý chuyến xe', icon: 'route', path: '/operator/trips' },
  {
    key: 'transactions',
    label: 'Quản lý giao dịch',
    icon: 'wallet',
    path: '/operator/transactions',
  },
  { key: 'vouchers', label: 'Quản lý mã giảm', icon: 'badge-percent', path: '/operator/vouchers' },
  { key: 'reports', label: 'Báo cáo', icon: 'chart-column', path: '/operator/reports' },
  { key: 'profile', label: 'Hồ sơ nhà xe', icon: 'settings', path: '/operator/profile' },
];

const VxnLogo = () => {
  // V-mark + saffron streak — distilled from the brand SVG
  return <img src={logoMark} alt="Vé Xe Nhanh" style={{ height: 38, objectFit: 'contain' }} />;
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useOperatorAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/operator/login');
  };

  return (
    <aside
      style={{
        width: 232,
        minHeight: '100vh',
        background: '#fff',
        borderRight: '1px solid var(--vxn-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        flexShrink: 0,
      }}
    >
      <div>
        <Link
          to="/operator/dashboard"
          style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid var(--vxn-border)',
            height: 73,
            boxSizing: 'border-box',
          }}
        >
          <VxnLogo />
          <div
            style={{
              font: '600 16px var(--font-display)',
              color: 'var(--vxn-ink)',
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            Trang quản lý
            <br />
            nhà xe
          </div>
        </Link>

        <nav style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {OP_NAV.map((item) => {
            const on = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.key}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 8,
                  background: on ? '#E8F0FE' : 'transparent',
                  color: on ? 'var(--vxn-teal-800)' : 'var(--vxn-fg-2)',
                  border: 0,
                  cursor: 'pointer',
                  font: `${on ? 500 : 400} 14px var(--font-display)`,
                  textAlign: 'left',
                }}
              >
                <VxnIcon name={item.icon} size={18} style={{ opacity: on ? 1 : 0.75 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ padding: '12px 12px 20px' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 12,
            padding: '11px 14px',
            borderRadius: 8,
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: 'var(--vxn-fg-3)',
            font: '400 14px var(--font-display)',
          }}
        >
          <VxnIcon name="log-out" size={18} style={{ opacity: 0.75 }} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
