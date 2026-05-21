import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Spin, message } from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  CarOutlined,
  CalendarOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
  TagOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import useBookingStore from '../store/bookingStore';
import useAuthStore from '../store/authStore';
import {
  holdSeats,
  validateVoucher,
  createPayment,
  getPublicVouchers,
  getVoucherWallet,
  saveVoucherToWallet,
} from '../services/bookingApi';
import { getOperatorDisplayName } from '../utils/operatorDisplay';
import atmLogo from '../assets/payment-logos/ATM.png';
import cashLogo from '../assets/payment-logos/CASH.jpg';
import momoLogo from '../assets/payment-logos/MOMO.png';
import visaMastercardLogo from '../assets/payment-logos/VISA-MASTERCARD.png';
import vnpayLogo from '../assets/payment-logos/VNPAY.png';
import zalopayLogo from '../assets/payment-logos/ZALOPAY.png';
import acbLogo from '../assets/payment-logos/banks/ACB.svg.png';
import bidvLogo from '../assets/payment-logos/banks/BIDV.png';
import hdbankLogo from '../assets/payment-logos/banks/HDBANK.png';
import mbbankLogo from '../assets/payment-logos/banks/MBBANK.png';
import msbLogo from '../assets/payment-logos/banks/MSB.svg.png';
import ocbLogo from '../assets/payment-logos/banks/OCB.png';
import sacombankLogo from '../assets/payment-logos/banks/SACOMBANK.png';
import techcombankLogo from '../assets/payment-logos/banks/TECHCOMBANK.png';
import tpbankLogo from '../assets/payment-logos/banks/TPBANK.png';
import vibLogo from '../assets/payment-logos/banks/VIB.png';
import vietcombankLogo from '../assets/payment-logos/banks/VIETCOMBANK.png';
import vpbankLogo from '../assets/payment-logos/banks/VPBANK.svg.png';

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatTime = (value) => (value ? dayjs(value).format('HH:mm') : '--:--');
const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '');
const resolveId = (value) => (typeof value === 'string' ? value : value?._id || value?.id);

const formatVoucherBenefit = (voucher) => {
  if (!voucher) return '';
  const value =
    voucher.discountType === 'percentage'
      ? `Giảm ${voucher.discountValue || 0}%`
      : `Giảm ${formatCurrency(voucher.discountValue || 0)}`;
  if (voucher.maxDiscountAmount && voucher.discountType === 'percentage') {
    return `${value}, tối đa ${formatCurrency(voucher.maxDiscountAmount)}`;
  }
  return value;
};

const BOOKING_STEPS = [
  { key: 'seats', label: 'Chọn ghế' },
  { key: 'passenger', label: 'Thông tin hành khách' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'done', label: 'Hoàn tất' },
];

const ADDONS = [
  {
    id: 'insurance',
    title: 'Bảo hiểm chuyến đi',
    desc: 'Bồi thường đến 50tr/lượt',
    price: 19000,
    Icon: SafetyOutlined,
  },
  {
    id: 'baggage',
    title: 'Hành lý ký gửi',
    desc: 'Lên đến 20kg, đảm bảo',
    price: 35000,
    Icon: GiftOutlined,
  },
  {
    id: 'airport',
    title: 'Đưa đón sân bay',
    desc: 'Tận nơi · 2 chiều',
    price: 150000,
    Icon: CarOutlined,
  },
];

const PAYMENT_METHODS = [
  {
    code: 'momo',
    backendMethod: 'momo',
    name: 'Ví MoMo',
    description: 'Thanh toán qua app MoMo',
    logo: 'MoMo',
    logoSrc: momoLogo,
    color: '#A50064',
    enabled: false,
    comingSoon: true,
  },
  {
    code: 'vnpay',
    backendMethod: 'vnpay',
    name: 'VNPay',
    description: 'QR / Thẻ ATM nội địa',
    logo: 'VNPay',
    logoSrc: vnpayLogo,
    color: '#0B62B4',
    enabled: true,
  },
  {
    code: 'zalopay',
    backendMethod: 'zalopay',
    name: 'ZaloPay',
    description: 'Quét QR Zalo',
    logo: 'Zalo',
    logoSrc: zalopayLogo,
    color: '#008EE8',
    enabled: false,
    comingSoon: true,
  },
  {
    code: 'credit_card',
    backendMethod: 'vnpay',
    name: 'Thẻ Visa/Master',
    description: 'Quốc tế',
    logo: 'VISA',
    logoSrc: visaMastercardLogo,
    color: '#29246A',
    enabled: true,
  },
  {
    code: 'atm_card',
    backendMethod: 'vnpay',
    name: 'Thẻ ATM',
    description: 'Internet Banking 30+ ngân hàng',
    logo: 'ATM',
    logoSrc: atmLogo,
    logoFrameClassName: 'h-14 w-[68px] p-1',
    logoImageClassName: 'h-full w-full scale-[1.12]',
    color: '#E39A22',
    enabled: true,
  },
  {
    code: 'cash',
    backendMethod: 'cash',
    name: 'Tiền mặt',
    description: 'Thanh toán khi lên xe',
    logo: '₫',
    logoSrc: cashLogo,
    logoFrameClassName: 'h-12 w-16 p-1',
    logoImageClassName: 'h-full w-full scale-[1.08]',
    color: '#047857',
    enabled: true,
  },
];

