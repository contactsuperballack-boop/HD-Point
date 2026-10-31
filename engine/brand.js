import fs from 'node:fs';
// Blog name lives in config.json ("siteName") so it is changed in one place.
export const SITE_NAME = JSON.parse(fs.readFileSync('config.json', 'utf8')).siteName ?? 'HD Point';

export const TOPIC_LABEL = { ai: 'AI', innovation: 'Innovation', climate: 'Climate', lifestyle: 'Lifestyle', startups: 'Startups' };
export const TYPE_LABEL = { model_launch: 'Model launch', product_launch: 'Product launch', startup_feature: 'Startup feature', funding: 'Funding', skills_guide: 'Skills guide', local_news: 'Local news', research: 'Research', ecosystem: 'Landscape' };

// The HD Point monogram (same geometry as brand/build_logo.py), for use inside generated SVGs.
// 116 x 100 units. `h` is the height you want it drawn at.
export const markSvg = (x, y, h, color, node = '#C7CFDD') =>
  `<g transform="translate(${x} ${y}) scale(${h / 100})"><g fill="none" stroke="${color}" stroke-width="14"><path d="M10 0V100"/><path d="M54 0V100"/><path d="M54 7H66A43 43 0 0 1 66 93H54"/><path d="M10 50H54"/></g><circle cx="32" cy="50" r="5.4" fill="${node}"/></g>`;
