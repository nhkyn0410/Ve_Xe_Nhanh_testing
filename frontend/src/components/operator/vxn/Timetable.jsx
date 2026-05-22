/**
 * VXN operator portal — Gantt-style hourly Timetable.
 * Faithful React port of the design package's timetable.jsx.
 * Rows: vehicles or staff. Columns: hours of the day.
 * Each row has an array of blocks { start, end, label, sub, tone }.
 * start/end are decimal hours (e.g. 8.5 = 08:30).
 */
import { VxnIcon } from './primitives';

export const TONE_BLOCK = {
  teal:    { bg: 'linear-gradient(180deg, #0F7AA1 0%, #006481 100%)', fg: '#fff' },
  sky:     { bg: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)', fg: '#fff' },
  saffron: { bg: 'linear-gradient(180deg, #F3B132 0%, #D18A1E 100%)', fg: '#1f1305' },
  amber:   { bg: 'repeating-linear-gradient(135deg, #FCE2A0 0 6px, #F8D177 6px 12px)', fg: '#7A4A0A', border: '1px solid #E8AB36' },
  rose:    { bg: 'repeating-linear-gradient(135deg, #FECACA 0 6px, #FCA5A5 6px 12px)', fg: '#7F1D1D', border: '1px solid #F87171' },
  slate:   { bg: '#E2E8F0', fg: '#334155', border: '1px solid #CBD5E1' },
};

export function fmtH(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function Timetable({
  title,
  subtitle,
  date,
  rows,                 // [{ id, label, sub, badge, avatar, blocks: [{start,end,label,sub,tone}] }]
  hourStart = 5,
  hourEnd = 24,
  rowLabelHeader = 'Phương tiện',
  rowLabelWidth = 220,
  highlightHour,        // decimal hour for "now" indicator (optional)
  legend,               // [{ tone, label }]
  onAction,
}) {
  const hours = [];
  for (let h = hourStart; h <= hourEnd; h++) hours.push(h);
  const span = hourEnd - hourStart;
  const colWidth = 56; // each hour column

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12,
      overflow: 'hidden', marginBottom: 28,
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 22px', borderBottom: '1px solid var(--vxn-border)',
      }}>
        <div>
          <h2 style={{ margin: 0, font: '600 17px var(--font-display)', color: 'var(--vxn-ink)' }}>{title}</h2>
          {subtitle && <div style={{ marginTop: 4, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {legend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginRight: 10 }}>
              {legend.map((l, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                  <span style={{
                    width: 14, height: 10, borderRadius: 3,
                    background: TONE_BLOCK[l.tone]?.bg || '#999',
                    border: TONE_BLOCK[l.tone]?.border || 'none',
                  }} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
          <button onClick={onAction} style={{
            height: 34, padding: '0 12px', borderRadius: 8, background: '#fff',
            border: '1px solid var(--vxn-border)', cursor: 'pointer',
            font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <VxnIcon name="calendar" size={14} style={{ opacity: 0.65 }} />
            {date}
          </button>
          <div style={{ display: 'flex', borderRadius: 8, border: '1px solid var(--vxn-border)', overflow: 'hidden' }}>
            {['Hôm nay', 'Tuần', 'Tháng'].map((t, i) => (
              <button key={t} style={{
                height: 34, padding: '0 12px', border: 0, cursor: 'pointer',
                background: i === 0 ? 'var(--vxn-bg-mist)' : '#fff',
                color: i === 0 ? 'var(--vxn-teal-800)' : 'var(--vxn-fg-3)',
                font: `${i === 0 ? 500 : 400} 13px var(--font-display)`,
                borderRight: i < 2 ? '1px solid var(--vxn-border)' : 0,
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Body — scroll horizontally */}
      <div style={{ display: 'flex' }}>
        {/* Sticky row-label column */}
        <div style={{ width: rowLabelWidth, flexShrink: 0, borderRight: '1px solid var(--vxn-border)', background: '#FBFCFE' }}>
          <div style={{
            height: 44, display: 'flex', alignItems: 'center', padding: '0 16px',
            font: '500 11px var(--font-display)', letterSpacing: '.05em', textTransform: 'uppercase',
            color: 'var(--vxn-fg-5)', borderBottom: '1px solid var(--vxn-border)',
          }}>{rowLabelHeader}</div>
          {rows.map((r, i) => (
            <div key={r.id} style={{
              height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--vxn-border)' : 0,
            }}>
              {r.avatar}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ font: '500 13.5px var(--font-display)', color: 'var(--vxn-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                {r.sub && <div style={{ font: '400 11.5px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 1 }}>{r.sub}</div>}
              </div>
              {r.badge}
            </div>
          ))}
        </div>

        {/* Scrollable hour grid */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div style={{ width: span * colWidth + 1, position: 'relative' }}>
            {/* Hour header */}
            <div style={{
              display: 'flex', height: 44, borderBottom: '1px solid var(--vxn-border)',
              background: '#FBFCFE',
            }}>
              {hours.slice(0, -1).map((h, i) => (
                <div key={h} style={{
                  width: colWidth, flexShrink: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'flex-start', paddingLeft: 6,
                  font: '500 11px var(--font-display)', color: 'var(--vxn-fg-5)',
                  borderRight: '1px solid var(--vxn-border)',
                  letterSpacing: '.02em',
                }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Rows */}
            {rows.map((r, ri) => (
              <div key={r.id} style={{
                position: 'relative', height: 56,
                borderBottom: ri < rows.length - 1 ? '1px solid var(--vxn-border)' : 0,
                background: ri % 2 === 0 ? '#fff' : '#FBFCFE',
              }}>
                {/* hour grid lines */}
                {hours.slice(0, -1).map((h, i) => (
                  <div key={h} style={{
                    position: 'absolute', left: i * colWidth, top: 0, bottom: 0,
                    width: colWidth, borderRight: '1px solid #EEF1F7',
                  }} />
                ))}
                {/* "now" indicator */}
                {highlightHour && highlightHour >= hourStart && highlightHour <= hourEnd && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: (highlightHour - hourStart) * colWidth - 1,
                    width: 2, background: 'var(--vxn-danger-fg)',
                    boxShadow: '0 0 6px rgba(239,68,68,.4)', zIndex: 3,
                  }} />
                )}
                {/* Blocks */}
                {r.blocks.map((b, bi) => {
                  const left = (b.start - hourStart) * colWidth;
                  const width = (b.end - b.start) * colWidth - 4;
                  const tone = TONE_BLOCK[b.tone] || TONE_BLOCK.teal;
                  return (
                    <div key={bi} title={`${b.label} · ${fmtH(b.start)}–${fmtH(b.end)}`} style={{
                      position: 'absolute', top: 8, height: 40,
                      left: left + 2, width: Math.max(width, 28),
                      background: tone.bg, color: tone.fg,
                      border: tone.border || 'none',
                      borderRadius: 6, padding: '5px 10px',
                      font: '500 11.5px var(--font-display)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      overflow: 'hidden', cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, fontSize: 12 }}>{b.label}</div>
                      {b.sub && <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: .85, fontSize: 10.5, fontWeight: 400 }}>{b.sub}</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