const BANK_OPTIONS = [
  { code: 'VCB', name: 'Vietcombank', color: '#068844', logoSrc: vietcombankLogo },
  { code: 'TCB', name: 'Techcombank', color: '#D71920', logoSrc: techcombankLogo },
  { code: 'BIDV', name: 'BIDV', color: '#1775BC', logoSrc: bidvLogo },
  { code: 'MBBANK', name: 'MBBank', color: '#1F56A7', logoSrc: mbbankLogo },
  {
    code: 'VIB',
    name: 'VIB',
    color: '#263B80',
    logoSrc: vibLogo,
    logoFrameClassName: 'h-10 w-full max-w-[108px] px-2 py-1',
    logoImageClassName: 'h-[82%] w-[94%]',
  },
  { code: 'ACB', name: 'ACB', color: '#115FAE', logoSrc: acbLogo },
  { code: 'TPB', name: 'TPBank', color: '#F6A800', logoSrc: tpbankLogo },
  { code: 'VPB', name: 'VPBank', color: '#00A651', logoSrc: vpbankLogo },
  { code: 'OCB', name: 'OCB', color: '#F59E0B', logoSrc: ocbLogo },
  { code: 'HDB', name: 'HDBank', color: '#C1121F', logoSrc: hdbankLogo },
  { code: 'MSB', name: 'MSB', color: '#2454A6', logoSrc: msbLogo },
  { code: 'STB', name: 'Sacombank', color: '#0A65AD', logoSrc: sacombankLogo },
];

const PaymentLogo = ({ item, className = '', imageClassName = '' }) => (
  <span
    className={`grid shrink-0 place-items-center rounded-[10px] border border-vxn-border bg-white ${className}`}
    style={!item.logoSrc ? { backgroundColor: item.color } : undefined}
  >
    {item.logoSrc ? (
      <img
        src={item.logoSrc}
        alt=""
        aria-hidden="true"
        className={`${imageClassName || 'h-full w-full'} object-contain`}
        loading="lazy"
      />
    ) : (
      <span className="px-1 text-[11px] font-bold text-white">{item.logo}</span>
    )}
  </span>
);

