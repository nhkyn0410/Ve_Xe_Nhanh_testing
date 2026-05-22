import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select as AntSelect,
  DatePicker,
  Switch,
  message,
  Dropdown,
} from 'antd';
import dayjs from 'dayjs';
import voucherApi from '../../services/voucherApi';
import {
  PageHeader,
  Btn,
  Select,
  SearchInput,
  StatPill,
  Chip,
  VxnIcon,
  RowIconBtn,
  PageBtn,
} from '../../components/operator/vxn';

const { TextArea } = Input;
const PAGE_SIZE = 10;

const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

const compactVnd = (n) => {
  const v = Number(n || 0);
  if (v >= 1e9) return `₫ ${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `₫ ${Math.round(v / 1e6)}M`;
  if (v >= 1e3) return `₫ ${Math.round(v / 1e3)}K`;
  return `₫ ${v}`;
};

function voucherStatus(v) {
  const now = Date.now();
  const from = v.validFrom ? new Date(v.validFrom).getTime() : 0;
  const until = v.validUntil ? new Date(v.validUntil).getTime() : Infinity;
  if (!v.isActive) return 'paused';
  if (now > until) return 'expired';
  if (v.maxUsageTotal != null && (v.currentUsageCount || 0) >= v.maxUsageTotal)
    return 'expired';
  if (now < from) return 'draft';
  return 'active';
}

function statusChip(s) {
  switch (s) {
    case 'active':
      return (
        <Chip tone="success" dot>
          Đang chạy
        </Chip>
      );
    case 'paused':
      return (
        <Chip tone="warn" dot>
          Tạm dừng
        </Chip>
      );
    case 'draft':
      return (
        <Chip tone="neutral" dot>
          Nháp
        </Chip>
      );
    default:
      return (
        <Chip tone="danger" dot>
          Hết hạn
        </Chip>
      );
  }
}

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState('');
  const [kindF, setKindF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [sort, setSort] = useState('used');
  const [page, setPage] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [form] = Form.useForm();

  const [usageTarget, setUsageTarget] = useState(null);
  const [usageReport, setUsageReport] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [vRes, sRes] = await Promise.allSettled([
      voucherApi.getOperatorVouchers({}),
      voucherApi.getStatistics(),
    ]);

    if (vRes.status === 'fulfilled') {
      const body = vRes.value;
      setVouchers(
        Array.isArray(body?.data?.vouchers)
          ? body.data.vouchers
          : Array.isArray(body?.data)
            ? body.data
            : []
      );
    } else {
      message.error(
        typeof vRes.reason === 'string'
          ? vRes.reason
          : 'Không thể tải danh sách mã giảm giá'
      );
      setVouchers([]);
    }
    if (sRes.status === 'fulfilled') {
      setStats(sRes.value?.data || null);
    } else {
      setStats(null);
    }
    setLoading(false);
  };

  const enriched = useMemo(
    () =>
      vouchers.map((v) => {
        const status = voucherStatus(v);
        return {
          raw: v,
          id: v._id,
          code: v.code || '—',
          name: v.name || v.description || '—',
          kind: v.discountType === 'percentage' ? 'percent' : 'fixed',
          value: v.discountValue || 0,
          max: v.maxDiscountAmount || null,
          minOrder: v.minBookingAmount || 0,
          used: v.currentUsageCount || 0,
          total: v.maxUsageTotal != null ? v.maxUsageTotal : null,
          expiresTs: v.validUntil ? new Date(v.validUntil).getTime() : 0,
          expires: v.validUntil
            ? dayjs(v.validUntil).format('DD/MM/YYYY')
            : 'Không giới hạn',
          status,
          isActive: !!v.isActive,
        };
      }),
    [vouchers]
  );

  const filtered = useMemo(
    () =>
      enriched
        .filter(
          (v) =>
            !q ||
            [v.code, v.name].join(' ').toLowerCase().includes(q.toLowerCase())
        )
        .filter((v) => kindF === 'all' || v.kind === kindF)
        .filter((v) => statusF === 'all' || v.status === statusF)
        .sort((a, b) => {
          if (sort === 'used') return b.used - a.used;
          if (sort === 'value') return b.value - a.value;
          if (sort === 'expires') return a.expiresTs - b.expiresTs;
          if (sort === 'code') return a.code.localeCompare(b.code);
          return 0;
        }),
    [enriched, q, kindF, statusF, sort]
  );

  useEffect(() => {
    setPage(1);
  }, [q, kindF, statusF, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const pageNumbers = useMemo(() => {
    const out = [];
    const s = Math.max(1, currentPage - 2);
    const e = Math.min(totalPages, currentPage + 2);
    for (let i = s; i <= e; i += 1) out.push(i);
    return out;
  }, [currentPage, totalPages]);

  const kpi = useMemo(() => {
    if (stats) {
      return {
        total: stats.totalVouchers || 0,
        active: stats.activeVouchers || 0,
        usage: stats.totalUsageCount || 0,
        expired: stats.expiredVouchers || 0,
      };
    }
    return {
      total: enriched.length,
      active: enriched.filter((v) => v.isActive).length,
      usage: enriched.reduce((s, v) => s + v.used, 0),
      expired: enriched.filter((v) => v.status === 'expired').length,
    };
  }, [stats, enriched]);

  const openCreate = () => {
    setEditingVoucher(null);
    form.resetFields();
    form.setFieldsValue({
      discountType: 'percentage',
      minBookingAmount: 0,
      maxUsagePerCustomer: 1,
      isActive: true,
    });
    setModalVisible(true);
  };

  const openEdit = (v) => {
    setEditingVoucher(v);
    form.setFieldsValue({
      code: v.code,
      name: v.name,
      description: v.description,
      discountType: v.discountType,
      discountValue: v.discountValue,
      maxDiscountAmount: v.maxDiscountAmount,
      minBookingAmount: v.minBookingAmount || 0,
      maxUsageTotal: v.maxUsageTotal,
      maxUsagePerCustomer: v.maxUsagePerCustomer || 1,
      validFrom: v.validFrom ? dayjs(v.validFrom) : null,
      validUntil: v.validUntil ? dayjs(v.validUntil) : null,
      isActive: !!v.isActive,
    });
    setModalVisible(true);
  };

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        code: values.code,
        name: values.name,
        description: values.description || undefined,
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxDiscountAmount: values.maxDiscountAmount ?? undefined,
        minBookingAmount: values.minBookingAmount ?? 0,
        maxUsageTotal: values.maxUsageTotal ?? null,
        maxUsagePerCustomer: values.maxUsagePerCustomer ?? 1,
        validFrom: values.validFrom ? values.validFrom.toISOString() : undefined,
        validUntil: values.validUntil
          ? values.validUntil.toISOString()
          : undefined,
        isActive: values.isActive,
      };

      if (editingVoucher) {
        await voucherApi.update(editingVoucher._id, payload);
        message.success('Cập nhật mã giảm giá thành công');
      } else {
        await voucherApi.create(payload);
        message.success('Tạo mã giảm giá thành công');
      }
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(
        typeof error === 'string' ? error : error?.message || 'Có lỗi xảy ra'
      );
    }
  };

  const handleToggle = async (v) => {
    try {
      if (v.isActive) {
        await voucherApi.deactivate(v._id);
        message.success('Đã tạm dừng mã giảm giá');
      } else {
        await voucherApi.activate(v._id);
        message.success('Đã kích hoạt mã giảm giá');
      }
      loadData();
    } catch (error) {
      message.error(
        typeof error === 'string'
          ? error
          : error?.message || 'Không thể cập nhật trạng thái'
      );
    }
  };

  const handleDelete = (v) => {
    Modal.confirm({
      title: `Xóa mã ${v.code}?`,
      content:
        'Mã đã từng được sử dụng sẽ không thể xóa — hãy tạm dừng thay vì xóa.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await voucherApi.delete(v._id);
          message.success('Đã xóa mã giảm giá');
          loadData();
        } catch (error) {
          message.error(
            typeof error === 'string'
              ? error
              : error?.message || 'Không thể xóa mã giảm giá'
          );
        }
      },
    });
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard?.writeText(code);
      message.success(`Đã sao chép mã ${code}`);
    } catch {
      message.info(code);
    }
  };

  const openUsage = async (v) => {
    setUsageTarget(v);
    setUsageReport(null);
    setUsageLoading(true);
    try {
      const body = await voucherApi.getUsageReport(v._id);
      setUsageReport(body?.data || null);
    } catch (error) {
      message.error(
        typeof error === 'string'
          ? error
          : error?.message || 'Không thể tải báo cáo sử dụng'
      );
      setUsageTarget(null);
    } finally {
      setUsageLoading(false);
    }
  };

  const rowMenu = (v) => ({
    items: [
      { key: 'usage', label: 'Xem báo cáo sử dụng' },
      {
        key: 'toggle',
        label: v.isActive ? 'Tạm dừng mã' : 'Kích hoạt mã',
      },
      { key: 'delete', label: 'Xóa mã', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'usage') openUsage(v.raw);
      else if (key === 'toggle') handleToggle(v.raw);
      else if (key === 'delete') handleDelete(v.raw);
    },
  });

  return (
    <>
      <PageHeader
        title="Quản lý mã giảm giá"
        description="Tạo và theo dõi hiệu quả các chương trình khuyến mãi, mã giảm giá theo tuyến và theo hạng thành viên."
        cta={
          <Btn kind="primary" icon="plus" onClick={openCreate}>
            Tạo mã mới
          </Btn>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatPill
          label="Tổng mã giảm giá"
          value={loading ? '—' : kpi.total.toLocaleString('vi-VN')}
          hint="Tất cả chương trình đã tạo"
        />
        <StatPill
          label="Đang hoạt động"
          value={loading ? '—' : kpi.active.toLocaleString('vi-VN')}
          hint="Mã đang được bật"
          tone="teal"
        />
        <StatPill
          label="Tổng lượt sử dụng"
          value={loading ? '—' : kpi.usage.toLocaleString('vi-VN')}
          hint="Cộng dồn tất cả mã"
          tone="teal"
        />
        <StatPill
          label="Đã hết hạn"
          value={loading ? '—' : kpi.expired.toLocaleString('vi-VN')}
          hint="Cần gia hạn hoặc dọn dẹp"
          tone="warn"
        />
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--vxn-border)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: 0,
        }}
      >
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Tìm mã code hoặc tên chương trình…"
        />
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <Select
            value={kindF}
            onChange={setKindF}
            options={[
              { value: 'all', label: 'Tất cả loại' },
              { value: 'percent', label: 'Giảm theo %' },
              { value: 'fixed', label: 'Giảm số tiền cố định' },
            ]}
          />
          <Select
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'paused', label: 'Tạm dừng' },
              { value: 'draft', label: 'Nháp' },
              { value: 'expired', label: 'Hết hạn' },
            ]}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'used', label: 'Sắp xếp: Lượt dùng ↓' },
              { value: 'value', label: 'Sắp xếp: Mức giảm ↓' },
              { value: 'expires', label: 'Sắp xếp: Sắp hết hạn' },
              { value: 'code', label: 'Sắp xếp: Mã A–Z' },
            ]}
          />
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--vxn-border)',
          borderRadius: 12,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                'Mã & tên',
                'Mức giảm',
                'Đơn tối thiểu',
                'Lượt sử dụng',
                'Hết hạn',
                'Trạng thái',
                '',
              ].map((c, i) => (
                <th
                  key={i}
                  style={{
                    background: '#F4F6FB',
                    textAlign: 'left',
                    padding: '12px 16px',
                    font: '500 11px var(--font-display)',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    color: 'var(--vxn-fg-5)',
                    borderBottom: '1px solid var(--vxn-border)',
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--vxn-fg-5)',
                  }}
                >
                  Đang tải mã giảm giá…
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((v, i) => {
                const usedPct = v.total ? (v.used / v.total) * 100 : null;
                return (
                  <tr
                    key={v.id}
                    style={{
                      borderBottom:
                        i < pageRows.length - 1
                          ? '1px solid var(--vxn-border)'
                          : 0,
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            background:
                              'linear-gradient(135deg, #FEF3D7 0%, #FCE7B0 100%)',
                            border: '1px solid #F3D58A',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            color: 'var(--vxn-saffron-700)',
                          }}
                        >
                          <VxnIcon
                            name="badge-percent"
                            size={22}
                            color="var(--vxn-saffron-700)"
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              font: '700 13px var(--font-mono)',
                              color: 'var(--vxn-saffron-700)',
                              letterSpacing: '.02em',
                            }}
                          >
                            {v.code}
                          </div>
                          <div
                            style={{
                              font: '500 13.5px var(--font-display)',
                              color: 'var(--vxn-ink)',
                              marginTop: 2,
                            }}
                          >
                            {v.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          font: '700 16px var(--font-display)',
                          color: 'var(--vxn-saffron-700)',
                        }}
                      >
                        {v.kind === 'percent'
                          ? `-${v.value}%`
                          : `-${vnd(v.value)}`}
                      </div>
                      {v.max && (
                        <div
                          style={{
                            font: '400 11px var(--font-display)',
                            color: 'var(--vxn-fg-5)',
                            marginTop: 2,
                          }}
                        >
                          Tối đa {vnd(v.max)}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        font: '400 13.5px var(--font-display)',
                        color: 'var(--vxn-fg-2)',
                      }}
                    >
                      {v.minOrder ? vnd(v.minOrder) : 'Không yêu cầu'}
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: 180 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          font: '500 13px var(--font-display)',
                          color: 'var(--vxn-ink)',
                          marginBottom: 4,
                        }}
                      >
                        <span>{v.used.toLocaleString('vi-VN')}</span>
                        <span
                          style={{
                            color: 'var(--vxn-fg-5)',
                            font: '400 12px var(--font-display)',
                          }}
                        >
                          / {v.total ? v.total.toLocaleString('vi-VN') : '∞'}
                        </span>
                      </div>
                      {usedPct != null ? (
                        <div
                          style={{
                            height: 6,
                            borderRadius: 3,
                            background: '#EEF1F7',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, usedPct)}%`,
                              height: '100%',
                              background:
                                usedPct > 80
                                  ? 'var(--vxn-warning-fg)'
                                  : 'var(--vxn-teal-700)',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            font: '400 11px var(--font-display)',
                            color: 'var(--vxn-fg-5)',
                          }}
                        >
                          Không giới hạn lượt
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        font: '400 13.5px var(--font-display)',
                        color: 'var(--vxn-fg-2)',
                      }}
                    >
                      {v.expires}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {statusChip(v.status)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 4,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <RowIconBtn
                          icon="copy"
                          title="Sao chép mã"
                          onClick={() => copyCode(v.code)}
                        />
                        <RowIconBtn
                          icon="pencil"
                          title="Chỉnh sửa"
                          onClick={() => openEdit(v.raw)}
                        />
                        <Dropdown
                          trigger={['click']}
                          menu={rowMenu(v)}
                          placement="bottomRight"
                        >
                          <span>
                            <RowIconBtn
                              icon="ellipsis-vertical"
                              title="Thao tác"
                            />
                          </span>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--vxn-fg-5)',
                  }}
                >
                  Chưa có mã giảm giá nào. Nhấn “Tạo mã mới” để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid var(--vxn-border)',
            background: '#FBFCFE',
          }}
        >
          <span
            style={{
              font: '400 13px var(--font-display)',
              color: 'var(--vxn-fg-5)',
            }}
          >
            Hiển thị {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} /{' '}
            {filtered.length} mã
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PageBtn
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </PageBtn>
            {pageNumbers.map((n) => (
              <PageBtn
                key={n}
                active={n === currentPage}
                onClick={() => setPage(n)}
              >
                {n}
              </PageBtn>
            ))}
            <PageBtn
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </PageBtn>
          </div>
        </div>
      </div>

      <Modal
        title={editingVoucher ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
        open={modalVisible}
        onOk={submitForm}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={720}
        okText={editingVoucher ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="code"
              label="Mã code"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: 'Vui lòng nhập mã code' },
                {
                  pattern: /^[A-Za-z0-9_-]+$/,
                  message: 'Chỉ chữ, số, dấu gạch ngang/dưới',
                },
              ]}
            >
              <Input
                placeholder="VD: WELCOME10"
                disabled={!!editingVoucher}
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>
            <Form.Item
              name="isActive"
              label="Kích hoạt"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </div>

          <Form.Item
            name="name"
            label="Tên chương trình"
            rules={[
              { required: true, message: 'Vui lòng nhập tên chương trình' },
            ]}
          >
            <Input placeholder="VD: Chào mừng thành viên mới" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả (tuỳ chọn)">
            <TextArea rows={2} placeholder="Mô tả chi tiết điều kiện áp dụng" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="discountType"
              label="Loại giảm giá"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Chọn loại giảm giá' }]}
            >
              <AntSelect
                options={[
                  { value: 'percentage', label: 'Giảm theo phần trăm (%)' },
                  { value: 'fixed', label: 'Giảm số tiền cố định (₫)' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="discountValue"
              label="Giá trị giảm"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Nhập giá trị giảm' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="VD: 10 hoặc 50000"
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="maxDiscountAmount"
              label="Giảm tối đa (₫)"
              style={{ flex: 1 }}
              tooltip="Áp dụng cho loại giảm theo phần trăm"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="Không giới hạn"
              />
            </Form.Item>
            <Form.Item
              name="minBookingAmount"
              label="Đơn tối thiểu (₫)"
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0 = không yêu cầu"
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="maxUsagePerCustomer"
              label="Lượt dùng / khách"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Nhập số lượt dùng/khách' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="maxUsageTotal"
              label="Tổng lượt dùng"
              style={{ flex: 1 }}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                placeholder="Bỏ trống = không giới hạn"
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="validFrom"
              label="Bắt đầu hiệu lực"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Chọn ngày bắt đầu' }]}
            >
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: '100%' }}
                placeholder="Chọn ngày giờ"
              />
            </Form.Item>
            <Form.Item
              name="validUntil"
              label="Kết thúc hiệu lực"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Chọn ngày kết thúc' }]}
            >
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: '100%' }}
                placeholder="Chọn ngày giờ"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`Báo cáo sử dụng · ${usageTarget?.code || ''}`}
        open={!!usageTarget}
        onCancel={() => {
          setUsageTarget(null);
          setUsageReport(null);
        }}
        footer={null}
        width={680}
      >
        {usageLoading && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--vxn-fg-5)',
              font: '400 13.5px var(--font-display)',
            }}
          >
            Đang tải báo cáo…
          </div>
        )}

        {!usageLoading && usageReport && (
          <div style={{ display: 'grid', gap: 16, paddingTop: 8 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 12,
              }}
            >
              {[
                [
                  'Lượt đã dùng',
                  (
                    usageReport.voucher?.currentUsageCount ?? 0
                  ).toLocaleString('vi-VN'),
                ],
                [
                  'Tổng giảm giá',
                  compactVnd(usageReport.statistics?.totalDiscount || 0),
                ],
                [
                  'Doanh thu liên quan',
                  compactVnd(usageReport.statistics?.totalRevenue || 0),
                ],
              ].map(([k, val]) => (
                <div
                  key={k}
                  style={{
                    background: 'var(--vxn-bg-mist)',
                    border: '1px solid var(--vxn-border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      font: '400 11.5px var(--font-display)',
                      color: 'var(--vxn-fg-5)',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      font: '700 20px var(--font-display)',
                      color: 'var(--vxn-ink)',
                      marginTop: 4,
                    }}
                  >
                    {val}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip tone="success">
                Hoàn tất: {usageReport.statistics?.completedCount || 0}
              </Chip>
              <Chip tone="info">
                Đã xác nhận: {usageReport.statistics?.confirmedCount || 0}
              </Chip>
              <Chip tone="danger">
                Đã huỷ: {usageReport.statistics?.cancelledCount || 0}
              </Chip>
            </div>

            <div>
              <div
                style={{
                  font: '600 13.5px var(--font-display)',
                  color: 'var(--vxn-ink)',
                  marginBottom: 8,
                }}
              >
                Lịch sử đặt vé dùng mã
              </div>
              {Array.isArray(usageReport.bookings) &&
              usageReport.bookings.length > 0 ? (
                <div
                  style={{
                    border: '1px solid var(--vxn-border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  {usageReport.bookings.map((b, idx) => (
                    <div
                      key={b.bookingCode || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderBottom:
                          idx < usageReport.bookings.length - 1
                            ? '1px solid var(--vxn-border)'
                            : 0,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            font: '600 13px var(--font-mono)',
                            color: 'var(--vxn-teal-800)',
                          }}
                        >
                          {b.bookingCode || '—'}
                        </div>
                        <div
                          style={{
                            font: '400 12px var(--font-display)',
                            color: 'var(--vxn-fg-5)',
                            marginTop: 2,
                          }}
                        >
                          {b.route || 'N/A'} ·{' '}
                          {b.customerPhone || b.customerEmail || 'Khách lẻ'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            font: '600 13px var(--font-display)',
                            color: 'var(--vxn-saffron-700)',
                          }}
                        >
                          -{vnd(b.discountAmount || 0)}
                        </div>
                        <div
                          style={{
                            font: '400 11.5px var(--font-display)',
                            color: 'var(--vxn-fg-5)',
                            marginTop: 2,
                          }}
                        >
                          {b.bookedAt
                            ? dayjs(b.bookedAt).format('DD/MM/YYYY HH:mm')
                            : '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--vxn-fg-5)',
                    font: '400 13px var(--font-display)',
                    border: '1px dashed var(--vxn-border)',
                    borderRadius: 10,
                  }}
                >
                  Chưa có lượt sử dụng nào.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default VouchersPage;
