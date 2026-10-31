import { getCollection } from 'astro:content';

// Production hides drafts. `npm run dev` shows them so you can review before publishing.
export async function visiblePosts() {
  const all = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// No article is listed on two pages: Latest shows posts marked home (the default),
// and a topic page shows that topic's posts that are not on Latest.
export const onLatest = (p: { data: { home: boolean } }) => p.data.home !== false;
export async function latestPosts() { return (await visiblePosts()).filter(onLatest); }
export async function topicPosts(slug: string) { return (await visiblePosts()).filter((p) => p.data.topic === slug && !onLatest(p)); }
