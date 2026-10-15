import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../shared/config.js';
import { buildQuote, addDays } from '../shared/pricing.js';
import { parseIcal } from '../lib/calendar.mjs';

const cal = (start, prices) => Object.fromEntries(prices.map((p, i) => [addDays(start, i), { price: p, available: p > 0, minStay: 0 }]));

test('quote: rent + cleaning + 12% tax, 50% deposit when more than 30 days out', () => {
  const calendar = cal('2026-11-03', [175, 177, 189]); // 3 nights
  const r = buildQuote({ config: CONFIG, unitId: 'BV2', checkIn: '2026-11-03', checkOut: '2026-11-06', guests: 4, calendar, today: '2026-09-01' });
  assert.equal(r.ok, true);
  const q = r.quote;
  assert.equal(q.rent, 541);
  assert.equal(q.cleaning, 300);
  assert.equal(q.taxTotal, 100.92); // 12% of 841
  assert.equal(q.total, 941.92);
  assert.equal(q.dueNow, 470.96);
  assert.equal(q.balance, 470.96);
  assert.equal(q.balanceDate, '2026-10-04');
});

test('quote: inside 30 days pays in full', () => {
  const calendar = cal('2026-11-03', [175, 177]);
  const r = buildQuote({ config: CONFIG, unitId: 'BV13', checkIn: '2026-11-03', checkOut: '2026-11-05', guests: 2, calendar, today: '2026-10-14' });
  assert.equal(r.ok, true);
  assert.equal(r.quote.balance, 0);
  assert.equal(r.quote.dueNow, r.quote.total);
});

test('quote: refuses booked nights, too many guests, short stays, past dates', () => {
  const calendar = cal('2026-11-03', [175, 0, 189]);
  const base = { config: CONFIG, unitId: 'BV2', calendar, today: '2026-10-14' };
  assert.equal(buildQuote({ ...base, checkIn: '2026-11-03', checkOut: '2026-11-06', guests: 2 }).code, 'unavailable');
  assert.equal(buildQuote({ ...base, checkIn: '2026-11-03', checkOut: '2026-11-04', guests: 9 }).code, 'guests');
  assert.equal(buildQuote({ ...base, checkIn: '2026-11-03', checkOut: '2026-11-04', guests: 2 }).code, 'minstay');
  assert.equal(buildQuote({ ...base, checkIn: '2026-10-14', checkOut: '2026-10-16', guests: 2 }).code, 'dates');
});

test('checkout day may be a booked night (same-day turnover)', () => {
  const calendar = cal('2026-11-03', [175, 177, 0]);
  const r = buildQuote({ config: CONFIG, unitId: 'BV2', checkIn: '2026-11-03', checkOut: '2026-11-05', guests: 2, calendar, today: '2026-10-14' });
  assert.equal(r.ok, true);
});

test('iCal: reads Airbnb-style all-day events', () => {
  const text = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTEND;VALUE=DATE:20261026\r\nDTSTART;VALUE=DATE:20261022\r\nSUMMARY:Reserved\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:20261101T160000Z\r\nDTEND:20261104T150000Z\r\nEND:VEVENT\r\nEND:VCALENDAR';
  assert.deepEqual(parseIcal(text), [{ start: '2026-10-22', end: '2026-10-26' }, { start: '2026-11-01', end: '2026-11-04' }]);
});
