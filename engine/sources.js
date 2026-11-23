import fs from 'node:fs';
import path from 'node:path';
import { submissionToFactSheet } from './submissions.js';

// 1) Startup/product submissions. Form submissions land in inbox/submissions/ (written by the worker).
//    Admin-written fact sheets can sit directly in inbox/. Mock mode reads inbox/examples/.
export function loadSubmissions(dirs = ['inbox', 'inbox/submissions']) {
  const out = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const p = path.join(dir, f);
      let data;
      try { data = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { out.push({ kind: 'submission', path: p, file: f, errors: ['invalid JSON'] }); continue; }
      const item = { ...data, kind: 'submission', path: p, file: f };   // fixed keys last: file content can't override them
      if (!item.factSheet && item.company) { const r = submissionToFactSheet(data); item.factSheet = r.factSheet; item.errors = r.errors; }
      out.push(item);
    }
  }
  return out;
}

export function archive(item, sub, note) {
  if (!item.path || !fs.existsSync(item.path)) return;
  const dir = path.join('inbox', sub);
  fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(item.path, path.join(dir, item.file));
  if (note) fs.writeFileSync(path.join(dir, item.file + '.txt'), note);
}

// 1b) Company pages without a feed. engine/watch.py renders each page in a browser and drops a snapshot in watch-cache/.
export function loadWatchCandidates(dir = 'watch-cache') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    const p = path.join(dir, f); let d;
    try { d = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
    if (!d.url || !d.title) return null;
    return { kind: 'news', origin: 'watch', source: d.name, title: d.title, url: d.url, publishedAt: d.publishedAt, summary: String(d.text || '').slice(0, 3500), feedFilter: 'none', topics: d.topics || [], watchKind: d.kind, path: p, file: f };
  }).filter(Boolean);
}

export function discard(item) { try { if (item.path) fs.unlinkSync(item.path); } catch {} }

