import { STORY_TYPES, TOPIC_TAGS } from './schema.js';

// Everything from the public form is untrusted. Strip markup characters, cap lengths, allow only http(s) links.
const clean = (s, n = 200) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const httpUrl = u => { try { const x = new URL(String(u ?? '').trim()); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
const EMBED_HOSTS = ['youtube.com', 'youtu.be', 'x.com', 'twitter.com', 'linkedin.com', 'vimeo.com', 'instagram.com', 'facebook.com', 'tiktok.com'];
const embedUrl = u => { const h = httpUrl(u); if (!h) return null; const host = new URL(h).hostname.replace(/^www\./, ''); return EMBED_HOSTS.some(d => host === d || host.endsWith('.' + d)) ? h : null; };

export function submissionToFactSheet(s) {
  const errors = [];
  const title = clean(s.headline, 120), company = clean(s.company, 80), country = clean(s.country, 60), city = clean(s.city, 60);
  const site = httpUrl(s.website);
  if (!title) errors.push('headline missing');
  if (!company) errors.push('company missing');
  if (!country) errors.push('country missing');
  if (!site) errors.push('website missing or not a valid link');
  if (!STORY_TYPES.includes(s.storyType)) errors.push('bad storyType');

  const claims = [];
  (s.claims || []).slice(0, 6).forEach(c => {
    const text = clean(c.text, 220);
    if (!text) return;
    const src = httpUrl(c.sourceUrl);
    if (!src) { errors.push(`fact "${text.slice(0, 30)}" has no valid source link`); return; }
    const claim = { text, sourceUrl: src, basis: 'company-stated' };   // submissions are never "verified" automatically
    const raw = clean(c.value, 20), unit = clean(c.unit, 30);
    if (raw !== '' && unit) {
      const v = Number(raw.replace(/,/g, ''));
      if (!Number.isFinite(v)) errors.push(`figure "${raw}" is not a number`);
      else if (!text.replace(/,/g, '').includes(raw.replace(/,/g, ''))) errors.push(`figure ${raw} must also appear in its fact`);
      else { claim.value = v; claim.unit = unit; const l = clean(c.label, 40); if (l) claim.label = l; }
    }
    claims.push(claim);
  });
  if (claims.length < 2) errors.push('needs at least 2 facts with source links');

  if (site) claims.unshift({ text: `${company} is based in ${city ? city + ', ' : ''}${country}.`, sourceUrl: site, basis: 'company-stated' });
  claims.forEach((c, i) => (c.id = 'c' + (i + 1)));

  return {
    errors,
    factSheet: { title, storyType: s.storyType, region: country, publishedAt: s.receivedAt || new Date().toISOString(), embedUrl: embedUrl(s.embedUrl), claims, flashcards: [], topic: TOPIC_TAGS.includes(s.topic) ? s.topic : 'startups', sponsored: true }
  };
}
