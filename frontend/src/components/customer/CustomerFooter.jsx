import {
  CustomerServiceOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  FileTextOutlined,
  HomeOutlined,
  LoginOutlined,
  MailOutlined,
  PhoneOutlined,
  QuestionCircleOutlined,
  SafetyOutlined,
  SearchOutlined,
  TrophyOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import footerLogo from '../../assets/brand/logo-icon_background_white.svg';

const serviceLinks = [
  { href: '/', text: 'Trang chủ', icon: HomeOutlined },
  { href: '/trips', text: 'Tìm chuyến xe', icon: SearchOutlined },
  { href: '/tra-cuu-ve', text: 'Tra cứu vé', icon: FileTextOutlined },
  { href: '/loyalty', text: 'VXN Plus', icon: TrophyOutlined },
];

const businessLinks = [
  { href: '/operator/login', text: 'Đăng nhập nhà xe', icon: LoginOutlined },
  { href: '/operator/register', text: 'Đăng ký nhà xe', icon: UserAddOutlined },
  { href: '/trip-manager/login', text: 'Nhân viên chuyến', icon: FileTextOutlined },
  { href: '/admin/login', text: 'Quản trị hệ thống', icon: DashboardOutlined },
];

const supportLinks = [
  { href: '/complaints', text: 'Gửi khiếu nại', icon: CustomerServiceOutlined },
  { href: '/faq', text: 'Câu hỏi thường gặp', icon: QuestionCircleOutlined },
  { href: '/tickets/cancel', text: 'Đổi và hủy vé', icon: SafetyOutlined },
];

const socialLinks = [
  { key: 'facebook', icon: FacebookOutlined },
  { key: 'email', icon: MailOutlined },
  { key: 'phone', icon: PhoneOutlined },
];

const FooterLink = ({ href, icon: Icon, text }) => (
  <Link
    to={href}
    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-600 transition hover:bg-white hover:text-vxn-teal-700"
  >
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-vxn-saffron-600 shadow-sm ring-1 ring-[#D7E7EE] transition group-hover:text-vxn-teal-700">
      <Icon />
    </span>
    <span>{text}</span>
  </Link>
);

const CustomerFooter = () => (
  <footer className="mt-auto border-t border-[#D7E7EE] bg-[#EAF6FA] text-slate-800">
    <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 xl:px-12">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
        <section>
          <img src={footerLogo} alt="Vé Xe Nhanh" className="mb-6 h-24" />
          <p className="max-w-sm text-[17px] leading-7 text-slate-600">
            Nền tảng đặt vé xe khách trực tuyến cho khách hàng, nhà xe và nhân viên vận hành chuyến.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-vxn-teal-800 shadow-sm ring-1 ring-[#D7E7EE]">
            <span className="h-2 w-2 rounded-full bg-vxn-saffron-500" />
            Vé điện tử QR · Thanh toán an toàn
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold uppercase tracking-wide text-vxn-ink">
            <span className="h-5 w-1 rounded-full bg-vxn-saffron-500" />
            Dịch vụ
          </h2>
          <div className="space-y-1">
            {serviceLinks.map((item) => (
              <FooterLink key={item.href} {...item} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold uppercase tracking-wide text-vxn-ink">
            <span className="h-5 w-1 rounded-full bg-vxn-saffron-500" />
            Đối tác
          </h2>
          <div className="space-y-1">
            {businessLinks.map((item) => (
              <FooterLink key={item.href} {...item} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold uppercase tracking-wide text-vxn-ink">
            <span className="h-5 w-1 rounded-full bg-vxn-saffron-500" />
            Hỗ trợ
          </h2>
          <div className="space-y-1">
            {supportLinks.map((item) => (
              <FooterLink key={item.href} {...item} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold uppercase tracking-wide text-vxn-ink">
            <span className="h-5 w-1 rounded-full bg-vxn-saffron-500" />
            Liên hệ
          </h2>
          <div className="space-y-3 text-[14px] text-slate-600">
            <div className="flex gap-3 rounded-lg border border-[#D7E7EE] bg-white p-3 shadow-sm">
              <PhoneOutlined className="mt-1 text-vxn-saffron-500" />
              <div>
                <div className="text-slate-500">Hotline</div>
                <div className="font-semibold text-vxn-ink">1900 6067</div>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-[#D7E7EE] bg-white p-3 shadow-sm">
              <MailOutlined className="mt-1 text-vxn-saffron-500" />
              <div>
                <div className="text-slate-500">Email hỗ trợ</div>
                <div className="font-semibold text-vxn-ink">support@vexenhanh.vn</div>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-[#D7E7EE] bg-white p-3 shadow-sm">
              <EnvironmentOutlined className="mt-1 text-vxn-saffron-500" />
              <div>
                <div className="text-slate-500">Văn phòng</div>
                <div className="font-semibold text-vxn-ink">TP. Hồ Chí Minh, Việt Nam</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            {socialLinks.map(({ key, icon: Icon }) => (
              <span
                key={key}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-[#D7E7EE] bg-white text-vxn-teal-800 shadow-sm transition hover:border-vxn-teal-700 hover:bg-vxn-teal-700 hover:text-white"
              >
                <Icon />
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-[#D7E7EE] pt-6 text-[13px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 Vé Xe Nhanh. All rights reserved.</span>
        <span>Điều khoản sử dụng · Chính sách bảo mật · Chính sách hoàn tiền</span>
      </div>
    </div>
  </footer>
);

export default CustomerFooter;
