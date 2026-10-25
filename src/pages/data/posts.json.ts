import type { APIContext } from 'astro';
import { visiblePosts } from '../../data/posts';

// Published posts only. Drafts are never included.
export async function GET(ctx: APIContext) {
  const site = (ctx.site?.href ?? '').replace(/\/$/, '');
  const posts = (await visiblePosts()).filter((p) => !p.data.draft).map((p) => ({
    slug: p.id, url: `${site}/posts/${p.id}/`, title: p.data.title, type: p.data.type, region: p.data.region,
    date: p.data.date.toISOString(), sponsored: p.data.sponsored, verified_claims: p.data.verified, company_stated_claims: p.data.stated,
  }));
  return new Response(JSON.stringify(posts, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
