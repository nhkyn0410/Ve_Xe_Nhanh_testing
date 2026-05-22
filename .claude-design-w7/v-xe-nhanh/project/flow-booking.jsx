/* global React, Frame, PageTopUtility, Btn, Chip, Card, Icon, VND, OPERATORS, SAMPLE_TRIPS, USER, Amenity, PageHeader, vxnAccent */

// ============================================================
//  SEAT PICKER — /booking/seats/:tripId  ← centerpiece
//  Sleeper bus, both floors, with detailed seat states.
// ============================================================

// Sleeper-bus seat layout: 2 floors × (6 rows × 3 cols + back row of 5)
// Cols: A (left aisle), B (middle), C (right window) — with aisle between A and B
// Row "rest" → 5 seats across the back
const LOWER_BOOKED = ['A02','A03','B04','C01','C05','BACK1','BACK4'];
const LOWER_HELD = ['A05', 'C03'];
const UPPER_BOOKED = ['A01','B01','B03','C04','BACK2'];
const UPPER_HELD = ['A04'];
const MY_SELECTION = ['B02','C02'];

const SEAT_PRICE_PREMIUM = ['A01','C01','BACK1','BACK2','BACK3','BACK4','BACK5'];

function buildSleeperLayout(prefix) {
  const rows = [];
  for (let r = 1; r <= 6; r++) {
    rows.push([
      `A0${r}`, '', // aisle
      `B0${r}`,
      `C0${r}`,
    ]);
  }
  rows.push(['BACK1','BACK2','BACK3','BACK4','BACK5']);
  return rows;
}

