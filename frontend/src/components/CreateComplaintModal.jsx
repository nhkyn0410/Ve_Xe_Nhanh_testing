import { useState } from 'react';
import { Modal, Form, Input, Select, Upload, Button, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { createComplaint } from '../services/complaintApi';

const { TextArea } = Input;
const { Dragger } = Upload;

const TEAL = '#036672';

const CATEGORIES = [
  { value: 'booking', label: 'Đặt vé', icon: '🎫' },
  { value: 'payment', label: 'Thanh toán', icon: '💳' },
  { value: 'service', label: 'Dịch vụ', icon: '🤝' },
  { value: 'driver', label: 'Tài xế', icon: '👨‍✈️' },
  { value: 'vehicle', label: 'Xe', icon: '🚌' },
  { value: 'refund', label: 'Hoàn tiền', icon: '💰' },
  { value: 'technical', label: 'Kỹ thuật', icon: '⚙️' },
  { value: 'other', label: 'Khác', icon: '📝' },
];

const PRIORITIES = [
  { value: 'low', label: 'Thấp', color: '#52c41a' },
  { value: 'medium', label: 'Trung bình', color: '#1890ff' },
  { value: 'high', label: 'Cao', color: '#fa8c16' },
  { value: 'urgent', label: 'Khẩn cấp', color: '#f5222d' },
];

const CreateComplaintModal = ({ open, onCancel, onSuccess, booking = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const complaintData = {
        subject: values.subject,
        description: values.description,
        category: values.category,
        priority: values.priority || 'medium',
        bookingId: booking?._id || values.bookingId,
        attachments: fileList.map((file) => ({
          fileName: file.name,
          fileUrl: file.url || file.response?.url,
          fileType: file.type,
        })),
      };

      const response = await createComplaint(complaintData);

      if (response.status === 'success') {
        message.success(
          'Tạo khiếu nại thành công! Mã ticket: ' + response.data.ticketNumber
        );
        form.resetFields();
        setFileList([]);
        onSuccess && onSuccess(response.data);
      }
    } catch (error) {
      console.error('Error creating complaint:', error);
      message.error(error?.message || 'Không thể tạo khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  const uploadProps = {
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('File phải nhỏ hơn 5MB!');
        return false;
      }
      setFileList((prev) => [...prev, file]);
      return false; // prevent auto upload
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
  };

  return (
    <Modal
      title={
        <span className="text-[17px] font-semibold text-vxn-ink">
          Gửi khiếu nại
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={680}
      destroyOnHidden
    >
      <div className="mb-5 rounded-xl border border-vxn-border bg-vxn-bg-soft px-4 py-3">
        <div className="text-[13px] font-medium text-vxn-ink">
          Chúng tôi xử lý khiếu nại trong vòng 24–48 giờ
        </div>
        <div className="mt-0.5 text-[12px] text-vxn-fg-4">
          Vui lòng cung cấp đầy đủ thông tin để được hỗ trợ tốt nhất.
        </div>
      </div>

      {booking && (
        <div
          className="mb-5 rounded-xl px-4 py-3 text-[13px]"
          style={{ background: '#D8F5E6', color: '#0F8458' }}
        >
          Khiếu nại cho vé{' '}
          <strong className="font-mono">{booking.bookingCode}</strong>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ priority: 'medium' }}
        requiredMark={false}
      >
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            label={<span className="font-medium">Danh mục</span>}
            name="category"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
          >
            <Select
              placeholder="Chọn danh mục khiếu nại"
              size="large"
              showSearch
              optionFilterProp="label"
              options={CATEGORIES.map((c) => ({
                value: c.value,
                label: `${c.icon}  ${c.label}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium">Mức độ ưu tiên</span>}
            name="priority"
          >
            <Select
              size="large"
              options={PRIORITIES.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={<span className="font-medium">Tiêu đề</span>}
          name="subject"
          rules={[
            { required: true, message: 'Vui lòng nhập tiêu đề!' },
            { max: 200, message: 'Tiêu đề không quá 200 ký tự!' },
          ]}
        >
          <Input
            placeholder="Tiêu đề ngắn gọn cho khiếu nại"
            size="large"
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium">Mô tả chi tiết</span>}
          name="description"
          rules={[
            { required: true, message: 'Vui lòng mô tả chi tiết vấn đề!' },
            { min: 20, message: 'Mô tả phải có ít nhất 20 ký tự!' },
          ]}
        >
          <TextArea
            rows={6}
            placeholder="Mô tả chi tiết vấn đề của bạn (thời gian, địa điểm, diễn biến...)"
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label={<span className="font-medium">Tệp đính kèm (tùy chọn)</span>}>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: TEAL }} />
            </p>
            <p className="ant-upload-text">Nhấp hoặc kéo thả file vào đây</p>
            <p className="ant-upload-hint">
              Hỗ trợ ảnh, PDF, Word. Tối đa 5MB mỗi file.
            </p>
          </Dragger>
          {fileList.length > 0 && (
            <div className="mt-2 text-[12px] text-vxn-fg-4">
              Đã chọn {fileList.length} file
            </div>
          )}
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
            Gửi khiếu nại
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateComplaintModal;
