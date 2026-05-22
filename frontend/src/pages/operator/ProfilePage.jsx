import { useEffect, useState } from 'react';
import { Button, Form, Input, Spin, message } from 'antd';
import { PageHeader, Panel } from '../../components/operator/vxn';
import { operatorAuth } from '../../services/operatorApi';
import useOperatorAuthStore from '../../store/operatorAuthStore';
import { getOperatorDisplayName } from '../../utils/operatorDisplay';

const fieldStyle = {
  display: 'grid',
  gap: 6,
};

const labelStyle = {
  font: '500 13px var(--font-display)',
  color: 'var(--vxn-fg-2)',
};

const OperatorProfilePage = () => {
  const [form] = Form.useForm();
  const { operator, updateOperator } = useOperatorAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    operatorAuth
      .getProfile()
      .then((res) => {
        if (!alive) return;
        const profile = res?.data?.operator || res?.operator || operator || {};
        form.setFieldsValue({
          operatorName: getOperatorDisplayName(profile, ''),
          companyName: profile.companyName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          businessLicense: profile.businessLicense || '',
          taxCode: profile.taxCode || '',
          website: profile.website || '',
          description: profile.description || '',
          address: {
            street: profile.address?.street || '',
            ward: profile.address?.ward || '',
            district: profile.address?.district || '',
            city: profile.address?.city || '',
          },
          bankInfo: {
            bankName: profile.bankInfo?.bankName || '',
            accountNumber: profile.bankInfo?.accountNumber || '',
            accountHolder: profile.bankInfo?.accountHolder || '',
          },
        });
        updateOperator(profile);
      })
      .catch((error) => {
        message.error(error || 'Không thể tải hồ sơ nhà xe');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [form]);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        operatorName: values.operatorName?.trim(),
        companyName: values.companyName?.trim(),
        phone: values.phone?.trim(),
        website: values.website?.trim(),
        description: values.description?.trim(),
        address: values.address,
        bankInfo: values.bankInfo,
      };

      const res = await operatorAuth.updateProfile(payload);
      const updated = res?.data?.operator || res?.operator || payload;
      updateOperator(updated);
      message.success('Đã cập nhật hồ sơ nhà xe');
    } catch (error) {
      message.error(error || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Hồ sơ nhà xe"
        description="Cập nhật tên hiển thị và thông tin liên hệ xuất hiện trên vé, trang tìm chuyến và các màn customer."
      />

      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(320px,.8fr)', gap: 20 }}>
            <Panel title="Thông tin hiển thị">
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Tên hiển thị nhà xe</span>
                  <Form.Item
                    name="operatorName"
                    noStyle
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên hiển thị' },
                      { min: 3, message: 'Tên hiển thị phải có ít nhất 3 ký tự' },
                    ]}
                  >
                    <Input size="large" placeholder="Ví dụ: Phương Trang Express" />
                  </Form.Item>
                </div>

                <div style={fieldStyle}>
                  <span style={labelStyle}>Tên công ty</span>
                  <Form.Item name="companyName" noStyle>
                    <Input size="large" placeholder="Tên pháp lý/doanh nghiệp" />
                  </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Email</span>
                    <Form.Item name="email" noStyle>
                      <Input size="large" disabled />
                    </Form.Item>
                  </div>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Số điện thoại</span>
                    <Form.Item name="phone" noStyle>
                      <Input size="large" placeholder="Hotline nhà xe" />
                    </Form.Item>
                  </div>
                </div>

                <div style={fieldStyle}>
                  <span style={labelStyle}>Website</span>
                  <Form.Item name="website" noStyle>
                    <Input size="large" placeholder="https://..." />
                  </Form.Item>
                </div>

                <div style={fieldStyle}>
                  <span style={labelStyle}>Mô tả</span>
                  <Form.Item name="description" noStyle>
                    <Input.TextArea rows={5} placeholder="Giới thiệu ngắn về nhà xe" />
                  </Form.Item>
                </div>
              </div>
            </Panel>

            <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
              <Panel title="Hồ sơ pháp lý">
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Giấy phép kinh doanh</span>
                    <Form.Item name="businessLicense" noStyle>
                      <Input disabled />
                    </Form.Item>
                  </div>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Mã số thuế</span>
                    <Form.Item name="taxCode" noStyle>
                      <Input disabled />
                    </Form.Item>
                  </div>
                </div>
              </Panel>

              <Panel title="Địa chỉ">
                <div style={{ display: 'grid', gap: 14 }}>
                  <Form.Item name={['address', 'street']} label="Đường/số nhà">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['address', 'ward']} label="Phường/xã">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['address', 'district']} label="Quận/huyện">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['address', 'city']} label="Tỉnh/thành">
                    <Input />
                  </Form.Item>
                </div>
              </Panel>

              <Panel title="Tài khoản nhận thanh toán">
                <div style={{ display: 'grid', gap: 14 }}>
                  <Form.Item name={['bankInfo', 'bankName']} label="Ngân hàng">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['bankInfo', 'accountNumber']} label="Số tài khoản">
                    <Input />
                  </Form.Item>
                  <Form.Item name={['bankInfo', 'accountHolder']} label="Chủ tài khoản">
                    <Input />
                  </Form.Item>
                </div>
              </Panel>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => form.resetFields()} disabled={saving}>
              Hoàn tác
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu hồ sơ
            </Button>
          </div>
        </Form>
      </Spin>
    </>
  );
};

export default OperatorProfilePage;
