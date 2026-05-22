import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoComplete, Button, DatePicker, Form, Select } from 'antd';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CarOutlined,
  DownOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GiftOutlined,
  PhoneOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  SwapOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import heroImage from '../assets/brand/hero-landscape.jpg';
import danangHueImage from '../assets/img/Da Nang-Hue.jpg';
import hanoiHaLongImage from '../assets/img/Ha Noi-Ha Long.jpg';
import hanoiNinhBinhImage from '../assets/img/HA NOI-NINH BINH.png';
import hanoiSapaImage from '../assets/img/HA NOI-SAPA.jpg';
import hcmDaLatImage from '../assets/img/TH HCM-DA LAT.png';
import hcmNhaTrangImage from '../assets/img/TP HCM-NHA TRANG.jpg';
import hcmVungTauImage from '../assets/img/TP HCM-VUNG TAU.png';
import CustomerShell from '../components/customer/CustomerShell';
import ContentBanners from '../components/customer/ContentBanners';
import useBookingStore from '../store/bookingStore';

const cityOptions = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nha Trang',
  'Huế',
  'Vũng Tàu',
  'Đà Lạt',
  'Quy Nhơn',
  'Phan Thiết',
  'Hạ Long',
  'Sapa',
  'Phú Quốc',
  'Buôn Ma Thuột',
];

const popularRoutesFallback = [
  {
    from: 'TP. Hồ Chí Minh',
    to: 'Đà Lạt',
    km: 308,
    hours: '7 tiếng',
    fromPrice: 280000,
    rating: '4.8',
    image: hcmDaLatImage,
  },
  {
    from: 'Hà Nội',
    to: 'Sapa',
    km: 320,
    hours: '5 tiếng',
    fromPrice: 350000,
    rating: '4.8',
    image: hanoiSapaImage,
  },
  {
    from: 'Hà Nội',
    to: 'Hạ Long',
    km: 165,
    hours: '3 tiếng',
    fromPrice: 180000,
    rating: '4.7',
    image: hanoiHaLongImage,
  },
  {
    from: 'TP. Hồ Chí Minh',
    to: 'Vũng Tàu',
    km: 125,
    hours: '2 tiếng',
    fromPrice: 120000,
    rating: '4.6',
    image: hcmVungTauImage,
  },
  {
    from: 'Đà Nẵng',
    to: 'Huế',
    km: 100,
    hours: '2 tiếng',
    fromPrice: 110000,
    rating: '4.6',
    image: danangHueImage,
  },
  {
    from: 'TP. Hồ Chí Minh',
    to: 'Nha Trang',
    km: 440,
    hours: '9 tiếng',
    fromPrice: 420000,
    rating: '4.7',
    image: hcmNhaTrangImage,
  },
  {
    from: 'Hà Nội',
    to: 'Ninh Bình',
    km: 95,
    hours: '2 tiếng',
    fromPrice: 130000,
    rating: '4.7',
    image: hanoiNinhBinhImage,
  },
];

const operatorFallback = [
  { name: 'Hà Linh Express', short: 'HL', color: '#E89B26', rating: 4.8, reviews: 12840 },
  { name: 'Phương Nam Travel', short: 'PN', color: '#006481', rating: 4.6, reviews: 8930 },
  { name: 'Tâm Hạnh Limousine', short: 'TH', color: '#1D4ED8', rating: 4.7, reviews: 5210 },
  { name: 'Hoàng Long Coach', short: 'HL', color: '#00613D', rating: 4.5, reviews: 21405 },
  { name: 'Mai Hương Sleeper', short: 'MH', color: '#D18A1E', rating: 4.4, reviews: 3204 },
];

const valueProps = [
  {
    icon: SafetyCertificateOutlined,
    title: 'Vé điện tử có QR',
    body: 'Lên xe quét QR, không cần in giấy.',
  },
  {
    icon: ReloadOutlined,
    title: 'Đổi & hủy linh hoạt',
    body: 'Hoàn 90% trước 24h. Đổi chuyến miễn phí.',
  },
  {
    icon: StarOutlined,
    title: 'Tích điểm thân thiết',
    body: '1 điểm = 1.000đ giảm. Hạng Gold giảm 10%.',
  },
  { icon: PhoneOutlined, title: 'Hỗ trợ 24/7', body: 'CSKH tiếng Việt qua app, Zalo và hotline.' },
];

