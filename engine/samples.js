// Builds draft sample posts from hand-written fact sheets in samples/*.json, using the same checks and
// publishing code as the real pipeline. Run:  npm run samples   (then `npm run dev` to preview).
// Each sample is a company's own website, so every claim is "company says" and posts carry the self-reported note.
import fs from 'node:fs';
import { normalizeFactSheet } from './factsheet.js';
import { validateFactSheet } from './schema.js';
import { selectAssets } from './selector.js';
import { runQa } from './qa.js';
import { publish } from './publish.js';

const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const files = fs.readdirSync('samples').filter(f => f.endsWith('.json')).sort().reverse();   // first file is published last, so it is the newest (lead story)
for (const file of files) {
  const { factSheet, article, dek } = JSON.parse(fs.readFileSync(`samples/${file}`, 'utf8'));
  const own = factSheet.selfReported !== false && factSheet.claims.every(c => c.basis === 'company-stated');   // company pages vs independently sourced pieces
  const f = normalizeFactSheet({ ...factSheet, publishedAt: new Date().toISOString() }, own ? { origin: 'watch', url: factSheet.claims[0].sourceUrl, kind: 'news', topics: factSheet.topics } : { kind: 'news', topics: factSheet.topics });
  const errs = validateFactSheet(f);
  if (errs.length) { console.log('SKIP', file, errs.join('; ')); continue; }
  f.dek = dek || '';
  await new Promise(r => setTimeout(r, 8));   // distinct timestamps keep the lead story newest
  const assets = selectAssets(f, cfg), qa = runQa(f, article, cfg, f.dek), r = publish(f, article, assets, qa, cfg);
  console.log(`${r.live ? 'LIVE ' : 'DRAFT'} ${r.slug}  assets=[${assets}]  qa=${qa.pass ? 'pass' : 'FAIL ' + qa.fails.join(' | ')}`);
}
