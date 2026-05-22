import { useEffect, useState } from 'react';
import { Button, Spin, message } from 'antd';
import { DeleteOutlined, GiftOutlined, TagOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomerShell from '../../components/customer/CustomerShell';
import CustomerBreadcrumb from '../../components/customer/CustomerBreadcrumb';
import { getVoucherWallet, removeVoucherFromWallet } from '../../services/bookingApi';

const formatCurrency = (value = 0) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatBenefit = (voucher) => {
  const base =
    voucher.discountType === 'percentage'
      ? `Giảm ${voucher.discountValue || 0}%`
      : `Giảm ${formatCurrency(voucher.discountValue || 0)}`;
  if (voucher.discountType === 'percentage' && voucher.maxDiscountAmount) {
    return `${base}, tối đa ${formatCurrency(voucher.maxDiscountAmount)}`;
  }
  return base;
};

const statusMeta = {
  saved: { label: 'Có thể dùng', className: 'bg-success-50 text-success-700' },
  used: { label: 'Đã dùng', className: 'bg-vxn-bg-cloud text-vxn-fg-4' },
  expired: { label: 'Hết hiệu lực', className: 'bg-red-50 text-red-700' },
};

const VoucherWalletPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const response = await getVoucherWallet();
      setVouchers(Array.isArray(response?.data?.vouchers) ? response.data.vouchers : []);
    } catch (error) {
      message.error(typeof error === 'string' ? error : 'Không thể tải ví voucher');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleRemove = async (voucher) => {
    try {
      await removeVoucherFromWallet(voucher.id || voucher._id);
      message.success(`Đã xóa ${voucher.code} khỏi ví`);
      loadWallet();
    } catch (error) {
      message.error(typeof error === 'string' ? error : 'Không thể xóa voucher');
    }
  };

  return (
    <CustomerShell activeKey="member" mainClassName="bg-vxn-bg-soft">
      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1120px]">
          <CustomerBreadcrumb
            items={[{ label: 'Tài khoản', to: '/profile' }, { label: 'Ví voucher' }]}
          />

          <div className="mb-6 mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em] text-vxn-ink">
                Ví voucher
              </h1>
              <p className="m-0 mt-1 text-sm text-vxn-fg-3">
                Các mã đã lưu sẽ được ưu tiên gợi ý khi đặt vé.
              </p>
            </div>
            <Button icon={<GiftOutlined />} onClick={loadWallet}>
              Làm mới
            </Button>
          </div>

          {loading ? (
            <div className="grid min-h-[260px] place-items-center rounded-2xl border border-vxn-border bg-white">
              <Spin tip="Đang tải ví voucher..." />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-vxn-border bg-white p-8 text-center">
              <div>
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-vxn-bg-mist text-vxn-teal-700">
                  <TagOutlined />
                </div>
                <div className="text-[16px] font-semibold text-vxn-ink">Chưa có voucher đã lưu</div>
                <div className="mt-1 text-sm text-vxn-fg-4">
                  Khi đặt vé, hãy lưu các mã phù hợp để dùng nhanh ở lần sau.
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vouchers.map((voucher) => {
                const meta = statusMeta[voucher.walletStatus] || statusMeta.saved;
                return (
                  <article
                    key={voucher.id || voucher.code}
                    className="rounded-2xl border border-vxn-border bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-bold tracking-[0.06em] text-vxn-saffron-700">
                          {voucher.code}
                        </div>
                        <h2 className="m-0 mt-1 text-[16px] font-semibold text-vxn-ink">
                          {voucher.name || 'Voucher ưu đãi'}
                        </h2>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[20px] font-semibold text-vxn-teal-800">
                      {formatBenefit(voucher)}
                    </div>
                    <div className="mt-2 text-sm text-vxn-fg-3">
                      {voucher.minBookingAmount
                        ? `Đơn từ ${formatCurrency(voucher.minBookingAmount)}`
                        : 'Không yêu cầu giá trị đơn tối thiểu'}
                    </div>
                    <div className="mt-1 text-xs text-vxn-fg-5">
                      Nguồn: {voucher.sourceLabel || 'Ưu đãi'} · HSD{' '}
                      {voucher.validUntil ? dayjs(voucher.validUntil).format('DD/MM/YYYY') : 'không giới hạn'}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(voucher)}
                        disabled={voucher.walletStatus === 'used'}
                      >
                        Xóa khỏi ví
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
};

export default VoucherWalletPage;
