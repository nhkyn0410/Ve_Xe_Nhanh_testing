/**
 * VXN operator portal — UI primitives.
 * Faithful React port of the "Trang quản lý nhà xe" design package
 * (chrome.jsx + view-dashboard.jsx shared helpers). Inline styles and
 * design tokens are kept verbatim so the output is pixel-accurate.
 * Lucide icons are rendered through lucide-react instead of CDN <img>.
 */
import * as Icons from 'lucide-react';

/* kebab-case (design) → PascalCase (lucide-react export) */
function pascal(name) {
  return String(name)
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

export function VxnIcon({ name, size = 16, color, style, strokeWidth = 2 }) {
  const Cmp = Icons[pascal(name)] || Icons.Square;
  return (
    <Cmp size={size} color={color || 'currentColor'} strokeWidth={strokeWidth} style={style} />
  );
}

/* ───────── Chip ───────── */
const CHIP_TONE = {
  success: { bg: '#DCFCE7', fg: '#15803D' },
  info:    { bg: '#DBEAFE', fg: '#1D4ED8' },
  warn:    { bg: '#FEF3C7', fg: '#B45309' },
  danger:  { bg: '#FEE2E2', fg: '#B91C1C' },
  neutral: { bg: '#EBEEF7', fg: '#475569' },
  saffron: { bg: '#FEF3D7', fg: '#B57311' },
};

export function Chip({ tone = 'neutral', children, dot }) {
  const c = CHIP_TONE[tone] || CHIP_TONE.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: c.bg, color: c.fg,
      font: '600 12px var(--font-display)', whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.fg }} />}
      {children}
    </span>
  );
}

/* ───────── Btn ───────── */
export function Btn({ kind = 'primary', icon, children, onClick, type = 'button', disabled }) {
  const base = {
    height: 40, padding: '0 16px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
    font: '500 14px var(--font-display)', display: 'inline-flex', alignItems: 'center',
    gap: 8, whiteSpace: 'nowrap', border: '1px solid transparent',
    opacity: disabled ? 0.6 : 1, transition: 'filter .15s',
  };
  const kinds = {
    primary: { background: 'var(--vxn-teal-700)', color: '#fff' },
    saffron: { background: 'var(--vxn-saffron-600)', color: '#fff' },
    ghost:   { background: '#fff', color: 'var(--vxn-fg-2)', border: '1px solid var(--vxn-border)' },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ ...base, ...(kinds[kind] || kinds.primary) }}>
      {icon && <VxnIcon name={icon} size={16} />}
      {children}
    </button>
  );
}

/* ───────── Select ───────── */
export function Select({ value, onChange, options = [] }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          height: 40, padding: '0 34px 0 14px', borderRadius: 8,
          border: '1px solid var(--vxn-border)', background: '#fff',
          font: '500 14px var(--font-display)', color: 'var(--vxn-fg-2)',
          cursor: 'pointer', minWidth: 150,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: 'var(--vxn-fg-5)', display: 'inline-flex',
      }}>
        <VxnIcon name="chevron-down" size={16} />
      </span>
    </div>
  );
}

/* ───────── SearchInput ───────── */
export function SearchInput({ value, onChange, placeholder = 'Tìm kiếm…' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 420,
      height: 40, padding: '0 14px', borderRadius: 8,
      border: '1px solid var(--vxn-border)', background: 'var(--vxn-bg-mist)',
    }}>
      <VxnIcon name="search" size={16} color="var(--vxn-fg-5)" />
      <input
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 0, outline: 'none', background: 'transparent',
          font: '400 14px var(--font-display)', color: 'var(--vxn-fg-1)', minWidth: 0,
        }}
      />
    </div>
  );
}

/* ───────── PageHeader ───────── */
export function PageHeader({ title, description, cta }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 24, marginBottom: 24,
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          margin: 0, font: '600 26px var(--font-display)', color: 'var(--vxn-ink)',
          letterSpacing: '-0.01em',
        }}>{title}</h1>
        {description && (
          <p style={{
            margin: '8px 0 0', font: '400 14px var(--font-display)',
            color: 'var(--vxn-fg-3)', maxWidth: 760, lineHeight: 1.5,
          }}>{description}</p>
        )}
      </div>
      {cta && <div style={{ flexShrink: 0 }}>{cta}</div>}
    </div>
  );
}

