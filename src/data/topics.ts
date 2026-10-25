import type { CollectionEntry } from 'astro:content';
type D = CollectionEntry<'posts'>['data'];

// Site sections. A section only appears in the menu once it has at least one published post.
// group decides which dropdown a section sits in. No group = not in the menu (page still exists).
export const TOPICS: { slug: string; label: string; blurb: string; group?: 'topics' | 'sectors' | 'news' | 'more'; match: (d: D) => boolean }[] = [
  { slug: 'ai', label: 'AI', blurb: 'AI products, models and the people building them.', group: 'topics', match: (d) => d.topics.includes('ai') },
  { slug: 'innovation', label: 'Innovation', blurb: 'New ideas, technology and smart solutions from across Africa.', group: 'topics', match: (d) => d.topics.includes('innovation') },
  { slug: 'leisure', label: 'Leisure', blurb: 'Leisure, travel, entertainment and places to go.', group: 'topics', match: (d) => d.topics.includes('leisure') },
  { slug: 'lifestyle', label: 'Lifestyle', blurb: 'Lifestyle, culture and the way we live.', group: 'topics', match: (d) => d.topics.includes('lifestyle') },
  { slug: 'landscape', label: 'Landscape', blurb: 'Overviews of markets, hubs and the companies building in them.', group: 'topics', match: (d) => d.type === 'ecosystem' },
  { slug: 'voice-language', label: 'Voice and language', blurb: 'Speech, translation and AI built for African languages.', group: 'sectors', match: (d) => d.sectors.includes('voice-language') },
  { slug: 'agri-climate', label: 'Agriculture and climate', blurb: 'Farming, satellites, sensors and climate intelligence.', group: 'sectors', match: (d) => d.sectors.includes('agri-climate') },
  { slug: 'credit-fintech', label: 'Credit and fintech', blurb: 'Credit scoring, payments and financial AI.', group: 'sectors', match: (d) => d.sectors.includes('credit-fintech') },
  { slug: 'health', label: 'Health', blurb: 'Health tools, assistants and clinics using AI.', group: 'sectors', match: (d) => d.sectors.includes('health') },
  { slug: 'infrastructure', label: 'Infrastructure', blurb: 'Compute, data centres, edge devices and connectivity.', group: 'sectors', match: (d) => d.sectors.includes('infrastructure') },
  { slug: 'policy-data', label: 'Policy and data', blurb: 'Regulation, data sovereignty and public policy.', group: 'sectors', match: (d) => d.sectors.includes('policy-data') },
  { slug: 'skills-talent', label: 'Skills and talent', blurb: 'Training, academies and the people behind the tools.', group: 'sectors', match: (d) => d.sectors.includes('skills') },
  { slug: 'models', label: 'Models', blurb: 'New AI models and model updates.', group: 'topics', match: (d) => d.type === 'model_launch' },
  { slug: 'products', label: 'Products', blurb: 'New AI products and tools.', group: 'topics', match: (d) => d.type === 'product_launch' },
  { slug: 'startups', label: 'Startups', blurb: 'AI-native startups and what they are building.', group: 'topics', match: (d) => d.type === 'startup_feature' },
  { slug: 'funding', label: 'Funding', blurb: 'Funding rounds for AI startups.', match: (d) => d.type === 'funding' },
  { slug: 'skills', label: 'Skills', blurb: 'Skills and training for working with AI.', group: 'topics', match: (d) => d.type === 'skills_guide' },
  { slug: 'research', label: 'Research', blurb: 'AI research, explained with its sources.', group: 'topics', match: (d) => d.type === 'research' },
  { slug: 'local-news', label: 'Local news', blurb: 'Emerging AI and startup news from across Africa.', group: 'news', match: (d) => d.type === 'local_news' },
  { slug: 'nigeria', label: 'Nigeria', blurb: 'AI news and startups from Nigeria.', group: 'news', match: (d) => d.region.toLowerCase() === 'nigeria' },
  { slug: 'featured', label: 'Featured', blurb: 'Posts submitted by the companies themselves. Each one is labelled.', group: 'more', match: (d) => d.sponsored },
];
