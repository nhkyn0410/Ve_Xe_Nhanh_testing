/* global React */
// ────────────────────────────────────────────────────────────────
//  shared.jsx — Vé Xe Nhanh customer redesign
//  Sidebar, top sub-nav, icons, mock data, helpers used by every flow.
// ────────────────────────────────────────────────────────────────

// ============================================================
//  TWEAKS — defaults exposed by app.jsx; this is a fallback only
// ============================================================
window.VxnTweaks = window.VxnTweaks || {
  colorEmphasis: 'balanced',
  ticketVariant: 'boarding',
};

// Resolve primary accent color from tweak.
function vxnAccent(tw) {
  if (!tw) tw = window.VxnTweaks;
  if (tw.colorEmphasis === 'saffron') return 'var(--vxn-saffron-600)';
  if (tw.colorEmphasis === 'teal') return 'var(--vxn-teal-700)';
  return 'var(--vxn-teal-700)';  // balanced uses teal as primary
}
function vxnAccentSoft(tw) {
  if (!tw) tw = window.VxnTweaks;
  if (tw.colorEmphasis === 'saffron') return '#FFF5E5';
  return 'var(--vxn-bg-mist)';
}
function vxnAccentInk(tw) {
  if (!tw) tw = window.VxnTweaks;
  if (tw.colorEmphasis === 'saffron') return 'var(--vxn-saffron-700)';
  return 'var(--vxn-teal-900)';
}

// ============================================================
//  Icons — currentColor outlined, 24px stroke 2px
// ============================================================
function Icon({ name, size = 20, color = 'currentColor', style }) {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0, ...style }}>
      {paths}
    </svg>
  );
}

const ICONS = {
  ticket:    <><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9Z"/><path d="M9 8v8" strokeDasharray="2 2"/></>,
  map:       <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></>,
  star:      <><path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 17l-5.4 2.8 1-6L3.3 9.4l6-.9L12 3Z"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  swap:      <><path d="M7 4 3 8l4 4M3 8h14M17 14l4 4-4 4M21 18H7"/></>,
  calendar:  <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  bag:       <><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></>,
  discount:  <><path d="M21 12a3 3 0 0 0-2-2.8V6a1 1 0 0 0-1-1h-4l-2 2-2-2H6a1 1 0 0 0-1 1v3.2A3 3 0 0 0 3 12a3 3 0 0 0 2 2.8V18a1 1 0 0 0 1 1h4l2-2 2 2h4a1 1 0 0 0 1-1v-3.2A3 3 0 0 0 21 12Z"/><path d="m9 15 6-6M9 9h.01M15 15h.01"/></>,
  globe:     <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  add:       <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></>,
  markerDep: <><path d="M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></>,
  markerArr: <><path d="M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13Z"/><path d="m9 9 2 2 4-4"/></>,
  user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
  bell:      <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  help:      <><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>,
  chevDown:  <><path d="m6 9 6 6 6-6"/></>,
  chevRight: <><path d="m9 6 6 6-6 6"/></>,
  chevLeft:  <><path d="m15 6-6 6 6 6"/></>,
  chevUp:    <><path d="m6 15 6-6 6 6"/></>,
  pencil:    <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></>,
  download:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  filter:    <><path d="M3 4h18l-7 9v6l-4 2v-8L3 4Z"/></>,
  sliders:   <><path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></>,
  check:     <><path d="m5 12 5 5 9-11"/></>,
  checkCircle:<><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-7"/></>,
  x:         <><path d="M18 6 6 18M6 6l12 12"/></>,
  xCircle:   <><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></>,
  warning:   <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  clock:     <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  arrowRight:<><path d="M5 12h14M13 6l6 6-6 6"/></>,
  arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
  phone:     <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2.1Z"/></>,
  mail:      <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></>,
  bus:       <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 11h18M5 17v2M19 17v2"/><circle cx="8" cy="14" r="1.2"/><circle cx="16" cy="14" r="1.2"/></>,
  wifi:      <><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/></>,
  ac:        <><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5 5l14 14M5 19 19 5"/></>,
  power:     <><path d="M13 2 4 14h8l-1 8 9-12h-8l1-8Z"/></>,
  water:     <><path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12Z"/></>,
  tv:        <><rect x="2" y="7" width="20" height="13" rx="2"/><path d="m17 2-5 5-5-5"/></>,
  toilet:    <><path d="M9 7h6M9 7v6h6V7M9 13l-2 8M15 13l2 8"/><circle cx="12" cy="4" r="1.5"/></>,
  qr:        <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M14 20h3M20 14v3M20 20h.01M17 17v.01"/></>,
  copy:      <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  refresh:   <><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></>,
  heart:     <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></>,
  share:     <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></>,
  plus:      <><path d="M12 5v14M5 12h14"/></>,
  trash:     <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
  eye:       <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></>,
  doc:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
  shield:    <><path d="M12 2 4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3Z"/></>,
  google:    <><path d="M22 12a10 10 0 1 1-3-7l-2.8 2.8A6 6 0 1 0 18 14h-6v-3h10a10 10 0 0 1 0 1Z" fill="#4285f4" stroke="none"/></>,
  apple:     <><path d="M16 3a4 4 0 0 0-3 1.5 4 4 0 0 0-1 3 4 4 0 0 0 3-1.5 4 4 0 0 0 1-3Z M19 17a8 8 0 0 1-1.5 2.5c-1 1-2 1.5-3 1.5s-1.5-.5-3-.5-2 .5-3 .5-2-.5-3-1.5A11 11 0 0 1 3 13c0-3 2-5 4.5-5 1.5 0 2.5.5 3.5.5s2-.5 4-.5c1.5 0 3 1 4 2.5-3.5 2-3 6 0 8Z"/></>,
};

