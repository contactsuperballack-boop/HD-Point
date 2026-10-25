import type { APIContext } from 'astro';
import { visiblePosts } from '../data/posts';
import { allDigests } from '../data/digests';
import { TOPICS } from '../data/topics';

export async function GET(ctx: APIContext) {
  const site = (ctx.site?.href ?? '').replace(/\/$/, '');
  const posts = (await visiblePosts()).filter((p) => !p.data.draft);
  const digests = allDigests().filter((d) => !d.draft);
  const urls: { loc: string; lastmod?: string }[] = [
    ...['/', '/about/', '/how-we-verify/', '/events/', '/submit/', '/corrections/', '/data/', '/privacy/', ...(digests.length ? ['/digest/'] : [])].map((p) => ({ loc: site + p })),
    ...TOPICS.filter((t) => posts.some((p) => t.match(p.data))).map((t) => ({ loc: `${site}/topics/${t.slug}/` })),
    ...posts.map((p) => ({ loc: `${site}/posts/${p.id}/`, lastmod: p.data.date.toISOString().slice(0, 10) })),
    ...digests.map((d) => ({ loc: `${site}/digest/${d.id}/`, lastmod: d.date.slice(0, 10) })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
