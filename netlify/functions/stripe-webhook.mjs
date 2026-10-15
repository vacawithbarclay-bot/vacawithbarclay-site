// POST /api/stripe-webhook  (Stripe: checkout.session.completed, checkout.session.expired)
// Turns a paid checkout into a confirmed booking. If the dates were taken in the
// meantime (an Airbnb booking landed during checkout), the payment is refunded.
import Stripe from 'stripe';
import { CONFIG } from '../../shared/config.js';
import { liveQuote } from './quote.mjs';
import { saveBooking, getBooking, getHold, deleteHold } from '../../lib/store.mjs';
import { appendBookingRow } from '../../lib/sheets.mjs';
import { json } from '../../lib/http.mjs';

export default async (req) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return json({ error: 'Bad signature' }, 400);
  }

  const s = event.data.object;
  const id = s.metadata && s.metadata.booking;
  if (!id) return json({ ignored: true });

  if (event.type === 'checkout.session.expired') {
    await deleteHold(id);
    return json({ released: id });
  }
  if (event.type !== 'checkout.session.completed' || s.payment_status !== 'paid') return json({ ignored: true });
  if (await getBooking(id)) return json({ duplicate: true });

  const m = s.metadata;
  const result = await liveQuote({ unit: m.unit, checkIn: m.checkIn, checkOut: m.checkOut, guests: Number(m.guests) }, { ignoreHold: id });
  const pi = await stripe.paymentIntents.retrieve(s.payment_intent);
  const now = new Date().toISOString();

  if (!result.ok && result.code === 'unavailable') {
    await stripe.refunds.create({ payment_intent: pi.id });
    await saveBooking({ id, status: 'cancelled', reason: 'Dates taken during checkout; refunded', unitId: m.unit, checkIn: m.checkIn, checkOut: m.checkOut, createdAt: now });
    await deleteHold(id);
    return json({ refunded: id });
  }

  // Use the quote the guest saw at checkout (saved with the hold), so the record
  // matches their receipt even if PriceLabs prices moved since.
  const hold = await getHold(id);
  const q = (hold && hold.quote) || (result.ok ? result.quote : null);
  const paid = s.amount_total / 100;
  const total = q ? q.total : paid;
  const booking = {
    id, status: 'confirmed', unitId: m.unit, checkIn: m.checkIn, checkOut: m.checkOut,
    nights: q ? q.nights : null, guests: Number(m.guests),
    guest: { name: m.name, email: s.customer_details && s.customer_details.email, phone: m.phone }, notes: m.notes || '',
    quote: q || { total, rent: null, cleaning: CONFIG.units[m.unit].cleaningFee },
    paid,
    balance: Math.round((total - paid) * 100) / 100,
    balanceDate: q ? q.balanceDate : null,
    balanceStatus: total - paid > 0.5 ? 'scheduled' : 'none',
    stripe: { customer: s.customer, paymentMethod: pi.payment_method, depositIntent: pi.id },
    createdAt: now,
  };
  await saveBooking(booking);
  await deleteHold(id);
  try { await appendBookingRow(booking); } catch (e) { console.error('sheet append failed', id, e); }
  return json({ confirmed: id });
};

export const config = { path: '/api/stripe-webhook' };