const homeGuidePosts = [
  {
    title: 'Mẹo chọn ghế trên xe giường nằm',
    category: 'Hành trình',
    image:
      'https://res.anvui.vn/dwi5f2bje/image/upload/v1746516142/news/images/1746515715/zwnhtezvucp2eaahuo8c.jpg',
  },
  {
    title: 'Top 8 quán phở bò trứ danh dọc QL1 Bắc — Trung',
    category: 'Du lịch',
    image: 'https://store.longphuong.vn/wp-content/uploads/2023/02/bat-to-dung-pho-su-1.jpg',
  },
  {
    title: 'Quy định mới về hành lý xe khách 2026',
    category: 'Chính sách',
    image:
      'https://xekhachtuanyen.vn/wp-content/uploads/2023/06/Chuan-bi-hanh-ly-khi-di-xe-khach-duong-dai.jpg',
  },
];

const passengerOptions = Array.from({ length: 6 }, (_, index) => {
  const value = index + 1;
  return {
    value,
    label: `${value} người lớn`,
  };
});

const formatCurrency = (value) => `${value.toLocaleString('vi-VN')}đ`;

const UtilityPills = () => (
  <div className="absolute right-4 top-4 z-20 hidden items-center gap-2 sm:flex lg:right-6 lg:top-5">
    <div className="inline-flex h-9 items-center gap-2 rounded-full bg-white/95 px-3.5 text-[13px] font-medium text-vxn-ink shadow-sm backdrop-blur">
      <PhoneOutlined className="text-vxn-teal-700" />
      CSKH 1900 6067
    </div>
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-full border-0 bg-vxn-teal-900/75 px-3.5 text-[13px] font-medium text-white backdrop-blur"
    >
      <span className="grid h-[14px] w-[22px] place-items-center rounded-sm bg-[#DA251D] text-[10px] text-[#FFCD00]">
        ★
      </span>
      VI
      <DownOutlined className="text-[10px]" />
    </button>
  </div>
);

const SearchFieldShell = ({ icon: Icon, label, children, last = false }) => (
  <div
    className={`flex min-h-[92px] flex-col justify-center gap-1 bg-white px-5 py-3 lg:min-h-[112px] ${
      last ? '' : 'border-b border-vxn-border lg:border-b-0 lg:border-r'
    }`}
  >
    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-vxn-fg-4">
      <Icon className="text-[12px] text-vxn-teal-700" />
      {label}
    </div>
    {children}
  </div>
);

