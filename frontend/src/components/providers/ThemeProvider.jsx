import { ConfigProvider } from 'antd';
import { antdTheme } from '../../styles/design-system';
import viVN from 'antd/locale/vi_VN';

const ThemeProvider = ({ children }) => {
  return (
    <ConfigProvider
      theme={antdTheme}
      locale={viVN}
      componentSize="middle"
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeProvider;
