// One-step human approval: flips `draft: true` to `draft: false` for the named posts.
//   node engine/approve.js slug-one,slug-two
//   node engine/approve.js all-passing          (every draft that passed QA)
//   node engine/approve.js slug-one --force     (approve even if QA failed: you have checked it by hand)
// Approved posts count as human-reviewed for the auto-publish gate (engine/gate.js).
import fs from 'node:fs';
import { parseFrontmatter } from './frontmatter.js';

const POSTS = 'src/content/posts', QUEUE = 'review-queue.json';
const args = process.argv.slice(2);
const force = args.includes('--force');
const words = args.filter(a => !a.startsWith('--')).flatMap(a => a.split(/[\s,]+/)).filter(Boolean);
if (!words.length) { console.error('Usage: node engine/approve.js <slug[,slug]> | all-passing [--force]'); process.exit(1); }

const queue = fs.existsSync(QUEUE) ? JSON.parse(fs.readFileSync(QUEUE, 'utf8')) : [];
const byslug = Object.fromEntries(queue.map(q => [q.slug, q]));
let slugs = words;
if (words.includes('all-passing')) {
  slugs = queue.filter(q => q.qaPass).map(q => q.slug);
  if (!slugs.length) console.log('No drafts in the review queue passed QA.');
}

const approved = [], refused = [];
for (const slug of new Set(slugs)) {
  if (!/^[a-z0-9-]+$/.test(slug)) { refused.push([slug, 'not a valid slug']); continue; }
  const file = `${POSTS}/${slug}.md`;
  if (!fs.existsSync(file)) { refused.push([slug, 'no such post']); continue; }
  const text = fs.readFileSync(file, 'utf8');
  if (parseFrontmatter(text).draft !== true) { refused.push([slug, 'is not a draft']); continue; }
  const q = byslug[slug];
  if (q && q.qaPass === false && !force) { refused.push([slug, 'failed QA (' + (q.fails || []).slice(0, 3).join('; ') + '). Fix it, or use force.']); continue; }
  const head = text.indexOf('\n---', 3);                                   // only touch the front matter
  fs.writeFileSync(file, text.slice(0, head).replace(/^draft: true$/m, 'draft: false') + text.slice(head));
  approved.push(slug);
}

if (approved.length) fs.writeFileSync(QUEUE, JSON.stringify(queue.filter(q => !approved.includes(q.slug)), null, 2));
approved.forEach(s => console.log('APPROVED', s));
refused.forEach(([s, why]) => console.log('REFUSED ', s, '-', why));
if (!approved.length && refused.length) process.exit(1);
