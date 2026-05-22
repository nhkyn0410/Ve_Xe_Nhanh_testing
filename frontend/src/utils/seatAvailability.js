const isActualSeat = (seat) => {
  if (!seat) return false;

  const value = String(seat).trim();
  if (!value) return false;

  const upper = value.toUpperCase();
  return (
    upper !== 'DRIVER' &&
    upper !== 'FLOOR_2' &&
    upper !== 'BUS' &&
    upper !== 'AISLE' &&
    !upper.includes('AISLE')
  );
};

const flattenSeatLayout = (seatLayout) => {
  const layout = seatLayout?.layout;
  if (!Array.isArray(layout)) return [];

  return layout
    .flat()
    .filter(isActualSeat)
    .map((seat) => String(seat).trim())
    .filter((seat, index, seats) => seats.indexOf(seat) === index);
};

const normalizeSeatNumber = (seat) => {
  if (typeof seat === 'string') return seat;
  return seat?.seatNumber || seat?.number || '';
};

export const extractSeatAvailability = (responseOrData) => {
  const data = responseOrData?.data || responseOrData || {};
  const seatLayoutNumbers = flattenSeatLayout(data.seatLayout);
  const bookedSeats = (data.bookedSeats || data.bookedSeatNumbers || [])
    .map(normalizeSeatNumber)
    .filter(Boolean);
  const lockedSeats = (data.lockedSeats || data.heldSeatNumbers || [])
    .map(normalizeSeatNumber)
    .filter(Boolean);
  const unavailableSet = new Set([...bookedSeats, ...lockedSeats]);

  if (seatLayoutNumbers.length > 0) {
    const availableSeatNumbers = seatLayoutNumbers.filter((seat) => !unavailableSet.has(seat));

    return {
      totalSeats: Number(data.totalSeats || data.seatLayout?.totalSeats || seatLayoutNumbers.length),
      availableSeats: availableSeatNumbers.length,
      availableSeatNumbers,
      bookedSeatNumbers: bookedSeats,
      heldSeatNumbers: lockedSeats,
    };
  }

  if (Array.isArray(data.availableSeatNumbers)) {
    return {
      totalSeats: Number(data.totalSeats || data.availableSeatNumbers.length),
      availableSeats: data.availableSeatNumbers.length,
      availableSeatNumbers: data.availableSeatNumbers,
      bookedSeatNumbers: bookedSeats,
      heldSeatNumbers: lockedSeats,
    };
  }

  if (Array.isArray(data.availableSeats)) {
    const availableSeatNumbers = data.availableSeats.map(normalizeSeatNumber).filter(Boolean);

    return {
      totalSeats: Number(data.totalSeats || availableSeatNumbers.length),
      availableSeats: availableSeatNumbers.length,
      availableSeatNumbers,
      bookedSeatNumbers: bookedSeats,
      heldSeatNumbers: lockedSeats,
    };
  }

  if (typeof data.availableSeats === 'number' || typeof data.available === 'number') {
    const availableSeats = Math.max(0, Number(data.availableSeats ?? data.available) - lockedSeats.length);

    return {
      totalSeats: Number(data.totalSeats || availableSeats),
      availableSeats,
      availableSeatNumbers: [],
      bookedSeatNumbers: bookedSeats,
      heldSeatNumbers: lockedSeats,
    };
  }

  return null;
};

export const mergeSeatAvailabilityIntoTrip = (trip, availability) => {
  if (!trip || !availability) return trip;

  return {
    ...trip,
    totalSeats: availability.totalSeats,
    availableSeats: availability.availableSeats,
    seats: {
      ...(trip.seats || {}),
      total: availability.totalSeats,
      available: availability.availableSeats,
      bookedSeatNumbers: availability.bookedSeatNumbers,
      heldSeatNumbers: availability.heldSeatNumbers,
    },
  };
};
