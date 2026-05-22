import {
  CarOutlined,
  GiftOutlined,
  PlusSquareOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import CustomerShell from '../components/customer/CustomerShell';

const addonSkeletons = [
  {
    title: 'Bảo hiểm chuyến đi',
    icon: SafetyCertificateOutlined,
    todo: 'TODO: Đồng bộ với add-ons trong luồng PassengerInfoPage.',
  },
  {
    title: 'Hành lý ký gửi',
    icon: GiftOutlined,
    todo: 'TODO: Nối giá và điều kiện theo từng nhà xe/chuyến.',
  },
  {
    title: 'Đưa đón điểm hẹn',
    icon: CarOutlined,
    todo: 'TODO: Xác định phạm vi hỗ trợ theo tuyến và điểm dừng.',
  },
];

const AddonsPage = () => {
  return (
    <CustomerShell activeKey="addons" mainClassName="bg-vxn-bg-soft">
      <header className="border-b border-vxn-border bg-white">
        <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-vxn-bg-mist px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-vxn-teal-800">
            <PlusSquareOutlined />
            TODO skeleton
          </div>
          <h1 className="mt-5 text-[32px] font-semibold leading-tight tracking-normal text-vxn-ink sm:text-[40px]">
            Dịch vụ bổ trợ
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-vxn-fg-3">
            Khung nội dung cho các dịch vụ có thể mua kèm trong luồng đặt vé. Trang
            này chưa chốt thiết kế và chưa tự tạo booking/add-on ngoài flow đặt vé.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 lg:px-10">
        {/* TODO: Replace these placeholders when standalone add-on browsing is designed. */}
        <div className="grid gap-4 md:grid-cols-3">
          {addonSkeletons.map((item) => {
            const Icon = item.icon;

            return (
              <section
                key={item.title}
                className="rounded-lg border border-vxn-border bg-white p-5 shadow-sm"
              >
                <span className="grid h-11 w-11 place-items-center rounded-md bg-vxn-teal-700 text-white">
                  <Icon className="text-lg" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-vxn-ink">{item.title}</h2>
                <div className="mt-4 space-y-2.5">
                  <span className="block h-2.5 w-4/5 rounded-full bg-vxn-bg-cloud" />
                  <span className="block h-2.5 w-full rounded-full bg-vxn-bg-cloud" />
                  <span className="block h-2.5 w-2/3 rounded-full bg-vxn-bg-cloud" />
                </div>
                <p className="mt-5 rounded-md border border-dashed border-vxn-border-strong bg-vxn-bg-soft px-3 py-2 text-sm leading-6 text-vxn-fg-3">
                  {item.todo}
                </p>
              </section>
            );
          })}
        </div>
      </main>
    </CustomerShell>
  );
};

export default AddonsPage;
