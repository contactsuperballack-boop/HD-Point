# HD Point (blog engine)

Lane: AI products, model launches, skills, AI-native startups. Nigeria and Africa first.

## Layout
- `engine/`  pipeline (sources, fact sheet, assets, deck, QA, publish)
- `src/`     Astro site (reads `src/content/posts/*.md`)
- `public/assets/<slug>/`  hero.svg, chart.svg, deck.html per post
- `inbox/`   startup submissions (JSON)
- `.github/workflows/`  blog.yml (daily generator) and deploy.yml (GitHub Pages)

## Local
    npm install              # creates package-lock.json: commit it
    npm run blog:mock        # offline test using inbox/example.json
    npm run dev              # preview site; drafts are visible in dev only
    ANTHROPIC_API_KEY=... npm run blog   # real run

## autoPublish (config.json)
- false: posts saved with `draft: true`, hidden from the built site, listed in review-queue.json
- true : posts that pass QA go live; failures stay drafts

## Review flow
Bot commits drafts, opens an issue listing them. You read each in `npm run dev`, set `draft: false`, push. Deploy runs on push.

## GitHub setup (once)
1. Repo > Settings > Secrets > Actions: add ANTHROPIC_API_KEY
2. Settings > Pages > Source: GitHub Actions
3. Set `site` in astro.config.mjs; use a custom domain (asset links are absolute: /assets/...)
4. Actions > Generate posts > Run workflow, to test

## Slide decks
`engine/deck.js` builds a self-contained HTML deck from the fact sheet (title, key figure, claim slides with Verified / Company says marks, chart, sources). Used when a post has 4+ claims. Embedded in the post and openable full screen.

## Infographic and report
- `engine/infographic.js`: portrait SVG (1080 wide) with title, key figure, claims marked Verified / Company says, figures and legend. Good for sharing; convert to PNG for platforms that need it.
- `engine/report.js`: A4 print-ready HTML (key figures, claims, chart, sourcing table, method note). The page has a "Print or save as PDF" button.
- `engine/selector.js` keeps at most `maxExtraAssets` (default 3) formats per post, in priority order per story type. Infographic needs 3+ claims; report needs 5+; deck needs 4+.

## Startup submission form
Page: `/submit/` (src/pages/submit.astro). It posts to a small Cloudflare Worker (`worker/submit.js`), which validates the entry and saves it to `inbox/submissions/<id>.json` in your repo. The next scheduled run turns it into a fact sheet and a draft post.

Rules built in:
- Every fact needs a source link, and any figure must also appear in the fact's text.
- Submitted facts are always "Company says". They are never marked Verified automatically.
- Submissions are always labelled sponsored/featured and never auto-published (`autoPublishSponsored: false`). A human reviews each one.
- Markup characters are stripped, only http(s) links are accepted, and embeds are limited to YouTube, X, LinkedIn, Vimeo, Instagram, Facebook and TikTok.
- The contact email is never written to the repo. It goes to an optional Cloudflare KV store (`CONTACTS`). Without KV the email is dropped, so bind one.
- Bad submissions move to `inbox/rejected/` with a reason, handled ones to `inbox/processed/`.

Setup:
1. Create a fine-grained GitHub token limited to this repo with "Contents: Read and write".
2. In `worker/`: edit `wrangler.toml`, run `wrangler secret put GITHUB_TOKEN`, then `wrangler deploy`.
3. In the repo: Settings > Variables > Actions, add `PUBLIC_SUBMIT_URL` = your worker URL. Redeploy the site.
4. Strongly recommended: use a private repo (submissions are committed as files, so a public repo shows them before review) and add Cloudflare Turnstile or rate limiting against spam.

## PNG and PDF export
`engine/export.py` (Python + Playwright) renders `infographic.svg` to `infographic.png` and `report.html` to `report.pdf`, then swaps the download placeholders in each post for real links. The GitHub schedule runs it before committing. If export fails the post still publishes, just without download links.
Local: `pip install playwright && playwright install chromium && npm run export`

## Testing without keys
`npm run blog:mock` reads `inbox/examples/` only. Real runs read `inbox/` and `inbox/submissions/`.

## Blog name
Set `siteName` in `config.json`. The site header, hero cards, infographics, reports and decks all read it from there.

