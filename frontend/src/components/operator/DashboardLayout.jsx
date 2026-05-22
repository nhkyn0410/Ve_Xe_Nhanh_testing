/**
 * Operator portal shell — faithful port of the "Trang quản lý nhà xe"
 * design package layout. Scoped under .vxn-op so the design tokens
 * (vxn-operator.css) do not leak into customer / admin surfaces.
 */
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/vxn-operator.css';

const DashboardLayout = () => {
  const location = useLocation();

  // Match the design's "scroll to top on view change" behaviour.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="vxn-op" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <div style={{ padding: '28px 32px 64px', minWidth: 0 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
