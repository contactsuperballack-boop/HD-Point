// The five topics. Every article has exactly one, so it appears on exactly one topic page.
export const TOPICS = [
  { slug: 'ai', label: 'AI', blurb: 'AI products, models and the people building them across Africa.' },
  { slug: 'innovation', label: 'Innovation', blurb: 'New ideas, technology and smart solutions from Nigeria and across Africa.' },
  { slug: 'climate', label: 'Climate', blurb: 'Climate, resilience and the food systems under pressure.' },
  { slug: 'lifestyle', label: 'Lifestyle', blurb: 'Culture, creativity and the way we live and spend our time.' },
  { slug: 'startups', label: 'Startups', blurb: 'The founders, funding and companies shaping African tech.' },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];
export const topicLabel = (slug: string) => TOPICS.find((t) => t.slug === slug)?.label ?? slug;
