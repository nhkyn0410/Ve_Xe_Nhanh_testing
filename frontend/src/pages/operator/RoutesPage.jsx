import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Divider,
  Button,
  Dropdown,
  Select as AntSelect,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { routesApi, stopsApi } from '../../services/operatorApi';
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

const STOP_TYPE_LABEL = {
  bus_station: 'Bến xe',
  rest_stop: 'Trạm dừng chân',
  office: 'Văn phòng',
  roadside: 'Điểm đón/trả dọc đường',
  other: 'Khác',
};

const getPointValue = (point, fallback) => (point?.stopId ? String(point.stopId) : fallback);

const getStopOptionLabel = (stop) =>
  [stop.name, stop.address, stop.city || stop.province].filter(Boolean).join(' · ');

const snapshotFromCatalogStop = (stop) => ({
  stopId: stop._id,
  name: stop.name,
  address: stop.address,
  coordinates: stop.coordinates,
});

/** Map a repo Route document onto the design's flat route shape. */
const mapRoute = (r) => ({
  _id: r._id,
  raw: r,
  code: r.routeCode || '—',
  name: r.routeName || '',
  from: r.origin?.city || '—',
  fromSt: r.origin?.station || r.origin?.address || r.origin?.province || '',
  to: r.destination?.city || '—',
  toSt: r.destination?.station || r.destination?.address || r.destination?.province || '',
  distance: Number(r.distance) || 0,
  durMin: Number(r.estimatedDuration) || 0,
  stops: Array.isArray(r.stops) ? r.stops.length : 0,
  trips: Number(r.tripsPerDay) || 0,
  // Giá vé cấu hình ở tuyến là nguồn chính; nếu tuyến cũ chưa có thì dùng giá thấp nhất từ chuyến.
  price: Number(r.basePrice) || Number(r.priceFrom) || 0,
  status: r.isActive ? 'active' : 'suspended',
});

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogStops, setCatalogStops] = useState([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [legacyPointMap, setLegacyPointMap] = useState({});

  // Filters / sort / paging (faithful to design view-routes.jsx)
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [fromF, setFromF] = useState('all');
  const [sort, setSort] = useState('code');
  const [page, setPage] = useState(1);

  // CRUD modal (preserved functional behaviour)
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRoutes();
    loadStops();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const response = await routesApi.getMyRoutes({ limit: 200 });
      setRoutes(response?.data?.routes || []);
    } catch (error) {
      message.error(typeof error === 'string' ? error : 'Không thể tải danh sách tuyến đường');
    } finally {
      setLoading(false);
    }
  };

  const loadStops = async () => {
    setStopsLoading(true);
    try {
      const response = await stopsApi.getStops({ limit: 500 });
      setCatalogStops(response?.data?.stops || []);
    } catch (error) {
      message.error(typeof error === 'string' ? error : 'Không thể tải danh mục điểm dừng');
    } finally {
      setStopsLoading(false);
    }
  };

  const mapped = useMemo(() => routes.map(mapRoute), [routes]);

  const stopById = useMemo(
    () => new Map(catalogStops.map((stop) => [String(stop._id), stop])),
    [catalogStops]
  );

  const stopOptions = useMemo(() => {
    const legacyOptions = Object.entries(legacyPointMap).map(([value, point]) => ({
      value,
      label: `${point.name || point.address || 'Điểm cũ'} (chưa có trong danh mục)`,
    }));

    return [
      ...catalogStops.map((stop) => ({
        value: String(stop._id),
        label: `${getStopOptionLabel(stop)} · ${STOP_TYPE_LABEL[stop.type] || 'Điểm dừng'}${
          stop.status === 'inactive' ? ' (Ngừng)' : ''
        }`,
        disabled: stop.status === 'inactive',
      })),
      ...legacyOptions,
    ];
  }, [catalogStops, legacyPointMap]);

  const fromOptions = useMemo(() => {
    const cities = [...new Set(mapped.map((r) => r.from).filter((c) => c && c !== '—'))].sort(
      (a, b) => a.localeCompare(b, 'vi')
    );
    return [
      { value: 'all', label: 'Tất cả điểm xuất phát' },
      ...cities.map((c) => ({ value: c, label: c })),
    ];
  }, [mapped]);

  const filtered = useMemo(
    () =>
      mapped
        .filter(
          (r) =>
            !q ||
            [r.code, r.name, r.from, r.to, r.fromSt, r.toSt]
              .join(' ')
              .toLowerCase()
              .includes(q.toLowerCase())
        )
        .filter((r) => statusF === 'all' || r.status === statusF)
        .filter((r) => fromF === 'all' || r.from === fromF)
        .sort((a, b) => {
          if (sort === 'code') return a.code.localeCompare(b.code);
          if (sort === 'distance') return b.distance - a.distance;
          if (sort === 'trips') return b.trips - a.trips;
          if (sort === 'price') return b.price - a.price;
          return 0;
        }),
    [mapped, q, statusF, fromF, sort]
  );

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [q, statusF, fromF, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Derived stat strip (real data, no fabricated numbers)
  const stats = useMemo(() => {
    const total = mapped.length;
    const active = mapped.filter((r) => r.status === 'active').length;
    const suspended = total - active;
    const busiest = mapped.reduce(
      (best, r) => (r.trips > (best?.trips || 0) ? r : best),
      null
    );
    return { total, active, suspended, busiest };
  }, [mapped]);

  // ---------- CRUD ----------
  const handleCreate = () => {
    setEditingRoute(null);
    setLegacyPointMap({});
    form.resetFields();
    form.setFieldsValue({
      pickupStopIds: [],
      dropoffStopIds: [],
      journeyStops: [],
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRoute(record);
    const nextLegacyPointMap = {};
    const pickupStopIds = (record.pickupPoints || []).map((point, index) => {
      const value = getPointValue(point, `legacy:pickup:${index}`);
      if (!point.stopId) nextLegacyPointMap[value] = point;
      return value;
    });
    const dropoffStopIds = (record.dropoffPoints || []).map((point, index) => {
      const value = getPointValue(point, `legacy:dropoff:${index}`);
      if (!point.stopId) nextLegacyPointMap[value] = point;
      return value;
    });
    const journeyStops = (record.stops || []).map((stop, index) => {
      const value = getPointValue(stop, `legacy:journey:${index}`);
      if (!stop.stopId) nextLegacyPointMap[value] = stop;
      return {
        stopId: value,
        estimatedArrivalMinutes: stop.estimatedArrivalMinutes,
        stopDuration: stop.stopDuration || 15,
      };
    });

    setLegacyPointMap(nextLegacyPointMap);
    form.setFieldsValue({
      routeName: record.routeName,
      routeCode: record.routeCode,
      originProvince: record.origin?.province,
      originCity: record.origin?.city,
      destinationProvince: record.destination?.province,
      destinationCity: record.destination?.city,
      pickupStopIds,
      dropoffStopIds,
      journeyStops,
      distance: record.distance,
      estimatedDuration: record.estimatedDuration,
      basePrice: record.basePrice,
    });
    setModalVisible(true);
  };

  const resolveSelectedPoint = (value) => {
    const catalogStop = stopById.get(String(value));
    if (catalogStop) return snapshotFromCatalogStop(catalogStop);

    const legacyPoint = legacyPointMap[value];
    if (legacyPoint) {
      return {
        stopId: legacyPoint.stopId,
        name: legacyPoint.name,
        address: legacyPoint.address,
        coordinates: legacyPoint.coordinates,
      };
    }

    return null;
  };

  const buildSelectedPoints = (values = []) =>
    values.map((value) => resolveSelectedPoint(value)).filter(Boolean);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.pickupStopIds || values.pickupStopIds.length === 0) {
        message.error('Vui lòng thêm ít nhất 1 điểm đón');
        return;
      }
      if (!values.dropoffStopIds || values.dropoffStopIds.length === 0) {
        message.error('Vui lòng thêm ít nhất 1 điểm trả');
        return;
      }

      const pickupPoints = buildSelectedPoints(values.pickupStopIds);
      const dropoffPoints = buildSelectedPoints(values.dropoffStopIds);
      if (pickupPoints.length !== values.pickupStopIds.length) {
        message.error('Có điểm đón không còn tồn tại trong danh mục');
        return;
      }
      if (dropoffPoints.length !== values.dropoffStopIds.length) {
        message.error('Có điểm trả không còn tồn tại trong danh mục');
        return;
      }

      const stops = (values.journeyStops || []).map((stop, index) => {
        const selected = resolveSelectedPoint(stop.stopId);
        return selected
          ? {
              ...selected,
              order: index + 1,
              estimatedArrivalMinutes: stop.estimatedArrivalMinutes,
              stopDuration: stop.stopDuration,
            }
          : null;
      });

      if (stops.some((stop) => !stop)) {
        message.error('Có điểm dừng giữa hành trình không còn tồn tại trong danh mục');
        return;
      }

      for (let i = 0; i < stops.length; i += 1) {
        const stop = stops[i];
        const previous = stops[i - 1];
        if (stop.estimatedArrivalMinutes > values.estimatedDuration) {
          message.error(`Điểm dừng #${i + 1} có thời gian đến vượt quá thời gian toàn tuyến`);
          return;
        }
        if (previous && stop.estimatedArrivalMinutes <= previous.estimatedArrivalMinutes) {
          message.error('Thời gian đến của các điểm dừng giữa hành trình phải tăng dần');
          return;
        }
      }

      const routeData = {
        routeName: values.routeName,
        routeCode: values.routeCode,
        origin: { province: values.originProvince, city: values.originCity },
        destination: { province: values.destinationProvince, city: values.destinationCity },
        pickupPoints,
        dropoffPoints,
        stops,
        distance: values.distance,
        estimatedDuration: values.estimatedDuration,
        basePrice: values.basePrice,
      };

      if (editingRoute) {
        await routesApi.update(editingRoute._id, routeData);
        message.success('Cập nhật tuyến đường thành công');
      } else {
        await routesApi.create(routeData);
        message.success('Tạo tuyến đường thành công');
      }

      setModalVisible(false);
      loadRoutes();
    } catch (error) {
      if (error?.errorFields) return; // antd form validation
      message.error(typeof error === 'string' ? error : error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa tuyến đường',
      content: `Tuyến ${record.routeCode} sẽ được vô hiệu hóa. Tiếp tục?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await routesApi.delete(record._id);
          message.success('Xóa tuyến đường thành công');
          loadRoutes();
        } catch (error) {
          message.error(typeof error === 'string' ? error : 'Không thể xóa tuyến đường');
        }
      },
    });
  };

  const handleToggleActive = async (record) => {
    try {
      // toggle-active endpoint requires an explicit isActive flag → use update
      await routesApi.update(record._id, { isActive: !record.isActive });
      message.success(
        record.isActive ? 'Đã tạm ngưng tuyến đường' : 'Đã kích hoạt tuyến đường'
      );
      loadRoutes();
    } catch (error) {
      message.error(typeof error === 'string' ? error : 'Không thể cập nhật trạng thái');
    }
  };

  const rowMenu = (r) => ({
    items: [
      { key: 'edit', label: 'Chỉnh sửa tuyến' },
      {
        key: 'toggle',
        label: r.status === 'active' ? 'Tạm ngưng tuyến' : 'Kích hoạt tuyến',
      },
      { type: 'divider' },
      { key: 'delete', label: 'Xóa tuyến', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'edit') handleEdit(r.raw);
      else if (key === 'toggle') handleToggleActive(r.raw);
      else if (key === 'delete') handleDelete(r.raw);
    },
  });

  // Compact pagination window
  const pageNumbers = useMemo(() => {
    const out = [];
    const span = 2;
    const start = Math.max(1, currentPage - span);
    const end = Math.min(totalPages, currentPage + span);
    for (let i = start; i <= end; i += 1) out.push(i);
    return out;
  }, [currentPage, totalPages]);

  return (
    <>
      <PageHeader
        title="Quản lý tuyến đường"
        description="Quản lý danh mục tuyến đường cố định và lịch chuyến định kỳ của nhà xe."
        cta={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn kind="primary" icon="plus" onClick={handleCreate}>
              Thêm tuyến mới
            </Btn>
          </div>
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
          label="Tổng số tuyến"
          value={loading ? '—' : String(stats.total)}
          hint={`${stats.active} tuyến đang khai thác`}
        />
        <StatPill
          label="Tuyến hoạt động"
          value={loading ? '—' : String(stats.active)}
          hint={
            stats.total
              ? `${Math.round((stats.active / stats.total) * 100)}% số tuyến đang chạy`
              : 'Chưa có tuyến nào'
          }
          tone="success"
        />
        <StatPill
          label="Tuyến tạm ngưng"
          value={loading ? '—' : String(stats.suspended)}
          hint="Đang tạm ngưng khai thác"
          tone="warn"
        />
        <StatPill
          label="Tuyến nhiều chuyến nhất"
          value={
            stats.busiest && stats.busiest.trips > 0
              ? `${stats.busiest.from} ↔ ${stats.busiest.to}`
              : '—'
          }
          hint={
            stats.busiest && stats.busiest.trips > 0
              ? `${stats.busiest.trips} chuyến/ngày`
              : 'Chưa có dữ liệu chuyến'
          }
        />
      </div>

      {/* Filters bar */}
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
          placeholder="Tìm mã tuyến, điểm đi, điểm đến…"
        />
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <Select value={fromF} onChange={setFromF} options={fromOptions} />
          <Select
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'suspended', label: 'Tạm ngưng' },
            ]}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'code', label: 'Sắp xếp: Mã tuyến' },
              { value: 'distance', label: 'Sắp xếp: Quãng đường ↓' },
              { value: 'trips', label: 'Sắp xếp: Chuyến/ngày ↓' },
              { value: 'price', label: 'Sắp xếp: Giá vé ↓' },
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
                'Mã tuyến',
                'Điểm đi → Điểm đến',
                'Khoảng cách',
                'Thời gian',
                'Điểm dừng',
                'Chuyến/ngày',
                'Giá vé',
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
                  colSpan={9}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    font: '400 14px var(--font-display)',
                    color: 'var(--vxn-fg-5)',
                  }}
                >
                  Đang tải danh sách tuyến đường…
                </td>
              </tr>
            )}

            {!loading && pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    font: '400 14px var(--font-display)',
                    color: 'var(--vxn-fg-5)',
                  }}
                >
                  Không có tuyến đường nào khớp bộ lọc.
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((r, i) => (
                <tr
                  key={r._id || r.code}
                  style={{
                    borderBottom:
                      i < pageRows.length - 1 ? '1px solid var(--vxn-border)' : 0,
                  }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        color: 'var(--vxn-teal-800)',
                        font: '600 14px var(--font-display)',
                      }}
                    >
                      {r.code}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <RouteVisual
                      from={r.from}
                      to={r.to}
                      fromSt={r.fromSt}
                      toSt={r.toSt}
                    />
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      font: '500 13.5px var(--font-display)',
                      color: 'var(--vxn-ink)',
                    }}
                  >
                    {r.distance} km
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      font: '400 13.5px var(--font-display)',
                      color: 'var(--vxn-fg-2)',
                    }}
                  >
                    {Math.floor(r.durMin / 60)}h
                    {r.durMin % 60 ? `${r.durMin % 60}p` : ''}
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      font: '400 13.5px var(--font-display)',
                      color: 'var(--vxn-fg-2)',
                    }}
                  >
                    {r.stops} điểm
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        font: '600 13.5px var(--font-display)',
                        color: r.trips >= 10 ? '#15803D' : 'var(--vxn-fg-2)',
                      }}
                    >
                      {r.trips}
                      {r.trips >= 10 && (
                        <VxnIcon name="flame" size={14} color="#15803D" />
                      )}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      font: '600 14px var(--font-display)',
                      color: 'var(--vxn-ink)',
                    }}
                  >
                    {r.price > 0 ? `${r.price.toLocaleString('vi-VN')} ₫` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {r.status === 'active' ? (
                      <Chip tone="success" dot>
                        Hoạt động
                      </Chip>
                    ) : (
                      <Chip tone="danger" dot>
                        Tạm ngưng
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
                        title="Chỉnh sửa"
                        onClick={() => handleEdit(r.raw)}
                      />
                      <Dropdown
                        trigger={['click']}
                        menu={rowMenu(r)}
                        placement="bottomRight"
                      >
                        <span>
                          <RowIconBtn icon="ellipsis-vertical" title="Thao tác" />
                        </span>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              ))}
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
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} tuyến
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
        title={editingRoute ? 'Chỉnh sửa tuyến đường' : 'Tạo tuyến đường mới'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        okText={editingRoute ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="routeName" label="Tên Tuyến" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Hà Nội - Đà Nẵng" />
          </Form.Item>
          <Form.Item name="routeCode" label="Mã Tuyến" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: HN-DN-001" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Điểm Đi</h3>
              <Form.Item
                name="originProvince"
                label="Tỉnh/Thành Phố"
                rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
              >
                <Input placeholder="Ví dụ: TP. Hồ Chí Minh" />
              </Form.Item>
              <Form.Item
                name="originCity"
                label="Quận/Xã"
                rules={[{ required: true, message: 'Vui lòng nhập quận/xã' }]}
              >
                <Input placeholder="Ví dụ: Quận 1" />
              </Form.Item>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Điểm Đến</h3>
              <Form.Item
                name="destinationProvince"
                label="Tỉnh/Thành Phố"
                rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
              >
                <Input placeholder="Ví dụ: Đà Lạt" />
              </Form.Item>
              <Form.Item
                name="destinationCity"
                label="Quận/Xã"
                rules={[{ required: true, message: 'Vui lòng nhập quận/xã' }]}
              >
                <Input placeholder="Ví dụ: Phường 3" />
              </Form.Item>
            </div>
          </div>

          <Divider orientation="left">Điểm lên / xuống xe</Divider>
          <div
            style={{
              padding: 12,
              border: '1px solid #DFE2EC',
              borderRadius: 8,
              background: '#F9FAFF',
              marginBottom: 16,
              font: '400 13px var(--font-display)',
              color: 'var(--vxn-fg-3)',
            }}
          >
            Điểm lên xe, xuống xe và điểm dừng giữa hành trình được chọn từ danh mục điểm
            dừng của nhà xe. Tạo điểm mới tại màn Quản lý điểm dừng trước khi cấu hình tuyến.
          </div>

          <Form.Item
            name="pickupStopIds"
            label="Điểm lên xe"
            rules={[
              {
                type: 'array',
                required: true,
                min: 1,
                message: 'Vui lòng chọn ít nhất 1 điểm lên xe',
              },
            ]}
          >
            <AntSelect
              mode="multiple"
              showSearch
              optionFilterProp="label"
              loading={stopsLoading}
              options={stopOptions}
              placeholder="Chọn một hoặc nhiều điểm lên xe"
            />
          </Form.Item>

          <Form.Item
            name="dropoffStopIds"
            label="Điểm xuống xe"
            rules={[
              {
                type: 'array',
                required: true,
                min: 1,
                message: 'Vui lòng chọn ít nhất 1 điểm xuống xe',
              },
            ]}
          >
            <AntSelect
              mode="multiple"
              showSearch
              optionFilterProp="label"
              loading={stopsLoading}
              options={stopOptions}
              placeholder="Chọn một hoặc nhiều điểm xuống xe"
            />
          </Form.Item>

          <Divider orientation="left">Điểm dừng giữa hành trình</Divider>
          <Form.List name="journeyStops">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div
                    key={key}
                    className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-blue-700">
                        Điểm dừng chân #{index + 1}
                      </h4>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        Xóa
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Form.Item
                        {...restField}
                        name={[name, 'stopId']}
                        label="Tên điểm dừng"
                        rules={[{ required: true, message: 'Vui lòng chọn điểm dừng' }]}
                      >
                        <AntSelect
                          showSearch
                          optionFilterProp="label"
                          loading={stopsLoading}
                          options={stopOptions}
                          placeholder="Chọn điểm dừng từ danh mục"
                        />
                      </Form.Item>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Form.Item
                        {...restField}
                        name={[name, 'estimatedArrivalMinutes']}
                        label="Thời gian đến (phút từ điểm xuất phát)"
                        rules={[
                          { required: true, message: 'Vui lòng nhập thời gian đến' },
                        ]}
                      >
                        <InputNumber
                          min={1}
                          className="w-full"
                          placeholder="Ví dụ: 90"
                          addonAfter="phút"
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'stopDuration']}
                        label="Thời gian dừng"
                        initialValue={15}
                        rules={[
                          { required: true, message: 'Vui lòng nhập thời gian dừng' },
                        ]}
                      >
                        <InputNumber
                          min={5}
                          max={120}
                          className="w-full"
                          placeholder="15"
                          addonAfter="phút"
                        />
                      </Form.Item>
                    </div>
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Thêm điểm dừng chân
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="distance"
              label="Khoảng Cách (km)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item
              name="estimatedDuration"
              label="Thời Gian Ước Tính (phút)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>

          <Divider orientation="left">Giá Vé</Divider>
          <Form.Item
            name="basePrice"
            label="Giá vé mặc định của tuyến"
            extra="Giá này sẽ được áp dụng tự động cho mọi chuyến tạo trên tuyến."
            rules={[
              { required: true, message: 'Vui lòng nhập giá vé của tuyến' },
              {
                type: 'number',
                min: 1000,
                message: 'Giá vé phải từ 1.000 ₫ trở lên',
              },
            ]}
          >
            <InputNumber
              min={1000}
              step={1000}
              className="w-full"
              placeholder="Ví dụ: 250000"
              addonAfter="₫"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(v) => `${v}`.replace(/\D/g, '')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

function RouteVisual({ from, to, fromSt, toSt }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--vxn-teal-700)',
          }}
        />
        <span
          style={{
            width: 2,
            height: 22,
            background:
              'repeating-linear-gradient(to bottom, var(--vxn-border-strong) 0 3px, transparent 3px 6px)',
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--vxn-saffron-600)',
          }}
        />
      </div>
      <div>
        <div
          style={{
            font: '500 13.5px var(--font-display)',
            color: 'var(--vxn-ink)',
          }}
        >
          {from}{' '}
          {fromSt && (
            <span
              style={{
                color: 'var(--vxn-fg-5)',
                font: '400 11px var(--font-display)',
              }}
            >
              · {fromSt}
            </span>
          )}
        </div>
        <div
          style={{
            font: '500 13.5px var(--font-display)',
            color: 'var(--vxn-ink)',
            marginTop: 8,
          }}
        >
          {to}{' '}
          {toSt && (
            <span
              style={{
                color: 'var(--vxn-fg-5)',
                font: '400 11px var(--font-display)',
              }}
            >
              · {toSt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoutesPage;
