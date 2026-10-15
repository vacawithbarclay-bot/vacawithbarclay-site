// Runs every morning: charges balances that are due to the card saved at booking.
// A declined card is marked so the owner can follow up; Stripe emails the receipt
// on success (turn on "Successful payments" emails in Stripe settings).
import Stripe from 'stripe';
import { cents } from '../../shared/pricing.js';
import { listBookings, saveBooking } from '../../lib/store.mjs';
import { todayLocal } from '../../lib/calendar.mjs';

export default async () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const today = todayLocal();
  const due = (await listBookings()).filter((b) => b.status === 'confirmed' && b.balanceStatus === 'scheduled' && b.balanceDate && b.balanceDate <= today);
  for (const b of due) {
    try {
      const pi = await stripe.paymentIntents.create({
        amount: cents(b.balance), currency: 'usd', customer: b.stripe.customer, payment_method: b.stripe.paymentMethod,
        off_session: true, confirm: true, description: `Balance for ${b.id} (${b.unitId} ${b.checkIn})`, metadata: { booking: b.id },
        receipt_email: b.guest.email,
      }, { idempotencyKey: 'balance-' + b.id });
      await saveBooking({ ...b, balanceStatus: 'paid', stripe: { ...b.stripe, balanceIntent: pi.id }, balancePaidAt: new Date().toISOString() });
    } catch (e) {
      console.error('balance failed', b.id, e.message);
      await saveBooking({ ...b, balanceStatus: 'failed', balanceError: e.message });
    }
  }
};

export const config = { schedule: '0 13 * * *' }; // 9 AM Eastern (UTC 13:00)
