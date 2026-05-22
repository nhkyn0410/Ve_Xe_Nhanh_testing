/**
 * VXN operator portal — tiny SVG charts + shared cards.
 * Faithful React port of the design package's shared-charts.jsx.
 * SVG math and inline styles are kept verbatim for pixel accuracy.
 */
import { VxnIcon } from './primitives';

/* ───────── Sparkline ───────── */
export function Sparkline({ data, width = 280, height = 80, color = '#006481', fill = 'rgba(0,100,129,0.10)' }) {
  if (!data || !data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const pad = 4;
  const step = (width - pad * 2) / (data.length - 1);
  const norm = (v) => height - pad - ((v - min) / Math.max(1, max - min)) * (height - pad * 2);
  const pts = data.map((v, i) => `${pad + i * step},${norm(v)}`);
  const linePath = 'M' + pts.join(' L');
  const areaPath = `${linePath} L${pad + (data.length - 1) * step},${height - pad} L${pad},${height - pad} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={areaPath} fill={fill} />
      <path d={linePath} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pad + (data.length - 1) * step} cy={norm(data[data.length - 1])} r="3.5" fill={color} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

/* ───────── BarChart ───────── */
export function BarChart({ data, labels, width = 520, height = 200, color = '#2B7EAD', secondColor = '#E89B26' }) {
  // data: [{v1, v2}] paired bars
  const max = Math.max(...data.flatMap((d) => [d.v1, d.v2 || 0]));
  const padL = 40, padB = 28, padT = 14, padR = 12;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const bw = innerW / data.length;
  const gapPct = 0.18;
  const barPair = bw * (1 - gapPct);
  const barW = (barPair) / (data.some((d) => d.v2 != null) ? 2.4 : 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {yTicks.map((t, i) => {
        const y = padT + innerH * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#EEF1F7" strokeWidth="1" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontFamily="Be Vietnam Pro">
              {Math.round(max * t).toLocaleString('vi-VN')}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + bw * i + bw * gapPct / 2;
        const h1 = innerH * (d.v1 / max);
        const h2 = d.v2 != null ? innerH * (d.v2 / max) : 0;
        return (
          <g key={i}>
            <rect x={cx} y={padT + innerH - h1} width={barW} height={h1} fill={color} rx="2" />
            {d.v2 != null && (
              <rect x={cx + barW + 3} y={padT + innerH - h2} width={barW} height={h2} fill={secondColor} rx="2" />
            )}
            <text x={cx + (d.v2 != null ? barW + 1.5 : barW / 2)} y={height - 10}
              textAnchor="middle" fontSize="10.5" fill="#64748B" fontFamily="Be Vietnam Pro">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ───────── Donut ───────── */
export function Donut({ segments, size = 140, thickness = 18 }) {
  // segments: [{value, color, label}]
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} stroke="#F1F3FD" strokeWidth={thickness} fill="none" />
      {segments.map((s, i) => {
        const len = (s.value / total) * circ;
        const dasharray = `${len} ${circ - len}`;
        const dashoffset = -offset;
        offset += len;
        return (
          <circle key={i} cx={c} cy={c} r={r} stroke={s.color} strokeWidth={thickness}
            fill="none" strokeDasharray={dasharray} strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${c} ${c})`} strokeLinecap="butt" />
        );
      })}
    </svg>
  );
}

/* ───────── Panel ───────── */
export function Panel({ title, action, children, padding = 20 }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12, overflow: 'hidden',
    }}>
      {title && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--vxn-border)',
        }}>
          <h3 style={{ margin: 0, font: '600 15px var(--font-display)', color: 'var(--vxn-ink)' }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

/* ───────── TextLink ───────── */
export function TextLink({ children, onClick }) {
  return (
    <a onClick={onClick} style={{
      color: 'var(--vxn-teal-800)', font: '500 13px var(--font-display)',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {children}
      <VxnIcon name="arrow-right" size={13} style={{ opacity: 0.8 }} />
    </a>
  );
}