function SeatPickerScreen() {
  const trip = SAMPLE_TRIPS[2];
  const accent = vxnAccent();
  return (
    <Frame active="buy" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tìm chuyến','Hà Nội → Sapa', trip.operator.name, 'Chọn ghế']} />
      {/* Stepper + countdown */}
      <BookingStepper step={1} />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        <div style={{ padding: '20px 32px 40px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 12, padding: '16px 22px',
          }}>
            <div>
              <h2 style={{ margin: 0, font: '600 22px var(--font-display)', color: 'var(--vxn-ink)', letterSpacing: '-.01em' }}>
                Chọn 2 ghế trong cabin
              </h2>
              <p style={{ margin: '4px 0 0', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
                {trip.operator.name} · {trip.busType} · {trip.depart} → {trip.arrive} · BS 30H-468.91
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <SeatLegend swatch={accent} kind="selected" label="Đang chọn" />
              <SeatLegend swatch="#fff" kind="available" label="Còn trống" />
              <SeatLegend swatch="var(--vxn-bg-fog)" kind="booked" label="Đã đặt" />
              <SeatLegend swatch="var(--vxn-warning-bg)" kind="held" label="Đang giữ" />
              <SeatLegend swatch="#fff" kind="premium" label="VIP (+30k)" />
            </div>
          </div>

          {/* The two floors side by side */}
          <div style={{
            background: '#fff', border: '1px solid var(--vxn-border)', borderRadius: 16,
            padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          }}>
            <BusFloor floor="lower" booked={LOWER_BOOKED} held={LOWER_HELD} selection={MY_SELECTION} accent={accent} />
            <BusFloor floor="upper" booked={UPPER_BOOKED} held={UPPER_HELD} selection={[]} accent={accent} />
          </div>

          {/* Pickup / dropoff */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <PickupCard title="Điểm đón" icon="markerDep" stops={[
              ['08:15','VP Trần Duy Hưng','14 Trần Duy Hưng, Cầu Giấy', true],
              ['09:00','KĐT Times City','Lô 12, 458 Minh Khai', false],
              ['09:30','BX Mỹ Đình','Phạm Hùng', false],
            ]} />
            <PickupCard title="Điểm trả" icon="markerArr" stops={[
              ['13:30','VP Cầu Mây','Số 8 Cầu Mây, P. Sapa', true],
              ['13:45','Hàm Rồng','Cổng Hàm Rồng', false],
              ['14:00','Trung tâm Sapa','Quảng trường Trung tâm', false],
            ]} />
          </div>
        </div>

        {/* Sticky summary */}
        <SeatSidebar trip={trip} selection={MY_SELECTION} step="seats" />
      </div>
    </Frame>
  );
}

function BookingStepper({ step }) {
  const steps = [
    ['1', 'Chọn ghế'],
    ['2', 'Thông tin hành khách'],
    ['3', 'Thanh toán'],
    ['4', 'Hoàn tất'],
  ];
  const accent = vxnAccent();
  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid var(--vxn-border)',
      padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {steps.map(([n, l], i) => {
          const done = i + 1 < step;
          const active = i + 1 === step;
          return (
            <React.Fragment key={n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: done ? accent : active ? accent : 'var(--vxn-bg-cloud)',
                  color: done || active ? '#fff' : 'var(--vxn-fg-3)',
                  display: 'grid', placeItems: 'center',
                  font: '600 13px var(--font-display)',
                }}>{done ? <Icon name="check" size={14} color="#fff" /> : n}</span>
                <span style={{
                  font: `${active ? 600 : 500} 14px var(--font-display)`,
                  color: active ? 'var(--vxn-ink)' : done ? 'var(--vxn-fg-2)' : 'var(--vxn-fg-5)',
                }}>{l}</span>
              </div>
              {i < steps.length - 1 && (
                <span style={{ width: 56, height: 2, background: done ? accent : 'var(--vxn-bg-fog)', borderRadius: 1, margin: '0 12px' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <CountdownPill />
    </div>
  );
}

function CountdownPill() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px',
      background: 'var(--vxn-warning-bg)', borderRadius: 10,
      color: 'var(--vxn-warning-fg)', font: '500 13px var(--font-display)',
    }}>
      <Icon name="clock" size={14} />
      <span>Giữ ghế trong</span>
      <strong style={{ font: '700 16px var(--font-mono)', letterSpacing: '.04em' }}>14:23</strong>
    </div>
  );
}

function SeatLegend({ swatch, kind, label }) {
  const border = kind === 'available' ? '1.5px solid var(--vxn-border-strong)' : kind === 'premium' ? '1.5px dashed var(--vxn-saffron-600)' : '1.5px solid transparent';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 18, height: 22, borderRadius: 4, background: swatch, border,
        position: 'relative',
      }} />
      <span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>{label}</span>
    </div>
  );
}

function BusFloor({ floor, booked, held, selection, accent }) {
  const layout = buildSleeperLayout();
  const isLower = floor === 'lower';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{
          padding: '4px 10px', borderRadius: 999,
          background: isLower ? 'var(--vxn-bg-mist)' : 'var(--vxn-info-bg)',
          color: isLower ? 'var(--vxn-fg-2)' : 'var(--vxn-teal-900)',
          font: '500 12px var(--font-display)', letterSpacing: '.04em',
        }}>{isLower ? 'TẦNG DƯỚI' : 'TẦNG TRÊN'}</span>
        <span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>
          {isLower ? '11 / 18 chỗ' : '13 / 18 chỗ'}
        </span>
      </div>

      {/* Bus shell */}
      <div style={{
        border: '2px solid var(--vxn-border-strong)', borderRadius: '40px 40px 16px 16px',
        background: 'linear-gradient(180deg, #fff 0%, var(--vxn-bg-soft) 100%)',
        padding: '20px 18px 14px', position: 'relative',
      }}>
        {/* Driver / stairs */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: 16, marginBottom: 16, borderBottom: '1px dashed var(--vxn-border-strong)',
        }}>
          {isLower ? (
            <>
              <DriverIcon />
              <span style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Tài xế · Cửa lên</span>
              <StairsIcon />
            </>
          ) : (
            <>
              <span style={{ font: '400 11px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Cầu thang lên ↑</span>
              <StairsIcon />
            </>
          )}
        </div>

        {/* Seats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {layout.slice(0, 6).map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 22px 1fr 1fr', gap: 6 }}>
              {row.map((s, ci) => s ? <Seat key={s} num={s} booked={booked} held={held} selection={selection} accent={accent} /> : (
                <div key={ci} style={{ display: 'grid', placeItems: 'center', font: '400 9px var(--font-display)', color: 'var(--vxn-fg-disabled)', letterSpacing: '.1em' }}>·</div>
              ))}
            </div>
          ))}
          {/* Back row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 6, paddingTop: 8, borderTop: '1px dashed var(--vxn-border-strong)' }}>
            {layout[6].map(s => <Seat key={s} num={s} booked={booked} held={held} selection={selection} accent={accent} compact />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Seat({ num, booked, held, selection, accent, compact }) {
  const isBooked = booked.includes(num);
  const isHeld = held.includes(num);
  const isSelected = selection.includes(num);
  const isPremium = SEAT_PRICE_PREMIUM.includes(num);
  const label = num.startsWith('BACK') ? num.replace('BACK','B') : num;

  let bg = '#fff', fg = 'var(--vxn-fg-2)', border = '1.5px solid var(--vxn-border-strong)';
  let badge = null;
  if (isBooked) { bg = 'var(--vxn-bg-fog)'; fg = 'var(--vxn-fg-disabled)'; border = '1.5px solid var(--vxn-bg-fog)'; }
  else if (isHeld) { bg = 'var(--vxn-warning-bg)'; fg = 'var(--vxn-warning-fg)'; border = '1.5px solid var(--vxn-warning-fg)'; }
  else if (isSelected) { bg = accent; fg = '#fff'; border = `1.5px solid ${accent}`; }
  else if (isPremium) { border = '1.5px dashed var(--vxn-saffron-600)'; }

  return (
    <div style={{
      position: 'relative',
      aspectRatio: compact ? '1 / 1.05' : '1 / 1.2',
      borderRadius: '8px 8px 4px 4px',
      background: bg, border, color: fg,
      display: 'grid', placeItems: 'center',
      font: '600 12px var(--font-display)',
      cursor: isBooked || isHeld ? 'not-allowed' : 'pointer',
      boxShadow: isSelected ? '0 4px 12px -4px rgba(0,100,129,.4)' : 'none',
    }}>
      {/* seat back */}
      <span style={{
        position: 'absolute', top: 3, left: '15%', right: '15%', height: 3, borderRadius: 2,
        background: isSelected ? 'rgba(255,255,255,.6)' : isBooked ? 'var(--vxn-fg-disabled)' : isHeld ? 'var(--vxn-warning-fg)' : isPremium ? 'var(--vxn-saffron-500)' : 'var(--vxn-border-strong)',
      }} />
      <span>{label}</span>
      {isSelected && <span style={{ position: 'absolute', top: 4, right: 4 }}>
        <Icon name="check" size={10} color="#fff" />
      </span>}
      {isPremium && !isBooked && !isHeld && !isSelected && (
        <span style={{ position: 'absolute', bottom: 3, font: '500 8px var(--font-display)', color: 'var(--vxn-saffron-700)' }}>VIP</span>
      )}
    </div>
  );
}

function DriverIcon() {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: 'var(--vxn-bg-cloud)',
      display: 'grid', placeItems: 'center',
    }}>
      <Icon name="user" size={18} color="var(--vxn-fg-3)" />
    </div>
  );
}
function StairsIcon() {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, background: 'var(--vxn-bg-cloud)',
      display: 'grid', placeItems: 'center', position: 'relative',
    }}>
      <svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 18h5v-4h5v-4h5V6" stroke="var(--vxn-fg-3)" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
    </div>
  );
}

