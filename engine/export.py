#!/usr/bin/env python3
"""Render infographic.svg -> infographic.png and report.html -> report.pdf,
then replace the download placeholders in each post. Safe to re-run.

Setup:  pip install playwright && playwright install chromium
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS, POSTS = ROOT / 'public' / 'assets', ROOT / 'src' / 'content' / 'posts'
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&display=swap">'


def patch(slug, marker, link):
    post = POSTS / f'{slug}.md'
    if post.exists():
        t = post.read_text(encoding='utf-8')
        if marker in t:
            post.write_text(t.replace(marker, link), encoding='utf-8')


def main():
    done, failed = 0, 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1080, 'height': 1000})
        for d in sorted(x for x in ASSETS.iterdir() if x.is_dir()):
            slug = d.name
            svg, png, rep, pdf = d / 'infographic.svg', d / 'infographic.png', d / 'report.html', d / 'report.pdf'
            try:
                hsvg, hpng = d / 'hero.svg', d / 'hero.png'
                if hsvg.exists() and not hpng.exists():
                    page.set_viewport_size({'width': 1200, 'height': 630})
                    page.set_content(f'<!doctype html><meta charset="utf-8"><body style="margin:0">{hsvg.read_text(encoding="utf-8")}', wait_until='load', timeout=20000)
                    page.locator('svg').first.screenshot(path=str(hpng))
                    page.set_viewport_size({'width': 1080, 'height': 1000})
                    done += 1
                if svg.exists() and not png.exists():
                    page.set_content(f'<!doctype html><meta charset="utf-8">{FONTS}<body style="margin:0">{svg.read_text(encoding="utf-8")}', wait_until='load', timeout=20000)
                    try:
                        page.wait_for_function("document.fonts.status === 'loaded'", timeout=5000)
                    except Exception:
                        pass  # fall back to system fonts
                    page.locator('svg').first.screenshot(path=str(png))
                    done += 1
                if png.exists():
                    patch(slug, '<!--dl:infographic-->', f'· [Download PNG](/assets/{slug}/infographic.png)')
                if rep.exists() and not pdf.exists():
                    page.goto(rep.as_uri(), wait_until='load')
                    page.pdf(path=str(pdf), format='A4', print_background=True, prefer_css_page_size=True)
                    done += 1
                if pdf.exists():
                    patch(slug, '<!--dl:report-->', f'[Download the PDF](/assets/{slug}/report.pdf)')
            except Exception as e:  # one bad post must not block the rest
                failed += 1
                print(f'export failed for {slug}: {e}', file=sys.stderr)
        browser.close()
    print(f'exported {done} file(s), {failed} failure(s)')


if __name__ == '__main__':
    main()
