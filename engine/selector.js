// Deterministic: picks assets by story type AND by whether the data can support them.
// Order = priority. Only `maxExtraAssets` non-hero assets are kept per post, so posts don't get every format.
const PREFERRED = {
  model_launch:   ['hero', 'deck', 'chart', 'embed', 'report'],
  product_launch: ['hero', 'infographic', 'deck', 'embed'],
  startup_feature:['hero', 'infographic', 'deck', 'embed', 'flashcards'],
  funding:        ['hero', 'infographic', 'report', 'chart'],
  skills_guide:   ['hero', 'flashcards', 'deck'],
  local_news:     ['hero', 'embed', 'infographic'],
  research:       ['hero', 'report', 'chart', 'flashcards', 'infographic'],
  ecosystem:      ['hero', 'chart', 'infographic', 'report', 'deck']
};

export function chartable(f) {
  const byUnit = {};
  f.claims.filter(c => typeof c.value === 'number' && c.unit).forEach(c => (byUnit[c.unit] ||= []).push(c));
  const best = Object.values(byUnit).sort((a, b) => b.length - a.length)[0];
  return best && best.length >= 2 ? best : null;
}

export function selectAssets(f, cfg) {
  const ok = a => {
    if (!cfg.assets[a]) return false;
    if (a === 'chart') return !!chartable(f);
    if (a === 'flashcards') return (f.flashcards || []).length >= 3;
    if (a === 'embed') return !!f.embedUrl;
    if (a === 'deck') return f.claims.length >= 4;
    if (a === 'infographic') return f.claims.length >= 3;
    if (a === 'report') return f.claims.length >= 5;
    return true;
  };
  const picked = (PREFERRED[f.storyType] || ['hero']).filter(ok);
  const extra = picked.filter(a => a !== 'hero').slice(0, cfg.maxExtraAssets ?? 3);
  return picked.includes('hero') ? ['hero', ...extra] : extra;
}
