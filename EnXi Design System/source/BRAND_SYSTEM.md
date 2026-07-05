# EnXi — Unified Brand & Design System
## Product · Marketing · Sales · Social

> One instrument. One voice. No seams.

---

## 1. Context

- **Product Name:** EnXi
- **Industry:** Enterprise Resource Planning (ERP) for mid-market manufacturing, distribution, and project-based services ($50M–$2B revenue bracket).
- **Target Users:**
  - **Product users** — Operators: plant managers, procurement leads, finance controllers, FP&A analysts, AR/AP clerks. They live in the product 4–7 hours/day. They are survivors of SAP, Oracle, or NetSuite migrations. Keyboard-fluent. Skeptical of change. Judge software by *time-to-answer*.
  - **Buyers / decision-makers** — CFOs, COOs, CIOs, and the occasional CEO of a family-owned manufacturer. They are signing a 5-year, seven-figure contract. They fear two things: an implementation that overruns, and a vendor that treats them like a startup. They read proposals twice and forward them to their spouse.
  - **Champions** — VP of Finance, Director of Operations. The person inside the buyer who will be personally accountable for this choice. They need a product that makes them look *correct*, not *cool*.
- **Platform:**
  - **Product:** Web-first (desktop-primary, tablet-responsive, deliberately narrow mobile for approvals/lookups).
  - **Marketing:** Website, long-form landing pages, gated PDFs (whitepapers, ROI calculators, case studies), pitch decks (Keynote + Google Slides), one-pagers, trade-show collateral, LinkedIn (primary social), YouTube (demo and thought-leadership), a quarterly print publication for top 500 accounts.
- **Brand Personality:** **Composed. Instrumented. Quietly confident.** The register of a senior operations leader — not a founder, not a marketer. Authoritative without posturing, technical without jargon, human without performance.

---

## 2. Core Design Philosophy

### Name: **Operational Calm**

EnXi's brand exists at the intersection of two allergies: operators allergic to glossy SaaS theatre, and buyers allergic to frivolous vendor behavior. Operational Calm is the designed absence of everything these audiences have learned to distrust. The same philosophy governs a purchase-order screen and a LinkedIn carousel — because they will be seen by the same person, often on the same day, and they must reinforce each other.

### Core Principles (govern product *and* marketing)

1. **The substrate is warm; the content is cold.**
   Every surface — product background, website hero, slide master, social canvas — rests on a warm-neutral bone tone (`#FBF9F4`). Against this warmth, data, headlines, and numerals render in graphite black. The effect is *ledger paper under tungsten light*: calm substrate, exacting content. This single decision is the brand's most recognizable signature because it is the one thing every enterprise competitor doesn't do.

2. **The UI should never out-talk the data; the marketing should never out-talk the customer.**
   In product, chrome is muted so data can be loud. In marketing, the *typography* is muted so the *customer quote* is loud. Every landing page, every slide, every social post asks: *who is speaking, and is the design getting in their way?* If we're louder than them, we've failed.

3. **Proof over promise.**
   EnXi does not say "transform your business." EnXi says "Kraus-Maffei closed their books in 4 days, down from 17." Every claim is dated, named, and sourced. Marketing inherits the product's relationship to truth: freshness labels, as-of timestamps, named attribution. We treat a landing page the way we treat a general ledger.

4. **Density is a form of respect.**
   An executive reading a pitch deck is not served by 4 words on a slide. An operator scanning a table is not served by 32px row heights. We design for the reader who is *already paying attention* — and compose density through typographic rhythm, hairline rules, and restraint, not by cramming. A dense page that is legible reads as *senior*; a sparse page with 10 icons reads as *junior*.

5. **One brand, three tempos.**
   - **Product tempo:** fast, cool, minimal motion (120–240ms).
   - **Website tempo:** measured, editorial, scroll-paced.
   - **Social tempo:** terse, punchlined, single-idea per frame.
   The *principles* are constant (warm substrate, graphite text, tabular figures, no illustration theatre). The *cadence* changes with the medium. A Keynote deck should *not* move like a dashboard, but it should *look like it is from the same company*.

### Emotional Tone

| Audience | In the moment | Lasting impression |
|---|---|---|
| **Operator (product)** | Focused, uninterrupted, trusted. | *"It gets out of my way."* |
| **Buyer (marketing/sales)** | Respected, not marketed-at. Educated without being lectured. | *"These people are serious. I could defend this choice."* |
| **Champion (proposal/deck)** | Equipped. The deck makes them look smarter in the room. | *"I brought this in. Look what it did."* |
| **Passerby (social)** | Stopped by a specific fact, not by a hook. | *"I should follow these people."* |

### What the system deliberately avoids — across product *and* marketing

- **Purple-to-blue gradients.** The universal tell of AI-generated or generic SaaS. Forbidden.
- **Stock photography of people in offices pointing at laptops.** Forbidden.
- **"Unlock growth / Transform your business / Supercharge your ops"** copy. Forbidden. Our copy names specifics.
- **Hero videos of animated abstract particles.** Forbidden.
- **Emoji in product UI and in B2B marketing body copy.** Forbidden. (Permitted narrowly in social captions when a customer is speaking.)
- **Founder headshots with crossed arms.** Forbidden.
- **Three-column feature grids with icons, a bold word, and a sentence.** Forbidden — a cliché so normalized it has become invisible.
- **Dashboard screenshots with fake data and rainbow charts in marketing.** We show real screens with lightly-redacted real data. If we can't, we show wireframes honestly labeled as such.
- **Countdowns, scarcity timers, or any urgency theatre** on landing pages. Enterprise buyers don't buy on urgency. They buy on confidence.
- **Hero illustrations inside the product.** Marketing only, and even then rarely.
- **Modal "Are you sure?" dialogs and any kind of confirmation-theatre patterns.**

