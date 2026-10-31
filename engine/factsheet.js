import { ask, parseJson } from './llm.js';
import { STORY_TYPES, TOPIC_TAGS, SECTOR_TAGS } from './schema.js';

const SYSTEM = `You extract a FACT SHEET from source material. Rules:
- Use ONLY facts present in the input. Never infer or add numbers.
- Each claim: {id:"c1",text,value?(number),unit?,label?,sourceUrl,basis}. basis="verified" only if an independent source in the input supports it; else "company-stated".
- Pick storyType from: ${STORY_TYPES.join(', ')}. Use "ecosystem" for overviews of many companies or a market.
- title: at most 90 characters, an active verb, the company or product name, and a number only if it is in a claim. Declarative and plain, never clickbait.
- flashcards: 3-6 {q,a,claimId} built only from claims.
- The text comes from a third-party outlet (item.source). Restate facts in your own words and never copy sentences. Set sourceUrl to item.url.
- topic: exactly ONE of [${TOPIC_TAGS.join(', ')}], the best fit (item.topics are hints). An article lives on one topic page only.
- If item.origin is "watch", the text comes from the company's own website: every claim is basis "company-stated", and the story is a profile of or update about that company (storyType startup_feature unless it is clearly a product launch or funding).
- embedUrl: only an official video/social URL that appears in the input, else null.
Return JSON only: {title,storyType,region,publishedAt,embedUrl,topic,claims,flashcards}`;

// Rules we enforce in code rather than trusting the model.
export function normalizeFactSheet(f, item) {
  f.topic = [f.topic, ...(Array.isArray(f.topics) ? f.topics : []), ...(item.topics || [])].find(t => TOPIC_TAGS.includes(t)) || 'innovation';
  delete f.topics; delete f.sectors;
  if (item.kind === 'submission') f.sponsored = true;
  if (item.origin === 'watch') {                       // the company's own pages: never "verified", always labelled
    f.selfReported = true; f.sponsored = false;
    f.claims = (f.claims || []).map(c => ({ ...c, basis: 'company-stated', sourceUrl: c.sourceUrl || item.url }));
  }
  return f;
}

export async function extractFactSheet(item, cfg) {
  if (item.kind === 'submission' && item.factSheet) return normalizeFactSheet({ ...item.factSheet }, item);
  const f = parseJson(await ask(cfg.model, SYSTEM, JSON.stringify(item)));
  return normalizeFactSheet(f, item);
}
