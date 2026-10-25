export type ClaimSet = { slug: string; title: string; type: string; region: string; date: string; sponsored: boolean; claims: { id: string; text: string; value?: number; unit?: string; label?: string; sourceUrl: string; basis: string }[] };
const mods = import.meta.glob('./claims/*.json', { eager: true }) as Record<string, { default: ClaimSet }>;
export const claimSets = (): ClaimSet[] => Object.values(mods).map((m) => m.default);
