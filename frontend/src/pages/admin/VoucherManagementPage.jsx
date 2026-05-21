import { useEffect, useMemo, useState } from 'react';
import { DatePicker, Form, Input, InputNumber, Modal, Select as AntSelect, Switch, message } from 'antd';
import dayjs from 'dayjs';
import { adminVouchers } from '../../services/adminApi';
import {
  Btn,
  Card,
  Chip,
  KpiCard,
  MoneyVND,
  PageHeader,
  Pager,
  SearchInput,
  Select,
  Table,
  VxnIcon,
} from '../../components/admin/vxn';

const { TextArea } = Input;
const PAGE_SIZE = 12;

const voucherStatus = (voucher) => {
  const now = Date.now();
  const from = voucher.validFrom ? new Date(voucher.validFrom).getTime() : 0;
  const until = voucher.validUntil ? new Date(voucher.validUntil).getTime() : Infinity;
  if (!voucher.isActive) return 'paused';
  if (now > until) return 'expired';
  if (voucher.maxUsageTotal != null && (voucher.currentUsageCount || 0) >= voucher.maxUsageTotal) {
    return 'expired';
  }
  if (now < from) return 'draft';
  return 'active';
};

const statusChip = (status) => {
  if (status === 'active') return <Chip tone="success" dot>Đang chạy</Chip>;
  if (status === 'paused') return <Chip tone="warn" dot>Tạm dừng</Chip>;
  if (status === 'draft') return <Chip tone="neutral" dot>Nháp</Chip>;
  return <Chip tone="danger" dot>Hết hạn</Chip>;
};

const discountLabel = (voucher) => {
  if (voucher.discountType === 'percentage') return `-${voucher.discountValue || 0}%`;
  return `-${MoneyVND(voucher.discountValue || 0)}`;
};

const VoucherManagementPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const [listResult, statsResult] = await Promise.allSettled([
      adminVouchers.getVouchers(),
      adminVouchers.getStatistics(),
    ]);

    if (listResult.status === 'fulfilled') {
      setVouchers(
        Array.isArray(listResult.value?.data?.vouchers) ? listResult.value.data.vouchers : []
      );
    } else {
      setVouchers([]);
      message.error(typeof listResult.reason === 'string' ? listResult.reason : 'Không thể tải voucher hệ thống');
    }

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value?.data || null);
    } else {
      setStats(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enriched = useMemo(
    () =>
      vouchers.map((voucher) => ({
        ...voucher,
        id: voucher._id || voucher.id,
        status: voucherStatus(voucher),
      })),
    [vouchers]
  );

  const filtered = useMemo(
    () =>
      enriched
        .filter((voucher) => {
          if (!q.trim()) return true;
          return [voucher.code, voucher.name, voucher.description]
            .join(' ')
            .toLowerCase()
            .includes(q.trim().toLowerCase());
        })
        .filter((voucher) => typeFilter === 'all' || voucher.discountType === typeFilter)
        .filter((voucher) => statusFilter === 'all' || voucher.status === statusFilter)
        .sort((a, b) => {
          if (a.status !== b.status) return a.status.localeCompare(b.status);
          return new Date(a.validUntil || 0) - new Date(b.validUntil || 0);
        }),
    [enriched, q, statusFilter, typeFilter]
  );

  useEffect(() => {
    setPage(1);
  }, [q, typeFilter, statusFilter]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const kpi = stats || {
    totalVouchers: enriched.length,
    activeVouchers: enriched.filter((voucher) => voucher.status === 'active').length,
    expiredVouchers: enriched.filter((voucher) => voucher.status === 'expired').length,
    totalUsageCount: enriched.reduce((sum, voucher) => sum + (voucher.currentUsageCount || 0), 0),
  };

  const openCreate = () => {
    setEditingVoucher(null);
    form.resetFields();
    form.setFieldsValue({
      discountType: 'percentage',
      minBookingAmount: 0,
      maxUsagePerCustomer: 1,
      validFrom: dayjs(),
      validUntil: dayjs().add(30, 'day'),
      isActive: true,
    });
    setModalVisible(true);
  };

  const openEdit = (voucher) => {
    setEditingVoucher(voucher);
    form.setFieldsValue({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountAmount: voucher.maxDiscountAmount,
      minBookingAmount: voucher.minBookingAmount || 0,
      maxUsageTotal: voucher.maxUsageTotal,
      maxUsagePerCustomer: voucher.maxUsagePerCustomer || 1,
      validFrom: voucher.validFrom ? dayjs(voucher.validFrom) : null,
      validUntil: voucher.validUntil ? dayjs(voucher.validUntil) : null,
      isActive: !!voucher.isActive,
    });
    setModalVisible(true);
  };

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        code: values.code?.toUpperCase(),
        name: values.name,
        description: values.description || undefined,
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxDiscountAmount: values.maxDiscountAmount ?? undefined,
        minBookingAmount: values.minBookingAmount ?? 0,
        maxUsageTotal: values.maxUsageTotal ?? null,
        maxUsagePerCustomer: values.maxUsagePerCustomer ?? 1,
        validFrom: values.validFrom?.toISOString(),
        validUntil: values.validUntil?.toISOString(),
        isActive: values.isActive,
      };

      if (editingVoucher) {
        await adminVouchers.update(editingVoucher.id, payload);
        message.success('Đã cập nhật voucher hệ thống');
      } else {
        await adminVouchers.create(payload);
        message.success('Đã tạo voucher hệ thống');
      }

      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(typeof error === 'string' ? error : error?.message || 'Không thể lưu voucher');
    }
  };

  const toggleVoucher = async (voucher) => {
    try {
      if (voucher.isActive) {
        await adminVouchers.deactivate(voucher.id);
        message.success('Đã tạm dừng voucher');
      } else {
        await adminVouchers.activate(voucher.id);
        message.success('Đã kích hoạt voucher');
      }
      loadData();
    } catch (error) {
      message.error(typeof error === 'string' ? error : error?.message || 'Không thể đổi trạng thái voucher');
    }
  };

  const deleteVoucher = (voucher) => {
    Modal.confirm({
      title: `Xóa mã ${voucher.code}?`,
      content: 'Voucher đã có lượt dùng sẽ không thể xóa. Hãy tạm dừng nếu cần giữ lịch sử.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await adminVouchers.delete(voucher.id);
          message.success('Đã xóa voucher');
          loadData();
        } catch (error) {
          message.error(typeof error === 'string' ? error : error?.message || 'Không thể xóa voucher');
        }
      },
    });
  };

  const columns = [
    {
      key: 'code',
      label: 'Mã & chương trình',
      render: (voucher) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            background: '#FFF4D8',
            color: 'var(--vxn-saffron-700)',
            border: '1px solid #F2D58A',
          }}>
            <VxnIcon name="badge-percent" size={20} />
          </span>
          <span>
            <div style={{ font: '700 13px var(--font-mono)', color: 'var(--vxn-saffron-700)' }}>
              {voucher.code}
            </div>
            <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)', marginTop: 2 }}>
              {voucher.name}
            </div>
            <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
              Áp dụng toàn hệ thống
            </div>
          </span>
        </div>
      ),
    },
    {
      key: 'discount',
      label: 'Mức giảm',
      render: (voucher) => (
        <div>
          <div style={{ font: '700 16px var(--font-display)', color: 'var(--vxn-saffron-700)' }}>
            {discountLabel(voucher)}
          </div>
          {voucher.maxDiscountAmount && (
            <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>
              Tối đa {MoneyVND(voucher.maxDiscountAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'min',
      label: 'Đơn tối thiểu',
      render: (voucher) => (voucher.minBookingAmount ? MoneyVND(voucher.minBookingAmount) : 'Không yêu cầu'),
    },
    {
      key: 'usage',
      label: 'Lượt dùng',
      render: (voucher) => `${Number(voucher.currentUsageCount || 0).toLocaleString('vi-VN')} / ${
        voucher.maxUsageTotal ? Number(voucher.maxUsageTotal).toLocaleString('vi-VN') : '∞'
      }`,
    },
    {
      key: 'validUntil',
      label: 'Hết hạn',
      render: (voucher) => (voucher.validUntil ? dayjs(voucher.validUntil).format('DD/MM/YYYY HH:mm') : 'Không giới hạn'),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (voucher) => statusChip(voucher.status),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (voucher) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn kind="ghost" icon="pencil" onClick={() => openEdit(voucher)}>Sửa</Btn>
          <Btn kind="ghost" icon={voucher.isActive ? 'pause' : 'play'} onClick={() => toggleVoucher(voucher)}>
            {voucher.isActive ? 'Dừng' : 'Bật'}
          </Btn>
          <Btn kind="ghost" icon="trash-2" onClick={() => deleteVoucher(voucher)}>Xóa</Btn>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Voucher hệ thống"
        description="Tạo mã ưu đãi do admin phát hành. Mã hệ thống được gợi ý cho khách và dùng được trên mọi nhà xe nếu thỏa điều kiện voucher."
        cta={<Btn kind="primary" icon="plus" onClick={openCreate}>Tạo voucher</Btn>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 22 }}>
        <KpiCard label="Tổng voucher" value={loading ? '—' : kpi.totalVouchers?.toLocaleString('vi-VN')} icon="ticket-percent" accent="var(--vxn-teal-700)" />
        <KpiCard label="Đang hoạt động" value={loading ? '—' : kpi.activeVouchers?.toLocaleString('vi-VN')} icon="badge-check" accent="#22C55E" />
        <KpiCard label="Lượt sử dụng" value={loading ? '—' : kpi.totalUsageCount?.toLocaleString('vi-VN')} icon="chart-column" accent="var(--vxn-saffron-600)" />
        <KpiCard label="Hết hạn" value={loading ? '—' : kpi.expiredVouchers?.toLocaleString('vi-VN')} icon="clock" accent="#EF4444" />
      </div>

      <Card padding={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--vxn-border)' }}>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm mã, tên chương trình..." />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'all', label: 'Tất cả loại' },
                { value: 'percentage', label: 'Giảm theo %' },
                { value: 'fixed', label: 'Giảm tiền cố định' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang chạy' },
                { value: 'paused', label: 'Tạm dừng' },
                { value: 'draft', label: 'Nháp' },
                { value: 'expired', label: 'Hết hạn' },
              ]}
            />
          </div>
        </div>
        <Table
          columns={columns}
          rows={loading ? [] : pageRows}
          empty={loading ? 'Đang tải voucher hệ thống...' : 'Chưa có voucher hệ thống.'}
        />
        <Pager total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
      </Card>

      <Modal
        title={editingVoucher ? 'Chỉnh sửa voucher hệ thống' : 'Tạo voucher hệ thống'}
        open={modalVisible}
        onOk={submitForm}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={720}
        okText={editingVoucher ? 'Cập nhật' : 'Tạo voucher'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="code"
              label="Mã voucher"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: 'Nhập mã voucher' },
                { pattern: /^[A-Za-z0-9_-]+$/, message: 'Chỉ dùng chữ, số, gạch ngang hoặc gạch dưới' },
              ]}
            >
              <Input disabled={!!editingVoucher} placeholder="VD: VXNGLOBAL50" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </div>

          <Form.Item name="name" label="Tên chương trình" rules={[{ required: true, message: 'Nhập tên chương trình' }]}>
            <Input placeholder="VD: Ưu đãi toàn hệ thống cuối tuần" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={2} placeholder="Điều kiện áp dụng hiển thị cho khách hàng" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="discountType" label="Loại giảm" style={{ flex: 1 }} rules={[{ required: true, message: 'Chọn loại giảm' }]}>
              <AntSelect
                options={[
                  { value: 'percentage', label: 'Giảm theo phần trăm (%)' },
                  { value: 'fixed', label: 'Giảm số tiền cố định' },
                ]}
              />
            </Form.Item>
            <Form.Item name="discountValue" label="Giá trị giảm" style={{ flex: 1 }} rules={[{ required: true, message: 'Nhập giá trị giảm' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="VD: 10 hoặc 50000" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="maxDiscountAmount" label="Giảm tối đa" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Bỏ trống nếu không giới hạn" />
            </Form.Item>
            <Form.Item name="minBookingAmount" label="Đơn tối thiểu" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0 = không yêu cầu" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="maxUsagePerCustomer" label="Lượt dùng / khách" style={{ flex: 1 }} rules={[{ required: true, message: 'Nhập lượt dùng mỗi khách' }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="maxUsageTotal" label="Tổng lượt dùng" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Bỏ trống = không giới hạn" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="validFrom" label="Bắt đầu" style={{ flex: 1 }} rules={[{ required: true, message: 'Chọn thời gian bắt đầu' }]}>
              <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="validUntil" label="Kết thúc" style={{ flex: 1 }} rules={[{ required: true, message: 'Chọn thời gian kết thúc' }]}>
              <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default VoucherManagementPage;
