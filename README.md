# vacawithbarclay.com — direct booking site

Instant booking for Beachview 2 and Beachview 13. Guests pick open dates, see the
full price with Florida taxes, pay 50% by card, and the balance is charged
automatically 30 days before check-in (stays inside 30 days pay in full).

## How it works

| Piece | What it does |
|---|---|
| `site/` | The website: home page, a booking page per home, thank-you page |
| `shared/config.js` | **Your settings**: cleaning fees, taxes, deposit share, direct discount, policies |
| `shared/pricing.js` | The price math (same code on the page and the server) |
| `/api/availability` | Nightly prices from PriceLabs, minus nights booked on Airbnb/VRBO (their calendar links), direct bookings and open checkouts |
| `/api/checkout` | Re-checks the dates, holds them for 30 minutes, opens Stripe Checkout |
| `/api/stripe-webhook` | Confirms the booking after payment, adds it to the reservations Google Sheet; refunds automatically if the dates were taken mid-checkout |
| `charge-balances` | Runs daily at 9 AM Eastern and charges balances that are due |
| `/calendar/BV2.ics`, `/calendar/BV13.ics` | Direct bookings as calendar links for Airbnb and VRBO to import |

## One-time setup

1. **Stripe** — create an account at stripe.com (business details and bank account are yours to enter).
   In Developers → API keys copy the secret key. In Settings → Emails turn on "Successful payments".
2. **Netlify** — create a free account and import this project (from GitHub, or `npx netlify deploy`).
3. **Environment variables** (Netlify → Site configuration → Environment variables):

   | Name | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` while testing, `sk_live_…` to go live) |
   | `STRIPE_WEBHOOK_SECRET` | From step 4 |
   | `PRICELABS_API_KEY` | PriceLabs → Account Settings → API details |
   | `ICAL_BV2_AIRBNB`, `ICAL_BV2_VRBO` | Each channel's calendar export link for Beachview 2 |
   | `ICAL_BV13_AIRBNB`, `ICAL_BV13_VRBO` | Same for Beachview 13 |
   | `SHEET_WEBHOOK_URL`, `SHEET_WEBHOOK_SECRET` | Optional: the Apps Script web app in `scripts/sheet-webhook.gs`, so direct bookings land in the sheet automatically |

4. **Stripe webhook** — Developers → Webhooks → Add endpoint
   `https://vacawithbarclay.com/api/stripe-webhook`, events `checkout.session.completed` and
   `checkout.session.expired`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. **Calendars both ways** — in Airbnb and VRBO, import `https://vacawithbarclay.com/calendar/BV2.ics`
   and `/calendar/BV13.ics` on the matching listing.
6. **Domain** — in Netlify add `vacawithbarclay.com`, then in GoDaddy DNS point the domain at Netlify
   (Netlify shows the exact records).
7. **Test** with Stripe test keys and card `4242 4242 4242 4242`, then switch to live keys.

## Before cancelling Guesty

- PriceLabs prices currently come from the Guesty listings (ids in `shared/config.js`). Before
  cancelling Guesty, switch PriceLabs to the direct Airbnb listings and update those ids.
- The old site `vacawithbarclay.guestybookings.com` stops working with Guesty; tell repeat guests the new address.

## Settings worth reviewing in `shared/config.js`

- `directDiscount` — 0 today; set `0.10` to give direct guests 10% off as you have by invoice.
- `defaultMinNights` — 2; PriceLabs minimum stays override it when longer.
- `taxes` — 6% state + 1% county surtax + 5% tourist development tax (Santa Rosa County, 2026). Confirm with your accountant, and register to remit if you haven't.
- Pets are not offered online (listing rules say no pets). Pet stays stay by arrangement.

## Commands

```
npm install
npm test                      # price math and calendar parsing
./scripts/build-preview.sh    # design preview with a saved sample calendar
```

