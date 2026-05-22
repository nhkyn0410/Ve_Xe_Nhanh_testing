/**
 * System-admin top bar — faithful port of the "Trang admin hệ thống"
 * design package admin-chrome.jsx AdminTopBar, adapted to React Router.
 * 73px, global search, icon actions, identity chip with SUPER ADMIN tag.
 * Notification counts are intentionally omitted (no real feed yet) rather
 * than fabricating a number.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import useAdminAuthStore from '../../store/adminAuthStore';
import { VxnIcon } from './vxn';

function IconBtn({ icon, onClick, title }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 8, border: 0, background: 'transparent',
      display: 'grid', placeItems: 'center', cursor: 'pointer', position: 'relative',
      color: 'var(--vxn-fg-5)',
    }}>
      <VxnIcon name={icon} size={19} style={{ opacity: 0.7 }} />
    </button>
  );
}

function initialsOf(name = '', email = '') {
  const src = (name || email || 'Admin').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

const AdminHeader = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuthStore();
  const [q, setQ] = useState('');

  const name = admin?.fullName || admin?.name || admin?.email || 'Quản trị viên';
  const initials = initialsOf(admin?.fullName || admin?.name, admin?.email);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menu = {
    items: [
      { key: 'profile', label: 'Hồ sơ cá nhân', onClick: () => navigate('/admin/profile') },
      { key: 'settings', label: 'Cài đặt hệ thống', onClick: () => navigate('/admin/settings') },
      { type: 'divider' },
      { key: 'logout', label: 'Đăng xuất', danger: true, onClick: handleLogout },
    ],
  };

  const onSearch = (e) => {
    if (e.key === 'Enter' && q.trim()) {
      // Best-effort: route the query to the operators directory search.
      navigate(`/admin/operators?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <header style={{
      height: 73, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--vxn-border)',
      display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px',
      position: 'sticky', top: 0, zIndex: 10, boxSizing: 'border-box',
    }}>
      <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onSearch}
          placeholder="Tìm nhà xe, khách hàng, chuyến, giao dịch…"
          style={{
            width: '100%', height: 40, borderRadius: 8, background: 'var(--vxn-bg-mist)',
            border: '1px solid transparent', padding: '0 16px 0 40px',
            font: '400 13.5px var(--font-display)', color: 'var(--vxn-fg-2)',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <span style={{ position: 'absolute', left: 14, top: 11, opacity: 0.5 }}>
          <VxnIcon name="search" size={16} />
        </span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconBtn icon="bell" title="Thông báo" />
        <IconBtn icon="circle-help" title="Trợ giúp" />
        <IconBtn icon="settings" title="Cài đặt" onClick={() => navigate('/admin/settings')} />
        <div style={{ width: 1, height: 28, background: 'var(--vxn-border)', margin: '0 8px' }} />
        <Dropdown menu={menu} placement="bottomRight" trigger={['click']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px 0 8px', cursor: 'pointer' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--vxn-teal-700), var(--vxn-teal-900))',
              display: 'grid', placeItems: 'center',
              color: '#fff', font: '600 14px var(--font-display)',
            }}>{initials}</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ font: '600 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>
                {name}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                font: '500 11px var(--font-display)', color: 'var(--vxn-saffron-700)', marginTop: 2,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--vxn-saffron-600)' }} />
                SUPER ADMIN
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default AdminHeader;
