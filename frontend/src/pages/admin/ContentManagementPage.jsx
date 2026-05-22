/**
 * Trang chủ & Nội dung — System-admin portal.
 *
 * Faithful port of the design package's `admin-content.jsx` view (Banner /
 * Blog / FAQ tabs), wired to the REAL content endpoints
 * (`/admin/content/statistics` + `/admin/banners` + `/admin/blogs` +
 * `/admin/faqs`, with full create / update / delete) instead of the
 * design's hard-coded BANNERS / BLOGS / FAQS sample arrays.
 *
 * Honesty-over-pixel-match substitutions (design → truthful equivalent):
 *  • Banner KPIs: "Tổng lượt hiển thị 1.34M / Tổng click 78.1K / CTR 5.82%"
 *    fabricated 30-day figures → real lifetime sums of `viewCount` /
 *    `clickCount` over the loaded banners and the real derived CTR (no
 *    windowed analytics exist, so the misleading "trong 30 ngày" sub is
 *    dropped).
 *  • Banner preview: the design paints a fake CSS gradient; the real
 *    `imageUrl` is rendered instead (gradient only as a fallback when an
 *    image fails / is absent).
 *  • Blog KPIs: invented "412K views / 18.4K likes / +18.2%" → real
 *    `stats.blogs` counts (total / published / draft) and the real most-
 *    viewed post from `stats.popular.blogs`.
 *  • FAQ KPIs: invented "124K views / 92% / −2pp" → real `stats.faqs`
 *    counts plus a helpfulness average / "cần xem lại" count computed
 *    truthfully from the loaded FAQ rows (the statistics endpoint exposes
 *    no helpfulness aggregate).
 *  • Banner form position options corrected to the REAL enum
 *    (homepage / booking / routes / footer) — the prior component used
 *    non-existent home_hero / home_secondary / sidebar values.
 *  • Header CTA "Xem trang chủ" opens the real public homepage; the
 *    context CTA (Thêm banner / Viết bài / Thêm FAQ) opens real create
 *    forms; row pencil/⋯ menus become real Edit + Delete actions.
 *  • Per-row impression/CTR figures that the model does not store are
 *    shown from the real `viewCount` / `clickCount` only.
 *
 * Page chrome uses the VXN design system; AntD is retained only for the
 * CRUD modals / forms / confirms / toasts (rendered in a portal outside the
 * scoped `.vxn-admin` tokens) per the proven redesign convention.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  Form,
  Input,
  Select as AntSelect,
  Switch,
  DatePicker,
  InputNumber,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { adminContent } from '../../services/adminApi';
import {
  PageHeader,
  Btn,
  Card,
  Chip,
  Table,
  Pager,
  SearchInput,
  Select,
  KpiCard,
  Skeleton,
  EmptyState,
  VxnIcon,
} from '../../components/admin/vxn';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 12;

/* ───────── taxonomy (verbatim from design — matches the real enums) ──── */
// Khóa nội bộ giữ nguyên theo enum model Banner; nhãn theo tên trang khách
// nhìn thấy: Trang chủ (/), Mua vé (/trips), Khám phá (/tin-tuc).
const BANNER_POSITION = {
  homepage: 'Trang chủ',
  booking: 'Mua vé',
  routes: 'Khám phá',
  footer: 'Footer',
};

const BLOG_CATEGORIES = {
  news: 'Tin tức',
  guide: 'Hướng dẫn',
  promotion: 'Khuyến mãi',
  travel_tips: 'Mẹo du lịch',
  company: 'Công ty',
  other: 'Khác',
};
const BLOG_CAT_COLOR = {
  news: '#3B82F6',
  guide: '#15803D',
  promotion: '#E89B26',
  travel_tips: '#8B5CF6',
  company: '#475569',
  other: '#94A3B8',
};

