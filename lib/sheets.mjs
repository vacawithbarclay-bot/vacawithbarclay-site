// Appends a confirmed direct booking to the reservations Google Sheet so the
// dashboard picks it up. Uses a small Google Apps Script web app attached to the
// sheet (see README), so no large Google credentials sit in Netlify settings.
export async function appendBookingRow(b) {
  const url = process.env.SHEET_WEBHOOK_URL;
  const secret = process.env.SHEET_WEBHOOK_SECRET;
  if (!url || !secret) return { skipped: true };
  const row = [
    b.unitId, 'Direct', b.id, b.guest.name, b.checkIn, b.checkOut, b.nights, b.guests, 'Booked',
    b.createdAt.slice(0, 10), b.quote.total, b.quote.rent, b.quote.cleaning, 0,
  ];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, row }),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error('Sheet answered ' + res.status);
  return { ok: true };
}
