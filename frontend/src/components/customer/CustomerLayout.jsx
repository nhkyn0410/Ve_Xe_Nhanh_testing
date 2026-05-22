import CustomerShell from './CustomerShell';

const CustomerLayout = ({ children, className = '', hideFooter = false }) => (
  <CustomerShell hideFooter={hideFooter} mainClassName={`bg-vxn-bg-soft ${className}`}>
    {children}
  </CustomerShell>
);

export default CustomerLayout;
