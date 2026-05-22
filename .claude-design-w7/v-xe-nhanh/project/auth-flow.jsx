/* global React, Frame, Btn, Card, Icon, Chip, vxnAccent */

// ============================================================
//  AUTH SHELL — full-bleed split-screen
// ============================================================
function AuthShell({ side, children }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff' }}>
      <div style={{ padding: '48px 64px', display: 'flex', flexDirection: 'column', gap: 28, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--vxn-teal-700)', display: 'grid', placeItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 19 12 4l9 15M8 13l4-6 4 6M12 7v12" stroke="var(--vxn-saffron-500)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ font: '700 13px var(--font-display)', color: 'var(--vxn-saffron-700)', lineHeight: 1, letterSpacing: '.04em' }}>VÉ XE</span>
            <span style={{ font: '700 13px var(--font-display)', color: 'var(--vxn-ink)', lineHeight: 1.2, letterSpacing: '.06em' }}>NHANH</span>
          </div>
        </div>
        {children}
        <div style={{ position: 'absolute', bottom: 32, left: 64, right: 64, font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 Vé Xe Nhanh JSC</span>
          <span><a style={{ color: 'var(--vxn-fg-3)' }}>Điều khoản</a> · <a style={{ color: 'var(--vxn-fg-3)' }}>Quyền riêng tư</a></span>
        </div>
      </div>
      <div style={{
        position: 'relative', overflow: 'hidden',
        backgroundImage: `linear-gradient(135deg, rgba(0,71,107,.4) 0%, rgba(0,40,60,.65) 100%), url(${window.__resources?.heroLandscape || 'design-system/assets/hero-landscape.jpg'})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ padding: '48px 56px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
          <Chip tone="saffron" style={{ alignSelf: 'flex-start' }}>{side?.eyebrow || 'VXN PLUS · GOLD'}</Chip>
          <div>
            <h2 style={{ margin: 0, font: '600 38px var(--font-display)', maxWidth: 480, letterSpacing: '-.02em', lineHeight: 1.15 }}>
              {side?.headline || 'Đặt một lần, đi tiếp 17 chuyến năm sau.'}
            </h2>
            <p style={{ margin: '14px 0 32px', font: '400 16px var(--font-display)', color: 'rgba(255,255,255,.85)', maxWidth: 460, lineHeight: 1.5 }}>
              {side?.body || 'Tích điểm sau mỗi chuyến đi, đổi lấy ưu đãi. Khách hàng Gold đang được giảm 10% mọi chuyến.'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {(side?.stats || [['218','nhà xe đối tác'],['5,400','chuyến mỗi ngày'],['1.2M+','khách năm 2025']]).map(([n, l]) => (
                <div key={l} style={{ padding: '14px 18px', background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(8px)', borderRadius: 12 }}>
                  <div style={{ font: '700 22px var(--font-display)', color: 'var(--vxn-saffron-500)' }}>{n}</div>
                  <div style={{ font: '400 12px var(--font-display)', color: 'rgba(255,255,255,.75)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, value, placeholder, icon, type, hint, error, empty }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, height: 52,
        padding: '0 16px',
        border: `1.5px solid ${error ? 'var(--vxn-danger-fg)' : value ? vxnAccent() : 'var(--vxn-border)'}`,
        borderRadius: 10, background: '#fff',
      }}>
        <Icon name={icon} size={18} color={value ? vxnAccent() : 'var(--vxn-fg-4)'} />
        <span style={{ flex: 1, font: '500 15px var(--font-display)', color: empty ? 'var(--vxn-fg-disabled)' : 'var(--vxn-ink)' }}>{value || placeholder}</span>
        {type === 'password' && <Icon name="eye" size={16} color="var(--vxn-fg-4)" />}
      </div>
      {(hint || error) && <span style={{ font: '400 12px var(--font-display)', color: error ? 'var(--vxn-danger-fg)' : 'var(--vxn-fg-5)' }}>{error || hint}</span>}
    </label>
  );
}

// ============================================================
//  LOGIN
// ============================================================
function LoginScreen() {
  return (
    <AuthShell side={{
      eyebrow: 'HẠNG THÀNH VIÊN · GOLD',
      headline: 'Chào mừng trở lại.',
      body: 'Đăng nhập để tích điểm, đặt vé nhanh và theo dõi mọi chuyến đi.',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 420 }}>
        <h1 style={{ margin: 0, font: '600 32px var(--font-display)', color: 'var(--vxn-ink)', letterSpacing: '-.02em' }}>Đăng nhập</h1>
        <p style={{ margin: '8px 0 28px', font: '400 14px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
          Chưa có tài khoản? <a style={{ color: 'var(--vxn-teal-800)', font: '500 14px var(--font-display)' }}>Đăng ký miễn phí →</a>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FieldInput label="Email hoặc số điện thoại" value="minhchau@email.com" icon="mail" />
          <FieldInput label="Mật khẩu" value="••••••••••••" icon="shield" type="password" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: vxnAccent(), display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={11} color="#fff" />
              </span>
              Ghi nhớ đăng nhập
            </label>
            <a style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Quên mật khẩu?</a>
          </div>
          <Btn kind="primary" size="lg" style={{ width: '100%', marginTop: 8 }}>Đăng nhập</Btn>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0', color: 'var(--vxn-fg-5)', font: '400 12px var(--font-display)' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--vxn-border)' }} />
          HOẶC TIẾP TỤC VỚI
          <span style={{ flex: 1, height: 1, background: 'var(--vxn-border)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            ['Google', '#4285F4', 'G'],
            ['Apple', '#000', ''],
            ['Facebook', '#1877F2', 'f'],
          ].map(([n, c, g]) => (
            <button key={n} style={{
              height: 48, background: '#fff', border: '1px solid var(--vxn-border)',
              borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)',
            }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: c, color: '#fff', display: 'grid', placeItems: 'center', font: '700 13px var(--font-display)' }}>{g}</span>
              {n}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: 14, background: 'var(--vxn-bg-soft)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="qr" size={18} color={vxnAccent()} />
          <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)', lineHeight: 1.5 }}>
            Đặt vé khách không cần tài khoản? <a style={{ color: 'var(--vxn-teal-800)', font: '500 12px var(--font-display)' }}>Tra cứu vé bằng OTP →</a>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

// ============================================================
//  REGISTER
// ============================================================
function RegisterScreen() {
  return (
    <AuthShell side={{
      eyebrow: 'NHẬN 100 ĐIỂM CHÀO MỪNG',
      headline: 'Đăng ký miễn phí.',
      body: '100 điểm tặng đầu tiên ≈ giảm 100,000đ cho chuyến đầu tiên. Tích điểm tự động sau mỗi chuyến.',
      stats: [['100','điểm tặng'],['5%','giảm Silver'],['1','phút đăng ký']],
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480 }}>
        <h1 style={{ margin: 0, font: '600 32px var(--font-display)', color: 'var(--vxn-ink)', letterSpacing: '-.02em' }}>Tạo tài khoản VXN</h1>
        <p style={{ margin: '8px 0 24px', font: '400 14px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
          Đã có tài khoản? <a style={{ color: 'var(--vxn-teal-800)', font: '500 14px var(--font-display)' }}>Đăng nhập →</a>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FieldInput label="Họ và tên" value="Nguyễn Minh Châu" icon="user" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldInput label="Email" value="minhchau@email.com" icon="mail" />
            <FieldInput label="Số điện thoại" value="0901 234 567" icon="phone" />
          </div>
          <FieldInput label="Mật khẩu" value="••••••••••••" icon="shield" type="password" hint="Tối thiểu 8 ký tự · gồm chữ hoa & số" />
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', marginTop: 4, lineHeight: 1.5 }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, background: vxnAccent(), display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <Icon name="check" size={11} color="#fff" />
            </span>
            <span>Tôi đồng ý với <a style={{ color: 'var(--vxn-teal-800)' }}>Điều khoản dịch vụ</a> và <a style={{ color: 'var(--vxn-teal-800)' }}>Chính sách quyền riêng tư</a> của Vé Xe Nhanh.</span>
          </label>
          <Btn kind="saffron" size="lg" style={{ width: '100%', marginTop: 6 }}>
            Tạo tài khoản & nhận 100 điểm
          </Btn>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: 'var(--vxn-fg-5)', font: '400 12px var(--font-display)' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--vxn-border)' }} />
          HOẶC ĐĂNG KÝ NHANH
          <span style={{ flex: 1, height: 1, background: 'var(--vxn-border)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['Google', '#4285F4', 'G'], ['Apple', '#000', '']].map(([n, c, g]) => (
            <button key={n} style={{
              height: 48, background: '#fff', border: '1px solid var(--vxn-border)',
              borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)',
            }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: c, color: '#fff', display: 'grid', placeItems: 'center', font: '700 13px var(--font-display)' }}>{g}</span>
              Tiếp tục với {n}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

// ============================================================
//  FORGOT / RESET / VERIFY EMAIL — split into one screen with 3 states side-by-side
// ============================================================
function PasswordRecoveryScreen() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, height: '100%', background: '#fff' }}>
      <RecoveryCard
        step="1 / 3"
        title="Quên mật khẩu?"
        sub="Nhập email — chúng tôi sẽ gửi link đặt lại trong 2 phút."
        body={<>
          <FieldInput label="Email tài khoản" value="minhchau@email.com" icon="mail" />
          <Btn kind="primary" size="lg" style={{ width: '100%' }}>Gửi link đặt lại</Btn>
          <a style={{ marginTop: 6, font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)', textAlign: 'center', display: 'block' }}>← Quay lại đăng nhập</a>
        </>}
      />
      <RecoveryCard
        step="2 / 3"
        title="Đặt mật khẩu mới"
        sub="Link đã được xác thực. Hãy chọn mật khẩu mới mạnh hơn."
        body={<>
          <FieldInput label="Mật khẩu mới" value="••••••••••••" icon="shield" type="password" />
          <PasswordStrength />
          <FieldInput label="Xác nhận mật khẩu" value="••••••••••••" icon="shield" type="password" />
          <Btn kind="primary" size="lg" style={{ width: '100%' }}>Đặt lại mật khẩu</Btn>
        </>}
      />
      <RecoveryCard
        step="3 / 3"
        title="Xác thực email thành công"
        sub="Tài khoản của bạn đã được kích hoạt. Sẵn sàng đặt chuyến đầu tiên."
        success
        body={<>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: 'var(--vxn-success-bg)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="checkCircle" size={18} color="var(--vxn-success-fg)" />
              <span style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-success-fg)' }}>Email minhchau@email.com đã được xác thực</span>
            </div>
            <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-success-fg)', paddingLeft: 28 }}>+ 100 điểm chào mừng đã được cộng vào tài khoản</div>
          </div>
          <Btn kind="saffron" size="lg" style={{ width: '100%' }}>Đặt vé đầu tiên →</Btn>
          <Btn kind="ghost" style={{ width: '100%' }}>Vào trang tài khoản</Btn>
        </>}
      />
    </div>
  );
}

function RecoveryCard({ step, title, sub, body, success }) {
  return (
    <div style={{
      padding: '64px 48px', borderRight: '1px solid var(--vxn-border)',
      display: 'flex', flexDirection: 'column', gap: 24,
      background: success ? 'var(--vxn-bg-soft)' : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--vxn-teal-700)', display: 'grid', placeItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 19 12 4l9 15M8 13l4-6 4 6M12 7v12" stroke="var(--vxn-saffron-500)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <Chip tone="teal">{step}</Chip>
      </div>
      <div>
        <h1 style={{ margin: 0, font: '600 26px var(--font-display)', color: 'var(--vxn-ink)', letterSpacing: '-.01em' }}>{title}</h1>
        <p style={{ margin: '8px 0 0', font: '400 14px var(--font-display)', color: 'var(--vxn-fg-3)', lineHeight: 1.5 }}>{sub}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{body}</div>
    </div>
  );
}

function PasswordStrength() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -4 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0,1,2,3].map(i => (
          <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < 3 ? 'var(--vxn-success-fg)' : 'var(--vxn-bg-fog)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
        <span style={{ color: 'var(--vxn-success-fg)' }}>Mật khẩu mạnh</span>
        <span>12 ký tự · chữ hoa · số · ký tự đặc biệt</span>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, RegisterScreen, PasswordRecoveryScreen });
