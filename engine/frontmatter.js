import fs from 'node:fs';
import path from 'node:path';

// Minimal reader for the front matter that publish.js writes (flat key: value lines).
export function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const d = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':'); if (i < 1) continue;
    const k = line.slice(0, i).trim(); let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) { try { v = JSON.parse(v); } catch { v = v.slice(1, -1); } }
    else if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
    else if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    d[k] = v;
  }
  return d;
}

export function loadPosts(dir = 'src/content/posts') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => ({ slug: f.slice(0, -3), ...parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8')) }));
}
