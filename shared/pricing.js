// Pure booking math, shared by the website and the server. No network, no clock
// except what the caller passes in, so the same inputs always give the same quote.

const DAY = 86400000;

export const toDate = (iso) => new Date(iso + 'T00:00:00Z');
export const toISO = (d) => d.toISOString().slice(0, 10);
export const addDays = (iso, n) => toISO(new Date(toDate(iso).getTime() + n * DAY));
export const nightsBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
export const round2 = (n) => Math.round(n * 100) / 100;

// Every night of a stay: check-in up to, not including, check-out.
export function stayNights(checkIn, checkOut) {
  const out = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) out.push(d);
  return out;
}

/**
 * Build a quote.
 * @param {object} p
 * @param {object} p.config    CONFIG from shared/config.js
 * @param {string} p.unitId
 * @param {string} p.checkIn   YYYY-MM-DD
 * @param {string} p.checkOut  YYYY-MM-DD
 * @param {number} p.guests
 * @param {Object<string,{price:number,available:boolean,minStay?:number}>} p.calendar  nights keyed by date
 * @param {string} p.today     YYYY-MM-DD in the property's timezone
 * @returns {{ok:true, quote:object} | {ok:false, error:string, code:string}}
 */
export function buildQuote({ config, unitId, checkIn, checkOut, guests, calendar, today }) {
  const unit = config.units[unitId];
  if (!unit) return fail('unit', 'Pick a home.');
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(checkIn || '') || !iso.test(checkOut || '')) return fail('dates', 'Pick check-in and check-out dates.');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return fail('dates', 'Check-out has to be after check-in.');
  if (checkIn < addDays(today, config.minLeadDays)) return fail('dates', 'The earliest check-in is ' + addDays(today, config.minLeadDays) + '.');
  if (checkIn > addDays(today, config.maxAdvanceDays)) return fail('dates', 'Those dates are too far out to book yet.');
  const g = Number(guests);
  if (!Number.isInteger(g) || g < 1) return fail('guests', 'Enter the number of guests.');
  if (g > unit.maxGuests) return fail('guests', unit.name + ' sleeps up to ' + unit.maxGuests + '.');

  const list = stayNights(checkIn, checkOut);
  const missing = list.filter((d) => !calendar[d] || !calendar[d].available || !(calendar[d].price > 0));
  if (missing.length) return fail('unavailable', 'Some of those nights are already booked: ' + missing.join(', ') + '.');
  const minStay = Math.max(unit.defaultMinNights, (calendar[checkIn] && calendar[checkIn].minStay) || 0);
  if (nights < minStay) return fail('minstay', 'Stays starting ' + checkIn + ' are at least ' + minStay + ' nights.');

  const nightly = list.map((d) => ({ date: d, price: round2(calendar[d].price * (1 - config.directDiscount)) }));
  const rent = round2(nightly.reduce((s, n) => s + n.price, 0));
  const cleaning = round2(unit.cleaningFee);
  const taxable = rent + cleaning;
  const taxes = config.taxesEnabled
    ? config.taxes.map((t) => ({ id: t.id, label: t.label, rate: t.rate, amount: round2(taxable * t.rate) }))
    : [];
  const taxTotal = round2(taxes.reduce((s, t) => s + t.amount, 0));
  const total = round2(rent + cleaning + taxTotal);

  const balanceDate = addDays(checkIn, -config.balanceDaysBefore);
  const payInFull = balanceDate <= today;
  const dueNow = payInFull ? total : round2(total * config.depositShare);
  const balance = round2(total - dueNow);

  return {
    ok: true,
    quote: {
      unitId, unitName: unit.name, checkIn, checkOut, nights, guests: g,
      nightly, rent, cleaning, taxes, taxTotal, total,
      dueNow, balance, balanceDate: payInFull ? null : balanceDate,
    },
  };
}

function fail(code, error) {
  return { ok: false, code, error };
}

// Cents for Stripe.
export const cents = (n) => Math.round(n * 100);
