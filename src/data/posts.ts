import { getCollection } from 'astro:content';

// Production hides drafts. `npm run dev` shows them so you can review before publishing.
export async function visiblePosts() {
  const all = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