---

## 3. Unified Visual Identity System

### 3.1 Color System

The palette is identical across product and marketing. The *usage rules* differ by surface.

#### Foundation

| Token | Value | Role |
|---|---|---|
| `substrate/0` | `#FBF9F4` | **Universal background** — app, website, slide master, social canvas |
| `substrate/1` | `#F4F1E9` | Sunken areas, quote blocks, code, aside panels |
| `surface/0` | `#FFFFFF` | Cards, tables, modal bodies |
| `ink/100` | `#1A1A1A` | Primary text (not pure black — pure black vibrates on warm substrate) |
| `ink/70` | `#4A4A4A` | Secondary text, body prose on marketing |
| `ink/40` | `#8A8A8A` | Metadata, timestamps, captions |
| `ink/15` | `#D8D4CA` | Hairline dividers — warm, not cool |

#### Primary — Graphite Indigo

| Token | Value |
|---|---|
| `primary/900` | `#1B2A3A` |
| `primary/600` | `#2E4A6B` |
| `primary/500` | `#3B5D82` |
| `primary/100` | `#E4EAF1` |

The color of a Moleskine endpaper. Sits next to black without competing. **Rejected:** `#0066FF`, `#2563EB`, and every shade of "Stripe purple." The brand would rather be *mistaken for a publisher* than for another SaaS.

#### Accent — Cinnabar

| Token | Value |
|---|---|
| `accent/600` | `#B4442C` |
| `accent/100` | `#F2DCD3` |

The color of a red-pencil annotation. Appears on <1% of pixels across every surface.

#### Semantic (desaturated, never candy)

| Intent | Value |
|---|---|
| Success | `#3F6B4E` (forest) |
| Warning | `#A97A1E` (amber) |
| Danger  | `#9A2F2F` (oxblood) |
| Info    | `#3D6780` (slate-blue) |

#### Data Viz — 7-color categorical + monochrome sequential

```
Slate #3B5D82 · Ochre #A97A1E · Sage #6B8C6F · Clay #B4705A
Plum  #6B4A6B · Teal  #3E7773 · Sand #C4A66E
```

#### Usage Rules by Surface

| Surface | Substrate | Primary text | Accent use |
|---|---|---|---|
| **Product UI** | `substrate/0` on app shell, `surface/0` on cards | `ink/100` | Cinnabar as focus ring on dark, active tab indicator, *nothing else* |
| **Website — editorial pages** | `substrate/0` full-bleed | `ink/100` headlines, `ink/70` body | Cinnabar as inline annotation underline, pull-quote rule |
| **Website — conversion pages** | `substrate/0`, with `primary/900` inverted hero sections used sparingly | `ink/100` / `substrate/0` (inverted) | Cinnabar on single CTA only |
| **Social creative** | `substrate/0` default; `primary/900` inverted for quote cards | `ink/100` | Cinnabar on the one word or number the post is *about* |
| **Sales deck** | `substrate/0` always | `ink/100` | Cinnabar on the number that closes the slide |
| **Print publication** | uncoated cream stock — the physical substrate *is* the brand | ink | Cinnabar = single Pantone spot (Pantone 7579 C) |

The accent rule is sacred: **Cinnabar marks the single most important thing on any surface.** If two things are Cinnabar, nothing is.

---

### 3.2 Typography

#### Pairing

- **UI + Marketing Display:** **Söhne** (Inter as OSS fallback with `cv11`, `ss01`, `tnum` enabled)
- **Numerals / Tabular:** **Söhne Mono** — every number in product and marketing
- **Long-form editorial (website articles, whitepapers, pull quotes):** **Tiempos Text**
- **One wildcard:** **GT Sectra** at weight 400 — used *only* on website hero type and print publication titles. A sharp, slightly anachronistic serif. It is the only typographic "event" the brand permits itself, and it appears no more than once per page.

#### Why this pairing

Söhne is a grotesk cut for transit signage — it holds at 12px in tables and at 180px on a hero. Tiempos Text is editorial and signals "this is prose to read, not UI to scan." GT Sectra at hero sizes gives marketing the gravity of a *publication*, not a landing page, without polluting the product.

#### Scale — Hybrid, with different tempos per medium

**Product (14px default body — density-optimized):**
```
display/xl   32/40    display/l  24/32    display/m  20/28
heading      16/24    body       14/20    body/sm    13/18
caption      12/16    micro      11/14
```

**Marketing website (16px default body — reading-optimized):**
```
hero/xl      96/96 (Sectra 400)     hero/l     72/76
display/xl   56/64                  display/l  44/52
h2           32/40                  h3         24/32
body/lg      18/30                  body       16/28
body/sm      14/22                  caption    13/20
```

**Pitch deck (fixed 16:9, 1920×1080):**
```
slide/title       84pt
slide/headline    64pt
slide/body        28pt
slide/caption     18pt
slide/source      14pt  (always present, always cited)
```

**Social (1080×1350 for LinkedIn carousel):**
```
card/headline   72pt  (max 9 words)
card/body       36pt  (max 24 words)
card/caption    24pt
card/byline     18pt
```

#### Tone of Typography

| Surface | Voice |
|---|---|
| Product | **Functional.** Terse labels. Declarative errors. |
| Website body | **Editorial.** Full sentences. Named sources. No marketing verbs ("empower," "unlock," "leverage"). |
| Website hero | **Stated.** A single factual claim, not a slogan. *"Close the books in 4 days, not 17."* not *"Transform your financial operations."* |
| Sales deck | **Consultative.** Written to be read aloud by a champion, not a rep. |
| Social | **Reporter-like.** The cadence of a *Bloomberg* or *FT* short. Lead with the number. |

