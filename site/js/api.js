// Talks to the booking functions. In the design preview (window.VWB_DEMO) it uses
// a saved sample calendar instead, and checkout stops before payment.
export async function getAvailability(unit) {
  if (window.VWB_DEMO) return window.VWB_DEMO.availability(unit);
  const res = await fetch('/api/availability?unit=' + encodeURIComponent(unit));
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'We couldn’t load the calendar.');
  return body;
}

export async function startCheckout(payload) {
  if (window.VWB_DEMO) return { ok: true, demo: true };
  const res = await fetch('/api/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({ ok: false, error: 'Something went wrong. Please try again.' }));
  return body;
}

export async function bookingStatus(id) {
  if (window.VWB_DEMO) return { status: 'confirmed' };
  const res = await fetch('/api/booking?b=' + encodeURIComponent(id));
  return res.json();
}

export const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
export const niceDate = (iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

export function photo(url, alt) {
  const box = document.createElement('div');
  box.className = 'photo';
  const img = new Image();
  img.alt = alt;
  img.loading = 'lazy';
  img.src = url;
  img.onerror = () => img.remove(); // falls back to the water gradient behind it
  box.append(img);
  return box;
}
