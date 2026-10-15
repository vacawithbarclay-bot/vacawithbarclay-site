// POST /api/checkout -> holds the dates and opens Stripe Checkout for the amount due now.
// The card is saved (with the guest's consent on the Stripe page) so the balance
// can be charged automatically before arrival.
import Stripe from 'stripe';
import { CONFIG } from '../../shared/config.js';
import { cents } from '../../shared/pricing.js';
import { liveQuote } from './quote.mjs';
import { saveHold, newId } from '../../lib/store.mjs';
import { json, siteUrl } from '../../lib/http.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const body = await req.json();
    const guest = {
      name: String(body.name || '').trim().slice(0, 120),
      email: String(body.email || '').trim().slice(0, 200),
      phone: String(body.phone || '').trim().slice(0, 40),
    };
    if (!guest.name || !/^\S+@\S+\.\S+$/.test(guest.email) || guest.phone.length < 7) {
      return json({ ok: false, error: 'Enter your name, email and phone number.' }, 400);
    }
    if (!body.agree) return json({ ok: false, error: 'Please accept the house rules and cancellation policy.' }, 400);

    const result = await liveQuote(body);
    if (!result.ok) return json(result, 409);
    const q = result.quote;

    const holdId = newId('VWB');
    const expiresAt = Date.now() + CONFIG.holdMinutes * 60000;
    await saveHold({ id: holdId, unitId: q.unitId, checkIn: q.checkIn, checkOut: q.checkOut, expiresAt, quote: q });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_creation: 'always',
      customer_email: guest.email,
      expires_at: Math.floor(Math.max(expiresAt, Date.now() + 31 * 60000) / 1000),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: cents(q.dueNow),
          product_data: {
            name: `${q.unitName}: ${q.checkIn} to ${q.checkOut} (${q.nights} nights)`,
            description: q.balance > 0
              ? `Deposit (50% of $${q.total.toFixed(2)}). Balance of $${q.balance.toFixed(2)} charged to this card on ${q.balanceDate}.`
              : `Paid in full. Total $${q.total.toFixed(2)} including taxes and cleaning.`,
          },
        },
      }],
      payment_intent_data: {
        setup_future_usage: q.balance > 0 ? 'off_session' : undefined,
        metadata: { booking: holdId },
      },
      metadata: {
        booking: holdId, unit: q.unitId, checkIn: q.checkIn, checkOut: q.checkOut, guests: String(q.guests),
        name: guest.name, phone: guest.phone, notes: String(body.notes || '').slice(0, 450),
      },
      success_url: `${siteUrl()}/thanks.html?b=${holdId}`,
      cancel_url: `${siteUrl()}/stay.html?unit=${q.unitId}&in=${q.checkIn}&out=${q.checkOut}&guests=${q.guests}`,
    });
    return json({ ok: true, url: session.url });
  } catch (e) {
    console.error('checkout', e);
    return json({ ok: false, error: 'We couldn’t start checkout. Please try again, or text us.' }, 502);
  }
};

export const config = { path: '/api/checkout' };
