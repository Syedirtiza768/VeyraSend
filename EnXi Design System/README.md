# EnXi Design System

> **One instrument. One voice. No seams.**
> A unified design system for EnXi — Enterprise Resource Planning (ERP) for mid-market manufacturing, distribution, and project-based services ($50M–$2B revenue).

---

## 1. Context

EnXi is an ERP for **operators who have run one before** — survivors of SAP, Oracle, and NetSuite migrations who live in the product 4–7 hours a day. The brand speaks to three audiences at once:

| Audience | Who | What they need |
|---|---|---|
| **Operator** | Plant managers, procurement leads, finance controllers, FP&A analysts | Time-to-answer. Keyboard-fluent UI that gets out of the way. |
| **Buyer** | CFOs, COOs, CIOs signing a 5-year, 7-figure contract | Proof, not pitch. Respect, not marketing theatre. |
| **Champion** | VP Finance, Director of Operations | A product that makes them look *correct*, not *cool*. |

**Brand personality:** *Composed. Instrumented. Quietly confident.* The register of a senior operations leader — not a founder, not a marketer.

**Design philosophy:** **Operational Calm** — the designed absence of everything enterprise buyers and operators have learned to distrust. The substrate is warm; the content is cold. The UI never out-talks the data. Proof over promise. Density is a form of respect.

**Surfaces governed:**
- **Product** — web-first desktop-primary ERP; narrow mobile for approvals/lookups
- **Marketing website** — long-form editorial, case studies, landing pages
- **Sales material** — pitch decks, one-pagers, proposals
- **Social** — LinkedIn primary, YouTube secondary *(we do not use Instagram, TikTok, or X)*
- **Print** — quarterly publication mailed to top-500 accounts

---

## 2. Sources

This system is derived entirely from the written brand specification:

- **`source/BRAND_SYSTEM.md`** — Unified brand/design spec for product + marketing + sales + social (668 lines).
- **`source/DESIGN_SYSTEM.md`** — Deep product-side spec (493 lines).

Both files were attached via a local mounted folder (`EnXi-Design-system/`) and copied into `source/` for reference. No Figma, no codebase, no screenshots were provided — the system was realized from specification alone. Everything in this repository is a faithful rendering of those two documents.

---

## 3. Content Fundamentals

EnXi's voice is **declarative, specific, named, dated**. It's closer to the *Financial Times* than to a SaaS landing page.

### Principles

- **Proof over promise.** Never "transform your business." Instead: *"Kraus-Maffei closed their books in 4 days, down from 17."* Every claim is dated, named, and sourced.
- **Specifics beat adjectives.** Numbers, vendor codes, dated timestamps. Lists of named sources. No "seamlessly," "supercharge," "unlock," "leverage," "empower."
- **Reporter first, marketer never.** Lead with the number. The cadence of a *Bloomberg* or *FT Alphaville* short.
- **Signed by humans.** Posts, changelog entries, and analyst notes carry a real named author. The corporate handle is a masthead, not a persona.

### Voice by surface

| Surface | Voice | Example |
|---|---|---|
| **Product UI** | Functional. Terse labels. Declarative errors. | `"Vendor code V-4471 is locked for new POs — it has an unresolved dispute (DR-882). Clear the dispute to proceed."` |
| **Website body** | Editorial. Full sentences. Named sources. | `"Kraus-Maffei's March books closed on April 4th, 2026."` |
| **Website hero** | A single stated fact, not a slogan. | `"Close the books in 4 days, not 17."` |
| **Sales deck** | Consultative. Written to be read aloud by a champion, not a rep. | *"III. Close cycle impact."* |
| **Social** | Reporter-like. Lead with the number. | `"9.4 days. Median mid-market manufacturer's close cycle. Top quartile: 4.1."` |

### Mechanics