const SearchOverlayCard = ({ form, initialValues, loading, onSearch, onSwap, onTabAction }) => (
  <div className="vxn-home-search flex flex-col rounded-2xl border border-white/60 bg-white/[0.98] p-2 shadow-[0_30px_60px_-20px_rgba(0,40,60,0.40)] backdrop-blur lg:min-h-[312px]">
    <div className="flex border-b border-vxn-border lg:min-h-[58px]">
      {[
        { key: 'buy', label: 'Mua vé', icon: FileTextOutlined },
        { key: 'lookup', label: 'Tra cứu vé', icon: QrcodeOutlined },
        { key: 'operators', label: 'Theo nhà xe', icon: CarOutlined },
      ].map((item, index) => {
        const Icon = item.icon;
        const active = index === 0;

        return (
          <button
            key={item.key}
            type="button"
            className={`mb-[-1px] inline-flex items-center gap-2 border-0 border-b-2 bg-transparent px-4 py-3 text-[14px] transition sm:px-6 lg:px-7 ${
              active
                ? 'border-vxn-teal-700 font-semibold text-vxn-teal-800'
                : 'border-transparent font-medium text-vxn-fg-3 hover:text-vxn-teal-800'
            }`}
            onClick={() => onTabAction(item.key)}
          >
            <Icon className="text-[15px]" />
            {item.label}
          </button>
        );
      })}
    </div>

    <Form
      form={form}
      initialValues={initialValues}
      onFinish={onSearch}
      className="flex flex-1 flex-col p-4 sm:p-5 lg:p-7"
    >
      <div className="grid overflow-hidden rounded-xl border border-vxn-border bg-white lg:grid-cols-[1fr_56px_1fr_1fr_1fr]">
        <SearchFieldShell icon={EnvironmentOutlined} label="Điểm đi">
          <Form.Item
            name="fromCity"
            rules={[{ required: true, message: 'Vui lòng nhập điểm đi!' }]}
          >
            <AutoComplete
              options={cityOptions.map((city) => ({ value: city }))}
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              }
              placeholder="Chọn điểm đi"
            />
          </Form.Item>
        </SearchFieldShell>

        <div className="grid min-h-[56px] place-items-center border-b border-vxn-border bg-white lg:min-h-[112px] lg:border-b-0 lg:border-r">
          <button
            type="button"
            className="grid h-[38px] w-[38px] place-items-center rounded-full border border-vxn-border bg-white text-vxn-fg-2 transition hover:border-vxn-teal-600 hover:text-vxn-teal-800"
            onClick={onSwap}
            aria-label="Đổi điểm đi và điểm đến"
          >
            <SwapOutlined />
          </button>
        </div>

        <SearchFieldShell icon={EnvironmentOutlined} label="Điểm đến">
          <Form.Item name="toCity" rules={[{ required: true, message: 'Vui lòng nhập điểm đến!' }]}>
            <AutoComplete
              options={cityOptions.map((city) => ({ value: city }))}
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              }
              placeholder="Chọn điểm đến"
            />
          </Form.Item>
        </SearchFieldShell>

        <SearchFieldShell icon={CalendarOutlined} label="Ngày đi">
          <Form.Item name="date" rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}>
            <DatePicker
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              suffixIcon={null}
              allowClear={false}
            />
          </Form.Item>
        </SearchFieldShell>

        <SearchFieldShell icon={UserOutlined} label="Số khách" hint="Tối đa 10 vé/đặt" last>
          <Form.Item
            name="passengers"
            rules={[{ required: true, message: 'Vui lòng chọn số khách!' }]}
          >
            <Select options={passengerOptions} suffixIcon={null} />
          </Form.Item>
        </SearchFieldShell>
      </div>

      <div className="mt-[18px] flex flex-col gap-4 lg:mt-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE9C4] px-3 py-1.5 text-xs font-medium text-vxn-saffron-700">
            <GiftOutlined />
            MÃ HE2026 · GIẢM 12%
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-vxn-bg-cloud px-3 py-1.5 text-xs font-medium text-vxn-fg-2">
            <TeamOutlined />
            HÀNH LÝ TRẢ TRƯỚC
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-vxn-bg-cloud px-3 py-1.5 text-xs font-medium text-vxn-fg-2">
            <ReloadOutlined />
            ĐỔI/HỦY MIỄN PHÍ
          </span>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<SearchOutlined />}
          className="h-[52px] min-w-[176px] rounded-md border-0 bg-vxn-teal-700 px-9 text-base font-semibold shadow-[0_4px_6px_-4px_rgba(0,100,129,0.30)] hover:!bg-vxn-teal-800"
        >
          Tìm chuyến
        </Button>
      </div>
    </Form>
  </div>
);