---

### 3.3 Layout & Grid

#### Shared Primitives

- **Base unit:** 6px (product) / 8px (marketing — web layout tooling assumes 8, and readers won't see the difference).
- **Macro anchor:** 24px, shared across both.
- **Radius system:** 4px on inputs/buttons (product and forms), 12px on cards and containers. *Different on purpose* — inputs are precise, containers are enclosing.
- **Hairlines:** 1px `ink/15` everywhere — product dividers, website section breaks, slide footers. The hairline is the brand's structural tell.

#### Product Layout

12-column macro grid. Fixed 248px left rail. Optional 320px right context pane. Fluid center. See §4 for component-level layout.

#### Marketing Layout — **The Ledger Grid**

The website uses a **14-column grid** with two narrow gutter columns on the outside and a narrow "margin column" reserved for **running marginalia**: timestamps, source citations, footnote-style asides in `ink/40`. This is borrowed from the page layout of *The Economist* and academic publishing. It is the single most recognizable structural signature of the EnXi website, and it makes the site feel like something to *read* rather than *scan*.

- **Hero zone:** 100vh *only* on the homepage and campaign landers. Every other page opens with a 40vh editorial lede — a single sentence in GT Sectra, a byline, a dateline.
- **Section rhythm:** 144px vertical padding between major sections on desktop, 72px on mobile. No section uses a different background color to delimit itself — delimitation is done by a single hairline rule and the marginalia column resetting.
- **Max content width:** 1440px. Hero headlines may break to 1680px. Prose is capped at **66ch**.
- **No diagonal sections, no SVG blob dividers, no curved transitions.** Sections meet at rules. The geometry is rectangular and honest.

#### Deck Layout

Three master slides, used exclusively:
1. **Title master** — one line at the top-left in Sectra, a horizontal hairline, and one supporting fact bottom-left in Söhne Mono. The rest of the slide is `substrate/0`.
2. **Claim master** — the headline as a single statement (left-aligned, top half). The proof (chart, table, quote) fills the bottom half. Always a source citation in `micro` at the bottom.
3. **Section master** — a horizontal rule, a roman numeral (I, II, III), and a section title. The only "break" slide permitted.

No bullet lists. Ever. If content demands a list, it becomes a table.

#### Social Layout

A single 1080×1350 canvas. Three permitted compositions:
- **The Fact** — an enormous number (Söhne Mono, 320pt), a one-line caption, a byline.
- **The Quote** — a customer quote in Tiempos, the customer's name and role, a single Cinnabar hairline under the most important clause.
- **The Chart** — a single chart on `substrate/0`, a one-sentence takeaway below it. No logo in the corner — the typography *is* the logo.

---

### 3.4 Iconography & Graphics

#### Product Icons

1.25px stroke, 20px canvas, 2px corner radius. Geometric with humanist breaks (rounded terminals, right-angle joins). Fills reserved for *state* (selected, applied). See product system §4.

#### Marketing Illustration — **The Schematic Style**

Marketing illustrations are **line-drawn isometrics or technical schematics** at 0.75px stroke in `ink/70`, with *at most one* Cinnabar highlight per illustration. Subject matter: cutaway diagrams of a warehouse, an exploded view of a purchase order document, a flow diagram of a close cycle. The aesthetic reference is **1960s industrial catalog art** and **patent filing illustrations** — not Dribbble isometric characters.

**Explicitly forbidden:**
- Blob-people illustrations (Corporate Memphis, Alegria, and their variants).
- 3D rendered objects with soft shadows and gradients.
- Icon-characters with eyes.
- Anything that could appear in a Zendesk onboarding.

#### Brand Graphic Motif — **The Tick**

EnXi owns a single graphic motif: a **6-tick vertical hairline**, derived from a ruler mark. It appears:
- In product, as the column-header delimiter.
- On the website, as the section divider.
- On slide masters, as the footer hairline.
- On social quote cards, as the left-edge margin marker.
- On the print publication spine.

It is the brand's **wordless signature**. If you see the tick, you're looking at EnXi.

#### Data Visualization — one style across product and marketing

- Monochrome sequential for heatmaps (single hue ramp: `ink/5` → `primary/900`).
- 7-color categorical for distinct series, colorblind-tested.
- Tabular mono numerals in every axis label.
- **No pie charts.** Ever. Enterprise finance does not reason in pies. Use stacked bars or small-multiples.
- **Every chart carries its source and timestamp** as a caption in `micro` size, `ink/40`.

---

### 3.5 Imagery Direction

#### Photography

**Only two photographic modes, both in-house:**

1. **Documentary industrial.** Wide-angle photographs of the environments EnXi serves: warehouse mezzanines, plant floors, control rooms, port container yards. Shot in available light, 35mm or 50mm, muted color grade biased toward warm neutrals. Never staged. Never with a laptop.
2. **Portraiture — the Principal.** Customer portraits for case studies. Seated, shoulders-up, 85mm, natural light from one side, `substrate/0`-equivalent wall behind. Subject looks at the camera or slightly past it. No forced smiles. No crossed arms. The aesthetic reference is *the FT Weekend Magazine lunch portrait*.

#### Illustration

Schematic only (see 3.4). No editorial cartoons, no spot illustrations with characters.

#### Motion imagery

- **Product demo video:** real screen capture at native resolution, no stylized cursor, no voiceover — only typed annotations that appear as small captions in `micro`. The reference: a trader's Loom recording, not a SaaS explainer.
- **Hero video on homepage:** forbidden. The homepage does not have a hero video.

#### Explicitly NOT allowed

- Stock photography of any kind.
- Handshakes, high-fives, diverse-team-around-a-laptop scenes.
- Gradient-tinted photography.
- Screenshots with fake dashboard data in rainbow colors.
- Any image containing a smartphone unless the product screenshot is of our actual mobile approval flow.
- "Whiteboard with sticky notes" photography.

---

## 4. Product Design System (Application)

*This section is the applied subset of the full product system. See companion document `DESIGN_SYSTEM.md` for the deep specification. Summary below; additions specific to the unified brand are marked.*

### 4.1 Components

- **Action hierarchy:** four levels — Primary (filled `primary/900`, max one per view), Secondary (bordered), Tertiary (text-only with 44×44 hit target), Destructive (never styled as primary). Red is a meaning, not a weight.
- **Forms:** top-aligned labels, validate on blur not keystroke, error replaces help text (no layout shift), required-by-omission (no red asterisks). Field groupings follow *temporal cohesion* — what the user knows at the same moment.
- **Tables:** hairline-bordered on verticals only, no zebra striping, sticky header/first-col/last-col/footer, keyboard-native (arrows, `Enter`, `⌘↑/↓`), column-first reasoning with inline summary statistics, in-place editing via double-click with `warning/600` 2px left-border on dirty cells.
- **Cards:** no shadows. 1px `ink/15` border. 12px outer radius, 0 inner.
- **Navigation:** 3-tier (workspace switcher / primary rail / contextual), plus `⌘K` command palette as a first-class surface. Task modes hide the rail.
- **Feedback:** toasts top-right 4s (7s with undo), max 3 stacked. Drawers over modals. Inline errors over toasts. No skeleton loaders — a measured 2px progress bar and a spinner that swaps to "Taking longer than expected…" at 3s.

### 4.2 Interaction Patterns

- **Keyboard-primary.** Every destination is reachable from `⌘K`. Every table is arrow-navigable. Every form submits with `⌘↵`. Shortcuts are remappable.
- **Reversibility over confirmation.** Optimistic actions with a 7s undo for routine operations; typed confirmation (not a button) for legally irreversible ones (posting to GL, closing a period).
- **One modal, ever.** If a flow needs a nested modal, it's the wrong flow.

### 4.3 Data-Heavy UI Philosophy

- **Tabular mono numerals everywhere.** Columns of numbers align on the decimal regardless of locale.
- **Freshness is a first-class citizen.** Every KPI, every dashboard card, every report header carries an "as of HH:MM · reconciled through DATE" strap. A stale number shown without its timestamp is a bug.
- **Three density modes** (Comfortable / Default / Compact), per-user per-surface. Compact recomposes (drops padding, collapses nav), never shrinks text.
- **No rainbow dashboards.** Color signals *attention-worthy*, not *quantitative*. Routine variance cells stay monochrome; flagged cells get semantic color.

### 4.4 UX Patterns for Efficiency vs Clarity

- **Efficiency path (for operators):** keyboard, command palette, editable-in-place tables, batch-commit, undo. The path a user takes on day 200.
- **Clarity path (for newcomers, execs, auditors):** breadcrumbs, labeled empty states with prose explanations, read-only views with explicit "Edit" affordances, a mandatory 6-minute onboarding that teaches `⌘K`. The path a user takes on day 1.
- The two paths share a UI. They diverge only in *input method*. We never ship two different screens for "beginner mode" and "power user mode" — that's a failure of information architecture.

---

## 5. Marketing Design System

The marketing system is governed by the same philosophy but operates at a different cadence. It exists to earn the buyer's trust *before* they are in the product, and to make champions look correct *after* they recommend it.

### 5.1 Website & Landing Pages

#### Homepage Hero — **The Stated Fact**

The homepage does not open with an aspirational headline, a product screenshot, or a video of animated particles. It opens with a single **stated fact** in GT Sectra at hero scale, attributed to a named customer, with a dateline.

> ### "We closed our March books on April 4th. Last year we were still closing on April 21st."
> — Dana Reyes, CFO · Kraus-Maffei Industrial · Posted 2026-04-14

Below the quote: a 1px hairline, then a single line of Söhne Mono: `EnXi — ERP for operators who have run one before.` And a single Cinnabar primary CTA: `See a customer's live dashboard ↗` (which opens a sandboxed, redacted real environment — not a marketing demo).

No navigation bar overlay. No animated gradient. No "trusted by" logo garden above the fold.

**Why this works:** it defuses the three things enterprise buyers distrust (vague claims, staged demos, unnamed social proof) inside the first 3 seconds. It makes the rest of the page feel like it was written by adults.

#### Storytelling Structure — **The Broadsheet Pattern**

Every long-form page (product page, solution page, case study) follows a 5-beat structure borrowed from broadsheet journalism:

1. **Lede** — one sentence stating the specific claim.
2. **Nut graf** — 2–3 sentences explaining who it's for and why it's true.
3. **Evidence** — charts, customer quotes, named data points. Marginalia column carries footnotes.
4. **Counter-argument** — a short section titled "What EnXi is *not* good for." (See 5.1.5.)
5. **Next step** — a single CTA. Never more than one per page.

#### Conversion Patterns

| Buyer segment | CTA language | Friction level |
|---|---|---|
| Enterprise ($500M+) | *"Request an implementation assessment"* → routes to a named account exec, not a form queue | High (5-field form, calendar invite follow-up) |
| Mid-market | *"See a live dashboard"* → sandboxed demo environment, no form | Zero |
| Evaluator (non-buyer) | *"Read the 2026 close benchmarks report"* → gated PDF | Medium (email only) |

We deliberately **offer the lowest-friction path to the most qualified buyer.** This is backwards from SaaS convention — and it's how we signal "we treat you like a customer even before you pay."

#### Trust-Building Elements

- **Named sources on every claim.** No anonymized logos. If a customer won't be named, the claim doesn't appear.
- **A public changelog** linked from the footer, updated weekly, with real engineer names.
- **A public incident history** — every outage, root cause, remediation, linked from the footer. Enterprise buyers check this; most vendors hide it.
- **A dated methodology note** on every benchmark or "ROI" claim, written by our analyst team, with methodology in the marginalia.
- **The "not good for" page.** (See below.)

#### The "Not Good For" Page — a navigable page, not a footnote.
A dedicated page at `/not-for` that lists, plainly, the organizations EnXi is a poor fit for: pre-Series A startups, pure e-commerce retailers without inventory, consultancies with fewer than 50 people. This page is linked from the main nav. It is our single most powerful trust artifact, because it is something no competitor will copy.

### 5.2 Pre-Sales & Sales Material

#### Pitch Deck — **The Operator's Deck**

40 slides, maximum 28 used in any given meeting. Three master slides (Title, Claim, Section — see 3.3). Shared vocabulary:

- **Slide 1:** The customer's name, the customer's problem, the customer's result. Never EnXi's logo as the opening slide.
- **Slide 2:** The meeting's agenda, with timestamps. We respect the buyer's calendar by showing we respect their calendar.
- **Middle slides:** Claim + proof, one per slide. Every chart cites a source. Every table is Söhne Mono. Every quote has a name and date.
- **The "Not for us" slide:** Yes, in the deck too. Disarms skepticism earlier than any feature slide can.
- **Closing slide:** A single number — the ROI commitment — with the methodology in `micro` type. No logo, no "Thank you!", no "Questions?".

#### One-Pager

A single letter-sized page with two panels:

- **Left panel (⅓):** the customer's name, problem, numeric result. Portrait photograph (if consented).
- **Right panel (⅔):** three claims, each with a supporting hairline chart. Source citations run down the right margin in marginalia style.

No product screenshots. No feature list. A one-pager is a *reputation artifact*, not a spec sheet.

#### Case Study — **The Post-Mortem**

Structured like an engineering post-mortem, not a marketing story:

1. *Situation before* — named, dated, quantified.
2. *What we changed* — specific, including things that didn't work on first try.
3. *What the customer had to change on their end* — we name this explicitly. (Credibility multiplier.)
4. *Results* — with methodology.
5. *What still isn't solved* — a short honest section.

Case studies are 4–6 pages. Formatted as a PDF using the website's Ledger Grid and typographic scale. They live on the site and as standalone PDFs — the same artifact, unmodified.

#### Proposal Document

LaTeX-quality typesetting. Tiempos for body, Söhne for headers, Söhne Mono for every number. Tables instead of bullets. The proposal reads like a consulting deliverable from a top-tier firm — because that's the artifact the CFO is comparing it to, whether they say so or not.

### 5.3 Social Media System

**Primary channel: LinkedIn. Secondary: YouTube. We do not use Instagram, TikTok, or Twitter/X for brand.**

#### Four Post Types (and nothing else)

1. **The Benchmark** — a single fact or chart from our internal analyst desk. Example: *"The median mid-market manufacturer closes books in 9.4 days. Top quartile: 4.1. Bottom quartile: 17."* Format: single image, The Fact layout.
2. **The Principal's Quote** — a customer (named, pictured) with a specific claim. Format: single image, The Quote layout.
3. **The Teardown** — a 6-slide carousel analyzing an operational problem (e.g., "Why 'close the books' takes 17 days in most ERPs"). Written by a domain expert on our team, signed with their name. Format: 6 × The Chart/Fact/Quote mix.
4. **The Changelog Note** — a short, specific product shipment with a named engineer, written like a release note. No marketing wrapper. Format: text post with a single product screenshot.

No "happy birthday to our amazing team!" posts. No engagement-bait questions. No trending-template lip-syncs.

#### Visual Templates

All social uses the **three compositions** defined in 3.3: The Fact, The Quote, The Chart. Shared across every template:

- `substrate/0` canvas.
- 1px `ink/15` hairline 72px from the bottom edge, spanning the full width.
- Byline in `micro` Söhne Mono under the hairline: `EnXi · Analyst Desk · 2026-04-20`.
- Left-edge 6-tick motif.

The templates are built in Figma as a component library with a published *refusal list*: what cannot be added (logos in corners, emoji, gradients, drop shadows, stock photo backgrounds). The refusal list is as important as the templates.

#### Motion / Animation Style

Social motion is **typographic only** — never animated illustrations, never confetti, never zoom-pans over photography. The only permitted motions:

- A 400ms fade-in of the number.
- A 600ms typewriter reveal of a customer quote, *if* the post is a quote.
- A 240ms Cinnabar underline drawing under the key phrase, exactly once.

Maximum duration: 3 seconds. After that, the post holds static. We refuse to compete with TikTok's motion vocabulary, because we're not in that business.

#### Content Tone

**Reporter first, marketer never.** Every post leads with a fact or a number. The voice is closer to *FT Alphaville* than to a LinkedIn influencer. We sign posts with individual names on our team (analysts, engineers, designers). The corporate handle is a masthead, not a persona.

---

## 6. Motion & Interaction

### Shared Motion Principles

1. **Motion carries information or it doesn't ship.**
2. **Snap, don't swim.** Short durations everywhere.
3. **Asymmetric easing.** Enter: `cubic-bezier(0.16, 1, 0.3, 1)`. Exit: `cubic-bezier(0.7, 0, 0.84, 0)`.
4. **`prefers-reduced-motion` is honored absolutely.** Reduced motion collapses every transition to an 80ms opacity crossfade.

### Product Motion

- 120ms micro (hover, focus), 180ms component (drawer, dropdown), 240ms transition (route change). Nothing exceeds 240ms. No emotional motion on destructive actions. Values change abruptly — no counter roll-ups on financial figures.

### Marketing Motion (website)

- Scroll-linked only. No auto-play. No "wow" moments.
- Hero fade-in: 600ms opacity + 8px translate-up on the Sectra headline, triggered once on page load.
- Section boundaries reveal the hairline rule and the marginalia column contents via a 300ms fade as they cross the viewport midline.
- Charts animate *once*: bars grow from zero over 500ms on entry, no bounce, no stagger.
- Homepage: no parallax, no sticky video, no 3D canvas. The page scrolls like an article because it is one.

### Marketing Motion (social / video)

- Typographic-only (see 5.3).
- Product demo videos: no cursor trails, no highlight rings, no zoom-punches. A single Cinnabar underline may appear under a UI element we want to reference.

### Consistency Rules

- **No motion language exists in one world and not the other.** The Cinnabar underline, the hairline reveal, the 600ms fade are the same primitive across product and marketing.
- **Timing scales with context, not decoration.** Product = fast (user is working). Website = measured (user is reading). Social = terse (user is scrolling). But the easing curves are identical.
- **Nothing loops.** No infinite animations anywhere in the brand. A looped animation is a decoration; we don't do decoration.

---

## 7. Design Tokens & Implementation

### Shared Token Architecture

Three-tier tokens (Primitive → Semantic → Component) as a **single source of truth** consumed by product, website, deck templates, and Figma libraries.

```
// Primitive
--enxi-color-indigo-900: #1B2A3A;
--enxi-space-6: 24px;
--enxi-type-sectra-hero-xl: 96px;

// Semantic
--enxi-color-action-primary: var(--enxi-color-indigo-900);
--enxi-color-surface-substrate: var(--enxi-color-bone-0);
--enxi-type-marketing-hero: var(--enxi-type-sectra-hero-xl);

// Component
--enxi-button-primary-bg: var(--enxi-color-action-primary);
--enxi-hero-headline-font: var(--enxi-type-marketing-hero);
```

### Pipeline

**Figma Variables → `style-dictionary` → multi-platform outputs:**
- `@enxi/tokens-css` — CSS custom properties for product and marketing.
- `@enxi/tokens-js` — TS-typed object for React.
- `@enxi/tokens-figma` — JSON for design library.
- `@enxi/tokens-keynote` — a build step exports a `.kth` Keynote theme and a Google Slides template, regenerated on every token release. **This is non-obvious and important** — sales decks drift the fastest; we fight drift by building the deck theme from the same source as the product.
- `@enxi/tokens-social` — a Figma template library for LinkedIn with tokens baked in.

### Product Implementation

- React 18+, CSS Modules + custom-property theming. Zero runtime CSS-in-JS.
- Packaged as `@enxi/ui`, tree-shakeable, semver with RFC-governed breaking changes.
- We evaluated Tailwind and declined — density conventions fight utility defaults; designers work in Figma variables that map 1:1 to semantic tokens, not utility class names.

### Marketing Implementation

- **Next.js 15 App Router** for the marketing site.
- Same token package (`@enxi/tokens-css`) imported at the root.
- A separate component layer (`@enxi/marketing`) for marketing-specific compositions (the Ledger Grid, the Hero Fact, the Broadsheet page, the Case Study layout). Marketing components *never* import product components — and vice versa. The token layer is the only shared surface.
- Content lives in MDX with a strict schema enforced at build time: every claim must declare a `source` and `dateStated` front-matter property, or the build fails. **This is how we make "proof over promise" a compiler-enforced principle, not a guideline.**

### Theming

- **Product:** Light (default), Dark (warm-black substrate `#141210`, lifted semantics), High-Contrast. Re-tuned per theme, not inverted.
- **Marketing:** Light only on web. The print publication uses an ink-on-cream variant that is a distinct theme, generated from the same tokens.
- **Campaign themes:** When a campaign needs a distinct look (e.g., an annual benchmarks report), it ships as a token overlay — a new accent, a new hero serif weight — never a new stylesheet. The campaign expires; the token overlay is deleted; the baseline is untouched.

### Scalability

- New products (HR, CRM) inherit tokens and principles, but get their own component layer. We do not believe in one component library serving all products. We believe in *one token layer and one philosophy* serving all products.
- New campaigns get a token overlay, never a design fork.
- New channels (if we ever ship one) must produce a *refusal list* before a template — we define what the channel *won't* do before what it will.

---

## 8. What Makes This System Distinct

### How EnXi avoids looking like generic SaaS

- **Warm substrate everywhere.** The single most differentiating choice. While every competitor sits on cool gray, EnXi sits on ledger bone. The first impression is: *this is a different kind of company.*
- **Tabular monospaced numerals in all data, product and marketing.** A subtle but continuous signal of seriousness that most competitors can't match without retooling.
- **No gradients, no glass-morphism, no blur, no 3D, anywhere.** The brand is committed to 2D, hairlines, and restraint.
- **Sectra on the website, nowhere else.** A serif that signals *publication*, used with extreme discipline.
- **A public "Not good for" page, a public incident history, a public changelog.** These are brand artifacts no competitor will replicate without cultural change first.
- **Marketing copy that names names and dates.** No vague transformation language.

### How product and marketing feel unified

- **Substrate, primary, semantic, and tabular mono numerals are identical** across every surface.
- **The Tick (6-line marginalia motif)** appears in the product's column headers, the website's section dividers, and the deck footer — a wordless signature.
- **The Cinnabar-on-the-one-thing rule** is the same in a product focus ring, a website CTA, and a social card headline.
- **The deck template and social templates are generated from the same token pipeline** as the product CSS. Drift is structurally prevented, not policed.
- **Voice is consistent:** declarative, specific, named, dated. The product's error copy, the website's hero, the pitch deck's claim, and a LinkedIn post all sound like they came from the same person.

### Where bold, unconventional decisions were made

| Decision | Conventional approach | EnXi's approach | Why |
|---|---|---|---|
| Homepage hero | Aspirational headline + gradient + product screenshot | Named customer quote in Sectra on bone substrate | Buyers distrust marketing theatre; they trust named peers. |
| Primary social channel | Post on every platform | LinkedIn + YouTube only | Our buyers are not on TikTok, and a brand present everywhere is credible nowhere. |
| Sales deck | 60-slide feature tour | 40-slide structured with a "Not for you" slide | Disarming skepticism is a faster path to close than amplifying features. |
| Case studies | Marketing story with feature name-drops | Post-mortem including "what still isn't solved" | Honesty signals confidence. |
| Accent color usage | 15–20% of surface | <1% of surface, one thing per page/screen | Scarcity makes the signal carry. |
| Pie charts | Default in dashboards | Forbidden | Pies lie; stacked bars and small multiples don't. |
| Skeleton loaders | Default loading state | Forbidden | They misrepresent layout and lie about content. |
| Hero video | Default above-fold | Forbidden | Video hides the claim. We lead with the claim. |
| Logo placement on social | Corner stamp on every post | Not present. Typography is the logo. | A confident brand doesn't sign its own work in the corner. |

---

## 9. Example Outputs

### 9.1 Product Dashboard — The Controller's 8:45 AM

Warm bone substrate fills the viewport. A 64px top bar carries the workspace switcher at left, `⌘K — search or jump` centered in Söhne Mono at 13px, user controls at right. Below it, five hairline-bordered KPI cards — *Cash Position, AR 30/60/90, AP Due This Week, Unposted Entries, Period Close Progress*. Each number in Söhne Mono at `display/l`, each delta as a small pill in desaturated success-green or oxblood-red, each with "as of 08:43 · reconciled through Apr 18" in `caption` `ink/40` below. Below the KPIs, a two-third/one-third split: a monochrome sequential line chart of cash position over 90 days with a single Cinnabar vertical hairline marking today; on the right, a 6-row Exceptions list with severity glyphs. Below that, a 12-row operating table — columns of tabular-mono numbers aligned on the decimal, hairline dividers on verticals only, no zebra, sticky header and footer. No illustrations anywhere. No brand logo. The workspace name *is* the identity. Total vertical scroll: 2.3 screens.

### 9.2 Marketing Homepage

Bone substrate. No top-bar overlay — a slim header appears after 400px of scroll. The hero zone is 100vh. Left-aligned, at 60% of viewport height, a single sentence in GT Sectra 96pt/96:

> *"We closed our March books on April 4th. Last year we were still closing on April 21st."*

Below the sentence, a 1px `ink/15` hairline that spans 12 columns. Under it, in Söhne Mono 14pt: `— Dana Reyes, CFO · Kraus-Maffei Industrial · Posted 2026-04-14`. Below that, a single line of Söhne 18pt `ink/70`: *EnXi is an ERP for operators who have run one before.* And a single text link in `primary/600` with a Cinnabar underline on hover: `See a customer's live dashboard ↗`. In the right margin (the marginalia column), in Söhne Mono 13pt `ink/40`: `Filed under: Close cycles, Manufacturing, Mid-market.` The hero holds static until the user scrolls. No autoplay video. No floating CTA. The next section is 144px down and begins with a hairline rule.

### 9.3 LinkedIn Post — The Benchmark (single image, 1080×1350)

Bone substrate canvas. Top-left margin, 72px in: Söhne Mono 24pt `ink/40`: `ENXI ANALYST DESK · BENCHMARK N°14`. At 35% from the top, left-aligned, a single number in Söhne Mono 320pt `ink/100`: `9.4`. Immediately right of the number, vertically centered against it, three lines in Söhne 36pt `ink/100`: *days. Median mid-market manufacturer's close cycle. Top quartile: 4.1.* The word "top quartile" carries a Cinnabar underline — the only color on the card. 72px from the bottom: a full-width 1px hairline. Below the hairline, Söhne Mono 18pt `ink/40`: `Source: EnXi 2026 Close Benchmarks · n=312 firms · Published 2026-04-18`. Above the hairline, left-aligned, in Söhne 18pt `ink/70`: `Written by Priya Kohli, Lead Analyst`. No logo. No CTA on the image — the caption carries it.

### 9.4 Sales Deck Slide — The Claim

Bone substrate. Top-left: slide title in Söhne 28pt `ink/70`: `III. Close cycle impact.` Below it, the claim in Söhne 64pt `ink/100`, left-aligned, wrapping to two lines max:

> *"Kraus-Maffei cut their month-end close from 17 days to 4."*

A horizontal hairline at the page's vertical midline. Below the hairline, a single stacked-bar chart showing the 18-month timeline of close-cycle days, with the "EnXi go-live" event marked by a Cinnabar vertical hairline. All axis labels in Söhne Mono. Source citation bottom-right in Söhne Mono 14pt `ink/40`: `Source: Kraus-Maffei Industrial internal close records · Verified 2026-03-30.` The slide's bottom edge carries a 1px hairline spanning the full width. No footer logo. No page number stamp. The typography is the identity.

**These four artifacts are recognizable as the same brand even with all text removed — because the substrate, the hairline, the Tick, the Cinnabar-on-one-thing, the tabular mono, and the typographic hierarchy are the same primitives applied at different cadences.**

---

## 10. Critical Review

### Weaknesses

1. **Brand severity is a first-impression liability for some buyers.** Prospects expecting the familiar SaaS vocabulary (gradient hero, product screenshot above the fold, three-column feature grid) may read the site as *dated* or *austere* before the content earns them back. In A/B testing, we accept a likely 8–15% bounce-rate hit for the 20–30% lift in qualified form fills we believe the restraint will produce. This bet is falsifiable and should be re-examined quarterly.

2. **The "Not good for" page, the public incident history, and the named-engineer changelog are culturally expensive.** They only work if the company lives up to them. A single embellished case study, a single hidden incident, or a single ghost-written engineer post will collapse the brand's core credibility asset. We are one bad quarter of marketing-operations discipline away from hypocrisy.

3. **GT Sectra is expensive and hard to license broadly.** We depend on it for a distinctive homepage voice. A font licensing issue or vendor change could force a brand-wide retreat; we need at least one rehearsed fallback (likely: GT Alpina or a custom-licensed serif) and a visual QA process that includes a font-fallback mode.

4. **"Typography is the logo" is a strong position that breaks in certain physical contexts** — trade-show banners, customer office signage, co-marketing moments where peers expect a logomark. We need a secondary identity artifact (likely the Tick motif scaled up as a brand mark) for physical contexts without compromising the digital purity.

5. **The refusal of emoji, stock photography, and standard social formats is a recruiting moat we must maintain.** Every new marketing hire will instinctively propose the things we forbid. Without internal editorial discipline and a written refusal list (shipped as onboarding), the brand will drift in 18 months.

6. **Warm substrate versus customer expectation.** Some dark-mode-first users and some executives hardwired to cool gray will read the bone tone as "dated." A well-lit product screenshot in a demo can soften this; a PDF opened on an uncalibrated projector cannot.

7. **Unified token pipeline is an engineering-and-design organizational demand.** The discipline of "deck theme is generated from the token pipeline" is hard to enforce in practice — sales teams will PowerPoint around it. We need a designated brand-ops lead or the system will fragment within a year.

8. **Density bet versus accessibility bet.** The 14px product body and the marginalia-heavy website both assume readers have good vision, decent screens, and attention to spare. Our accessibility mitigations (Comfortable mode, Dyslexia mode, prefers-reduced-motion) are real but require continuous QA investment; skipping it once lets the bet quietly fail for vulnerable users.

9. **The "one modal, one CTA, one accent use" absolutism** is easy to state and hard to hold. Product managers will argue for secondary CTAs. Marketers will argue for a second Cinnabar mark. Each concession is small; the brand dies from compound concessions.

### Risks of Over-Design or Inconsistency

- **Over-design risk.** The system's discipline could calcify into an aesthetic for its own sake — refusing something the business needs ("we need a 10th nav item," "we need a campaign-specific hero"). Principles serve outcomes; when they don't, they must bend. A quarterly principle-review ritual is necessary.
- **Inconsistency risk.** The marketing and sales teams iterate faster than product. Without the token pipeline enforcement, a deck template will drift into PowerPoint-default territory within two quarters. The remedy is infrastructural (generate themes from tokens), not rhetorical (a brand guideline PDF).
- **Voice drift risk.** "Declarative, specific, named, dated" is easy to write and hard to maintain at scale. Growth marketers, social hires, and agency partners will instinctively regress to conversion-optimized tropes. The *refusal list* must be explicit and onboarding-enforced.
- **Scale risk.** What works for a $50M ARR brand may feel precious at $500M, when the audience includes Fortune 500 buyers with different expectations. The system should anticipate graduating from *quietly confident* to *quietly authoritative* without changing register — this is a tuning task, not a refactor.

### Future Evolution Paths

- **An embedded AI layer, shared across product and marketing.** Question-asking is the future primary interaction on both surfaces. The `⌘K` palette in product and the site search on marketing become the same surface, backed by the same model, returning named-and-dated answers. Design work: provenance, confidence, and freshness become the dominant visual language.
- **The print publication as the brand's gravitational center.** A quarterly 64-page print journal mailed to the top 500 accounts — written by our analyst desk, not ghost-written. Print is a differentiation moat because it is expensive and hard to fake. It can anchor the brand's voice for the next decade.
- **A certified-partner visual system.** When SIs, resellers, and implementers co-market with EnXi, they need a visual vocabulary that reads as "EnXi-endorsed" without diluting the master brand. A partner design kit with strict constraints (the Tick, substrate, tabular mono — but no Sectra, no Cinnabar) is the likely answer.
- **A dedicated shop-floor / field-service mobile product.** Not a responsive stretch of desktop. Its own product, its own component library, same tokens. The day we ship it, we must decide whether motion and density rules bend or hold.
- **Public APIs to the brand.** A documented design-token API, component library, and Figma file published under a source-available license — lets customers build internal tools that feel like EnXi without asking. Most enterprise brands treat this as a legal risk; we treat it as a distribution strategy.
- **Voice and audio.** As buyers consume more audio (earnings podcasts, sales call summaries), EnXi will need a sound identity. The principles translate: a single sonic motif, tabular-mono-equivalent restraint, no stingers, no swells. When we get there, the question is: what is the auditory version of a hairline rule?

---

*EnXi is one brand whether you are posting the books, reading a whitepaper, watching a pitch, or scrolling LinkedIn. The artifacts change. The register does not. If we have done our job, users will not describe the design at all — they will describe the work they got done, the claim they trusted, the deck that made them look correct, and the number that made them stop scrolling.*
