// Gate: any failure => never auto-published, goes to review queue. Warnings are style notes for the reviewer.
const CITE = /\[c\d+\]/;
const isRule = l => /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes('-');

export function runQa(f, article, cfg, dek = '') {
  const fails = [], warnings = [];
  const ids = new Set(f.claims.map(c => c.id));
  const urls = new Set(f.claims.map(c => c.sourceUrl));
  const min = (f.sponsored || f.selfReported) ? cfg.minSourcesPromo : cfg.minSourcesNews;
  if (urls.size < min) fails.push(`needs ${min} distinct source(s), has ${urls.size}`);

  [...article.matchAll(/\[(c\d+)\]/g)].map(m => m[1]).filter(id => !ids.has(id)).forEach(id => fails.push('cites unknown claim ' + id));

  // Every number in the headline text, standfirst and body must exist in the claims.
  const claimText = f.claims.map(c => c.text).join(' ').replace(/,/g, '');
  const text = (f.title + ' ' + dek + ' ' + article).replace(/\[c\d+\]/g, '').replace(/,/g, '');
  for (const n of new Set(text.match(/\d+(?:\.\d+)?/g) || [])) if (!claimText.includes(n)) fails.push('number not in fact sheet: ' + n);

  // Every paragraph, bullet and table row must cite a claim (headings and label lines excepted).
  const blocks = article.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  blocks.forEach((raw, bi) => {
    const lines = raw.split('\n').map(l => l.replace(/^>\s?/, '').trim()).filter(l => l && !/^#{1,6}\s/.test(l) && !/^\*\*[^*]+\*\*:?$/.test(l));
    if (!lines.length) return;
    if (lines.some(l => l.startsWith('|'))) {
      const rows = lines.filter(l => l.startsWith('|') && !isRule(l)).slice(1);     // first row is the header
      rows.forEach((r, i) => { if (!CITE.test(r)) fails.push(`table row ${i + 1} has no citation`); });
    } else if (lines.some(l => /^([-*]|\d+\.)\s/.test(l))) {
      lines.filter(l => /^([-*]|\d+\.)\s/.test(l)).forEach(l => { if (!CITE.test(l)) fails.push('uncited bullet: ' + l.slice(0, 40)); });
    } else if (!CITE.test(lines.join(' '))) fails.push('uncited paragraph ' + (bi + 1));
  });

  const low = (dek + ' ' + article).toLowerCase();
  cfg.bannedPhrases.filter(b => low.includes(b)).forEach(b => fails.push('banned phrase: ' + b));

  // Style notes (do not block publishing)
  if (dek && dek.length > 150) warnings.push(`standfirst is ${dek.length} characters; aim for 150 or fewer`);
  if (!dek) warnings.push('no standfirst (sub-headline)');
  let words = 0, warned = false;
  for (const line of article.split('\n')) {
    if (/^#{2,3}\s/.test(line)) { words = 0; warned = false; continue; }
    words += line.split(/\s+/).filter(Boolean).length;
    if (words > 320 && !warned) { warnings.push('a section runs past 320 words without a subheading'); warned = true; }
  }
  return { pass: fails.length === 0, fails, warnings };
}