const RouteCardLarge = ({ route, onFill, onSubmit }) => (
  <div
    className="relative flex min-h-[280px] overflow-hidden rounded-2xl bg-cover bg-[40%_45%] p-7 text-white"
    style={{
      backgroundImage: `linear-gradient(180deg, rgba(0,40,60,.10) 0%, rgba(0,40,60,.76) 100%), url(${route.image || heroImage})`,
    }}
  >
    <div className="relative z-10 flex w-full flex-col justify-between">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#FFE9C4] px-3 py-1 text-[11px] font-semibold text-vxn-saffron-700">
          NỔI BẬT
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <StarFilled className="text-vxn-saffron-500" />
          {route.rating}
        </span>
      </div>

      <div>
        <div className="mb-1 text-[13px] font-medium text-white/[0.85]">
          {route.km} km · {route.hours} · giường nằm & limousine
        </div>
        <button
          type="button"
          className="mb-4 flex flex-wrap items-baseline gap-3 border-0 bg-transparent p-0 text-left text-white"
          onClick={() => onFill(route)}
        >
          <span className="text-[28px] font-bold leading-tight tracking-normal">{route.from}</span>
          <ArrowRightOutlined className="text-lg text-vxn-saffron-500" />
          <span className="text-[28px] font-bold leading-tight tracking-normal">{route.to}</span>
        </button>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[12px] text-white/70">Từ</div>
            <div className="text-[22px] font-bold text-vxn-saffron-500">
              {formatCurrency(route.fromPrice)}
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-md border-0 bg-vxn-saffron-600 px-4 text-sm font-semibold text-white transition hover:bg-vxn-saffron-700"
            onClick={() => onSubmit(route)}
          >
            Đặt vé ngay
            <ArrowRightOutlined className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const getSmallRouteCardSizeClass = (hasImage, compact) => {
  if (hasImage) {
    return compact ? 'min-h-[190px] p-5 text-white' : 'min-h-[280px] p-5 text-white';
  }

  if (compact) {
    return 'gap-2 p-4';
  }

  return 'min-h-[130px] gap-3 p-5';
};

const RouteCardSmall = ({ route, compact = false, onSubmit }) => {
  const hasImage = Boolean(route.image);
  const sizeClass = getSmallRouteCardSizeClass(hasImage, compact);

  return (
    <button
      type="button"
      className={`relative flex flex-col overflow-hidden rounded-xl border border-vxn-border bg-white text-left transition hover:border-vxn-teal-300 hover:shadow-md ${sizeClass}`}
      style={
        hasImage
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(0,40,60,.08) 0%, rgba(0,40,60,.48) 44%, rgba(0,40,60,.84) 100%), url(${route.image})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }
          : undefined
      }
      onClick={() => onSubmit(route)}
    >
      <div className="relative z-10 flex flex-1 flex-col gap-2">
        {hasImage ? (
          <span className="w-fit rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <StarFilled className="mr-1 text-vxn-saffron-500" />
            {route.rating}
          </span>
        ) : null}
        <div className={`flex flex-col gap-2 ${hasImage ? 'mt-auto' : 'flex-1'}`}>
          <div
            className={`flex items-center gap-2 text-[17px] font-semibold leading-snug ${
              hasImage ? 'text-white' : 'text-vxn-ink'
            }`}
          >
            <span className="truncate">{route.from}</span>
            <ArrowRightOutlined
              className={`shrink-0 text-[13px] ${hasImage ? 'text-vxn-saffron-500' : 'text-vxn-fg-5'}`}
            />
            <span className="truncate">{route.to}</span>
          </div>
          <div className={`text-[13px] ${hasImage ? 'text-white/80' : 'text-vxn-fg-5'}`}>
            {route.km} km · {route.hours}
          </div>
          <div
            className={`${hasImage ? 'mt-3' : 'mt-auto'} flex items-baseline justify-between gap-3`}
          >
            <div>
              <span className={`text-[12px] ${hasImage ? 'text-white/70' : 'text-vxn-fg-5'}`}>
                Từ{' '}
              </span>
              <span className="text-[17px] font-bold text-vxn-saffron-700">
                {formatCurrency(route.fromPrice)}
              </span>
            </div>
            <span
              className={`whitespace-nowrap text-[13px] font-medium ${
                hasImage ? 'text-white' : 'text-vxn-teal-800'
              }`}
            >
              Xem chuyến →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

const ValueProps = () => (
  <section className="bg-vxn-bg-soft px-4 py-8 lg:px-14">
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
      {valueProps.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.title} className="flex gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-vxn-border bg-white text-vxn-teal-700">
              <Icon className="text-[21px]" />
            </div>
            <div>
              <div className="mb-1 text-[16px] font-semibold text-vxn-ink">{item.title}</div>
              <div className="text-[14px] leading-5 text-vxn-fg-3">{item.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

const OperatorsSection = ({ navigate }) => (
  <section className="bg-white px-4 py-12 lg:px-14">
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="m-0 text-[24px] font-semibold leading-tight text-vxn-ink">Nhà xe đối tác</h2>
      <button
        type="button"
        className="border-0 bg-transparent text-[14px] font-medium text-vxn-teal-800"
        onClick={() => navigate('/trips')}
      >
        Xem cả 218 nhà xe →
      </button>
    </div>

    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {operatorFallback.map((operator) => (
        <button
          key={operator.name}
          type="button"
          className="flex flex-col gap-2.5 rounded-xl border border-vxn-border bg-white p-[18px] text-left transition hover:border-vxn-teal-300 hover:shadow-md"
          onClick={() => navigate('/trips')}
        >
          <span
            className="grid h-11 w-11 place-items-center rounded-[10px] text-base font-bold text-white"
            style={{ backgroundColor: operator.color }}
          >
            {operator.short}
          </span>
          <span className="text-[15px] font-semibold text-vxn-ink">{operator.name}</span>
          <span className="flex items-center gap-1.5 text-[13px] text-vxn-fg-3">
            <StarFilled className="text-vxn-saffron-600" />
            <strong className="font-semibold text-vxn-ink">{operator.rating}</strong>
            <span>· {operator.reviews.toLocaleString('vi-VN')} đánh giá</span>
          </span>
        </button>
      ))}
    </div>
  </section>
);

const NewHomePage = () => {
  const navigate = useNavigate();
  const searchCardRef = useRef(null);
  const { searchCriteria, setSearchCriteria } = useBookingStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const initialValues = useMemo(
    () => ({
      date: searchCriteria.date ? dayjs(searchCriteria.date) : dayjs(),
      passengers: searchCriteria.passengers || 2,
    }),
    [searchCriteria]
  );

  const { featuredRoute, topRowRoutes, bottomRowRoutes } = useMemo(() => {
    const featuredIdx = 0;
    const topIndices = [1, 3];
    const usedIndices = new Set([featuredIdx, ...topIndices]);

    return {
      featuredRoute: popularRoutesFallback[featuredIdx],
      topRowRoutes: topIndices.map((i) => popularRoutesFallback[i]),
      bottomRowRoutes: popularRoutesFallback.filter((_, i) => !usedIndices.has(i)).slice(0, 4),
    };
  }, []);

  const buildSearchData = (values) => {
    const passengers = Math.min(Math.max(Number(values.passengers || 1), 1), 6);

    return {
      fromCity: values.fromCity,
      toCity: values.toCity,
      date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
      passengers,
    };
  };

  const submitSearchData = (searchData) => {
    if (!searchData.fromCity || !searchData.toCity) {
      toast.error('Vui lòng nhập điểm đi và điểm đến');
      return;
    }

    if (searchData.fromCity === searchData.toCity) {
      toast.error('Điểm đi và điểm đến phải khác nhau');
      return;
    }

    if (!searchData.date) {
      toast.error('Vui lòng chọn ngày đi');
      return;
    }

    setSearchCriteria(searchData);
    navigate('/search-results');
  };

  const handleSearch = (values) => {
    try {
      setLoading(true);
      submitSearchData(buildSearchData(values));
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapCities = () => {
    const fromCity = form.getFieldValue('fromCity');
    const toCity = form.getFieldValue('toCity');
    form.setFieldsValue({ fromCity: toCity, toCity: fromCity });
  };

  const handleTabAction = (key) => {
    if (key === 'lookup') {
      navigate('/tickets/lookup');
      return;
    }

    if (key === 'operators') {
      navigate('/trips');
    }
  };

  const fillRoute = (route) => {
    form.setFieldsValue({
      fromCity: route.from,
      toCity: route.to,
      date: form.getFieldValue('date') || dayjs(),
      passengers: form.getFieldValue('passengers') || 1,
    });
    searchCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submitRoute = (route) => {
    const routeValues = {
      fromCity: route.from,
      toCity: route.to,
      date: form.getFieldValue('date') || dayjs(),
      passengers: form.getFieldValue('passengers') || 1,
    };

    form.setFieldsValue(routeValues);
    submitSearchData(buildSearchData(routeValues));
  };

  return (
    <CustomerShell mainClassName="bg-white">
      <section className="relative isolate overflow-x-clip bg-vxn-ink">
        <div
          className="absolute inset-0 bg-cover bg-[10%_58%] [@media(min-width:1920px)]:bg-[40%_58%]"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,71,107,0)_0%,rgba(0,40,60,0)_48%,rgba(0,40,60,.56)_100%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[-8%] top-1/3 hidden h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(243,177,50,0.28),rgba(243,177,50,0)_70%)] lg:block"
          aria-hidden="true"
        />
        <UtilityPills />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-14 pt-20 sm:px-6 lg:h-[100svh] lg:px-14 lg:pb-6 lg:pt-[clamp(4.5rem,12vh,8.5rem)]">
          <div className="max-w-[780px] text-white">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-vxn-teal-600/95 px-5 py-3.5 text-xs font-medium uppercase tracking-[0.08em] text-white ">
              <TagsOutlined className="text-[13px]" />
              Ưu đãi hè · Giảm đến 35% tuyến miền Bắc
            </div>
            <h1 className="m-0 text-[42px] font-bold leading-[1.05] tracking-normal text-white drop-shadow-[0_4px_24px_rgba(0,40,60,.40)] sm:text-[56px]">
              Đi Việt Nam.
              <br />
              <span className="text-vxn-saffron-500">Nhanh hơn, gọn hơn.</span>
            </h1>
            <p className="mt-3 max-w-[580px] text-base font-normal leading-7 text-white/[0.92] drop-shadow-[0_2px_12px_rgba(0,40,60,.40)] sm:text-lg">
              5,400+ chuyến mỗi ngày · 218 nhà xe đối tác · Tích điểm sau mỗi chuyến đi
            </p>
          </div>

          <div
            ref={searchCardRef}
            className="mt-8 lg:absolute lg:bottom-6 lg:left-1/2 lg:right-auto lg:mt-0 lg:w-[calc(100%-7rem)] lg:max-w-[1040px] lg:-translate-x-1/2"
          >
            <SearchOverlayCard
              form={form}
              initialValues={initialValues}
              loading={loading}
              onSearch={handleSearch}
              onSwap={handleSwapCities}
              onTabAction={handleTabAction}
            />
          </div>
        </div>
      </section>

      <ContentBanners
        position="homepage"
        className="bg-white px-4 pt-8 lg:px-14 lg:pt-6"
        containerClassName="mx-auto grid w-full max-w-[1440px] gap-4"
      />

      <section className="bg-white px-4 pb-12 pt-8 lg:px-14 lg:pt-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-1.5 inline-block text-[14px] font-semibold uppercase tracking-[0.12em] text-vxn-saffron-700">
              Tuyến phổ biến
            </span>
            <h2 className="m-0 text-[30px] font-semibold leading-tight tracking-normal text-vxn-ink">
              Việt Nam, mọi cung đường
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 border-0 bg-transparent text-[14px] font-medium text-vxn-teal-800"
            onClick={() => navigate('/trips')}
          >
            Xem tất cả 320+ tuyến
            <ArrowRightOutlined className="text-xs" />
          </button>
        </div>

        <div className="grid gap-[18px] xl:grid-cols-[2fr_1fr_1fr]">
          <RouteCardLarge route={featuredRoute} onFill={fillRoute} onSubmit={submitRoute} />
          {topRowRoutes.map((route) => (
            <RouteCardSmall
              key={`${route.from}-${route.to}`}
              route={route}
              onSubmit={submitRoute}
            />
          ))}
        </div>
        <div className="mt-[18px] grid gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
          {bottomRowRoutes.map((route) => (
            <RouteCardSmall
              key={`${route.from}-${route.to}`}
              route={route}
              compact
              onSubmit={submitRoute}
            />
          ))}
        </div>
      </section>

      <ValueProps />
      <OperatorsSection navigate={navigate} />

      <section className="bg-white px-4 pb-16 lg:px-14">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(110deg,var(--vxn-teal-800)_0%,var(--vxn-teal-700)_60%,#034e63_100%)] p-8 text-white">
            <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(243,177,50,.30),rgba(243,177,50,0))]" />
            <span className="relative z-10 text-xs font-semibold uppercase tracking-[0.12em] text-vxn-saffron-500">
              Hạng thành viên
            </span>
            <div className="relative z-10">
              <h3 className="m-0 max-w-[520px] text-[28px] font-semibold leading-tight text-white">
                Đặt 10 vé, lên Gold. Giảm 10% mọi chuyến trong năm.
              </h3>
              <p className="my-4 max-w-xl text-[14px] leading-6 text-white/82">
                Tích điểm tự động sau mỗi chuyến đi. Đổi 100 điểm = 100.000đ giảm.
              </p>
              <button
                type="button"
                className="h-10 rounded-md border-0 bg-vxn-saffron-600 px-5 text-sm font-semibold text-white"
                onClick={() => navigate('/loyalty')}
              >
                Tham gia VXN Plus
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-vxn-border bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[17px] font-semibold text-vxn-ink">Cẩm nang xe khách</span>
              <button
                type="button"
                className="border-0 bg-transparent text-[14px] font-medium text-vxn-teal-800"
                onClick={() => navigate('/news')}
              >
                Tin tức →
              </button>
            </div>
            {homeGuidePosts.map(({ title, category, image }) => (
              <button
                key={title}
                type="button"
                className="flex w-full gap-3 border-0 bg-transparent py-2 text-left"
                onClick={() => navigate('/news')}
              >
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#FDE7C2]">
                  <img src={image} alt={title} className="h-full w-full object-cover" />
                </span>
                <span>
                  <span className="block text-[15px] font-medium leading-snug text-vxn-ink">
                    {title}
                  </span>
                  <span className="mt-1 block text-[13px] text-vxn-fg-5">{category}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </CustomerShell>
  );
};

export default NewHomePage;