## Pages and sections
- `/about/` and `/how-we-verify/` are written from how the pipeline actually works. Numbers (minimum sources, story age) and the "who reviews" sentence read from `config.json`, so they stay true if you change settings.
- The section menu (Models, Products, Startups, Funding, Skills, Research, Local news, Nigeria, Featured) is built from your posts. A section appears only once it has a published post. Edit `src/data/topics.ts` to change sections.
- Set `contactEmail` in `config.json` before launch. The About page promises corrections and needs a way for readers to reach you; the Contact link in the footer shows only when it is set.
- Read both pages before launch. They make commitments on your behalf (for example, "we note the correction at the top of the post"). Edit anything you will not keep.

## Site features
- Home: a lead story plus a card grid with hero images, reading time, a visible sourcing summary on every card, and search (shown once there are more than 3 posts).
- Light and dark themes follow the reader's system setting.
- Post pages: sourcing legend, share button (native share sheet on phones, copy link elsewhere), social preview image (hero.png from `engine/export.py`) and RSS at `/rss.xml`. Sponsored posts are marked "[Sponsored]" in the feed.
- Accessibility: skip link, visible focus, text labels as well as shapes on the sourcing squares, form errors that link to their fields.
- Set `site` in `astro.config.mjs` to your real domain, or RSS links and social previews will point at example.com.
- Not included yet: sitemap, newsletter signup, comments.

## Header menu and events
- The header has dropdowns: **Topics** (Models, Products, Startups, Skills, Research), **News** (Latest, Local news, Nigeria), **Events**, and **More** (Featured, About, How we verify, Submit a startup, RSS, Contact). Items appear only once they have posts. Edit groups in `src/data/topics.ts`.
- Funding is not in the menu. Its page still exists at `/topics/funding/`; give it `group: 'topics'` or `'news'` in `topics.ts` to bring it back.
- On phones the menu opens from a Menu button. Without JavaScript every group stays expanded.
- Events: add entries to `src/data/events.json`, for example `{ "title": "Event name", "date": "2026-11-12", "city": "Lagos", "country": "Nigeria", "url": "https://...", "format": "In person" }`. Past events drop off after the next scheduled rebuild. The page shows "No upcoming events listed yet" until you add some.

# Update: feeds, digest, social, analytics, spam, auto-publish gate, corrections, data

## Feeds (config.json > feeds)
Each feed is `{ name, url, filter }`. `filter: "lane"` keeps only AI/Africa stories (whole-word match on `lane`); `"none"` keeps everything (AI lab blogs). RSS and Atom both work. `maxPerFeed` caps items per feed, and runs interleave feeds so one source cannot take every slot.
Checked working at the time of writing: TechCabal, Disrupt Africa, IT News Africa, OpenAI, Google DeepMind, Hugging Face, Microsoft AI news. Not confirmed: Techpoint Africa. No public RSS found for Anthropic or Meta AI. Test any feed before relying on it.
Posts from other outlets are rewritten from facts and link back to the original. Never copy their sentences.

