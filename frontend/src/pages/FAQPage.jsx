import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Input, Spin, message } from 'antd';
import {
  DownOutlined,
  PhoneOutlined,
  SearchOutlined,
  UpOutlined,
} from '@ant-design/icons';
import CustomerShell from '../components/customer/CustomerShell';
import CustomerBreadcrumb from '../components/customer/CustomerBreadcrumb';
import { getFAQs, markFAQHelpful } from '../services/contentApi';

const FAQ_CAT_LABELS = {
  booking: 'Đặt vé',
  payment: 'Thanh toán',
  cancellation: 'Đổi & huỷ vé',
  account: 'Tài khoản',
  tickets: 'Vé điện tử',
  routes: 'Tuyến đường',
  policies: 'Chính sách',
  technical: 'Kỹ thuật',
  other: 'Khác',
};
const CAT_ORDER = [
  'booking',
  'payment',
  'cancellation',
  'account',
  'tickets',
  'routes',
  'policies',
  'technical',
  'other',
];
const QUICK_TAGS = [
  'Đổi vé',
  'Hoàn tiền',
  'Trẻ em',
  'Hành lý',
  'Đặt cho người khác',
  'Huỷ chuyến',
];

const norm = (s = '') =>
  s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const FAQItem = ({ faq, open, onToggle }) => {
  const [counts, setCounts] = useState({
    helpful: faq.helpfulCount || 0,
    notHelpful: faq.notHelpfulCount || 0,
  });
  const [voted, setVoted] = useState(null);

  const vote = async (helpful) => {
    if (voted) return;
    setVoted(helpful ? 'up' : 'down');
    setCounts((c) => ({
      helpful: c.helpful + (helpful ? 1 : 0),
      notHelpful: c.notHelpful + (helpful ? 0 : 1),
    }));
    try {
      const res = await markFAQHelpful(faq._id, helpful);
      if (res?.data) {
        setCounts({
          helpful: res.data.helpfulCount,
          notHelpful: res.data.notHelpfulCount,
        });
      }
    } catch {
      setVoted(null);
      setCounts({
        helpful: faq.helpfulCount || 0,
        notHelpful: faq.notHelpfulCount || 0,
      });
      message.error('Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  };

  return (
    <div
      style={open ? { borderColor: '#E89B26' } : undefined}
      className={`rounded-xl border bg-white transition ${
        open ? '' : 'border-vxn-border'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 border-0 bg-transparent px-5 py-[18px] text-left"
      >
        <span className="text-[15px] font-medium text-vxn-ink">
          {faq.question}
        </span>
        {open ? (
          <UpOutlined style={{ fontSize: 14, color: '#E89B26' }} />
        ) : (
          <DownOutlined style={{ fontSize: 14, color: '#5E6165' }} />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="m-0 text-[14px] leading-[1.65] text-vxn-fg-2">
            {faq.answer}
          </p>
          <div className="mt-4 flex items-center gap-2.5 border-t border-vxn-border pt-3.5 text-[13px] text-vxn-fg-5">
            <span>Hữu ích?</span>
            <button
              type="button"
              onClick={() => vote(true)}
              disabled={!!voted}
              className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition ${
                voted === 'up'
                  ? 'border-vxn-saffron-400 bg-vxn-saffron-50 text-vxn-saffron-700'
                  : 'border-vxn-border bg-white text-vxn-fg-3 hover:border-vxn-saffron-400 disabled:opacity-60'
              }`}
            >
              👍 {counts.helpful}
            </button>
            <button
              type="button"
              onClick={() => vote(false)}
              disabled={!!voted}
              className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition ${
                voted === 'down'
                  ? 'border-vxn-border bg-vxn-bg-soft text-vxn-fg-2'
                  : 'border-vxn-border bg-white text-vxn-fg-3 hover:border-vxn-fg-4 disabled:opacity-60'
              }`}
            >
              👎 {counts.notHelpful}
            </button>
            {voted && (
              <span className="ml-auto text-[12px] text-vxn-fg-4">
                Cảm ơn phản hồi của bạn
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FAQPage = () => {
  const navigate = useNavigate();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getFAQs();
        if (cancelled) return;
        const list = res?.data?.faqs || [];
        setFaqs(list);
        const firstCat = CAT_ORDER.find((k) =>
          list.some((f) => f.category === k)
        );
        setActiveCat(firstCat || null);
      } catch (err) {
        console.error('Load FAQs failed:', err);
        if (!cancelled)
          message.error('Không thể tải câu hỏi thường gặp. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const counts = faqs.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});
    return CAT_ORDER.filter((k) => counts[k]).map((k) => ({
      key: k,
      label: FAQ_CAT_LABELS[k],
      count: counts[k],
    }));
  }, [faqs]);

  const searching = search.trim().length > 0;

  const visible = useMemo(() => {
    let list;
    if (searching) {
      const q = norm(search.trim());
      list = faqs.filter(
        (f) => norm(f.question).includes(q) || norm(f.answer).includes(q)
      );
    } else {
      list = faqs.filter((f) => f.category === activeCat);
    }
    return [...list].sort(
      (a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0)
    );
  }, [faqs, activeCat, search, searching]);

  const headerLabel = searching
    ? `Kết quả tìm kiếm · ${visible.length} câu hỏi`
    : `${FAQ_CAT_LABELS[activeCat] || ''} · ${visible.length} câu hỏi`;

  return (
    <CustomerShell activeKey="faq">
      {/* Breadcrumb */}
      <div className="border-b border-vxn-border bg-white">
        <CustomerBreadcrumb
          className="px-4 py-3 lg:px-8"
          items={[{ label: 'Câu hỏi thường gặp' }]}
        />
      </div>

      {/* Hero */}
      <div
        className="px-4 pt-10 lg:px-8"
        style={{
          background: 'linear-gradient(180deg, #F1F3FD 0%, #fff 100%)',
        }}
      >
        <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4 text-center">
          <h1 className="m-0 text-[28px] font-semibold tracking-tight text-vxn-ink sm:text-[36px]">
            VXN giúp gì được cho bạn?
          </h1>
          <p className="m-0 text-[14px] text-vxn-fg-3 sm:text-[16px]">
            Trả lời nhanh các câu hỏi phổ biến. Không tìm thấy đáp án? Liên hệ
            CSKH để được hỗ trợ.
          </p>
          <div className="w-full">
            <Input
              allowClear
              size="large"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpenId(null);
              }}
              placeholder='Ví dụ: "đổi vé như thế nào", "trẻ em có cần vé"...'
              prefix={
                <SearchOutlined style={{ color: '#5E6165', fontSize: 18 }} />
              }
              className="vxn-faq-search !h-14 !rounded-2xl !text-[15px] !shadow-[0_10px_30px_-12px_rgba(0,40,60,0.18)]"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 pb-2">
            {QUICK_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSearch(t);
                  setOpenId(null);
                }}
                className="rounded-full border border-vxn-border bg-white px-3.5 py-1.5 text-[13px] font-medium text-vxn-fg-2 transition hover:border-vxn-teal-700 hover:text-vxn-teal-700"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-8 lg:px-8">
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-9 lg:grid-cols-[260px_1fr]">
            {/* Aside */}
            <aside className="flex flex-col gap-1 lg:sticky lg:top-4 lg:self-start">
              {categories.map((c) => {
                const on = !searching && c.key === activeCat;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setActiveCat(c.key);
                      setSearch('');
                      setOpenId(null);
                    }}
                    className={`flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-left text-[13px] transition ${
                      on
                        ? 'bg-vxn-bg-mist font-semibold text-vxn-ink'
                        : 'bg-transparent font-medium text-vxn-fg-2 hover:bg-vxn-bg-soft'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="ml-auto text-[12px] text-vxn-fg-5">
                      {c.count}
                    </span>
                  </button>
                );
              })}

              <div className="mt-4 rounded-xl border border-vxn-border bg-white p-[18px]">
                <PhoneOutlined style={{ fontSize: 22, color: '#E89B26' }} />
                <div className="mt-2 text-[14px] font-semibold text-vxn-ink">
                  Không tìm thấy?
                </div>
                <div className="mt-1 text-[12px] leading-[1.5] text-vxn-fg-3">
                  Đội ngũ CSKH sẵn sàng hỗ trợ bạn qua trang khiếu nại &amp; hỗ
                  trợ.
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/khieu-nai')}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg border border-vxn-border bg-white text-[13px] font-medium text-vxn-fg-2 transition hover:border-vxn-teal-700 hover:text-vxn-teal-700"
                >
                  Liên hệ CSKH →
                </button>
              </div>
            </aside>

            {/* Main */}
            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="m-0 text-[20px] font-semibold text-vxn-ink sm:text-[22px]">
                  {headerLabel}
                </h2>
                {!searching && visible.length > 0 && (
                  <span className="shrink-0 text-[13px] text-vxn-fg-5">
                    Sắp xếp theo hữu ích
                  </span>
                )}
              </div>

              {visible.length === 0 ? (
                <div className="rounded-2xl border border-vxn-border bg-white py-16">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="text-[13px] text-vxn-fg-4">
                        Không có câu hỏi phù hợp. Thử từ khoá khác hoặc liên hệ
                        CSKH.
                      </span>
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {visible.map((faq) => (
                    <FAQItem
                      key={faq._id}
                      faq={faq}
                      open={openId === faq._id}
                      onToggle={() =>
                        setOpenId((id) => (id === faq._id ? null : faq._id))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
};

export default FAQPage;
