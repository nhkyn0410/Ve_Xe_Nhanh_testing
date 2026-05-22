/* global React, Frame, PageTopUtility, Btn, Chip, Card, Icon, VND, OPERATORS, USER, PageHeader, vxnAccent */

// ============================================================
//  PROFILE — /my/profile
// ============================================================
function ProfileScreen() {
  return (
    <Frame active="member" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tài khoản']} />
      <PageHeader title="Tài khoản của tôi" subtitle="Quản lý thông tin cá nhân, mật khẩu, hành khách thường đi." back={false} />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px 48px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Account sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            ['Hồ sơ', 'user', true],
            ['Hành khách đã lưu', 'star', false],
            ['Bảo mật', 'shield', false],
            ['Thanh toán', 'discount', false],
            ['Thông báo', 'bell', false],
            ['Đánh giá của tôi', 'pencil', false],
            ['Hỗ trợ', 'help', false],
          ].map(([l, ic, on]) => (
            <div key={l} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              borderRadius: 10, background: on ? '#fff' : 'transparent',
              border: on ? '1px solid var(--vxn-border)' : '1px solid transparent',
              color: on ? 'var(--vxn-ink)' : 'var(--vxn-fg-3)',
              font: `${on ? 600 : 500} 13px var(--font-display)`, cursor: 'pointer',
            }}>
              <Icon name={ic} size={16} color={on ? vxnAccent() : 'var(--vxn-fg-4)'} />
              {l}
            </div>
          ))}
        </aside>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Hero card */}
          <Card padding={28} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 28, alignItems: 'center' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--vxn-saffron-500), var(--vxn-saffron-700))',
              color: '#fff', display: 'grid', placeItems: 'center',
              font: '600 36px var(--font-display)', position: 'relative',
              boxShadow: '0 8px 24px -6px rgba(232,155,38,.4)',
            }}>
              N
              <span style={{
                position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%',
                background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,.15)',
              }}><Icon name="pencil" size={13} color="var(--vxn-fg-2)" /></span>
            </div>
            <div>
              <h2 style={{ margin: 0, font: '600 24px var(--font-display)', color: 'var(--vxn-ink)' }}>{USER.fullName}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                <span><Icon name="mail" size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />{USER.email}</span>
                <span style={{ color: 'var(--vxn-border-strong)' }}>·</span>
                <span><Icon name="phone" size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />{USER.phone}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Chip tone="saffron">★ HẠNG GOLD</Chip>
                <Chip tone="success" icon="checkCircle">Email đã xác thực</Chip>
                <Chip tone="success" icon="checkCircle">SĐT đã xác thực</Chip>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Thành viên từ</div>
              <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{USER.joined}</div>
              <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 10 }}>Đã đi cùng VXN</div>
              <div style={{ font: '700 22px var(--font-display)', color: vxnAccent() }}>17 chuyến</div>
            </div>
          </Card>

          {/* Personal info */}
          <Card padding={28}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ margin: 0, font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Thông tin cá nhân</h3>
              <Btn kind="ghost" size="sm" icon="pencil">Chỉnh sửa</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Pair label="Họ và tên" value={USER.fullName} />
              <Pair label="Ngày sinh" value="14/03/1995" />
              <Pair label="Giới tính" value="Nữ" />
              <Pair label="CMND/CCCD" value="079094••••2345" />
              <Pair label="Email" value={USER.email} verified />
              <Pair label="Số điện thoại" value={USER.phone} verified />
            </div>
          </Card>

          {/* Saved passengers */}
          <Card padding={28}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Hành khách thường đi</h3>
                <p style={{ margin: '4px 0 0', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>Lưu 3/5 hành khách để đặt vé nhanh hơn lần sau.</p>
              </div>
              <Btn kind="primary" size="sm" icon="plus">Thêm hành khách</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Trần Đức Anh',   '0938 446 102', '079095••••6712', 'gold'],
                ['Nguyễn Hồng Hà', '0987 561 234', '079093••••4567', 'teal'],
                ['Lê Thanh Tùng',  '0962 113 887', '079092••••8821', 'saffron'],
              ].map(([n, p, cc, c], i) => (
                <div key={n} style={{
                  padding: 16, border: '1px solid var(--vxn-border)', borderRadius: 12,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: c === 'gold' ? '#FFE9C4' : c === 'teal' ? '#DBEAFE' : '#FFE9C4',
                    color: c === 'teal' ? 'var(--vxn-teal-700)' : 'var(--vxn-saffron-700)',
                    display: 'grid', placeItems: 'center', font: '600 14px var(--font-display)',
                  }}>{n.split(' ').slice(-1)[0][0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{n}</div>
                    <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{p} · {cc}</div>
                  </div>
                  <Icon name="pencil" size={14} color="var(--vxn-fg-4)" />
                  <Icon name="trash" size={14} color="var(--vxn-fg-4)" />
                </div>
              ))}
              <div style={{
                padding: 16, border: '1.5px dashed var(--vxn-border-strong)', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                color: 'var(--vxn-fg-4)', font: '500 13px var(--font-display)',
                background: 'var(--vxn-bg-soft)', cursor: 'pointer',
              }}>
                <Icon name="plus" size={16} />
                Còn 2 vị trí — thêm hành khách
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card padding={28}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ margin: 0, font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Bảo mật</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Mật khẩu', 'Đã đổi cách đây 4 tháng', 'Đổi mật khẩu'],
                ['Xác thực 2 lớp (2FA)', 'Bảo vệ tài khoản bằng OTP SMS', 'Bật', false],
                ['Phiên đăng nhập', '3 thiết bị đang hoạt động', 'Quản lý'],
              ].map(([t, s, btn, on]) => (
                <div key={t} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 16, borderRadius: 10, background: 'var(--vxn-bg-soft)',
                }}>
                  <div>
                    <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{t}</div>
                    <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{s}</div>
                  </div>
                  <Btn kind="ghost" size="sm">{btn}</Btn>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Frame>
  );
}

