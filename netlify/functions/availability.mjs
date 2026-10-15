// GET /api/availability?unit=BV2  -> nightly prices and open nights for the next year.
import { CONFIG } from '../../shared/config.js';
import { unitCalendar, defaultRange, todayLocal } from '../../lib/calendar.mjs';
import { json } from '../../lib/http.mjs';

export default async (req) => {
  const unit = new URL(req.url).searchParams.get('unit');
  if (!CONFIG.units[unit]) return json({ error: 'Unknown home.' }, 400);
  try {
    const { from, to } = defaultRange();
    const nights = await unitCalendar(unit, from, to);
    return json({ unit, today: todayLocal(), nights });
  } catch (e) {
    console.error('availability', unit, e);
    return json({ error: 'We couldn’t load the calendar right now. Please try again in a minute.' }, 502);
  }
};

export const config = { path: '/api/availability' };
