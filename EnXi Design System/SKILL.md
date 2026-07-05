---
name: enxi-design
description: Use this skill to generate well-branded interfaces and assets for EnXi (enterprise ERP), either for production or throwaway prototypes/mocks/slides/landing pages. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Substrate is warm bone `#FBF9F4`** everywhere — the single most recognizable brand decision. Never cool gray.
- **Text is graphite `#1A1A1A`**, never pure black.
- **Cinnabar `#B4442C`** marks the single most important thing on any surface. One thing. Never two.
- **Typography:** Inter (UI + marketing display), JetBrains Mono (every numeral), Source Serif 4 (long-form), DM Serif Display (one hero per page, website only). See `colors_and_type.css`. These are substitutes for Söhne / Söhne Mono / Tiempos / GT Sectra — flag if the real fonts are needed.
- **Hairlines, not shadows.** 1px `#D8D4CA` for every divider. Cards have 1px borders and 12px radii, no shadow.
- **The Tick** — 6-line ruler mark — is the wordless brand signature. See `assets/enxi-tick-mark.svg`.
- **Voice is declarative, specific, named, dated.** Lead with numbers. No "transform," "unlock," "seamless," "supercharge." Every claim is dated and sourced.
- **Density is a form of respect.** 14px product body. Tabular mono numerals in all data.
- **No pie charts, no gradients, no glass-morphism, no hero videos, no blob illustrations, no emoji in B2B body copy.**

## Files

- `README.md` — the full system (context, content, visual foundations, iconography, index)
- `colors_and_type.css` — tokens and semantic CSS (drop-in)
- `preview/` — design-system preview cards (swatches, type, components)
- `assets/` — wordmark, Tick mark, tick divider
- `ui_kits/product/` — ERP: dashboard, PO, variance analysis
- `ui_kits/marketing/` — website: homepage, case study, "Not good for"
- `slides/` — three master slides (Title / Claim / Section) + deck
- `source/` — the original brand + design spec (`BRAND_SYSTEM.md`, `DESIGN_SYSTEM.md`)

## Rules when designing

1. Check `colors_and_type.css` first — import it, don't reinvent tokens.
2. Reach for existing components in `ui_kits/` before authoring new ones. Copy the JSX out.
3. If you need an icon, use Lucide at 1.25px stroke (CDN). Flag the substitution.
4. If the design calls for a logo, remember: **typography is the logo**. The wordmark is for chrome; the Tick is for physical/scaled contexts.
5. Every claim you write in marketing copy must have a name and a date. No exceptions.
6. If you're adding a second accent mark, a second modal, or a second hero font on a page — stop. The system forbids it.