// 2) News candidates from RSS or Atom feeds. Feeds are { name, url, filter: "lane" | "none" }.
//    "lane" keeps only stories that match config.lane (for general tech outlets).
//    "none" keeps everything (for AI lab blogs that are on topic by definition).
const decode = s => String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
const strip = s => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (block, name) => { const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i')); return m ? m[1].trim() : ''; };

export function parseFeed(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)) {
    const b = m[1];
    items.push({ title: strip(tag(b, 'title')), url: strip(tag(b, 'link')) || strip(tag(b, 'guid')), date: tag(b, 'pubDate') || tag(b, 'dc:date'), summary: strip(tag(b, 'description') || tag(b, 'content:encoded')) });
  }
  for (const m of xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi)) {
    const b = m[1];
    const links = [...b.matchAll(/<link\b([^>]*)>/gi)].map(x => x[1]);
    const alt = links.find(a => /rel=["']alternate["']/i.test(a)) || links.find(a => !/rel=/i.test(a)) || links[0] || '';
    items.push({ title: strip(tag(b, 'title')), url: decode((alt.match(/href=["']([^"']+)["']/i) || [])[1] || ''), date: strip(tag(b, 'published') || tag(b, 'updated')), summary: strip(tag(b, 'summary') || tag(b, 'content')) });
  }
  return items.filter(i => i.title && /^https?:\/\//.test(i.url)).map(i => ({ title: i.title, url: i.url, summary: i.summary.slice(0, 1200), publishedAt: isNaN(new Date(i.date)) ? null : new Date(i.date).toISOString() }));
}

export async function loadFeeds(feeds, cap = 4) {
  const out = [];
  for (const f of feeds) {
    const feed = typeof f === 'string' ? { url: f, name: new URL(f).hostname.replace(/^www\./, ''), filter: 'lane' } : { filter: 'lane', ...f };
    try {
      const res = await fetch(feed.url, { headers: { 'user-agent': 'HDPoint-feedreader/1.0', accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const items = parseFeed(await res.text()).filter(i => i.publishedAt).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, cap);
      if (!items.length) console.warn('feed has no readable dated items:', feed.url);
      for (const i of items) out.push({ kind: 'news', title: i.title, url: i.url, publishedAt: i.publishedAt, summary: i.summary, source: feed.name, feedFilter: feed.filter });
    } catch (e) { console.warn('feed failed:', feed.url, '-', e.message); }
  }
  return out;
}

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function filterCandidates(items, cfg) {
  const cutoff = Date.now() - cfg.maxStoryAgeDays * 864e5;
  const lane = new RegExp('\\b(' + cfg.lane.map(esc).join('|') + ')s?\\b', 'i');   // whole words only, so "said" does not match "ai"
  const kept = items.filter(i => {
    if (i.kind === 'submission') return true;                       // submissions skip age/lane filter
    if (!i.publishedAt || new Date(i.publishedAt).getTime() < cutoff) return false;   // freshness filter
    if (i.feedFilter === 'none') return true;
    return lane.test((i.title || '') + ' ' + (i.summary || ''));    // lane filter
  });
  const subs = kept.filter(i => i.kind === 'submission');
  const bySource = {};
  kept.filter(i => i.kind !== 'submission').sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).forEach(i => (bySource[i.source || ''] ||= []).push(i));
  const news = [], lists = Object.values(bySource);           // round-robin so one feed cannot fill the whole run
  for (let n = 0; lists.some(l => n < l.length); n++) lists.forEach(l => l[n] && news.push(l[n]));
  return [...subs, ...news];
}


// 3) Run-to-run memory and full article text -------------------------------------------------
// Feed items stay "fresh" for maxStoryAgeDays, so without a record the same story would be
// re-extracted (and re-drafted under a slightly different title) on every daily run.
export const SEEN_FILE = 'src/data/seen-urls.json';
export const normalizeUrl = u => {
  try {
    const x = new URL(u); x.hash = '';
    [...x.searchParams.keys()].filter(k => /^(utm_|fbclid|gclid|mc_)/i.test(k)).forEach(k => x.searchParams.delete(k));
    return (x.origin + x.pathname.replace(/\/+$/, '') + x.search).toLowerCase();
  } catch { return String(u || '').toLowerCase(); }
};
export function loadSeenUrls(claimsDir = 'src/data/claims', file = SEEN_FILE) {
  const seen = new Set();
  try { JSON.parse(fs.readFileSync(file, 'utf8')).forEach(u => seen.add(normalizeUrl(u))); } catch {}
  if (fs.existsSync(claimsDir)) for (const f of fs.readdirSync(claimsDir).filter(f => f.endsWith('.json'))) {
    try { JSON.parse(fs.readFileSync(path.join(claimsDir, f), 'utf8')).claims?.forEach(c => c.sourceUrl && seen.add(normalizeUrl(c.sourceUrl))); } catch {}
  }
  return seen;
}
export function saveSeenUrls(seen, file = SEEN_FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify([...seen].sort(), null, 1) + '\n');
}

// The feed gives a short snippet. Read the article itself so the fact sheet is not built from a teaser.
// Returns '' on any problem; the run then falls back to the snippet.
export async function fetchArticleText(url, max = 9000) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'HDPoint-feedreader/1.0', accept: 'text/html' }, signal: AbortSignal.timeout(15000), redirect: 'follow' });
    if (!res.ok || !/html/i.test(res.headers.get('content-type') || '')) return '';
    const html = (await res.text()).replace(/<(script|style|nav|footer|aside|form|header|noscript|svg)\b[\s\S]*?<\/\1>/gi, ' ');
    const body = (html.match(/<article\b[\s\S]*?<\/article>/i) || html.match(/<main\b[\s\S]*?<\/main>/i) || [html])[0];
    return strip(body).slice(0, max);
  } catch { return ''; }
}
