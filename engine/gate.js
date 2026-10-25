import fs from 'node:fs';
import { loadPosts } from './frontmatter.js';
import { STORY_TYPES } from './schema.js';

export function loadCorrections(file = 'src/data/corrections.json') {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

// Auto-publish is earned per story type: the type must be listed in autoPublishTypes, have enough
// human-reviewed posts, and a low correction rate. Everything else stays a draft.
export function autoPublishStatus(storyType, cfg, posts = loadPosts(), corrections = loadCorrections()) {
  if (!cfg.autoPublish) return { ok: false, reason: 'autoPublish is off' };
  if (!(cfg.autoPublishTypes ?? []).includes(storyType)) return { ok: false, reason: `${storyType} is not in autoPublishTypes` };
  const g = cfg.autoPublishGate ?? {};
  const minReviewed = g.minReviewed ?? 10, maxRate = g.maxCorrectionRate ?? 0.02, days = g.windowDays ?? 90;
  const since = Date.now() - days * 864e5;
  const ofType = posts.filter(p => p.type === storyType);
  const reviewed = ofType.filter(p => p.draft === false && !p.autoPublished && !p.sponsored && new Date(p.date).getTime() >= since);
  if (reviewed.length < minReviewed) return { ok: false, reason: `only ${reviewed.length} of ${minReviewed} human-reviewed ${storyType} posts in the last ${days} days` };
  const slugs = new Set(ofType.map(p => p.slug));
  const recent = corrections.filter(c => slugs.has(c.slug) && new Date(c.date).getTime() >= since);
  const rate = recent.length / reviewed.length;
  if (rate > maxRate) return { ok: false, reason: `correction rate ${(rate * 100).toFixed(1)}% is above ${(maxRate * 100).toFixed(1)}%` };
  return { ok: true, reason: `${reviewed.length} reviewed posts, ${recent.length} correction(s)` };
}

// `node engine/gate.js` shows how close each story type is to being allowed to auto-publish.
if (process.argv[1] && process.argv[1].endsWith('gate.js')) {
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  const posts = loadPosts(), corr = loadCorrections(), min = cfg.autoPublishGate?.minReviewed ?? 10;
  console.log(`autoPublish=${cfg.autoPublish}  eligible types: ${(cfg.autoPublishTypes ?? []).join(', ') || '(none listed)'}`);
  for (const t of STORY_TYPES) {
    const reviewed = posts.filter(p => p.type === t && p.draft === false && !p.autoPublished && !p.sponsored).length;
    const fixes = corr.filter(c => posts.find(p => p.slug === c.slug && p.type === t)).length;
    console.log(`${t.padEnd(16)} reviewed ${String(reviewed).padStart(3)}/${min}  corrections ${fixes}  ${reviewed >= min && fixes / Math.max(reviewed, 1) <= (cfg.autoPublishGate?.maxCorrectionRate ?? 0.02) ? 'meets the bar' : 'not yet'}`);
  }
}
