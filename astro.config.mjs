import { defineConfig } from 'astro/config';
import cfg from './config.json';

// Set "siteUrl" in config.json to your real address, e.g. "https://your-domain.com" (no trailing slash).
// RSS links, social preview images, the sitemap and canonical URLs all depend on it.
export default defineConfig({ site: cfg.siteUrl || 'https://example.com' });
