export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const siteUrl = () => (process.env.URL || 'https://vacawithbarclay.com').replace(/\/$/, '');
