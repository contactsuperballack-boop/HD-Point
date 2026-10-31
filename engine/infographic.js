import { chartable } from './selector.js';
import { SITE_NAME, markSvg } from './brand.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TYPE = { model_launch: 'Model launch', product_launch: 'Product launch', startup_feature: 'Startup feature', funding: 'Funding', skills_guide: 'Skills guide', local_news: 'Local news', research: 'Research', ecosystem: 'Landscape' };
const wrap = (t, n, max = 99) => {
  const lines = []; let cur = '';
  for (const w of String(t).split(' ')) { if ((cur + ' ' + w).trim().length > n) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  if (lines.length > max) { lines.length = max; lines[max - 1] = lines[max - 1].replace(/\s*\S*$/, '') + '…'; }
  return lines;
};
const INK = '#E8ECF4', INDIGO = '#DDE3EF', OCHRE = '#A5AEC0', STATED = '#C7CFDD', MUTED = '#A5AEC0', RULE = '#2A3243', HDR = '#1B2230', BG = '#0D1017';

// 1080-wide portrait infographic, built only from the fact sheet. Height grows with content.
export function infographic(f) {
  const W = 1080, M = 64, out = [];
  const num = f.claims.find(c => typeof c.value === 'number');
  const rows = chartable(f);

  // header
  const tl = wrap(f.title, 28, 4);
  let y = 70;
  out.push(`<text x="${M}" y="${y}" font-size="26" fill="${OCHRE}">${esc(TYPE[f.storyType] || f.storyType)}, ${esc(f.region || 'Africa')}</text>`);
  y += 30;
  tl.forEach((l, i) => out.push(`<text x="${M}" y="${y + 52 + i * 62}" font-size="52" font-weight="800" fill="#fff">${esc(l)}</text>`));
  y += 52 + (tl.length - 1) * 62 + 30;
  if (f.sponsored) { out.push(`<rect x="${M}" y="${y}" width="310" height="42" fill="none" stroke="${OCHRE}" stroke-width="3"/><text x="${M + 16}" y="${y + 29}" font-size="22" font-weight="700" fill="#fff">Sponsored / featured</text>`); y += 42 + 24; }
  const hdr = y + 20;
  out.unshift(`<rect width="${W}" height="${hdr}" fill="${HDR}"/>`);
  y = hdr + 70;

  // key figure
  if (num) {
    out.push(`<text x="${M}" y="${y + 70}" font-size="130" font-weight="800" fill="${INDIGO}">${num.value.toLocaleString('en')}</text>`);
    out.push(`<text x="${M}" y="${y + 120}" font-size="32" fill="${MUTED}">${esc((num.unit || '') + (num.label ? ': ' + num.label : ''))}</text>`);
    y += 120 + 60;
  }

  // claims
  f.claims.slice(0, 6).forEach(c => {
    const lines = wrap(c.text, 50, 4);
    const mark = c.basis === 'verified'
      ? `<rect x="${M}" y="${y - 22}" width="26" height="26" fill="${INDIGO}"/>`
      : `<rect x="${M + 1.5}" y="${y - 20.5}" width="23" height="23" fill="none" stroke="${STATED}" stroke-width="3"/>`;
    out.push(mark);
    lines.forEach((l, i) => out.push(`<text x="${M + 48}" y="${y + i * 38}" font-size="28" fill="${INK}">${esc(l)}</text>`));
    out.push(`<text x="${W - M}" y="${y}" font-size="20" fill="${MUTED}" text-anchor="end">${c.id}</text>`);
    y += (lines.length - 1) * 38 + 56;
  });

  // figures
  if (rows) {
    y += 10;
    out.push(`<text x="${M}" y="${y}" font-size="30" font-weight="700" fill="${INDIGO}">Figures (${esc(rows[0].unit)})</text>`);
    y += 30;
    const max = Math.max(...rows.map(r => r.value));
    rows.slice(0, 6).forEach(r => {
      const w = Math.max(4, Math.round((r.value / max) * 480)), label = String(r.label || r.id);
      out.push(`<text x="${M}" y="${y + 28}" font-size="22" fill="${INK}">${esc(label.length > 26 ? label.slice(0, 25) + '…' : label)}</text>`);
      out.push(`<rect x="${M + 310}" y="${y}" width="${w}" height="38" fill="${INDIGO}"/>`);
      out.push(`<text x="${M + 322 + w}" y="${y + 28}" font-size="22" fill="${INK}">${r.value.toLocaleString('en')}</text>`);
      y += 56;
    });
  }

  // footer
  y += 20;
  out.push(`<line x1="${M}" y1="${y}" x2="${W - M}" y2="${y}" stroke="${RULE}" stroke-width="2"/>`);
  y += 44;
  out.push(`<rect x="${M}" y="${y - 20}" width="22" height="22" fill="${INDIGO}"/><text x="${M + 34}" y="${y}" font-size="22" fill="${INK}">Verified</text>`);
  out.push(`<rect x="${M + 191.5}" y="${y - 18.5}" width="19" height="19" fill="none" stroke="${STATED}" stroke-width="3"/><text x="${M + 226}" y="${y}" font-size="22" fill="${INK}">Company says</text><text x="${W - M - 58}" y="${y}" font-size="26" font-weight="800" fill="${INDIGO}" text-anchor="end">${esc(SITE_NAME)}</text>${markSvg(W - M - 48, y - 34, 38, INDIGO, OCHRE)}`);
  y += 44;
  out.push(`<text x="${M}" y="${y}" font-size="20" fill="${MUTED}">AI-assisted. Every claim is linked to a source in the full post.</text>`);
  y += 40;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}" role="img" aria-label="${esc('Infographic: ' + f.title)}" font-family="'Bricolage Grotesque',system-ui,-apple-system,'Segoe UI',Arial,sans-serif"><rect width="${W}" height="${y}" fill="${BG}"/>${out.join('')}</svg>`;
}
