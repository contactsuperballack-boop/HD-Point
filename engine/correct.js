// Record a correction:  node engine/correct.js <post-slug> "What was wrong and what is now correct"
// The note appears at the top of the post and on /corrections/, and counts against auto-publishing in engine/gate.js.
import fs from 'node:fs';

const [slug, ...rest] = process.argv.slice(2);
const summary = rest.join(' ').replace(/[<>`]/g, ' ').replace(/\s+/g, ' ').trim();
if (!slug || !summary) { console.error('usage: node engine/correct.js <post-slug> "summary of the correction"'); process.exit(1); }
if (!fs.existsSync(`src/content/posts/${slug}.md`)) { console.error('No post with that slug: ' + slug); process.exit(1); }
const file = 'src/data/corrections.json';
const list = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
list.push({ date: new Date().toISOString().slice(0, 10), slug, summary });
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync(file, JSON.stringify(list, null, 2) + '\n');
console.log(`Recorded correction for ${slug}. Commit src/data/corrections.json to publish it.`);
