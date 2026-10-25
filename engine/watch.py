#!/usr/bin/env python3
"""Reads company pages that have no RSS feed (config.json > watch), rendering JavaScript like a browser would,
and writes candidates to watch-cache/ for engine/run.js. State is kept in watch-state.json.

  type "page":  the first time a page is seen it becomes a company profile. Later it only produces
                an update if the page text has changed a lot (similarity below 85%).
  type "index": a blog or news index. Each new article link (matched by linkText, default "Read More")
                becomes a candidate, unless the article's own date is older than maxAgeDays (default 14).

Be polite: it reads only the pages you list, once per scheduled run. Only list sites you are happy to cover.
Setup:  pip install playwright && playwright install chromium
"""
import difflib, hashlib, json, pathlib, re, sys
from datetime import datetime, timezone
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / 'config.json').read_text(encoding='utf-8'))
STATE_F, OUT = ROOT / 'watch-state.json', ROOT / 'watch-cache'
UA = 'HDPoint-pagewatcher/1.0'
MONTHS = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
DATE_RE = re.compile(rf'\b({MONTHS})[a-z]*\.? (\d{{1,2}}),? (\d{{4}})\b')
now = lambda: datetime.now(timezone.utc)
clean = lambda t: re.sub(r'\s+', ' ', t or '').strip()


def read(page, url):
    try:
        page.goto(url, wait_until='networkidle', timeout=30000)
    except Exception:
        page.goto(url, wait_until='load', timeout=30000)
    page.wait_for_timeout(400)
    h1 = clean(page.locator('h1').first.inner_text()) if page.locator('h1').count() else ''
    title = clean(page.title()) or h1
    return title, clean(page.locator('body').inner_text())


def first_date(text):
    m = DATE_RE.search(text)
    if not m: return None
    try: return datetime.strptime(f'{m.group(1)} {m.group(2)} {m.group(3)}', '%b %d %Y').replace(tzinfo=timezone.utc)
    except ValueError: return None


def emit(w, url, title, text, kind, published):
    OUT.mkdir(exist_ok=True)
    key = hashlib.sha1((url + kind + text[:2000]).encode()).hexdigest()[:8]
    (OUT / f"{w['id']}-{key}.json").write_text(json.dumps({
        'id': w['id'], 'name': w['name'], 'url': url, 'title': title, 'text': text[:3500], 'kind': kind,
        'publishedAt': published.isoformat(), 'topics': w.get('topics', [])}, indent=2), encoding='utf-8')


def do_page(page, w, state):
    title, text = read(page, w['url'])
    if len(text) < 200:
        print(f"  {w['id']}: only {len(text)} readable characters, skipped"); return
    head, st = text[:4000], state.get(w['id'])
    if st is None:
        emit(w, w['url'], title, text, 'profile', now()); print(f"  {w['id']}: new profile")
    elif difflib.SequenceMatcher(None, st['head'], head).ratio() < 0.85:
        emit(w, w['url'], title, text, 'update', now()); print(f"  {w['id']}: page changed, update queued")
    else:
        print(f"  {w['id']}: no significant change"); return
    state[w['id']] = {'head': head, 'seenAt': now().isoformat()}


def do_index(page, w, state):
    page.goto(w['url'], wait_until='load', timeout=30000); page.wait_for_timeout(400)
    links = page.eval_on_selector_all('a[href]', 'els => els.map(e => [e.href, e.innerText])')
    pat, host, urls = re.compile(w.get('linkText', 'Read More'), re.I), urlparse(w['url']).netloc, []
    for href, label in links:
        if pat.search(label or '') and urlparse(href).netloc == host and href not in urls: urls.append(href)
    st = state.setdefault(w['id'], {'articles': []})
    limit, new = w.get('maxAgeDays', 14), 0
    for u in urls[:20]:
        if u in st['articles']: continue
        st['articles'].append(u)
        title, text = read(page, u)
        d = first_date(text)
        if d and (now() - d).days > limit:
            print(f"  {w['id']}: skipped old article ({d.date()}): {u}"); continue
        emit(w, u, title, text, 'article', d or now()); new += 1
    print(f"  {w['id']}: {len(urls)} article link(s), {new} new")


def main():
    entries = CFG.get('watch', [])
    if not entries: print('No pages in config.json > watch.'); return
    state = json.loads(STATE_F.read_text()) if STATE_F.exists() else {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_context(user_agent=UA).new_page()
        for w in entries:
            try:
                print(f"{w['name']}: {w['url']}")
                (do_index if w.get('type') == 'index' else do_page)(page, w, state)
            except Exception as e:
                print(f"  {w['id']}: failed - {e}", file=sys.stderr)
        browser.close()
    STATE_F.write_text(json.dumps(state, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
