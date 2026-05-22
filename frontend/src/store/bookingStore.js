import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Booking Store
 * Manages booking flow state
 */
const useBookingStore = create(
  persist(
    (set, get) => ({
      // Search criteria
      searchCriteria: {
        fromCity: '',
        toCity: '',
        date: null,
        fromDate: null,
        toDate: null,
        passengers: 1,
      },

      // Selected trip
      selectedTrip: null,

      // Selected seats
      selectedSeats: [],

      // Passenger information
      passengers: [],

      // Contact information
      contactInfo: {
        name: '',
        phone: '',
        email: '',
      },

      // Pickup and dropoff points
      pickupPoint: null,
      dropoffPoint: null,

      // Voucher
      voucherCode: '',
      appliedVoucher: null,

      // Booking response from hold-seats
      currentBooking: null,

      // Session ID for seat locking
      sessionId: null,

      // Booking expiry time
      expiresAt: null,

      // Actions
      setSearchCriteria: (criteria) =>
        set({ searchCriteria: { ...get().searchCriteria, ...criteria } }),

      setSelectedTrip: (trip) => set({ selectedTrip: trip }),

      setSelectedSeats: (seats) => set({ selectedSeats: seats }),

      addSeat: (seat) =>
        set({ selectedSeats: [...get().selectedSeats, seat] }),

      removeSeat: (seatNumber) =>
        set({
          selectedSeats: get().selectedSeats.filter(
            (s) => s.seatNumber !== seatNumber
          ),
        }),

      clearSeats: () => set({ selectedSeats: [] }),

      setPassengers: (passengers) => set({ passengers }),

      updatePassenger: (index, passengerData) =>
        set({
          passengers: get().passengers.map((p, i) =>
            i === index ? { ...p, ...passengerData } : p
          ),
        }),

      setContactInfo: (info) =>
        set({ contactInfo: { ...get().contactInfo, ...info } }),

      setPickupPoint: (point) => set({ pickupPoint: point }),

      setDropoffPoint: (point) => set({ dropoffPoint: point }),

      setVoucherCode: (code) => set({ voucherCode: code }),

      setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),

      setCurrentBooking: (booking) => set({ currentBooking: booking }),

      setSessionId: (sessionId) => set({ sessionId }),

      setExpiresAt: (expiresAt) => set({ expiresAt }),

      // Reset booking flow
      resetBooking: () =>
        set({
          selectedTrip: null,
          selectedSeats: [],
          passengers: [],
          contactInfo: { name: '', phone: '', email: '' },
          pickupPoint: null,
          dropoffPoint: null,
          voucherCode: '',
          appliedVoucher: null,
          currentBooking: null,
          sessionId: null,
          expiresAt: null,
        }),

      // Reset only search
      resetSearch: () =>
        set({
          searchCriteria: {
            fromCity: '',
            toCity: '',
            date: null,
            fromDate: null,
            toDate: null,
            passengers: 1,
          },
        }),
    }),
    {
      name: 'booking-storage',
      partialize: (state) => ({
        searchCriteria: state.searchCriteria,
        selectedTrip: state.selectedTrip,
        selectedSeats: state.selectedSeats,
        passengers: state.passengers,
        contactInfo: state.contactInfo,
        pickupPoint: state.pickupPoint,
        dropoffPoint: state.dropoffPoint,
        voucherCode: state.voucherCode,
        appliedVoucher: state.appliedVoucher,
        currentBooking: state.currentBooking,
        sessionId: state.sessionId,
        expiresAt: state.expiresAt,
      }),
    }
  )
);

export default useBookingStore;
