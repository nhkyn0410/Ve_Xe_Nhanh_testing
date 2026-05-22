import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import useBookingStore from '../store/bookingStore';

const MAX_SEATS_SELECTION = 10;

const SEAT_TYPES = {
  AISLE: 'aisle',
  DRIVER: 'driver',
  FLOOR_SEPARATOR: 'floor_separator',
  SEAT: 'seat',
};

const isFloorSeparatorRow = (row = []) => row.some((cell) => cell === 'FLOOR_2');

const determineSeatType = (seatNumber) => {
  if (!seatNumber || seatNumber === '') return SEAT_TYPES.AISLE;
  const upper = String(seatNumber).toUpperCase();
  if (upper === 'AISLE' || upper.includes('AISLE')) return SEAT_TYPES.AISLE;
  if (upper === 'DRIVER' || upper === '🚗' || upper.includes('DRIVER')) return SEAT_TYPES.DRIVER;
  if (upper === 'FLOOR_2') return SEAT_TYPES.FLOOR_SEPARATOR;
  return SEAT_TYPES.SEAT;
};

const isVipSeat = (seat) => {
  if (!seat) return false;
  if (seat.isVip) return true;
  if (seat.type === 'vip') return true;
  if (typeof seat.seatNumber === 'string' && seat.seatNumber.toUpperCase().includes('VIP')) return true;
  return false;
};

const buildDecks = (seatLayout) => {
  if (!seatLayout?.layout) return [];

  const { rows, columns, layout, floors = 1 } = seatLayout;
  const decks = [{ floor: 1, rows: [] }];

  let currentDeck = decks[0];

  for (let r = 0; r < rows; r += 1) {
    const rawRow = layout[r] || [];

    if (isFloorSeparatorRow(rawRow)) {
      currentDeck = { floor: currentDeck.floor + 1, rows: [] };
      decks.push(currentDeck);
      continue;
    }

    const cells = [];
    for (let c = 0; c < columns; c += 1) {
      const seatNumber = rawRow[c];
      const seatType = determineSeatType(seatNumber);

      if (seatType === SEAT_TYPES.AISLE) {
        cells.push({ type: SEAT_TYPES.AISLE });
      } else if (seatType === SEAT_TYPES.DRIVER) {
        cells.push({ type: SEAT_TYPES.DRIVER });
      } else {
        const explicitFloor = typeof seatNumber === 'string' && seatNumber.startsWith('U') ? 2 : currentDeck.floor;
        cells.push({
          type: SEAT_TYPES.SEAT,
          seatNumber,
          row: r,
          col: c,
          floor: explicitFloor,
          isVip: false,
        });
      }
    }

    currentDeck.rows.push(cells);
  }

  return decks
    .filter((deck) => deck.rows.some((row) => row.some((cell) => cell.type === SEAT_TYPES.SEAT)))
    .map((deck) => ({
      ...deck,
      rows: deck.rows.filter((row) => row.some((cell) => cell.type === SEAT_TYPES.SEAT)),
      seatCount: deck.rows.reduce(
        (total, row) => total + row.filter((cell) => cell.type === SEAT_TYPES.SEAT).length,
        0,
      ),
    }))
    .slice(0, Math.max(floors, 1));
};

const DECK_LABEL = {
  1: 'Tầng dưới',
  2: 'Tầng trên',
  3: 'Tầng 3',
};

