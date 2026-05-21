import {
  CustomerServiceOutlined,
  EditOutlined,
  FileTextOutlined,
  GiftOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';

export const ACCOUNT_MENU_ITEMS = [
  {
    key: 'profile',
    label: 'Hồ sơ cá nhân',
    description: 'Thông tin liên hệ, avatar và bảo mật',
    to: '/profile',
    icon: UserOutlined,
  },
  {
    key: 'tickets',
    label: 'Hành trình của tôi',
    description: 'Vé đã đặt, vé sắp đi và vé đã huỷ',
    to: '/my-tickets',
    icon: FileTextOutlined,
  },
  {
    key: 'loyalty',
    label: 'VXN Plus',
    description: 'Điểm thưởng, hạng thành viên và ưu đãi',
    to: '/loyalty',
    icon: StarFilled,
  },
  {
    key: 'voucher-wallet',
    label: 'Ví voucher',
    description: 'Mã ưu đãi đã lưu và trạng thái sử dụng',
    to: '/voucher-wallet',
    icon: GiftOutlined,
  },
  {
    key: 'loyalty-history',
    label: 'Lịch sử điểm',
    description: 'Giao dịch tích, đổi và hết hạn điểm',
    to: '/loyalty/history',
    icon: HistoryOutlined,
  },
  {
    key: 'reviews',
    label: 'Đánh giá của tôi',
    description: 'Viết và quản lý đánh giá chuyến đi',
    to: '/my-reviews',
    icon: EditOutlined,
  },
  {
    key: 'complaints',
    label: 'Khiếu nại',
    description: 'Theo dõi yêu cầu hỗ trợ và phản hồi',
    to: '/complaints',
    icon: CustomerServiceOutlined,
  },
  {
    key: 'passengers',
    label: 'Hành khách đã lưu',
    description: 'Quản lý danh sách đi cùng thường xuyên',
    to: '/profile#passengers',
    icon: TeamOutlined,
  },
  {
    key: 'security',
    label: 'Bảo mật',
    description: 'Đổi mật khẩu và quản lý lớp bảo vệ',
    to: '/profile#security',
    icon: SafetyCertificateOutlined,
  },
];

export const accountBreadcrumbItem = () => ({
  label: 'Tài khoản',
  to: '/profile',
  menu: ACCOUNT_MENU_ITEMS,
});
