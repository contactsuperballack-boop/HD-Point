import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    date: z.coerce.date(),
    type: z.string(),
    region: z.string().default(''),
    sponsored: z.boolean().default(false),
    draft: z.boolean().default(true),
    verified: z.number().default(0),
    stated: z.number().default(0),
    assets: z.array(z.string()).default([]),
    read: z.number().default(1),
    topics: z.array(z.string()).default([]),
    sectors: z.array(z.string()).default([]),
    description: z.string().optional(),
    style: z.string().optional(),
    image: z.string().optional(),
    autoPublished: z.boolean().default(false),
  }),
});

export const collections = { posts };
