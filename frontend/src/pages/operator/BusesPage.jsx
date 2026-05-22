import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, Select as AntSelect, message, Dropdown } from 'antd';
import { busesApi, tripsApi } from '../../services/operatorApi';
import SeatLayoutBuilder from '../../components/operator/SeatLayoutBuilder';
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
  Timetable,
} from '../../components/operator/vxn';

const { Option } = AntSelect;
const PAGE_SIZE = 10;

const BUS_TYPE_LABEL = {
  limousine: 'Limousine',
  sleeper: 'Giường nằm',
  seater: 'Ghế ngồi',
  double_decker: 'Giường nằm 2 tầng',
};

const dec = (d) => {
  const dt = new Date(d);
  return dt.getHours() + dt.getMinutes() / 60;
};
const hhmm = (d) => {
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const cityOf = (loc) => loc?.city || loc?.station || loc?.province || '';

function vehicleStatusChip(s) {
  switch (s) {
    case 'in_trip':
      return (
        <Chip tone="info" dot>
          Đang chạy
        </Chip>
      );
    case 'available':
      return (
        <Chip tone="success" dot>
          Sẵn sàng
        </Chip>
      );
    case 'maintenance':
      return (
        <Chip tone="warn" dot>
          Bảo dưỡng
        </Chip>
      );
    case 'suspended':
      return (
        <Chip tone="danger" dot>
          Tạm ngưng
        </Chip>
      );
    default:
      return <Chip tone="neutral">{s}</Chip>;
  }
}

const tdStyle = {
  padding: '14px 16px',
  font: '400 13.5px var(--font-display)',
  color: 'var(--vxn-fg-2)',
  verticalAlign: 'middle',
};

const HOUR_START = 5;
const HOUR_END = 24;

const BusesPage = () => {
  const [buses, setBuses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [seatLayout, setSeatLayout] = useState(null);
  const [form] = Form.useForm();

  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [typeF, setTypeF] = useState('all');
  const [sort, setSort] = useState('plate');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [busRes, tripRes] = await Promise.allSettled([
      busesApi.getMyBuses({ limit: 200 }),
      tripsApi.getMyTrips({
        fromDate: start.toISOString(),
        toDate: end.toISOString(),
        limit: 200,
        sortBy: 'departureTime',
        sortOrder: 'asc',
      }),
    ]);

    if (busRes.status === 'fulfilled') {
      setBuses(busRes.value?.data?.buses || []);
    } else {
      message.error('Không thể tải danh sách xe');
    }
    if (tripRes.status === 'fulfilled') {
      setTrips(tripRes.value?.data?.trips || []);
    }
    setLoading(false);
  };

  // busId -> today's trips (sorted)
  const tripsByBus = useMemo(() => {
    const m = new Map();
    trips.forEach((t) => {
      const bid = t.busId?._id || t.busId;
      if (!bid) return;
      const key = String(bid);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(t);
    });
    m.forEach((list) =>
      list.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
    );
    return m;
  }, [trips]);

  const now = Date.now();

  const enriched = useMemo(
    () =>
      buses.map((b) => {
        const todays = tripsByBus.get(String(b._id)) || [];
        const ongoing = todays.find(
          (t) =>
            t.status === 'ongoing' ||
            (new Date(t.departureTime).getTime() <= now &&
              new Date(t.arrivalTime).getTime() >= now &&
              t.status !== 'cancelled')
        );
        const upcoming = todays.find(
          (t) => new Date(t.departureTime).getTime() > now && t.status !== 'cancelled'
        );
        const focusTrip = ongoing || upcoming || todays[todays.length - 1];

        let status;
        if (b.status === 'maintenance') status = 'maintenance';
        else if (b.status === 'retired') status = 'suspended';
        else if (ongoing) status = 'in_trip';
        else status = 'available';

        const assignment = focusTrip
          ? `${cityOf(focusTrip.routeId?.origin)} → ${cityOf(
              focusTrip.routeId?.destination
            )}`
          : status === 'maintenance'
          ? 'Đang bảo dưỡng'
          : status === 'suspended'
          ? 'Ngừng khai thác'
          : 'Sẵn sàng phân công';

        const assignmentTime = focusTrip ? hhmm(focusTrip.departureTime) : '';
        const driver = focusTrip?.driverId?.fullName || '—';

        return {
          raw: b,
          id: b._id,
          plate: b.busNumber,
          type: BUS_TYPE_LABEL[b.busType] || b.busType,
          rawType: b.busType,
          seats: b.seatLayout?.totalSeats || 0,
          status,
          assignment,
          assignmentTime,
          driver,
          todays,
        };
      }),
    [buses, tripsByBus, now]
  );

  const filtered = useMemo(
    () =>
      enriched
        .filter(
          (v) =>
            !q ||
            [v.plate, v.driver, v.assignment, v.type]
              .join(' ')
              .toLowerCase()
              .includes(q.toLowerCase())
        )
        .filter((v) => statusF === 'all' || v.status === statusF)
        .filter((v) => typeF === 'all' || v.rawType === typeF)
        .sort((a, b) => {
          if (sort === 'plate') return a.plate.localeCompare(b.plate);
          if (sort === 'status') return a.status.localeCompare(b.status);
          if (sort === 'seats') return b.seats - a.seats;
          if (sort === 'type') return a.type.localeCompare(b.type);
          return 0;
        }),
    [enriched, q, statusF, typeF, sort]
  );

  useEffect(() => {
    setPage(1);
  }, [q, statusF, typeF, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const out = [];
    const s = Math.max(1, currentPage - 2);
    const e = Math.min(totalPages, currentPage + 2);
    for (let i = s; i <= e; i += 1) out.push(i);
    return out;
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const running = enriched.filter((v) => v.status === 'in_trip').length;
    const ready = enriched.filter((v) => v.status === 'available').length;
    const maint = enriched.filter((v) => v.status === 'maintenance').length;
    const suspended = enriched.filter((v) => v.status === 'suspended').length;
    return { total, running, ready, maint, suspended };
  }, [enriched]);

  // Gantt rows from real trips today
  const timetableRows = useMemo(
    () =>
      enriched.map((v) => {
        let blocks = v.todays
          .filter((t) => t.status !== 'cancelled')
          .map((t) => {
            const startH = clamp(dec(t.departureTime), HOUR_START, HOUR_END);
            const arr = new Date(t.arrivalTime);
            const dep = new Date(t.departureTime);
            const crossesDay = arr.getDate() !== dep.getDate();
            const endH = crossesDay
              ? HOUR_END
              : clamp(dec(t.arrivalTime), HOUR_START, HOUR_END);
            const booked = Array.isArray(t.bookedSeats) ? t.bookedSeats.length : 0;
            const tone =
              t.status === 'ongoing'
                ? 'sky'
                : t.status === 'completed'
                ? 'slate'
                : 'teal';
            return {
              start: startH,
              end: Math.max(endH, startH + 0.5),
              label: `${cityOf(t.routeId?.origin)} → ${cityOf(t.routeId?.destination)}`,
              sub: `${t.routeId?.routeCode || ''} · ${booked}/${t.totalSeats || 0}`,
              tone,
            };
          });

        if (v.status === 'maintenance') {
          blocks = [
            {
              start: HOUR_START,
              end: HOUR_END,
              label: 'Bảo dưỡng',
              sub: 'Không khai thác hôm nay',
              tone: 'amber',
            },
          ];
        }

        return {
          id: v.id,
          label: v.plate,
          sub: `${v.type} · ${v.seats} chỗ`,
          avatar: (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--vxn-bg-mist)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <VxnIcon name="bus" size={18} color="var(--vxn-fg-3)" />
            </div>
          ),
          blocks,
        };
      }),
    [enriched]
  );

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  // ---------- CRUD (preserved) ----------
  const handleCreate = () => {
    setEditingBus(null);
    setSeatLayout(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingBus(record);
    setSeatLayout(record.seatLayout);
    form.setFieldsValue({
      busNumber: record.busNumber,
      busType: record.busType,
      amenities: record.amenities,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!seatLayout) {
        message.error('Vui lòng tạo sơ đồ ghế trước khi lưu');
        return;
      }
      if (
        !seatLayout.layout ||
        !Array.isArray(seatLayout.layout) ||
        seatLayout.layout.length === 0
      ) {
        message.error('Sơ đồ ghế không hợp lệ');
        return;
      }
      if (!seatLayout.totalSeats || seatLayout.totalSeats < 1) {
        message.error('Sơ đồ ghế phải có ít nhất 1 ghế');
        return;
      }

      const amenities = values.amenities ? values.amenities.map((a) => a.toLowerCase()) : [];
      const busData = { ...values, amenities, seatLayout };

      if (editingBus) {
        await busesApi.update(editingBus._id, busData);
        message.success('Cập nhật xe thành công');
      } else {
        await busesApi.create(busData);
        message.success('Tạo xe thành công');
      }

      setModalVisible(false);
      form.resetFields();
      setSeatLayout(null);
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      const errorMessage =
        typeof error === 'string'
          ? error
          : error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
      message.error(errorMessage);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa xe',
      content: `Xe ${record.busNumber} sẽ bị xóa khỏi đội xe. Tiếp tục?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await busesApi.delete(record._id);
          message.success('Xóa xe thành công');
          loadData();
        } catch (error) {
          message.error(typeof error === 'string' ? error : 'Không thể xóa xe');
        }
      },
    });
  };

  const rowMenu = (v) => ({
    items: [
      { key: 'edit', label: 'Chỉnh sửa xe' },
      { type: 'divider' },
      { key: 'delete', label: 'Xóa xe', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'edit') handleEdit(v.raw);
      else if (key === 'delete') handleDelete(v.raw);
    },
  });

  return (
    <>
      <PageHeader
        title="Quản lý đội xe"
        description="Theo dõi lịch trình, tình trạng và phân công đội xe theo thời gian thực."
        cta={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn kind="primary" icon="plus" onClick={handleCreate}>
              Thêm xe mới
            </Btn>
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatPill
          label="Tổng số xe"
          value={loading ? '—' : String(stats.total)}
          hint={`${BUS_TYPE_LABEL[typeF] || 'Toàn đội xe'}`}
        />
        <StatPill
          label="Đang chạy"
          value={loading ? '—' : String(stats.running)}
          hint={
            stats.total
              ? `${Math.round((stats.running / stats.total) * 100)}% công suất`
              : 'Chưa có chuyến'
          }
          tone="teal"
        />
        <StatPill
          label="Sẵn sàng"
          value={loading ? '—' : String(stats.ready)}
          hint="Có thể phân công ngay"
          tone="success"
        />
        <StatPill
          label="Bảo dưỡng"
          value={loading ? '—' : String(stats.maint)}
          hint="Không khai thác"
          tone="warn"
        />
        <StatPill
          label="Tạm ngưng"
          value={loading ? '—' : String(stats.suspended)}
          hint="Ngừng hoạt động"
          tone="danger"
        />
      </div>

      <Timetable
        title={`Lịch hoạt động đội xe — ${todayLabel}`}
        subtitle="Lát cắt 24 giờ theo lịch chuyến thực tế. Vạch xanh là thời điểm hiện tại."
        date={new Date().toLocaleDateString('vi-VN')}
        rowLabelHeader="Phương tiện"
        rowLabelWidth={236}
        hourStart={HOUR_START}
        hourEnd={HOUR_END}
        rows={timetableRows}
        highlightHour={clamp(
          new Date().getHours() + new Date().getMinutes() / 60,
          HOUR_START,
          HOUR_END
        )}
        legend={[
          { tone: 'teal', label: 'Đã lên lịch' },
          { tone: 'sky', label: 'Đang chạy' },
          { tone: 'slate', label: 'Đã hoàn thành' },
          { tone: 'amber', label: 'Bảo dưỡng' },
        ]}
      />

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--vxn-border)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 24,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: 0,
        }}
      >
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Tìm biển số, tài xế, tuyến…"
        />
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <Select
            value={typeF}
            onChange={setTypeF}
            options={[
              { value: 'all', label: 'Tất cả loại xe' },
              { value: 'limousine', label: 'Limousine' },
              { value: 'sleeper', label: 'Giường nằm' },
              { value: 'seater', label: 'Ghế ngồi' },
              { value: 'double_decker', label: 'Giường nằm 2 tầng' },
            ]}
          />
          <Select
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'in_trip', label: 'Đang chạy' },
              { value: 'available', label: 'Sẵn sàng' },
              { value: 'maintenance', label: 'Bảo dưỡng' },
              { value: 'suspended', label: 'Tạm ngưng' },
            ]}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'plate', label: 'Sắp xếp: Biển số' },
              { value: 'status', label: 'Sắp xếp: Trạng thái' },
              { value: 'seats', label: 'Sắp xếp: Số ghế ↓' },
              { value: 'type', label: 'Sắp xếp: Loại xe' },
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
                'Biển số',
                'Loại xe',
                'Số ghế',
                'Phân công hôm nay',
                'Tài xế',
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
                  style={{ padding: 40, textAlign: 'center', color: 'var(--vxn-fg-5)' }}
                >
                  Đang tải đội xe…
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((v, i) => (
                <tr
                  key={v.id}
                  style={{
                    borderBottom:
                      i < pageRows.length - 1 ? '1px solid var(--vxn-border)' : 0,
                  }}
                >
                  <td style={tdStyle}>
                    <span
                      style={{
                        color: 'var(--vxn-teal-800)',
                        font: '600 14px var(--font-display)',
                      }}
                    >
                      {v.plate}
                    </span>
                  </td>
                  <td style={tdStyle}>{v.type}</td>
                  <td style={tdStyle}>{v.seats} chỗ</td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        font: '500 13.5px var(--font-display)',
                        color: 'var(--vxn-ink)',
                      }}
                    >
                      {v.assignment}
                    </div>
                    {v.assignmentTime && (
                      <div
                        style={{
                          font: '400 12px var(--font-display)',
                          color: 'var(--vxn-fg-5)',
                          marginTop: 2,
                        }}
                      >
                        Khởi hành {v.assignmentTime}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>{v.driver}</td>
                  <td style={tdStyle}>{vehicleStatusChip(v.status)}</td>
                  <td style={tdStyle}>
                    <div
                      style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
                    >
                      <RowIconBtn
                        icon="pencil"
                        title="Chỉnh sửa"
                        onClick={() => handleEdit(v.raw)}
                      />
                      <Dropdown
                        trigger={['click']}
                        menu={rowMenu(v)}
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

            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: 40, textAlign: 'center', color: 'var(--vxn-fg-5)' }}
                >
                  Không tìm thấy xe phù hợp.
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
            style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}
          >
            Hiển thị {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} xe
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
        title={editingBus ? 'Chỉnh sửa xe' : 'Thêm xe mới'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText={editingBus ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="busNumber" label="Biển Số Xe" rules={[{ required: true }]}>
            <Input placeholder="29A-12345" />
          </Form.Item>

          <Form.Item name="busType" label="Loại Xe" rules={[{ required: true }]}>
            <AntSelect placeholder="Chọn loại xe">
              <Option value="limousine">Limousine</Option>
              <Option value="sleeper">Giường Nằm</Option>
              <Option value="seater">Ghế Ngồi</Option>
              <Option value="double_decker">Hai Tầng</Option>
            </AntSelect>
          </Form.Item>

          <Form.Item name="amenities" label="Tiện Nghi">
            <AntSelect mode="tags" placeholder="wifi, ac, toilet, tv, water">
              <Option value="wifi">WiFi</Option>
              <Option value="ac">Điều Hòa</Option>
              <Option value="toilet">Toilet</Option>
              <Option value="tv">TV</Option>
              <Option value="water">Nước Uống</Option>
              <Option value="blanket">Chăn</Option>
              <Option value="pillow">Gối</Option>
              <Option value="snack">Đồ Ăn Nhẹ</Option>
            </AntSelect>
          </Form.Item>

          <Form.Item name="status" label="Trạng Thái" initialValue="active">
            <AntSelect>
              <Option value="active">Hoạt Động</Option>
              <Option value="maintenance">Bảo Trì</Option>
              <Option value="retired">Ngừng Hoạt Động</Option>
            </AntSelect>
          </Form.Item>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Sơ Đồ Ghế:</label>
            {seatLayout ? (
              <div className="p-4 bg-gray-50 rounded">
                <p>Đã tạo sơ đồ: {seatLayout.totalSeats} ghế</p>
                <button
                  type="button"
                  className="mt-2 text-sm text-blue-600 underline"
                  onClick={() => setLayoutModalVisible(true)}
                >
                  Chỉnh Sửa
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="px-3 py-1.5 border rounded text-sm"
                onClick={() => setLayoutModalVisible(true)}
              >
                Tạo Sơ Đồ Ghế
              </button>
            )}
          </div>
        </Form>
      </Modal>

      <Modal
        title="Tạo Sơ Đồ Ghế"
        open={layoutModalVisible}
        onCancel={() => setLayoutModalVisible(false)}
        width={900}
        footer={null}
      >
        <SeatLayoutBuilder
          busType={form.getFieldValue('busType')}
          initialLayout={seatLayout}
          onSave={(layout) => {
            if (layout === null) {
              setLayoutModalVisible(false);
              return;
            }
            setSeatLayout(layout);
            setLayoutModalVisible(false);
            message.success('Đã lưu sơ đồ ghế');
          }}
        />
      </Modal>
    </>
  );
};

export default BusesPage;
