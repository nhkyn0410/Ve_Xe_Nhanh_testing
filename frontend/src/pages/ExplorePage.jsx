import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOutlined,
  CarOutlined,
  FileTextOutlined,
  GiftOutlined,
  GlobalOutlined,
  RiseOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import CustomerShell from '../components/customer/CustomerShell';

const exploreSections = [
  {
    key: 'popular-trips',
    title: 'Chuyến phổ biến',
    description: 'Các tuyến, khung giờ và mức giá đang được khách hàng quan tâm.',
    icon: RiseOutlined,
    cta: 'Xem chuyến',
    path: '/trips',
    todo: 'TODO: Nối dữ liệu tuyến/chuyến phổ biến từ API hoặc endpoint explore aggregate.',
  },
  {
    key: 'operators',
    title: 'Nhà xe nổi bật',
    description: 'Nhà xe đối tác, hạng dịch vụ, đánh giá và tiện ích chính.',
    icon: ShopOutlined,
    cta: 'Xem nhà xe',
    path: '/trips',
    todo: 'TODO: Thay skeleton bằng danh sách nhà xe thật khi có API public operators list.',
  },
  {
    key: 'programs',
    title: 'Chương trình',
    description: 'Ưu đãi, hạng thành viên, voucher và các chiến dịch đang chạy.',
    icon: GiftOutlined,
    cta: 'Xem thành viên',
    path: '/loyalty',
    todo: 'TODO: Map banner/voucher/loyalty campaign từ backend content hoặc voucher service.',
  },
  {
    key: 'news',
    title: 'Tin tức & cẩm nang',
    description: 'Bài viết mới, hướng dẫn đi xe, chính sách và thông báo dịch vụ.',
    icon: FileTextOutlined,
    cta: 'Đọc tin tức',
    path: '/tin-tuc',
    todo: 'TODO: Dùng content API cho blog/news/FAQ thay cho skeleton.',
  },
];

const SkeletonLine = ({ className = 'w-full' }) => (
  <span className={`block h-2.5 rounded-full bg-vxn-bg-cloud ${className}`} />
);

const SkeletonCard = () => (
  <div className="rounded-lg border border-vxn-border bg-white p-4 shadow-sm">
    <div className="h-24 rounded-md bg-vxn-bg-mist" />
    <div className="mt-4 space-y-2.5">
      <SkeletonLine className="w-4/5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-2/3" />
    </div>
    <div className="mt-5 flex items-center justify-between">
      <SkeletonLine className="w-20" />
      <span className="h-8 w-8 rounded-full bg-vxn-bg-cloud" />
    </div>
  </div>
);

const ExploreSection = ({ section }) => {
  const navigate = useNavigate();
  const Icon = section.icon;

  return (
    <section className="py-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-vxn-saffron-700">
            <Icon className="text-[15px]" />
            Khám phá
          </div>
          <h2 className="m-0 text-[24px] font-semibold tracking-normal text-vxn-ink">
            {section.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-vxn-fg-3">{section.description}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-vxn-border bg-white px-4 text-sm font-medium text-vxn-teal-800 transition hover:border-vxn-teal-600 hover:text-vxn-teal-900"
          onClick={() => navigate(section.path)}
        >
          {section.cta}
          <ArrowRightOutlined className="text-xs" />
        </button>
      </div>

      {/* TODO: Replace placeholder cards after ExplorePage visual design and data contract are finalized. */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="mt-4 rounded-md border border-dashed border-vxn-border-strong bg-white px-4 py-3 text-sm text-vxn-fg-3">
        {section.todo}
      </div>
    </section>
  );
};

const ExplorePage = () => {
  return (
    <CustomerShell activeKey="explore" mainClassName="bg-vxn-bg-soft">
      <header className="border-b border-vxn-border bg-white">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-vxn-bg-mist px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-vxn-teal-800">
            <GlobalOutlined />
            TODO skeleton
          </div>
          <h1 className="mt-5 max-w-3xl text-[34px] font-semibold leading-tight tracking-normal text-vxn-ink sm:text-[42px]">
            Khám phá Vé Xe Nhanh
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-vxn-fg-3">
            Trang tổng hợp cho tin tức, chuyến phổ biến, nhà xe nổi bật và các chương
            trình đang chạy. Hiện mới dựng khung để chốt cấu trúc nội dung trước khi
            nối dữ liệu thật.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 py-2 sm:px-6 lg:px-10">
        {exploreSections.map((section) => (
          <ExploreSection key={section.key} section={section} />
        ))}

        <section className="pb-12 pt-4">
          <div className="rounded-lg border border-vxn-border bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-vxn-teal-700 text-white">
                <CarOutlined />
              </span>
              <div>
                <h2 className="m-0 text-lg font-semibold text-vxn-ink">TODO dữ liệu & thiết kế</h2>
                <p className="mt-2 text-sm leading-6 text-vxn-fg-3">
                  TODO: Sau khi có thiết kế chính thức, thay skeleton bằng module thật,
                  ưu tiên dùng dữ liệu API hiện có và chỉ thêm fallback khi backend chưa hỗ trợ.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </CustomerShell>
  );
};

export default ExplorePage;
