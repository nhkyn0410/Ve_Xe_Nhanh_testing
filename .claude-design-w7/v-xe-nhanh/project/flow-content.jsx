/* global React, Frame, PageTopUtility, Btn, Chip, Card, Icon, VND, OPERATORS, PageHeader, vxnAccent, HeroLandscape */

// ============================================================
//  BLOG LIST — /news
// ============================================================
const BLOG_CATEGORIES = [
  ['all', 'Tất cả', 124, true],
  ['news', 'Tin tức', 32],
  ['guide', 'Cẩm nang', 48],
  ['promotion', 'Khuyến mãi', 18],
  ['travel_tips', 'Mẹo du lịch', 22],
  ['company', 'VXN', 4],
];

const BLOG_POSTS = [
  {
    slug: 'cach-chon-ghe-giuong-nam',
    title: 'Cách chọn ghế đẹp trên xe giường nằm — chỗ nào êm nhất?',
    excerpt: 'Ghế tầng dưới — giữa xe luôn ít rung lắc nhất. Tránh hàng cuối nếu hay say xe. Cabin VIP đáng tiền với chuyến dài.',
    cat: 'Cẩm nang', date: '12/05/2026', read: 5, views: 8421,
    author: 'Phạm Linh',
  },
  {
    slug: 'top-pho-bo-doc-ql1',
    title: 'Top 8 quán phở bò trứ danh dọc QL1 Bắc — Trung',
    excerpt: 'Cát Bà, Vinh, Đông Hà, Huế — những quán phở mở 24/7 phục vụ tài xế và khách đi đường dài.',
    cat: 'Mẹo du lịch', date: '08/05/2026', read: 7, views: 12340,
    author: 'Đức Anh',
  },
  {
    slug: 'quy-dinh-hanh-ly-2026',
    title: 'Quy định mới về hành lý xe khách từ 06/2026',
    excerpt: 'Bộ GTVT vừa ban hành quy định mới về khối lượng và kích thước hành lý ký gửi. Áp dụng từ 01/06/2026.',
    cat: 'Tin tức', date: '05/05/2026', read: 3, views: 4892,
    author: 'VXN Editorial',
  },
  {
    slug: 'sapa-mua-he',
    title: 'Sapa mùa hè — 5 cung trekking nhẹ cho dân văn phòng',
    excerpt: 'Trekking 1 ngày từ trung tâm Sapa: Cát Cát, Tả Phìn, đỉnh Hàm Rồng... đi về trong ngày, không tốn sức.',
    cat: 'Mẹo du lịch', date: '03/05/2026', read: 8, views: 6210,
    author: 'Hồng Hà',
  },
  {
    slug: 'voucher-hè-2026',
    title: 'Khuyến mãi hè VXN: giảm đến 35% toàn bộ tuyến miền Bắc',
    excerpt: 'Từ 15/05 đến 31/07/2026, áp dụng cho 50,000 vé đầu tiên. Đặt sớm để chọn ghế đẹp.',
    cat: 'Khuyến mãi', date: '01/05/2026', read: 2, views: 18204,
    author: 'VXN Marketing',
  },
];