function PickupCard({ title, icon, stops }) {
  return (
    <Card padding={20}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon name={icon} size={18} color="var(--vxn-teal-700)" />
        <span style={{ font: '600 15px var(--font-display)', color: 'var(--vxn-ink)' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stops.map(([t, name, addr, on], i) => (
          <label key={i} style={{
            display: 'grid', gridTemplateColumns: '20px 56px 1fr', gap: 12,
            padding: '12px 14px', borderRadius: 10,
            border: `1px solid ${on ? 'var(--vxn-teal-700)' : 'var(--vxn-border)'}`,
            background: on ? 'var(--vxn-info-bg)' : '#fff', cursor: 'pointer', alignItems: 'center',
          }}>
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              border: `5px solid ${on ? 'var(--vxn-teal-700)' : 'var(--vxn-border-strong)'}`,
              background: on ? '#fff' : '#fff',
            }} />
            <span style={{ font: '700 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{t}</span>
            <div>
              <div style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{name}</div>
              <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>{addr}</div>
            </div>
          </label>
        ))}
      </div>
    </Card>
  );
}

function SeatSidebar({ trip, selection, step }) {
  const accent = vxnAccent();
  return (
    <aside style={{
      borderLeft: '1px solid var(--vxn-border)', background: '#fff',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
      overflow: 'auto',
    }}>
      <div>
        <div style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-5)', letterSpacing: '.05em', marginBottom: 4 }}>CHUYẾN ĐI</div>
        <div style={{ font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Hà Nội → Sapa</div>
        <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)', marginTop: 2 }}>T6, 15/05/2026 · {trip.depart} → {trip.arrive}</div>
      </div>

      <div style={{ height: 1, background: 'var(--vxn-bg-fog)' }} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>Ghế đã chọn ({selection.length})</span>
          <a style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Bỏ chọn</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selection.map(s => (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              border: '1px solid var(--vxn-border)', borderRadius: 10,
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 6, background: accent, color: '#fff',
                display: 'grid', placeItems: 'center', font: '600 12px var(--font-display)',
              }}>{s}</span>
              <div style={{ flex: 1 }}>
                <div style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-ink)' }}>Cabin tầng dưới</div>
                <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Bên cạnh cửa sổ</div>
              </div>
              <span style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{VND(trip.finalPrice)}</span>
            </div>
          ))}
          {selection.length === 0 && (
            <div style={{
              padding: 18, borderRadius: 10, border: '1px dashed var(--vxn-border-strong)',
              font: '400 13px var(--font-display)', color: 'var(--vxn-fg-5)', textAlign: 'center',
            }}>Chưa chọn ghế nào</div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--vxn-bg-fog)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
        <Row label={`${selection.length} vé × ${VND(trip.finalPrice)}`} value={VND(selection.length * trip.finalPrice)} />
        <Row label="Phí dịch vụ" value="0đ" />
        <Row label="Mã HE2026" value={`-${VND(60000)}`} valueColor="var(--vxn-success-fg)" />
      </div>

      <div style={{
        padding: 16, background: 'var(--vxn-bg-soft)', borderRadius: 12,
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <span style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-fg-2)' }}>Tổng</span>
        <span style={{ font: '700 24px var(--font-display)', color: 'var(--vxn-saffron-700)' }}>
          {VND(selection.length * trip.finalPrice - 60000)}
        </span>
      </div>

      <Btn kind="primary" size="lg">
        Tiếp tục → Thông tin hành khách
      </Btn>

      <button style={{
        height: 40, background: 'transparent', border: '1px solid var(--vxn-border)',
        borderRadius: 8, font: '500 13px var(--font-display)', color: 'var(--vxn-fg-2)', cursor: 'pointer',
      }}>← Đổi chuyến khác</button>
    </aside>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <span style={{ color: valueColor || 'var(--vxn-ink)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ============================================================
//  PASSENGER INFO — /booking/passenger-info
// ============================================================
function PassengerInfoScreen() {
  const trip = SAMPLE_TRIPS[2];
  const accent = vxnAccent();
  return (
    <Frame active="buy" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tìm chuyến','Hà Nội → Sapa','Chọn ghế','Thông tin hành khách']} />
      <BookingStepper step={2} />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        <div style={{ padding: '20px 32px 40px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Contact info */}
          <Card padding={28}>
            <SectionTitle num={1} title="Thông tin liên hệ" subtitle="Sẽ dùng để gửi vé qua email & SMS" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldFilled label="Họ và tên *" value="Nguyễn Minh Châu" icon="user" />
              <FieldFilled label="Số điện thoại *" value="0901 234 567" icon="phone" />
              <FieldFilled label="Email *" value="minhchau@email.com" icon="mail" />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 4, background: accent, display: 'grid', placeItems: 'center' }}>
                    <Icon name="check" size={11} color="#fff" />
                  </span>
                  Người liên hệ là hành khách 1
                </label>
              </div>
            </div>
          </Card>

          {/* Passenger 1 */}
          <Card padding={28}>
            <SectionTitle num={2} title="Hành khách 1 · Ghế B02" subtitle="Lên xe phải mang theo CCCD/CMND khớp tên đặt vé." right={<a style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-teal-800)' }}>Chọn từ hành khách đã lưu →</a>} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldFilled label="Họ và tên *" value="Nguyễn Minh Châu" icon="user" />
              <FieldFilled label="Số CMND/CCCD" value="079094012345" icon="shield" />
              <FieldFilled label="Số điện thoại" value="0901 234 567" icon="phone" />
              <FieldFilled label="Ngày sinh" value="14/03/1995" icon="calendar" />
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, border: '1.5px solid var(--vxn-border-strong)' }} />
              Lưu vào danh sách hành khách thường đi (tối đa 5)
            </label>
          </Card>

          {/* Passenger 2 */}
          <Card padding={28}>
            <SectionTitle num={3} title="Hành khách 2 · Ghế C02" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldFilled label="Họ và tên *" value="Trần Đức Anh" icon="user" />
              <FieldFilled label="Số CMND/CCCD" placeholder="Tuỳ chọn" icon="shield" empty />
              <FieldFilled label="Số điện thoại" value="0938 446 102" icon="phone" />
              <FieldFilled label="Ngày sinh" placeholder="dd/mm/yyyy" icon="calendar" empty />
            </div>
          </Card>

          {/* Pickup confirm */}
          <Card padding={28}>
            <SectionTitle num={4} title="Điểm đón & trả" subtitle="Đã chọn ở bước trước, có thể đổi tại đây." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 10, background: 'var(--vxn-info-bg)', display: 'flex', gap: 12 }}>
                <Icon name="markerDep" size={20} color="var(--vxn-teal-700)" />
                <div>
                  <div style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Điểm đón · 08:15</div>
                  <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>VP Trần Duy Hưng</div>
                  <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>14 Trần Duy Hưng, Cầu Giấy, Hà Nội</div>
                </div>
              </div>
              <div style={{ padding: 16, borderRadius: 10, background: 'var(--vxn-info-bg)', display: 'flex', gap: 12 }}>
                <Icon name="markerArr" size={20} color="var(--vxn-teal-700)" />
                <div>
                  <div style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Điểm trả · 13:30</div>
                  <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>VP Cầu Mây</div>
                  <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>Số 8 Cầu Mây, P. Sapa, Lào Cai</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Voucher */}
          <Card padding={28}>
            <SectionTitle num={5} title="Mã giảm giá & ưu đãi" />
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 16px', height: 48,
                border: '1px solid var(--vxn-saffron-600)', borderRadius: 10, background: '#FFF7E8',
              }}>
                <Icon name="discount" size={18} color="var(--vxn-saffron-700)" />
                <span style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-saffron-700)', letterSpacing: '.04em' }}>HE2026</span>
                <span style={{ marginLeft: 8, font: '400 13px var(--font-display)', color: 'var(--vxn-success-fg)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="checkCircle" size={14} /> Đã áp dụng — giảm 60,000đ
                </span>
              </div>
              <button style={{ height: 48, padding: '0 20px', border: '1px solid var(--vxn-border)', background: '#fff', borderRadius: 10, font: '500 13px var(--font-display)', cursor: 'pointer' }}>Đổi mã khác</button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {[
                ['MEMBER10', 'Hạng Gold giảm 10%', '−42,000đ'],
                ['BACTUYEN', 'Tuyến Bắc — 50k miễn ship', '−50,000đ'],
                ['HE2026', 'Khuyến mãi hè', '−60,000đ', true],
              ].map(([c, d, v, on]) => (
                <div key={c} style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${on ? 'var(--vxn-saffron-600)' : 'var(--vxn-border)'}`,
                  background: on ? '#FFF7E8' : '#fff',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ font: '600 12px var(--font-display)', color: on ? 'var(--vxn-saffron-700)' : 'var(--vxn-fg-2)', letterSpacing: '.04em' }}>{c}</span>
                  <span style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)' }}>{d}</span>
                  <span style={{ font: '600 12px var(--font-display)', color: 'var(--vxn-success-fg)' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Add-ons */}
          <Card padding={28}>
            <SectionTitle num={6} title="Dịch vụ bổ trợ" subtitle="Tuỳ chọn — có thể bỏ qua." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                ['Bảo hiểm chuyến đi','Bồi thường đến 50tr/lượt','+19,000đ', 'shield', true],
                ['Hành lý ký gửi','Lên đến 20kg, đảm bảo','+35,000đ', 'bag'],
                ['Đưa đón sân bay','Nội Bài → Trần Duy Hưng','+150,000đ', 'bus'],
              ].map(([t, d, p, ic, on]) => (
                <div key={t} style={{
                  padding: 16, borderRadius: 12,
                  border: `1px solid ${on ? 'var(--vxn-teal-700)' : 'var(--vxn-border)'}`,
                  background: on ? 'var(--vxn-info-bg)' : '#fff',
                  display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: on ? '#fff' : 'var(--vxn-bg-mist)',
                      display: 'grid', placeItems: 'center',
                    }}><Icon name={ic} size={18} color={on ? 'var(--vxn-teal-700)' : 'var(--vxn-fg-3)'} /></div>
                    <span style={{
                      width: 18, height: 18, borderRadius: 4,
                      border: on ? '0' : '1.5px solid var(--vxn-border-strong)',
                      background: on ? 'var(--vxn-teal-700)' : '#fff',
                      display: 'grid', placeItems: 'center',
                    }}>{on && <Icon name="check" size={12} color="#fff" />}</span>
                  </div>
                  <div>
                    <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{t}</div>
                    <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-3)', marginTop: 2 }}>{d}</div>
                  </div>
                  <div style={{ font: '700 14px var(--font-display)', color: 'var(--vxn-saffron-700)' }}>{p}</div>
                </div>
              ))}
            </div>
          </Card>

        </div>
        <SeatSidebar trip={trip} selection={['B02','C02']} step="passenger" />
      </div>
    </Frame>
  );
}

function SectionTitle({ num, title, subtitle, right }) {
  const accent = vxnAccent();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
      <span style={{
        width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff',
        display: 'grid', placeItems: 'center', font: '600 14px var(--font-display)',
      }}>{num}</span>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, font: '600 18px var(--font-display)', color: 'var(--vxn-ink)' }}>{title}</h3>
        {subtitle && <p style={{ margin: '4px 0 0', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function FieldFilled({ label, value, placeholder, icon, empty }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: '500 12px var(--font-display)', color: 'var(--vxn-fg-3)', letterSpacing: '.02em' }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, height: 48,
        padding: '0 14px', border: '1px solid var(--vxn-border)', borderRadius: 10,
        background: '#fff',
      }}>
        <Icon name={icon} size={16} color="var(--vxn-fg-5)" />
        <span style={{ font: `500 15px var(--font-display)`, color: empty ? 'var(--vxn-fg-disabled)' : 'var(--vxn-ink)' }}>
          {value || placeholder}
        </span>
      </div>
    </label>
  );
}

// ============================================================
//  CONFIRM + PAYMENT — /booking/confirm/:bookingId
// ============================================================
function PaymentMethodScreen() {
  const trip = SAMPLE_TRIPS[2];
  return (
    <Frame active="buy" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Tìm chuyến','Hà Nội → Sapa','Thanh toán']} />
      <BookingStepper step={3} />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        <div style={{ padding: '20px 32px 40px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card padding={28}>
            <SectionTitle num={1} title="Chọn phương thức thanh toán" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <PaymentMethod logo="momo" name="Ví MoMo" desc="Thanh toán qua app MoMo" />
              <PaymentMethod logo="vnpay" name="VNPay" desc="QR / Thẻ ATM nội địa" selected />
              <PaymentMethod logo="zalo" name="ZaloPay" desc="Quét QR Zalo" />
              <PaymentMethod logo="visa" name="Thẻ Visa/Master" desc="Quốc tế" />
              <PaymentMethod logo="atm" name="Thẻ ATM" desc="Internet Banking 30+ ngân hàng" />
              <PaymentMethod logo="cash" name="Tiền mặt" desc="Thanh toán khi lên xe" />
            </div>
          </Card>

          <Card padding={28}>
            <SectionTitle num={2} title="Chọn ngân hàng" subtitle="Áp dụng cho VNPay — không bắt buộc." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {['VCB','TCB','BIDV','MB','VIB','ACB','TPB','VPB','OCB','HD','MSB','STB'].map((b, i) => (
                <div key={b} style={{
                  padding: '14px 12px', border: `1.5px solid ${i===0 ? 'var(--vxn-teal-700)' : 'var(--vxn-border)'}`,
                  borderRadius: 10, background: i===0 ? 'var(--vxn-info-bg)' : '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 36, height: 24, borderRadius: 4,
                    background: ['#006633','#E60000','#0E5DA7','#1A6BD8','#1F2D6A','#0E4E96','#FCB214','#34A853','#E1AF00','#B41E1A','#1F4E9E','#0466C8'][i],
                    color: '#fff', font: '700 10px var(--font-display)',
                    display: 'grid', placeItems: 'center',
                  }}>{b}</div>
                  <span style={{ font: '500 11px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
                    {['Vietcombank','Techcombank','BIDV','MBBank','VIB','ACB','TPBank','VPBank','OCB','HDBank','MSB','Sacombank'][i]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={24}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Icon name="shield" size={20} color="var(--vxn-success-leaf)" />
              <div>
                <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>Thanh toán an toàn qua VNPay</div>
                <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)', marginTop: 4, lineHeight: 1.5 }}>
                  Dữ liệu thẻ được mã hoá PCI-DSS, không lưu trên hệ thống của VXN. Sau khi nhấn "Thanh toán" bạn sẽ được chuyển tiếp tới cổng VNPay.
                </div>
              </div>
            </div>
          </Card>

          <Card padding={24}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--vxn-teal-700)', display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={11} color="#fff" />
              </span>
              <div style={{ font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)', lineHeight: 1.5 }}>
                Tôi đồng ý với <a style={{ color: 'var(--vxn-teal-800)' }}>Điều khoản dịch vụ</a> và <a style={{ color: 'var(--vxn-teal-800)' }}>Chính sách đổi/hủy</a> của Vé Xe Nhanh. Tôi xác nhận thông tin hành khách khớp với CMND/CCCD.
              </div>
            </div>
          </Card>
        </div>
        <PayingSidebar trip={trip} />
      </div>
    </Frame>
  );
}

function PaymentMethod({ logo, name, desc, selected }) {
  const accent = vxnAccent();
  return (
    <div style={{
      padding: 16, border: `1.5px solid ${selected ? accent : 'var(--vxn-border)'}`,
      borderRadius: 12, background: selected ? 'var(--vxn-info-bg)' : '#fff',
      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
      position: 'relative',
    }}>
      <PaymentLogo kind={logo} />
      <div style={{ flex: 1 }}>
        <div style={{ font: '600 14px var(--font-display)', color: 'var(--vxn-ink)' }}>{name}</div>
        <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{
        width: 20, height: 20, borderRadius: '50%',
        border: `2px solid ${selected ? accent : 'var(--vxn-border-strong)'}`,
        display: 'grid', placeItems: 'center',
      }}>
        {selected && <span style={{ width: 10, height: 10, borderRadius: '50%', background: accent }} />}
      </span>
    </div>
  );
}

function PaymentLogo({ kind }) {
  const styles = {
    momo:  { bg: '#A50064', text: 'MoMo', font: '700 13px' },
    vnpay: { bg: '#005DAA', text: 'VNPay', font: '700 13px' },
    zalo:  { bg: '#008FE5', text: 'Zalo', font: '700 13px' },
    visa:  { bg: '#1A1F71', text: 'VISA', font: '900 12px' },
    atm:   { bg: 'linear-gradient(135deg, #E89B26, #D18A1E)', text: 'ATM', font: '700 13px' },
    cash:  { bg: 'linear-gradient(135deg, #00613D, #00794B)', text: '₫', font: '700 18px' },
  };
  const s = styles[kind];
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 10, background: s.bg, color: '#fff',
      display: 'grid', placeItems: 'center', font: `${s.font} var(--font-display)`, letterSpacing: '.04em',
    }}>{s.text}</div>
  );
}

function PayingSidebar({ trip }) {
  return (
    <aside style={{
      borderLeft: '1px solid var(--vxn-border)', background: '#fff',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '600 16px var(--font-display)', color: 'var(--vxn-ink)' }}>Đơn của bạn</span>
        <Chip tone="warning"><Icon name="clock" size={11} /> Còn 12:48</Chip>
      </div>

      <div style={{
        padding: 16, background: 'var(--vxn-bg-soft)', borderRadius: 12,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: trip.operator.color, color: '#fff', display: 'grid', placeItems: 'center', font: '700 14px var(--font-display)' }}>{trip.operator.short}</div>
          <div>
            <div style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-ink)' }}>{trip.operator.name}</div>
            <div style={{ font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>Limousine VIP · BS 30H-468.91</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
          <span style={{ font: '700 14px var(--font-display)' }}>08:15</span>
          <Icon name="arrowRight" size={12} color="var(--vxn-fg-5)" />
          <span style={{ font: '700 14px var(--font-display)' }}>13:30</span>
          <span style={{ marginLeft: 'auto', font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)' }}>T6 · 15/05</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: '1px dashed var(--vxn-border-strong)', font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
          <strong>Hà Nội</strong>
          <span style={{ flex: 1, height: 1, background: 'var(--vxn-border-strong)', position: 'relative' }}>
            <Icon name="bus" size={12} color="var(--vxn-teal-700)" style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', background: 'var(--vxn-bg-soft)' }} />
          </span>
          <strong>Sapa</strong>
        </div>
      </div>

      <div>
        <div style={{ font: '500 13px var(--font-display)', color: 'var(--vxn-fg-3)', marginBottom: 6 }}>Hành khách & ghế</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-2)' }}>
          <div>Nguyễn Minh Châu · <strong style={{ color: 'var(--vxn-ink)' }}>B02</strong></div>
          <div>Trần Đức Anh · <strong style={{ color: 'var(--vxn-ink)' }}>C02</strong></div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--vxn-bg-fog)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)' }}>
        <Row label="2 vé × 520,000đ" value={VND(1040000)} />
        <Row label="Bảo hiểm chuyến" value={VND(19000)} />
        <Row label="Mã HE2026" value={`-${VND(60000)}`} valueColor="var(--vxn-success-fg)" />
        <Row label="Hạng Gold −10%" value={`-${VND(99900)}`} valueColor="var(--vxn-success-fg)" />
      </div>

      <div style={{
        padding: 16, background: 'var(--vxn-bg-soft)', borderRadius: 12,
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <span style={{ font: '500 14px var(--font-display)', color: 'var(--vxn-fg-2)' }}>Tổng cộng</span>
        <span style={{ font: '700 26px var(--font-display)', color: 'var(--vxn-saffron-700)' }}>{VND(899100)}</span>
      </div>

      <Btn kind="saffron" size="lg">
        Thanh toán {VND(899100)} → VNPay
      </Btn>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: '400 12px var(--font-display)', color: 'var(--vxn-fg-5)', justifyContent: 'center' }}>
        <Icon name="shield" size={12} /> Mã hoá SSL · không lưu thông tin thẻ
      </div>
    </aside>
  );
}

// ============================================================
//  PAYMENT LANDING — success / failure / error
// ============================================================
function PaymentResultScreen() {
  return (
    <Frame active="buy" signedIn>
      <PageTopUtility crumbs={['Trang chủ','Hành trình','Thanh toán']} />
      <div style={{ flex: 1, padding: '32px 32px 48px', overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        <ResultCard kind="success" />
        <ResultCard kind="failure" />
        <ResultCard kind="error" />
      </div>
    </Frame>
  );
}

function ResultCard({ kind }) {
  const cfg = {
    success: {
      label: 'success', tone: 'success', icon: 'checkCircle', color: 'var(--vxn-success-fg)', bg: 'var(--vxn-success-bg)',
      title: 'Thanh toán thành công',
      sub: 'Vé điện tử đã được gửi tới email và SMS của bạn.',
      data: [['Mã đặt vé','BK20260513123456'],['Mã thanh toán','VNPAY-77234012'],['Số tiền','899,100đ'],['Phương thức','VNPay · Vietcombank · ****1234']],
      ctas: [['saffron','Xem vé điện tử'],['ghost','Tải PDF']],
    },
    failure: {
      label: 'failure', tone: 'danger', icon: 'xCircle', color: 'var(--vxn-danger-fg)', bg: 'var(--vxn-danger-bg)',
      title: 'Thanh toán thất bại',
      sub: 'Ngân hàng đã từ chối giao dịch. Ghế vẫn được giữ trong 8 phút nữa — bạn có thể thử lại.',
      data: [['Mã đơn','BK20260513123457'],['Lý do','Số dư không đủ (Mã 51)'],['Mã GD','VNPAY-77234013']],
      ctas: [['primary','Thử thanh toán lại'],['ghost','Đổi phương thức']],
    },
    error: {
      label: 'error', tone: 'warning', icon: 'warning', color: 'var(--vxn-warning-fg)', bg: 'var(--vxn-warning-bg)',
      title: 'Có lỗi từ cổng thanh toán',
      sub: 'Hệ thống VNPay tạm thời gián đoạn. Đơn hàng chưa bị trừ tiền.',
      data: [['Mã đơn','BK20260513123458'],['Lỗi','Connection timeout (HTTP 504)'],['Thời điểm','15/05/2026, 09:42 ICT']],
      ctas: [['primary','Thử lại trong 1 phút'],['ghost','Liên hệ CSKH']],
    },
  }[kind];

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid var(--vxn-border)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        background: cfg.bg, padding: '32px 28px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12, textAlign: 'center', borderBottom: `4px solid ${cfg.color}`,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: '#fff',
          display: 'grid', placeItems: 'center', boxShadow: `0 0 0 6px ${cfg.bg}`,
        }}>
          <Icon name={cfg.icon} size={40} color={cfg.color} />
        </div>
        <h2 style={{ margin: 0, font: '600 22px var(--font-display)', color: 'var(--vxn-ink)' }}>{cfg.title}</h2>
        <p style={{ margin: 0, font: '400 13px var(--font-display)', color: 'var(--vxn-fg-3)', maxWidth: 320, lineHeight: 1.5 }}>{cfg.sub}</p>
        <Chip tone={cfg.tone} style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>{cfg.label}</Chip>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cfg.data.map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', font: '400 13px var(--font-display)' }}>
            <span style={{ color: 'var(--vxn-fg-4)' }}>{l}</span>
            <span style={{ color: 'var(--vxn-ink)', fontWeight: 500, fontFamily: l.includes('Mã') || l.includes('GD') ? 'var(--font-mono)' : 'var(--font-display)' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        {cfg.ctas.map(([k, l]) => <Btn key={l} kind={k}>{l}</Btn>)}
      </div>
    </div>
  );
}

Object.assign(window, { SeatPickerScreen, PassengerInfoScreen, PaymentMethodScreen, PaymentResultScreen });
