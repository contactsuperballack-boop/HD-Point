import fs from 'node:fs';
import { loadSubmissions, loadFeeds, loadWatchCandidates, filterCandidates, archive, discard, loadSeenUrls, saveSeenUrls, normalizeUrl, fetchArticleText } from './sources.js';
import { extractFactSheet } from './factsheet.js';
import { validateFactSheet } from './schema.js';
import { selectAssets } from './selector.js';
import { draftArticle } from './draft.js';
import { runQa } from './qa.js';
import { publish, slugify, POSTS_DIR } from './publish.js';

const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const mock = process.argv.includes('--mock');
if (!mock && !process.env.ANTHROPIC_API_KEY) { console.error('FAIL: ANTHROPIC_API_KEY is not set'); process.exit(1); }
const seen = new Set(fs.existsSync(POSTS_DIR) ? fs.readdirSync(POSTS_DIR).map(f => f.replace('.md', '')) : []);

let items = loadSubmissions(mock ? ['inbox/examples'] : undefined);
if (!mock) items = items.concat(await loadFeeds(cfg.feeds, cfg.maxPerFeed ?? 4), loadWatchCandidates());
items = filterCandidates(items, cfg);

// Skip feed stories we have already handled (watched company pages are exempt: their URL stays the same when they change).
const seenUrls = mock ? new Set() : loadSeenUrls();
const isFeed = i => i.kind === 'news' && i.origin !== 'watch';
const before = items.length;
items = items.filter(i => !(isFeed(i) && seenUrls.has(normalizeUrl(i.url))));
if (before !== items.length) console.log(`skipped ${before - items.length} already-handled story(ies)`);

// Reject bad submissions up front so they don't use up the run's post limit.
const bad = items.filter(i => i.kind === 'submission' && (i.errors?.length || !i.factSheet));
bad.forEach(i => { console.log('REJECT', i.file, '-', (i.errors || ['no fact sheet']).join('; ')); if (!mock) archive(i, 'rejected', (i.errors || []).join('\n')); });
items = items.filter(i => !bad.includes(i)).slice(0, cfg.postsPerRun);
console.log(`${items.length} candidate(s)  autoPublish=${cfg.autoPublish}`);

let made = 0, errors = 0;
for (const item of items) {
  try {
    if (cfg.fullText !== false && !mock && isFeed(item)) {
      const text = await fetchArticleText(item.url);
      if (text.length > (item.summary || '').length + 300) item.text = text;
    }
    const f = await extractFactSheet(item, cfg);
    const errs = validateFactSheet(f);
    if (errs.length) { console.log('SKIP (bad fact sheet):', errs.join('; ')); if (!mock) { archive(item, 'rejected', errs.join('\n')); discard(item); } if (isFeed(item)) seenUrls.add(normalizeUrl(item.url)); continue; }
    if (seen.has(slugify(f.title))) { console.log('SKIP (duplicate):', f.title); if (!mock) { archive(item, 'processed'); discard(item); } if (isFeed(item)) seenUrls.add(normalizeUrl(item.url)); continue; }
    const assets = selectAssets(f, cfg);
    const draft = await draftArticle(f, cfg, mock);
    f.dek = draft.dek;
    const qa = runQa(f, draft.body, cfg, draft.dek);
    const r = publish(f, draft.body, assets, qa, cfg);
    console.log(`${r.live ? 'LIVE ' : 'DRAFT'} ${r.slug}  assets=[${assets}]  qa=${qa.pass ? 'pass' : 'FAIL ' + qa.fails.join(' | ')}${cfg.autoPublish && !r.live && r.reason ? '  (auto-publish locked: ' + r.reason + ')' : ''}`);
    if (!mock) { archive(item, 'processed'); discard(item); }
    if (isFeed(item)) seenUrls.add(normalizeUrl(item.url));
    made++;
  } catch (e) { errors++; console.error('ERROR', e.message); }   // not marked as seen, so the next run retries it
}
if (!mock) saveSeenUrls(seenUrls);
console.log(`run summary: ${made} written, ${errors} error(s), ${items.length - made - errors} skipped`);
if (items.length && made === 0 && errors > 0) { console.error('FAIL: every candidate errored'); process.exitCode = 1; }
