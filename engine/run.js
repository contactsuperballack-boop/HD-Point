import fs from 'node:fs';
import { loadSubmissions, loadFeeds, loadWatchCandidates, filterCandidates, archive, discard } from './sources.js';
import { extractFactSheet } from './factsheet.js';
import { validateFactSheet } from './schema.js';
import { selectAssets } from './selector.js';
import { draftArticle } from './draft.js';
import { runQa } from './qa.js';
import { publish, slugify, POSTS_DIR } from './publish.js';

const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const mock = process.argv.includes('--mock');
const seen = new Set(fs.existsSync(POSTS_DIR) ? fs.readdirSync(POSTS_DIR).map(f => f.replace('.md', '')) : []);

let items = loadSubmissions(mock ? ['inbox/examples'] : undefined);
if (!mock) items = items.concat(await loadFeeds(cfg.feeds, cfg.maxPerFeed ?? 4), loadWatchCandidates());
items = filterCandidates(items, cfg);

// Reject bad submissions up front so they don't use up the run's post limit.
const bad = items.filter(i => i.kind === 'submission' && (i.errors?.length || !i.factSheet));
bad.forEach(i => { console.log('REJECT', i.file, '-', (i.errors || ['no fact sheet']).join('; ')); if (!mock) archive(i, 'rejected', (i.errors || []).join('\n')); });
items = items.filter(i => !bad.includes(i)).slice(0, cfg.postsPerRun);
console.log(`${items.length} candidate(s)  autoPublish=${cfg.autoPublish}`);

for (const item of items) {
  try {
    const f = await extractFactSheet(item, cfg);
    const errs = validateFactSheet(f);
    if (errs.length) { console.log('SKIP (bad fact sheet):', errs.join('; ')); if (!mock) { archive(item, 'rejected', errs.join('\n')); discard(item); } continue; }
    if (seen.has(slugify(f.title))) { console.log('SKIP (duplicate):', f.title); if (!mock) { archive(item, 'processed'); discard(item); } continue; }
    const assets = selectAssets(f, cfg);
    const draft = await draftArticle(f, cfg, mock);
    f.dek = draft.dek;
    const qa = runQa(f, draft.body, cfg, draft.dek);
    const r = publish(f, draft.body, assets, qa, cfg);
    console.log(`${r.live ? 'LIVE ' : 'DRAFT'} ${r.slug}  assets=[${assets}]  qa=${qa.pass ? 'pass' : 'FAIL ' + qa.fails.join(' | ')}${cfg.autoPublish && !r.live && r.reason ? '  (auto-publish locked: ' + r.reason + ')' : ''}`);
    if (!mock) { archive(item, 'processed'); discard(item); }
  } catch (e) { console.error('ERROR', e.message); }
}
