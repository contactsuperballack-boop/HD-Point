// Social posting kit. For each newly PUBLISHED post it writes ready-to-paste captions (social/<slug>.txt)
// and, if SOCIAL_WEBHOOK_URL is set, sends one JSON message per platform to that webhook
// (Zapier, Make, Buffer or similar), which does the actual posting. Drafts are never posted.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadPosts } from './frontmatter.js';

const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');
const tags = p => ['#AI', '#Africa', p.region && /^[A-Za-z ]+$/.test(p.region) ? '#' + p.region.replace(/\s+/g, '') : ''].filter(Boolean).join(' ');

export function caption(p, site, platform) {
  const link = `${site}/posts/${p.slug}/?utm_source=${platform}&utm_medium=social&utm_campaign=${p.slug.slice(0, 60)}`;
  const label = p.sponsored ? 'Sponsored: ' : '';
  const src = [p.verified ? `${p.verified} verified` : '', p.stated ? `${p.stated} company says` : ''].filter(Boolean).join(', ');
  const summary = p.summary || '';
  switch (platform) {
    case 'x': { const head = label + p.title, room = 270 - head.length - link.length - 4; return { link, text: `${head}\n\n${room > 40 ? clip(summary, room) + '\n' : ''}${link}` }; }
    case 'linkedin': return { link, text: `${label}${p.title}\n\n${summary}\n\nSourcing: ${src}.\n\n${link}\n\n${tags(p)}` };
    case 'whatsapp': return { link, text: `${label}${p.title}\n${link}` };
    case 'facebook': return { link, text: `${label}${p.title}\n\n${summary}\n\n${link}` };
    case 'instagram': return { link, text: `${label}${p.title}\n\n${summary}\n\nSourcing: ${src}.\nFull post: link in the bio.\n\n${tags(p)}` };
    default: return null;
  }
}

export async function runSocial({ cfg, posts, log = [], env = process.env, exists = f => fs.existsSync(f), write = (f, t) => { fs.mkdirSync('social', { recursive: true }); fs.writeFileSync(f, t); } }) {
  const s = cfg.social ?? {}, site = (cfg.siteUrl || '').replace(/\/$/, '');
  if (!s.enabled) return { skipped: 'social.enabled is false', done: [] };
  if (!site) return { skipped: 'set siteUrl in config.json', done: [] };
  const since = Date.now() - (s.maxAgeDays ?? 3) * 864e5, seen = new Set(log.map(l => l.slug)), hook = env.SOCIAL_WEBHOOK_URL;
  const todo = posts.filter(p => p.draft === false && !seen.has(p.slug) && new Date(p.date).getTime() >= since);
  const done = [];
  for (const p of todo) {
    const img = ['infographic', 'hero'].map(n => `public/assets/${p.slug}/${n}.png`).find(exists);
    const imageUrl = img ? `${site}/${img.replace(/^public\//, '')}` : null;
    const msgs = (s.platforms ?? []).map(pl => ({ platform: pl, ...caption(p, site, pl) })).filter(m => m.text);
    write(`social/${p.slug}.txt`, `${p.title}\nImage: ${imageUrl || '(none yet)'}\n\n` + msgs.map(m => `=== ${m.platform} ===\n${m.text}\n`).join('\n'));
    let delivered = 'kit-only';
    if (hook) {
      delivered = true;
      for (const m of msgs) {
        try {
          const res = await fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: p.slug, title: p.title, sponsored: !!p.sponsored, imageUrl, ...m }), signal: AbortSignal.timeout(20000) });
          if (!res.ok) delivered = false;
        } catch { delivered = false; }
      }
    }
    if (delivered === false) { done.push({ slug: p.slug, delivered: false }); continue; }   // not logged, so the next run retries
    log.push({ slug: p.slug, at: new Date().toISOString(), delivered });
    done.push({ slug: p.slug, delivered });
  }
  return { done, log };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  const log = fs.existsSync('social-log.json') ? JSON.parse(fs.readFileSync('social-log.json', 'utf8')) : [];
  const r = await runSocial({ cfg, posts: loadPosts(), log });
  if (r.skipped) console.log('Social step skipped: ' + r.skipped);
  else { fs.writeFileSync('social-log.json', JSON.stringify(r.log, null, 2) + '\n'); console.log(r.done.map(d => `${d.slug}: ${d.delivered}`).join('\n') || 'Nothing new to post.'); }
}
