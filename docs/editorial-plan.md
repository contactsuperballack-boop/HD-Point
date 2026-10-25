# HD Point editorial plan: structure, topics and headlines

## 1. What the style guide and sample taught us
Four layouts, one set of habits.
- **Product and launch** (OpenAI-style): declarative title, one-sentence standfirst, a "Key takeaways" box of 3 or 4 bullets, why it matters, what it does, limits and safety, availability.
- **Landscape** (the sample article): takeaways box, the shift, pillars (one subheading per theme with a bullet per company), a table of markets, limits of the data, what comes next.
- **Research** (Anthropic-style): abstract box (question, finding, why it matters), background, method, results, limitations (required), what comes next.
- **News** (TechCrunch-style): a two-sentence lede, a key facts box, details, market context, what is next. Most important facts first.
- **Habits all four share:** short paragraphs, a heading every 200 to 300 words, the main point in the first two paragraphs, tables and charts instead of walls of text, a 150-character description, a social preview image, and one clear ending.

Where we differ on purpose: every sentence, bullet and table row carries a claim marker linking to a source; we never invent a number, quote, benchmark or call to action; a section with no sourced facts is left out; company statements are marked as such. Layouts live in `engine/styles.js`, so changing a layout is a text edit.

**The sample article cannot be published as written.** Most of its facts have no source, and some are wrong. I checked what I could:
- *Wrong or misleading:* "over 80% of regional AI venture activity" has no source. The closest real figure is 85% of all country-specific startup funding (all sectors, not AI) in January to September 2026, per Africa: The Big Deal. "Introducing..." and "Product & Ecosystem Drop" imply we launched something, and the "API Documentation" and "ecosystem hub" links do not exist.
- *Confirmed:* Botlhale AI (South Africa, speech tools for African languages), Amini (Kenya, satellite data for agriculture and climate), Aerobotics (South Africa, drones and computer vision for farms). The language count is supportable as "UNESCO estimates 1,500 to 3,000".
- *Could not confirm:* Bonisa AI, AwaDoc, Qonta, Vizi, Trackly, Docny, FA Julie, Cravit, and every description of them. Treat as leads, not facts.
- A corrected, fully sourced version is the first sample post (`samples/0-africa-landscape.json`).

## 2. Topic map
**Topics** (menu): AI, Innovation, Leisure, Lifestyle, Landscape, Models, Products, Startups, Skills, Research.
**Sectors** (menu): Voice and language, Agriculture and climate, Credit and fintech, Health, Infrastructure, Policy and data, Skills and talent. (A Funding sector tag exists but is not shown in the menu.)

| Pillar | What to cover | Best layout | Where stories come from |
|---|---|---|---|
| Voice and language | African-language speech, translation, WhatsApp and voice agents | launch, landscape | OpenAI, DeepMind, Hugging Face feeds; startup pages; company submissions |
| Agriculture and climate | Satellite and sensor data, crop vision, soil-free farming | launch, landscape | Smartel and similar pages; TechCabal, Disrupt Africa |
| Credit and fintech | Alternative credit scoring, fraud, payments | news, launch | TechCabal, Techpoint, Disrupt Africa |
| Health | Triage, clinic tools, health assistants | launch, news | Submissions; IT News Africa |
| Infrastructure | GPUs, data centres, edge devices, low bandwidth | news, landscape | IT News Africa; Microsoft AI news |
| Policy and data | Regulation, data sovereignty, public AI strategy | news, research | News feeds; official publications you add |
| Skills and talent | Academies, bootcamps, programmes | launch | BassiTech, Ignite Academy, Veltrum |
| Funding and hubs | Rounds, who funds what, Nigeria, Egypt, Kenya, South Africa and rising hubs | news, landscape | Africa: The Big Deal coverage, TechCabal |
| Innovation, leisure, lifestyle | Smart-city projects, places, culture | news, launch | Abuja City Walk and similar sources |

## 3. Headline rules
Active verb. Name the company or product. Use a number only if a claim supports it. Plain and declarative, no clickbait, no hype words. About 90 characters. The standfirst (one sentence, 150 characters or fewer) states the key fact.

## 4. Headline patterns by layout
Fill the brackets only with sourced facts. These are patterns, not stories.

**News**
- [Startup] raises $[amount] to [do what] in [country]
- [Startup] launches [product] for [audience] in [city]
- [Company] opens [facility] in [place], says it will [claim from the source]
- [Country] startups raised $[amount] in [period], [source] says

**Product and launch**
- [Company] launches [product] for [audience]
- [Lab] releases [model]: what it supports for African languages
- [Company] lists [number] products, from [A] to [B]
- [Programme] opens for [number] [people] in [place]

**Landscape**
- Africa's [sector] startups: where the funding sits and what is being built
- [Country]'s AI startups in [year]: who is building what
- Beyond the big four: [hubs] draw capital as [claim]
- Building for [language or channel]: the companies and the limits of the data

**Research**
- What [study or report] found about [topic] in African languages
- [Report]: [number] findings on [topic], and where they may not hold
- Inside [dataset or benchmark]: what it measures and what it leaves out

**Skills and how-to**
- How to [skill] with [tool]: a guide for [audience]
- [Number] free ways to learn [skill] in [country]

**Leisure and lifestyle**
- [Place] opens [attraction], and what the developer says is next
- Where [activity] is growing in [city], according to [source]
- [Project] lists [number] pillars for a mixed-use district in [city]

## 5. A working week (a starting point, adjust to your review time)
- 3 news posts (funding, launches, local news)
- 1 product or launch profile (a watched company page or a submission)
- 1 landscape piece, built from several sourced claims
- 1 skills guide or research write-up when a source supports it
- Friday: the weekly digest, read and approved by a person

## 6. Story ideas from your six sites
- Ignite: profile of an "SI-native" company, then a follow-up when its live site replaces the beta page.
- Veltrum: a profile of Afro AI, Accessum and GetElectric, and a Nigeria housing-security angle once sourced.
- BassiTech: the Digital Wings programme, with updates on participants and outcomes when published.
- Smartel: soil-free farming and the 90% water claim, with an independent expert source before it becomes a landscape piece.
- Chassis: waiting on readable page text (needs the browser-based watcher).
- Abuja City Walk: new blog posts as they appear (the current ones are months old).
