// Cloudflare Worker: receives the submission form, checks it, and saves it to inbox/submissions/ in the repo.
// Spam defences, in order: origin check, honeypot, per-IP rate limit (LIMITS KV), Cloudflare Turnstile (TURNSTILE_SECRET),
// strict validation and size limit. The contact email is NOT written to the repo; it goes to the optional CONTACTS KV only.
const TYPES = ['product_launch', 'model_launch', 'startup_feature', 'funding', 'skills_guide'];
const TOPICS = ['ai', 'innovation', 'climate', 'lifestyle', 'startups'];
const MAX_PER_HOUR = 5;
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const url = u => { try { const x = new URL(String(u ?? '').trim()); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
const b64 = str => { const b = new TextEncoder().encode(str); let s = ''; b.forEach(c => (s += String.fromCharCode(c))); return btoa(s); };

export default {
  async fetch(req, env) {
    const cors = { 'access-control-allow-origin': env.ALLOWED_ORIGIN || '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };
    const reply = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
    if (env.ALLOWED_ORIGIN && env.ALLOWED_ORIGIN !== '*' && req.headers.get('origin') !== env.ALLOWED_ORIGIN) return reply({ error: 'Not allowed.' }, 403);

    const raw = await req.text();
    if (raw.length > 20000) return reply({ error: 'Submission is too long.' }, 413);
    let b; try { b = JSON.parse(raw); } catch { return reply({ error: 'Invalid request.' }, 400); }
    if (b.website_url_confirm) return reply({ ok: true });            // honeypot: pretend success

    const ip = req.headers.get('cf-connecting-ip') || 'unknown';
    if (env.LIMITS) {                                                   // simple per-IP limit: 5 attempts an hour
      const key = `rl:${ip}:${new Date().toISOString().slice(0, 13)}`;
      const n = Number((await env.LIMITS.get(key)) || 0);
      if (n >= MAX_PER_HOUR) return reply({ error: 'Too many submissions from your connection. Please try again in an hour.' }, 429);
      await env.LIMITS.put(key, String(n + 1), { expirationTtl: 3700 });
    }
    if (env.TURNSTILE_SECRET) {                                         // Cloudflare Turnstile bot check
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(b['cf-turnstile-response'] || ''), remoteip: ip }) });
      const j = await r.json().catch(() => ({}));
      if (!j.success) return reply({ error: 'The spam check failed. Please reload the page and try again.' }, 400);
    }

    const errors = [];
    const sub = {
      headline: clean(b.headline, 120), storyType: b.storyType, company: clean(b.company, 80), website: url(b.website),
      country: clean(b.country, 60), city: clean(b.city, 60), embedUrl: url(b.embedUrl) || '', topic: TOPICS.includes(b.topic) ? b.topic : '', claims: []
    };
    (Array.isArray(b.claims) ? b.claims : []).slice(0, 6).forEach(c => {
      const text = clean(c?.text, 220), sourceUrl = url(c?.sourceUrl);
      if (text && sourceUrl) sub.claims.push({ text, sourceUrl, value: clean(c.value, 20), unit: clean(c.unit, 30), label: clean(c.label, 40) });
    });
    const email = clean(b.email, 120);
    if (!sub.headline) errors.push('Add a headline.');
    if (!TYPES.includes(sub.storyType)) errors.push('Choose what you are announcing.');
    if (!sub.company) errors.push('Add your company name.');
    if (!sub.website) errors.push('Add a valid website link starting with http:// or https://.');
    if (!sub.country) errors.push('Add your country.');
    if (sub.claims.length < 2) errors.push('Add at least two facts, each with a valid source link.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Add a valid contact email.');
    if (b.consent !== true) errors.push('Tick both confirmations.');
    if (errors.length) return reply({ error: errors.join(' '), errors }, 400);

    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    sub.id = id; sub.receivedAt = new Date().toISOString();
    if (env.CONTACTS) await env.CONTACTS.put(id, JSON.stringify({ email, company: sub.company }));

    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/inbox/submissions/${id}.json`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'submit-worker', 'content-type': 'application/json' },
      body: JSON.stringify({ message: `New submission ${id}`, content: b64(JSON.stringify(sub, null, 2)), branch: env.GITHUB_BRANCH || 'main' })
    });
    if (!res.ok) { console.error('github', res.status); return reply({ error: 'We could not save your submission. Please try again later.' }, 502); }
    return reply({ ok: true, id });
  }
};
