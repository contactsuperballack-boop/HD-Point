// Writing styles. Four layouts learned from well-known tech publications, mapped to story types.
// The layouts decide structure and tone only. The facts always come from the fact sheet, and every claim is cited.
import { STORY_TYPES } from './schema.js';

const COMMON = `Rules for every post:
- Use ONLY the claims in the fact sheet. Every sentence that states a fact, every bullet and every table row ends with its claim markers, like [c1].
- Never add a number, date, name, quote, benchmark, price, link or call to action that is not in a claim. The Sources list is added automatically, so do not write one.
- If there are no claims for a section, leave that section out. Do not write filler. Do not put quotation marks around spoken words.
- Short paragraphs (1 to 3 sentences). Active verbs. Plain words. No hype words such as revolutionary, groundbreaking, game-changer or unprecedented.
- Attribute any claim whose basis is "company-stated" ("the company says").
- Put a heading (## or ###) at least every 250 words.
- Output JSON only: {"dek": "...", "body": "..."}.
  dek = one sentence, at most 150 characters, stating the key fact or value. No claim markers in the dek.
  body = Markdown without the title.`;

export const STYLES = {
  launch: {
    label: 'Product and launch',
    types: ['model_launch', 'product_launch', 'startup_feature', 'skills_guide'],
    brief: `Layout (product and launch announcement: confident, concise, direct):
1. Open with a blockquote headed "> **Key takeaways**" with 3 or 4 bullets: what is new, who can use it and how, and any status or limits.
2. ## Why it matters: 2 or 3 short paragraphs on the problem and what changes.
3. ## What it does: one ### subheading per capability. Add a comparison table only if the claims hold the figures for it.
4. ## Limits and safety: only if claims cover risks or safeguards.
5. ## Availability: how and where to use it, only if claims say so.`
  },
  landscape: {
    label: 'Landscape',
    types: ['ecosystem'],
    brief: `Layout (ecosystem overview: clear, structured, evidence first):
1. Open with a blockquote headed "> **Key takeaways**" with 3 or 4 bullets: the main shift, where activity concentrates, and one limit of the evidence.
2. ## The landscape shift: 2 short paragraphs.
3. ## What is being built: one ### subheading per theme (for example voice and language, agriculture and climate, credit and risk, health, infrastructure). Under each, one bullet per company, each ending in its claim marker.
4. ## Where the activity is: a Markdown table of markets or hubs. The last column holds the claim markers.
5. ## Limits of the data: what the figures cover and what they do not (only from claims).
6. ## What comes next: only from claims.`
  },
  research: {
    label: 'Research',
    types: ['research'],
    brief: `Layout (research write-up: careful, transparent, honest about limits):
1. Open with a blockquote headed "> **Abstract**" with three bullets: the question, the key finding, why it matters.
2. ## Background: define the terms.
3. ## Method: how the work was done.
4. ## Results: the findings, with a table where the numbers allow.
5. ## Limitations: what the work does not show, edge cases, where it may not hold. Required. Only from claims.
6. ## What comes next: future work, only from claims.`
  },
  news: {
    label: 'News',
    types: ['funding', 'local_news'],
    brief: `Layout (news report: fast, punchy, most important facts first):
1. Lede: 1 or 2 sentences answering who, what, when, where and why.
2. A blockquote headed "> **Key facts**" with bullets for the core numbers (amounts, investors, growth) from the claims.
3. ## The details: short paragraphs.
4. ## Market context: only from claims.
5. ## What is next: milestones from claims.`
  }
};

export const styleFor = type => Object.entries(STYLES).find(([, s]) => s.types.includes(type))?.[0] ?? 'news';

export function draftPrompt(f, cfg = {}) {
  const key = styleFor(f.storyType), s = STYLES[key];
  return `You write posts for ${cfg.siteName || 'a news site'}, which covers AI, innovation, leisure and lifestyle in Nigeria and across Africa.\nStyle: ${s.label}.\n${s.brief}\n\n${COMMON}`;
}

// Offline stand-in for the model, used by --mock and tests. It follows the same layout.
export function mockDraft(f) {
  const c = f.claims, line = x => `${x.text} [${x.id}]`;
  const lead = key => key === 'research' ? 'Abstract' : key === 'news' ? 'Key facts' : 'Key takeaways';
  const key = styleFor(f.storyType);
  const box = ['> **' + lead(key) + '**', '>', ...c.slice(0, 4).map(x => '> - ' + line(x))].join('\n');
  const rest = c.slice(4).map(line);
  return {
    dek: String(c[0].text).replace(/\s+/g, ' ').slice(0, 150),
    body: [box, '## The details', ...(rest.length ? rest : [line(c[0])])].join('\n\n')
  };
}
