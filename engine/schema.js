export const TOPIC_TAGS = ['ai', 'innovation', 'leisure', 'lifestyle'];
export const STORY_TYPES = ['model_launch','product_launch','startup_feature','funding','skills_guide','local_news','research','ecosystem'];
export const SECTOR_TAGS = ['voice-language', 'agri-climate', 'credit-fintech', 'health', 'infrastructure', 'policy-data', 'skills', 'funding'];

// Fact sheet = single source of truth. Every asset and the article come ONLY from this.
// { title, storyType, region, sponsored, publishedAt, embedUrl,
//   claims:[{id,text,value?,unit?,label?,sourceUrl,basis:'verified'|'company-stated'}],
//   flashcards:[{q,a,claimId}] }
export function validateFactSheet(f) {
  const errs = [];
  if (!f.title) errs.push('missing title');
  if (!STORY_TYPES.includes(f.storyType)) errs.push('bad storyType: ' + f.storyType);
  if (!Array.isArray(f.claims) || f.claims.length === 0) errs.push('no claims');
  const ids = new Set();
  for (const c of f.claims || []) {
    if (!c.id || ids.has(c.id)) errs.push('bad/duplicate claim id ' + c.id);
    ids.add(c.id);
    if (!c.text) errs.push(c.id + ': empty text');
    if (!c.sourceUrl) errs.push(c.id + ': no sourceUrl');
    if (!['verified', 'company-stated'].includes(c.basis)) errs.push(c.id + ': bad basis');
  }
  for (const fc of f.flashcards || []) if (!ids.has(fc.claimId)) errs.push('flashcard cites unknown claim ' + fc.claimId);
  return errs;
}