/* ───────── StatPill (KPI strip cell) ───────── */
export function StatPill({ label, value, hint, tone = 'default' }) {
  const colorMap = {
    teal: 'var(--vxn-teal-800)',
    success: '#15803D',
    warn: 'var(--vxn-warning-fg)',
    danger: 'var(--vxn-danger-fg)',
    default: 'var(--vxn-ink)',
  };
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12, padding: 16,
    }}>
      <div style={{
        font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-5)',
        textTransform: 'uppercase', letterSpacing: '.04em',
      }}>{label}</div>
      <div style={{
        font: '700 28px var(--font-display)', color: colorMap[tone],
        margin: '6px 0 4px', letterSpacing: '-0.01em',
      }}>{value}</div>
      <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{hint}</div>
    </div>
  );
}

/* ───────── RowIconBtn ───────── */
export function RowIconBtn({ icon, onClick, title }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 30, height: 30, borderRadius: 6, border: 0, background: 'transparent',
      display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--vxn-fg-5)',
    }}>
      <VxnIcon name={icon} size={15} />
    </button>
  );
}

/* ───────── PageBtn (paginator) ───────── */
export function PageBtn({ children, active, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      width: 32, height: 32, borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
      border: '1px solid ' + (active ? 'var(--vxn-teal-700)' : 'var(--vxn-border)'),
      background: active ? 'var(--vxn-teal-700)' : '#fff',
      color: active ? '#fff' : 'var(--vxn-fg-3)',
      font: `${active ? 600 : 500} 13px var(--font-display)`,
      opacity: disabled ? 0.45 : 1,
    }}>{children}</button>
  );
}

/* ───────── Shared table cell style ───────── */
export const tdStyle = {
  padding: '14px 16px', font: '400 13.5px var(--font-display)',
  color: 'var(--vxn-fg-2)', verticalAlign: 'middle',
};

export const thStyle = {
  background: '#F4F6FB', textAlign: 'left', padding: '12px 16px',
  font: '500 11px var(--font-display)', letterSpacing: '.05em',
  textTransform: 'uppercase', color: 'var(--vxn-fg-5)',
  borderBottom: '1px solid var(--vxn-border)',
};

/* ───────── Filter-bar + table shell helpers ───────── */
export function FilterBar({ children }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12,
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 0,
    }}>{children}</div>
  );
}

export function TableShell({ children, footer }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12,
      borderTopLeftRadius: 0, borderTopRightRadius: 0, overflow: 'hidden',
    }}>
      {children}
      {footer && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderTop: '1px solid var(--vxn-border)',
          background: '#FBFCFE',
        }}>{footer}</div>
      )}
    </div>
  );
}

/* ───────── KpiCard (dashboard, with sparkline) ───────── */
export function KpiCard({ label, value, delta, deltaTone = 'up', sub, spark, color, fill, Spark }) {
  const deltaColor =
    deltaTone === 'up' ? '#15803D' :
    deltaTone === 'down' ? 'var(--vxn-danger-fg)' : 'var(--vxn-fg-5)';
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12, padding: 18,
      display: 'flex', justifyContent: 'space-between', gap: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          font: '500 12.5px var(--font-display)', color: 'var(--vxn-fg-5)',
          textTransform: 'uppercase', letterSpacing: '.04em',
        }}>{label}</div>
        <div style={{
          font: '700 28px var(--font-display)', color: 'var(--vxn-ink)',
          margin: '6px 0', letterSpacing: '-0.015em',
        }}>{value}</div>
        {delta != null && (
          <div style={{ font: '500 12px var(--font-display)', color: deltaColor, marginBottom: 2 }}>
            {deltaTone === 'up' ? '↗' : deltaTone === 'down' ? '↘' : '·'} {delta}
          </div>
        )}
        {sub && <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{sub}</div>}
      </div>
      {Spark && spark && (
        <div style={{ alignSelf: 'flex-end' }}>
          <Spark data={spark} width={110} height={64} color={color} fill={fill} />
        </div>
      )}
    </div>
  );
}
