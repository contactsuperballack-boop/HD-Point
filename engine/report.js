import { barChart } from './assets.js';
import { chartable } from './selector.js';
import { SITE_NAME } from './brand.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TYPE = { model_launch: 'Model launch', product_launch: 'Product launch', startup_feature: 'Startup feature', funding: 'Funding', skills_guide: 'Skills guide', local_news: 'Local news', research: 'Research', ecosystem: 'Landscape' };
const badge = c => c.basis === 'verified' ? '<span class="b v">Verified</span>' : '<span class="b s">Company says</span>';

// Print-ready report (A4). Open it and use Print > Save as PDF. Built only from the fact sheet.
export function reportHtml(f) {
  const n = f.claims.length, ver = f.claims.filter(c => c.basis === 'verified').length, st = n - ver;
  const nums = f.claims.filter(c => typeof c.value === 'number');
  const bySource = {};
  f.claims.forEach(c => (bySource[c.sourceUrl] ||= []).push(c));
  const date = (f.publishedAt || '').slice(0, 10);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(f.title)}: report | ${esc(SITE_NAME)}</title>
<style>
:root{--ink:#141926;--indigo:#232B3D;--paper:#F4F6FA;--ochre:#8F99AD;--stated:#4A5568;--rule:#D3D9E4;--muted:#4A5568}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.6 Georgia,'Times New Roman',serif}
.page{max-width:48rem;margin:0 auto;padding:2.5rem 1.5rem 4rem}
h1,h2,th,.meta,.b,button,.ref{font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif}
h1{font-size:2.2rem;line-height:1.12;color:var(--indigo);margin:.2rem 0 1rem}
h2{font-size:1.25rem;color:var(--indigo);margin:2.2rem 0 .6rem;padding-top:.8rem;border-top:3px solid var(--indigo);break-after:avoid}
.meta{color:var(--muted);margin:0;font-size:.95rem}
.notice{border-left:5px solid var(--ochre);background:#fff;padding:.6rem 1rem;margin:1rem 0}
.b{display:inline-block;padding:0 .5em;font-size:.75rem;font-weight:700;border:2px solid var(--indigo)}
.b.v{background:var(--indigo);color:#fff}.b.s{border-color:var(--stated);color:var(--ink)}
.ref{color:var(--muted);font-size:.8rem;margin-left:.4rem}
table{border-collapse:collapse;width:100%;font-size:.95rem}th,td{text-align:left;padding:.45rem .5rem;border-bottom:1px solid var(--rule);vertical-align:top}
th{font-size:.85rem;color:var(--muted)}tr{break-inside:avoid}td{overflow-wrap:anywhere}
ol.claims{padding-left:1.3rem}ol.claims li{margin:0 0 .7rem;break-inside:avoid}
.chart svg{width:100%;height:auto;border:1px solid var(--rule);break-inside:avoid}
button{font-size:.9rem;padding:.5rem 1rem;border:2px solid var(--indigo);background:#fff;color:var(--indigo);cursor:pointer;float:right}
button:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
@page{size:A4;margin:16mm}
@media print{body{background:#fff;font-size:11pt}.page{padding:0;max-width:none}button{display:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="page">
<button type="button" onclick="window.print()">Print or save as PDF</button>
<p class="meta">${esc(SITE_NAME)}, report, ${esc(TYPE[f.storyType] || f.storyType)}, ${esc(f.region || 'Africa')}${date ? ', ' + esc(date) : ''}</p>
<h1>${esc(f.title)}</h1>
${f.sponsored ? '<div class="notice"><strong>Sponsored / featured submission.</strong> Claims marked "Company says" come from the company and were not independently verified.</div>' : ''}

${nums.length ? `<h2>Key figures</h2><table><tr><th>Figure</th><th>Value</th><th>Basis</th><th>Claim</th></tr>${nums.map(c => `<tr><td>${esc(c.label || c.unit || '')}</td><td>${c.value.toLocaleString('en')} ${esc(c.unit || '')}</td><td>${badge(c)}</td><td>${c.id}</td></tr>`).join('')}</table>` : ''}

<h2>What was reported</h2>
<ol class="claims">${f.claims.map(c => `<li>${esc(c.text)} ${badge(c)}<span class="ref">${c.id}</span></li>`).join('')}</ol>

${chartable(f) ? `<h2>Chart</h2><div class="chart">${barChart(f)}</div>` : ''}

<h2>How well sourced is this?</h2>
<p>${ver} of ${n} claims are supported by an independent source. ${st} come from the company itself and have not been independently checked.</p>
<table><tr><th>Source</th><th>Claims</th><th>Basis</th></tr>${Object.entries(bySource).map(([u, cs]) => `<tr><td>${esc(u)}</td><td>${cs.map(c => c.id).join(', ')}</td><td>${[...new Set(cs.map(c => c.basis === 'verified' ? 'Verified' : 'Company says'))].join(', ')}</td></tr>`).join('')}</table>

<h2>About this report</h2>
<p>Published by ${esc(SITE_NAME)}. This report was generated with AI assistance from a structured list of claims. Each statement above links to a source in the table. It contains no analysis or opinion beyond what those sources state.</p>
</div></body></html>`;
}