const FAQ_CATEGORIES = {
  booking: 'Đặt vé',
  payment: 'Thanh toán',
  cancellation: 'Hủy / Hoàn tiền',
  account: 'Tài khoản',
  tickets: 'Vé điện tử',
  routes: 'Tuyến',
  policies: 'Chính sách',
  technical: 'Kỹ thuật',
  other: 'Khác',
};

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const nfmt = (n) => Number(n || 0).toLocaleString('vi-VN');

function bannerSchedule(b) {
  const s = b.startDate ? dayjs(b.startDate) : null;
  const e = b.endDate ? dayjs(b.endDate) : null;
  if (e && e.isBefore(dayjs())) return `Hết hạn ${e.format('DD/MM/YY')}`;
  if (s && e) return `${s.format('DD/MM')} → ${e.format('DD/MM/YY')}`;
  if (s) return `Từ ${s.format('DD/MM/YY')}`;
  if (e) return `Đến ${e.format('DD/MM/YY')}`;
  return 'Vĩnh viễn';
}

/* ───────── shared icon-action button ───────── */
function IconAct({ icon, title, danger, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        color: danger ? '#B91C1C' : 'var(--vxn-fg-4)',
      }}
    >
      <VxnIcon name={icon} size={16} color={danger ? '#B91C1C' : 'var(--vxn-fg-4)'} />
    </button>
  );
}

