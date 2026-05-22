import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input, Select as AntSelect, DatePicker, message, Dropdown } from 'antd';
import dayjs from 'dayjs';
import { employeesApi, tripsApi } from '../../services/operatorApi';
import {
  PageHeader,
  Btn,
  Select,
  SearchInput,
  StatPill,
  Chip,
  RowIconBtn,
  PageBtn,
  Timetable,
} from '../../components/operator/vxn';

const { Option } = AntSelect;
const PAGE_SIZE = 10;

const ROLE_LABEL = {
  driver: 'Tài xế',
  trip_manager: 'Điều phối',
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

const HOUR_START = 5;
const HOUR_END = 24;

const tdStyle = {
  padding: '14px 16px',
  font: '400 13.5px var(--font-display)',
  color: 'var(--vxn-fg-2)',
  verticalAlign: 'middle',
};

function staffStatusChip(s) {
  switch (s) {
    case 'on_duty':
      return (
        <Chip tone="info" dot>
          Đang trực
        </Chip>
      );
    case 'available':
      return (
        <Chip tone="success" dot>
          Sẵn sàng
        </Chip>
      );
    case 'leave':
      return (
        <Chip tone="danger" dot>
          Nghỉ phép
        </Chip>
      );
    case 'suspended':
      return (
        <Chip tone="warn" dot>
          Tạm ngưng
        </Chip>
      );
    case 'terminated':
      return <Chip tone="neutral">Đã nghỉ</Chip>;
    default:
      return <Chip tone="neutral">{s}</Chip>;
  }
}

function StaffAvatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .slice(-2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
  const hues = ['#DBEAFE', '#FEF3C7', '#FCE7F3', '#DCFCE7', '#E0E7FF', '#FFEDD5'];
  const hue = hues[(name?.length || 0) % hues.length];
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: hue,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        font: '600 12.5px var(--font-display)',
        color: 'var(--vxn-fg-1, var(--vxn-ink))',
        border: '1.5px solid #fff',
        boxShadow: '0 0 0 1px var(--vxn-border)',
      }}
    >
      {initials}
    </div>
  );
}

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();

  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [roleF, setRoleF] = useState('all');
  const [sort, setSort] = useState('name');
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

    const [empRes, tripRes] = await Promise.allSettled([
      employeesApi.getMyEmployees({ limit: 200 }),
      tripsApi.getMyTrips({
        fromDate: start.toISOString(),
        toDate: end.toISOString(),
        limit: 200,
        sortBy: 'departureTime',
        sortOrder: 'asc',
      }),
    ]);

    if (empRes.status === 'fulfilled') {
      setEmployees(empRes.value?.data?.employees || []);
    } else {
      message.error('Không thể tải danh sách nhân viên');
    }
    if (tripRes.status === 'fulfilled') {
      setTrips(tripRes.value?.data?.trips || []);
    }
    setLoading(false);
  };

  // employeeId -> today's trips (as driver or trip manager)
  const tripsByEmp = useMemo(() => {
    const m = new Map();
    const add = (empId, t) => {
      if (!empId) return;
      const k = String(empId);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(t);
    };
    trips.forEach((t) => {
      add(t.driverId?._id || t.driverId, t);
      add(t.tripManagerId?._id || t.tripManagerId, t);
    });
    m.forEach((list) =>
      list.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
    );
    return m;
  }, [trips]);

  const now = Date.now();

  const enriched = useMemo(
    () =>
      employees.map((e) => {
        const todays = tripsByEmp.get(String(e._id)) || [];
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
        if (e.status === 'on_leave') status = 'leave';
        else if (e.status === 'suspended') status = 'suspended';
        else if (e.status === 'terminated') status = 'terminated';
        else if (ongoing) status = 'on_duty';
        else status = 'available';

        const license =
          e.role === 'driver'
            ? e.licenseClass
              ? `Hạng ${e.licenseClass}${e.licenseNumber ? ` · ${e.licenseNumber}` : ''}`
              : '—'
            : '—';

        return {
          raw: e,
          id: e._id,
          code: e.employeeCode,
          name: e.fullName,
          role: e.role,
          roleLabel: ROLE_LABEL[e.role] || e.role,
          phone: e.phone,
          secondary: e.email || e.idCard || '—',
          license,
          status,
          focusTrip,
          todays,
        };
      }),
    [employees, tripsByEmp, now]
  );

  const filtered = useMemo(
    () =>
      enriched
        .filter(
          (s) =>
            !q ||
            [s.name, s.code, s.phone, s.secondary]
              .join(' ')
              .toLowerCase()
              .includes(q.toLowerCase())
        )
        .filter((s) => statusF === 'all' || s.status === statusF)
        .filter((s) => roleF === 'all' || s.role === roleF)
        .sort((a, b) => {
          if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
          if (sort === 'status') return a.status.localeCompare(b.status);
          if (sort === 'role') return a.roleLabel.localeCompare(b.roleLabel);
          if (sort === 'code') return (a.code || '').localeCompare(b.code || '');
          return 0;
        }),
    [enriched, q, statusF, roleF, sort]
  );

  useEffect(() => {
    setPage(1);
  }, [q, statusF, roleF, sort]);

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
    const drivers = enriched.filter((s) => s.role === 'driver').length;
    const managers = enriched.filter((s) => s.role === 'trip_manager').length;
    const onDuty = enriched.filter((s) => s.status === 'on_duty').length;
    const available = enriched.filter((s) => s.status === 'available').length;
    const leave = enriched.filter((s) => s.status === 'leave').length;
    const suspended = enriched.filter(
      (s) => s.status === 'suspended' || s.status === 'terminated'
    ).length;
    return { total, drivers, managers, onDuty, available, leave, suspended };
  }, [enriched]);

  // Shift timetable from real trips today
  const timetableRows = useMemo(
    () =>
      enriched.map((s) => {
        let blocks = s.todays
          .filter((t) => t.status !== 'cancelled')
          .map((t) => {
            const startH = clamp(dec(t.departureTime), HOUR_START, HOUR_END);
            const arr = new Date(t.arrivalTime);
            const dep = new Date(t.departureTime);
            const crossesDay = arr.getDate() !== dep.getDate();
            const endH = crossesDay
              ? HOUR_END
              : clamp(dec(t.arrivalTime), HOUR_START, HOUR_END);
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
              sub: `${t.routeId?.routeCode || ''}${
                t.busId?.busNumber ? ` · ${t.busId.busNumber}` : ''
              }`,
              tone,
            };
          });

        if (s.status === 'leave') {
          blocks = [
            {
              start: HOUR_START,
              end: HOUR_END,
              label: 'Nghỉ phép',
              sub: 'Không phân công hôm nay',
              tone: 'rose',
            },
          ];
        }

        const busLabel = s.focusTrip?.busId?.busNumber
          ? ` · ${s.focusTrip.busId.busNumber}`
          : '';

        return {
          id: s.id,
          label: s.name,
          sub: `${s.roleLabel}${busLabel}`,
          avatar: <StaffAvatar name={s.name} />,
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
    setEditingEmployee(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingEmployee(record);
    form.setFieldsValue({
      employeeCode: record.employeeCode,
      fullName: record.fullName,
      phone: record.phone,
      email: record.email,
      idCard: record.idCard,
      role: record.role,
      status: record.status,
      licenseNumber: record.licenseNumber,
      licenseClass: record.licenseClass,
      licenseExpiry: record.licenseExpiry ? dayjs(record.licenseExpiry) : null,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const employeeData = {
        ...values,
        licenseExpiry: values.licenseExpiry
          ? values.licenseExpiry.toISOString()
          : undefined,
        password: values.password || undefined,
      };

      if (editingEmployee) {
        delete employeeData.password;
        delete employeeData.employeeCode;
        await employeesApi.update(editingEmployee._id, employeeData);
        message.success('Cập nhật nhân viên thành công');
      } else {
        await employeesApi.create(employeeData);
        message.success('Tạo nhân viên thành công');
      }

      setModalVisible(false);
      form.resetFields();
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
      title: 'Xác nhận xóa nhân viên',
      content: `Nhân viên ${record.fullName} sẽ bị xóa khỏi hệ thống. Tiếp tục?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await employeesApi.delete(record._id);
          message.success('Xóa nhân viên thành công');
          loadData();
        } catch (error) {
          message.error(
            typeof error === 'string' ? error : 'Không thể xóa nhân viên'
          );
        }
      },
    });
  };

  const rowMenu = (s) => ({
    items: [
      { key: 'edit', label: 'Chỉnh sửa hồ sơ' },
      { type: 'divider' },
      { key: 'delete', label: 'Xóa nhân viên', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'edit') handleEdit(s.raw);
      else if (key === 'delete') handleDelete(s.raw);
    },
  });

  const selectedRole = Form.useWatch('role', form);

  return (
    <>
      <PageHeader
        title="Quản lý nhân viên"
        description="Phân công ca làm, theo dõi lịch trực và quản lý hồ sơ tài xế, điều phối của nhà xe."
        cta={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn kind="primary" icon="user-plus" onClick={handleCreate}>
              Thêm nhân viên
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
          label="Tổng nhân sự"
          value={loading ? '—' : String(stats.total)}
          hint={`${stats.drivers} tài xế · ${stats.managers} điều phối`}
        />
        <StatPill
          label="Đang trực"
          value={loading ? '—' : String(stats.onDuty)}
          hint={
            stats.total
              ? `${Math.round((stats.onDuty / stats.total) * 100)}% đang làm việc`
              : 'Chưa có chuyến'
          }
          tone="teal"
        />
        <StatPill
          label="Sẵn sàng"
          value={loading ? '—' : String(stats.available)}
          hint="Có thể nhận chuyến tiếp"
          tone="success"
        />
        <StatPill
          label="Nghỉ phép"
          value={loading ? '—' : String(stats.leave)}
          hint="Đang nghỉ"
          tone="warn"
        />
        <StatPill
          label="Tạm ngưng"
          value={loading ? '—' : String(stats.suspended)}
          hint="Ngưng / đã nghỉ việc"
          tone="default"
        />
      </div>

      <Timetable
        title={`Lịch trực nhân viên — ${todayLabel}`}
        subtitle="Lịch ca theo giờ dựa trên chuyến thực tế. Block đỏ = nghỉ phép, vạch xanh là thời điểm hiện tại."
        date={new Date().toLocaleDateString('vi-VN')}
        rowLabelHeader="Nhân viên"
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
          { tone: 'teal', label: 'Chuyến phân công' },
          { tone: 'sky', label: 'Đang chạy' },
          { tone: 'slate', label: 'Đã hoàn thành' },
          { tone: 'rose', label: 'Nghỉ phép' },
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
          placeholder="Tìm tên, mã NV, số điện thoại…"
        />
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <Select
            value={roleF}
            onChange={setRoleF}
            options={[
              { value: 'all', label: 'Tất cả vai trò' },
              { value: 'driver', label: 'Tài xế' },
              { value: 'trip_manager', label: 'Điều phối' },
            ]}
          />
          <Select
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'on_duty', label: 'Đang trực' },
              { value: 'available', label: 'Sẵn sàng' },
              { value: 'leave', label: 'Nghỉ phép' },
              { value: 'suspended', label: 'Tạm ngưng' },
              { value: 'terminated', label: 'Đã nghỉ' },
            ]}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'name', label: 'Sắp xếp: Tên A–Z' },
              { value: 'status', label: 'Sắp xếp: Trạng thái' },
              { value: 'role', label: 'Sắp xếp: Vai trò' },
              { value: 'code', label: 'Sắp xếp: Mã NV' },
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
                'Nhân viên',
                'Mã NV',
                'Vai trò',
                'Bằng lái',
                'Số điện thoại',
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
                  Đang tải nhân viên…
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom:
                      i < pageRows.length - 1 ? '1px solid var(--vxn-border)' : 0,
                  }}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <StaffAvatar name={s.name} />
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
                          {s.secondary}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      font: '500 13px var(--font-mono)',
                      color: 'var(--vxn-teal-800)',
                    }}
                  >
                    {s.code}
                  </td>
                  <td style={tdStyle}>{s.roleLabel}</td>
                  <td style={tdStyle}>{s.license}</td>
                  <td
                    style={{
                      ...tdStyle,
                      font: '400 13px var(--font-mono)',
                      color: 'var(--vxn-fg-3)',
                    }}
                  >
                    {s.phone}
                  </td>
                  <td style={tdStyle}>{staffStatusChip(s.status)}</td>
                  <td style={tdStyle}>
                    <div
                      style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
                    >
                      <RowIconBtn
                        icon="pencil"
                        title="Chỉnh sửa"
                        onClick={() => handleEdit(s.raw)}
                      />
                      <Dropdown
                        trigger={['click']}
                        menu={rowMenu(s)}
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
                  Không tìm thấy nhân viên phù hợp.
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
            nhân viên
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
        title={editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText={editingEmployee ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            {!editingEmployee && (
              <Form.Item
                name="employeeCode"
                label="Mã Nhân Viên"
                rules={[{ required: true }]}
              >
                <Input placeholder="DRV001, TM001" />
              </Form.Item>
            )}

            <Form.Item name="fullName" label="Họ Tên" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số Điện Thoại"
              rules={[{ required: true }, { pattern: /^[0-9]{10}$/, message: '10 chữ số' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
              <Input />
            </Form.Item>

            <Form.Item name="idCard" label="CMND/CCCD">
              <Input />
            </Form.Item>

            <Form.Item name="role" label="Vai Trò" rules={[{ required: true }]}>
              <AntSelect>
                <Option value="driver">Tài Xế</Option>
                <Option value="trip_manager">Điều Phối</Option>
              </AntSelect>
            </Form.Item>

            {!editingEmployee && (
              <Form.Item
                name="password"
                label="Mật Khẩu"
                rules={[{ required: true, min: 6 }]}
              >
                <Input.Password />
              </Form.Item>
            )}

            <Form.Item name="status" label="Trạng Thái" initialValue="active">
              <AntSelect>
                <Option value="active">Hoạt Động</Option>
                <Option value="on_leave">Nghỉ Phép</Option>
                <Option value="suspended">Tạm Ngưng</Option>
                <Option value="terminated">Đã Nghỉ</Option>
              </AntSelect>
            </Form.Item>
          </div>

          {selectedRole === 'driver' && (
            <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-blue-50 rounded">
              <Form.Item
                name="licenseNumber"
                label="Số Giấy Phép"
                rules={[{ required: true, message: 'Bắt buộc cho tài xế' }]}
              >
                <Input placeholder="ABC123456" />
              </Form.Item>

              <Form.Item
                name="licenseClass"
                label="Hạng Giấy Phép"
                rules={[{ required: true, message: 'Bắt buộc cho tài xế' }]}
              >
                <AntSelect>
                  <Option value="B">B</Option>
                  <Option value="C">C</Option>
                  <Option value="D">D</Option>
                  <Option value="E">E</Option>
                </AntSelect>
              </Form.Item>

              <Form.Item
                name="licenseExpiry"
                label="Ngày Hết Hạn"
                rules={[{ required: true, message: 'Bắt buộc cho tài xế' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default EmployeesPage;
