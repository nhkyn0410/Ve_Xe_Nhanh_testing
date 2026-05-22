import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import api from '../../services/api';
import CustomerShell from '../../components/customer/CustomerShell';

const VNPayReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processVNPayReturn = async () => {
      try {
        const vnpParams = {};
        for (const [key, value] of searchParams.entries()) {
          vnpParams[key] = value;
        }
        console.log('VNPay return params:', vnpParams);

        const response = await api.get('/payments/vnpay/return', {
          params: vnpParams,
        });
        console.log('VNPay callback response:', response);

        const isSuccess =
          response.success === true || response.status === 'success';

        if (isSuccess && response.data) {
          const bookingCode = response.data?.booking?.bookingCode;
          const phone = response.data?.booking?.contactInfo?.phone || '';
          const redirectUrl = bookingCode
            ? `/booking/success?bookingCode=${bookingCode}${phone ? `&phone=${phone}` : ''}`
            : '/booking/success';
          navigate(redirectUrl, { replace: true });
        } else {
          // Failure path → BookingFailure with message
          const message =
            response.message ||
            response.data?.message ||
            'Thanh toán không thành công';
          const responseCode = vnpParams.vnp_ResponseCode || '';
          const bookingCode = vnpParams.vnp_TxnRef || '';
          const isError = ['24', '99'].includes(responseCode);
          const kind = isError ? 'error' : 'failure';
          const params = new URLSearchParams({
            kind,
            message,
            bookingCode,
            transactionId: vnpParams.vnp_TransactionNo || '',
          });
          navigate(`/booking/failure?${params.toString()}`, { replace: true });
        }
      } catch (error) {
        console.error('Process VNPay return error:', error);
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'Có lỗi xảy ra khi xử lý thanh toán';
        navigate(
          `/booking/failure?kind=error&message=${encodeURIComponent(msg)}`,
          { replace: true }
        );
      } finally {
        setLoading(false);
      }
    };

    processVNPayReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CustomerShell activeKey="buy">
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          {loading ? (
            <>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#036672' }} spin />} />
              <p className="mt-5 text-[15px] font-medium text-vxn-ink">
                Đang xử lý thanh toán...
              </p>
              <p className="mt-1 text-[13px] text-vxn-fg-4">
                Vui lòng không tắt trang này
              </p>
            </>
          ) : (
            <p className="text-[14px] text-vxn-fg-3">Đang chuyển trang...</p>
          )}
        </div>
      </div>
    </CustomerShell>
  );
};

export default VNPayReturn;