function Mini({ label, value, highlight }) {
  return (
    <div>
      <div
        style={{
          font: '500 10.5px var(--font-display)',
          letterSpacing: '0.06em',
          color: 'var(--vxn-fg-5)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          font: '600 14px var(--font-display)',
          color: highlight ? 'var(--vxn-teal-800)' : 'var(--vxn-ink)',
          marginTop: 3,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ───────── Banner card ───────── */
function BannerCard({ b, onEdit, onDelete }) {
  const views = Number(b.viewCount || 0);
  const clicks = Number(b.clickCount || 0);
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) + '%' : '—';
  const fallbackBg = 'linear-gradient(135deg, #006481, #2B7EAD)';
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--vxn-border)',
        borderRadius: 12,
        overflow: 'hidden',
        opacity: b.isActive ? 1 : 0.72,
      }}
    >
      <div
        style={{
          height: 140,
          background: b.imageUrl ? `#0b3a4a center/cover no-repeat` : fallbackBg,
          backgroundImage: b.imageUrl ? `url(${b.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45))',
          }}
        />
        <div
          style={{
            position: 'relative',
            font: '700 17px var(--font-display)',
            color: '#fff',
            textAlign: 'center',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            lineHeight: 1.3,
          }}
        >
          {b.title}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '3px 10px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.45)',
            color: '#fff',
            font: '600 11px var(--font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {BANNER_POSITION[b.position] || b.position} · #{b.order ?? 0}
        </div>
        {b.linkText && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              padding: '5px 12px',
              borderRadius: 4,
              background: '#fff',
              color: 'var(--vxn-ink)',
              font: '600 12px var(--font-display)',
            }}
          >
            {b.linkText}
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {b.isActive ? (
            <Chip tone="success" dot>
              Đang chạy
            </Chip>
          ) : (
            <Chip tone="neutral">Tạm dừng</Chip>
          )}
          <div style={{ flex: 1 }} />
          <IconAct icon="pencil" title="Sửa banner" onClick={() => onEdit(b)} />
          <IconAct icon="trash-2" title="Xóa banner" danger onClick={() => onDelete(b)} />
        </div>
        <div
          style={{
            font: '400 12px var(--font-display)',
            color: 'var(--vxn-fg-4)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <VxnIcon name="calendar" size={12} color="var(--vxn-fg-5)" />
          {bannerSchedule(b)}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: '12px 0 0',
            borderTop: '1px solid var(--vxn-border-muted)',
          }}
        >
          <Mini label="Hiển thị" value={nfmt(views)} />
          <Mini label="Click" value={nfmt(clicks)} />
          <Mini label="CTR" value={ctr} highlight />
        </div>
      </div>
    </div>
  );
}

/* ───────── Banner tab ───────── */
function BannersTab({ stats, registerCreate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const reload = useCallback(() => setKey((k) => k + 1), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await adminContent.banners.getAll({ limit: 100, sort: 'position order' });
        if (alive && res?.status === 'success') setRows(res.data || []);
      } catch (e) {
        if (alive) message.error(typeof e === 'string' ? e : 'Không thể tải banner');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ position: 'homepage', order: 0, isActive: true, linkText: 'Xem thêm' });
    setModalOpen(true);
  }, [form]);

  useEffect(() => {
    registerCreate(openCreate);
  }, [registerCreate, openCreate]);

  const openEdit = (b) => {
    setEditing(b);
    form.resetFields();
    form.setFieldsValue({
      ...b,
      dateRange:
        b.startDate && b.endDate ? [dayjs(b.startDate), dayjs(b.endDate)] : undefined,
    });
    setModalOpen(true);
  };

  const remove = (b) => {
    Modal.confirm({
      title: 'Xóa banner?',
      content: `"${b.title}" sẽ bị xóa vĩnh viễn.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await adminContent.banners.delete(b._id);
          if (res?.status === 'success') {
            message.success('Đã xóa banner');
            reload();
          }
        } catch (e) {
          message.error(typeof e === 'string' ? e : 'Không thể xóa banner');
        }
      },
    });
  };

  const submit = async (values) => {
    try {
      setSaving(true);
      const data = {
        ...values,
        startDate: values.dateRange?.[0]?.toISOString() || null,
        endDate: values.dateRange?.[1]?.toISOString() || null,
      };
      delete data.dateRange;
      const res = editing
        ? await adminContent.banners.update(editing._id, data)
        : await adminContent.banners.create(data);
      if (res?.status === 'success') {
        message.success(editing ? 'Đã cập nhật banner' : 'Đã tạo banner');
        setModalOpen(false);
        reload();
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    const v = rows.reduce((a, b) => a + Number(b.viewCount || 0), 0);
    const c = rows.reduce((a, b) => a + Number(b.clickCount || 0), 0);
    return { v, c, ctr: v > 0 ? ((c / v) * 100).toFixed(2) + '%' : '—' };
  }, [rows]);

  const active = stats?.banners?.active ?? rows.filter((b) => b.isActive).length;
  const total = stats?.banners?.total ?? rows.length;

  return (
    <div>
      <div
        className="admin-grid"
        style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <KpiCard label="Banner đang chạy" value={active} sub={`/ ${total} tổng`} icon="image" iconBg="#DBEAFE" accent="#3B82F6" />
        <KpiCard label="Tổng lượt hiển thị" value={nfmt(totals.v)} sub="cộng dồn" icon="eye" iconBg="#DCFCE7" accent="#22C55E" />
        <KpiCard label="Tổng lượt click" value={nfmt(totals.c)} sub="cộng dồn" icon="mouse-pointer-click" iconBg="#FEF3C7" accent="#F59E0B" />
        <KpiCard label="CTR trung bình" value={totals.ctr} sub="click / hiển thị" icon="trending-up" iconBg="#FEE2E2" accent="#EF4444" />
      </div>

      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={260} radius={12} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card padding={0}>
          <EmptyState
            icon="image"
            title="Chưa có banner"
            hint='Nhấn "Thêm banner" để tạo banner hiển thị trên trang khách hàng.'
          />
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {rows.map((b) => (
            <BannerCard key={b._id} b={b} onEdit={openEdit} onDelete={remove} />
          ))}
        </div>
      )}

      <Modal
        title={editing ? 'Chỉnh sửa banner' : 'Thêm banner'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={editing ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Tiêu đề banner…" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={2} placeholder="Mô tả ngắn (tùy chọn)…" />
          </Form.Item>
          <Form.Item name="imageUrl" label="URL hình ảnh" rules={[{ required: true, message: 'Nhập URL hình ảnh' }]}>
            <Input placeholder="https://…/banner.jpg" />
          </Form.Item>
          <Form.Item name="mobileImageUrl" label="URL hình ảnh mobile">
            <Input placeholder="https://…/banner-mobile.jpg" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="linkUrl" label="Link đích" style={{ flex: 1 }}>
              <Input placeholder="https://…" />
            </Form.Item>
            <Form.Item name="linkText" label="Chữ trên nút" style={{ flex: 1 }}>
              <Input placeholder="Xem thêm" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="position"
              label="Vị trí"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Chọn vị trí' }]}
            >
              <AntSelect
                options={Object.entries(BANNER_POSITION).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="order" label="Thứ tự" style={{ width: 140 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="dateRange" label="Thời gian hiển thị (tùy chọn)">
            <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* ───────── Blog tab ───────── */
function BlogsTab({ stats, registerCreate }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [cat, setCat] = useState('all');
  const [status, setStatus] = useState('all');
  const [key, setKey] = useState(0);
  const reload = useCallback(() => setKey((k) => k + 1), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const t = setTimeout(() => setQd(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const params = { page, limit: PAGE_SIZE, sort: '-createdAt' };
        if (qd) params.search = qd;
        if (cat !== 'all') params.category = cat;
        if (status !== 'all') params.status = status;
        const res = await adminContent.blogs.getAll(params);
        if (alive && res?.status === 'success') {
          setRows(res.data || []);
          setTotal(res.pagination?.total ?? (res.data || []).length);
        }
      } catch (e) {
        if (alive) message.error(typeof e === 'string' ? e : 'Không thể tải bài viết');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [qd, cat, status, page, key]);

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ category: 'news', status: 'draft' });
    setModalOpen(true);
  }, [form]);

  useEffect(() => {
    registerCreate(openCreate);
  }, [registerCreate, openCreate]);

  const openEdit = async (b) => {
    try {
      const res = await adminContent.blogs.getById(b._id);
      const full = res?.status === 'success' ? res.data : b;
      setEditing(full);
      form.resetFields();
      form.setFieldsValue({
        title: full.title,
        slug: full.slug,
        category: full.category,
        status: full.status,
        featuredImage: full.featuredImage,
        excerpt: full.excerpt,
        content: full.content,
        tags: (full.tags || []).join(', '),
      });
      setModalOpen(true);
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Không thể tải bài viết');
    }
  };

  const remove = (b) => {
    Modal.confirm({
      title: 'Xóa bài viết?',
      content: `"${b.title}" sẽ bị xóa vĩnh viễn.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await adminContent.blogs.delete(b._id);
          if (res?.status === 'success') {
            message.success('Đã xóa bài viết');
            reload();
          }
        } catch (e) {
          message.error(typeof e === 'string' ? e : 'Không thể xóa bài viết');
        }
      },
    });
  };

  const submit = async (values) => {
    try {
      setSaving(true);
      const data = {
        ...values,
        slug: values.slug?.trim() || slugify(values.title),
        tags: values.tags
          ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };
      const res = editing
        ? await adminContent.blogs.update(editing._id, data)
        : await adminContent.blogs.create(data);
      if (res?.status === 'success') {
        message.success(editing ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết');
        setModalOpen(false);
        reload();
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const sb = stats?.blogs || {};
  const topBlog = stats?.popular?.blogs?.[0];

  const columns = [
    {
      key: 'title',
      label: 'Tiêu đề',
      render: (b) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 56,
              height: 44,
              borderRadius: 6,
              flexShrink: 0,
              background: b.featuredImage
                ? `center/cover no-repeat url(${b.featuredImage})`
                : `linear-gradient(135deg, ${BLOG_CAT_COLOR[b.category] || '#94A3B8'}, ${
                    (BLOG_CAT_COLOR[b.category] || '#94A3B8') + '99'
                  })`,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>
              {b.title}
            </div>
            <div
              style={{
                font: '400 11.5px var(--font-display)',
                color: 'var(--vxn-fg-5)',
                marginTop: 2,
              }}
            >
              {b.author?.fullName || 'Ẩn danh'} ·{' '}
              {b.publishedAt
                ? dayjs(b.publishedAt).format('DD/MM/YY')
                : b.status === 'draft'
                ? '—'
                : dayjs(b.createdAt).format('DD/MM/YY')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Chuyên mục',
      render: (b) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 999,
            background: (BLOG_CAT_COLOR[b.category] || '#94A3B8') + '22',
            color: BLOG_CAT_COLOR[b.category] || '#475569',
            font: '600 11.5px var(--font-display)',
          }}
        >
          {BLOG_CATEGORIES[b.category] || b.category}
        </span>
      ),
    },
    {
      key: 'views',
      label: 'Lượt xem',
      align: 'right',
      render: (b) => (
        <span
          style={{
            font: '500 13.5px var(--font-display)',
            color: b.status === 'draft' ? 'var(--vxn-fg-5)' : 'var(--vxn-ink)',
          }}
        >
          {nfmt(b.viewCount)}
        </span>
      ),
    },
    {
      key: 'likes',
      label: 'Lượt thích',
      align: 'right',
      render: (b) => (
        <span
          style={{
            font: '500 13.5px var(--font-display)',
            color: b.status === 'draft' ? 'var(--vxn-fg-5)' : 'var(--vxn-ink)',
          }}
        >
          {nfmt(b.likeCount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (b) =>
        b.status === 'published' ? (
          <Chip tone="success" dot>
            Đã xuất bản
          </Chip>
        ) : b.status === 'draft' ? (
          <Chip tone="warn" dot>
            Nháp
          </Chip>
        ) : (
          <Chip tone="neutral">Lưu trữ</Chip>
        ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (b) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <IconAct icon="pencil" title="Sửa" onClick={() => openEdit(b)} />
          <IconAct icon="trash-2" title="Xóa" danger onClick={() => remove(b)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div
        className="admin-grid"
        style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <KpiCard label="Tổng bài viết" value={sb.total ?? '—'} sub={`${sb.draft ?? 0} nháp`} icon="newspaper" iconBg="#DBEAFE" accent="#3B82F6" />
        <KpiCard label="Đã xuất bản" value={sb.published ?? '—'} sub="hiển thị công khai" icon="check-circle" iconBg="#DCFCE7" accent="#22C55E" />
        <KpiCard label="Bản nháp" value={sb.draft ?? '—'} sub="chưa xuất bản" icon="file-pen" iconBg="#FEF3C7" accent="#F59E0B" />
        <KpiCard
          label="Xem nhiều nhất"
          value={topBlog ? topBlog.title : '—'}
          sub={topBlog ? `${nfmt(topBlog.viewCount)} lượt xem` : 'chưa có dữ liệu'}
          icon="trophy"
          iconBg="#FEE2E2"
          accent="#EF4444"
        />
      </div>

      <Card padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--vxn-border-muted)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Tìm bài viết…"
          />
          <Select
            value={cat}
            onChange={(v) => {
              setCat(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Mọi chuyên mục' },
              ...Object.entries(BLOG_CATEGORIES).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Mọi trạng thái' },
              { value: 'published', label: 'Đã xuất bản' },
              { value: 'draft', label: 'Nháp' },
              { value: 'archived', label: 'Đã lưu trữ' },
            ]}
          />
        </div>

        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={48} radius={8} />
            ))}
          </div>
        ) : (
          <Table columns={columns} rows={rows} empty="Không tìm thấy bài viết nào." />
        )}

        {!loading && total > PAGE_SIZE && (
          <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={editing ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Tiêu đề bài viết…" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="slug"
              label="Slug (để trống sẽ tự tạo từ tiêu đề)"
              style={{ flex: 1 }}
            >
              <Input placeholder="vi-du-slug" />
            </Form.Item>
            <Form.Item name="category" label="Chuyên mục" style={{ width: 200 }}>
              <AntSelect
                options={Object.entries(BLOG_CATEGORIES).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" style={{ width: 170 }}>
              <AntSelect
                options={[
                  { value: 'draft', label: 'Nháp' },
                  { value: 'published', label: 'Xuất bản' },
                  { value: 'archived', label: 'Lưu trữ' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item
            name="featuredImage"
            label="Ảnh đại diện (URL)"
            rules={[{ required: true, message: 'Nhập URL ảnh đại diện' }]}
          >
            <Input placeholder="https://…/cover.jpg" />
          </Form.Item>
          <Form.Item
            name="excerpt"
            label="Tóm tắt"
            rules={[{ required: true, message: 'Nhập tóm tắt' }]}
          >
            <TextArea rows={2} maxLength={500} placeholder="Tóm tắt ngắn (≤ 500 ký tự)…" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Nhập nội dung' }]}
          >
            <TextArea rows={8} placeholder="Nội dung bài viết (hỗ trợ HTML/Markdown)…" />
          </Form.Item>
          <Form.Item name="tags" label="Thẻ (phân tách bằng dấu phẩy)">
            <Input placeholder="xe khách, mẹo, an toàn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* ───────── FAQ tab ───────── */
function FaqsTab({ stats, registerCreate }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [cat, setCat] = useState('all');
  const [key, setKey] = useState(0);
  const reload = useCallback(() => setKey((k) => k + 1), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const t = setTimeout(() => setQd(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const params = { page, limit: PAGE_SIZE, sort: 'category order' };
        if (qd) params.search = qd;
        if (cat !== 'all') params.category = cat;
        const res = await adminContent.faqs.getAll(params);
        if (alive && res?.status === 'success') {
          setRows(res.data || []);
          setTotal(res.pagination?.total ?? (res.data || []).length);
        }
      } catch (e) {
        if (alive) message.error(typeof e === 'string' ? e : 'Không thể tải FAQ');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [qd, cat, page, key]);

  const openCreate = useCallback(() => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ category: 'booking', order: 0, isActive: true });
    setModalOpen(true);
  }, [form]);

  useEffect(() => {
    registerCreate(openCreate);
  }, [registerCreate, openCreate]);

  const openEdit = (f) => {
    setEditing(f);
    form.resetFields();
    form.setFieldsValue({
      question: f.question,
      answer: f.answer,
      category: f.category,
      order: f.order ?? 0,
      isActive: f.isActive,
      tags: (f.tags || []).join(', '),
    });
    setModalOpen(true);
  };

  const remove = (f) => {
    Modal.confirm({
      title: 'Xóa FAQ?',
      content: `"${f.question}" sẽ bị xóa vĩnh viễn.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await adminContent.faqs.delete(f._id);
          if (res?.status === 'success') {
            message.success('Đã xóa FAQ');
            reload();
          }
        } catch (e) {
          message.error(typeof e === 'string' ? e : 'Không thể xóa FAQ');
        }
      },
    });
  };

  const submit = async (values) => {
    try {
      setSaving(true);
      const data = {
        ...values,
        tags: values.tags
          ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };
      const res = editing
        ? await adminContent.faqs.update(editing._id, data)
        : await adminContent.faqs.create(data);
      if (res?.status === 'success') {
        message.success(editing ? 'Đã cập nhật FAQ' : 'Đã tạo FAQ');
        setModalOpen(false);
        reload();
      }
    } catch (e) {
      message.error(typeof e === 'string' ? e : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const ratioOf = (f) => {
    const tot = Number(f.helpfulCount || 0) + Number(f.notHelpfulCount || 0);
    return tot === 0 ? null : Math.round((Number(f.helpfulCount || 0) / tot) * 100);
  };

  const helpfulAvg = useMemo(() => {
    const rated = rows.map(ratioOf).filter((r) => r != null);
    if (rated.length === 0) return null;
    return Math.round(rated.reduce((a, b) => a + b, 0) / rated.length);
  }, [rows]);

  const needReview = useMemo(
    () => rows.filter((f) => {
      const r = ratioOf(f);
      return r != null && r < 70;
    }).length,
    [rows]
  );

  const sf = stats?.faqs || {};

  const columns = [
    {
      key: 'q',
      label: 'Câu hỏi',
      render: (f) => (
        <div>
          <div
            style={{
              font: '500 14px var(--font-display)',
              color: 'var(--vxn-ink)',
              marginBottom: 4,
            }}
          >
            {f.question}
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 4,
              background: 'var(--vxn-bg-mist)',
              color: 'var(--vxn-fg-3)',
              font: '500 11px var(--font-display)',
            }}
          >
            {FAQ_CATEGORIES[f.category] || f.category}
          </span>
          {!f.isActive && (
            <span style={{ marginLeft: 8 }}>
              <Chip tone="neutral">Ẩn</Chip>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'views',
      label: 'Lượt xem',
      align: 'right',
      render: (f) => (
        <span style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)' }}>
          {nfmt(f.viewCount)}
        </span>
      ),
    },
    {
      key: 'helpful',
      label: 'Hữu ích / Không',
      align: 'center',
      render: (f) => (
        <div
          style={{
            font: '500 12.5px var(--font-display)',
            display: 'inline-flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#15803D' }}>▲ {nfmt(f.helpfulCount)}</span>
          <span style={{ color: '#B91C1C' }}>▼ {nfmt(f.notHelpfulCount)}</span>
        </div>
      ),
    },
    {
      key: 'ratio',
      label: '% Hữu ích',
      align: 'right',
      render: (f) => {
        const r = ratioOf(f);
        if (r == null)
          return (
            <span style={{ font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
              chưa có
            </span>
          );
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 72,
                height: 6,
                borderRadius: 4,
                background: 'var(--vxn-bg-mist)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: r + '%',
                  background: r >= 90 ? '#15803D' : r >= 70 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
            <span
              style={{
                font: '600 13px var(--font-display)',
                color: 'var(--vxn-ink)',
                minWidth: 36,
                textAlign: 'right',
              }}
            >
              {r}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (f) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <IconAct icon="pencil" title="Sửa" onClick={() => openEdit(f)} />
          <IconAct icon="trash-2" title="Xóa" danger onClick={() => remove(f)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div
        className="admin-grid"
        style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <KpiCard label="Tổng câu hỏi" value={sf.total ?? '—'} sub={`${sf.active ?? 0} đang hiển thị`} icon="circle-help" iconBg="#DBEAFE" accent="#3B82F6" />
        <KpiCard label="Đang hiển thị" value={sf.active ?? '—'} sub="công khai" icon="eye" iconBg="#DCFCE7" accent="#22C55E" />
        <KpiCard
          label="Hữu ích TB"
          value={helpfulAvg == null ? '—' : `${helpfulAvg}%`}
          sub="trên các FAQ đã có đánh giá"
          icon="thumbs-up"
          iconBg="#FEF3C7"
          accent="#F59E0B"
        />
        <KpiCard
          label="Cần xem lại"
          value={needReview}
          sub="< 70% hữu ích (trang này)"
          icon="triangle-alert"
          iconBg="#FEE2E2"
          accent="#EF4444"
        />
      </div>

      <Card padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--vxn-border-muted)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Tìm câu hỏi…"
          />
          <Select
            value={cat}
            onChange={(v) => {
              setCat(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Mọi chuyên mục' },
              ...Object.entries(FAQ_CATEGORIES).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>

        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={48} radius={8} />
            ))}
          </div>
        ) : (
          <Table columns={columns} rows={rows} empty="Không tìm thấy FAQ nào." />
        )}

        {!loading && total > PAGE_SIZE && (
          <Pager total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa FAQ' : 'Thêm FAQ'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={editing ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item
            name="question"
            label="Câu hỏi"
            rules={[{ required: true, message: 'Nhập câu hỏi' }]}
          >
            <Input placeholder="Câu hỏi thường gặp…" />
          </Form.Item>
          <Form.Item
            name="answer"
            label="Câu trả lời"
            rules={[{ required: true, message: 'Nhập câu trả lời' }]}
          >
            <TextArea rows={6} placeholder="Nội dung trả lời…" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="category"
              label="Chuyên mục"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Chọn chuyên mục' }]}
            >
              <AntSelect
                options={Object.entries(FAQ_CATEGORIES).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="order" label="Thứ tự" style={{ width: 140 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="tags" label="Thẻ (phân tách bằng dấu phẩy)">
            <Input placeholder="hoàn tiền, hủy vé" />
          </Form.Item>
          <Form.Item name="isActive" label="Hiển thị" valuePropName="checked">
            <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

const TAB_META = [
  { key: 'banners', label: 'Banner trang chủ', icon: 'image' },
  { key: 'blogs', label: 'Bài viết blog', icon: 'newspaper' },
  { key: 'faqs', label: 'FAQ', icon: 'circle-help' },
];

const ContentManagementPage = () => {
  const [tab, setTab] = useState('banners');
  const [stats, setStats] = useState(null);

  // each tab registers its "open create" handler so the header CTA can call it
  const [creators, setCreators] = useState({});
  const registerFor = useCallback(
    (k) => (fn) => setCreators((c) => (c[k] === fn ? c : { ...c, [k]: fn })),
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminContent.getStatistics();
        if (alive && res?.status === 'success') setStats(res.data);
      } catch {
        /* stats are non-critical chrome */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const counts = {
    banners: stats?.banners?.total,
    blogs: stats?.blogs?.total,
    faqs: stats?.faqs?.total,
  };

  const ctaLabel =
    tab === 'banners' ? 'Thêm banner' : tab === 'blogs' ? 'Viết bài mới' : 'Thêm FAQ';

  return (
    <div>
      <PageHeader
        title="Trang chủ & Nội dung"
        description="Quản lý banner trang chủ, blog bài viết và FAQ — toàn bộ nội dung hiển thị cho khách hàng."
        cta={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn
              kind="ghost"
              icon="external-link"
              onClick={() => window.open('/', '_blank', 'noopener')}
            >
              Xem trang chủ
            </Btn>
            <Btn kind="primary" icon="plus" onClick={() => creators[tab]?.()}>
              {ctaLabel}
            </Btn>
          </div>
        }
      />

      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 24,
          borderBottom: '1px solid var(--vxn-border)',
        }}
      >
        {TAB_META.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: '12px 18px',
                font: `${on ? 600 : 500} 14px var(--font-display)`,
                color: on ? 'var(--vxn-teal-800)' : 'var(--vxn-fg-3)',
                borderBottom: '2px solid ' + (on ? 'var(--vxn-teal-700)' : 'transparent'),
                marginBottom: -1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <VxnIcon
                name={t.icon}
                size={16}
                color={on ? 'var(--vxn-teal-700)' : 'var(--vxn-fg-4)'}
              />
              {t.label}
              <span
                style={{
                  background: 'var(--vxn-bg-mist)',
                  color: 'var(--vxn-fg-4)',
                  borderRadius: 999,
                  padding: '1px 8px',
                  font: '600 11.5px var(--font-display)',
                }}
              >
                {counts[t.key] ?? '·'}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'banners' && <BannersTab stats={stats} registerCreate={registerFor('banners')} />}
      {tab === 'blogs' && <BlogsTab stats={stats} registerCreate={registerFor('blogs')} />}
      {tab === 'faqs' && <FaqsTab stats={stats} registerCreate={registerFor('faqs')} />}
    </div>
  );
};

export default ContentManagementPage;
