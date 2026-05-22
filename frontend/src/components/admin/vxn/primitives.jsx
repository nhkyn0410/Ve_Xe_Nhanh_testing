/**
 * VXN system-admin portal — UI primitives.
 * Faithful React port of the "Trang admin hệ thống" design package
 * (admin-chrome.jsx). Inline styles and design tokens are kept
 * verbatim so the output is pixel-accurate. Shared atoms
 * (VxnIcon / Chip / Btn / Select / SearchInput / PageHeader) and the
 * SVG charts are reused from the operator design-system module so
 * there is a single source of truth for the shared design language.
 */
import {
  VxnIcon,
  Chip,
  Btn,
  Select,
  SearchInput,
  PageHeader,
} from '../../operator/vxn/primitives';
import {
  Sparkline,
  BarChart,
  Donut,
  Panel,
  TextLink,
} from '../../operator/vxn/charts';

export { VxnIcon, Chip, Btn, Select, SearchInput, PageHeader };
export { Sparkline, BarChart, Donut, Panel, TextLink };

/* ───────── money helpers (admin-chrome.jsx) ───────── */
export function MoneyVND(v) {
  return Number(v || 0).toLocaleString('vi-VN') + 'đ';
}
export function ShortMoney(v) {
  v = Number(v || 0);
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return '' + v;
}

/* ───────── KpiCard (admin flavor — icon tile + accent strip) ───────── */
export function KpiCard({ label, value, delta, deltaTone, sub, icon, iconBg, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid var(--vxn-border)',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {accent && <span style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent,
      }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          font: '500 11.5px var(--font-display)', letterSpacing: '0.08em',
          color: 'var(--vxn-fg-4)', textTransform: 'uppercase',
        }}>{label}</div>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: iconBg || 'var(--vxn-bg-mist)',
            display: 'grid', placeItems: 'center',
          }}>
            <VxnIcon name={icon} size={16} color="var(--vxn-fg-3)" />
          </div>
        )}
      </div>
      <div style={{ font: '600 28px var(--font-display)', color: 'var(--vxn-ink)', marginTop: 10, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-4)' }}>
        {delta && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            color: deltaTone === 'up' ? '#15803D' : deltaTone === 'down' ? '#B91C1C' : 'var(--vxn-fg-3)',
            font: '600 12.5px var(--font-display)',
          }}>
            {deltaTone === 'up' && '↑'}{deltaTone === 'down' && '↓'} {delta}
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

/* ───────── Card (title / subtitle / action) ───────── */
export function Card({ title, subtitle, action, children, padding = 24, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid var(--vxn-border)',
      overflow: 'hidden', ...style,
    }}>
      {(title || action) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px 14px', borderBottom: '1px solid var(--vxn-border-muted)',
        }}>
          <div>
            <div style={{ font: '600 15px var(--font-display)', color: 'var(--vxn-ink)' }}>{title}</div>
            {subtitle && <div style={{ font: '400 12.5px var(--font-display)', color: 'var(--vxn-fg-4)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

/* ───────── FilterBar ───────── */
export function FilterBar({ children, style }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
      marginBottom: 20, ...style,
    }}>{children}</div>
  );
}

