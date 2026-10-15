import { UNITS } from './units.js';
import { getAvailability, money0, photo } from './api.js';

const grid = document.getElementById('homes');
for (const u of Object.values(UNITS)) {
  const a = document.createElement('a');
  a.className = 'home';
  a.href = window.VWB_DEMO ? 'stay.html#' + u.id : 'stay.html?unit=' + u.id;
  a.id = 'home-' + u.id;
  const body = document.createElement('div');
  body.className = 'body';
  const h = document.createElement('h2');
  h.textContent = u.name;
  const tag = document.createElement('p');
  tag.className = 'muted';
  tag.style.margin = '0';
  tag.textContent = u.tagline;
  const facts = document.createElement('ul');
  facts.className = 'facts';
  facts.append(...u.facts.map((f) => Object.assign(document.createElement('li'), { textContent: f })));
  const stars = document.createElement('div');
  stars.className = 'stars';
  stars.textContent = `★ ${u.rating.score} from ${u.rating.count} ${u.rating.source} reviews`;
  const from = document.createElement('div');
  from.className = 'from';
  from.textContent = ' ';
  body.append(h, tag, facts, stars, from);
  a.append(photo(u.photos[0], u.name), body);
  grid.append(a);

  getAvailability(u.id).then((cal) => {
    const prices = Object.values(cal.nights).filter((n) => n.available && n.price > 0).map((n) => n.price);
    if (!prices.length) return;
    from.replaceChildren('From ', Object.assign(document.createElement('b'), { textContent: money0(Math.min(...prices)) }), ' a night, booked direct');
  }).catch(() => {});
}
