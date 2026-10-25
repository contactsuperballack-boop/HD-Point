import type { APIContext } from 'astro';
export function GET(ctx: APIContext) {
  const site = (ctx.site?.href ?? '').replace(/\/$/, '');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
