import type { APIContext } from 'astro';
import cfg from '../../config.json';
import { allDigests } from '../data/digests';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string));

// One item per approved weekly issue, with the full HTML in content:encoded.
// Point your email provider's RSS-to-email feature at this feed to send each issue automatically.
export async function GET(ctx: APIContext) {
  const site = (ctx.site?.href ?? '').replace(/\/$/, '');
  const items = allDigests().filter((d) => !d.draft).slice(0, 20).map((d) => {
    const url = `${site}/digest/${d.id}/`;
    return `<item><title>${esc(d.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(d.date).toUTCString()}</pubDate><description>${esc(d.summary)}</description><content:encoded><![CDATA[${d.html.replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${esc(cfg.siteName)} weekly digest</title><link>${site}/digest/</link><description>The week's posts and how well each one is sourced.</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
