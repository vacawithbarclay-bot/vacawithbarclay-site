// Business settings for vacawithbarclay.com. Change values here; the site and the
// booking functions both read this file.

export const CONFIG = {
  brand: 'Vaca with Barclay',
  timezone: 'America/New_York',
  checkInTime: '4:00 PM',
  checkOutTime: '10:00 AM',

  // Taxes charged on rent + cleaning for direct stays (Santa Rosa County, FL).
  // 6% state sales tax + 1% county surtax + 5% tourist development tax = 12%.
  taxes: [
    { id: 'state', label: 'Florida sales tax', rate: 0.06 },
    { id: 'surtax', label: 'Santa Rosa County surtax', rate: 0.01 },
    { id: 'tdt', label: 'Tourist development tax', rate: 0.05 },
  ],
  taxesEnabled: true,

  // Discount off PriceLabs nightly prices for booking direct (0.10 = 10%).
  directDiscount: 0,

  // Payment schedule: deposit now, balance charged automatically this many days
  // before check-in. Bookings made inside that window pay in full.
  depositShare: 0.5,
  balanceDaysBefore: 30,

  // How long a guest can sit on the payment page before the dates are released.
  holdMinutes: 30,

  // Booking window.
  minLeadDays: 1, // earliest check-in is tomorrow
  maxAdvanceDays: 540,

  cancellationPolicy: [
    'Full refund if you cancel 30 or more days before check-in.',
    '50% refund if you cancel 8 to 29 days before check-in.',
    'No refund within 7 days of check-in.',
  ],

  units: {
    BV2: {
      id: 'BV2',
      name: 'Beachview 2',
      cleaningFee: 300,
      maxGuests: 8,
      defaultMinNights: 2,
      pricelabs: { id: '683f952ede2a120072a7b39a', pms: 'guesty' },
      // iCal export links from each channel (Airbnb: Calendar > Availability >
      // Connect calendars > Export; VRBO: Calendar > Import/Export). Set as env vars.
      icalEnv: ['ICAL_BV2_AIRBNB', 'ICAL_BV2_VRBO'],
    },
    BV13: {
      id: 'BV13',
      name: 'Beachview 13',
      cleaningFee: 300,
      maxGuests: 8,
      defaultMinNights: 2,
      pricelabs: { id: '683f952e675a1a0063dc6b09', pms: 'guesty' },
      icalEnv: ['ICAL_BV13_AIRBNB', 'ICAL_BV13_VRBO'],
    },
  },
};