// ============================================================
//  Sidebar — fixed 256 wide, teal
// ============================================================
const SIDEBAR_NAV = [
  { key: 'explore', label: 'Khám phá',       icon: 'globe' },
  { key: 'buy',     label: 'Mua vé',          icon: 'ticket' },
  { key: 'addons',  label: 'Dịch vụ bổ trợ',  icon: 'add' },
  { key: 'trips',   label: 'Hành trình',      icon: 'map' },
  { key: 'member',  label: 'Thành viên',      icon: 'star' },
];

function Sidebar({ active = 'buy', signedIn = false, user, tweaks }) {
  const tw = tweaks || window.VxnTweaks;
  const saffronBtn = tw.colorEmphasis === 'teal' ? 'var(--vxn-teal-500)' : 'var(--vxn-saffron-600)';
  return (
    <aside style={{
      width: 256, background: 'var(--vxn-teal-700)', color: '#fff',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      flex: '0 0 256px', alignSelf: 'stretch', position: 'relative',
    }}>
      <div style={{ padding: '28px 0 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.1)',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 19 12 4l9 15M8 13l4-6 4 6M12 7v12" stroke="var(--vxn-saffron-500)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ font: '700 16px var(--font-display)', color: 'var(--vxn-saffron-500)', letterSpacing: '.02em', lineHeight: 1 }}>VÉ XE</span>
            <span style={{ font: '700 16px var(--font-display)', color: '#fff', letterSpacing: '.06em', lineHeight: 1.1 }}>NHANH</span>
          </div>
        </div>
        <div style={{ padding: '0 16px' }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,.16)' }} />
        </div>
        <nav style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SIDEBAR_NAV.map(item => {
            const on = active === item.key;
            return (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 8, background: on ? 'rgba(255,255,255,.13)' : 'transparent',
                color: '#fff', font: `${on ? 500 : 400} 15px var(--font-display)`, cursor: 'pointer',
              }}>
                <Icon name={item.icon} size={20} color="#fff" style={{ opacity: on ? 1 : .85 }} />
                <span>{item.label}</span>
                {on && <span style={{
                  marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--vxn-saffron-500)',
                }} />}
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,.16)' }} />
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: 'Tra cứu vé',   icon: 'qr' },
            { label: 'Khiếu nại',    icon: 'help' },
            { label: 'Tin tức',      icon: 'doc' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderRadius: 8, color: 'rgba(255,255,255,.78)', font: '400 14px var(--font-display)',
              cursor: 'pointer',
            }}>
              <Icon name={item.icon} size={18} color="rgba(255,255,255,.78)" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid rgba(255,255,255,.16)' }}>
        {signedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg,#F3B132,#E89B26)',
              display: 'grid', placeItems: 'center', color: '#fff',
              font: '600 16px var(--font-display)',
              boxShadow: '0 0 0 2px rgba(255,255,255,.2)',
            }}>{(user?.fullName || 'N').slice(0,1)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ font: '500 14px var(--font-display)', color: '#fff' }}>{user?.fullName || 'Nguyễn Minh'}</span>
              <span style={{ font: '400 12px var(--font-display)', color: 'rgba(255,255,255,.65)' }}>
                ★ {user?.tier || 'Gold'} · {(user?.totalPoints || 5840).toLocaleString('vi-VN')} điểm
              </span>
            </div>
          </div>
        ) : (
          <>
            <button style={{
              width: '100%', height: 42, borderRadius: 4,
              background: saffronBtn, color: '#fff', border: 0, cursor: 'pointer',
              font: '500 15px var(--font-display)',
            }}>Đăng ký</button>
            <button style={{
              width: '100%', height: 42, borderRadius: 4, background: 'transparent',
              color: '#fff', border: '1px solid rgba(255,255,255,.4)', cursor: 'pointer',
              font: '500 15px var(--font-display)',
            }}>Đăng nhập</button>
          </>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 6px 0', color: 'rgba(255,255,255,.6)',
          font: '400 12px var(--font-display)',
        }}>
          <span>v.2026 · vexenhanh.vn</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            borderRadius: 999, background: 'rgba(255,255,255,.1)', color: '#fff',
            font: '500 12px var(--font-display)',
          }}>
            <span style={{
              width: 16, height: 11, borderRadius: 1,
              background: 'linear-gradient(180deg,#DA251D,#DA251D)',
              display: 'grid', placeItems: 'center', color: '#FFCD00', fontSize: 8,
            }}>★</span>
            VI
          </span>
        </div>
      </div>
    </aside>
  );
}

