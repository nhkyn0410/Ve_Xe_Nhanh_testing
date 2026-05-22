import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CameraOutlined,
  DeleteOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import CustomerLayout from '../../components/layouts/CustomerLayout';
import useAuthStore from '../../store/authStore';
import {
  changePassword,
  deleteAvatar,
  getUserProfile,
  updateProfile,
  uploadAvatar,
} from '../../services/customerApi';

const { Title, Text } = Typography;

const getResponseUser = (response) => response?.data?.user || response?.user || null;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: storedUser, updateUser } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profile, setProfile] = useState(storedUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const syncProfile = useCallback((nextProfile) => {
    if (!nextProfile) return;

    setProfile(nextProfile);
    updateUser(nextProfile);
    profileForm.setFieldsValue({
      fullName: nextProfile.fullName,
      phone: nextProfile.phone,
      gender: nextProfile.gender,
      dateOfBirth: nextProfile.dateOfBirth ? dayjs(nextProfile.dateOfBirth) : null,
    });
  }, [profileForm, updateUser]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      const nextProfile = getResponseUser(response);
      syncProfile(nextProfile);
    } catch (error) {
      message.error(error || 'Không thể tải hồ sơ cá nhân');
    } finally {
      setLoading(false);
    }
  }, [syncProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (values) => {
    try {
      setSaving(true);
      const payload = {
        fullName: values.fullName?.trim(),
        phone: values.phone?.trim(),
        gender: values.gender,
      };

      if (values.dateOfBirth) {
        payload.dateOfBirth = values.dateOfBirth.format('YYYY-MM-DD');
      }

      const response = await updateProfile(payload);
      syncProfile(getResponseUser(response));
      message.success(response?.message || 'Cập nhật hồ sơ thành công');
    } catch (error) {
      message.error(error || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      setChangingPassword(true);
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      message.success('Đổi mật khẩu thành công');
    } catch (error) {
      message.error(error || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUploadAvatar = async ({ file, onSuccess, onError }) => {
    try {
      setUploadingAvatar(true);
      const response = await uploadAvatar(file);
      syncProfile(getResponseUser(response));
      message.success(response?.message || 'Upload avatar thành công');
      onSuccess?.(response);
    } catch (error) {
      message.error(error || 'Không thể upload avatar');
      onError?.(error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const response = await deleteAvatar();
      syncProfile(getResponseUser(response));
      message.success(response?.message || 'Đã xóa avatar');
    } catch (error) {
      message.error(error || 'Không thể xóa avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadProps = {
    accept: 'image/png,image/jpeg,image/jpg,image/gif,image/webp',
    showUploadList: false,
    customRequest: handleUploadAvatar,
    beforeUpload: (file) => {
      const isImage = file.type?.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ chấp nhận file ảnh');
        return Upload.LIST_IGNORE;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Ảnh phải nhỏ hơn 5MB');
        return Upload.LIST_IGNORE;
      }

      return true;
    },
  };

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/')}
              className="mb-4"
            >
              Quay lại
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Title level={2} className="mb-1">
                  <UserOutlined className="text-blue-600 mr-2" />
                  Hồ sơ cá nhân
                </Title>
                <Text type="secondary">Quản lý thông tin tài khoản và bảo mật</Text>
              </div>
              <Tag color="blue" className="w-fit text-sm px-3 py-1">
                Khách hàng
              </Tag>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Spin spinning={loading}>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={8}>
                <Card className="h-full">
                  <div className="flex flex-col items-center text-center">
                    <Avatar
                      size={128}
                      src={profile?.avatar}
                      icon={<UserOutlined />}
                      className="bg-gradient-to-r from-primary-500 to-red-500 shadow-lg mb-4"
                    />
                    <Title level={4} className="mb-1">
                      {profile?.fullName || 'Khách hàng'}
                    </Title>
                    <Space className="text-gray-500 mb-1">
                      <MailOutlined />
                      <Text type="secondary">{profile?.email || 'Chưa có email'}</Text>
                    </Space>
                    <Space className="text-gray-500 mb-6">
                      <PhoneOutlined />
                      <Text type="secondary">{profile?.phone || 'Chưa có SĐT'}</Text>
                    </Space>

                    <Space wrap className="justify-center">
                      <Upload {...uploadProps}>
                        <Button
                          type="primary"
                          icon={<CameraOutlined />}
                          loading={uploadingAvatar}
                        >
                          Upload avatar
                        </Button>
                      </Upload>

                      {profile?.avatar && (
                        <Popconfirm
                          title="Xóa avatar?"
                          description="Avatar hiện tại sẽ bị xóa khỏi hồ sơ."
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                          onConfirm={handleDeleteAvatar}
                        >
                          <Button danger icon={<DeleteOutlined />} loading={uploadingAvatar}>
                            Xóa avatar
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>

              <Col xs={24} lg={16}>
                <Card title="Thông tin cá nhân" className="mb-6">
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    initialValues={{
                      fullName: profile?.fullName,
                      phone: profile?.phone,
                      gender: profile?.gender,
                      dateOfBirth: profile?.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
                    }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="fullName"
                          label="Họ tên"
                          rules={[
                            { required: true, message: 'Vui lòng nhập họ tên' },
                            { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                          ]}
                        >
                          <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="phone"
                          label="Số điện thoại"
                          rules={[
                            { required: true, message: 'Vui lòng nhập SĐT' },
                            {
                              pattern: /^[0-9]{10,11}$/,
                              message: 'SĐT phải có 10-11 chữ số',
                            },
                          ]}
                        >
                          <Input prefix={<PhoneOutlined />} placeholder="Nhập SĐT" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item name="dateOfBirth" label="Ngày sinh">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày sinh"
                            disabledDate={(current) => current && current > dayjs().endOf('day')}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="gender" label="Giới tính">
                          <Select
                            allowClear
                            placeholder="Chọn giới tính"
                            options={[
                              { value: 'male', label: 'Nam' },
                              { value: 'female', label: 'Nữ' },
                              { value: 'other', label: 'Khác' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item label="Email">
                      <Input value={profile?.email || ''} prefix={<MailOutlined />} disabled />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                      Lưu thay đổi
                    </Button>
                  </Form>
                </Card>

                <Card title="Đổi mật khẩu">
                  <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="currentPassword"
                          label="Mật khẩu hiện tại"
                          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                        >
                          <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu hiện tại"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="newPassword"
                          label="Mật khẩu mới"
                          rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                            { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
                            {
                              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                              message: 'Mật khẩu phải có chữ hoa, chữ thường và số',
                            },
                          ]}
                        >
                          <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="confirmPassword"
                      label="Xác nhận mật khẩu"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<LockOutlined />}
                      loading={changingPassword}
                    >
                      Đổi mật khẩu
                    </Button>
                  </Form>
                </Card>
              </Col>
            </Row>
          </Spin>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default ProfilePage;
