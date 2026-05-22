import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message, Modal, Button } from 'antd';
import {
  CheckOutlined,
  HomeOutlined,
  PrinterOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useBookingStore from '../../store/bookingStore';
import api from '../../services/api';
import CustomerShell from '../../components/customer/CustomerShell';
import CustomerBreadcrumb from '../../components/customer/CustomerBreadcrumb';
import PaymentResultCard from '../../components/customer/PaymentResultCard';
import SaffronTicketCard from '../../components/customer/SaffronTicketCard';

const BOOKING_STEPS = [
  { key: 'seats', label: 'Chọn ghế' },
  { key: 'passenger', label: 'Thông tin hành khách' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'done', label: 'Hoàn tất' },
];

const BookingStepper = ({ current = 4 }) => (
  <div className="border-b border-vxn-border bg-white px-4 py-4 lg:px-8">
    <ol className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      {BOOKING_STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < current;
        const active = stepNumber === current;
        return (
          <li key={step.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold ${
                  done || active ? 'bg-vxn-teal-700 text-white' : 'bg-vxn-bg-cloud text-vxn-fg-5'
                }`}
              >
                {done ? <CheckOutlined className="text-[12px]" /> : stepNumber}
              </span>
              <span
                className={`text-sm ${
                  active
                    ? 'font-semibold text-vxn-ink'
                    : done
                      ? 'font-medium text-vxn-fg-2'
                      : 'text-vxn-fg-5'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < BOOKING_STEPS.length - 1 && (
              <span className={`h-px w-10 ${done ? 'bg-vxn-teal-700' : 'bg-vxn-border'}`} />
            )}
          </li>
        );
      })}
    </ol>
  </div>
);

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const paymentMethodLabel = (method) => {
  switch (method) {
    case 'vnpay':
      return 'VNPay · QR/ATM';
    case 'momo':
      return 'Ví MoMo';
    case 'zalopay':
      return 'ZaloPay';
    case 'cash':
      return 'Tiền mặt khi lên xe';
    default:
      return method || '—';
  }
};

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingCode = searchParams.get('bookingCode');
  const phone = searchParams.get('phone');

  const { currentBooking, contactInfo } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Fetch booking on mount
  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingCode) {
        setLoading(false);
        return;
      }

      const phoneParam = phone || contactInfo?.phone || currentBooking?.contactInfo?.phone;

      try {
        if (phoneParam) {
          const response = await api.get(`/bookings/code/${bookingCode}`, {
            params: { phone: phoneParam },
          });
          const isSuccess = response.success === true || response.status === 'success';
          if (isSuccess && response.data) {
            setBooking(response.data.booking || response.data);
          } else if (currentBooking && currentBooking.bookingCode === bookingCode) {
            setBooking(currentBooking);
          }
        } else if (currentBooking && currentBooking.bookingCode === bookingCode) {
          setBooking(currentBooking);
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
        if (currentBooking && currentBooking.bookingCode === bookingCode) {
          setBooking(currentBooking);
        }
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingCode, phone]);

  // Fetch ticket once booking is loaded
  useEffect(() => {
    const fetchTicket = async () => {
      if (!booking?._id) return;
      try {
        setLoadingTicket(true);
        const response = await api.get(`/tickets/booking/${booking._id}`);
        if (response.success && response.data?.ticket) {
          setTicket(response.data.ticket);
        }
      } catch (error) {
        console.error('Failed to fetch ticket:', error);
      } finally {
        setLoadingTicket(false);
      }
    };
    fetchTicket();
  }, [booking]);

  const handleResendEmail = async () => {
    if (!ticket?._id) {
      message.warning('Vé điện tử đang được tạo, vui lòng đợi trong giây lát.');
      return;
    }
    try {
      message.loading({ content: 'Đang gửi email...', key: 'resend', duration: 0 });
      const response = await api.post(`/tickets/${ticket._id}/resend`);
      message.destroy('resend');
      if (response.success) {
        message.success({
          content: `Đã gửi lại vé đến email: ${booking?.contactInfo?.email || 'của bạn'}`,
          duration: 4,
        });
      } else {
        message.error(response.message || 'Gửi email thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      message.destroy('resend');
      const errorMessage = error.response?.data?.message || error.message || 'Không thể gửi email';
      message.error({ content: `Lỗi: ${errorMessage}`, duration: 4 });
    }
  };

  const handleViewTicket = () => {
    if (booking?.bookingCode) {
      const phone = booking?.contactInfo?.phone;
      const queryStr = phone ? `?phone=${phone}` : '';
      navigate(`/booking/confirmation/${booking.bookingCode}${queryStr}`);
    }
  };

  if (loading) {
    return (
      <CustomerShell activeKey="buy">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <p className="text-[14px] text-vxn-fg-3">Đang tải thông tin đặt vé...</p>
        </div>
      </CustomerShell>
    );
  }

  // Build data rows for the result card
  const successData = [
    ['Mã đặt vé', booking?.bookingCode || '—'],
    [
      'Mã thanh toán',
      booking?.paymentCode || booking?.transactionId || booking?.paymentTransactionId || '—',
    ],
    ['Số tiền', formatCurrency(booking?.finalPrice || booking?.totalPrice || 0)],
    ['Phương thức', paymentMethodLabel(booking?.paymentMethod)],
  ];

  return (
    <CustomerShell activeKey="buy">
      <BookingStepper current={4} />

      <div className="px-4 py-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[108rem]">
          <CustomerBreadcrumb
            className="mb-5"
            items={[
              { label: 'Hành trình', to: '/my-tickets' },
              { label: 'Thanh toán' },
              { label: 'Hoàn tất' },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
            <PaymentResultCard
              kind="success"
              data={successData}
              ctas={[
                {
                  kind: 'saffron',
                  label: 'Xem vé điện tử',
                  onClick: handleViewTicket,
                  disabled: !booking?.bookingCode,
                },
                {
                  kind: 'ghost',
                  label: 'Gửi lại email',
                  onClick: handleResendEmail,
                  disabled: !ticket,
                },
              ]}
            />

            <div className="flex flex-col gap-5">
              {booking ? (
                <>
                  <SaffronTicketCard booking={booking} ticket={ticket} />

                  <div className="rounded-2xl border border-vxn-border bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="m-0 text-[16px] font-semibold text-vxn-ink">
                        Chi tiết đơn hàng
                      </h3>
                      <span className="font-mono text-[12px] text-vxn-fg-4">
                        {booking?.bookingCode}
                      </span>
                    </div>

                    <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
                      <div>
                        <dt className="text-vxn-fg-5">Hành khách đặt</dt>
                        <dd className="mt-0.5 font-medium text-vxn-ink">
                          {booking?.contactInfo?.name || '—'}
                        </dd>
                        <dd className="text-vxn-fg-4">{booking?.contactInfo?.phone || ''}</dd>
                        <dd className="text-vxn-fg-4">{booking?.contactInfo?.email || ''}</dd>
                      </div>
                      <div>
                        <dt className="text-vxn-fg-5">Khởi hành</dt>
                        <dd className="mt-0.5 font-medium text-vxn-ink">
                          {booking?.tripId?.departureTime
                            ? dayjs(booking.tripId.departureTime).format('HH:mm · DD/MM/YYYY')
                            : '—'}
                        </dd>
                        <dt className="mt-2 text-vxn-fg-5">Trạng thái</dt>
                        <dd className="mt-0.5 font-medium text-emerald-600">
                          {booking?.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </dd>
                      </div>
                    </dl>

                    <div className="my-4 h-px bg-vxn-border" />

                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-vxn-ink">
                        Tổng đã thanh toán
                      </span>
                      <span className="text-[22px] font-bold text-[#A8741A]">
                        {formatCurrency(booking?.finalPrice || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {ticket && (
                      <Button
                        icon={<QrcodeOutlined />}
                        onClick={() => setQrModalVisible(true)}
                        size="large"
                      >
                        Xem mã QR
                      </Button>
                    )}
                    <Button icon={<PrinterOutlined />} onClick={() => window.print()} size="large">
                      In vé
                    </Button>
                    <Button icon={<HomeOutlined />} onClick={() => navigate('/')} size="large">
                      Về trang chủ
                    </Button>
                  </div>

                  {!ticket && loadingTicket && (
                    <div className="flex items-center gap-3 rounded-xl border border-vxn-border bg-vxn-bg-mist p-4 text-[13px] text-vxn-fg-3">
                      <Spin size="small" />
                      <span>Đang tạo vé điện tử...</span>
                    </div>
                  )}

                  {booking?.paymentMethod === 'cash' && (
                    <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4 text-[13px] text-amber-900">
                      <strong>Lưu ý:</strong> Vui lòng chuẩn bị tiền mặt và thanh toán cho tài xế
                      khi lên xe. Số tiền: <strong>{formatCurrency(booking?.finalPrice)}</strong>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-vxn-border bg-white p-8 text-center">
                  <p className="text-vxn-fg-3">Không tìm thấy thông tin đặt vé.</p>
                  <Button
                    type="primary"
                    size="large"
                    className="mt-4"
                    onClick={() => navigate('/')}
                  >
                    Về trang chủ
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Mã QR Vé Điện Tử"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setQrModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        centered
        width={520}
      >
        {ticket?.qrCode && (
          <div className="py-3 text-center">
            <div className="inline-block rounded-2xl border-4 border-vxn-saffron-600 bg-white p-6">
              <img
                src={ticket.qrCode}
                alt="QR Code"
                className="mx-auto"
                style={{ width: 320, height: 320 }}
              />
            </div>
            <p className="mt-5 font-mono text-[15px] text-vxn-ink">{ticket.ticketCode}</p>
            <p className="mt-1 text-[13px] text-vxn-fg-3">
              Vui lòng xuất trình mã QR này khi lên xe
            </p>
          </div>
        )}
      </Modal>
    </CustomerShell>
  );
};

export default BookingSuccess;