// ============================================================
//  Page chrome — top utility bar
// ============================================================
function PageTopUtility({ crumbs, right, tweaks }) {
  const tw = tweaks || window.VxnTweaks;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px', borderBottom: '1px solid var(--vxn-border)',
      background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--vxn-fg-4)', font: '400 13px var(--font-display)' }}>
        {(crumbs || ['Trang chủ']).map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevRight" size={14} color="var(--vxn-fg-5)" />}
            <span style={i === (crumbs || []).length - 1 ? { color: 'var(--vxn-ink)', fontWeight: 500 } : null}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {right || (
          <>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              borderRadius: 999, background: 'var(--vxn-bg-mist)',
              color: 'var(--vxn-fg-2)', font: '500 13px var(--font-display)',
            }}>
              <Icon name="phone" size={14} color="var(--vxn-teal-700)" />
              1900 6067
            </div>
            <Icon name="bell" size={20} color="var(--vxn-fg-3)" />
            <Icon name="help" size={20} color="var(--vxn-fg-3)" />
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  Reusable primitives
// ============================================================
function Btn({ kind = 'primary', size = 'md', icon, children, style, ...rest }) {
  const tw = window.VxnTweaks;
  const accent = vxnAccent(tw);
  const heights = { sm: 32, md: 40, lg: 48 };
  const fonts = { sm: '500 13px var(--font-display)', md: '500 15px var(--font-display)', lg: '500 16px var(--font-display)' };
  const base = {
    height: heights[size], padding: size === 'sm' ? '0 14px' : '0 20px',
    borderRadius: 6, font: fonts[size], display: 'inline-flex', alignItems: 'center',
    gap: 8, justifyContent: 'center', cursor: 'pointer', border: 0,
    whiteSpace: 'nowrap',
  };
  const skins = {
    primary: { background: accent, color: '#fff', boxShadow: '0 4px 6px -4px rgba(0,100,129,.3)' },
    saffron: { background: 'var(--vxn-saffron-600)', color: '#fff' },
    ghost:   { background: 'transparent', color: 'var(--vxn-fg-2)', border: '1px solid var(--vxn-border)' },
    flat:    { background: 'var(--vxn-bg-mist)', color: 'var(--vxn-fg-1)' },
    link:    { background: 'transparent', color: 'var(--vxn-teal-800)', padding: 0, height: 'auto' },
    danger:  { background: '#fff', color: 'var(--vxn-danger-fg)', border: '1px solid var(--vxn-danger-bg)' },
  };
  return (
    <button style={{ ...base, ...skins[kind], ...style }} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

function Chip({ tone = 'neutral', icon, children, style }) {
  const tones = {
    neutral:  { bg: 'var(--vxn-bg-cloud)', fg: 'var(--vxn-fg-2)' },
    teal:     { bg: 'var(--vxn-info-bg)',  fg: 'var(--vxn-teal-900)' },
    success:  { bg: 'var(--vxn-success-bg)', fg: 'var(--vxn-success-fg)' },
    warning:  { bg: 'var(--vxn-warning-bg)', fg: 'var(--vxn-warning-fg)' },
    danger:   { bg: 'var(--vxn-danger-bg)',  fg: 'var(--vxn-danger-fg)' },
    saffron:  { bg: '#FFE9C4', fg: 'var(--vxn-saffron-700)' },
    leaf:     { bg: '#D4F5E2', fg: 'var(--vxn-success-leaf)' },
    ink:      { bg: 'var(--vxn-ink)', fg: '#fff' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999, background: t.bg, color: t.fg,
      font: '500 12px var(--font-display)', letterSpacing: '.01em',
      ...style,
    }}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

function Card({ children, style, padding = 24, ...rest }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--vxn-border)',
      borderRadius: 12, padding, ...style,
    }} {...rest}>{children}</div>
  );
}

