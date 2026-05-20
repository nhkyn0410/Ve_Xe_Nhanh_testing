import { useEffect, useMemo, useState } from 'react';
import { Form, Input, InputNumber, Modal, Select as AntSelect, message } from 'antd';
import { stopsApi } from '../../services/operatorApi';
import {
  PageHeader,
  Btn,
  Select,
  SearchInput,
  StatPill,
  Chip,
  RowIconBtn,
  PageBtn,
  VxnIcon,
} from '../../components/operator/vxn';

const PAGE_SIZE = 10;

export const STOP_TYPE_OPTIONS = [
  { value: 'bus_station', label: 'Bến xe', icon: 'building-2', color: '#1D4ED8' },
  { value: 'rest_stop', label: 'Trạm dừng chân', icon: 'coffee', color: '#B45309' },
  { value: 'office', label: 'Văn phòng', icon: 'briefcase', color: '#15803D' },
  { value: 'roadside', label: 'Điểm đón/trả dọc đường', icon: 'map-pin', color: '#7C3AED' },
  { value: 'other', label: 'Khác', icon: 'circle-dot', color: '#475569' },
];

const TYPE_LABEL = STOP_TYPE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

const getStopCode = (stop) => stop.stopCode || stop.code || '—';

const StopsPage = () => {
  const [form] = Form.useForm();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStop, setEditingStop] = useState(null);

  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [sort, setSort] = useState('code');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadStops();
  }, []);

  const loadStops = async () => {
    setLoading(true);
    try {
      const response = await stopsApi.getStops({ limit: 500 });
      setStops(response?.data?.stops || []);
    } catch (error) {
      message.error(typeof error === 'string' ? error : 'Không thể tải danh sách điểm dừng');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      stops
        .filter((s) => {
          if (!q) return true;
          return [getStopCode(s), s.name, s.address, s.city, s.province]
            .join(' ')
            .toLowerCase()
            .includes(q.toLowerCase());
        })
        .filter((s) => typeF === 'all' || s.type === typeF)
        .filter((s) => statusF === 'all' || s.status === statusF)
        .sort((a, b) => {
          if (sort === 'code') return getStopCode(a).localeCompare(getStopCode(b));
          if (sort === 'name') return (a.name || '').localeCompare(b.name || '', 'vi');
          if (sort === 'trips') return (b.dailyTrips || 0) - (a.dailyTrips || 0);
          if (sort === 'routes') return (b.routes || 0) - (a.routes || 0);
          return 0;
        }),
    [stops, q, typeF, statusF, sort]
  );

  useEffect(() => {
    setPage(1);
  }, [q, typeF, statusF, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = stops.length;
    const busStations = stops.filter((s) => s.type === 'bus_station').length;
    const restStops = stops.filter((s) => s.type === 'rest_stop').length;
    const inactive = stops.filter((s) => s.status === 'inactive').length;
    return { total, busStations, restStops, inactive };
  }, [stops]);

  const pageNumbers = useMemo(() => {
    const out = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i += 1) out.push(i);
    return out;
  }, [currentPage, totalPages]);

  const handleCreate = () => {
    setEditingStop(null);
    form.resetFields();
    form.setFieldsValue({ type: 'bus_station', status: 'active' });
    setModalVisible(true);
  };

  const handleEdit = (stop) => {
    setEditingStop(stop);
    form.setFieldsValue({
      name: stop.name,
      type: stop.type || 'bus_station',
      address: stop.address,
      city: stop.city,
      province: stop.province,
      status: stop.status || 'active',
      lat: stop.coordinates?.lat,
      lng: stop.coordinates?.lng,
      notes: stop.notes,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        type: values.type,
        address: values.address,
        city: values.city,
        province: values.province,
        status: values.status,
        notes: values.notes,
      };

      if (values.lat !== undefined && values.lng !== undefined) {
        payload.coordinates = { lat: values.lat, lng: values.lng };
      }

      if (editingStop) {
        await stopsApi.update(editingStop._id, payload);
        message.success('Cập nhật điểm dừng thành công');
      } else {
        await stopsApi.create(payload);
        message.success('Tạo điểm dừng thành công');
      }

      setModalVisible(false);
      setEditingStop(null);
      loadStops();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(typeof error === 'string' ? error : error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = (stop) => {
    Modal.confirm({
      title: 'Xóa điểm dừng',
      content: `Điểm "${stop.name}" sẽ chuyển sang trạng thái ngừng hoạt động. Các tuyến đã dùng điểm này vẫn giữ snapshot hiện tại.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await stopsApi.delete(stop._id);
          message.success('Đã ngừng sử dụng điểm dừng');
          loadStops();
        } catch (error) {
          message.error(typeof error === 'string' ? error : 'Không thể xóa điểm dừng');
        }
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Quản lý điểm dừng"
        description="Tạo danh mục bến xe, trạm dừng chân, văn phòng và điểm đón/trả để tái sử dụng khi cấu hình tuyến."
        cta={
          <Btn kind="primary" icon="plus" onClick={handleCreate}>
            Thêm điểm dừng
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
          label="Tổng điểm dừng"
          value={loading ? '—' : String(stats.total)}
          hint={`${stats.busStations} bến xe chính`}
        />
        <StatPill
          label="Bến xe"
          value={loading ? '—' : String(stats.busStations)}
          hint="Có thể dùng làm điểm lên/xuống"
          tone="teal"
        />
        <StatPill
          label="Trạm dừng chân"
          value={loading ? '—' : String(stats.restStops)}
          hint="Dùng cho điểm giữa hành trình"
        />
        <StatPill
          label="Ngừng hoạt động"
          value={loading ? '—' : String(stats.inactive)}
          hint="Không còn cho chọn khi tạo tuyến"
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
          placeholder="Tìm mã, tên, địa chỉ điểm dừng…"
        />
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <Select
            value={typeF}
            onChange={setTypeF}
            options={[
              { value: 'all', label: 'Tất cả loại điểm' },
              ...STOP_TYPE_OPTIONS.map((type) => ({ value: type.value, label: type.label })),
            ]}
          />
          <Select
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Ngừng hoạt động' },
            ]}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'code', label: 'Sắp xếp: Mã' },
              { value: 'name', label: 'Sắp xếp: Tên A-Z' },
              { value: 'trips', label: 'Sắp xếp: Lượt/ngày' },
              { value: 'routes', label: 'Sắp xếp: Số tuyến' },
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
                'Mã',
                'Tên & địa chỉ',
                'Loại điểm',
                'Thành phố',
                'Tuyến đang dùng',
                'Lượt/ngày',
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
                  colSpan={8}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    font: '400 14px var(--font-display)',
                    color: 'var(--vxn-fg-5)',
                  }}
                >
                  Đang tải danh sách điểm dừng…
                </td>
              </tr>
            )}

            {!loading && pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    font: '400 14px var(--font-display)',
                    color: 'var(--vxn-fg-5)',
                  }}
                >
                  Chưa có điểm dừng nào. Hãy tạo bến xe hoặc trạm dừng trước khi cấu hình tuyến.
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((s, i) => {
                const t = TYPE_LABEL[s.type] || TYPE_LABEL.other;
                const routeRefs = Array.isArray(s.routeRefs) ? s.routeRefs : [];
                return (
                  <tr
                    key={s._id || getStopCode(s)}
                    style={{
                      borderBottom:
                        i < pageRows.length - 1 ? '1px solid var(--vxn-border)' : 0,
                    }}
                  >
                    <td
                      style={{
                        padding: '14px 16px',
                        font: '500 13px var(--font-mono)',
                        color: 'var(--vxn-teal-800)',
                      }}
                    >
                      {getStopCode(s)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            flexShrink: 0,
                            background: `${t.color}1A`,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <VxnIcon name={t.icon} size={18} color={t.color} />
                        </div>
                        <div>
                          <div
                            style={{
                              font: '600 14px var(--font-display)',
                              color: 'var(--vxn-ink)',
                            }}
                          >
                            {s.name}
                          </div>
                          <div
                            style={{
                              font: '400 12px var(--font-display)',
                              color: 'var(--vxn-fg-5)',
                              marginTop: 2,
                            }}
                          >
                            {s.address || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: `${t.color}14`,
                          color: t.color,
                          font: '500 12px var(--font-display)',
                        }}
                      >
                        {t.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        font: '400 13.5px var(--font-display)',
                        color: 'var(--vxn-fg-2)',
                      }}
                    >
                      {s.city || s.province || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 220 }}>
                        {routeRefs.length > 0 ? (
                          routeRefs.slice(0, 3).map((route) => (
                            <Chip key={route.routeId || route.routeCode} tone="info">
                              {route.routeCode || route.routeName}
                            </Chip>
                          ))
                        ) : (
                          <span style={{ color: 'var(--vxn-fg-5)' }}>0 tuyến</span>
                        )}
                        {routeRefs.length > 3 && <Chip tone="neutral">+{routeRefs.length - 3}</Chip>}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        font: '500 13.5px var(--font-display)',
                        color: 'var(--vxn-ink)',
                      }}
                    >
                      {s.dailyTrips || 0}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {s.status === 'active' ? (
                        <Chip tone="success" dot>
                          Hoạt động
                        </Chip>
                      ) : (
                        <Chip tone="neutral" dot>
                          Ngừng
                        </Chip>
                      )}
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
                          icon="pencil"
                          title="Sửa điểm dừng"
                          onClick={() => handleEdit(s)}
                        />
                        <RowIconBtn
                          icon="trash-2"
                          title="Xóa điểm dừng"
                          onClick={() => handleDelete(s)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            Hiển thị {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} điểm dừng
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PageBtn
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </PageBtn>
            {pageNumbers.map((n) => (
              <PageBtn key={n} active={n === currentPage} onClick={() => setPage(n)}>
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
        title={editingStop ? 'Chỉnh sửa điểm dừng' : 'Thêm điểm dừng'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingStop(null);
        }}
        okText={editingStop ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        width={720}
      >
        <Form form={form} layout="vertical" style={{ paddingTop: 8 }}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Tên điểm dừng"
              rules={[{ required: true, message: 'Vui lòng nhập tên điểm dừng' }]}
            >
              <Input placeholder="Ví dụ: Bến xe Miền Đông" />
            </Form.Item>
            <Form.Item
              name="type"
              label="Loại điểm"
              rules={[{ required: true, message: 'Vui lòng chọn loại điểm' }]}
            >
              <AntSelect
                options={STOP_TYPE_OPTIONS.map((type) => ({
                  value: type.value,
                  label: type.label,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item name="address" label="Địa chỉ chi tiết">
            <Input placeholder="Ví dụ: 292 Đinh Bộ Lĩnh, Bình Thạnh" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="city" label="Quận/Huyện/Thành phố">
              <Input placeholder="Ví dụ: TP. Thủ Đức" />
            </Form.Item>
            <Form.Item name="province" label="Tỉnh/Thành phố">
              <Input placeholder="Ví dụ: TP. Hồ Chí Minh" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="lat" label="Vĩ độ">
              <InputNumber min={-90} max={90} className="w-full" placeholder="10.762" />
            </Form.Item>
            <Form.Item name="lng" label="Kinh độ">
              <InputNumber min={-180} max={180} className="w-full" placeholder="106.660" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái">
              <AntSelect
                options={[
                  { value: 'active', label: 'Hoạt động' },
                  { value: 'inactive', label: 'Ngừng hoạt động' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú nội bộ cho nhân viên vận hành" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StopsPage;