## Settings to fill in (config.json)
`siteUrl` (for example https://your-domain.com, no trailing slash) is needed for RSS, sitemap, canonical links, social previews, the digest and social posting. `contactEmail` and `social.profiles` appear in the footer.
GitHub > Settings > Variables (public, used at build): PUBLIC_SUBMIT_URL, PUBLIC_TURNSTILE_SITEKEY, PUBLIC_NEWSLETTER_URL, PUBLIC_NEWSLETTER_FIELD (default `email`), PUBLIC_ANALYTICS_SRC, PUBLIC_ANALYTICS_ID.
GitHub > Settings > Secrets: ANTHROPIC_API_KEY, SOCIAL_WEBHOOK_URL (optional).
Anything left empty simply switches that feature off. Nothing shows as a dead box.

## Weekly digest
`engine/digest.js` runs every Friday (digest.yml). It writes `src/data/digests/weekly-DATE.json` as a draft from posts already published in the last 7 days. It adds no new claims and uses no AI. You read it, set `"draft": false`, push. It then appears at /digest/ and in /digest.xml (full HTML). Point your email provider's RSS-to-email at /digest.xml, and put the provider's form address in PUBLIC_NEWSLETTER_URL for the signup boxes. Turn on double opt-in at the provider.

## Social posting
`engine/social.js` runs after each scheduled run. For published posts from the last 3 days it writes captions to `social/<slug>.txt` (X, LinkedIn, WhatsApp, Facebook, Instagram, with UTM links and a "Sponsored:" label where it applies). If SOCIAL_WEBHOOK_URL is set it also sends one JSON message per platform to that webhook (Zapier, Make, Buffer). Drafts are never posted. A failed send is retried next run.
Handles: X usernames cannot contain a period, so a handle with a period cannot be your X handle. Leave `x` and `linkedin` in `social.profiles` empty until you have them.

## Analytics
Set PUBLIC_ANALYTICS_SRC and PUBLIC_ANALYTICS_ID for a Plausible- or Umami-style script. Events sent: Share, Search, Newsletter signup, Submission sent, Outbound source click. The privacy page changes with what is switched on. It is a plain-language draft: have someone qualified review it against Nigerian data protection rules before launch.

## Submission form spam protection
The worker checks origin, a hidden trap field, a per-IP limit of 5 an hour (needs the LIMITS KV), and Cloudflare Turnstile (needs TURNSTILE_SECRET on the worker and PUBLIC_TURNSTILE_SITEKEY on the site). See worker/wrangler.toml.

## Earning auto-publish
`autoPublish` is only the master switch. A post goes live only if it passes QA, is not sponsored, its type is listed in `autoPublishTypes`, and that type has at least `autoPublishGate.minReviewed` human-reviewed posts in the window with a correction rate under `maxCorrectionRate`. Run `node engine/gate.js` to see progress per type. Auto-published posts carry `autoPublished: true` and never count as reviewed.

## Corrections and data
`node engine/correct.js <post-slug> "what was wrong and what is right"` adds a note at the top of that post and an entry on /corrections/, and counts against the gate.
Each post saves its claims to `src/data/claims/<slug>.json`. /data/ lists published posts, and /data/posts.json and /data/claims.json are downloadable. Drafts are never included. Decide on a licence for the data before promoting it.

# Update: HD Point, logo, topics and watched company pages

## Name and logo
The blog is now **HD Point** (`siteName` in config.json). Social handles are not set yet: fill `social.profiles` in config.json once the accounts exist (empty entries are not shown).
Logo files are in `public/brand/` (and `public/favicon.svg`): `logo.svg` / `logo-dark.svg` (horizontal lockup), `logo-mono.svg` (one colour, uses currentColor), `mark.svg` / `mark-dark.svg` (HD monogram), `icon.svg`, plus PNGs: `icon-512.png`, `apple-touch-icon.png`, `avatar-1080.png` (social profile picture), `og-default.png` (link preview card). The site header switches to the dark logo in dark mode. Regenerate after editing colours or shapes in `brand/build_logo.py`: `npm run logo`.
The mark: H and D share one stem, and the single warm dot on the crossbar is the "point". The wordmark "point" is drawn with strokes, so it needs no font.

## Topics
Posts carry up to two topic tags: AI, Innovation, Leisure, Lifestyle (`topics` in config.json). They become sections in the Topics menu. The extraction step picks them, the submission form has a Topic field, and watched pages carry hints.

## Watched company pages (engine/watch.py)
For sites with no feed, list them in `config.json > watch`. `type: "page"`: the first sighting becomes a company profile, and later only a large change becomes an update. `type: "index"`: a blog index, where every new article link becomes a candidate (articles with an old date are skipped). Pages are rendered in a browser, so JavaScript sites work.
Posts from watched pages are always "company says" (never Verified) and carry a note that they come from the company's own materials. If you have a business relationship with a company you feature, label it as featured/sponsored.
Currently watched: Ignite, Veltrum Technologies, BassiTech Solutions, Smartel Agritech, Chassis (The Data Vessel), and the Abuja City Walk blog.

## Sample posts
`samples/` holds hand-written fact sheets from the company pages we read (Ignite, Veltrum, BassiTech, Smartel, Abuja City Walk). `npm run samples` rebuilds them as DRAFT posts through the normal checks. `npm run dev` shows them with a Draft tag. Delete the generated files in `src/content/posts`, `public/assets` and `src/data/claims` before your first real run, or they will sit beside real posts. Chassis is not included: its page showed no readable text without a browser, so I had nothing to write from.

# Update: writing styles, sectors and the editorial plan
- `engine/styles.js` holds four layouts (launch, landscape, research, news) chosen by story type, plus the evidence rules the model must follow. The draft step returns a standfirst (sub-headline) and a body; the standfirst becomes the page description (150 characters or fewer).
- New story type `ecosystem` for market and landscape pieces. New `sectors` tags (voice-language, food-systems, credit-fintech, health, infrastructure, policy-data, skills, funding) drive the Sectors menu.
- QA now checks every bullet and table row for a citation, checks numbers in the title, standfirst, body and tables, and adds reviewer warnings (long sections, long standfirst, no standfirst). Warnings appear in `review-queue.json`.
- Tables and takeaway boxes are styled. `docs/editorial-plan.md` has the topic map, headline rules and patterns, a weekly rhythm, and notes on which facts in the sample article could and could not be confirmed.
- The first sample post (`samples/0-africa-landscape.json`) is a sourced rewrite of the sample article. The other five samples are rewritten in the new layouts.

## Climate and food systems
The Topics menu has a Climate page. It lists posts tagged `climate` and every post in the Food systems sector (farming, food security, supply chains). New tags: topic `climate`, sector `food-systems` (replaces the old agri-climate tag). The submission form has a Climate option.

# Update: HD Point look, homepage and the first five articles
- **Design:** dark slate with brushed-steel type and one chrome point, following the supplied mood images and video. Barlow Condensed for headings and navigation, Inter for text. Light mode follows the reader's system setting. Tokens are at the top of `src/styles/global.css`. Hero text is set in `config.json > hero` and `tagline`.
- **Media:** `public/brand/mood.webp` and `mood.jpg` (hero and video poster), `hd-point-intro.mp4` (plays only when the reader presses "Watch the intro", never automatically), and `og-default.png` (link-preview card, cropped from the mood image by `brand/build_logo.py`).
- **Logo:** same monogram, now graphite and silver, with the dot drawn as a chrome sphere.
- **Homepage:** a hero, topic pills, then Latest: the lead story plus the next posts. A post with `home: false` in its front matter stays off Latest and appears only on its topic pages. Ignite, Veltrum, BassiTech, Smartel and Abuja City Walk are set this way.
- **Topics:** Startups is now a tag (`startups`), not a story type. Ignite and Veltrum are tagged Startups; BassiTech and Smartel are tagged Innovation (Smartel also appears under Climate through the Food systems sector).
- **The five Latest posts** (`samples/0*.json`): the landscape piece and four new articles in the same format: Dubai's Create AI Agents Championship, Nigeria's N-ATLAS language model, Nigeria's National AI Strategy, and AI on African farms. Every claim has a source link; claims made by the organiser or company are marked as such. Replace or delete the samples before your first real run.

# Update: one article, one page; Tailwind layout
- **Topics:** exactly five (AI, Innovation, Climate, Lifestyle, Startups). Every article has one `topic` in its front matter. Sector, landscape, model, product and featured listing pages are gone, so nothing is listed twice.
- **Where an article appears:** Latest shows posts that are not marked `home: false`. A topic page shows that topic's posts that are `home: false`. A topic page tells the reader when more stories on that topic are featured in Latest.
- **Cards:** each post gets a calm thumbnail (`thumb.svg`: one key figure or the topic, plus the brand) instead of repeating the headline. The headline version (`hero.svg` / `hero.png`) is used only as the link-preview image.
- **Tailwind CSS v4:** the layout (header, hero, cards, grids, footer, topic pages) is written with Tailwind utility classes. `src/styles/global.css` imports Tailwind's theme and utilities (not its base reset), maps our colour tokens to utilities (`bg-surface`, `text-muted`, `border-rule`, `font-head`) and keeps a small component layer for the dropdown menu, article text, forms and tables. Run `npm install` to fetch `tailwindcss` and `@tailwindcss/vite` (Node 20 or newer).
- **New articles:** Cassava's AI Factory (AI), Google's flood forecasting in Nigeria (Climate), AI in Nollywood (Lifestyle) and Talent Nation's pre-seed round (Startups). They sit on their topic pages, not on Latest.