function Field({ label, value, placeholder, icon, hint, error, style, big }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <span style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>{label}</span>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: big ? 56 : 44, padding: big ? '0 18px' : '0 14px',
        background: '#fff', border: `1px solid ${error ? 'var(--vxn-danger-fg)' : 'var(--vxn-border)'}`,
        borderRadius: 8, font: `500 ${big ? 17 : 15}px var(--font-display)`,
        color: value ? 'var(--vxn-ink)' : 'var(--vxn-fg-disabled)',
      }}>
        {icon && <Icon name={icon} size={big ? 20 : 18} color="var(--vxn-fg-5)" />}
        <span style={{ flex: 1 }}>{value || placeholder}</span>
      </div>
      {hint && !error && <span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{hint}</span>}
      {error && <span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-danger-fg)' }}>{error}</span>}
    </label>
  );
}

function StatusDot({ tone = 'success' }) {
  const map = { success: '#1D4ED8', warning: '#B45309', danger: '#EF4444', leaf: '#00613D' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: map[tone] }} />;
}

function VND(n) {
  return n.toLocaleString('vi-VN') + 'đ';
}

// ============================================================
//  Mock data
// ============================================================
const OPERATORS = [
  { id: 'op1', name: 'Hà Linh Express',     short: 'HL', color: '#E89B26', rating: 4.8, reviews: 12840, fleet: 84, founded: 2014, bio: 'Chuyên tuyến Hà Nội — Sapa, Hà Nội — Hạ Long. Xe limousine cabin VIP, 9 chỗ.' },
  { id: 'op2', name: 'Phương Nam Travel',   short: 'PN', color: '#006481', rating: 4.6, reviews: 8930,  fleet: 142, founded: 2008, bio: 'Mạng lưới toàn miền Nam. Xe giường nằm 40 chỗ, limousine 22 chỗ.' },
  { id: 'op3', name: 'Tâm Hạnh Limousine',  short: 'TH', color: '#1D4ED8', rating: 4.7, reviews: 5210,  fleet: 36,  founded: 2018, bio: 'Limousine cao cấp cabin riêng cho 2 người, kèm rèm và sạc Type-C.' },
  { id: 'op4', name: 'Hoàng Long Coach',    short: 'HL', color: '#00613D', rating: 4.5, reviews: 21405, fleet: 218, founded: 1998, bio: 'Hãng xe lâu đời nhất Việt Nam, tuyến Bắc — Nam xuyên suốt.' },
  { id: 'op5', name: 'Mai Hương Sleeper',   short: 'MH', color: '#D18A1E', rating: 4.4, reviews: 3204,  fleet: 28,  founded: 2020, bio: 'Tuyến ngắn Đà Nẵng — Huế — Hội An. Xe seater 29 chỗ.' },
];