function Pair({ label, value, verified }) {
  return (
    <div>
      <div style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 15px var(--font-display)', color: 'var(--vxn-ink)' }}>
        {value}
        {verified && <Icon name="checkCircle" size={14} color="var(--vxn-success-fg)" />}
      </div>
    </div>
  );
}

// ============================================================
//  LOYALTY OVERVIEW — /my/loyalty
// ============================================================
function LoyaltyScreen() {
  const tiers = [
    { tier: 'bronze',  label: 'Bronze',   min: 0,     mult: '1.0×', disc: '0%', on: false },
    { tier: 'silver',  label: 'Silver',   min: 2000,  mult: '1.2×', disc: '5%', on: false },
    { tier: 'gold',    label: 'Gold',     min: 5000,  mult: '1.5×', disc: '10%', on: true },
    { tier: 'platinum',label: 'Platinum', min: 10000, mult: '2.0×', disc: '15%', on: false },
  ];
  const totalPts = USER.totalPoints;
  const goldPct = ((totalPts - 2000) / (5000 - 2000)) * 100;
  const goldToNextPct = ((totalPts - 5000) / (10000 - 5000)) * 100;

  return (
    <Frame active="member" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tài khoản','VXN Plus']} />
      <PageHeader title="VXN Plus — chương trình thành viên" subtitle="Tích điểm sau mỗi chuyến · 1 điểm = 1,000đ giảm." back={false} right={<Btn kind="ghost">Xem ưu đãi đối tác →</Btn>} />

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Tier hero */}
        <div style={{
          borderRadius: 18, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(110deg, #1a4054 0%, #234959 50%, #2D5A6B 100%)',
          color: '#fff', padding: '36px 36px 32px',
        }}>
          <div style={{ position: 'absolute', right: -80, top: -120, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(243,177,50,.35), transparent 65%)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 32, alignItems: 'center' }}>
            <div>
              <Chip style={{ background: 'rgba(255,255,255,.15)', color: 'var(--vxn-saffron-500)' }}>HẠNG HIỆN TẠI · GOLD</Chip>
              <h2 style={{ margin: '14px 0 6px', font: '600 36px var(--font-display)', letterSpacing: '-.02em' }}>Cảm ơn <span style={{ color: 'var(--vxn-saffron-500)' }}>{USER.fullName}</span></h2>
              <p style={{ margin: 0, font: '400 14px var(--font-display)', color: 'rgba(255,255,255,.7)', maxWidth: 480 }}>
                Bạn đang được giảm 10% mọi chuyến, tích điểm gấp 1.5×, ưu tiên CSKH. Còn 4,160 điểm để lên Platinum (giảm 15%, CSKH 24/7).
              </p>
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ font: '500 12px var(--font-display)', color: 'rgba(255,255,255,.6)', letterSpacing: '.1em' }}>ĐIỂM HIỆN CÓ</span>
                <span style={{ font: '700 48px var(--font-display)', color: '#fff', letterSpacing: '-.02em', lineHeight: 1 }}>{USER.totalPoints.toLocaleString('vi-VN')}</span>
                <span style={{ font: '500 13px var(--font-display)', color: 'rgba(255,255,255,.6)' }}>≈ {VND(USER.totalPoints * 1000)} giảm</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Btn kind="saffron" size="lg">Đổi điểm lấy ưu đãi →</Btn>
              <Btn kind="ghost" style={{ background: 'rgba(255,255,255,.95)' }}>Xem lịch sử điểm</Btn>
            </div>
          </div>
        </div>

        {/* Tier ladder */}
        <Card padding={28}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ margin: 0, font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Hạng thành viên</h3>
            <a style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Quy chế chi tiết →</a>
          </div>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div style={{ height: 8, background: 'var(--vxn-bg-fog)', borderRadius: 4, position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${Math.min(100, ((USER.totalPoints - 0) / 10000) * 100)}%`,
                background: 'linear-gradient(90deg, #B45309 0%, #94A3B8 25%, var(--vxn-saffron-600) 50%, #1F4E9E 100%)',
                borderRadius: 4,
              }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {tiers.map((t, i) => (
              <div key={t.tier} style={{
                padding: 18, borderRadius: 12,
                background: t.on ? 'linear-gradient(135deg, #FFF6E2, #FFE9C4)' : 'var(--vxn-bg-soft)',
                border: `1px solid ${t.on ? 'var(--vxn-saffron-600)' : 'var(--vxn-border)'}`,
                position: 'relative',
              }}>
                {t.on && <span style={{ position: 'absolute', top: 10, right: 10, font: '700 10px var(--font-display)', color: 'var(--vxn-saffron-700)', letterSpacing: '.06em' }}>BẠN ĐANG Ở ĐÂY</span>}
                <div style={{ font: '700 18px var(--font-display)', color: 'var(--vxn-ink)', marginBottom: 4 }}>{t.label}</div>
                <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginBottom: 12 }}>Từ {t.min.toLocaleString('vi-VN')} điểm</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)', marginBottom: 4 }}>
                  <span>Hệ số điểm</span><strong style={{ color: 'var(--vxn-ink)' }}>{t.mult}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                  <span>Giảm giá</span><strong style={{ color: 'var(--vxn-ink)' }}>{t.disc}</strong>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
          {/* Benefits */}
          <Card padding={28}>
            <h3 style={{ margin: '0 0 18px', font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Ưu đãi Gold của bạn</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['discount', 'Giảm 10% mọi chuyến', 'Áp dụng tự động khi đặt'],
                ['star',     'Tích điểm 1.5×',     'Mọi chuyến đi'],
                ['phone',    'CSKH ưu tiên',        'Tổng đài riêng 1800 8888'],
                ['shield',   'Hoàn 100% phí huỷ',   'Áp dụng cho 2 vé/tháng'],
              ].map(([ic, t, s]) => (
                <div key={t} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 10, background: 'var(--vxn-bg-soft)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={ic} size={16} color="var(--vxn-saffron-700)" />
                  </div>
                  <div>
                    <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{t}</div>
                    <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Expiring */}
          <Card padding={28}>
            <h3 style={{ margin: '0 0 14px', font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>Điểm sắp hết hạn</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[[200, '30/06/2026'],[140, '15/07/2026'],[80, '02/08/2026']].map(([p, d]) => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--vxn-warning-bg)', borderRadius: 8 }}>
                  <Icon name="clock" size={16} color="var(--vxn-warning-fg)" />
                  <span style={{ font: '600 13px var(--font-display)', color: 'var(--vxn-warning-fg)' }}>{p} điểm</span>
                  <span style={{ marginLeft: 'auto', font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>Hết hạn {d}</span>
                </div>
              ))}
            </div>
            <Btn kind="primary" style={{ marginTop: 14, width: '100%' }}>Đổi ngay 420 điểm</Btn>
          </Card>
        </div>

      </div>
    </Frame>
  );
}

// ============================================================
//  LOYALTY HISTORY — /my/loyalty/history
// ============================================================
function LoyaltyHistoryScreen() {
  const txs = [
    ['+ 240', 'Chuyến HCM → Đà Lạt', 'VXN-XY4M-0238', '24/04/2026', 'earn'],
    ['− 100', 'Đổi voucher 100,000đ', 'VOUCHER-21401', '20/04/2026', 'redeem'],
    ['+ 180', 'Chuyến Hà Nội → Hải Phòng', 'VXN-AB7K-2124', '15/04/2026', 'earn'],
    ['+ 60',  'Đánh giá chuyến đi', 'REVIEW-9821', '15/04/2026', 'earn'],
    ['− 200', 'Hết hạn (200 điểm)', '—', '01/04/2026', 'expire'],
    ['+ 320', 'Chuyến HCM → Vũng Tàu', 'VXN-LM2P-7621', '28/03/2026', 'earn'],
  ];
  return (
    <Frame active="member" signedIn>
      <PageTopUtility crumbs={['Trang chủ','VXN Plus','Lịch sử điểm']} />
      <PageHeader title="Lịch sử điểm" subtitle="Mọi giao dịch tích, đổi & hết hạn điểm thành viên." />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            ['ĐIỂM HIỆN CÓ', '5,840', 'Có giá trị đến 12/2027', vxnAccent()],
            ['ĐÃ TÍCH', '+ 8,920', 'Trong 12 tháng', 'var(--vxn-success-fg)'],
            ['ĐÃ ĐỔI', '− 2,880', 'Trong 12 tháng', 'var(--vxn-saffron-700)'],
            ['HẾT HẠN', '− 200', 'Trong 12 tháng', 'var(--vxn-fg-4)'],
          ].map(([l, v, s, c]) => (
            <div key={l} style={{ padding: 20, background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12 }}>
              <div style={{ font: '500 11px var(--font-display)', color: 'var(--vxn-fg-5)', letterSpacing: '.06em' }}>{l}</div>
              <div style={{ font: '700 26px var(--font-display)', color: c, marginTop: 6, letterSpacing: '-.01em' }}>{v}</div>
              <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 4 }}>{s}</div>
            </div>
          ))}
        </div>

        <Card padding={0}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 24px', borderBottom: '1px solid var(--vxn-border)' }}>
            {['Tất cả (124)','Tích điểm (78)','Đổi điểm (42)','Hết hạn (4)'].map((l, i) => (
              <button key={l} style={{
                padding: '6px 14px', borderRadius: 8, border: 0, cursor: 'pointer',
                background: i === 0 ? 'var(--vxn-bg-mist)' : 'transparent',
                color: i === 0 ? 'var(--vxn-ink)' : 'var(--vxn-fg-3)',
                font: `${i === 0 ? 600 : 500} 13px var(--font-display)`,
              }}>{l}</button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
              <Icon name="calendar" size={14} />
              12 tháng gần đây
              <Icon name="chevDown" size={12} />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: '400 14px var(--font-display)' }}>
            <thead>
              <tr style={{ background: 'var(--vxn-bg-soft)' }}>
                {['ĐIỂM','MÔ TẢ','THAM CHIẾU','NGÀY','LOẠI'].map((h, i) => (
                  <th key={h} style={{
                    padding: '12px 24px', textAlign: i === 0 ? 'right' : 'left',
                    font: '500 11px var(--font-display)', color: 'var(--vxn-fg-5)',
                    letterSpacing: '.08em', borderBottom: '1px solid var(--vxn-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map(([p, t, ref, d, kind], i) => (
                <tr key={i}>
                  <td style={{ padding: '14px 24px', textAlign: 'right', borderBottom: '1px solid var(--vxn-border)',
                    font: '600 16px var(--font-mono)',
                    color: kind === 'earn' ? 'var(--vxn-success-fg)' : kind === 'redeem' ? 'var(--vxn-saffron-700)' : 'var(--vxn-fg-4)',
                  }}>{p}</td>
                  <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--vxn-border)', color: 'var(--vxn-ink)' }}>{t}</td>
                  <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--vxn-border)', color: 'var(--vxn-fg-3)', font: '400 13px var(--font-mono)' }}>{ref}</td>
                  <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--vxn-border)', color: 'var(--vxn-fg-3)' }}>{d}</td>
                  <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--vxn-border)' }}>
                    <Chip tone={kind === 'earn' ? 'success' : kind === 'redeem' ? 'saffron' : 'neutral'}>
                      {kind === 'earn' ? 'Tích điểm' : kind === 'redeem' ? 'Đổi điểm' : 'Hết hạn'}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Frame>
  );
}

// ============================================================
//  COMPLAINTS — /my/complaints + detail in same view
// ============================================================
function ComplaintsScreen() {
  return (
    <Frame active="member" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tài khoản','Khiếu nại']} />
      <PageHeader title="Khiếu nại của tôi" subtitle="Theo dõi xử lý phản hồi, gửi khiếu nại mới khi cần." right={<Btn kind="primary" icon="plus">Gửi khiếu nại</Btn>} />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px 48px', display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['#KN-8821', 'Xe đến trễ 35 phút', 'Hà Linh Express · 02/05', 'in_progress', true],
            ['#KN-8702', 'Hoàn tiền chậm sau khi huỷ', 'Phương Nam · 28/04', 'resolved', false],
            ['#KN-8521', 'Tài xế hút thuốc trên xe', 'Hoàng Long · 22/04', 'resolved', false],
            ['#KN-8302', 'Sai sơ đồ ghế trên app', 'VXN · 19/04', 'closed', false],
            ['#KN-7912', 'Thái độ phục vụ tại bến', 'Tâm Hạnh · 14/04', 'rejected', false],
          ].map(([id, t, m, s, on]) => (
            <div key={id} style={{
              padding: 16, background: '#fff', borderRadius: 12,
              border: `1px solid ${on ? vxnAccent() : 'var(--vxn-border)'}`,
              cursor: 'pointer', boxShadow: on ? '0 8px 20px -8px rgba(0,100,129,.18)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ font: '500 12px var(--font-mono)', color: 'var(--vxn-fg-4)' }}>{id}</span>
                <ComplaintChip status={s} />
              </div>
              <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)', marginBottom: 4 }}>{t}</div>
              <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{m}</div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding={24}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, font: '600 22px var(--font-display)', color: 'var(--vxn-ink)' }}>Xe đến trễ 35 phút</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                  <span>#KN-8821</span>
                  <span style={{ color: 'var(--vxn-border-strong)' }}>·</span>
                  <span>Tạo lúc 02/05/2026, 15:42</span>
                  <span style={{ color: 'var(--vxn-border-strong)' }}>·</span>
                  <span>Liên quan vé <strong style={{ color: 'var(--vxn-ink)', fontFamily: 'var(--font-mono)' }}>VXN-AB7K-2401</strong></span>
                </div>
              </div>
              <ComplaintChip status="in_progress" size="lg" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: '14px 0', borderTop: '1px solid var(--vxn-border)', borderBottom: '1px solid var(--vxn-border)' }}>
              {[
                ['NHÀ XE','Hà Linh Express'],
                ['CHUYẾN','Hà Nội → Hải Phòng'],
                ['DANH MỤC','Dịch vụ'],
                ['MỨC ĐỘ','Medium'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ font: '500 10px var(--font-display)', color: 'var(--vxn-fg-5)', letterSpacing: '.08em' }}>{l}</div>
                  <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)', marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
            <p style={{ margin: '16px 0 0', font: '400 14px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.6 }}>
              Tôi đặt vé chuyến 06:00 ngày 02/05 nhưng xe khởi hành lúc 06:35, gây trễ kế hoạch công việc. Mong nhà xe phản hồi và bồi thường phần phí dịch vụ.
            </p>
          </Card>

          <Card padding={24}>
            <h3 style={{ margin: '0 0 14px', font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Dòng thời gian xử lý</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 20, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'var(--vxn-bg-fog)' }} />
              {[
                ['02/05 · 15:42', 'Khách hàng tạo khiếu nại', 'Nguyễn Minh Châu', 'customer', false],
                ['02/05 · 16:15', 'CSKH tiếp nhận, chuyển nhà xe', 'Trần Hữu Nam · VXN', 'admin', false],
                ['03/05 · 09:30', 'Nhà xe phản hồi: xác nhận chậm 32 phút do tắc đường khu vực Cầu Giấy. Đề xuất voucher 100,000đ cho chuyến tiếp theo.', 'Hà Linh Express', 'admin', false],
                ['Đang chờ', 'Khách hàng xác nhận giải pháp', '', 'pending', true],
              ].map(([d, body, by, kind, pending], i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: -20, top: 4, width: 16, height: 16, borderRadius: '50%',
                    background: pending ? '#fff' : kind === 'customer' ? vxnAccent() : 'var(--vxn-success-fg)',
                    border: `2px solid ${pending ? 'var(--vxn-border-strong)' : kind === 'customer' ? vxnAccent() : 'var(--vxn-success-fg)'}`,
                  }} />
                  <div style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{d}</div>
                  <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)', marginTop: 2, lineHeight: 1.5 }}>{body}</div>
                  {by && <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{by}</div>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: 16, border: '1px solid var(--vxn-border)', borderRadius: 10 }}>
              <div style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-fg-3)', marginBottom: 8 }}>Phản hồi của bạn</div>
              <div style={{ padding: 12, background: 'var(--vxn-bg-soft)', borderRadius: 8, color: 'var(--vxn-fg-disabled)', font: '400 13px var(--font-display)', minHeight: 60 }}>
                Nhập phản hồi tại đây...
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Btn kind="ghost" size="sm" icon="add">Đính kèm</Btn>
                <Btn kind="primary" size="sm" style={{ marginLeft: 'auto' }}>Gửi phản hồi</Btn>
                <Btn kind="saffron" size="sm">Chấp nhận giải pháp</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Frame>
  );
}

function ComplaintChip({ status, size }) {
  const cfg = {
    open:         ['teal', 'Mới mở'],
    in_progress:  ['warning', 'Đang xử lý'],
    resolved:     ['success', 'Đã giải quyết'],
    closed:       ['neutral', 'Đã đóng'],
    rejected:     ['danger', 'Từ chối'],
  }[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: size === 'lg' ? '6px 14px' : '4px 10px',
      borderRadius: 999, background: `var(--vxn-${cfg[0]}-bg)`,
      color: `var(--vxn-${cfg[0]}-fg)`, font: `500 ${size === 'lg' ? 13 : 11}px var(--font-display)`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: `var(--vxn-${cfg[0]}-fg)` }} />
      {cfg[1]}
    </span>
  );
}

// ============================================================
//  REVIEWS — /my/reviews
// ============================================================
function ReviewsScreen() {
  return (
    <Frame active="member" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tài khoản','Đánh giá của tôi']} />
      <PageHeader title="Đánh giá của tôi" subtitle="14 đánh giá đã viết · giúp người sau lựa chọn nhà xe tốt nhất." />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Awaiting review */}
        <Card padding={24} style={{ background: 'linear-gradient(110deg, #FFF6E2, #FFE9C4)', border: '1px solid #F2C677' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="star" size={28} color="var(--vxn-saffron-700)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>2 chuyến đang chờ đánh giá</div>
              <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)', marginTop: 2 }}>Nhận 30 điểm bonus / chuyến khi đánh giá trong 7 ngày sau chuyến đi.</div>
            </div>
            <Btn kind="saffron">Viết đánh giá</Btn>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['HCM → Đà Lạt', 'Hoàng Long Coach', '24/04/2026', 5, 'Xe sạch sẽ, tài xế chạy êm, nhân viên gọi điện báo trước 15 phút. Lần sau sẽ đi tiếp.', true],
            ['Hà Nội → Hải Phòng', 'Hà Linh Express', '15/04/2026', 4, 'OK nhưng xe đến trễ 20 phút. Tiện ích đầy đủ, có sạc Type-C.', false],
            ['HCM → Vũng Tàu', 'Phương Nam Travel', '28/03/2026', 5, 'Đi cùng gia đình, mọi người đều hài lòng. Cabin rộng rãi.', false],
            ['Đà Nẵng → Huế', 'Mai Hương Sleeper', '12/03/2026', 3, 'Xe cũ hơn dự kiến, máy lạnh không đều. Nhưng tài xế thân thiện.', true],
          ].map(([route, op, d, r, body, hasResponse], i) => (
            <Card key={i} padding={22}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ font: '600 15px var(--font-display)', color: 'var(--vxn-ink)' }}>{route}</div>
                  <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{op} · {d}</div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => (
                    <Icon key={s} name="star" size={14} color={s <= r ? 'var(--vxn-saffron-500)' : 'var(--vxn-border-strong)'} />
                  ))}
                </div>
              </div>
              <p style={{ margin: 0, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.55 }}>{body}</p>
              {hasResponse && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--vxn-bg-soft)', borderRadius: 8, borderLeft: `3px solid ${vxnAccent()}` }}>
                  <div style={{ font: '500 12px var(--font-display)', color: vxnAccent(), marginBottom: 4 }}>{op} phản hồi</div>
                  <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.5 }}>Cảm ơn anh chị đã chia sẻ. Chúng tôi đã ghi nhận và sẽ cải thiện trong chuyến tiếp theo.</div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
                <span><Icon name="heart" size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{Math.floor(Math.random()*24+3)} hữu ích</span>
                <span style={{ marginLeft: 'auto' }}><a style={{ color: 'var(--vxn-teal-800)', font: '500 12px var(--font-display)' }}>Chỉnh sửa</a></span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Frame>
  );
}

Object.assign(window, { ProfileScreen, LoyaltyScreen, LoyaltyHistoryScreen, ComplaintsScreen, ReviewsScreen });
