/**
 * System-admin sidebar — faithful port of the "Trang admin hệ thống"
 * design package admin-chrome.jsx AdminSidebar, adapted to React Router.
 * 240px white surface, grouped nav, teal active state, "Admin / HỆ THỐNG"
 * lockup, logout footer. Scoped under .vxn-admin (vxn-admin.css).
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../../store/adminAuthStore';
import { VxnIcon } from './vxn';
import logoMark from '../../assets/brand/logo-icon_background_white_notext.svg';

const ADMIN_NAV = [
  {
    group: null,
    items: [
      { key: 'dashboard', label: 'Tổng quan', icon: 'layout-grid', path: '/admin/dashboard' },
    ],
  },
  {
    group: 'Vận hành',
    items: [
      { key: 'operators', label: 'Nhà xe', icon: 'building-2', path: '/admin/operators' },
      { key: 'routes', label: 'Tuyến đường', icon: 'map', path: '/admin/routes' },
      { key: 'trips', label: 'Chuyến xe', icon: 'route', path: '/admin/trips' },
      { key: 'tx', label: 'Giao dịch', icon: 'wallet', path: '/admin/transactions' },
      { key: 'vouchers', label: 'Voucher hệ thống', icon: 'ticket-percent', path: '/admin/vouchers' },
    ],
  },
  {
    group: 'Khách hàng',
    items: [
      { key: 'customers', label: 'Khách hàng', icon: 'users-round', path: '/admin/users' },
      {
        key: 'complaints',
        label: 'Khiếu nại',
        icon: 'message-square-warning',
        path: '/admin/complaints',
      },
      { key: 'reviews', label: 'Đánh giá', icon: 'star', path: '/admin/reviews' },
    ],
  },
  {
    group: 'Nội dung',
    items: [
      { key: 'content', label: 'Trang chủ & CMS', icon: 'newspaper', path: '/admin/content' },
    ],
  },
  {
    group: 'Khác',
    items: [{ key: 'reports', label: 'Báo cáo', icon: 'chart-column', path: '/admin/reports' }],
  },
];

function VxnLogo() {
  return <img src={logoMark} alt="Vé Xe Nhanh" style={{ height: 38, objectFit: 'contain' }} />;
}

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <aside
      style={{
        width: 240,
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
          to="/admin/dashboard"
          style={{
            padding: '0 20px',
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
              lineHeight: 1.15,
            }}
          >
            Admin
            <span
              style={{
                font: '500 11px var(--font-display)',
                color: 'var(--vxn-saffron-600)',
                letterSpacing: '0.08em',
              }}
              className="pl-2"
            >
              HỆ THỐNG
            </span>
          </div>
        </Link>

        <nav style={{ padding: '12px 12px 4px', display: 'flex', flexDirection: 'column' }}>
          {ADMIN_NAV.map((sec, si) => (
            <div key={si}>
              {sec.group && (
                <div
                  style={{
                    font: '500 10px var(--font-display)',
                    letterSpacing: '0.12em',
                    color: 'var(--vxn-fg-5)',
                    textTransform: 'uppercase',
                    padding: '14px 14px 6px',
                  }}
                >
                  {sec.group}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sec.items.map((item) => {
                  const on = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.key}
                      to={item.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: on ? 'rgba(0,100,129,0.08)' : 'transparent',
                        color: on ? 'var(--vxn-teal-800)' : 'var(--vxn-fg-2)',
                        border: 0,
                        font: `${on ? 600 : 400} 13.5px var(--font-display)`,
                        textAlign: 'left',
                        position: 'relative',
                      }}
                    >
                      {on && (
                        <span
                          style={{
                            position: 'absolute',
                            left: -12,
                            top: 6,
                            bottom: 6,
                            width: 3,
                            background: 'var(--vxn-teal-700)',
                            borderRadius: '0 3px 3px 0',
                          }}
                        />
                      )}
                      <VxnIcon
                        name={item.icon}
                        size={18}
                        color={on ? 'var(--vxn-teal-800)' : 'var(--vxn-fg-3)'}
                        style={{ opacity: on ? 1 : 0.8 }}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div style={{ padding: '12px 12px 18px', borderTop: '1px solid var(--vxn-border-muted)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 12,
            padding: '11px 12px',
            borderRadius: 8,
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: 'var(--vxn-fg-3)',
            font: '500 13.5px var(--font-display)',
          }}
        >
          <VxnIcon name="log-out" size={18} style={{ opacity: 0.75 }} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
