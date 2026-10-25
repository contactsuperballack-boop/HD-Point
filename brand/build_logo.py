#!/usr/bin/env python3
"""Generates the HD Point logo files (SVG + PNG) into public/brand/. Edit the numbers below and re-run:
    python3 brand/build_logo.py
Everything is drawn with shapes and strokes (no fonts), so it looks the same everywhere."""
import pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'brand'
OUT.mkdir(parents=True, exist_ok=True)

S = 14            # monogram stroke weight
W = 12            # "net" stroke weight
INK, INK_DARK = '#14213D', '#E8EBF5'
GRAD_LIGHT = ('#101A52', '#3A4FD6')    # deep indigo -> bright indigo
GRAD_DARK = ('#C4CEFF', '#7F8FFF')
NODE = '#F2B134'                       # the one warm accent

def mark_paths(fill, node=True, stroke_attr=None):
    """H and D share a stem. The crossbar carries a single 'node' dot: the network."""
    st = f'fill="none" stroke="{fill}" stroke-width="{S}" stroke-linecap="butt" stroke-linejoin="miter"'
    p = (f'<g {st}>'
         f'<path d="M10 0V100"/><path d="M54 0V100"/>'
         f'<path d="M66 7H66A43 43 0 0 1 66 93H54M54 7H66"/></g>')
    p += f'<path d="M10 50H54" fill="none" stroke="{fill}" stroke-width="{S}"/>'
    if node: p += f'<circle cx="32" cy="50" r="5.4" fill="{NODE}"/>'
    return p

def point_paths(color, x0):
    """The wordmark 'point', drawn with strokes. The warm dot on the monogram's crossbar is the 'point'."""
    st = f'fill="none" stroke="{color}" stroke-width="{W}" stroke-linecap="butt" stroke-linejoin="round"'
    pl = '<path d="M5.5 43V124"/><circle cx="28.5" cy="71" r="23"/>'
    o = '<circle cx="28.5" cy="71" r="23"/>'
    i = f'<path d="M5.5 43V100"/><circle cx="5.5" cy="22" r="7.5" fill="{color}" stroke="none"/>'
    n = '<path d="M5.5 43V100"/><path d="M5.5 71C5.5 56 14 48.5 28 48.5C42.5 48.5 50.5 56 50.5 71V100"/>'
    t = '<path d="M20 29V82C20 92 25 94.5 34 94.5H42"/><path d="M5 48.5H36"/>'
    return (f'<g {st}>' + ''.join(f'<g transform="translate({x0+dx} 0)">{g}</g>' for dx, g in ((0, pl), (71, o), (142, i), (168, n), (238, t))) + '</g>')


def lockup(grad, ink, uid):
    a, b = grad
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 416 126" role="img" aria-label="HD Point">'
            f'<defs><linearGradient id="g{uid}" x1="0" y1="0" x2="116" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>'
            f'{mark_paths(f"url(#g{uid})")}{point_paths(ink, 134)}</svg>')

def mark_only(grad, uid, vb='0 0 116 100'):
    a, b = grad
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="HD Point">'
            f'<defs><linearGradient id="g{uid}" x1="0" y1="0" x2="116" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>'
            f'{mark_paths(f"url(#g{uid})")}</svg>')

def icon(size=512, radius=0.22):
    r = int(size * radius); m = size * 0.62; sc = m / 116; ox = (size - 116 * sc) / 2; oy = (size - 100 * sc) / 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img" aria-label="HD Point">'
            f'<defs><linearGradient id="bg" x1="0" y1="0" x2="{size}" y2="{size}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#141E5A"/><stop offset="1" stop-color="#2F43C2"/></linearGradient></defs>'
            f'<rect width="{size}" height="{size}" rx="{r}" fill="url(#bg)"/>'
            f'<g transform="translate({ox:.1f} {oy:.1f}) scale({sc:.4f})">{mark_paths("#FFFFFF")}</g></svg>')

files = {
    'logo.svg': lockup(GRAD_LIGHT, INK, 'a'),
    'logo-dark.svg': lockup(GRAD_DARK, INK_DARK, 'b'),
    'logo-mono.svg': ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 416 126" role="img" aria-label="HD Point">'
                      + mark_paths('currentColor', node=False) + point_paths('currentColor', 134) + '</svg>'),
    'mark.svg': mark_only(GRAD_LIGHT, 'c'),
    'mark-dark.svg': mark_only(GRAD_DARK, 'd'),
    'icon.svg': icon(),
}
for name, svg in files.items(): (OUT / name).write_text(svg, encoding='utf-8')
(OUT.parent / 'favicon.svg').write_text(icon(64, 0.22), encoding='utf-8')
print('wrote', ', '.join(files), '+ favicon.svg')


def render_pngs():
    """PNG versions for places that cannot use SVG (social profiles, link previews, iOS)."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('PNG export skipped: pip install playwright && playwright install chromium'); return
    sized = lambda svg, w, h: svg.replace('<svg ', f'<svg width="{w}" height="{h}" ', 1)
    with sync_playwright() as p:
        b = p.chromium.launch()
        def shot(html, w, h, name, transparent=False):
            pg = b.new_page(viewport={'width': w, 'height': h}); pg.set_content(f'<body style="margin:0;background:transparent">{html}')
            pg.screenshot(path=str(OUT / name), omit_background=transparent); pg.close()
        shot(sized(files['logo.svg'], 1600, 485), 1600, 485, 'logo.png', True)
        shot(sized(files['logo-dark.svg'], 1600, 485), 1600, 485, 'logo-dark.png', True)
        shot(sized(files['icon.svg'], 512, 512), 512, 512, 'icon-512.png', True)
        shot(sized(icon(180, 0), 180, 180), 180, 180, 'apple-touch-icon.png')           # iOS rounds the corners itself
        shot(sized(icon(1080, 0), 1080, 1080), 1080, 1080, 'avatar-1080.png')           # square avatar for social profiles
        og = (f'<div style="width:1200px;height:630px;display:flex;align-items:center;justify-content:center;'
              f'background:linear-gradient(135deg,#0B1230 0%,#1B2A6B 100%)">{sized(files["logo-dark.svg"], 660, 200)}</div>')
        shot(og, 1200, 630, 'og-default.png')
        b.close()
    print('wrote PNGs: logo, logo-dark, icon-512, apple-touch-icon, avatar-1080, og-default')


if __name__ == '__main__':
    render_pngs()