const ROUTES_POPULAR = [
  { from: 'TP. Hồ Chí Minh', to: 'Đà Lạt',   km: 308, hours: '7 tiếng',  fromPrice: 280000, image: 'dalat' },
  { from: 'Hà Nội',           to: 'Sapa',     km: 320, hours: '5 tiếng',  fromPrice: 350000, image: 'sapa' },
  { from: 'Hà Nội',           to: 'Hạ Long',  km: 165, hours: '3 tiếng',  fromPrice: 180000, image: 'halong' },
  { from: 'TP. Hồ Chí Minh', to: 'Vũng Tàu', km: 125, hours: '2 tiếng',  fromPrice: 120000, image: 'vungtau' },
  { from: 'Đà Nẵng',          to: 'Huế',      km: 100, hours: '2 tiếng',  fromPrice: 110000, image: 'hue' },
  { from: 'TP. Hồ Chí Minh', to: 'Nha Trang', km: 440, hours: '9 tiếng',  fromPrice: 420000, image: 'nhatrang' },
];

const SAMPLE_TRIPS = [
  {
    id: 't1', operator: OPERATORS[0], depart: '06:00', arrive: '11:30', duration: '5h 30',
    from: 'Hà Nội', fromStation: 'BX Mỹ Đình',
    to: 'Sapa',     toStation: 'TT Sapa',
    busType: 'Limousine 22 cabin', amenities: ['wifi','ac','water','power','tv'],
    seatsLeft: 7, totalSeats: 22, basePrice: 480000, finalPrice: 420000, discount: 13,
    rating: 4.8, reviews: 1284, dynamicNote: 'Giá tốt — đặt trước 5 ngày',
  },
  {
    id: 't2', operator: OPERATORS[3], depart: '07:30', arrive: '13:15', duration: '5h 45',
    from: 'Hà Nội', fromStation: 'BX Giáp Bát',
    to: 'Sapa',     toStation: 'TT Sapa',
    busType: 'Giường nằm 40 chỗ',  amenities: ['wifi','ac','water','toilet'],
    seatsLeft: 18, totalSeats: 40, basePrice: 380000, finalPrice: 380000,
    rating: 4.5, reviews: 2104,
  },
  {
    id: 't3', operator: OPERATORS[2], depart: '08:15', arrive: '13:30', duration: '5h 15',
    from: 'Hà Nội', fromStation: 'Văn phòng Trần Duy Hưng',
    to: 'Sapa',     toStation: 'Văn phòng Cầu Mây',
    busType: 'Cabin Limousine VIP 18 chỗ', amenities: ['wifi','ac','water','power','tv','blanket'],
    seatsLeft: 3, totalSeats: 18, basePrice: 560000, finalPrice: 520000, discount: 7,
    rating: 4.9, reviews: 821, tag: 'BÁN CHẠY',
  },
  {
    id: 't4', operator: OPERATORS[0], depart: '14:00', arrive: '19:45', duration: '5h 45',
    from: 'Hà Nội', fromStation: 'BX Mỹ Đình',
    to: 'Sapa',     toStation: 'TT Sapa',
    busType: 'Limousine 22 cabin', amenities: ['wifi','ac','water','power'],
    seatsLeft: 11, totalSeats: 22, basePrice: 480000, finalPrice: 460000,
    rating: 4.8, reviews: 1284,
  },
  {
    id: 't5', operator: OPERATORS[3], depart: '21:30', arrive: '03:15', duration: '5h 45 (qua đêm)',
    from: 'Hà Nội', fromStation: 'BX Giáp Bát',
    to: 'Sapa',     toStation: 'TT Sapa',
    busType: 'Giường nằm 40 chỗ',  amenities: ['wifi','ac','water','toilet','blanket'],
    seatsLeft: 24, totalSeats: 40, basePrice: 380000, finalPrice: 350000, discount: 7,
    rating: 4.5, reviews: 2104, tag: 'XE ĐÊM',
  },
];