function BlogListScreen() {
  return (
    <Frame active="explore" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Cẩm nang & tin tức']} />
      <div style={{
        position: 'relative', height: 280, overflow: 'hidden',
      }}>
        <HeroLandscape height={280} />
        <div style={{
          position: 'absolute', inset: 0, padding: '48px 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: 'linear-gradient(90deg, rgba(0,30,45,.75) 0%, rgba(0,30,45,.3) 100%)',
          color: '#fff',
        }}>
          <Chip tone="saffron" style={{ alignSelf: 'flex-start', marginBottom: 14 }}>CẨM NANG & TIN TỨC</Chip>
          <h1 style={{ margin: 0, font: '600 44px var(--font-display)', letterSpacing: '-.02em', maxWidth: 720, lineHeight: 1.1 }}>
            Đi xa hơn với mỗi hành trình
          </h1>
          <p style={{ margin: '12px 0 0', font: '400 16px var(--font-display)', color: 'rgba(255,255,255,.85)', maxWidth: 540 }}>
            Mẹo chọn xe, gợi ý cung đường đẹp, ưu đãi và quy định mới từ Vé Xe Nhanh.
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '32px 56px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Category tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {BLOG_CATEGORIES.map(([k, l, n, on]) => (
            <button key={k} style={{
              padding: '8px 16px', borderRadius: 999, border: 0, cursor: 'pointer',
              background: on ? vxnAccent() : '#fff',
              color: on ? '#fff' : 'var(--vxn-fg-2)',
              border: on ? `1px solid ${vxnAccent()}` : '1px solid var(--vxn-border)',
              font: `${on ? 600 : 500} 13px var(--font-display)`,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              {l}
              <span style={{ font: '400 11px var(--font-display)', opacity: .7 }}>{n}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 36, border: '1px solid var(--vxn-border)', borderRadius: 8, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)', background: '#fff' }}>
              <Icon name="search" size={14} />Tìm bài viết...
            </div>
          </div>
        </div>

        {/* Featured */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 18 }}>
          {/* Featured large */}
          <article style={{
            borderRadius: 16, overflow: 'hidden', minHeight: 380,
            backgroundImage: `linear-gradient(180deg, rgba(0,40,60,0) 30%, rgba(0,40,60,.85)), url(${window.__resources?.heroLandscape || 'design-system/assets/hero-landscape.jpg'})`,
            backgroundSize: 'cover', backgroundPosition: '40% 50%',
            color: '#fff', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Chip tone="saffron">CẨM NANG</Chip>
              <Chip tone="ink" style={{ background: 'rgba(0,0,0,.4)' }}>BÀI NỔI BẬT</Chip>
            </div>
            <h2 style={{ margin: '0 0 12px', font: '600 30px var(--font-display)', letterSpacing: '-.01em', lineHeight: 1.15, maxWidth: 480 }}>
              {BLOG_POSTS[0].title}
            </h2>
            <p style={{ margin: 0, font: '400 14px var(--font-display)', color: 'rgba(255,255,255,.85)', maxWidth: 460, lineHeight: 1.5 }}>
              {BLOG_POSTS[0].excerpt}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, font: '400 12px var(--font-display)', color: 'rgba(255,255,255,.7)' }}>
              <span>{BLOG_POSTS[0].author}</span>
              <span>·</span>
              <span>{BLOG_POSTS[0].date}</span>
              <span>·</span>
              <span>Đọc {BLOG_POSTS[0].read} phút</span>
            </div>
          </article>

          {BLOG_POSTS.slice(1, 3).map(p => <BlogCard key={p.slug} post={p} />)}
        </div>

        {/* Below grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {BLOG_POSTS.slice(3).map(p => <BlogCard key={p.slug} post={p} />)}
          {/* Add a couple synth posts */}
          {[
            ['Xe limousine vs giường nằm — chọn loại nào?', 'Cẩm nang', '28/04/2026'],
            ['Săn vé Tết 2027 — checklist 6 bước', 'Cẩm nang', '25/04/2026'],
            ['VXN ra mắt 12 tuyến miền Tây', 'Tin tức', '22/04/2026'],
          ].map(([t, c, d]) => (
            <BlogCard key={t} post={{ title: t, excerpt: 'Đọc tiếp để biết chi tiết các điểm mới...', cat: c, date: d, read: Math.floor(Math.random()*8+3), views: Math.floor(Math.random()*5000+1000), author: 'VXN Editorial' }} />
          ))}
        </div>

        {/* Newsletter */}
        <div style={{
          padding: 36, borderRadius: 16,
          background: 'linear-gradient(110deg, var(--vxn-teal-700), var(--vxn-teal-800))',
          color: '#fff', display: 'flex', alignItems: 'center', gap: 36,
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, font: '600 22px var(--font-display)' }}>Nhận cẩm nang & ưu đãi mỗi tuần</h3>
            <p style={{ margin: '6px 0 0', font: '400 14px var(--font-display)', color: 'rgba(255,255,255,.75)' }}>Không spam · huỷ bất cứ lúc nào · trung bình 1 email/tuần.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              width: 320, padding: '0 16px', height: 44, display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,.95)', borderRadius: 10,
              font: '400 14px var(--font-display)', color: 'var(--vxn-fg-disabled)',
            }}>email@cua.ban</div>
            <Btn kind="saffron">Đăng ký</Btn>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function BlogCard({ post }) {
  return (
    <article style={{
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 14,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 170, background: 'linear-gradient(135deg, #DCE6F1 0%, #F4EFE6 50%, #FDE7C2 100%)',
        position: 'relative',
      }}>
        <span style={{ position: 'absolute', top: 14, left: 14 }}>
          <Chip tone="ink" style={{ background: 'rgba(255,255,255,.95)', color: 'var(--vxn-fg-2)' }}>{post.cat}</Chip>
        </span>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 style={{ margin: 0, font: '600 16px var(--font-display)', color: 'var(--vxn-ink)', lineHeight: 1.3 }}>{post.title}</h3>
        <p style={{ margin: 0, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 8, font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
          <span>{post.author}</span>
          <span>·</span>
          <span>{post.date}</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="eye" size={11} /> {post.views.toLocaleString('vi-VN')}
          </span>
        </div>
      </div>
    </article>
  );
}

// ============================================================
//  BLOG DETAIL — /news/:slug
// ============================================================
function BlogDetailScreen() {
  return (
    <Frame active="explore" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Cẩm nang','Cách chọn ghế đẹp']} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <article style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <Chip tone="saffron" style={{ marginBottom: 14 }}>CẨM NANG</Chip>
            <h1 style={{ margin: 0, font: '600 40px var(--font-display)', color: 'var(--vxn-ink)', letterSpacing: '-.02em', lineHeight: 1.15 }}>
              Cách chọn ghế đẹp trên xe giường nằm — chỗ nào êm nhất?
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #DBEAFE, #fff)', display: 'grid', placeItems: 'center', color: 'var(--vxn-teal-700)', font: '600 14px var(--font-display)' }}>P</div>
                <div>
                  <div style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-ink)' }}>Phạm Linh</div>
                  <div style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Biên tập viên VXN</div>
                </div>
              </div>
              <span style={{ color: 'var(--vxn-border-strong)' }}>·</span>
              <span>12/05/2026</span>
              <span style={{ color: 'var(--vxn-border-strong)' }}>·</span>
              <span>Đọc 5 phút</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <Btn kind="ghost" size="sm" icon="heart">12</Btn>
                <Btn kind="ghost" size="sm" icon="share">Chia sẻ</Btn>
              </span>
            </div>
          </div>

          <div style={{
            height: 380, borderRadius: 16, overflow: 'hidden',
            backgroundImage: `url(${window.__resources?.heroLandscape || 'design-system/assets/hero-landscape.jpg'})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />

          <div style={{ font: '500 19px var(--font-display)', color: 'var(--vxn-fg-1)', lineHeight: 1.55, letterSpacing: '-.005em' }}>
            Sau 17 năm đi xe khách dọc Bắc — Nam, tôi rút ra ba quy tắc đơn giản giúp bạn có chuyến đi êm ái nhất: chọn tầng đúng, chọn vị trí giữa, và <strong>tránh xa hàng cuối nếu bạn dễ say xe</strong>.
          </div>

          <div style={{ font: '400 16px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.75 }}>
            <h2 style={{ font: '600 26px var(--font-display)', color: 'var(--vxn-ink)', margin: '12px 0 16px' }}>1. Tầng dưới hay tầng trên?</h2>
            <p>
              Tầng dưới luôn êm hơn vì gần trục xe. Nếu bạn say xe hoặc đi chuyến đêm, hãy chọn tầng dưới — đặc biệt là các hàng từ 2 đến 5. Tầng trên có view đẹp hơn ban ngày nhưng dao động lớn hơn khi xe vào cua hoặc đường xấu.
            </p>
            <h2 style={{ font: '600 26px var(--font-display)', color: 'var(--vxn-ink)', margin: '24px 0 16px' }}>2. Tránh hàng đầu và hàng cuối</h2>
            <p>
              Hàng đầu sát kính lái — sáng đèn xe ngược chiều, hơi nóng máy. Hàng cuối thường là 5 ghế liền không có khoang riêng, lại ngay trên cầu sau nên rung lắc nhiều nhất. Các hàng giữa (3 — 5) là vùng "sweet spot".
            </p>
            <div style={{
              padding: 24, borderRadius: 12, background: 'var(--vxn-bg-soft)',
              borderLeft: `4px solid ${vxnAccent()}`, margin: '8px 0',
            }}>
              <div style={{ font: '500 13px var(--font-display)', color: vxnAccent(), letterSpacing: '.04em', marginBottom: 6 }}>MẸO NHỎ</div>
              <div style={{ font: '500 17px var(--font-display)', color: 'var(--vxn-ink)', lineHeight: 1.5 }}>
                Nếu đặt vé qua VXN, sơ đồ ghế hiển thị rõ vị trí cabin và cửa sổ. Hãy hover từng ghế để xem chú thích trước khi chọn.
              </div>
            </div>
            <h2 style={{ font: '600 26px var(--font-display)', color: 'var(--vxn-ink)', margin: '24px 0 16px' }}>3. Cabin VIP — khi nào đáng tiền?</h2>
            <p>
              Với chuyến dài trên 6 tiếng hoặc chuyến đêm, cabin VIP cá nhân (có rèm và cửa cabin) đáng để chi thêm 60 — 120k. Bạn có không gian riêng, rèm kéo lại để ngủ, và thường có sạc Type-C lẫn nước miễn phí.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, paddingTop: 18, borderTop: '1px solid var(--vxn-border)' }}>
            {['Giường nằm','Limousine','Mẹo','Cẩm nang','Sapa'].map(t => (
              <span key={t} style={{ padding: '6px 12px', borderRadius: 999, background: 'var(--vxn-bg-mist)', font: '500 12px var(--font-display)', color: 'var(--vxn-fg-2)' }}>#{t}</span>
            ))}
          </div>

          {/* Related */}
          <div style={{ marginTop: 16 }}>
            <h3 style={{ margin: '0 0 16px', font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Bài viết liên quan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {BLOG_POSTS.slice(1, 4).map(p => <BlogCard key={p.slug} post={p} />)}
            </div>
          </div>
        </article>
      </div>
    </Frame>
  );
}

// ============================================================
//  FAQ — /faq
// ============================================================
const FAQ_CATS = [
  ['booking', 'Đặt vé', 28, true],
  ['payment', 'Thanh toán', 14],
  ['cancellation', 'Đổi & huỷ vé', 12],
  ['account', 'Tài khoản', 9],
  ['tickets', 'Vé điện tử', 16],
  ['routes', 'Tuyến đường', 7],
  ['policies', 'Chính sách', 11],
  ['technical', 'Kỹ thuật', 4],
];

function FAQScreen() {
  return (
    <Frame active="explore" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Câu hỏi thường gặp']} />
      <div style={{
        padding: '40px 56px 0', background: 'linear-gradient(180deg, var(--vxn-bg-soft) 0%, #fff 100%)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ margin: 0, font: '600 36px var(--font-display)', color: 'var(--vxn-ink)', letterSpacing: '-.02em' }}>
            VXN giúp gì được cho bạn?
          </h1>
          <p style={{ margin: 0, font: '400 16px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
            Trả lời nhanh 101 câu hỏi phổ biến. Không tìm thấy đáp án? Gửi câu hỏi để CSKH trả lời trong 4 giờ.
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 60,
            background: '#fff', borderRadius: 14, border: '1px solid var(--vxn-border)',
            boxShadow: '0 10px 30px -10px rgba(0,40,60,.12)',
          }}>
            <Icon name="search" size={20} color="var(--vxn-fg-4)" />
            <span style={{ flex: 1, textAlign: 'left', font: '400 17px var(--font-display)', color: 'var(--vxn-fg-disabled)' }}>Ví dụ: "đổi vé như thế nào", "trẻ em có cần vé"...</span>
            <Btn kind="primary">Tìm</Btn>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Đổi vé','Hoàn tiền','Trẻ em','Hành lý','Đặt cho người khác','Huỷ chuyến'].map(t => (
              <span key={t} style={{ padding: '6px 14px', borderRadius: 999, background: '#fff', border: '1px solid var(--vxn-border)', font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)', cursor: 'pointer' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '40px 56px 48px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 36 }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          {FAQ_CATS.map(([k, l, n, on]) => (
            <div key={k} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
              borderRadius: 10, background: on ? 'var(--vxn-bg-mist)' : 'transparent',
              color: on ? 'var(--vxn-ink)' : 'var(--vxn-fg-2)',
              font: `${on?600:500} 13px var(--font-display)`, cursor: 'pointer',
            }}>
              <span>{l}</span>
              <span style={{ marginLeft: 'auto', font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{n}</span>
            </div>
          ))}
          <div style={{ marginTop: 18, padding: 18, background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12 }}>
            <Icon name="phone" size={22} color={vxnAccent()} />
            <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)', marginTop: 8 }}>Không tìm thấy?</div>
            <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)', marginTop: 4, lineHeight: 1.5 }}>CSKH 24/7 sẵn sàng hỗ trợ qua hotline, Zalo, email.</div>
            <Btn kind="ghost" size="sm" style={{ marginTop: 12, width: '100%' }}>Liên hệ CSKH →</Btn>
          </div>
        </aside>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ margin: 0, font: '600 22px var(--font-display)', color: 'var(--vxn-ink)' }}>Đặt vé · 28 câu hỏi</h2>
            <span style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Sắp xếp theo hữu ích</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Đặt vé qua VXN có cần đăng ký tài khoản không?', false, true, 'Bạn có thể đặt vé với tư cách khách (guest) chỉ với số điện thoại và email. Tuy nhiên, đăng ký tài khoản giúp bạn tích điểm, tra cứu vé nhanh và lưu hành khách thường đi.'],
              ['Có thể đặt vé cho người khác đi không?', false, false],
              ['Đặt vé tối đa bao nhiêu người một lần?', false, false],
              ['Vé giữ tạm thời trong bao lâu?', false, false],
              ['Trẻ em dưới 1m có cần mua vé không?', false, false],
              ['Có giảm giá cho học sinh — sinh viên không?', false, false],
              ['Đặt vé trước bao lâu thì có vé giá tốt nhất?', false, false],
            ].map(([q, open, expand, a], i) => (
              <details key={i} open={expand} style={{
                background: '#fff', border: `1px solid ${expand ? vxnAccent() : 'var(--vxn-border)'}`, borderRadius: 12,
              }}>
                <summary style={{
                  padding: '18px 22px', cursor: 'pointer', listStyle: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                }}>
                  <span style={{ font: '500 15px var(--font-display)', color: 'var(--vxn-ink)' }}>{q}</span>
                  <Icon name={expand ? 'chevUp' : 'chevDown'} size={18} color={expand ? vxnAccent() : 'var(--vxn-fg-4)'} />
                </summary>
                {expand && a && (
                  <div style={{ padding: '0 22px 20px', font: '400 14px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.65 }}>
                    <p style={{ margin: 0 }}>{a}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--vxn-border)', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
                      Hữu ích?
                      <Btn kind="ghost" size="sm">👍 142</Btn>
                      <Btn kind="ghost" size="sm">👎 4</Btn>
                      <a style={{ marginLeft: 'auto', color: 'var(--vxn-teal-800)', font: '500 13px var(--font-display)' }}>Đọc thêm về quy định khách lạ →</a>
                    </div>
                  </div>
                )}
              </details>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ============================================================
//  OPERATOR PAGE — /operators/:operatorId
// ============================================================
function OperatorScreen() {
  const op = OPERATORS[2];
  return (
    <Frame active="explore" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Nhà xe', op.name]} />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--vxn-teal-800), var(--vxn-teal-700))', color: '#fff', padding: '36px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 18, background: op.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 36px var(--font-display)' }}>{op.short}</div>
          <div style={{ flex: 1 }}>
            <Chip tone="saffron" style={{ marginBottom: 8 }}>NHÀ XE ĐỐI TÁC · ĐÃ XÁC THỰC</Chip>
            <h1 style={{ margin: 0, font: '600 32px var(--font-display)', letterSpacing: '-.01em' }}>{op.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8, font: '400 14px var(--font-display)', color: 'rgba(255,255,255,.85)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="star" size={14} color="var(--vxn-saffron-500)" />
                <strong style={{ color: '#fff' }}>{op.rating}</strong> ({op.reviews.toLocaleString('vi-VN')} đánh giá)
              </span>
              <span>Thành lập {op.founded}</span>
              <span>{op.fleet} xe</span>
              <span>14 tuyến đang khai thác</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn kind="ghost" icon="heart" style={{ background: 'rgba(255,255,255,.95)' }}>Theo dõi</Btn>
            <Btn kind="saffron" icon="ticket">Tìm chuyến của hãng</Btn>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px 48px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--vxn-border)' }}>
            {[['routes', 'Tuyến đường', true], ['fleet', 'Đội xe', false], ['reviews', 'Đánh giá', false], ['about', 'Giới thiệu', false]].map(([k, l, on]) => (
              <button key={k} style={{
                padding: '12px 20px', background: 'transparent', border: 0, cursor: 'pointer',
                borderBottom: `2px solid ${on ? vxnAccent() : 'transparent'}`,
                color: on ? 'var(--vxn-ink)' : 'var(--vxn-fg-3)',
                font: `${on?600:500} 14px var(--font-display)`,
                marginBottom: -1,
              }}>{l}</button>
            ))}
          </div>

          {/* About summary */}
          <Card padding={22}>
            <p style={{ margin: 0, font: '400 15px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.6 }}>
              {op.bio} Đội xe gồm 36 limousine cabin VIP đời 2023 — 2024, tài xế kinh nghiệm tối thiểu 5 năm tuyến Hà Nội — Sapa — Lào Cai.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              {['Limousine cabin VIP','Sạc Type-C mỗi cabin','Nước & khăn lạnh','Rèm riêng tư','TV cá nhân','WiFi miễn phí'].map(t => (
                <Chip key={t} tone="teal">{t}</Chip>
              ))}
            </div>
          </Card>

          {/* Active routes */}
          <Card padding={22}>
            <h3 style={{ margin: '0 0 14px', font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Tuyến đang chạy</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Hà Nội → Sapa', '12 chuyến/ngày', '420 — 560k'],
                ['Hà Nội → Hạ Long', '8 chuyến/ngày', '180 — 280k'],
                ['Hà Nội → Ninh Bình', '6 chuyến/ngày', '120 — 180k'],
                ['Hà Nội → Mộc Châu', '4 chuyến/ngày', '320 — 420k'],
                ['Hà Nội → Hà Giang', '2 chuyến/ngày', '480 — 620k'],
                ['Hà Nội → Cát Bà', '3 chuyến/ngày', '280 — 380k'],
              ].map(([r, n, p]) => (
                <div key={r} style={{
                  padding: 14, border: '1px solid var(--vxn-border)', borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <Icon name="bus" size={18} color={vxnAccent()} />
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{r}</div>
                    <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{n}</div>
                  </div>
                  <div style={{ font: '600 13px var(--font-display)', color: 'var(--vxn-saffron-700)' }}>{p}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reviews */}
          <Card padding={22}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Đánh giá khách hàng · {op.reviews.toLocaleString('vi-VN')}</h3>
              <Btn kind="ghost" size="sm">Lọc theo sao</Btn>
            </div>
            {[
              ['Hồng Linh', 4, '15/05/2026 · Hà Nội → Sapa', 'Lần thứ 3 đi cùng Tâm Hạnh. Cabin sạch sẽ, tài xế chạy chắc tay. Sẽ giới thiệu cho bạn bè.'],
              ['Đức Anh', 5, '02/05/2026 · Hà Nội → Hạ Long', 'Đặt vé đêm hôm trước, hôm sau khởi hành đúng giờ. Có nước, khăn lạnh, sạc Type-C. Đáng tiền.'],
            ].map(([n, r, d, body]) => (
              <div key={n} style={{ padding: '16px 0', borderTop: '1px solid var(--vxn-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#DBEAFE,#fff)', display: 'grid', placeItems: 'center', font: '600 14px var(--font-display)', color: 'var(--vxn-teal-700)' }}>{n[0]}</div>
                  <div>
                    <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{n}</div>
                    <div style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{d}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
                    {[1,2,3,4,5].map(s => <Icon key={s} name="star" size={12} color={s <= r ? 'var(--vxn-saffron-500)' : 'var(--vxn-border-strong)'} />)}
                  </div>
                </div>
                <p style={{ margin: 0, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.55 }}>{body}</p>
              </div>
            ))}
            <Btn kind="ghost" style={{ width: '100%', marginTop: 12 }}>Xem cả 5,210 đánh giá →</Btn>
          </Card>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card padding={22}>
            <h3 style={{ margin: '0 0 14px', font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Điểm đánh giá</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ font: '700 44px var(--font-display)', color: 'var(--vxn-saffron-700)', lineHeight: 1 }}>{op.rating}</div>
              <div>
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={14} color="var(--vxn-saffron-500)" />)}
                </div>
                <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 4 }}>{op.reviews.toLocaleString('vi-VN')} đánh giá</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Tài xế', 4.9],['Xe cộ', 4.8],['Đúng giờ', 4.7],['Phục vụ', 4.9]].map(([l, r]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                  <span style={{ minWidth: 56 }}>{l}</span>
                  <span style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--vxn-bg-fog)', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${r * 20}%`, background: 'var(--vxn-saffron-500)' }} />
                  </span>
                  <strong style={{ color: 'var(--vxn-ink)' }}>{r}</strong>
                </div>
              ))}
            </div>
          </Card>
          <Card padding={22}>
            <h3 style={{ margin: '0 0 14px', font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Văn phòng & hotline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
              <div><Icon name="markerDep" size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} color="var(--vxn-teal-700)" />14 Trần Duy Hưng, Cầu Giấy, Hà Nội</div>
              <div><Icon name="phone" size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} color="var(--vxn-teal-700)" />0888 123 456 (24/7)</div>
              <div><Icon name="mail" size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} color="var(--vxn-teal-700)" />cskh@tamhanh.vn</div>
            </div>
          </Card>
          <Card padding={22}>
            <h3 style={{ margin: '0 0 14px', font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Chính sách của hãng</h3>
            <ul style={{ margin: 0, paddingLeft: 18, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.7 }}>
              <li>Hoàn 100% trước 24h</li>
              <li>Đổi miễn phí trước 12h</li>
              <li>Trẻ em dưới 6 tuổi miễn vé khi ngồi cùng bố mẹ</li>
              <li>Hành lý 20kg miễn phí</li>
            </ul>
          </Card>
        </aside>
      </div>
    </Frame>
  );
}

Object.assign(window, { BlogListScreen, BlogDetailScreen, FAQScreen, OperatorScreen });
