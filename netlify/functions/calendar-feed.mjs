// GET /calendar/BV2.ics -> direct bookings as an iCal feed. Import this link into
// Airbnb and VRBO so a direct booking blocks those dates there too.
import { CONFIG } from '../../shared/config.js';
import { listBookings } from '../../lib/store.mjs';

export default async (req, context) => {
  const unit = String(context.params.unit || '').replace(/\.ics$/i, '').toUpperCase();
  if (!CONFIG.units[unit]) return new Response('Not found', { status: 404 });
  const d = (iso) => iso.replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const events = (await listBookings())
    .filter((b) => b.unitId === unit && b.status === 'confirmed')
    .map((b) => ['BEGIN:VEVENT', `UID:${b.id}@vacawithbarclay.com`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d(b.checkIn)}`, `DTEND;VALUE=DATE:${d(b.checkOut)}`, 'SUMMARY:Direct booking', 'END:VEVENT'].join('\r\n'));
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vaca with Barclay//Direct//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n') + '\r\n';
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store' } });
};

export const config = { path: '/calendar/:unit' };
