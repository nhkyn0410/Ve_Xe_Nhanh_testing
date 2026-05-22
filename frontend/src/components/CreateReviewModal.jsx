import { useState } from 'react';
import { Modal, Form, Input, Rate, Upload, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createReview } from '../services/reviewApi';
import { getOperatorDisplayName } from '../utils/operatorDisplay';

const { TextArea } = Input;

const TEAL = '#036672';
const SAFFRON = '#E89B26';

const DETAIL_RATINGS = [
  { name: 'vehicleRating', label: 'Xe' },
  { name: 'driverRating', label: 'Tài xế' },
  { name: 'punctualityRating', label: 'Đúng giờ' },
  { name: 'serviceRating', label: 'Phục vụ' },
];

const resolveRoute = (booking) => {
  const route = booking?.tripId?.routeId;
  if (route?.origin?.city && route?.destination?.city) {
    return `${route.origin.city} → ${route.destination.city}`;
  }
  return route?.routeName || booking?.tripInfo?.route || null;
};

const resolveOperator = (booking) => {
  const op = booking?.operatorId;
  if (op && typeof op === 'object') return getOperatorDisplayName(op, null);
  return null;
};

const resolveDate = (booking) => {
  const d = booking?.tripId?.departureTime || booking?.tripInfo?.departureTime;
  return d ? dayjs(d).format('DD/MM/YYYY') : null;
};

const CreateReviewModal = ({ visible, onClose, booking, onReviewCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const route = resolveRoute(booking);
  const operator = resolveOperator(booking);
  const tripDate = resolveDate(booking);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const reviewData = {
        overallRating: values.overallRating,
        vehicleRating: values.vehicleRating || null,
        driverRating: values.driverRating || null,
        punctualityRating: values.punctualityRating || null,
        serviceRating: values.serviceRating || null,
        comment: values.comment || '',
        images: fileList
          .map((file) => file.url || file.response?.url)
          .filter(Boolean),
      };

      const response = await createReview(booking._id, reviewData);

      if (response.success || response.status === 'success') {
        message.success('Cảm ơn bạn đã đánh giá!');
        form.resetFields();
        setFileList([]);
        onReviewCreated && onReviewCreated(response.data || response.review);
        onClose();
      }
    } catch (error) {
      console.error('Create review error:', error);
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          'Không thể gửi đánh giá. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onClose();
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được tải lên hình ảnh!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Hình ảnh phải nhỏ hơn 5MB!');
        return Upload.LIST_IGNORE;
      }
      setFileList((prev) => [...prev, file]);
      return false; // prevent auto upload
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
    fileList,
    listType: 'picture-card',
    maxCount: 5,
    accept: 'image/*',
  };

  return (
    <Modal
      title={
        <span className="text-[17px] font-semibold text-vxn-ink">
          Đánh giá chuyến đi
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={680}
      destroyOnHidden
    >
      <div className="mb-5 rounded-xl border border-vxn-border bg-vxn-bg-soft px-4 py-3">
        <div className="text-[13px] font-medium text-vxn-ink">
          Đánh giá của bạn giúp người sau chọn nhà xe tốt hơn
        </div>
        {(operator || route || tripDate) && (
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[12px] text-vxn-fg-4">
            {operator && <span>{operator}</span>}
            {operator && (route || tripDate) && <span>·</span>}
            {route && <span>{route}</span>}
            {route && tripDate && <span>·</span>}
            {tripDate && <span>{tripDate}</span>}
          </div>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ overallRating: 5 }}
        requiredMark={false}
      >
        <Form.Item
          label={<span className="font-medium">Đánh giá tổng thể</span>}
          name="overallRating"
          rules={[{ required: true, message: 'Vui lòng chọn đánh giá!' }]}
        >
          <Rate allowHalf style={{ color: SAFFRON, fontSize: 32 }} />
        </Form.Item>

        <div className="mb-5 rounded-xl border border-vxn-border bg-vxn-bg-soft px-4 py-3">
          <div className="mb-2 text-[13px] font-medium text-vxn-ink">
            Đánh giá chi tiết{' '}
            <span className="font-normal text-vxn-fg-4">(tùy chọn)</span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {DETAIL_RATINGS.map((r) => (
              <Form.Item
                key={r.name}
                label={<span className="text-[13px]">{r.label}</span>}
                name={r.name}
                className="!mb-1"
              >
                <Rate allowHalf style={{ color: SAFFRON, fontSize: 18 }} />
              </Form.Item>
            ))}
          </div>
        </div>

        <Form.Item
          label={<span className="font-medium">Nhận xét của bạn</span>}
          name="comment"
          rules={[{ max: 500, message: 'Nhận xét không quá 500 ký tự!' }]}
        >
          <TextArea
            rows={5}
            placeholder="Chia sẻ trải nghiệm của bạn về chuyến đi này (xe, tài xế, sự đúng giờ, dịch vụ...)"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="font-medium">
              Hình ảnh{' '}
              <span className="font-normal text-vxn-fg-4">(tối đa 5 ảnh)</span>
            </span>
          }
        >
          <Upload {...uploadProps}>
            {fileList.length < 5 && (
              <div className="text-vxn-fg-4">
                <PlusOutlined />
                <div className="mt-1 text-[12px]">Tải ảnh</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={handleCancel} size="large" className="!rounded-lg">
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="!rounded-lg"
            style={{ background: TEAL, borderColor: TEAL }}
          >
            Gửi đánh giá
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateReviewModal;
