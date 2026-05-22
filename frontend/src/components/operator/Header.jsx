/**
 * Operator portal top bar — faithful port of the "Trang quản lý nhà xe"
 * design package chrome.jsx TopBar, wired to the operator auth store.
 * 73px, dashed underline, search field, icon buttons, profile block.
 */
import { useNavigate } from 'react-router-dom';
import useOperatorAuthStore from '../../store/operatorAuthStore';
import { getOperatorDisplayName } from '../../utils/operatorDisplay';
import { VxnIcon } from './vxn';

function IconBtn({ icon, onClick, title }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 8, border: 0, background: 'transparent',
      display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--vxn-fg-5)',
    }}>
      <VxnIcon name={icon} size={19} style={{ opacity: 0.55 }} />
    </button>
  );
}

const Header = () => {
  const navigate = useNavigate();
  const { operator: user } = useOperatorAuthStore();
  const displayName = getOperatorDisplayName(user, 'Nhà xe đối tác');

  return (
    <header style={{
      height: 73, background: '#fff',
      borderBottom: '1px dashed #B6CDE8',
      display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px',
      position: 'sticky', top: 0, zIndex: 10, boxSizing: 'border-box',
    }}>
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <input placeholder="Tìm kiếm" style={{
          width: '100%', height: 40, borderRadius: 8, background: 'var(--vxn-bg-mist)',
          border: 0, padding: '0 16px 0 40px',
          font: '400 14px var(--font-display)', color: 'var(--vxn-fg-2)',
          outline: 'none', boxSizing: 'border-box',
        }} />
        <span style={{ position: 'absolute', left: 14, top: 11, opacity: 0.5, color: 'var(--vxn-fg-5)' }}>
          <VxnIcon name="search" size={16} />
        </span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconBtn icon="inbox" />
        <IconBtn icon="circle-help" />
        <IconBtn icon="settings" title="Hồ sơ nhà xe" onClick={() => navigate('/operator/profile')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px 0 16px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--vxn-success-bg)',
            display: 'grid', placeItems: 'center', color: 'var(--vxn-teal-800)',
          }}>
            <VxnIcon name="user" size={22} style={{ opacity: 0.8 }} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
              {displayName}
            </div>
            <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