- **Casing:** Sentence case everywhere. Title Case is reserved for nav items, product module names, and proper nouns. No ALL-CAPS HEADLINES except for `micro` eyebrow labels (tracked +0.08em).
- **I vs you:** **Second person ("you") in product UI only** — and sparingly. Marketing uses third-person reporting voice ("EnXi helps operators…"); never "we" unless signing a changelog note as an individual. Customer quotes are always first-person, attributed.
- **Punctuation:** Oxford commas. En-dash for ranges (`30–60–90`). ISO-8601 dates in data (`2026-04-20`). Currency with code prefix (`USD 1,247,350.00`).
- **Numbers:** Always in `Söhne Mono` with tabular figures. Align on the decimal regardless of locale. Never spelled out over ten.
- **Emoji:** **Forbidden** in product UI and marketing body. Narrowly permitted in social captions only when a named customer is speaking.
- **Forbidden phrases:** "transform," "unlock," "supercharge," "empower," "leverage," "seamlessly," "at scale," "in the cloud," "let's get started," "oops!", "game-changer," "best-in-class."
- **Error copy:** Declarative. Names the specific record, explains the constraint, provides the remediation clause — in that order.

### The vibe, in one sentence

*A senior controller's email at 7:42 AM — precise, unflinching, economical, concerned only with the work.*

---

## 4. Visual Foundations

### Substrate — the most important decision

Every surface sits on **warm bone `#FBF9F4`**. Not cool gray. The brand is identifiable by this single decision before any other. Against the warmth, text renders in **graphite `#1A1A1A`** — never pure black (pure black vibrates on a warm field).

Backgrounds are **flat, full-bleed, single-color**. There are no hero videos, no gradient washes, no mesh backgrounds, no particle fields, no tinted photography, no blurred glass. Sections meet at **hairlines** (1px `#D8D4CA`), not at color changes.

### Colors

See `colors_and_type.css` for the full token system. Summary:

| System | Role |
|---|---|
| **Substrate** (`bone-0`, `bone-1`, `white`) | Warm-neutral backgrounds |
| **Ink** (`100/70/40/15`) | Text and hairline dividers |
| **Primary — Graphite Indigo** (`900/600/500/100`) | Headings, buttons, interactive |
| **Accent — Cinnabar** (`600/100`) | <1% of pixels, one-thing-per-surface rule |
| **Semantic** (success/warning/danger/info) | Desaturated forest, amber, oxblood, slate — never candy |
| **Data viz** (7-color categorical) | Slate · Ochre · Sage · Clay · Plum · Teal · Sand. Colorblind-tested. **No pie charts.** |

**The Cinnabar rule is sacred:** Cinnabar marks the single most important thing on any surface. If two things are Cinnabar, nothing is.

### Typography

- **Söhne** — UI and marketing display *(substitute: Inter with `cv11 ss01 tnum` features)*
- **Söhne Mono** — every numeral in product and marketing *(substitute: JetBrains Mono)*
- **Tiempos Text** — long-form editorial prose *(substitute: Source Serif 4)*
- **GT Sectra 400** — the one wildcard. Website hero only. **Appears no more than once per page.** *(substitute: DM Serif Display)*

Scales are different per medium: **14px body in product** (density-optimized), **16px body on marketing** (reading-optimized), **84/64/28pt on slides**, **320pt hero numerals on social**. See `colors_and_type.css`.

### Spacing

- **6px base, 24px anchor** (product). A 6px grid hits 24px row heights cleanly with 14px text — 35% more rows per viewport than an 8px grid.
- **8px base** for marketing web layout.
- **Macro spacing:** 144px section padding on desktop; 72px on mobile.

### Radii

| Surface | Radius | Rationale |
|---|---|---|
| Inputs, buttons | **4px** | Precise — they do work |
| Cards, containers | **12px** | Enclosing — they hold things |
| Chips, pills | 999px | Full-round, only for status chips |

Inputs and cards have different radii **on purpose**. Same radius = template-design tell.

### Borders, shadows, elevation

- **Hairlines everywhere.** 1px `#D8D4CA` — warm, not cool. This is the brand's structural tell.
- **Cards have no shadow.** A 1px hairline border is enough.
- **Shadows are reserved** for: floating menus, toasts, focus rings. Nothing else floats.
- **No elevation-as-decoration.** Material's z-axis metaphor has no correlate in ERP work.

