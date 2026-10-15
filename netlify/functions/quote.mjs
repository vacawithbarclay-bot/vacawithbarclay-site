// POST /api/quote {unit, checkIn, checkOut, guests} -> price breakdown, checked against live availability.
import { CONFIG } from '../../shared/config.js';
import { buildQuote, addDays } from '../../shared/pricing.js';
import { unitCalendar, todayLocal } from '../../lib/calendar.mjs';
import { json } from '../../lib/http.mjs';

export async function liveQuote({ unit, checkIn, checkOut, guests }, opts) {
  if (!CONFIG.units[unit]) return { ok: false, error: 'Pick a home.' };
  const calendar = await unitCalendar(unit, checkIn, addDays(checkOut, 0), opts);
  return buildQuote({ config: CONFIG, unitId: unit, checkIn, checkOut, guests, calendar, today: todayLocal() });
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  try {
    const result = await liveQuote(await req.json());
    return json(result, result.ok ? 200 : 409);
  } catch (e) {
    console.error('quote', e);
    return json({ ok: false, error: 'We couldn’t price those dates right now. Please try again in a minute.' }, 502);
  }
};

export const config = { path: '/api/quote' };
