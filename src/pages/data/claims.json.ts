import type { APIContext } from 'astro';
import { visiblePosts } from '../../data/posts';
import { claimSets } from '../../data/claims';

// One row per claim of every published post, with its source link and basis ("verified" or "company-stated").
export async function GET(ctx: APIContext) {
  const site = (ctx.site?.href ?? '').replace(/\/$/, '');
  const published = new Set((await visiblePosts()).filter((p) => !p.data.draft).map((p) => p.id));
  const rows = claimSets().filter((s) => published.has(s.slug)).flatMap((s) => s.claims.map((c) => ({
    post: s.slug, post_url: `${site}/posts/${s.slug}/`, post_title: s.title, type: s.type, region: s.region, date: s.date, sponsored: s.sponsored,
    claim_id: c.id, claim: c.text, value: c.value ?? null, unit: c.unit ?? null, label: c.label ?? null, source_url: c.sourceUrl, basis: c.basis,
  })));
  return new Response(JSON.stringify(rows, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
