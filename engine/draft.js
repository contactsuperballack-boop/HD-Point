import { ask, parseJson } from './llm.js';
import { draftPrompt, mockDraft } from './styles.js';

// Returns { dek, body }. The style (launch, landscape, research or news) follows the story type; see engine/styles.js.
export async function draftArticle(f, cfg, mock = false) {
  if (mock) return mockDraft(f);
  const out = parseJson(await ask(cfg.model, draftPrompt(f, cfg), JSON.stringify(f)));
  return { dek: String(out.dek || '').replace(/\s+/g, ' ').trim().slice(0, 160), body: String(out.body || '') };
}
