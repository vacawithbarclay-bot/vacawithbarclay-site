// GET /api/booking?b=VWB-XXXX -> status for the thank-you page (no personal details).
import { getBooking, getHold } from '../../lib/store.mjs';
import { json } from '../../lib/http.mjs';

export default async (req) => {
  const id = new URL(req.url).searchParams.get('b') || '';
  if (!/^VWB-[A-Z0-9]{8}$/.test(id)) return json({ status: 'unknown' }, 400);
  const b = await getBooking(id);
  if (b) {
    return json({
      status: b.status, unitId: b.unitId, checkIn: b.checkIn, checkOut: b.checkOut,
      paid: b.paid, balance: b.balance, balanceDate: b.balanceDate, reason: b.reason || null,
    });
  }
  return json({ status: (await getHold(id)) ? 'processing' : 'unknown' });
};

export const config = { path: '/api/booking' };
