import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Empty, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  StarFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import { publicOperatorsApi } from '../services/operatorApi';
import { getOperatorDisplayName } from '../utils/operatorDisplay';

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : 'Gần đây');

const RatingRow = ({ label, value }) => {
  const score = Number(value || 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-vxn-fg-3">{label}</span>
        <span className="font-semibold text-vxn-ink">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-vxn-bg-fog">
        <div className="h-full rounded-full bg-vxn-saffron-500" style={{ width: `${Math.min((score / 5) * 100, 100)}%` }} />
      </div>
    </div>
  );
};

const OperatorPage = () => {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await publicOperatorsApi.getProfile(operatorId);

        if (!active) return;

        if (response.status === 'success' && response.data) {
          setProfile(response.data);
        } else {
          toast.error('Không tìm thấy hồ sơ nhà xe');
          setProfile(null);
        }
      } catch (error) {
        toast.error(typeof error === 'string' ? error : 'Không thể tải hồ sơ nhà xe');
        setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, [operatorId]);

  const operator = profile?.operator;
  const routes = profile?.activeRoutes || [];
  const ratingSummary = profile?.ratingSummary || {};
  const reviews = profile?.reviews || [];

  const ratingRows = useMemo(() => [
    ['Tổng quan', ratingSummary.averageRating || operator?.averageRating],
    ['Phương tiện', ratingSummary.averageVehicleRating],
    ['Tài xế', ratingSummary.averageDriverRating],
    ['Đúng giờ', ratingSummary.averagePunctualityRating],
    ['Dịch vụ', ratingSummary.averageServiceRating],
  ], [ratingSummary, operator]);

  const goToOperatorTrips = () => {
    navigate(`/search-results?operatorId=${operator.id}`);
  };

  if (loading) {
    return (
      <CustomerShell activeKey="explore" mainClassName="bg-vxn-bg-soft">
        <div className="grid min-h-screen place-items-center">
          <div className="text-center">
            <Spin size="large" />
            <div className="mt-4 text-sm font-medium text-vxn-fg-3">Đang tải hồ sơ nhà xe...</div>
          </div>
        </div>
      </CustomerShell>
    );
  }

  if (!operator) {
    return (
      <CustomerShell activeKey="explore" mainClassName="bg-vxn-bg-soft">
        <div className="grid min-h-screen place-items-center px-4">
          <Empty description="Không tìm thấy nhà xe" />
        </div>
      </CustomerShell>
    );
  }

  const operatorDisplayName = getOperatorDisplayName(operator, 'Nhà xe');

  return (
    <CustomerShell activeKey="explore" mainClassName="bg-vxn-bg-soft">
      <div className="border-b border-vxn-border bg-white px-4 py-4 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CustomerBreadcrumb
            items={[
              { label: 'Nhà xe' },
              { label: operatorDisplayName },
            ]}
          />
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </div>

      <section
        className="relative overflow-hidden px-4 py-9 text-white lg:px-8 lg:py-11"
        style={{ background: `linear-gradient(135deg, ${operator.color || '#07364C'} 0%, #006481 56%, #07364C 100%)` }}
      >
        <div className="pointer-events-none absolute right-[-120px] top-[-160px] h-96 w-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-[-160px] left-[45%] h-96 w-96 rounded-full bg-vxn-saffron-500/20" />
        <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="grid h-24 w-24 place-items-center rounded-[24px] bg-white text-3xl font-bold shadow-xl" style={{ color: operator.color || '#006481' }}>
              {operator.logo ? <img src={operator.logo} alt={operatorDisplayName} className="h-full w-full rounded-[24px] object-cover" /> : operator.shortName}
            </div>
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/85">
                <CheckCircleOutlined /> Nhà xe đối tác {operator.verificationStatus === 'approved' ? '· Đã xác thực' : ''}
              </div>
              <h1 className="m-0 text-3xl font-bold tracking-[-0.03em] lg:text-5xl">{operatorDisplayName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
                {operator.description || 'Nhà xe đối tác trên Vé Xe Nhanh, cung cấp lịch trình, giá vé và đánh giá minh bạch cho hành khách.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
            {[
              ['Đánh giá', `${Number(operator.averageRating || 0).toFixed(1)}/5`],
              ['Lượt đánh giá', Number(operator.totalReviews || 0).toLocaleString('vi-VN')],
              ['Đội xe', Number(operator.fleetSize || 0).toLocaleString('vi-VN')],
              ['Tuyến đang chạy', Number(operator.routeCount || 0).toLocaleString('vi-VN')],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.08em] text-white/65">{label}</div>
                <div className="mt-1 text-xl font-bold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1fr_360px]">
          <main className="min-w-0 space-y-5">
            <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-vxn-teal-700">Tổng quan</span>
                  <h2 className="m-0 mt-1 text-2xl font-bold text-vxn-ink">Về {operatorDisplayName}</h2>
                  <p className="m-0 mt-3 max-w-3xl text-sm leading-6 text-vxn-fg-3">
                    {operator.description || 'Thông tin giới thiệu nhà xe đang được cập nhật.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="primary" className="rounded-md border-0 bg-vxn-teal-700 font-semibold hover:!bg-vxn-teal-800" onClick={goToOperatorTrips}>
                    Tìm chuyến của hãng
                  </Button>
                  <Button className="rounded-md">Theo dõi</Button>
                </div>
              </div>
            </section>

            <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-vxn-teal-700">Tuyến hoạt động</span>
                <h2 className="m-0 text-2xl font-bold text-vxn-ink">Các tuyến đang mở bán</h2>
              </div>

              {routes.length === 0 ? (
                <Empty description="Nhà xe chưa có tuyến đang mở bán" />
              ) : (
                <div className="grid gap-3">
                  {routes.map((route) => (
                    <div key={route.id} className="rounded-2xl border border-vxn-border bg-vxn-bg-soft p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="m-0 text-lg font-bold text-vxn-ink">{route.from} → {route.to}</h3>
                            {route.code && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-vxn-fg-4">{route.code}</span>}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-vxn-fg-3">
                            {route.distance ? <span>{route.distance} km</span> : null}
                            {route.duration ? <span>{route.duration}</span> : null}
                            <span>{route.tripsPerDay || 0} chuyến sắp tới</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 lg:text-right">
                          <div>
                            <div className="text-xs text-vxn-fg-5">Giá từ</div>
                            <div className="font-bold text-vxn-saffron-700">
                              {route.minPrice ? formatCurrency(route.minPrice) : 'Đang cập nhật'}
                            </div>
                          </div>
                          <Button onClick={goToOperatorTrips}>Tìm vé</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-vxn-teal-700">Đánh giá</span>
                <h2 className="m-0 text-2xl font-bold text-vxn-ink">Nhận xét gần đây</h2>
              </div>

              {reviews.length === 0 ? (
                <Empty description="Chưa có đánh giá công khai" />
              ) : (
                <div className="grid gap-3">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-2xl border border-vxn-border bg-white p-4">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-vxn-teal-700 text-sm font-bold text-white">
                          {(review.customerName || 'KH').split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-semibold text-vxn-ink">{review.customerName}</div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-vxn-ink">
                              <StarFilled className="text-vxn-saffron-600" /> {Number(review.rating || 0).toFixed(1)}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-vxn-fg-5">
                            {review.route ? `${review.route.from} → ${review.route.to} · ` : ''}{formatDate(review.createdAt)}
                          </div>
                          {review.comment && <p className="m-0 mt-3 text-sm leading-6 text-vxn-fg-2">{review.comment}</p>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <StarFilled className="text-vxn-saffron-600" />
                <h2 className="m-0 text-lg font-bold text-vxn-ink">Điểm đánh giá</h2>
              </div>
              <div className="mb-5 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-[-0.04em] text-vxn-ink">{Number(operator.averageRating || 0).toFixed(1)}</span>
                <span className="pb-2 text-sm text-vxn-fg-4">/ 5 · {Number(operator.totalReviews || 0).toLocaleString('vi-VN')} lượt</span>
              </div>
              <div className="space-y-3">
                {ratingRows.map(([label, value]) => <RatingRow key={label} label={label} value={value} />)}
              </div>
            </section>

            <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
              <h2 className="m-0 mb-4 text-lg font-bold text-vxn-ink">Liên hệ & văn phòng</h2>
              <div className="space-y-3 text-sm text-vxn-fg-2">
                {operator.phone && <div className="flex items-start gap-2"><PhoneOutlined className="mt-1 text-vxn-teal-700" /> <span>{operator.phone}</span></div>}
                {operator.email && <div className="flex items-start gap-2"><MailOutlined className="mt-1 text-vxn-teal-700" /> <span>{operator.email}</span></div>}
                {operator.website && <div className="flex items-start gap-2"><GlobalOutlined className="mt-1 text-vxn-teal-700" /> <span>{operator.website}</span></div>}
                {operator.fullAddress && <div className="flex items-start gap-2"><EnvironmentOutlined className="mt-1 text-vxn-teal-700" /> <span>{operator.fullAddress}</span></div>}
                {operator.foundedYear && <div className="flex items-start gap-2"><CalendarOutlined className="mt-1 text-vxn-teal-700" /> <span>Hoạt động từ {operator.foundedYear}</span></div>}
              </div>
            </section>

            <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
              <h2 className="m-0 mb-4 text-lg font-bold text-vxn-ink">Chính sách nổi bật</h2>
              <div className="space-y-3 text-sm text-vxn-fg-2">
                <div className="flex gap-2"><SafetyCertificateOutlined className="mt-1 text-vxn-teal-700" /> Hoàn tiền theo điều kiện từng chuyến.</div>
                <div className="flex gap-2"><CarOutlined className="mt-1 text-vxn-teal-700" /> Thông tin xe và ghế được cập nhật trước giờ chạy.</div>
                <div className="flex gap-2"><CheckCircleOutlined className="mt-1 text-vxn-teal-700" /> Vé điện tử xác nhận qua email hoặc số điện thoại.</div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </CustomerShell>
  );
};

export default OperatorPage;
