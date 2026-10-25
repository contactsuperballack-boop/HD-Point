type Digest = { id: string; title: string; date: string; draft: boolean; summary: string; html: string; posts: string[] };
const mods = import.meta.glob('./digests/*.json', { eager: true }) as Record<string, { default: Digest }>;

// Production shows only digests you have approved ("draft": false). `npm run dev` shows drafts too.
export function allDigests(): Digest[] {
  return Object.values(mods).map((m) => m.default).filter((d) => import.meta.env.DEV || !d.draft).sort((a, b) => b.date.localeCompare(a.date));
}
