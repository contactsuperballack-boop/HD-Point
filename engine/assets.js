import { chartable } from './selector.js';
import { SITE_NAME, markSvg, TYPE_LABEL, TOPIC_LABEL } from './brand.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wrap = (t, n) => { const l = []; let c = ''; for (const x of t.split(' ')) { if ((c + ' ' + x).length > n) { l.push(c); c = x; } else c = (c + ' ' + x).trim(); } if (c) l.push(c); return l; };

// Templated hero card: real SVG text, so no garbled AI-image typography.
export function heroCard(f) {
  const top = f.claims.find(c => typeof c.value === 'number') || f.claims[0];
  const stat = typeof top.value === 'number' ? `${top.value.toLocaleString('en')} ${top.unit || ''}`.trim() : '';
  // Long headlines get a smaller size and up to four lines, with an ellipsis only as a last resort.
  let size = 42, ls = wrap(f.title, 30), max = 3;
  if (ls.length > max) { size = 34; max = 4; ls = wrap(f.title, 38); }
  if (ls.length > max) { ls = ls.slice(0, max); ls[max - 1] = ls[max - 1].replace(/\s*\S*$/, '') + '…'; }
  const lines = ls.map((l, i) => `<text x="60" y="${205 + i * (size + 12)}" font-size="${size}" font-weight="700" fill="#fff">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" font-family="Inter,Arial,sans-serif">
<defs><radialGradient id="hb" cx="72%" cy="0%" r="95%"><stop offset="0" stop-color="#2C3347"/><stop offset="1" stop-color="#0E1118"/></radialGradient><linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F6FA"/><stop offset="1" stop-color="#7D889F"/></linearGradient></defs><rect width="1200" height="630" fill="url(#hb)"/><rect width="10" height="630" fill="url(#hc)"/>
<text x="60" y="110" font-size="24" fill="#A5AEC0" letter-spacing="2">${esc((TYPE_LABEL[f.storyType] || f.storyType || '').toUpperCase())}  ·  ${esc((f.region || 'Africa').toUpperCase())}${f.sponsored ? '  ·  SPONSORED' : ''}</text>
${lines}
${stat ? `<text x="60" y="540" font-size="64" font-weight="800" fill="#F4F6FA">${esc(stat)}</text><text x="60" y="580" font-size="22" fill="#A5AEC0">${esc(top.label || '')}</text>` : ''}
<text x="1078" y="580" font-size="26" font-weight="700" fill="#DDE3EF" text-anchor="end">${esc(SITE_NAME)}</text>${markSvg(1094, 548, 40, '#DDE3EF')}
</svg>`;
}

// Calm thumbnail for cards and the top of a post: kicker, one key figure (or the topic), brand. No headline, so it never repeats the title.
export function thumbCard(f) {
  const top = f.claims.find(c => typeof c.value === 'number');
  const kicker = esc(((TYPE_LABEL[f.storyType] || '') + '  ·  ' + (f.region || 'Africa') + (f.sponsored ? '  ·  Sponsored' : '')).toUpperCase());
  const big = top ? esc(top.value.toLocaleString('en')) : esc(TOPIC_LABEL[f.topic] || '');
  const size = top ? (big.length > 6 ? 120 : 168) : 150;
  const sub = top ? `<text x="64" y="418" font-size="36" font-weight="600" fill="#DDE3EF">${esc(top.unit || '')}</text><text x="64" y="466" font-size="26" fill="#A5AEC0">${esc(top.label || '')}</text>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" font-family="Inter,Arial,sans-serif">
<defs><radialGradient id="tb" cx="72%" cy="0%" r="95%"><stop offset="0" stop-color="#2C3347"/><stop offset="1" stop-color="#0E1118"/></radialGradient><linearGradient id="tc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F6FA"/><stop offset="1" stop-color="#7D889F"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#tb)"/><rect width="10" height="630" fill="url(#tc)"/>
<g opacity=".07">${markSvg(700, 40, 560, '#DDE3EF', '#DDE3EF')}</g>
<text x="64" y="84" font-size="24" fill="#A5AEC0" letter-spacing="2">${kicker}</text>
<text x="64" y="${top ? 340 : 360}" font-size="${size}" font-weight="800" fill="#F4F6FA" letter-spacing="-2">${big}</text>${sub}
<text x="1078" y="580" font-size="26" font-weight="700" fill="#DDE3EF" text-anchor="end">${esc(SITE_NAME)}</text>${markSvg(1094, 548, 40, '#DDE3EF')}
</svg>`;
}

// Bar chart drawn only from numeric claims sharing a unit.
export function barChart(f) {
  const rows = chartable(f); if (!rows) return null;
  const max = Math.max(...rows.map(r => r.value)), unit = rows[0].unit, h = 100 + rows.length * 62;
  const bars = rows.map((r, i) => { const w = Math.round((r.value / max) * 600), y = 70 + i * 62;
    return `<text x="20" y="${y + 24}" font-size="16" fill="#E8ECF4">${esc(r.label || r.id)}</text><rect x="240" y="${y}" width="${w}" height="34" rx="3" fill="#C7CFDD"/><text x="${248 + w}" y="${y + 24}" font-size="16" fill="#E8ECF4">${r.value.toLocaleString('en')}</text>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 ${h}" font-family="Inter,Arial,sans-serif"><rect width="960" height="${h}" rx="10" fill="#141923"/>
<text x="20" y="36" font-size="20" font-weight="700" fill="#E8ECF4">${esc(f.title)} (${esc(unit)})</text>${bars}
<text x="20" y="${h - 12}" font-size="12" fill="#A5AEC0">Claims: ${rows.map(r => r.id).join(', ')} — sources listed in article</text></svg>`;
}

export const flashcardsMd = f => (f.flashcards || []).map(c => `<details><summary>${esc(c.q)}</summary>${esc(c.a)} <small>[${c.claimId}]</small></details>`).join('\n');
export const embedMd = f => `[Watch / view the official post](${f.embedUrl})`;
