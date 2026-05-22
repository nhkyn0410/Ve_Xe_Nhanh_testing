/**
 * System-admin portal shell — faithful port of the "Trang admin hệ thống"
 * design package layout (Trang admin he thong.html). Scoped under
 * .vxn-admin so the design tokens (vxn-admin.css) do not leak into the
 * customer / operator surfaces.
 */
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../styles/vxn-admin.css';

const AdminDashboardLayout = () => {
  const location = useLocation();

  // Match the design's "scroll to top on view change" behaviour.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="vxn-admin" style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AdminHeader />
        <div style={{ padding: '28px 32px 64px', minWidth: 0 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