const BookingStepper = ({ current = 2 }) => (
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

const SectionTitle = ({ num, title, subtitle, right }) => (
  <div className="mb-5 flex items-start gap-3">
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-vxn-teal-700 text-sm font-semibold text-white">
      {num}
    </span>
    <div className="min-w-0 flex-1">
      <h3 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-vxn-ink">{title}</h3>
      {subtitle && <p className="m-0 mt-1 text-[13px] leading-5 text-vxn-fg-3">{subtitle}</p>}
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

const CheckBox = ({ checked, onChange, children }) => (
  <button
    type="button"
    onClick={onChange}
    className="inline-flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] text-vxn-fg-2"
  >
    <span
      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] transition ${
        checked ? 'bg-vxn-teal-700' : 'border border-vxn-border-strong bg-white'
      }`}
    >
      {checked && <CheckOutlined className="text-[10px] text-white" />}
    </span>
    <span>{children}</span>
  </button>
);

const Field = ({ name, label, rules, prefix, placeholder, type = 'text', disabled = false }) => (
  <Form.Item
    name={name}
    label={<span className="text-[12px] font-medium tracking-[0.02em] text-vxn-fg-3">{label}</span>}
    rules={rules}
    className="!mb-0"
  >
    <Input
      size="large"
      type={type}
      prefix={<span className="text-vxn-fg-5">{prefix}</span>}
      placeholder={placeholder}
      disabled={disabled}
      className="!h-12 !rounded-[10px] !border-vxn-border !bg-white"
    />
  </Form.Item>
);

const PassengerInfoPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  const {
    selectedTrip,
    selectedSeats,
    pickupPoint,
    dropoffPoint,
    voucherCode,
    appliedVoucher,
    contactInfo,
    expiresAt,
    setContactInfo,
    setCurrentBooking,
    setSessionId,
    setExpiresAt,
    setVoucherCode,
    setAppliedVoucher,
  } = useBookingStore();

  const [loading, setLoading] = useState(false);
  const [voucherValidating, setVoucherValidating] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [suggestedVouchers, setSuggestedVouchers] = useState([]);
  const [walletVouchers, setWalletVouchers] = useState([]);
  const [savingVoucherCode, setSavingVoucherCode] = useState('');
  const [contactIsPassenger1, setContactIsPassenger1] = useState(true);
  const [savePassengerIdx, setSavePassengerIdx] = useState({});
  const [selectedAddons, setSelectedAddons] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vnpay');
  const [selectedBank, setSelectedBank] = useState('');
  const [acceptedPaymentTerms, setAcceptedPaymentTerms] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!selectedTrip || !selectedSeats?.length || !pickupPoint || !dropoffPoint) {
      toast.error('Thông tin đặt vé không hợp lệ');
      navigate('/');
    }
  }, []);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        contact_name: user.fullName || user.name || '',
        contact_phone: user.phone || '',
        contact_email: user.email || '',
      });
      if (contactIsPassenger1) {
        form.setFieldsValue({
          passenger_0_name: user.fullName || user.name || '',
          passenger_0_phone: user.phone || '',
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (!expiresAt || currentStep !== 1) return undefined;

    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [currentStep, expiresAt]);

  const tripView = useMemo(() => {
    if (!selectedTrip) return null;
    const route = selectedTrip.route || selectedTrip.routeId || {};
    const operator = selectedTrip.operator || selectedTrip.operatorId || {};
    const pricing = selectedTrip.pricing || {};
    const fromCity = route.origin?.city || route.origin?.province || 'Điểm đi';
    const toCity = route.destination?.city || route.destination?.province || 'Điểm đến';
    const finalPrice =
      pricing.finalPrice ||
      selectedTrip.finalPrice ||
      pricing.basePrice ||
      selectedTrip.basePrice ||
      0;

    return {
      id: selectedTrip.id || selectedTrip._id,
      routeId: resolveId(selectedTrip.routeId || selectedTrip.route),
      operatorId: resolveId(selectedTrip.operatorId || selectedTrip.operator),
      departureTime: selectedTrip.departureTime,
      arrivalTime: selectedTrip.arrivalTime,
      fromCity,
      toCity,
      operatorName: getOperatorDisplayName(operator, 'Nhà xe'),
      operatorShort: getOperatorDisplayName(operator, 'VXN').slice(0, 3).toUpperCase(),
      finalPrice,
    };
  }, [selectedTrip]);

  const seatTotal = (tripView?.finalPrice || 0) * (selectedSeats?.length || 0);
  const voucherDiscount = appliedVoucher?.discountAmount || 0;
  const addonsTotal = ADDONS.reduce(
    (sum, addon) => (selectedAddons[addon.id] ? sum + addon.price : sum),
    0
  );
  const finalTotal = Math.max(0, seatTotal - voucherDiscount + addonsTotal);
  const activePaymentMethod =
    PAYMENT_METHODS.find((method) => method.code === selectedPaymentMethod) ||
    PAYMENT_METHODS.find((method) => method.code === 'vnpay');
  const paymentMethodForApi = activePaymentMethod?.backendMethod || selectedPaymentMethod;
  const showBankSelector = ['vnpay', 'atm_card'].includes(selectedPaymentMethod);
  const holdRemainingLabel = useMemo(() => {
    if (!expiresAt) return '15:00';

    const totalSeconds = Math.max(0, dayjs(expiresAt).diff(dayjs(now), 'second'));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [expiresAt, now]);

  useEffect(() => {
    if (!tripView?.id) return undefined;

    let alive = true;
    (async () => {
      setVoucherLoading(true);
      try {
        const response = await getPublicVouchers({
          operatorId: tripView.operatorId,
          routeId: tripView.routeId,
        });
        if (!alive) return;
        const vouchers = Array.isArray(response?.data?.vouchers) ? response.data.vouchers : [];
        setSuggestedVouchers(vouchers);
      } catch {
        if (alive) setSuggestedVouchers([]);
      } finally {
        if (alive) setVoucherLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tripView?.id, tripView?.operatorId, tripView?.routeId]);

  const loadVoucherWallet = async () => {
    if (!user) {
      setWalletVouchers([]);
      return;
    }

    try {
      const response = await getVoucherWallet();
      const vouchers = Array.isArray(response?.data?.vouchers) ? response.data.vouchers : [];
      setWalletVouchers(vouchers);
    } catch {
      setWalletVouchers([]);
    }
  };

  useEffect(() => {
    loadVoucherWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.id]);

  const voucherSuggestions = useMemo(() => {
    const byCode = new Map();
    walletVouchers.forEach((voucher) => {
      if (voucher?.code) byCode.set(voucher.code, { ...voucher, isSaved: true });
    });
    suggestedVouchers.forEach((voucher) => {
      if (!voucher?.code) return;
      const saved = byCode.get(voucher.code);
      byCode.set(voucher.code, saved ? { ...voucher, ...saved, isSaved: true } : voucher);
    });
    return Array.from(byCode.values()).sort((a, b) => {
      const aSaved = a.isSaved || a.walletStatus === 'saved' ? 1 : 0;
      const bSaved = b.isSaved || b.walletStatus === 'saved' ? 1 : 0;
      if (aSaved !== bSaved) return bSaved - aSaved;
      if (a.source === b.source) return a.code.localeCompare(b.code);
      return a.source === 'platform' ? -1 : 1;
    });
  }, [suggestedVouchers, walletVouchers]);

  const handleVoucherInputChange = (value) => {
    setVoucherCode(value.toUpperCase());
    if (appliedVoucher) setAppliedVoucher(null);
  };

  const handleContactIsPassenger1 = () => {
    const next = !contactIsPassenger1;
    setContactIsPassenger1(next);
    if (next) {
      const c = form.getFieldsValue(['contact_name', 'contact_phone']);
      form.setFieldsValue({
        passenger_0_name: c.contact_name || '',
        passenger_0_phone: c.contact_phone || '',
      });
    }
  };

  const handlePassengerFormValuesChange = (changedValues, allValues) => {
    if (!contactIsPassenger1) return;
    if (!('contact_name' in changedValues) && !('contact_phone' in changedValues)) return;

    form.setFieldsValue({
      passenger_0_name: allValues.contact_name || '',
      passenger_0_phone: allValues.contact_phone || '',
    });
  };

  const handleValidateVoucher = async (codeToApply = voucherCode) => {
    const normalizedCode = codeToApply?.trim().toUpperCase();
    if (!normalizedCode) return;
    try {
      setVoucherValidating(true);
      setVoucherCode(normalizedCode);
      const response = await validateVoucher(normalizedCode, {
        tripId: tripView?.id,
        totalAmount: seatTotal,
      });
      if (response.status === 'success' && response.data) {
        setAppliedVoucher(response.data);
        message.success(
          `Áp dụng voucher thành công! Giảm ${formatCurrency(response.data.discountAmount)}`
        );
      }
    } catch (error) {
      message.error(error || 'Mã voucher không hợp lệ');
      setAppliedVoucher(null);
    } finally {
      setVoucherValidating(false);
    }
  };

  const handleSaveVoucher = async (voucher) => {
    if (!user) {
      message.info('Đăng nhập để lưu mã vào ví voucher');
      return;
    }

    try {
      setSavingVoucherCode(voucher.code);
      await saveVoucherToWallet({ voucherId: voucher.id || voucher._id, code: voucher.code });
      message.success(`Đã lưu ${voucher.code} vào ví voucher`);
      await loadVoucherWallet();
    } catch (error) {
      message.error(typeof error === 'string' ? error : error?.message || 'Không thể lưu voucher');
    } finally {
      setSavingVoucherCode('');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (!tripView?.id) {
        toast.error('Thông tin chuyến xe không hợp lệ');
        navigate('/');
        return;
      }

      setContactInfo({
        name: values.contact_name,
        phone: values.contact_phone,
        email: values.contact_email,
      });

      const passengers = selectedSeats.map((seat, index) => ({
        seatNumber: seat.seatNumber,
        passengerName: values[`passenger_${index}_name`] || values.contact_name,
        passengerPhone: values[`passenger_${index}_phone`] || values.contact_phone,
        passengerEmail: index === 0 ? values.contact_email : undefined,
        passengerIdCard: values[`passenger_${index}_idCard`] || undefined,
      }));

      const holdData = {
        tripId: tripView.id,
        seats: passengers,
        contactInfo: {
          name: values.contact_name,
          phone: values.contact_phone,
          email: values.contact_email,
        },
        pickupPoint,
        dropoffPoint,
        voucherCode: appliedVoucher ? voucherCode : undefined,
        customerId: user?._id || user?.id || undefined,
      };

      const holdResponse = await holdSeats(holdData);

      if (holdResponse.status === 'success' && holdResponse.data) {
        setCurrentBooking(holdResponse.data.booking);
        setSessionId(holdResponse.data.lockInfo.sessionId);
        setExpiresAt(holdResponse.data.lockInfo.expiresAt);
        message.success('Giữ chỗ thành công! Hoàn tất thanh toán trong 15 phút.');
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      const errMsg =
        typeof error === 'string' ? error : error?.message || 'Có lỗi xảy ra khi giữ chỗ';
      if (errMsg.includes('đang được người khác chọn')) {
        const match = errMsg.match(/Ghế\s+([A-Z0-9,\s]+)\s+đang được/);
        if (match) {
          const failedSeats = match[1].split(',').map((s) => s.trim());
          const { removeSeat } = useBookingStore.getState();
          failedSeats.forEach((seatNumber) => removeSeat(seatNumber));
        }
        toast.error(`${errMsg}. Vui lòng chọn ghế khác.`);
        setTimeout(() => navigate(`/booking/seats/${tripView.id}`), 1500);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      if (!activePaymentMethod?.enabled) {
        message.warning('Phương thức thanh toán này chưa được hỗ trợ');
        return;
      }
      if (!acceptedPaymentTerms) {
        message.warning('Vui lòng đồng ý điều khoản trước khi thanh toán');
        return;
      }

      setLoading(true);
      const { currentBooking } = useBookingStore.getState();
      if (!currentBooking) {
        toast.error('Không tìm thấy thông tin booking');
        return;
      }
      const bookingId = currentBooking.id || currentBooking._id;
      if (!bookingId) {
        toast.error('Thông tin booking không hợp lệ');
        return;
      }

      const paymentResponse = await createPayment({
        bookingId,
        paymentMethod: paymentMethodForApi,
        amount: currentBooking.finalPrice,
        bankCode: paymentMethodForApi === 'vnpay' && selectedBank ? selectedBank : undefined,
        locale: 'vn',
        customerId: user?._id || user?.id || undefined,
      });

      const isSuccess =
        (paymentResponse.status === 'success' || paymentResponse.success === true) &&
        paymentResponse.data;

      if (isSuccess) {
        const { payment, paymentUrl } = paymentResponse.data;
        const bookingCode = payment?.bookingId?.bookingCode || currentBooking.bookingCode;
        if (paymentMethodForApi === 'cash') {
          message.success('Đặt vé thành công! Thanh toán khi lên xe.');
          setTimeout(() => navigate(`/booking/success?bookingCode=${bookingCode}`), 800);
        } else if (paymentMethodForApi === 'vnpay') {
          if (paymentUrl) {
            window.location.href = paymentUrl;
          } else {
            toast.error('Không tạo được link thanh toán VNPay');
          }
        } else {
          toast.error('Phương thức thanh toán chưa được hỗ trợ');
        }
      }
    } catch (error) {
      toast.error(typeof error === 'string' ? error : error?.message || 'Có lỗi khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTrip || !tripView) {
    return (
      <CustomerShell activeKey="buy" mainClassName="bg-vxn-bg-soft">
        <div className="grid min-h-screen place-items-center">
          <Spin size="large" tip="Đang tải..." />
        </div>
      </CustomerShell>
    );
  }

  const pickupName = pickupPoint?.name || pickupPoint?.address || tripView.fromCity;
  const pickupAddress = pickupPoint?.address || pickupPoint?.name || '';
  const dropoffName = dropoffPoint?.name || dropoffPoint?.address || tripView.toCity;
  const dropoffAddress = dropoffPoint?.address || dropoffPoint?.name || '';

  return (
    <CustomerShell activeKey="buy" mainClassName="bg-vxn-bg-soft">
      {/* Header with breadcrumbs */}
      <div className="sticky top-16 z-30 bg-white shadow-sm lg:top-0">
        <div className="border-b border-vxn-border bg-white px-4 py-4 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CustomerBreadcrumb
              items={[
                { label: 'Tìm chuyến', to: '/trips' },
                { label: 'Chọn ghế', to: `/booking/seats/${tripView.id}` },
                { label: currentStep === 0 ? 'Thông tin hành khách' : 'Thanh toán' },
              ]}
            />
            <div className="flex flex-wrap items-center gap-3">
              {currentStep === 1 && (
                <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#FFF1D6] px-3 py-2 text-[13px] font-semibold text-vxn-saffron-700">
                  <ClockCircleOutlined />
                  Giữ ghế trong <span className="tabular-nums">{holdRemainingLabel}</span>
                </span>
              )}
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() =>
                  currentStep === 1 ? setCurrentStep(0) : navigate(`/booking/seats/${tripView.id}`)
                }
              >
                {currentStep === 1 ? 'Quay lại sửa hành khách' : 'Quay lại chọn ghế'}
              </Button>
            </div>
          </div>
        </div>

        <BookingStepper current={currentStep === 0 ? 2 : 3} />
      </div>

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1fr_380px]">
          {/* Main column */}
          <div className="min-w-0">
            {currentStep === 0 ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={handlePassengerFormValuesChange}
                className="space-y-5"
              >
                {/* Section 1: Contact */}
                <section className="rounded-[16px] border border-vxn-border bg-white p-6 shadow-sm">
                  <SectionTitle
                    num={1}
                    title="Thông tin liên hệ"
                    subtitle="Sẽ dùng để gửi vé qua email & SMS"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      name="contact_name"
                      label="HỌ VÀ TÊN *"
                      prefix={<UserOutlined />}
                      placeholder="Nguyễn Văn A"
                      rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    />
                    <Field
                      name="contact_phone"
                      label="SỐ ĐIỆN THOẠI *"
                      prefix={<PhoneOutlined />}
                      placeholder="0901 234 567"
                      rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại' },
                        { pattern: /^0\d{9}$/, message: 'SĐT phải có 10 số, bắt đầu bằng 0' },
                      ]}
                    />
                    <Field
                      name="contact_email"
                      label="EMAIL *"
                      prefix={<MailOutlined />}
                      placeholder="email@example.com"
                      rules={[
                        { required: true, message: 'Vui lòng nhập email' },
                        { type: 'email', message: 'Email không hợp lệ' },
                      ]}
                    />
                    <div className="flex items-end">
                      <CheckBox checked={contactIsPassenger1} onChange={handleContactIsPassenger1}>
                        Người liên hệ là hành khách 1
                      </CheckBox>
                    </div>
                  </div>
                </section>

                {/* Sections 2..N: Passengers */}
                {selectedSeats.map((seat, index) => (
                  <section
                    key={seat.seatNumber}
                    className="rounded-[16px] border border-vxn-border bg-white p-6 shadow-sm"
                  >
                    <SectionTitle
                      num={2 + index}
                      title={`Hành khách ${index + 1} · Ghế ${seat.seatNumber}`}
                      subtitle={
                        index === 0
                          ? 'Lên xe phải mang theo CCCD/CMND khớp tên đặt vé.'
                          : 'Tuỳ chọn — nếu để trống sẽ dùng thông tin liên hệ.'
                      }
                      right={
                        user && (
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 text-[13px] font-medium text-vxn-teal-800"
                            onClick={() => message.info('Tính năng đang phát triển')}
                          >
                            Chọn từ hành khách đã lưu →
                          </button>
                        )
                      }
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        name={`passenger_${index}_name`}
                        label="HỌ VÀ TÊN *"
                        prefix={<UserOutlined />}
                        placeholder="Nguyễn Văn A"
                        disabled={index === 0 && contactIsPassenger1}
                        rules={[
                          {
                            required: index === 0 && !contactIsPassenger1,
                            message: 'Vui lòng nhập tên hành khách',
                          },
                        ]}
                      />
                      <Field
                        name={`passenger_${index}_idCard`}
                        label="SỐ CMND/CCCD"
                        prefix={<IdcardOutlined />}
                        placeholder="079094012345"
                      />
                      <Field
                        name={`passenger_${index}_phone`}
                        label="SỐ ĐIỆN THOẠI"
                        prefix={<PhoneOutlined />}
                        placeholder="0901 234 567"
                        disabled={index === 0 && contactIsPassenger1}
                      />
                      <Field
                        name={`passenger_${index}_dob`}
                        label="NGÀY SINH"
                        prefix={<CalendarOutlined />}
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                    {user && (
                      <div className="mt-4">
                        <CheckBox
                          checked={!!savePassengerIdx[index]}
                          onChange={() =>
                            setSavePassengerIdx((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                        >
                          Lưu vào danh sách hành khách thường đi (tối đa 5)
                        </CheckBox>
                      </div>
                    )}
                  </section>
                ))}

                {/* Pickup & dropoff confirm */}
                <section className="rounded-[16px] border border-vxn-border bg-white p-6 shadow-sm">
                  <SectionTitle
                    num={2 + selectedSeats.length}
                    title="Điểm đón & trả"
                    subtitle="Đã chọn ở bước trước. Quay lại nếu cần thay đổi."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex gap-3 rounded-[10px] bg-vxn-bg-mist p-4">
                      <EnvironmentOutlined className="mt-0.5 text-[20px] text-vxn-teal-700" />
                      <div className="min-w-0">
                        <div className="mb-1 text-[12px] font-medium uppercase tracking-[0.04em] text-vxn-fg-4">
                          Điểm đón · {formatTime(tripView.departureTime)}
                        </div>
                        <div className="text-[14px] font-semibold text-vxn-ink">{pickupName}</div>
                        {pickupAddress && pickupAddress !== pickupName && (
                          <div className="mt-0.5 text-[12px] text-vxn-fg-3">{pickupAddress}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-[10px] bg-vxn-bg-mist p-4">
                      <EnvironmentOutlined className="mt-0.5 text-[20px] text-vxn-saffron-700" />
                      <div className="min-w-0">
                        <div className="mb-1 text-[12px] font-medium uppercase tracking-[0.04em] text-vxn-fg-4">
                          Điểm trả · {formatTime(tripView.arrivalTime)}
                        </div>
                        <div className="text-[14px] font-semibold text-vxn-ink">{dropoffName}</div>
                        {dropoffAddress && dropoffAddress !== dropoffName && (
                          <div className="mt-0.5 text-[12px] text-vxn-fg-3">{dropoffAddress}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Voucher */}
                <section className="rounded-[16px] border border-vxn-border bg-white p-6 shadow-sm">
                  <SectionTitle num={3 + selectedSeats.length} title="Mã giảm giá & ưu đãi" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <div
                      className={`flex flex-1 items-center gap-3 rounded-[10px] border px-4 ${
                        appliedVoucher
                          ? 'border-vxn-saffron-600 bg-[#FFF7E8]'
                          : 'border-vxn-border bg-white'
                      } h-12`}
                    >
                      <TagOutlined
                        className={`text-[16px] ${appliedVoucher ? 'text-vxn-saffron-700' : 'text-vxn-fg-5'}`}
                      />
                      <Input
                        variant="borderless"
                        placeholder="Nhập mã giảm giá"
                        value={voucherCode}
                        onChange={(e) => handleVoucherInputChange(e.target.value)}
                        className="!h-10 !flex-1 !p-0 !text-[14px] !font-semibold"
                        style={{
                          color: appliedVoucher ? '#A55A00' : '#181C22',
                          letterSpacing: '0.04em',
                        }}
                      />
                      {appliedVoucher && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium text-success-600">
                          <CheckCircleOutlined /> Đã áp dụng −
                          {formatCurrency(appliedVoucher.discountAmount)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="large"
                      loading={voucherValidating}
                      onClick={() => handleValidateVoucher()}
                      className="!h-12 !rounded-[10px] !border-vxn-border !bg-white !px-5 !text-[13px] !font-medium"
                    >
                      {appliedVoucher ? 'Đổi mã khác' : 'Áp dụng'}
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {voucherLoading && (
                      <span className="rounded-[10px] border border-vxn-border bg-white px-3 py-2 text-[12px] text-vxn-fg-3">
                        Đang tải mã ưu đãi phù hợp...
                      </span>
                    )}
                    {!voucherLoading && voucherSuggestions.length === 0 && (
                      <span className="rounded-[10px] border border-dashed border-vxn-border px-3 py-2 text-[12px] text-vxn-fg-4">
                        Chưa có mã ưu đãi phù hợp cho chuyến này.
                      </span>
                    )}
                    {!voucherLoading &&
                      voucherSuggestions.map((v) => {
                        const active = appliedVoucher && voucherCode === v.code;
                        const saved = v.isSaved || v.walletStatus === 'saved';
                        const unavailable =
                          v.walletStatus === 'expired' || v.walletStatus === 'used';
                        return (
                          <div
                            key={v.code}
                            className={`flex items-stretch overflow-hidden rounded-[10px] border transition ${
                              active
                                ? 'border-vxn-saffron-600 bg-[#FFF7E8]'
                                : 'border-vxn-border bg-white hover:border-vxn-teal-700'
                            }`}
                          >
                            <button
                              type="button"
                              disabled={unavailable}
                              onClick={() => handleVoucherInputChange(v.code)}
                              className="flex min-w-[210px] items-center gap-2 border-0 bg-transparent px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <span
                                className={`text-[12px] font-bold tracking-[0.04em] ${
                                  active ? 'text-vxn-saffron-700' : 'text-vxn-fg-2'
                                }`}
                              >
                                {v.code}
                              </span>
                              <span className="min-w-0 text-[12px] text-vxn-fg-3">
                                {formatVoucherBenefit(v)}
                                {v.minBookingAmount
                                  ? ` · Đơn từ ${formatCurrency(v.minBookingAmount)}`
                                  : ''}
                              </span>
                              <span className="rounded bg-vxn-bg-mist px-1.5 py-0.5 text-[10px] font-semibold text-vxn-fg-4">
                                {saved ? 'Ví' : v.sourceLabel || 'Ưu đãi'}
                              </span>
                            </button>
                            {!saved && !unavailable && (
                              <button
                                type="button"
                                onClick={() => handleSaveVoucher(v)}
                                disabled={savingVoucherCode === v.code}
                                className="border-0 border-l border-vxn-border bg-vxn-bg-mist px-3 text-[12px] font-semibold text-vxn-teal-800 disabled:opacity-60"
                              >
                                {savingVoucherCode === v.code ? '...' : 'Lưu'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </section>

                {/* Add-ons */}
                <section className="rounded-[16px] border border-vxn-border bg-white p-6 shadow-sm">
                  <SectionTitle
                    num={4 + selectedSeats.length}
                    title="Dịch vụ bổ trợ"
                    subtitle="Tuỳ chọn — có thể bỏ qua."
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    {ADDONS.map((addon) => {
                      const active = !!selectedAddons[addon.id];
                      const { Icon } = addon;
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() =>
                            setSelectedAddons((prev) => ({
                              ...prev,
                              [addon.id]: !prev[addon.id],
                            }))
                          }
                          className={`flex flex-col gap-3 rounded-[12px] border p-4 text-left transition ${
                            active
                              ? 'border-vxn-teal-700 bg-vxn-bg-mist'
                              : 'border-vxn-border bg-white hover:border-vxn-teal-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`grid h-9 w-9 place-items-center rounded-[10px] ${
                                active
                                  ? 'bg-white text-vxn-teal-700'
                                  : 'bg-vxn-bg-cloud text-vxn-fg-3'
                              }`}
                            >
                              <Icon className="text-[18px]" />
                            </span>
                            <span
                              className={`grid h-[18px] w-[18px] place-items-center rounded-[4px] transition ${
                                active
                                  ? 'bg-vxn-teal-700'
                                  : 'border border-vxn-border-strong bg-white'
                              }`}
                            >
                              {active && <CheckOutlined className="text-[10px] text-white" />}
                            </span>
                          </div>
                          <div>
                            <div className="text-[14px] font-semibold text-vxn-ink">
                              {addon.title}
                            </div>
                            <div className="mt-0.5 text-[12px] text-vxn-fg-3">{addon.desc}</div>
                          </div>
                          <div className="text-[14px] font-bold text-vxn-saffron-700">
                            +{formatCurrency(addon.price)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* hidden submit */}
                <button type="submit" className="hidden" aria-hidden="true" />
              </Form>
            ) : (
              /* Step 2: Payment */
              <div className="space-y-5">
                <section className="rounded-[16px] border border-vxn-border bg-white p-6 shadow-sm">
                  <SectionTitle
                    num={1}
                    title="Chọn phương thức thanh toán"
                    subtitle="Chọn một phương thức để hoàn tất đơn đặt vé."
                  />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {PAYMENT_METHODS.map((method) => {
                      const active = selectedPaymentMethod === method.code;
                      return (
                        <button
                          key={method.code}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            if (!method.enabled) return;
                            setSelectedPaymentMethod(method.code);
                            if (method.backendMethod !== 'vnpay') setSelectedBank('');
                          }}
                          disabled={!method.enabled}
                          className={`group flex min-h-[86px] items-center gap-3 rounded-[12px] border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-vxn-teal-700 ${
                            active
                              ? 'border-vxn-teal-700 bg-[#E7F4FA] shadow-sm'
                              : 'border-vxn-border bg-white hover:border-vxn-teal-300'
                          } ${!method.enabled ? 'cursor-not-allowed opacity-55' : ''}`}
                        >
                          <PaymentLogo
                            item={method}
                            className={method.logoFrameClassName || 'h-12 w-14 p-1.5'}
                            imageClassName={method.logoImageClassName}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-vxn-ink">
                                {method.name}
                              </span>
                              {method.comingSoon && (
                                <span className="rounded-full bg-[#FFF1D6] px-2 py-0.5 text-[10px] font-semibold text-vxn-saffron-700">
                                  Sắp hỗ trợ
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-[12px] leading-5 text-vxn-fg-3">
                              {method.description}
                            </span>
                          </span>
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                              active ? 'border-vxn-teal-700' : 'border-vxn-border-strong'
                            }`}
                          >
                            {active && (
                              <span className="h-2.5 w-2.5 rounded-full bg-vxn-teal-700" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {showBankSelector && (
                  <section className="rounded-[16px] border border-vxn-border bg-white p-6 shadow-sm">
                    <SectionTitle
                      num={2}
                      title={
                        <span className="inline-flex items-center gap-2">
                          <BankOutlined /> Chọn ngân hàng
                        </span>
                      }
                      subtitle="Áp dụng cho VNPay - không bắt buộc."
                      right={
                        selectedBank ? (
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 text-[13px] font-medium text-vxn-teal-800"
                            onClick={() => setSelectedBank('')}
                          >
                            Bỏ chọn
                          </button>
                        ) : null
                      }
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                      {BANK_OPTIONS.map((bank) => {
                        const active = selectedBank === bank.code;
                        return (
                          <button
                            key={bank.code}
                            type="button"
                            aria-pressed={active}
                            className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[10px] border bg-white px-2 py-3 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-vxn-teal-700 ${
                              active
                                ? 'border-vxn-teal-700 bg-[#E7F4FA] shadow-sm'
                                : 'border-vxn-border hover:border-vxn-teal-300'
                            }`}
                            onClick={() => setSelectedBank(active ? '' : bank.code)}
                          >
                            <PaymentLogo
                              item={bank}
                              className={bank.logoFrameClassName || 'h-9 w-full max-w-[92px] p-1'}
                              imageClassName={bank.logoImageClassName}
                            />
                            <span className="text-[11px] font-medium text-vxn-fg-2">
                              {bank.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
                  <div className="flex gap-3">
                    <SafetyOutlined className="mt-1 text-[18px] text-vxn-teal-700" />
                    <div>
                      <div className="text-[14px] font-semibold text-vxn-ink">
                        Thanh toán an toàn qua {paymentMethodForApi === 'cash' ? 'nhà xe' : 'VNPay'}
                      </div>
                      <p className="m-0 mt-1 text-[13px] leading-6 text-vxn-fg-3">
                        Dữ liệu thẻ được mã hoá PCI-DSS, không lưu trên hệ thống của VXN. Sau khi
                        nhấn thanh toán, bạn sẽ được chuyển tiếp tới cổng xác nhận phù hợp.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[16px] border border-vxn-border bg-white p-5 shadow-sm">
                  <CheckBox
                    checked={acceptedPaymentTerms}
                    onChange={() => setAcceptedPaymentTerms((value) => !value)}
                  >
                    Tôi đồng ý với Điều khoản dịch vụ và Chính sách đổi/hủy của Vé Xe Nhanh. Tôi xác
                    nhận thông tin hành khách khớp với CMND/CCCD.
                  </CheckBox>
                </section>
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="xl:sticky xl:top-[152px] xl:self-start">
            <div className="overflow-hidden rounded-[18px] border border-vxn-border bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]">
              <div
                className={`border-b border-vxn-border px-5 py-4 ${
                  currentStep === 1 ? 'bg-white text-vxn-ink' : 'bg-vxn-teal-900 text-white'
                }`}
              >
                {currentStep === 1 ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-semibold text-vxn-ink">Đơn của bạn</div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1D6] px-2.5 py-1 text-xs font-semibold text-vxn-saffron-700">
                      <ClockCircleOutlined /> Còn {holdRemainingLabel}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="text-xs uppercase tracking-[0.08em] text-white/65">
                      Chuyến đi
                    </div>
                    <div className="mt-1 text-lg font-bold">
                      {tripView.fromCity} → {tripView.toCity}
                    </div>
                    <div className="mt-1 text-xs text-white/70">
                      {formatDate(tripView.departureTime)} · {formatTime(tripView.departureTime)} →{' '}
                      {formatTime(tripView.arrivalTime)}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-4 p-5">
                {currentStep === 1 && (
                  <div className="rounded-[14px] border border-vxn-border bg-vxn-bg-soft p-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-vxn-teal-700 text-[13px] font-bold text-white">
                        {tripView.operatorShort}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-vxn-ink">{tripView.operatorName}</div>
                        <div className="mt-0.5 text-xs text-vxn-fg-5">
                          {formatDate(tripView.departureTime)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-semibold text-vxn-ink">
                        {formatTime(tripView.departureTime)}
                      </span>
                      <span className="h-px flex-1 bg-vxn-border mx-3" />
                      <span className="font-semibold text-vxn-ink">
                        {formatTime(tripView.arrivalTime)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-medium text-vxn-fg-3">
                      <span>{tripView.fromCity}</span>
                      <span>{tripView.toCity}</span>
                    </div>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="rounded-[12px] border border-vxn-border bg-white px-3 py-2 text-sm">
                    <div className="text-xs font-medium uppercase tracking-[0.05em] text-vxn-fg-5">
                      Hành khách & ghế
                    </div>
                    <div className="mt-1 font-semibold text-vxn-ink">
                      {contactInfo?.name || 'Hành khách'} ·{' '}
                      {selectedSeats.map((seat) => seat.seatNumber).join(', ')}
                    </div>
                  </div>
                )}
                <div className="space-y-2 text-sm text-vxn-fg-2">
                  <div className="flex items-start gap-2">
                    <EnvironmentOutlined className="mt-1 text-vxn-teal-700" />
                    <span className="min-w-0 flex-1 truncate">{pickupName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <EnvironmentOutlined className="mt-1 text-vxn-saffron-700" />
                    <span className="min-w-0 flex-1 truncate">{dropoffName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ClockCircleOutlined className="mt-1 text-vxn-teal-700" />
                    <span>
                      {formatTime(tripView.arrivalTime)} · {formatDate(tripView.arrivalTime)} (dự
                      kiến)
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-vxn-border bg-vxn-bg-soft p-4">
                  <div className="mb-3 text-sm font-medium text-vxn-fg-3">
                    Ghế đã chọn ({selectedSeats.length})
                  </div>
                  <div className="space-y-2">
                    {selectedSeats.map((seat) => (
                      <div
                        key={seat.seatNumber}
                        className="flex items-center justify-between rounded-lg border border-vxn-border bg-white px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 place-items-center rounded-md bg-vxn-teal-700 text-xs font-semibold text-white">
                            {seat.seatNumber}
                          </span>
                          <span className="text-vxn-fg-2">
                            {seat.floor === 2 ? 'Tầng trên' : 'Tầng dưới'}
                          </span>
                        </div>
                        <span className="font-semibold text-vxn-ink">
                          {formatCurrency(tripView.finalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-vxn-fg-3">
                  <div className="flex items-center justify-between">
                    <span>
                      {selectedSeats.length} vé × {formatCurrency(tripView.finalPrice)}
                    </span>
                    <span className="font-medium text-vxn-ink">{formatCurrency(seatTotal)}</span>
                  </div>
                  {addonsTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Dịch vụ bổ trợ</span>
                      <span className="font-medium text-vxn-ink">
                        +{formatCurrency(addonsTotal)}
                      </span>
                    </div>
                  )}
                  {appliedVoucher && (
                    <div className="flex items-center justify-between text-success-600">
                      <span>Mã {appliedVoucher.code || voucherCode}</span>
                      <span className="font-medium">−{formatCurrency(voucherDiscount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline justify-between rounded-2xl bg-vxn-bg-soft p-4">
                  <span className="text-sm font-medium text-vxn-fg-2">Tổng cộng</span>
                  <span className="text-2xl font-bold text-vxn-saffron-700">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>

                {currentStep === 0 ? (
                  <>
                    <Button
                      type="primary"
                      block
                      size="large"
                      loading={loading}
                      onClick={() => form.submit()}
                      className="!h-12 !rounded-[10px] !border-0 !bg-vxn-teal-700 !font-semibold hover:!bg-vxn-teal-800"
                    >
                      Tiếp tục → Thanh toán
                    </Button>
                    <button
                      type="button"
                      onClick={() => navigate(`/booking/seats/${tripView.id}`)}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-vxn-border bg-transparent text-sm font-medium text-vxn-fg-2 transition hover:border-vxn-teal-700 hover:text-vxn-teal-800"
                    >
                      <ArrowLeftOutlined /> Đổi chuyến khác
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      type="primary"
                      block
                      size="large"
                      loading={loading}
                      disabled={!acceptedPaymentTerms || !activePaymentMethod?.enabled}
                      onClick={handlePayment}
                      className="!h-12 !rounded-[10px] !border-0 !bg-vxn-saffron-600 !text-[15px] !font-semibold hover:!bg-vxn-saffron-700"
                    >
                      {paymentMethodForApi === 'cash'
                        ? 'Xác nhận đặt vé'
                        : `Thanh toán ${formatCurrency(finalTotal)} → ${activePaymentMethod?.name || 'VNPay'}`}
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-vxn-fg-5">
                      <SafetyOutlined className="text-vxn-teal-700" /> Mã hoá SSL · không lưu thông
                      tin thẻ
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </CustomerShell>
  );
};

export default PassengerInfoPage;