const USER = {
  fullName: 'Nguyễn Minh Châu',
  email: 'minhchau@email.com',
  phone: '0901 234 567',
  tier: 'gold',
  tierLabel: 'Gold',
  totalPoints: 5840,
  pointsToNextTier: 4160,
  joined: 'Tháng 3, 2024',
};

// ============================================================
//  Hero landscape — split or full bleed
// ============================================================
function HeroLandscape({ height = 520, overlay = true, children, style }) {
  return (
    <div style={{ position: 'relative', height, overflow: 'hidden', ...style }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${window.__resources?.heroLandscape || 'design-system/assets/hero-landscape.jpg'})`,
        backgroundSize: 'cover', backgroundPosition: '50% 65%',
      }} />
      {overlay && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,71,107,.0) 0%, rgba(0,40,60,.0) 50%, rgba(0,40,60,.55) 100%)',
        }} />
      )}
      {children}
    </div>
  );
}

// ============================================================
//  Amenity icon map
// ============================================================
function Amenity({ kind, withLabel = false }) {
  const map = {
    wifi:   ['wifi', 'WiFi'],
    ac:     ['ac', 'Máy lạnh'],
    water:  ['water', 'Nước'],
    power:  ['power', 'Sạc'],
    tv:     ['tv', 'Giải trí'],
    toilet: ['toilet', 'Nhà vệ sinh'],
    blanket:['shield','Chăn ấm'],
    pillow: ['shield','Gối'],
    snack:  ['add', 'Snack'],
  };
  const [icon, label] = map[kind] || ['add', kind];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      color: 'var(--vxn-fg-3)', font: '400 12px var(--font-display)',
    }}>
      <Icon name={icon} size={14} color="var(--vxn-teal-700)" />
      {withLabel && <span>{label}</span>}
    </span>
  );
}

// ============================================================
//  Header band (used by sub-pages) — title + back
// ============================================================
function PageHeader({ title, subtitle, back, right, tight }) {
  return (
    <div style={{
      padding: tight ? '20px 32px 16px' : '28px 32px 24px',
      borderBottom: '1px solid var(--vxn-border)', background: '#fff',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {back !== false && (
          <button style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid var(--vxn-border)',
            background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><Icon name="chevLeft" size={16} color="var(--vxn-fg-2)" /></button>
        )}
        <div>
          <h1 style={{ margin: 0, font: '600 28px var(--font-display)', color: 'var(--vxn-ink)', letterSpacing: '-0.01em' }}>{title}</h1>
          {subtitle && <p style={{ margin: '6px 0 0', font: '400 14px var(--font-display)', color: 'var(--vxn-fg-3)' }}>{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ============================================================
//  Pageframe — sidebar + content (used by most screens)
// ============================================================
function Frame({ active = 'buy', signedIn = false, user = USER, children, contentBg = '#F9F9FF' }) {
  return (
    <div style={{
      display: 'flex', minHeight: '100%', height: '100%', width: '100%',
      background: contentBg, fontFamily: 'var(--font-display)',
    }}>
      <Sidebar active={active} signedIn={signedIn} user={user} />
      <main style={{
        flex: 1, minWidth: 0, position: 'relative', background: contentBg,
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </main>
    </div>
  );
}

Object.assign(window, {
  Icon, Sidebar, PageTopUtility, Btn, Chip, Card, Field, StatusDot, VND,
  OPERATORS, ROUTES_POPULAR, SAMPLE_TRIPS, USER,
  HeroLandscape, Amenity, PageHeader, Frame,
  vxnAccent, vxnAccentSoft, vxnAccentInk,
});