/* ───────── Table (columns / rows) ───────── */
export function Table({ columns, rows, getRowStyle, dense, onRowClick, empty }) {
  const py = dense ? 12 : 16;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', font: '400 13.5px var(--font-display)' }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{
                textAlign: c.align || 'left', padding: '12px 16px',
                font: '600 10.5px var(--font-display)', letterSpacing: '0.1em',
                color: 'var(--vxn-fg-4)', textTransform: 'uppercase',
                borderBottom: '1px solid var(--vxn-border)',
                whiteSpace: 'nowrap', width: c.width,
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{
                padding: '48px 16px', textAlign: 'center',
                font: '400 14px var(--font-display)', color: 'var(--vxn-fg-5)',
              }}>{empty || 'Không có dữ liệu.'}</td>
            </tr>
          )}
          {rows.map((row, ri) => (
            <tr key={row.id || row._id || ri}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderBottom: '1px solid var(--vxn-border-muted)',
                cursor: onRowClick ? 'pointer' : 'default',
                ...(getRowStyle ? getRowStyle(row, ri) : {}),
              }}>
              {columns.map((c, ci) => (
                <td key={ci} style={{
                  padding: `${py}px 16px`, textAlign: c.align || 'left',
                  color: 'var(--vxn-fg-2)', verticalAlign: 'middle',
                }}>
                  {c.render ? c.render(row, ri) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────── Pager ───────── */
export function Pager({ total, page = 1, pageSize = 20, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Compact page list: 1 2 3 … last
  const nums = [];
  if (pages <= 6) {
    for (let i = 1; i <= pages; i += 1) nums.push(i);
  } else {
    nums.push(1, 2, 3, '…', pages);
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 20px', borderTop: '1px solid var(--vxn-border-muted)',
      font: '400 13px var(--font-display)', color: 'var(--vxn-fg-4)',
    }}>
      <div>
        Hiển thị <strong style={{ color: 'var(--vxn-fg-2)' }}>{start}–{end}</strong> trong{' '}
        <strong style={{ color: 'var(--vxn-fg-2)' }}>{Number(total).toLocaleString('vi-VN')}</strong>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {nums.map((n, i) => (
          <button key={i}
            disabled={n === '…'}
            onClick={() => typeof n === 'number' && onChange && onChange(n)}
            style={{
              minWidth: 32, height: 32, borderRadius: 6,
              border: '1px solid ' + (n === page ? 'var(--vxn-teal-700)' : 'var(--vxn-border)'),
              background: n === page ? 'var(--vxn-teal-700)' : '#fff',
              color: n === page ? '#fff' : 'var(--vxn-fg-2)',
              font: '500 13px var(--font-display)',
              cursor: n === '…' ? 'default' : 'pointer',
            }}>{n}</button>
        ))}
      </div>
    </div>
  );
}

/* ───────── Tabs (underline pill-count, complaints/content/trips) ───────── */
export function Tabs({ tabs, active, onChange, style }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '8px 16px 0',
      borderBottom: '1px solid var(--vxn-border)', ...style,
    }}>
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            padding: '12px 12px',
            font: `${on ? 600 : 500} 13px var(--font-display)`,
            color: on ? 'var(--vxn-teal-800)' : 'var(--vxn-fg-3)',
            borderBottom: '2px solid ' + (on ? 'var(--vxn-teal-700)' : 'transparent'),
            marginBottom: -1,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {t.label}
            {t.count != null && (
              <span style={{
                background: on ? 'var(--vxn-teal-700)' : 'var(--vxn-bg-mist)',
                color: on ? '#fff' : 'var(--vxn-fg-4)',
                borderRadius: 999, padding: '1px 7px',
                font: '600 11px var(--font-display)',
              }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ───────── EmptyState ───────── */
export function EmptyState({ icon = 'inbox', title, hint }) {
  return (
    <div style={{
      padding: '56px 24px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: 'var(--vxn-bg-mist)',
        display: 'grid', placeItems: 'center',
      }}>
        <VxnIcon name={icon} size={24} color="var(--vxn-fg-5)" />
      </div>
      <div style={{ font: '600 15px var(--font-display)', color: 'var(--vxn-fg-2)' }}>{title}</div>
      {hint && <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)', maxWidth: 360 }}>{hint}</div>}
    </div>
  );
}

/* ───────── Skeleton block ───────── */
export function Skeleton({ height = 16, width = '100%', radius = 6, style }) {
  return (
    <span style={{
      display: 'block', height, width, borderRadius: radius,
      background: 'linear-gradient(90deg, var(--vxn-bg-mist) 25%, var(--vxn-bg-cloud) 37%, var(--vxn-bg-mist) 63%)',
      backgroundSize: '400% 100%',
      animation: 'vxnShimmer 1.4s ease infinite',
      ...style,
    }} />
  );
}
