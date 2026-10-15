import { UNITS, HOUSE_RULES } from './units.js';
import { getAvailability, startCheckout, money, money0, niceDate, photo } from './api.js';
import { CONFIG } from '../shared/config.js';
import { buildQuote, addDays, stayNights } from '../shared/pricing.js';

const qs = new URLSearchParams(location.search);
const asked = qs.get('unit') || location.hash.slice(1);
const unitId = UNITS[asked] ? asked : 'BV2';
const unit = UNITS[unitId];
const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };

document.title = unit.name + ' · Vaca with Barclay';

// ---- details
$('gallery').append(...unit.photos.slice(0, 3).map((p, i) => photo(p, `${unit.name} photo ${i + 1}`)));
$('unit-name').textContent = unit.name;
$('unit-tag').textContent = unit.tagline;
$('unit-facts').append(...unit.facts.map((f) => el('li', { textContent: f })));
$('unit-stars').textContent = `★ ${unit.rating.score} from ${unit.rating.count} ${unit.rating.source} reviews`;
$('unit-summary').textContent = unit.summary;
$('unit-highlights').append(...unit.highlights.map((t) => el('li', { textContent: t })));
$('unit-beds').append(...unit.beds.map((t) => el('li', { textContent: t })));
$('rules').append(...HOUSE_RULES.map((t) => el('li', { textContent: t })),
  el('li', { textContent: `Check-in ${CONFIG.checkInTime}, check-out ${CONFIG.checkOutTime}.` }));
$('policy').append(...CONFIG.cancellationPolicy.map((t) => el('li', { textContent: t })));
$('guests').max = CONFIG.units[unitId].maxGuests;
$('guests-note').textContent = `Up to ${CONFIG.units[unitId].maxGuests} guests`;

// ---- state
const state = {
  today: null, nights: {}, month: null,
  checkIn: qs.get('in'), checkOut: qs.get('out'),
};
$('guests').value = Math.min(Number(qs.get('guests')) || 4, CONFIG.units[unitId].maxGuests);

const monthKey = (iso) => iso.slice(0, 7);
const firstOfMonth = (key) => key + '-01';
const shiftMonth = (key, n) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const openNight = (d) => state.nights[d] && state.nights[d].available && state.nights[d].price > 0;
const earliest = () => addDays(state.today, CONFIG.minLeadDays);

function rangeIsOpen(a, b) {
  return stayNights(a, b).every(openNight);
}

