// Weekly digest: built only from posts that are already published. No new claims, no AI.
// It writes src/data/digests/<id>.json as a DRAFT. A person reads it, sets "draft": false, and pushes.
// The site then serves it at /digest/<id>/ and in /digest.xml, which your email provider can send (RSS-to-email).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadPosts } from './frontmatter.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KIND = { model_launch: 'Model launch', product_launch: 'Product launch', startup_feature: 'Startup feature', funding: 'Funding', skills_guide: 'Skills guide', local_news: 'Local news', research: 'Research', ecosystem: 'Landscape' };
const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function buildDigest(posts, cfg, today = new Date()) {
  const site = (cfg.siteUrl || '').replace(/\/$/, '');
  const since = today.getTime() - 7 * 864e5;
  const recent = posts.filter(p => p.draft === false && new Date(p.date).getTime() >= since).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (!recent.length) return null;
  const news = recent.filter(p => !p.sponsored).slice(0, 8), feat = recent.filter(p => p.sponsored).slice(0, 3);
  const item = p => {
    const src = [p.verified ? `${p.verified} verified` : '', p.stated ? `${p.stated} company says` : ''].filter(Boolean).join(', ');
    return `<li><p><a href="${esc(`${site}/posts/${p.slug}/`)}"><strong>${esc(p.title)}</strong></a><br>${esc(KIND[p.type] || p.type)}, ${esc(p.region || 'Africa')}<br>${esc(p.summary || '')}<br><em>Sourcing: ${esc(src)}</em></p></li>`;
  };
  const html = [
    `<p>This week's posts on ${esc(cfg.siteName)}. Under each post we show how well it is sourced.</p>`,
    news.length ? `<h2>This week</h2><ul>${news.map(item).join('')}</ul>` : '',
    feat.length ? `<h2>Featured submissions</h2><p>These were submitted by the companies themselves. Their claims are shown as company statements unless an independent source backs them.</p><ul>${feat.map(item).join('')}</ul>` : '',
    `<p><a href="${esc(site)}/how-we-verify/">How we verify</a></p>`
  ].filter(Boolean).join('\n');
  const day = today.toISOString().slice(0, 10);
  return { id: `weekly-${day}`, title: `${cfg.siteName} weekly digest, ${fmt(day)}`, date: today.toISOString(), draft: true, summary: `${recent.length} new post${recent.length === 1 ? '' : 's'} this week.`, html, posts: recent.map(p => p.slug) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  if (!cfg.siteUrl) { console.error('Set "siteUrl" in config.json first: the digest needs absolute links.'); process.exit(1); }
  const d = buildDigest(loadPosts(), cfg);
  if (!d) { console.log('No published posts in the last 7 days. No digest written.'); process.exit(0); }
  const file = `src/data/digests/${d.id}.json`;
  if (fs.existsSync(file)) { console.log('Digest already exists: ' + file); process.exit(0); }
  fs.mkdirSync('src/data/digests', { recursive: true });
  fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
  console.log(`Wrote ${file} as a draft (${d.posts.length} posts). Review it, set "draft": false, and push.`);
}
