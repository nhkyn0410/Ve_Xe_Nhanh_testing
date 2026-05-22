import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Select as AntSelect,
  DatePicker,
  TimePicker,
  InputNumber,
  message,
  Dropdown,
} from 'antd';
import dayjs from 'dayjs';
import operatorApi from '../../services/operatorApi';
import { formatBusType } from '../../utils/busType';
import {
  PageHeader,
  Btn,
  Select,
  SearchInput,
  StatPill,
  Chip,
  RowIconBtn,
  PageBtn,
} from '../../components/operator/vxn';

const { Option } = AntSelect;
const PAGE_SIZE = 10;

const hhmm = (d) => {
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};
const cityOf = (loc) => loc?.city || loc?.station || loc?.province || '';
const stationOf = (loc) => loc?.station || loc?.address || loc?.city || '';

function durStr(dep, arr) {
  let mins = Math.round((new Date(arr).getTime() - new Date(dep).getTime()) / 60000);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m ? `${m}p` : ''}`;
}

function tripStatusChip(s) {
  switch (s) {
    case 'completed':
      return (
        <Chip tone="success" dot>
          Hoàn thành
        </Chip>
      );
    case 'ongoing':
      return (
        <Chip tone="info" dot>
          Đang chạy
        </Chip>
      );
    case 'scheduled':
      return (
        <Chip tone="neutral" dot>
          Sắp khởi hành
        </Chip>
      );
    case 'cancelled':
      return (
        <Chip tone="danger" dot>
          Đã hủy
        </Chip>
      );
    default:
      return <Chip tone="neutral">{s}</Chip>;
  }
}

function occColor(occ, total) {
  const r = total ? occ / total : 0;
  if (r === 0) return 'var(--vxn-fg-disabled, var(--vxn-fg-5))';
  if (r >= 0.95) return '#15803D';
  if (r >= 0.7) return 'var(--vxn-teal-700)';
  if (r >= 0.4) return 'var(--vxn-warning-fg)';
  return 'var(--vxn-fg-5)';
}

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [managers, setManagers] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [form] = Form.useForm();

  const [day, setDay] = useState(dayjs());
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [routeF, setRouteF] = useState('all');
  const [sort, setSort] = useState('dep');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadTrips();
  }, [day]);

  useEffect(() => {
    loadResources();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    const start = day.startOf('day').toISOString();
    const end = day.endOf('day').toISOString();
    try {
      const res = await operatorApi.trips.getMyTrips({
        fromDate: start,
        toDate: end,
        limit: 200,
        sortBy: 'departureTime',
        sortOrder: 'asc',
      });
      setTrips(res?.data?.trips || []);
    } catch (error) {
      message.error(
        typeof error === 'string' ? error : 'Không thể tải danh sách chuyến xe'
      );
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    const [routesRes, busesRes, driversRes, managersRes] = await Promise.allSettled([
      operatorApi.routes.getMyRoutes({ limit: 200 }),
      operatorApi.buses.getMyBuses({ limit: 200 }),
      operatorApi.employees.getAvailableForTrips('driver'),
      operatorApi.employees.getAvailableForTrips('trip_manager'),
    ]);
    if (routesRes.status === 'fulfilled')
      setRoutes(routesRes.value?.data?.routes || []);
    if (busesRes.status === 'fulfilled')
      setBuses(busesRes.value?.data?.buses || []);
    if (driversRes.status === 'fulfilled')
      setDrivers(driversRes.value?.data?.employees || []);
    if (managersRes.status === 'fulfilled')
      setManagers(managersRes.value?.data?.employees || []);
  };

  const enriched = useMemo(
    () =>
      trips.map((t) => {
        const total = t.totalSeats || t.busId?.seatLayout?.totalSeats || 0;
        const occ = Array.isArray(t.bookedSeats)
          ? t.bookedSeats.length
          : Math.max(0, total - (t.availableSeats || 0));
        const price = t.finalPrice || t.basePrice || 0;
        return {
          raw: t,
          id: t._id,
          code: `#${String(t._id).slice(-6).toUpperCase()}`,
          routeLine: `${cityOf(t.routeId?.origin)} → ${cityOf(t.routeId?.destination)}`,
          routeSub:
            t.routeId?.routeName ||
            `${stationOf(t.routeId?.origin)} → ${stationOf(t.routeId?.destination)}`,
          originCity: cityOf(t.routeId?.origin),
          dep: hhmm(t.departureTime),
          arr: hhmm(t.arrivalTime),
          dur: durStr(t.departureTime, t.arrivalTime),
          plate: t.busId?.busNumber || '—',
          driver: t.driverId?.fullName || '—',
          occ,
          total,
          price,
          revenue: price * occ,
          status: t.status,
        };
      }),
    [trips]
  );

  const routeOptions = useMemo(() => {
    const set = new Set(enriched.map((t) => t.originCity).filter(Boolean));
    return [
      { value: 'all', label: 'Tất cả tuyến' },
      ...Array.from(set)
        .sort()
        .map((c) => ({ value: c, label: `Xuất phát ${c}` })),
    ];
  }, [enriched]);

  const filtered = useMemo(
    () =>
      enriched
        .filter(
          (t) =>
            !q ||
            [t.code, t.routeLine, t.routeSub, t.plate, t.driver]
              .join(' ')
              .toLowerCase()
              .includes(q.toLowerCase())
        )
        .filter((t) => statusF === 'all' || t.status === statusF)
        .filter((t) => routeF === 'all' || t.originCity === routeF)
        .sort((a, b) => {
          if (sort === 'dep') return a.dep.localeCompare(b.dep);
          if (sort === 'code') return a.code.localeCompare(b.code);
          if (sort === 'status') return a.status.localeCompare(b.status);
          if (sort === 'occupancy')
            return b.occ / (b.total || 1) - a.occ / (a.total || 1);
          if (sort === 'revenue') return b.revenue - a.revenue;
          return 0;
        }),
    [enriched, q, statusF, routeF, sort]
  );

  useEffect(() => {
    setPage(1);
  }, [q, statusF, routeF, sort, day]);

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
    const ongoing = enriched.filter((t) => t.status === 'ongoing').length;
    const completed = enriched.filter((t) => t.status === 'completed').length;
    const scheduled = enriched.filter((t) => t.status === 'scheduled').length;
    const cancelled = enriched.filter((t) => t.status === 'cancelled').length;
    const revenue = enriched
      .filter((t) => t.status !== 'cancelled')
      .reduce((sum, t) => sum + t.revenue, 0);
    return { total, ongoing, completed, scheduled, cancelled, revenue };
  }, [enriched]);

  // ---------- CRUD ----------
  const handleCreate = () => {
    setEditingTrip(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (t) => {
    setEditingTrip(t);
    form.setFieldsValue({
      routeId: t.routeId?._id || t.routeId,
      busId: t.busId?._id || t.busId,
      driverId: t.driverId?._id || t.driverId,
      tripManagerId: t.tripManagerId?._id || t.tripManagerId,
      departureDate: t.departureTime ? dayjs(t.departureTime) : null,
      departureTime: t.departureTime ? dayjs(t.departureTime) : null,
      arrivalDate: t.arrivalTime ? dayjs(t.arrivalTime) : null,
      arrivalTime: t.arrivalTime ? dayjs(t.arrivalTime) : null,
      basePrice: t.basePrice,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const departureAt = values.departureDate
        .hour(values.departureTime.hour())
        .minute(values.departureTime.minute())
        .second(0)
        .millisecond(0);
      const arrivalAt = values.arrivalDate
        .hour(values.arrivalTime.hour())
        .minute(values.arrivalTime.minute())
        .second(0)
        .millisecond(0);

      // Ngày & giờ đến phải sau ngày & giờ khởi hành
      if (!arrivalAt.isAfter(departureAt)) {
        message.error('Ngày & giờ đến phải sau ngày & giờ khởi hành');
        return;
      }

      const tripData = {
        routeId: values.routeId,
        busId: values.busId,
        driverId: values.driverId,
        tripManagerId: values.tripManagerId,
        departureTime: departureAt.toISOString(),
        arrivalTime: arrivalAt.toISOString(),
        basePrice: values.basePrice,
      };

      if (editingTrip) {
        await operatorApi.trips.update(editingTrip._id, tripData);
        message.success('Cập nhật chuyến xe thành công');
      } else {
        await operatorApi.trips.create(tripData);
        message.success('Tạo chuyến xe thành công');
      }
      setModalVisible(false);
      form.resetFields();
      loadTrips();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(
        typeof error === 'string'
          ? error
          : error?.message || 'Lưu chuyến xe thất bại'
      );
    }
  };

  // Tự động: chọn tuyến → điền giá vé gợi ý; chọn tuyến + ngày/giờ đi →
  // tính giờ đến theo thời lượng ước tính của tuyến. Tất cả vẫn sửa lại được.
  const handleValuesChange = (changed, all) => {
    const route = routes.find((x) => x._id === all.routeId);

    if ('routeId' in changed && route && Number(route.basePrice) > 0) {
      form.setFieldsValue({ basePrice: Number(route.basePrice) });
    }

    if (
      'routeId' in changed ||
      'departureDate' in changed ||
      'departureTime' in changed
    ) {
      const dur =
        route && Number(route.estimatedDuration) > 0
          ? Number(route.estimatedDuration)
          : null;
      if (dur && all.departureDate && all.departureTime) {
        const dep = all.departureDate
          .hour(all.departureTime.hour())
          .minute(all.departureTime.minute())
          .second(0)
          .millisecond(0);
        const arr = dep.add(dur, 'minute');
        form.setFieldsValue({ arrivalDate: arr, arrivalTime: arr });
      }
    }
  };

  const handleCancel = (t) => {
    Modal.confirm({
      title: 'Hủy chuyến xe',
      content: `Chuyến ${cityOf(t.routeId?.origin)} → ${cityOf(
        t.routeId?.destination
      )} sẽ được đánh dấu đã hủy. Tiếp tục?`,
      okText: 'Hủy chuyến',
      okType: 'danger',
      cancelText: 'Đóng',
      onOk: async () => {
        try {
          await operatorApi.trips.cancel(t._id, 'Hủy bởi nhà xe điều phối');
          message.success('Đã hủy chuyến xe');
          loadTrips();
        } catch (error) {
          message.error(
            typeof error === 'string' ? error : 'Hủy chuyến xe thất bại'
          );
        }
      },
    });
  };

  const handleDelete = (t) => {
    Modal.confirm({
      title: 'Xác nhận xóa chuyến xe',
      content: 'Chuyến xe sẽ bị xóa vĩnh viễn. Tiếp tục?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await operatorApi.trips.delete(t._id);
          message.success('Xóa chuyến xe thành công');
          loadTrips();
        } catch (error) {
          message.error(
            typeof error === 'string' ? error : 'Xóa chuyến xe thất bại'
          );
        }
      },
    });
  };

  const rowMenu = (t) => ({
    items: [
      { key: 'edit', label: 'Chỉnh sửa chuyến' },
      t.status !== 'cancelled' && t.status !== 'completed'
        ? { key: 'cancel', label: 'Hủy chuyến' }
        : null,
      { type: 'divider' },
      { key: 'delete', label: 'Xóa chuyến', danger: true },
    ].filter(Boolean),
    onClick: ({ key }) => {
      if (key === 'edit') handleEdit(t.raw);
      else if (key === 'cancel') handleCancel(t.raw);
      else if (key === 'delete') handleDelete(t.raw);
    },
  });

  return (
    <>
      <PageHeader
        title="Quản lý chuyến xe"
        description="Theo dõi và điều phối toàn bộ chuyến xe trong ngày — cập nhật theo thời gian thực."
        cta={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn kind="primary" icon="plus" onClick={handleCreate}>
              Thêm chuyến mới
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
          label="Tổng chuyến trong ngày"
          value={loading ? '—' : String(stats.total)}
          hint={day.format('DD/MM/YYYY')}
        />
        <StatPill
          label="Đang chạy"
          value={loading ? '—' : String(stats.ongoing)}
          hint={
            stats.total
              ? `${Math.round((stats.ongoing / stats.total) * 100)}% công suất`
              : 'Chưa có chuyến'
          }
          tone="teal"
        />
        <StatPill
          label="Hoàn thành"
          value={loading ? '—' : String(stats.completed)}
          hint="Đã kết thúc hành trình"
          tone="success"
        />
        <StatPill
          label="Sắp khởi hành"
          value={loading ? '—' : String(stats.scheduled)}
          hint="Đã lên lịch"
        />
        <StatPill
          label="Đã hủy"
          value={loading ? '—' : String(stats.cancelled)}
          hint="Trong ngày"
          tone="danger"
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
          placeholder="Tìm mã chuyến, tuyến, tài xế, biển số…"
        />
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <DatePicker
            value={day}
            onChange={(d) => setDay(d || dayjs())}
            allowClear={false}
            format="DD/MM/YYYY"
            style={{ height: 40 }}
          />
          <Select
            value={routeF}
            onChange={setRouteF}
            options={routeOptions}
          />
          <Select
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'scheduled', label: 'Sắp khởi hành' },
              { value: 'ongoing', label: 'Đang chạy' },
              { value: 'completed', label: 'Hoàn thành' },
              { value: 'cancelled', label: 'Đã hủy' },
            ]}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'dep', label: 'Sắp xếp: Giờ đi' },
              { value: 'code', label: 'Sắp xếp: Mã chuyến' },
              { value: 'status', label: 'Sắp xếp: Trạng thái' },
              { value: 'occupancy', label: 'Sắp xếp: Lấp đầy ↓' },
              { value: 'revenue', label: 'Sắp xếp: Doanh thu ↓' },
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
                'Mã chuyến',
                'Tuyến đường',
                'Giờ đi → đến',
                'Xe & tài xế',
                'Lấp đầy',
                'Doanh thu',
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
                  style={{ padding: 40, textAlign: 'center', color: 'var(--vxn-fg-5)' }}
                >
                  Đang tải chuyến xe…
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((t, i) => {
                const occPct = t.total ? Math.round((t.occ / t.total) * 100) : 0;
                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom:
                        i < pageRows.length - 1
                          ? '1px solid var(--vxn-border)'
                          : 0,
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          color: 'var(--vxn-teal-800)',
                          font: '600 13px var(--font-mono)',
                        }}
                      >
                        {t.code}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          font: '500 14px var(--font-display)',
                          color: 'var(--vxn-ink)',
                        }}
                      >
                        {t.routeLine}
                      </div>
                      <div
                        style={{
                          font: '400 12px var(--font-display)',
                          color: 'var(--vxn-fg-5)',
                          marginTop: 2,
                        }}
                      >
                        {t.routeSub}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          font: '500 14px var(--font-display)',
                          color: 'var(--vxn-ink)',
                        }}
                      >
                        <span>{t.dep}</span>
                        <span style={{ color: 'var(--vxn-fg-5)' }}>→</span>
                        <span>{t.arr}</span>
                      </div>
                      <div
                        style={{
                          font: '400 12px var(--font-display)',
                          color: 'var(--vxn-fg-5)',
                          marginTop: 2,
                        }}
                      >
                        {t.dur}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          font: '500 13.5px var(--font-display)',
                          color: 'var(--vxn-ink)',
                        }}
                      >
                        {t.plate}
                      </div>
                      <div
                        style={{
                          font: '400 12px var(--font-display)',
                          color: 'var(--vxn-fg-5)',
                          marginTop: 2,
                        }}
                      >
                        {t.driver}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: 160 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          font: '500 13px var(--font-display)',
                          color: 'var(--vxn-ink)',
                          marginBottom: 4,
                        }}
                      >
                        <span>
                          {t.occ}/{t.total}
                        </span>
                        <span
                          style={{
                            color: occColor(t.occ, t.total),
                            fontWeight: 600,
                          }}
                        >
                          {occPct}%
                        </span>
                      </div>
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
                            width: `${occPct}%`,
                            height: '100%',
                            background: occColor(t.occ, t.total),
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        font: '600 14px var(--font-display)',
                        color: 'var(--vxn-ink)',
                      }}
                    >
                      {t.revenue.toLocaleString('vi-VN')} ₫
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {tripStatusChip(t.status)}
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
                          onClick={() => handleEdit(t.raw)}
                        />
                        <Dropdown
                          trigger={['click']}
                          menu={rowMenu(t)}
                          placement="bottomRight"
                        >
                          <span>
                            <RowIconBtn icon="ellipsis-vertical" title="Thao tác" />
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
                  colSpan={8}
                  style={{ padding: 40, textAlign: 'center', color: 'var(--vxn-fg-5)' }}
                >
                  Không có chuyến xe nào trong ngày {day.format('DD/MM/YYYY')}.
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
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}{' '}
            chuyến
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
        title={editingTrip ? 'Chỉnh sửa chuyến xe' : 'Tạo chuyến xe mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
        okText={editingTrip ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
        >
          <Form.Item
            name="routeId"
            label="Tuyến đường"
            rules={[{ required: true, message: 'Vui lòng chọn tuyến đường' }]}
          >
            <AntSelect
              placeholder="Chọn tuyến đường"
              showSearch
              optionFilterProp="children"
            >
              {routes.map((route) => (
                <Option key={route._id} value={route._id}>
                  {route.routeName ||
                    `${cityOf(route.origin)} → ${cityOf(route.destination)}`}
                  {Number(route.basePrice) > 0
                    ? ` — ${Number(route.basePrice).toLocaleString('vi-VN')} ₫`
                    : ''}
                </Option>
              ))}
            </AntSelect>
          </Form.Item>

          <Form.Item
            name="busId"
            label="Xe"
            rules={[{ required: true, message: 'Vui lòng chọn xe' }]}
          >
            <AntSelect placeholder="Chọn xe" showSearch optionFilterProp="children">
              {buses.map((bus) => (
                <Option key={bus._id} value={bus._id}>
                  {bus.busNumber} - {formatBusType(bus.busType, 'Xe khách')} ({bus.seatLayout?.totalSeats} ghế)
                </Option>
              ))}
            </AntSelect>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="driverId"
              label="Tài xế"
              rules={[{ required: true, message: 'Vui lòng chọn tài xế' }]}
            >
              <AntSelect placeholder="Chọn tài xế" showSearch optionFilterProp="children">
                {drivers.map((d) => (
                  <Option key={d._id} value={d._id}>
                    {d.fullName} - {d.employeeCode}
                  </Option>
                ))}
              </AntSelect>
            </Form.Item>

            <Form.Item
              name="tripManagerId"
              label="Quản lý chuyến"
              rules={[{ required: true, message: 'Vui lòng chọn quản lý chuyến' }]}
            >
              <AntSelect placeholder="Chọn quản lý" showSearch optionFilterProp="children">
                {managers.map((m) => (
                  <Option key={m._id} value={m._id}>
                    {m.fullName} - {m.employeeCode}
                  </Option>
                ))}
              </AntSelect>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="departureDate"
              label="Ngày khởi hành"
              rules={[{ required: true, message: 'Chọn ngày khởi hành' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="departureTime"
              label="Giờ khởi hành"
              rules={[{ required: true, message: 'Chọn giờ khởi hành' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="arrivalDate"
              label="Ngày đến"
              rules={[{ required: true, message: 'Chọn ngày đến' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="arrivalTime"
              label="Giờ đến"
              rules={[{ required: true, message: 'Chọn giờ đến' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="basePrice"
            label="Giá vé"
            extra="Tự động điền theo tuyến đã chọn — có thể điều chỉnh riêng cho chuyến này."
            rules={[
              { required: true, message: 'Vui lòng nhập giá vé' },
              {
                type: 'number',
                min: 1,
                message: 'Giá vé phải lớn hơn 0',
              },
            ]}
          >
            <InputNumber
              min={0}
              step={1000}
              placeholder="Chọn tuyến để tự điền, hoặc nhập giá riêng"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => `${value}`.replace(/\D/g, '')}
              style={{ width: '100%' }}
              addonAfter="₫"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TripsPage;
