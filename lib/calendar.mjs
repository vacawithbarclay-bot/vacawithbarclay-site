// Builds the bookable calendar for a unit: PriceLabs nightly prices, minus nights
// taken on Airbnb/VRBO (their iCal feeds), direct bookings and open checkout holds.
import { CONFIG } from '../shared/config.js';
import { addDays, stayNights, toISO } from '../shared/pricing.js';
import { listBookings, listHolds } from './store.mjs';

export function todayLocal() {
  return new Date().toLocaleDateString('en-CA', { timeZone: CONFIG.timezone });
}

async function pricelabsNights(unit, from, to) {
  const key = process.env.PRICELABS_API_KEY;
  if (!key) throw new Error('PRICELABS_API_KEY is not set');
  const res = await fetch('https://api.pricelabs.co/v1/listing_prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
    body: JSON.stringify({ listings: [{ id: unit.pricelabs.id, pms: unit.pricelabs.pms, dateFrom: from, dateTo: to }] }),
  });
  if (!res.ok) throw new Error('PriceLabs answered ' + res.status);
  const body = await res.json();
  const listing = (Array.isArray(body) ? body : body.data || [])[0];
  if (!listing || listing.error) throw new Error('PriceLabs: ' + ((listing && listing.error) || 'no prices returned'));
  const nights = {};
  for (const d of listing.data || []) {
    // user_price is -1 on nights PriceLabs sees as booked or blocked.
    const price = Number(d.user_price);
    nights[d.date] = {
      price: price > 0 ? price : 0,
      available: price > 0 && !d.unbookable,
      minStay: Number(d.min_stay) > 0 ? Number(d.min_stay) : 0,
    };
  }
  return nights;
}

// Minimal iCal reader: returns [{start, end}] date ranges (end exclusive).
export function parseIcal(text) {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const events = [];
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const get = (name) => {
      const m = block.match(new RegExp('^' + name + '[^:\\n]*:(\\d{8})', 'm'));
      return m ? m[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : null;
    };
    const start = get('DTSTART');
    const end = get('DTEND') || (start && addDays(start, 1));
    if (start && end && end > start) events.push({ start, end });
  }
  return events;
}

async function channelBusy(unit) {
  const urls = unit.icalEnv.map((k) => process.env[k]).filter(Boolean);
  const ranges = [];
  await Promise.all(urls.map(async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': 'vacawithbarclay-booking' } });
    if (!res.ok) throw new Error('Calendar feed answered ' + res.status);
    ranges.push(...parseIcal(await res.text()));
  }));
  return ranges;
}

/**
 * @returns {Promise<Object<string,{price:number,available:boolean,minStay:number}>>}
 * @param {string} unitId
 * @param {string} from first night
 * @param {string} to last night
 * @param {{ignoreHold?: string}} opts
 */
export async function unitCalendar(unitId, from, to, opts = {}) {
  const unit = CONFIG.units[unitId];
  if (!unit) throw new Error('Unknown unit');
  const [nights, busy, bookings, holds] = await Promise.all([
    pricelabsNights(unit, from, to),
    channelBusy(unit),
    listBookings(),
    listHolds(),
  ]);
  const block = (start, end) => { for (const d of stayNights(start, end)) if (nights[d]) nights[d].available = false; };
  busy.forEach((r) => block(r.start, r.end));
  bookings.filter((b) => b.unitId === unitId && b.status !== 'cancelled').forEach((b) => block(b.checkIn, b.checkOut));
  const now = Date.now();
  holds.filter((h) => h.unitId === unitId && h.expiresAt > now && h.id !== opts.ignoreHold).forEach((h) => block(h.checkIn, h.checkOut));
  return nights;
}

export const defaultRange = () => {
  const today = todayLocal();
  return { from: today, to: addDays(today, 365) };
};

export { toISO };
