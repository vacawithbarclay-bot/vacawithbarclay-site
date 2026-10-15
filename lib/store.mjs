// Direct bookings and checkout holds, kept in Netlify Blobs.
import { getStore } from '@netlify/blobs';

const bookings = () => getStore({ name: 'bookings', consistency: 'strong' });
const holds = () => getStore({ name: 'holds', consistency: 'strong' });

async function all(store) {
  const { blobs } = await store.list();
  const out = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
  return out.filter(Boolean);
}

export const listBookings = () => all(bookings());
export const getBooking = (id) => bookings().get(id, { type: 'json' });
export const saveBooking = (b) => bookings().setJSON(b.id, b);

export const listHolds = () => all(holds());
export const getHold = (id) => holds().get(id, { type: 'json' });
export const saveHold = (h) => holds().setJSON(h.id, h);
export const deleteHold = (id) => holds().delete(id);

export function newId(prefix) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return prefix + '-' + s;
}