const SeatMapComponent = ({
  seatLayout,
  bookedSeats = [],
  heldSeats = [],
  availableSeats = [],
  maxSeatsAllowed = MAX_SEATS_SELECTION,
  seatPrice = 0,
  showPrice = false,
  vipSurcharge = 0,
}) => {
  const { selectedSeats, addSeat, removeSeat, clearSeats } = useBookingStore();
  const [decks, setDecks] = useState([]);

  useEffect(() => {
    if (selectedSeats.length > 0) {
      const firstSeat = selectedSeats[0];
      if (Array.isArray(firstSeat) || (typeof firstSeat === 'object' && !firstSeat?.seatNumber)) {
        clearSeats();
      }
    }
  }, []);

  useEffect(() => {
    if (seatLayout?.layout) {
      setDecks(buildDecks(seatLayout));
    } else {
      setDecks([]);
    }
  }, [seatLayout]);

  const bookedSet = useMemo(() => new Set(bookedSeats), [bookedSeats]);
  const heldSet = useMemo(() => new Set(heldSeats), [heldSeats]);
  const selectedSet = useMemo(() => new Set(selectedSeats.map((s) => s.seatNumber)), [selectedSeats]);
  const availableSet = useMemo(() => {
    if (!Array.isArray(availableSeats) || availableSeats.length === 0) return null;
    return new Set(availableSeats.map((s) => (typeof s === 'string' ? s : s?.seatNumber)).filter(Boolean));
  }, [availableSeats]);

  const handleSeatClick = useCallback(
    (cell) => {
      if (!cell || cell.type !== SEAT_TYPES.SEAT) return;
      if (bookedSet.has(cell.seatNumber) || heldSet.has(cell.seatNumber)) return;
      if (availableSet && !availableSet.has(cell.seatNumber)) return;

      if (selectedSet.has(cell.seatNumber)) {
        removeSeat(cell.seatNumber);
        return;
      }
      if (selectedSeats.length >= maxSeatsAllowed) return;
      addSeat(cell);
    },
    [bookedSet, heldSet, availableSet, selectedSet, selectedSeats.length, maxSeatsAllowed, addSeat, removeSeat],
  );

  const renderSeat = (cell, key) => {
    if (!cell || cell.type === SEAT_TYPES.AISLE || cell.type === SEAT_TYPES.DRIVER) {
      return <div key={key} className="vxn-seat vxn-seat--gap" aria-hidden="true" />;
    }

    const isBooked = bookedSet.has(cell.seatNumber);
    const isHeld = heldSet.has(cell.seatNumber);
    const isUnavailable = availableSet ? !availableSet.has(cell.seatNumber) : false;
    const isSelected = selectedSet.has(cell.seatNumber);
    const vip = isVipSeat(cell);
    const disabled = isBooked || isHeld || isUnavailable;

    let stateClass = 'vxn-seat--available';
    if (isBooked) stateClass = 'vxn-seat--booked';
    else if (isHeld || isUnavailable) stateClass = 'vxn-seat--held';
    else if (isSelected) stateClass = 'vxn-seat--selected';

    const finalPrice = vip ? seatPrice + (vipSurcharge || 0) : seatPrice;
    const statusLabel = isBooked ? 'Đã đặt' : isHeld || isUnavailable ? 'Đang giữ' : isSelected ? 'Đang chọn' : 'Còn trống';
    const title = `Ghế ${cell.seatNumber} · ${statusLabel}${vip ? ' · VIP' : ''}${showPrice && finalPrice ? ` · ${finalPrice.toLocaleString('vi-VN')}đ` : ''}`;

    return (
      <button
        type="button"
        key={key}
        className={`vxn-seat ${stateClass} ${vip ? 'vxn-seat--vip' : ''}`}
        onClick={() => handleSeatClick(cell)}
        disabled={disabled}
        title={title}
        aria-label={title}
      >
        {vip && <span className="vxn-seat__vip-badge">VIP</span>}
        <span className="vxn-seat__number">{cell.seatNumber}</span>
        {isSelected && (
          <span className="vxn-seat__check" aria-hidden="true">
            <CheckOutlined />
          </span>
        )}
        {isBooked && (
          <span className="vxn-seat__overlay vxn-seat__overlay--booked" aria-hidden="true">
            <CloseOutlined />
          </span>
        )}
      </button>
    );
  };

  const isMultiDeck = decks.length > 1;

  const renderDeck = (deck, index) => {
    const bookedInDeck = deck.rows.reduce((total, row) => {
      return total + row.filter((cell) => cell.type === SEAT_TYPES.SEAT && (bookedSet.has(cell.seatNumber) || heldSet.has(cell.seatNumber))).length;
    }, 0);
    const availableInDeck = deck.seatCount - bookedInDeck;
    const isUpper = deck.floor >= 2;

    return (
      <div key={`deck-${deck.floor}-${index}`} className="vxn-deck">
        {isMultiDeck && (
          <div className="vxn-deck__header">
            <span className="vxn-deck__title-pill">{DECK_LABEL[deck.floor] || `Tầng ${deck.floor}`}</span>
            <span className="vxn-deck__title-count">
              {availableInDeck} / {deck.seatCount} chỗ
            </span>
          </div>
        )}
        <div className="vxn-deck__cabin">
          <div className="vxn-deck__cabin-inner">
            <div className="vxn-deck__entry">
              <span className="vxn-deck__entry-icon" aria-hidden="true">
                <UserOutlined />
              </span>
              <span className="vxn-deck__entry-text">
                {isUpper ? 'Cửa thang lên' : 'Tài xế · Cửa lên'}
              </span>
              <span className="vxn-deck__entry-end" aria-hidden="true">↗</span>
            </div>
            <div className="vxn-deck__rows">
              {deck.rows.map((row, rowIdx) => (
                <div key={`row-${rowIdx}`} className="vxn-deck__row">
                  {row.map((cell, colIdx) => renderSeat(cell, `cell-${rowIdx}-${colIdx}`))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const hasVipSeats = useMemo(
    () => decks.some((deck) => deck.rows.some((row) => row.some((cell) => isVipSeat(cell)))),
    [decks],
  );

  return (
    <div className="vxn-seatmap">
      <div className="vxn-seatmap__legend">
        <span className="vxn-seatmap__legend-item">
          <span className="vxn-legend-chip vxn-legend-chip--selected" /> Đang chọn
        </span>
        <span className="vxn-seatmap__legend-item">
          <span className="vxn-legend-chip vxn-legend-chip--available" /> Còn trống
        </span>
        <span className="vxn-seatmap__legend-item">
          <span className="vxn-legend-chip vxn-legend-chip--booked" /> Đã đặt
        </span>
        <span className="vxn-seatmap__legend-item">
          <span className="vxn-legend-chip vxn-legend-chip--held" /> Đang giữ
        </span>
        {hasVipSeats && (
          <span className="vxn-seatmap__legend-item">
            <span className="vxn-legend-chip vxn-legend-chip--vip" /> VIP {vipSurcharge ? `(+${Math.round(vipSurcharge / 1000)}K)` : ''}
          </span>
        )}
      </div>

      <div className="vxn-seatmap__status">
        Đã chọn: <strong>{selectedSeats.length}</strong> / {maxSeatsAllowed} ghế
      </div>

      <div className={`vxn-seatmap__decks ${decks.length > 1 ? 'vxn-seatmap__decks--multi' : ''}`}>
        {decks.map((deck, index) => renderDeck(deck, index))}
      </div>

      <style>{`
        .vxn-seatmap {
          width: 100%;
        }

        .vxn-seatmap__legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 18px;
          margin-bottom: 14px;
          padding: 12px 14px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13px;
          color: #475569;
        }

        .vxn-seatmap__legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .vxn-legend-chip {
          width: 18px;
          height: 22px;
          border-radius: 5px;
          display: inline-block;
          border: 1.5px solid transparent;
        }

        .vxn-legend-chip--selected {
          background: #036672;
          border-color: #036672;
        }

        .vxn-legend-chip--available {
          background: #fff;
          border-color: #cbd5e1;
        }

        .vxn-legend-chip--booked {
          background: #e2e8f0;
          border-color: #cbd5e1;
          position: relative;
        }

        .vxn-legend-chip--booked::after {
          content: '';
          position: absolute;
          inset: 4px;
          background: repeating-linear-gradient(45deg, #94a3b8 0 2px, transparent 2px 4px);
          border-radius: 2px;
        }

        .vxn-legend-chip--held {
          background: #fef3c7;
          border-color: #fcd34d;
        }

        .vxn-legend-chip--vip {
          background: #fff8eb;
          border-color: #f3a526;
        }

        .vxn-seatmap__status {
          background: #ecfeff;
          border: 1px solid #a5f3fc;
          color: #036672;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 14px;
        }

        .vxn-seatmap__decks {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }

        .vxn-seatmap__decks--multi {
          grid-template-columns: 1fr;
        }

        @media (min-width: 768px) {
          .vxn-seatmap__decks--multi {
            grid-template-columns: 1fr 1fr;
          }
        }

        .vxn-deck {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
        }

        .vxn-deck__header {
          padding: 14px 18px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vxn-deck__title-pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(3, 102, 114, 0.1);
          color: #036672;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .vxn-deck__title-count {
          font-size: 13px;
          color: #475569;
          font-weight: 500;
        }

        .vxn-deck__cabin {
          padding: 18px 16px 22px;
          display: flex;
          justify-content: center;
          background: transparent;
        }

        .vxn-deck__cabin-inner {
          display: inline-flex;
          flex-direction: column;
          width: fit-content;
          max-width: 100%;
          padding: 16px 18px 20px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .vxn-deck__entry {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 8px 14px;
          font-size: 13px;
          color: #475569;
          font-weight: 500;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #e2e8f0;
          width: 100%;
          box-sizing: border-box;
        }

        .vxn-deck__entry-icon {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          background: rgba(3, 102, 114, 0.1);
          color: #036672;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }

        .vxn-deck__entry-text {
          white-space: nowrap;
          flex: 1;
          text-align: center;
        }

        .vxn-deck__entry-end {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          background: rgba(3, 102, 114, 0.1);
          color: #036672;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }

        .vxn-deck__rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-self: center;
          width: fit-content;
        }

        .vxn-deck__row {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
        }

        .vxn-seat {
          position: relative;
          width: 64px;
          height: 78px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
          background: #fff;
          color: #1f2937;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease;
          padding: 6px;
          box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
        }

        .vxn-seat:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px -10px rgba(15, 23, 42, 0.4);
          border-color: #036672;
        }

        .vxn-seat:focus-visible {
          outline: 2px solid #036672;
          outline-offset: 2px;
        }

        .vxn-seat:disabled {
          cursor: not-allowed;
        }

        .vxn-seat__number {
          line-height: 1;
          font-size: 14px;
        }

        .vxn-seat--gap {
          background: transparent;
          border-color: transparent;
          cursor: default;
          box-shadow: none;
          pointer-events: none;
        }

        .vxn-seat--gap:hover {
          transform: none;
          box-shadow: none;
          border-color: transparent;
          background: transparent;
        }

        .vxn-seat--available {
          background: #fff;
          border-color: #cbd5e1;
          color: #1f2937;
        }

        .vxn-seat--selected {
          background: #036672;
          border-color: #036672;
          color: #fff;
        }

        .vxn-seat--selected .vxn-seat__price {
          opacity: 0.85;
        }

        .vxn-seat--held {
          background: #fef3c7;
          border-color: #fcd34d;
          color: #92400e;
        }

        .vxn-seat--booked {
          background: #e2e8f0;
          border-color: #cbd5e1;
          color: #94a3b8;
          background-image: repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.4) 0 2px, transparent 2px 6px);
        }

        .vxn-seat--vip {
          background: #fff8eb;
          border-color: #f3a526;
          color: #92400e;
        }

        .vxn-seat--vip.vxn-seat--selected {
          background: #036672;
          border-color: #036672;
          color: #fff;
        }

        .vxn-seat__vip-badge {
          position: absolute;
          top: -8px;
          right: -6px;
          background: #f3a526;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 6px;
          letter-spacing: 0.04em;
        }

        .vxn-seat__check {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 10px;
          color: #fff;
        }

        .vxn-seat__overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.4);
        }

        .vxn-seat__overlay--booked {
          color: #64748b;
        }

        @media (max-width: 640px) {
          .vxn-seat {
            width: 46px;
            height: 52px;
          }

          .vxn-seat__number {
            font-size: 12px;
          }

          .vxn-seat__price {
            font-size: 9px;
          }

          .vxn-deck__row {
            gap: 8px;
          }

          .vxn-deck__rows {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default SeatMapComponent;
