import { chartable } from './selector.js';
import { SITE_NAME, markSvg, TYPE_LABEL } from './brand.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wrap = (t, n) => { const l = []; let c = ''; for (const x of t.split(' ')) { if ((c + ' ' + x).length > n) { l.push(c); c = x; } else c = (c + ' ' + x).trim(); } if (c) l.push(c); return l.slice(0, 3); };

// Templated hero card: real SVG text, so no garbled AI-image typography.
export function heroCard(f) {
  const top = f.claims.find(c => typeof c.value === 'number') || f.claims[0];
  const stat = typeof top.value === 'number' ? `${top.value.toLocaleString('en')} ${top.unit || ''}`.trim() : '';
  const lines = wrap(f.title, 30).map((l, i) => `<text x="60" y="${210 + i * 52}" font-size="42" font-weight="700" fill="#fff">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" font-family="Inter,Arial,sans-serif">
<rect width="1200" height="630" fill="#1B2A6B"/><rect width="14" height="630" fill="#F2B134"/>
<text x="60" y="110" font-size="24" fill="#F2B134">${esc(TYPE_LABEL[f.storyType] || f.storyType || '')}, ${esc(f.region || 'Africa')}${f.sponsored ? ', sponsored' : ''}</text>
${lines}
${stat ? `<text x="60" y="540" font-size="64" font-weight="800" fill="#F2B134">${esc(stat)}</text><text x="60" y="580" font-size="22" fill="#C9CDE0">${esc(top.label || '')}</text>` : ''}
<text x="1078" y="580" font-size="26" font-weight="700" fill="#F2B134" text-anchor="end">${esc(SITE_NAME)}</text>${markSvg(1094, 548, 40, '#C4CEFF')}
</svg>`;
}

// Bar chart drawn only from numeric claims sharing a unit.
export function barChart(f) {
  const rows = chartable(f); if (!rows) return null;
  const max = Math.max(...rows.map(r => r.value)), unit = rows[0].unit, h = 100 + rows.length * 62;
  const bars = rows.map((r, i) => { const w = Math.round((r.value / max) * 600), y = 70 + i * 62;
    return `<text x="20" y="${y + 24}" font-size="16" fill="#222">${esc(r.label || r.id)}</text><rect x="240" y="${y}" width="${w}" height="34" rx="2" fill="#1B2A6B"/><text x="${248 + w}" y="${y + 24}" font-size="16" fill="#222">${r.value.toLocaleString('en')}</text>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 ${h}" font-family="Inter,Arial,sans-serif"><rect width="960" height="${h}" fill="#fff"/>
<text x="20" y="36" font-size="20" font-weight="700" fill="#111">${esc(f.title)} (${esc(unit)})</text>${bars}
<text x="20" y="${h - 12}" font-size="12" fill="#666">Claims: ${rows.map(r => r.id).join(', ')} — sources listed in article</text></svg>`;
}

export const flashcardsMd = f => (f.flashcards || []).map(c => `<details><summary>${esc(c.q)}</summary>${esc(c.a)} <small>[${c.claimId}]</small></details>`).join('\n');
export const embedMd = f => `[Watch / view the official post](${f.embedUrl})`;