// ---- calendar
function drawCalendar() {
  const cal = $('cal');
  cal.replaceChildren(...['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => el('div', { className: 'dow', textContent: d })));
  const first = firstOfMonth(state.month);
  $('cal-month').textContent = niceDate(first, { month: 'long', year: 'numeric' });
  $('cal-prev').disabled = state.month <= monthKey(state.today);
  $('cal-next').disabled = state.month >= monthKey(addDays(state.today, CONFIG.maxAdvanceDays));
  const lead = new Date(first + 'T00:00:00Z').getUTCDay();
  for (let i = 0; i < lead; i++) cal.append(el('div'));
  for (let d = first; monthKey(d) === state.month; d = addDays(d, 1)) {
    const night = state.nights[d];
    const b = el('button', { type: 'button', className: 'day' },
      el('span', { className: 'n', textContent: String(Number(d.slice(8))) }),
      el('span', { className: 'p', textContent: openNight(d) ? money0(night.price) : '' }));
    b.dataset.date = d;
    const picking = state.checkIn && !state.checkOut;
    const canCheckIn = d >= earliest() && openNight(d);
    const canCheckOut = picking && d > state.checkIn && rangeIsOpen(state.checkIn, d);
    if (!openNight(d)) b.classList.add('taken');
    if (canCheckOut && !openNight(d)) b.classList.add('checkout-only');
    b.disabled = picking ? !(canCheckOut || canCheckIn) : !canCheckIn;
    if (d === state.checkIn) b.classList.add('start');
    if (d === state.checkOut) b.classList.add('end');
    if (state.checkIn && state.checkOut && d > state.checkIn && d < state.checkOut) b.classList.add('in-range');
    b.setAttribute('aria-label', niceDate(d, { weekday: 'long', month: 'long', day: 'numeric' }) + (openNight(d) ? ', ' + money0(night.price) : ', unavailable'));
    b.addEventListener('click', () => pick(d));
    cal.append(b);
  }
}

function pick(d) {
  if (!state.checkIn || state.checkOut || d <= state.checkIn || !rangeIsOpen(state.checkIn, d)) {
    state.checkIn = d; state.checkOut = null;
  } else {
    state.checkOut = d;
  }
  drawCalendar();
  update();
}

// ---- quote
function update() {
  $('in-label').textContent = state.checkIn ? niceDate(state.checkIn) : 'Add date';
  $('out-label').textContent = state.checkOut ? niceDate(state.checkOut) : 'Add date';
  const box = $('quote');
  const err = $('quote-error');
  err.textContent = '';
  box.replaceChildren();
  $('pay').hidden = true;
  $('guest-form').hidden = true;
  if (!state.checkIn || !state.checkOut) {
    box.append(el('p', { className: 'fine', textContent: state.checkIn ? 'Now pick your check-out date.' : 'Pick your check-in date on the calendar.' }));
    return;
  }
  const r = buildQuote({ config: CONFIG, unitId, checkIn: state.checkIn, checkOut: state.checkOut, guests: Number($('guests').value), calendar: state.nights, today: state.today });
  if (!r.ok) { err.textContent = r.error; return; }
  const q = r.quote;
  const row = (a, b, cls = 'row') => el('div', { className: cls }, el('span', { textContent: a }), el('span', { textContent: b }));
  box.append(
    row(`${q.nights} nights`, money(q.rent)),
    row('Cleaning', money(q.cleaning)),
    ...q.taxes.map((t) => row(`${t.label} (${(t.rate * 100).toFixed(0)}%)`, money(t.amount))),
    row('Total', money(q.total), 'row total'),
  );
  $('pay').hidden = false;
  $('pay-now').textContent = money(q.dueNow);
  $('pay-later').textContent = q.balance > 0
    ? `The other ${money(q.balance)} is charged to the same card on ${niceDate(q.balanceDate, { month: 'long', day: 'numeric', year: 'numeric' })}.`
    : 'Your stay is within 30 days, so it’s paid in full today.';
  $('pay-label').textContent = q.balance > 0 ? 'Due today (50%)' : 'Due today';
  $('guest-form').hidden = false;
  $('cta').textContent = 'Book now and pay ' + money(q.dueNow);
}

$('guests').addEventListener('input', update);
$('cal-prev').addEventListener('click', () => { state.month = shiftMonth(state.month, -1); drawCalendar(); });
$('cal-next').addEventListener('click', () => { state.month = shiftMonth(state.month, 1); drawCalendar(); });
$('clear').addEventListener('click', () => { state.checkIn = state.checkOut = null; drawCalendar(); update(); });

$('guest-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('form-error');
  err.textContent = '';
  const cta = $('cta');
  cta.disabled = true;
  const label = cta.textContent;
  cta.textContent = 'Holding your dates…';
  const r = await startCheckout({
    unit: unitId, checkIn: state.checkIn, checkOut: state.checkOut, guests: Number($('guests').value),
    name: $('g-name').value, email: $('g-email').value, phone: $('g-phone').value, notes: $('g-notes').value, agree: $('g-agree').checked,
  });
  if (r.ok && r.url) { location.href = r.url; return; }
  cta.disabled = false;
  cta.textContent = label;
  if (r.demo) { err.textContent = 'Preview only: on the live site this opens secure card checkout.'; return; }
  err.textContent = r.error || 'Something went wrong. Please try again.';
  if (r.code === 'unavailable') load();
});

// ---- load
async function load() {
  $('cal').replaceChildren(el('div', { className: 'skeleton' }));
  try {
    const cal = await getAvailability(unitId);
    state.today = cal.today;
    state.nights = cal.nights;
    if (state.checkIn && (state.checkIn < earliest() || (state.checkOut && !rangeIsOpen(state.checkIn, state.checkOut)))) state.checkIn = state.checkOut = null;
    state.month = state.month || monthKey(state.checkIn || earliest());
    drawCalendar();
    update();
  } catch (e) {
    $('cal').replaceChildren(el('p', { className: 'error', textContent: e.message + ' Please refresh, or email us.' }));
  }
}
load();

// In the preview, home links switch the anchor (#BV13) instead of loading a new page.
window.addEventListener('hashchange', () => location.reload());
