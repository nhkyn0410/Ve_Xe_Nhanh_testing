import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  DatePicker,
  Select,
  message,
  Image,
  Space,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { adminContent } from '../../../services/adminApi';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const BannerManagement = () => {
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await adminContent.banners.getAll();
      if (response.status === 'success') {
        setBanners(response.data);
      }
    } catch (error) {
      message.error(error || 'Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBanner(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    form.setFieldsValue({
      ...banner,
      dateRange:
        banner.startDate && banner.endDate
          ? [dayjs(banner.startDate), dayjs(banner.endDate)]
          : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await adminContent.banners.delete(id);
      if (response.status === 'success') {
        message.success('Đã xóa banner');
        fetchBanners();
      }
    } catch (error) {
      message.error(error || 'Không thể xóa banner');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        startDate: values.dateRange?.[0]?.toISOString(),
        endDate: values.dateRange?.[1]?.toISOString(),
      };
      delete data.dateRange;

      if (editingBanner) {
        await adminContent.banners.update(editingBanner._id, data);
        message.success('Đã cập nhật banner');
      } else {
        await adminContent.banners.create(data);
        message.success('Đã tạo banner mới');
      }

      setModalVisible(false);
      fetchBanners();
    } catch (error) {
      message.error(error || 'Có lỗi xảy ra');
    }
  };

  const columns = [
    {
      title: 'Hình Ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url) => (
        <Image
          src={url}
          alt="Banner"
          width={100}
          height={60}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
        />
      ),
    },
    {
      title: 'Tiêu Đề',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Vị Trí',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      render: (position) => {
        const positions = {
          homepage: 'Trang chủ',
          booking: 'Mua vé',
          routes: 'Khám phá',
          footer: 'Footer',
        };
        return <Tag>{positions[position] || position}</Tag>;
      },
    },
    {
      title: 'Thứ Tự',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      align: 'center',
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) =>
        isActive ? (
          <Tag color="green">Đang hoạt động</Tag>
        ) : (
          <Tag>Tạm dừng</Tag>
        ),
    },
    {
      title: 'Thời Gian',
      key: 'dates',
      width: 200,
      render: (_, record) => (
        <div className="text-sm">
          {record.startDate && (
            <div>Từ: {dayjs(record.startDate).format('DD/MM/YYYY')}</div>
          )}
          {record.endDate && (
            <div>Đến: {dayjs(record.endDate).format('DD/MM/YYYY')}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Hành Động',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa banner?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quản Lý Banners</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Tạo Banner Mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={banners}
        rowKey="_id"
        loading={loading}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingBanner ? 'Chỉnh Sửa Banner' : 'Tạo Banner Mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        okText={editingBanner ? 'Cập Nhật' : 'Tạo'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Tiêu Đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề banner..." />
          </Form.Item>

          <Form.Item name="description" label="Mô Tả">
            <TextArea rows={3} placeholder="Nhập mô tả..." />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="URL Hình Ảnh"
            rules={[{ required: true, message: 'Vui lòng nhập URL hình ảnh' }]}
          >
            <Input placeholder="https://example.com/banner.jpg" />
          </Form.Item>

          <Form.Item name="mobileImageUrl" label="URL Hình Ảnh Mobile">
            <Input placeholder="https://example.com/banner-mobile.jpg" />
          </Form.Item>

          <Form.Item name="linkUrl" label="Link Đích">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="linkText" label="Text Link">
            <Input placeholder="Xem thêm" />
          </Form.Item>

          <Form.Item
            name="position"
            label="Vị Trí Hiển Thị"
            rules={[{ required: true, message: 'Vui lòng chọn vị trí' }]}
          >
            <Select placeholder="Chọn vị trí">
              <Option value="homepage">Trang chủ</Option>
              <Option value="booking">Mua vé</Option>
              <Option value="routes">Khám phá</Option>
              <Option value="footer">Footer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="order"
            label="Thứ Tự"
            rules={[{ required: true, message: 'Vui lòng nhập thứ tự' }]}
          >
            <Input type="number" placeholder="1" />
          </Form.Item>

          <Form.Item name="dateRange" label="Thời Gian Hiển Thị">
            <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng Thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BannerManagement;
