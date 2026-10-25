import type { APIContext } from 'astro';
import cfg from '../../config.json';
import { visiblePosts } from '../data/posts';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string));

export async function GET(ctx: APIContext) {
  const site = (ctx.site?.href ?? '').replace(/\/$/, '');
  const posts = (await visiblePosts()).filter((p) => !p.data.draft).slice(0, 30);
  const items = posts.map((p) => {
    const url = `${site}/posts/${p.id}/`;
    const label = p.data.sponsored ? '[Sponsored] ' : '';
    return `<item><title>${esc(label + p.data.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><description>${esc(label + p.data.summary)}</description></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(cfg.siteName)}</title><link>${site}/</link><description>AI products, model launches and startups across Nigeria and Africa.</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
