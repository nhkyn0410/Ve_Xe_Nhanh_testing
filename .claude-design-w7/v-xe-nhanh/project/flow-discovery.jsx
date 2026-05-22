/* global React, Frame, PageTopUtility, Btn, Chip, Card, Icon, VND, OPERATORS, ROUTES_POPULAR, SAMPLE_TRIPS, USER, HeroLandscape, Amenity, PageHeader, vxnAccent */

// ============================================================
//  HOME — hero photo + overlay search card, popular routes, operators, blog teasers
// ============================================================
function HomeScreen() {
  return (
    <Frame active="buy" signedIn={false}>
      <div style={{ background: '#fff' }}>
        {/* Top utility — language + sign in chip */}
        <div style={{
          position: 'absolute', top: 20, right: 24, zIndex: 4,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, height: 36,
            padding: '0 14px', borderRadius: 999, background: 'rgba(255,255,255,.95)',
            backdropFilter: 'blur(12px)', color: 'var(--vxn-ink)',
            font: '500 14px var(--font-display)',
          }}>
            <Icon name="phone" size={14} color="var(--vxn-teal-700)" />
            CSKH 1900 6067
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, height: 36,
            padding: '0 14px', borderRadius: 999, background: 'rgba(0,71,107,.7)',
            backdropFilter: 'blur(12px)', color: '#fff',
            font: '500 13px var(--font-display)',
          }}>
            <span style={{
              width: 22, height: 14, borderRadius: 2,
              background: '#DA251D', display: 'grid', placeItems: 'center',
              color: '#FFCD00', fontSize: 10,
            }}>★</span>
            VI
            <Icon name="chevDown" size={12} />
          </div>
        </div>

        <HeroLandscape height={620}>
          {/* Top headline floating on hero */}
          <div style={{
            position: 'absolute', top: 80, left: 56, right: 56, color: '#fff',
            display: 'flex', flexDirection: 'column', gap: 12, zIndex: 2,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
              padding: '6px 14px', borderRadius: 999, background: 'rgba(232,155,38,.95)',
              color: '#fff', font: '500 12px var(--font-display)', letterSpacing: '.08em',
            }}>
              <Icon name="discount" size={12} />
              ƯU ĐÃI HÈ · GIẢM ĐẾN 35% TUYẾN MIỀN BẮC
            </span>
            <h1 style={{
              margin: 0, font: '700 56px var(--font-display)', color: '#fff',
              lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 780,
              textShadow: '0 4px 24px rgba(0,40,60,.4)',
            }}>
              Đi Việt Nam.<br/>
              <span style={{ color: 'var(--vxn-saffron-500)' }}>Nhanh hơn, gọn hơn.</span>
            </h1>
            <p style={{
              margin: 0, font: '400 18px var(--font-display)', color: 'rgba(255,255,255,.92)',
              maxWidth: 580, textShadow: '0 2px 12px rgba(0,40,60,.4)',
            }}>
              5,400+ chuyến mỗi ngày · 218 nhà xe đối tác · Tích điểm sau mỗi chuyến đi
            </p>
          </div>

          {/* Floating search card */}
          <SearchOverlayCard />
        </HeroLandscape>

        {/* Below-hero band */}
        <div style={{ height: 92 }} />

        {/* Tuyến phổ biến */}
        <section style={{ padding: '24px 56px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <span style={{
                display: 'inline-block', font: '600 12px var(--font-display)',
                letterSpacing: '.12em', color: 'var(--vxn-saffron-700)', marginBottom: 6,
              }}>TUYẾN PHỔ BIẾN</span>
              <h2 style={{ margin: 0, font: '600 28px var(--font-display)', color: 'var(--vxn-ink)', letterSpacing: '-0.01em' }}>
                Việt Nam, mọi cung đường
              </h2>
            </div>
            <a style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-teal-800)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Xem tất cả 320+ tuyến <Icon name="arrowRight" size={14} />
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 18 }}>
            <RouteCardLarge route={ROUTES_POPULAR[0]} />
            <RouteCardSmall route={ROUTES_POPULAR[1]} />
            <RouteCardSmall route={ROUTES_POPULAR[3]} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 18 }}>
            {ROUTES_POPULAR.slice(2).map(r => <RouteCardSmall key={r.from+r.to} route={r} compact />)}
          </div>
        </section>

        {/* Why Vé Xe Nhanh */}
        <section style={{ padding: '32px 56px', background: 'var(--vxn-bg-soft)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {[
              { icon: 'shield', title: 'Vé điện tử có QR', body: 'Lên xe quét QR, không cần in giấy.' },
              { icon: 'refresh', title: 'Đổi & hủy linh hoạt', body: 'Hoàn 90% trước 24h. Đổi chuyến miễn phí.' },
              { icon: 'star',   title: 'Tích điểm thân thiết', body: '1 điểm = 1,000đ giảm. Hạng Gold giảm 10%.' },
              { icon: 'phone',  title: 'Hỗ trợ 24/7',        body: 'CSKH tiếng Việt, qua app, Zalo, hotline.' },
            ].map(v => (
              <div key={v.title} style={{ display: 'flex', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: '#fff',
                  border: '1px solid var(--vxn-border)', display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Icon name={v.icon} size={22} color="var(--vxn-teal-700)" />
                </div>
                <div>
                  <div style={{ font: '600 15px var(--font-display)', color: 'var(--vxn-ink)', marginBottom: 4 }}>{v.title}</div>
                  <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)', lineHeight: 1.5 }}>{v.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Operators */}
        <section style={{ padding: '48px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, font: '600 24px var(--font-display)', color: 'var(--vxn-ink)' }}>
              Nhà xe đối tác
            </h2>
            <a style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-teal-800)' }}>
              Xem cả 218 nhà xe →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {OPERATORS.map(op => (
              <div key={op.id} style={{
                padding: 18, background: '#fff', border: '1px solid var(--vxn-border)',
                borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: op.color,
                  color: '#fff', display: 'grid', placeItems: 'center',
                  font: '700 16px var(--font-display)',
                }}>{op.short}</div>
                <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{op.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                  <Icon name="star" size={12} color="var(--vxn-saffron-600)" />
                  <strong style={{ color: 'var(--vxn-ink)' }}>{op.rating}</strong>
                  <span>· {op.reviews.toLocaleString('vi-VN')} đánh giá</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Promo + blog teaser strip */}
        <section style={{ padding: '0 56px 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
            <div style={{
              borderRadius: 16, padding: 32, position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(110deg, var(--vxn-teal-800) 0%, var(--vxn-teal-700) 60%, #034e63 100%)',
              color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 220,
            }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 240, height: 240, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(243,177,50,.3), rgba(243,177,50,0))' }} />
              <span style={{ font: '600 12px var(--font-display)', letterSpacing: '.12em', color: 'var(--vxn-saffron-500)' }}>HẠNG THÀNH VIÊN</span>
              <div>
                <h3 style={{ margin: 0, font: '600 26px var(--font-display)', maxWidth: 480 }}>
                  Đặt 10 vé, lên Gold. Giảm 10% mọi chuyến trong năm.
                </h3>
                <p style={{ margin: '8px 0 18px', font: '400 14px var(--font-display)', color: 'rgba(255,255,255,.8)' }}>
                  Tích điểm tự động sau mỗi chuyến đi. Đổi 100 điểm = 100,000đ giảm.
                </p>
                <Btn kind="saffron">Tham gia VXN Plus</Btn>
              </div>
            </div>
            <div style={{
              borderRadius: 16, padding: 24, background: '#fff', border: '1px solid var(--vxn-border)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Cẩm nang xe khách</span>
                <a style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Tin tức →</a>
              </div>
              {[
                ['Mẹo chọn ghế trên xe giường nằm', 'Hành trình'],
                ['Top 8 quán phở dọc QL1 Bắc — Trung', 'Du lịch'],
                ['Quy định mới về hành lý xe khách 2026', 'Chính sách'],
              ].map(([t, cat]) => (
                <div key={t} style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 8,
                    background: 'linear-gradient(135deg, #FDE7C2, #F9D38A)', flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)', lineHeight: 1.3 }}>{t}</div>
                    <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 4 }}>{cat}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer band */}
        <div style={{
          padding: '32px 56px 28px', background: 'var(--vxn-ink)', color: 'rgba(255,255,255,.7)',
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32,
        }}>
          <div>
            <div style={{ font: '700 18px var(--font-display)', color: 'var(--vxn-saffron-500)', marginBottom: 8 }}>VÉ XE NHANH</div>
            <p style={{ margin: 0, font: '400 13px var(--font-display)', lineHeight: 1.5, maxWidth: 320 }}>
              Nền tảng đặt vé xe khách toàn quốc. Vận hành bởi Công ty CP VXN, Quận 3, TP.HCM.
            </p>
          </div>
          {[
            ['Hỗ trợ', ['Tra cứu vé','Đổi & hủy vé','Khiếu nại','FAQ']],
            ['Về VXN', ['Giới thiệu','Tuyển dụng','Tin tức','Liên hệ']],
            ['Đối tác', ['Đăng ký nhà xe','Doanh nghiệp','API','Affiliate']],
          ].map(([h, items]) => (
            <div key={h}>
              <div style={{ font: '600 13px var(--font-display)', color: '#fff', marginBottom: 12, letterSpacing: '.02em' }}>{h}</div>
              {items.map(i => <div key={i} style={{ font: '400 13px var(--font-display)', marginBottom: 8 }}>{i}</div>)}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

// ── Floating search card on hero
function SearchOverlayCard() {
  const tw = window.VxnTweaks;
  const accent = vxnAccent(tw);
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: -64, transform: 'translateX(-50%)',
      width: 'calc(100% - 112px)', maxWidth: 1040,
      background: 'rgba(255,255,255,.98)', backdropFilter: 'blur(12px)',
      borderRadius: 16, boxShadow: '0 30px 60px -20px rgba(0,40,60,.4)',
      padding: 8, zIndex: 3, border: '1px solid rgba(255,255,255,.5)',
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--vxn-border)' }}>
        {[['buy','Mua vé','ticket'], ['lookup','Tra cứu vé','qr'], ['operators','Theo nhà xe','bus']].map(([k, l, ic], i) => (
          <button key={k} style={{
            padding: '14px 24px', border: 0, background: 'transparent', cursor: 'pointer',
            font: `${i===0?600:500} 15px var(--font-display)`,
            color: i===0 ? accent : 'var(--vxn-fg-3)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            borderBottom: i===0 ? `2px solid ${accent}` : '2px solid transparent',
            marginBottom: -1,
          }}>
            <Icon name={ic} size={16} />
            {l}
          </button>
        ))}
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 56px 1fr 1fr 1fr',
          gap: 0, alignItems: 'stretch',
          border: '1px solid var(--vxn-border)', borderRadius: 12,
          overflow: 'hidden',
        }}>
          <SearchField icon="markerDep" label="Điểm đi" value="Hà Nội" hint="BX Mỹ Đình · Giáp Bát" />
          <div style={{ display: 'grid', placeItems: 'center', borderRight: '1px solid var(--vxn-border)', background: '#fff' }}>
            <button style={{
              width: 38, height: 38, borderRadius: 999, border: '1px solid var(--vxn-border)',
              background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center',
            }}>
              <Icon name="swap" size={16} color="var(--vxn-fg-2)" />
            </button>
          </div>
          <SearchField icon="markerArr" label="Điểm đến" value="Sapa" hint="TT Sapa · Cầu Mây" />
          <SearchField icon="calendar" label="Ngày đi" value="T6, 15/05" hint="Còn 142 chuyến" />
          <SearchField icon="user" label="Số khách" value="2 người lớn" hint="Tối đa 9 vé/đặt" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip tone="saffron" icon="discount">MÃ HE2026 · GIẢM 12%</Chip>
            <Chip tone="neutral" icon="bag">HÀNH LÝ TRẢ TRƯỚC</Chip>
            <Chip tone="neutral" icon="refresh">ĐỔI/HỦY MIỄN PHÍ</Chip>
          </div>
          <Btn kind="primary" size="lg" icon="search" style={{ height: 52, padding: '0 36px', font: '600 16px var(--font-display)' }}>
            Tìm chuyến
          </Btn>
        </div>
      </div>
    </div>
  );
}

function SearchField({ icon, label, value, hint }) {
  return (
    <div style={{
      padding: '14px 20px', background: '#fff',
      borderRight: '1px solid var(--vxn-border)',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 12px var(--font-display)', color: 'var(--vxn-fg-4)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
        <Icon name={icon} size={12} color="var(--vxn-teal-700)" />
        {label}
      </div>
      <div style={{ font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>{value}</div>
      <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{hint}</div>
    </div>
  );
}

function RouteCardLarge({ route }) {
  return (
    <div style={{
      borderRadius: 16, position: 'relative', overflow: 'hidden', minHeight: 280,
      backgroundImage: `linear-gradient(180deg, rgba(0,40,60,.1) 0%, rgba(0,40,60,.75) 100%), url(${window.__resources?.heroLandscape || 'design-system/assets/hero-landscape.jpg'})`,
      backgroundSize: 'cover', backgroundPosition: '40% 45%',
      color: '#fff', padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Chip tone="saffron" style={{ padding: '5px 12px', fontSize: 11 }}>NỔI BẬT</Chip>
        <Chip tone="ink" style={{ padding: '5px 12px', fontSize: 11, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(8px)' }}>
          <Icon name="star" size={11} color="var(--vxn-saffron-500)" /> 4.8
        </Chip>
      </div>
      <div>
        <div style={{ font: '500 14px var(--font-display)', color: 'rgba(255,255,255,.85)', marginBottom: 4 }}>{route.km} km · {route.hours} · giường nằm & limousine</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
          <span style={{ font: '700 30px var(--font-display)', letterSpacing: '-0.02em' }}>{route.from}</span>
          <Icon name="arrowRight" size={20} color="var(--vxn-saffron-500)" />
          <span style={{ font: '700 30px var(--font-display)', letterSpacing: '-0.02em' }}>{route.to}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '400 12px var(--font-display)', color: 'rgba(255,255,255,.7)' }}>Từ</div>
            <div style={{ font: '700 22px var(--font-display)', color: 'var(--vxn-saffron-500)' }}>{VND(route.fromPrice)}</div>
          </div>
          <Btn kind="saffron">Đặt vé ngay <Icon name="arrowRight" size={14} /></Btn>
        </div>
      </div>
    </div>
  );
}

function RouteCardSmall({ route, compact }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12,
      padding: compact ? 16 : 20, display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12,
      minHeight: compact ? 'auto' : 130,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>
          <span>{route.from}</span>
          <Icon name="arrowRight" size={14} color="var(--vxn-fg-5)" />
          <span>{route.to}</span>
        </div>
      </div>
      <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{route.km} km · {route.hours}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <span style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Từ </span>
          <span style={{ font: '700 16px var(--font-display)', color: 'var(--vxn-saffron-700)' }}>{VND(route.fromPrice)}</span>
        </div>
        <a style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Xem chuyến →</a>
      </div>
    </div>
  );
}

// ============================================================
//  SEARCH RESULTS — /trips
// ============================================================
function SearchResultsScreen() {
  return (
    <Frame active="buy" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tìm chuyến','Hà Nội → Sapa']} />
      <SearchSummaryBar />
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, flex: 1, minHeight: 0 }}>
        <FiltersSidebar />
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
          <SortRow />
          {SAMPLE_TRIPS.map((t, i) => <TripCard key={t.id} trip={t} expanded={i === 2} />)}
        </div>
      </div>
    </Frame>
  );
}

function SearchSummaryBar() {
  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid var(--vxn-border)',
      padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 40px 1fr 1fr 1fr',
        border: '1px solid var(--vxn-border)', borderRadius: 12, overflow: 'hidden',
      }}>
        <CompactField icon="markerDep" label="Điểm đi" value="Hà Nội" />
        <div style={{ display: 'grid', placeItems: 'center', borderRight: '1px solid var(--vxn-border)', background: '#fff' }}>
          <Icon name="swap" size={14} color="var(--vxn-fg-3)" />
        </div>
        <CompactField icon="markerArr" label="Điểm đến" value="Sapa" />
        <CompactField icon="calendar" label="Ngày đi" value="T6, 15/05/2026" />
        <CompactField icon="user" label="Hành khách" value="2 người lớn" last />
      </div>
      <Btn kind="primary" icon="search">Tìm lại</Btn>
    </div>
  );
}

function CompactField({ icon, label, value, last }) {
  return (
    <div style={{
      padding: '8px 14px', background: '#fff',
      borderRight: last ? 0 : '1px solid var(--vxn-border)',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
        <Icon name={icon} size={11} color="var(--vxn-teal-700)" />
        {label}
      </div>
      <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{value}</div>
    </div>
  );
}

function FiltersSidebar() {
  return (
    <aside style={{
      background: '#fff', borderRight: '1px solid var(--vxn-border)',
      padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: 24,
      overflow: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Bộ lọc</div>
        <a style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Xóa hết</a>
      </div>

      <FilterGroup title="Khoảng giá">
        <div style={{ position: 'relative', height: 28, margin: '8px 0 12px' }}>
          <div style={{ position: 'absolute', top: 13, left: 0, right: 0, height: 4, borderRadius: 2, background: 'var(--vxn-bg-fog)' }} />
          <div style={{ position: 'absolute', top: 13, left: '18%', width: '52%', height: 4, borderRadius: 2, background: 'var(--vxn-teal-700)' }} />
          <div style={{ position: 'absolute', top: 8, left: 'calc(18% - 7px)', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '2px solid var(--vxn-teal-700)' }} />
          <div style={{ position: 'absolute', top: 8, left: 'calc(70% - 7px)', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '2px solid var(--vxn-teal-700)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
          <span>180,000đ</span>
          <span>600,000đ</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Giờ khởi hành">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['00:00 — 06:00', '34', false],
            ['06:00 — 12:00', '78', true],
            ['12:00 — 18:00', '52', false],
            ['18:00 — 24:00', '46', false],
          ].map(([t, n, on]) => (
            <div key={t} style={{
              padding: '10px 12px', borderRadius: 8,
              border: `1px solid ${on ? 'var(--vxn-teal-700)' : 'var(--vxn-border)'}`,
              background: on ? 'var(--vxn-info-bg)' : '#fff',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ font: '500 12px var(--font-display)', color: on ? 'var(--vxn-teal-900)' : 'var(--vxn-fg-2)' }}>{t}</span>
              <span style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{n} chuyến</span>
            </div>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Loại xe">
        {[
          ['Limousine 18 — 22 chỗ', 42, true],
          ['Giường nằm 40 chỗ', 78, true],
          ['Cabin VIP', 14, false],
          ['Ghế ngồi 29 chỗ', 22, false],
        ].map(([t, n, on]) => (
          <CheckRow key={t} label={t} count={n} on={on} />
        ))}
      </FilterGroup>

      <FilterGroup title="Nhà xe">
        {OPERATORS.slice(0,4).map(op => (
          <CheckRow key={op.id} label={op.name} count={Math.floor(op.fleet/2)} on={op.id==='op1'||op.id==='op3'} />
        ))}
        <a style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)', marginTop: 4 }}>+12 nhà xe khác</a>
      </FilterGroup>

      <FilterGroup title="Tiện ích">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['WiFi', 'wifi', true], ['Máy lạnh', 'ac', true], ['Sạc', 'power', true],
            ['Chăn ấm', 'shield', false], ['Toilet', 'toilet', false], ['Nước', 'water', false],
          ].map(([l, i, on]) => (
            <span key={l} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              borderRadius: 999, border: `1px solid ${on ? 'var(--vxn-teal-700)' : 'var(--vxn-border)'}`,
              background: on ? 'var(--vxn-info-bg)' : '#fff',
              color: on ? 'var(--vxn-teal-900)' : 'var(--vxn-fg-2)',
              font: '500 12px var(--font-display)',
            }}>
              <Icon name={i} size={12} />
              {l}
            </span>
          ))}
        </div>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-ink)' }}>{title}</span>
        <Icon name="chevUp" size={14} color="var(--vxn-fg-4)" />
      </div>
      {children}
    </div>
  );
}

function CheckRow({ label, count, on }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
      font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)',
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: 4,
        border: `1.5px solid ${on ? 'var(--vxn-teal-700)' : 'var(--vxn-border-strong)'}`,
        background: on ? 'var(--vxn-teal-700)' : '#fff',
        display: 'grid', placeItems: 'center',
      }}>
        {on && <Icon name="check" size={10} color="#fff" />}
      </span>
      <span style={{ flex: 1, color: on ? 'var(--vxn-ink)' : 'var(--vxn-fg-2)' }}>{label}</span>
      <span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{count}</span>
    </div>
  );
}

function SortRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12,
      padding: '12px 18px',
    }}>
      <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>
        <strong style={{ color: 'var(--vxn-teal-700)' }}>142 chuyến</strong> Hà Nội → Sapa · T6, 15/05/2026
      </div>
      <div style={{ display: 'flex', gap: 4, background: 'var(--vxn-bg-soft)', padding: 4, borderRadius: 10 }}>
        {[['Sớm nhất', true], ['Giá thấp', false], ['Đánh giá', false], ['Còn nhiều chỗ', false]].map(([l, on]) => (
          <button key={l} style={{
            padding: '6px 14px', borderRadius: 7, border: 0, cursor: 'pointer',
            background: on ? '#fff' : 'transparent',
            color: on ? 'var(--vxn-ink)' : 'var(--vxn-fg-3)',
            font: `${on?600:500} 13px var(--font-display)`,
            boxShadow: on ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip, expanded }) {
  const tw = window.VxnTweaks;
  const accent = vxnAccent(tw);
  return (
    <div style={{
      background: '#fff', border: `1px solid ${expanded ? accent : 'var(--vxn-border)'}`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: expanded ? '0 8px 24px -8px rgba(0,100,129,.18)' : 'none',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 220px', minHeight: 156 }}>
        {/* Operator block */}
        <div style={{
          background: 'var(--vxn-bg-soft)', borderRight: '1px solid var(--vxn-border)',
          padding: 20, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: trip.operator.color,
            color: '#fff', display: 'grid', placeItems: 'center', font: '700 20px var(--font-display)',
          }}>{trip.operator.short}</div>
          <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{trip.operator.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
            <Icon name="star" size={12} color="var(--vxn-saffron-600)" />
            <strong style={{ color: 'var(--vxn-ink)' }}>{trip.rating}</strong>
            <span>({trip.reviews.toLocaleString('vi-VN')})</span>
          </div>
          {trip.tag && <Chip tone="saffron" style={{ alignSelf: 'flex-start', marginTop: 2 }}>{trip.tag}</Chip>}
        </div>

        {/* Middle: time + route + amenities */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ textAlign: 'right', minWidth: 80 }}>
              <div style={{ font: '700 24px var(--font-display)', color: 'var(--vxn-ink)' }}>{trip.depart}</div>
              <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{trip.fromStation}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-4)', letterSpacing: '.04em' }}>{trip.duration}</span>
              <div style={{ position: 'relative', width: '100%', height: 2, background: 'var(--vxn-bg-fog)' }}>
                <span style={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: '50%', background: accent }} />
                <span style={{ position: 'absolute', right: -4, top: -3, width: 8, height: 8, borderRadius: '50%', background: accent }} />
              </div>
              <span style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{trip.busType}</span>
            </div>
            <div style={{ minWidth: 80 }}>
              <div style={{ font: '700 24px var(--font-display)', color: 'var(--vxn-ink)' }}>{trip.arrive}</div>
              <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{trip.toStation}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, paddingTop: 8, borderTop: '1px dashed var(--vxn-border)' }}>
            {trip.amenities.slice(0,5).map(a => <Amenity key={a} kind={a} withLabel />)}
            <span style={{ marginLeft: 'auto', font: '500 12px var(--font-display)', color: trip.seatsLeft < 5 ? 'var(--vxn-danger-fg)' : 'var(--vxn-fg-3)' }}>
              Còn <strong>{trip.seatsLeft}/{trip.totalSeats}</strong> chỗ
            </span>
          </div>
        </div>

        {/* Right: price + CTA */}
        <div style={{
          background: 'var(--vxn-bg-soft)', borderLeft: '1px solid var(--vxn-border)',
          padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 8,
        }}>
          {trip.discount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', textDecoration: 'line-through' }}>{VND(trip.basePrice)}</span>
              <Chip tone="danger" style={{ padding: '2px 8px', fontSize: 10 }}>-{trip.discount}%</Chip>
            </div>
          )}
          <div style={{ font: '700 26px var(--font-display)', color: 'var(--vxn-saffron-700)', letterSpacing: '-.01em' }}>
            {VND(trip.finalPrice)}
          </div>
          <div style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>/ vé · đã gồm thuế</div>
          <Btn kind="primary" style={{ width: '100%', marginTop: 6 }}>
            Chọn chuyến <Icon name="arrowRight" size={14} />
          </Btn>
          <a style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Xem chi tiết & sơ đồ ghế ↓</a>
        </div>
      </div>
      {expanded && (
        <div style={{
          padding: '18px 24px', borderTop: '1px solid var(--vxn-border)', background: 'var(--vxn-bg-soft)',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32,
        }}>
          <div>
            <div style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-5)', letterSpacing: '.05em', marginBottom: 8 }}>LỊCH TRÌNH</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['06:00','Hà Nội · Văn phòng Trần Duy Hưng'],['08:30','Lào Cai · Bến xe Trung tâm (nghỉ 20p)'],['11:30','Sapa · Văn phòng Cầu Mây']].map(([t, p]) => (
                <div key={t} style={{ display: 'flex', gap: 12, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
                  <span style={{ width: 48, color: 'var(--vxn-ink)', fontWeight: 600 }}>{t}</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-5)', letterSpacing: '.05em', marginBottom: 8 }}>TIỆN ÍCH ĐẦY ĐỦ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['WiFi tốc độ cao','Máy lạnh','Sạc Type-C','Chăn cá nhân','Nước uống','Khăn lạnh','Cabin riêng','Rèm cửa'].map(t => (
                <Chip key={t} tone="neutral">{t}</Chip>
              ))}
            </div>
          </div>
          <div>
            <div style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-5)', letterSpacing: '.05em', marginBottom: 8 }}>CHÍNH SÁCH</div>
            <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.6 }}>
              · Hoàn 100% trước 12h · Hoàn 90% trước 24h<br/>
              · Đổi chuyến miễn phí trước 24h<br/>
              · Trẻ em dưới 1m miễn vé
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  TRIP DETAIL — /trips/:id
// ============================================================
function TripDetailScreen() {
  const trip = SAMPLE_TRIPS[2];
  const tw = window.VxnTweaks;
  const accent = vxnAccent(tw);
  return (
    <Frame active="buy" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tìm chuyến','Hà Nội → Sapa', trip.operator.name]} />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Hero card */}
            <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 240 }}>
              <HeroLandscape height={240} overlay={false} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,40,60,.0) 30%, rgba(0,40,60,.6))',
              }} />
              <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24, color: '#fff', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <Chip tone="saffron" style={{ marginBottom: 10 }}>BÁN CHẠY · CHỈ CÒN 3 CHỖ</Chip>
                  <div style={{ font: '700 32px var(--font-display)', letterSpacing: '-.02em' }}>Hà Nội → Sapa</div>
                  <div style={{ font: '500 14px var(--font-display)', color: 'rgba(255,255,255,.85)', marginTop: 4 }}>Thứ 6, 15 tháng 5, 2026 · {trip.depart} → {trip.arrive}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Btn kind="ghost" icon="heart" style={{ background: 'rgba(255,255,255,.95)' }}>Lưu</Btn>
                  <Btn kind="ghost" icon="share" style={{ background: 'rgba(255,255,255,.95)' }}>Chia sẻ</Btn>
                </div>
              </div>
            </div>

            {/* Operator + amenities */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 14, background: trip.operator.color,
                  color: '#fff', display: 'grid', placeItems: 'center', font: '700 22px var(--font-display)',
                }}>{trip.operator.short}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 20px var(--font-display)', color: 'var(--vxn-ink)' }}>{trip.operator.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                    <Icon name="star" size={14} color="var(--vxn-saffron-600)" />
                    <strong style={{ color: 'var(--vxn-ink)' }}>{trip.operator.rating}</strong> ({trip.operator.reviews.toLocaleString('vi-VN')} đánh giá)
                    <span style={{ color: 'var(--vxn-border-strong)' }}>·</span>
                    <span>Thành lập {trip.operator.founded}</span>
                    <span style={{ color: 'var(--vxn-border-strong)' }}>·</span>
                    <span>{trip.operator.fleet} xe</span>
                  </div>
                </div>
                <Btn kind="ghost">Xem trang nhà xe →</Btn>
              </div>
              <div style={{ padding: 18, background: 'var(--vxn-bg-soft)', borderRadius: 10, font: '400 14px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.6 }}>
                {trip.operator.bio}
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <h3 style={{ margin: '0 0 16px', font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Lịch trình & điểm đón trả</h3>
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: 30 }}>
                <div style={{ position: 'absolute', left: 13, top: 12, bottom: 12, width: 2, background: 'var(--vxn-bg-fog)' }} />
                {[
                  ['08:15', 'Hà Nội · VP Trần Duy Hưng', '14 Trần Duy Hưng, Cầu Giấy', 'depart'],
                  ['09:00', 'Trạm dừng — KĐT Times City', 'Đón thêm khách', 'middle'],
                  ['11:00', 'Lào Cai · BX Trung tâm', 'Nghỉ 20 phút', 'middle'],
                  ['13:30', 'Sapa · VP Cầu Mây', 'Số 8 Cầu Mây, P. Sapa', 'arrive'],
                ].map(([t, p, sub, kind], i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: i === 3 ? 0 : 18, position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: -23, top: 4, width: 18, height: 18, borderRadius: '50%',
                      background: kind === 'middle' ? '#fff' : accent,
                      border: `2px solid ${accent}`,
                    }} />
                    <span style={{ minWidth: 50, font: '700 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{t}</span>
                    <div>
                      <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{p}</div>
                      <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Reviews */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Đánh giá khách hàng</h3>
                <a style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Xem tất cả 821 đánh giá →</a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20, background: 'var(--vxn-bg-soft)', borderRadius: 12 }}>
                  <div style={{ font: '700 48px var(--font-display)', color: 'var(--vxn-saffron-700)', lineHeight: 1 }}>4.9</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={14} color="var(--vxn-saffron-500)" />)}
                  </div>
                  <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>821 đánh giá</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[[5,724],[4,68],[3,16],[2,9],[1,4]].map(([s, n]) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                      <span style={{ minWidth: 30, color: 'var(--vxn-ink)', fontWeight: 500 }}>{s} <Icon name="star" size={11} color="var(--vxn-saffron-600)" /></span>
                      <span style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--vxn-bg-fog)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', width: `${(n/821)*100}%`, background: 'var(--vxn-saffron-500)' }} />
                      </span>
                      <span style={{ minWidth: 40, textAlign: 'right' }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                {[
                  ['Linh Phạm', 'T6, 02/05', 5, 'Cabin sạch sẽ, tài xế chạy êm, nhân viên gọi điện báo trước 15 phút. Đi cả nhà rất thoải mái.'],
                  ['Đức Anh',   'T2, 28/04', 5, 'Lần thứ 3 đi cùng Tâm Hạnh, ổn định. Có nước + khăn lạnh + chăn mỏng. Sạc Type-C ở mỗi cabin.'],
                ].map(([n, d, r, body]) => (
                  <div key={n} style={{ padding: 16, background: 'var(--vxn-bg-soft)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#DBEAFE,#fff)', display: 'grid', placeItems: 'center', font: '600 14px var(--font-display)', color: 'var(--vxn-teal-700)' }}>{n[0]}</div>
                      <div>
                        <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{n}</div>
                        <div style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{d}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
                        {Array.from({length: r}).map((_, i) => <Icon key={i} name="star" size={11} color="var(--vxn-saffron-500)" />)}
                      </div>
                    </div>
                    <p style={{ margin: 0, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.5 }}>{body}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sticky booking panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
            <Card padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', background: accent, color: '#fff' }}>
                <div style={{ font: '500 12px var(--font-display)', opacity: .85, letterSpacing: '.04em' }}>GIÁ TỪ</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ font: '700 30px var(--font-display)', letterSpacing: '-.02em' }}>{VND(trip.finalPrice)}</div>
                  <span style={{ font: '400 13px var(--font-display)', opacity: .8, textDecoration: 'line-through' }}>{VND(trip.basePrice)}</span>
                </div>
                <div style={{ font: '400 12px var(--font-display)', opacity: .85, marginTop: 4 }}>/ vé · đã gồm thuế · giảm 7% khi đặt trước</div>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SmallRow icon="calendar" label="Ngày đi" value="T6, 15/05/2026" />
                <SmallRow icon="clock" label="Khởi hành" value={`${trip.depart} → ${trip.arrive}`} />
                <SmallRow icon="bus" label="Loại xe" value={trip.busType} />
                <SmallRow icon="user" label="Hành khách" value="2 người lớn" editable />
                <Btn kind="saffron" size="lg" style={{ marginTop: 6 }}>
                  Chọn ghế (còn 3) <Icon name="arrowRight" size={16} />
                </Btn>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'var(--vxn-warning-bg)', borderRadius: 8 }}>
                  <Icon name="warning" size={16} color="var(--vxn-warning-fg)" />
                  <span style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-warning-fg)' }}>3 người khác đang xem chuyến này</span>
                </div>
              </div>
            </Card>
            <Card padding={20}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Icon name="shield" size={18} color="var(--vxn-success-leaf)" />
                <span style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>Đảm bảo của VXN</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.7 }}>
                <li>Hoàn tiền nếu nhà xe huỷ chuyến</li>
                <li>Đổi chuyến miễn phí trước 24h</li>
                <li>CSKH tiếng Việt 24/7</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function SmallRow({ icon, label, value, editable }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={16} color="var(--vxn-fg-4)" />
      <span style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', font: '600 13px var(--font-display)', color: 'var(--vxn-ink)' }}>{value}</span>
      {editable && <Icon name="pencil" size={13} color="var(--vxn-fg-4)" />}
    </div>
  );
}

Object.assign(window, { HomeScreen, SearchResultsScreen, TripDetailScreen });