### Backgrounds & imagery

- **No background images** on product surfaces. None.
- **No gradients** anywhere in the system.
- **No hand-drawn illustrations.** When illustrations appear, they are **schematic line drawings** at 0.75px stroke in `ink/70` with at most one Cinnabar highlight — the aesthetic of 1960s industrial catalog art and patent filings.
- **Photography is documentary-industrial only** (warehouses, plant floors, port yards) or **portraiture** (seated, natural light, FT Weekend Magazine register). Never stock. Never handshakes. Never laptops.
- **No texture, no noise, no grain.** Paper warmth is entirely in the `#FBF9F4` tone.

### Transparency & blur

- **No blur anywhere.** No `backdrop-filter`. No glass-morphism.
- **Transparency** is reserved for: focus-ring offsets, subtle row-hover overlays (`ink/5` at 100%, not an alpha).

### Corner & composition rules

- No diagonal sections. No SVG blob dividers. No curved section transitions.
- Sections meet at rules. The geometry is **rectangular and honest**.
- Max content width 1440px; hero headlines may break to 1680px; prose caps at **66ch**.

### Hover / press / focus states

| State | Product | Marketing |
|---|---|---|
| **Hover** | `ink/5` overlay (quiet — it happens constantly) | Cinnabar underline animates in 240ms on CTA link |
| **Press** | `ink/10` overlay; no shrink, no bounce | Same |
| **Focus-visible** | **2px Cinnabar outline, 2px offset** — deliberately loud (keyboard users need it) | Same |
| **Disabled** | `ink/40` on `substrate/0` (4.7:1 — still readable, diagnosable) | Same |

### Motion

- **Product:** 120ms micro, 180ms component, 240ms transition. Nothing exceeds 240ms.
- **Marketing website:** 600ms hero fade+translate. Scroll-linked only. Charts animate once on entry over 500ms. No parallax. No sticky video.
- **Social:** Typographic motion only. 400ms number fade-in, 600ms typewriter quote, 240ms Cinnabar underline draw. Max duration 3 seconds; then static.
- **Easing — asymmetric:**
  - Enter: `cubic-bezier(0.16, 1, 0.3, 1)` (fast out, settled arrival)
  - Exit: `cubic-bezier(0.7, 0, 0.84, 0)` (quick departure)
- **Nothing loops.** No infinite animations. No counter roll-ups on financial figures — values change abruptly.
- **`prefers-reduced-motion` is honored absolutely** — every transition collapses to an 80ms opacity crossfade.

### Color vibe of imagery

Warm-neutral graded. Available light. Muted saturation, biased toward warm tones. No cool-tinted, no B&W, no film grain added, no "filmic" LUTs. Photographs look like they were shot for the *FT Weekend Magazine*, not for a stock library.

### Layout rules / fixed elements

- **Product shell:** 64px top bar, 248px left rail (fixed), optional 320px right context pane (drawer). 12-column fluid center.
- **Marketing:** **The Ledger Grid** — 14 columns with a narrow right-hand **marginalia column** for timestamps, source citations, footnote-style asides in `ink/40`. Borrowed from *The Economist* and academic publishing. This is the website's most recognizable structural signature.
- **Slides:** Three masters only — Title, Claim, Section. No bullet lists *ever*. If content demands a list, it becomes a table.

### The Tick — the wordless signature

A **6-tick vertical hairline**, derived from a ruler mark. It appears:
- In product, as the column-header delimiter
- On the website, as the section divider
- On slide masters, as the footer hairline
- On social quote cards, as the left-edge margin marker
- On the print publication spine

If you see the Tick, you're looking at EnXi.

---

## 5. Iconography

### Approach

Product icons are **custom line glyphs** at **1.25px stroke, 20px canvas, 2px corner radius** — geometric with intentional humanist breaks, rounded terminals, right-angle joins. The aesthetic reference is **Lufthansa signage**, not a mobile app.

