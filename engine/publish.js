import fs from 'node:fs';
import { barChart, heroCard, flashcardsMd, embedMd } from './assets.js';
import { deckHtml } from './deck.js';
import { infographic } from './infographic.js';
import { reportHtml } from './report.js';
import { autoPublishStatus } from './gate.js';
import { styleFor } from './styles.js';

export const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
export const POSTS_DIR = 'src/content/posts';
const q = s => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ');

export function publish(f, article, assetList, qa, cfg) {
  const slug = slugify(f.title), dir = `public/assets/${slug}`;
  fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(POSTS_DIR, { recursive: true });
  // autoPublish is only the master switch. A post goes live only if QA passed, it is not sponsored (unless allowed),
  // and its story type has earned auto-publishing (see engine/gate.js). Otherwise it stays a draft.
  const gate = cfg.autoPublish === true && qa.pass && (!f.sponsored || cfg.autoPublishSponsored === true)
    ? autoPublishStatus(f.storyType, cfg)
    : { ok: false, reason: cfg.autoPublish ? 'failed QA or is sponsored' : '' };
  const live = gate.ok;
  let body = '';
  const alt = ('Infographic summarising: ' + f.claims.slice(0, 3).map(c => c.text).join(' ')).replace(/[\[\]()]/g, '').replace(/\s+/g, ' ').slice(0, 300);
  if (f.selfReported) body += `> **From the company's own materials.** Claims marked "the company says" come from the company's website and were not independently verified.\n\n`;
  if (f.sponsored) body += `> **Sponsored / featured submission.** Claims marked "the company says" come from the company and were not independently verified.\n\n`;
  if (assetList.includes('hero')) { fs.writeFileSync(`${dir}/hero.svg`, heroCard(f)); body += `![${f.title}](/assets/${slug}/hero.svg)\n\n`; }
  body += article.replace(/\[(c\d+)\]/g, (_, id) => `[[${id}]](#src-${id})`) + '\n\n';
  if (assetList.includes('infographic')) {
    fs.writeFileSync(`${dir}/infographic.svg`, infographic(f));
    body += `![${alt}](/assets/${slug}/infographic.svg)\n\n[Open the infographic full size](/assets/${slug}/infographic.svg) <!--dl:infographic-->\n\n`;
  }
  if (assetList.includes('chart')) { fs.writeFileSync(`${dir}/chart.svg`, barChart(f)); body += `![Chart](/assets/${slug}/chart.svg)\n\n`; }
  if (assetList.includes('deck')) {
    fs.writeFileSync(`${dir}/deck.html`, deckHtml(f));
    body += `## Slide deck\n\n<iframe src="/assets/${slug}/deck.html" title="Slide deck: ${q(f.title)}" loading="lazy" style="width:100%;aspect-ratio:16/9;border:1px solid #C9CDE0"></iframe>\n\n[Open the deck full screen](/assets/${slug}/deck.html)\n\n`;
  }
  if (assetList.includes('report')) {
    fs.writeFileSync(`${dir}/report.html`, reportHtml(f));
    body += `## Full report\n\n[Open the report](/assets/${slug}/report.html). Use the button on that page to print or save it as a PDF. <!--dl:report-->\n\n`;
  }
  if (assetList.includes('embed')) body += embedMd(f) + '\n\n';
  if (assetList.includes('flashcards')) body += `## Flashcards\n${flashcardsMd(f)}\n\n`;
  body += `## Sources\n` + f.claims.map(c => `- <span id="src-${c.id}">[${c.id}]</span> ${c.basis === 'verified' ? 'Verified' : 'Company-stated'}: ${c.sourceUrl}`).join('\n') + '\n\n*AI-assisted. Every claim above is linked to a source.*\n';
  const verified = f.claims.filter(c => c.basis === 'verified').length;
  const read = Math.max(1, Math.round(article.trim().split(/\s+/).length / 200));
  const image = assetList.includes('hero') ? `image: "/assets/${slug}/hero.svg"\n` : '';
  const date = new Date().toISOString();
  const summary = f.dek || f.claims[0].text;
  const description = summary.length <= 155 ? summary : summary.slice(0, 154).replace(/\s+\S*$/, '') + '…';
  const fm = `---\ntitle: "${q(f.title)}"\nsummary: "${q(summary)}"\ndescription: "${q(description)}"\nstyle: ${styleFor(f.storyType)}\nsectors: [${(f.sectors || []).join(', ')}]\ndate: ${date}\ntype: ${f.storyType}\nregion: "${q(f.region || '')}"\nsponsored: ${!!f.sponsored}\ndraft: ${!live}\nverified: ${verified}\nstated: ${f.claims.length - verified}\ntopics: [${(f.topics || []).join(', ')}]\nassets: [${assetList.join(', ')}]\nread: ${read}\n${image}${live ? 'autoPublished: true\n' : ''}---\n\n`;
  fs.writeFileSync(`${POSTS_DIR}/${slug}.md`, fm + body);
  // Structured claims, one file per post: the source of the public dataset on /data/.
  fs.mkdirSync('src/data/claims', { recursive: true });
  fs.writeFileSync(`src/data/claims/${slug}.json`, JSON.stringify({ slug, title: f.title, type: f.storyType, topics: f.topics || [], region: f.region || '', date, sponsored: !!f.sponsored, sectors: f.sectors || [], claims: f.claims.map(({ id, text, value, unit, label, sourceUrl, basis }) => ({ id, text, value, unit, label, sourceUrl, basis })) }, null, 2) + '\n');
  if (!live) {
    const queue = fs.existsSync('review-queue.json') ? JSON.parse(fs.readFileSync('review-queue.json', 'utf8')) : [];
    queue.push({ slug, qaPass: qa.pass, fails: qa.fails, warnings: qa.warnings || [], at: new Date().toISOString() });
    fs.writeFileSync('review-queue.json', JSON.stringify(queue, null, 2));
  }
  return { slug, live, reason: gate.reason };
}