**No fills in navigation.** Fills are reserved for *state* (selected tab, applied filter). No skeuomorphism. No emoji-style icons. No icon-characters with eyes. No multicolor icons.

**Business-object icons** (invoice, PO, GL account) use **custom glyphs** drawn from ledger/shipping paperwork iconography — never the generic document-with-corner-fold every SaaS uses. **Action icons** (edit, delete, filter) reuse a shared vocabulary; we don't invent there.

**Emoji:** Forbidden in product UI and marketing body copy. Narrowly permitted in social captions when a named customer is speaking.
**Unicode:** ISO arrows (→ ↗ ↑), middle-dot (·), en-dash (–), em-dash (—), degree, section (§). Ruler-tick glyphs allowed. No decorative Unicode.

### Implementation in this system

Because no custom icon set was provided in the source documents, the UI kits in this system use **[Lucide](https://lucide.dev)** (via CDN) as the closest match in stroke weight and geometric feel — but rendered at **1.25px stroke** to match EnXi's specification. This is a flagged substitution; see §7 for the ask.

Usage:
```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="arrow-up-right" style="stroke-width:1.25;width:20px;height:20px;"></i>
<script>lucide.createIcons();</script>
```

### Logos

EnXi's position is **"typography is the logo."** There is no traditional logomark — the wordmark *is* the identity in most digital contexts. For physical contexts (trade-show banners, partner co-marketing), the **Tick motif** scales up as a secondary brand mark. See `assets/enxi-wordmark.svg` and `assets/enxi-tick-mark.svg`.

---

## 6. Index — what's in this repository

```
/
├── README.md                          ← you are here
├── SKILL.md                           ← Claude Skill front-matter — use this folder as a skill
├── colors_and_type.css                ← tokens + semantic CSS (source of truth)
├── source/
│   ├── BRAND_SYSTEM.md                ← original brand spec
│   └── DESIGN_SYSTEM.md               ← original product spec
├── assets/
│   ├── enxi-wordmark.svg              ← wordmark (typography IS the logo)
│   ├── enxi-tick-mark.svg             ← the Tick motif as a brand mark
│   └── tick-divider.svg               ← horizontal tick rule for section breaks
├── preview/                           ← design-system preview cards (swatches, specimens, tokens)
│   ├── color-substrate.html
│   ├── color-primary.html
│   ├── color-accent-semantic.html
│   ├── color-viz.html
│   ├── type-families.html
│   ├── type-product-scale.html
│   ├── type-marketing-scale.html
│   ├── spacing-scale.html
│   ├── radius-system.html
│   ├── hairlines-tick.html
│   ├── buttons.html
│   ├── inputs.html
│   ├── card.html
│   ├── table.html
│   ├── kpi-card.html
│   ├── chips-badges.html
│   └── motion.html
├── ui_kits/
│   ├── product/                       ← the ERP — ledger dashboard, PO form, variance report
│   │   ├── README.md
│   │   ├── index.html
│   │   └── *.jsx
│   └── marketing/                     ← website — homepage, case study, not-for page
│       ├── README.md
│       ├── index.html
│       └── *.jsx
└── slides/                            ← three master slides (Title / Claim / Section)
    ├── index.html
    ├── TitleSlide.jsx
    ├── ClaimSlide.jsx
    └── SectionSlide.jsx
```

---

## 7. Flagged substitutions — please review

- **Fonts:** Söhne, Söhne Mono, Tiempos Text, and GT Sectra are all commercial licenses. This system uses **Inter / JetBrains Mono / Source Serif 4 / DM Serif Display** from Google Fonts as closest-match substitutes. **Please supply the licensed webfont files** (woff2) and we'll swap them in `colors_and_type.css`.
- **Icons:** No custom icon set was provided. The UI kits use **Lucide at 1.25px stroke** via CDN as a close match. **Please supply the real EnXi icon set** if one exists.
- **Customer imagery:** No customer portraits or factory-floor photography was provided. Kits use labeled placeholders where a portrait or industrial photo would live.
