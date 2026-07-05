/* @ds-bundle: {"format":3,"namespace":"EnXiDesignSystem_8dbe0c","components":[],"sourceHashes":{"slides/Slides.jsx":"6d69edcbafb6","slides/deck-stage.js":"522102a1c71e","ui_kits/marketing/Pages.jsx":"28afabf35468","ui_kits/product/DashboardPage.jsx":"cf8b33e7dcbf","ui_kits/product/POPage.jsx":"d35fcf84b36f","ui_kits/product/Shell.jsx":"469b71cc5449","ui_kits/product/VariancePage.jsx":"62e5736b2bcd"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.EnXiDesignSystem_8dbe0c = window.EnXiDesignSystem_8dbe0c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// slides/Slides.jsx
try { (() => {
function SlideFooter({
  deck,
  section,
  page,
  date
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "slide-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hr"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tick-sig"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("span", null, "EnXi"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--enxi-color-ink-15)',
      fontWeight: 400
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--enxi-color-ink-40)',
      fontWeight: 400
    }
  }, deck)), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, section, " \xB7 ", date, " \xB7 ", page));
}
function TitleSlide() {
  return /*#__PURE__*/React.createElement("div", {
    className: "slide slide-title"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slide-pad"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "Customer case \xB7 Kraus-Maffei Industrial"), /*#__PURE__*/React.createElement("h1", null, "We closed our March books on April 4th. Last year we were still closing on April 21st."), /*#__PURE__*/React.createElement("div", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("p", {
    className: "dek"
  }, "A controlled post-mortem of a 14-month ERP migration, presented to the EnXi 2026 customer forum. What changed, what didn't, what's still in flight."), /*#__PURE__*/React.createElement("div", {
    className: "fact"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Presented by"), "D. Reyes, CFO", /*#__PURE__*/React.createElement("br", null), "Kraus-Maffei Industrial"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "For"), "EnXi 2026 Customer Forum", /*#__PURE__*/React.createElement("br", null), "Amsterdam \xB7 2026-05-14"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Prepared"), "2026-04-18 by the", /*#__PURE__*/React.createElement("br", null), "EnXi Implementation Team"))), /*#__PURE__*/React.createElement(SlideFooter, {
    deck: "Customer case \xB7 Kraus-Maffei",
    section: "I. Case",
    page: "01 / 28",
    date: "2026-05-14"
  }));
}
function ClaimSlide() {
  return /*#__PURE__*/React.createElement("div", {
    className: "slide slide-claim"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slide-pad"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "III. Close cycle impact."), /*#__PURE__*/React.createElement("h2", null, "Kraus-Maffei cut their month-end close from 17 days to 4."), /*#__PURE__*/React.createElement("div", {
    className: "midrule"
  }), /*#__PURE__*/React.createElement("div", {
    className: "proof"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chart"
  }, /*#__PURE__*/React.createElement("h4", null, "Business days to consolidated trial balance"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Trailing 18 months \xB7 posted, not estimated"), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 400 240",
    preserveAspectRatio: "xMidYMid meet"
  }, [60, 120, 180].map(y => /*#__PURE__*/React.createElement("line", {
    key: y,
    x1: "30",
    x2: "390",
    y1: y,
    y2: y,
    stroke: "#D8D4CA",
    strokeWidth: "0.5"
  })), [{
    x: 20,
    h: 130
  }, {
    x: 45,
    h: 125
  }, {
    x: 70,
    h: 135
  }, {
    x: 95,
    h: 118
  }, {
    x: 120,
    h: 112
  }, {
    x: 145,
    h: 108
  }, {
    x: 170,
    h: 88
  }, {
    x: 195,
    h: 70
  }, {
    x: 220,
    h: 62
  }, {
    x: 245,
    h: 50
  }, {
    x: 270,
    h: 44
  }, {
    x: 295,
    h: 38
  }, {
    x: 320,
    h: 34
  }, {
    x: 345,
    h: 32
  }, {
    x: 370,
    h: 30
  }].map((b, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("rect", {
    x: b.x + 30,
    y: 200 - b.h,
    width: "16",
    height: b.h,
    fill: "#3B5D82",
    opacity: i < 6 ? 0.4 : 1
  }))), /*#__PURE__*/React.createElement("line", {
    x1: "193",
    x2: "193",
    y1: "10",
    y2: "200",
    stroke: "#B4442C",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("text", {
    x: "198",
    y: "22",
    fontFamily: "JetBrains Mono",
    fontSize: "11",
    fill: "#B4442C"
  }, "EnXi go-live \xB7 Jul 2025"), /*#__PURE__*/React.createElement("text", {
    x: "198",
    y: "36",
    fontFamily: "JetBrains Mono",
    fontSize: "10",
    fill: "#B4442C",
    opacity: "0.7"
  }, "phase 2 of 4"), ['Nov 24', 'Feb 25', 'May 25', 'Aug 25', 'Nov 25', 'Feb 26'].map((t, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: 40 + i * 60,
    y: "220",
    fontFamily: "JetBrains Mono",
    fontSize: "11",
    fill: "#8A8A8A"
  }, t)), [0, 5, 10, 15].map((v, i) => /*#__PURE__*/React.createElement("text", {
    key: v,
    x: "20",
    y: 205 - i * 45,
    fontFamily: "JetBrains Mono",
    fontSize: "11",
    fill: "#8A8A8A",
    textAnchor: "end"
  }, v, "d"))), /*#__PURE__*/React.createElement("div", {
    className: "cite"
  }, "Source: Kraus-Maffei Industrial internal close records \xB7 Verified 2026-03-30 \xB7 n=18 monthly closes")), /*#__PURE__*/React.createElement("div", {
    className: "stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, "4", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "days")), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "March 2026 close cycle, consolidated trial balance")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, /*#__PURE__*/React.createElement("span", {
    className: "accent"
  }, "\u221276%")), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Reduction in manual reconciliations, year-over-year"))))), /*#__PURE__*/React.createElement(SlideFooter, {
    deck: "Customer case \xB7 Kraus-Maffei",
    section: "III. Close cycle impact",
    page: "14 / 28",
    date: "2026-05-14"
  }));
}
function SectionSlide() {
  return /*#__PURE__*/React.createElement("div", {
    className: "slide slide-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slide-pad"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("div", {
    className: "roman"
  }, "IV"), /*#__PURE__*/React.createElement("h2", null, "What still isn't solved."), /*#__PURE__*/React.createElement("div", {
    className: "topic"
  }, "Honest accounting \xB7 Intercompany FX \xB7 HR integration \xB7 Consolidated cash forecasting")), /*#__PURE__*/React.createElement(SlideFooter, {
    deck: "Customer case \xB7 Kraus-Maffei",
    section: "IV. Open questions",
    page: "22 / 28",
    date: "2026-05-14"
  }));
}
window.TitleSlide = TitleSlide;
window.ClaimSlide = ClaimSlide;
window.SectionSlide = SectionSlide;
})(); } catch (e) { __ds_ns.__errors.push({ path: "slides/Slides.jsx", error: String((e && e.message) || e) }); }

// slides/deck-stage.js
try { (() => {
/**
 * <deck-stage> — reusable web component for HTML decks.
 *
 * Handles:
 *  (a) speaker notes — reads <script type="application/json" id="speaker-notes">
 *      and posts {slideIndexChanged: N} to the parent window on nav.
 *  (b) keyboard navigation — ←/→, PgUp/PgDn, Space, Home/End, number keys.
 *  (c) press R to reset to slide 0 (with a tasteful keyboard hint).
 *  (d) bottom-center overlay showing slide count + hints, fades out on idle.
 *  (e) auto-scaling — inner canvas is a fixed design size (default 1920×1080)
 *      scaled with `transform: scale()` to fit the viewport, letterboxed.
 *      Set the `noscale` attribute to render at authored size (1:1) — the
 *      PPTX exporter sets this so its DOM capture sees unscaled geometry.
 *  (f) print — `@media print` lays every slide out as its own page at the
 *      design size, so the browser's Print → Save as PDF produces a clean
 *      one-page-per-slide PDF with no extra setup.
 *
 * Slides are HIDDEN, not unmounted. Non-active slides stay in the DOM with
 * `visibility: hidden` + `opacity: 0`, so their state (videos, iframes,
 * form inputs, React trees) is preserved across navigation.
 *
 * Lifecycle event — the component dispatches a `slidechange` CustomEvent on
 * itself whenever the active slide changes (including the initial mount).
 * The event bubbles and composes out of shadow DOM, so you can listen on
 * the <deck-stage> element or on document:
 *
 *   document.querySelector('deck-stage').addEventListener('slidechange', (e) => {
 *     e.detail.index         // new 0-based index
 *     e.detail.previousIndex // previous index, or -1 on init
 *     e.detail.total         // total slide count
 *     e.detail.slide         // the new active slide element
 *     e.detail.previousSlide // the prior slide element, or null on init
 *     e.detail.reason        // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
 *   });
 *
 * Persistence: current slide index is saved to localStorage keyed by the
 * document path, so refresh returns you to the same place.
 *
 * Usage:
 *   <deck-stage width="1920" height="1080">
 *     <section data-label="Title">...</section>
 *     <section data-label="Agenda">...</section>
 *   </deck-stage>
 *
 * Slides are the direct element children of <deck-stage>. Each slide is
 * automatically tagged with:
 *   - data-screen-label="NN Label"   (1-indexed, for comment flow)
 *   - data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"
 */

(() => {
  const DESIGN_W_DEFAULT = 1920;
  const DESIGN_H_DEFAULT = 1080;
  const STORAGE_PREFIX = 'deck-stage:slide:';
  const OVERLAY_HIDE_MS = 1800;
  const VALIDATE_ATTR = 'no_overflowing_text,no_overlapping_text,slide_sized_text';
  const pad2 = n => String(n).padStart(2, '0');
  const stylesheet = `
    :host {
      position: fixed;
      inset: 0;
      display: block;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      background: #fff;
      will-change: transform;
    }

    /* Slides live in light DOM (via <slot>) so authored CSS still applies.
       We absolutely position each slotted child to stack them. */
    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    ::slotted([data-deck-active]) {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    /* Tap zones for mobile — back/forward thirds like Stories.
       Transparent, no visible UI, don't block the overlay. */
    .tapzones {
      position: fixed;
      inset: 0;
      display: flex;
      z-index: 2147482000;
      pointer-events: none;
    }
    .tapzone {
      flex: 1;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
    }
    /* Only activate tap zones on coarse pointers (touch devices). */
    @media (hover: hover) and (pointer: fine) {
      .tapzones { display: none; }
    }

    .overlay {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translate(-50%, 6px) scale(0.92);
      filter: blur(6px);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: #000;
      color: #fff;
      border-radius: 999px;
      font-size: 12px;
      font-feature-settings: "tnum" 1;
      letter-spacing: 0.01em;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease;
      transform-origin: center bottom;
      z-index: 2147483000;
      user-select: none;
    }
    .overlay[data-visible] {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
      filter: blur(0);
    }

    .btn {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: default;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 28px;
      border-radius: 999px;
      color: rgba(255,255,255,0.72);
      transition: background 140ms ease, color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .btn:active { background: rgba(255,255,255,0.18); }
    .btn:focus { outline: none; }
    .btn:focus-visible { outline: none; }
    .btn::-moz-focus-inner { border: 0; }
    .btn svg { width: 14px; height: 14px; display: block; }
    .btn.reset {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0 10px 0 12px;
      gap: 6px;
      color: rgba(255,255,255,0.72);
    }
    .btn.reset .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1;
      color: rgba(255,255,255,0.88);
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    .count {
      font-variant-numeric: tabular-nums;
      color: #fff;
      font-weight: 500;
      padding: 0 8px;
      min-width: 42px;
      text-align: center;
      font-size: 12px;
    }
    .count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }
    .count .total { color: rgba(255,255,255,0.55); }

    .divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.18);
      margin: 0 2px;
    }

    /* ── Print: one page per slide, no chrome ────────────────────────────
       The screen layout stacks every slide at inset:0 inside a scaled
       canvas; for print we want them in document flow at the authored
       design size so the browser paginates one slide per sheet. The
       @page size is set from the width/height attributes via the inline
       <style id="deck-stage-print-page"> that connectedCallback injects
       into <head> (the @page at-rule has no effect inside shadow DOM). */
    @media print {
      :host {
        position: static;
        inset: auto;
        background: none;
        overflow: visible;
        color: inherit;
      }
      .stage { position: static; display: block; }
      .canvas {
        transform: none !important;
        width: auto !important;
        height: auto !important;
        background: none;
        will-change: auto;
      }
      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        width: var(--deck-design-w) !important;
        height: var(--deck-design-h) !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        break-after: page;
        page-break-after: always;
        break-inside: avoid;
        overflow: hidden;
      }
      ::slotted(*:last-child) {
        break-after: auto;
        page-break-after: auto;
      }
      .overlay, .tapzones { display: none !important; }
    }
  `;
  class DeckStage extends HTMLElement {
    static get observedAttributes() {
      return ['width', 'height', 'noscale'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._index = 0;
      this._slides = [];
      this._notes = [];
      this._hideTimer = null;
      this._mouseIdleTimer = null;
      this._storageKey = STORAGE_PREFIX + (location.pathname || '/');
      this._onKey = this._onKey.bind(this);
      this._onResize = this._onResize.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onTapBack = this._onTapBack.bind(this);
      this._onTapForward = this._onTapForward.bind(this);
    }
    get designWidth() {
      return parseInt(this.getAttribute('width'), 10) || DESIGN_W_DEFAULT;
    }
    get designHeight() {
      return parseInt(this.getAttribute('height'), 10) || DESIGN_H_DEFAULT;
    }
    connectedCallback() {
      this._render();
      this._loadNotes();
      this._syncPrintPageRule();
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove, {
        passive: true
      });
      // Initial collection + layout happens via slotchange, which fires on mount.
    }
    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
      if (this._hideTimer) clearTimeout(this._hideTimer);
      if (this._mouseIdleTimer) clearTimeout(this._mouseIdleTimer);
    }
    attributeChangedCallback() {
      if (this._canvas) {
        this._canvas.style.width = this.designWidth + 'px';
        this._canvas.style.height = this.designHeight + 'px';
        this._canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
        this._canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
        this._fit();
        this._syncPrintPageRule();
      }
    }
    _render() {
      const style = document.createElement('style');
      style.textContent = stylesheet;
      const stage = document.createElement('div');
      stage.className = 'stage';
      const canvas = document.createElement('div');
      canvas.className = 'canvas';
      canvas.style.width = this.designWidth + 'px';
      canvas.style.height = this.designHeight + 'px';
      canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
      canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
      const slot = document.createElement('slot');
      slot.addEventListener('slotchange', this._onSlotChange);
      canvas.appendChild(slot);
      stage.appendChild(canvas);

      // Tap zones (mobile): left third = back, right third = forward.
      const tapzones = document.createElement('div');
      tapzones.className = 'tapzones export-hidden';
      tapzones.setAttribute('aria-hidden', 'true');
      const tzBack = document.createElement('div');
      tzBack.className = 'tapzone tapzone--back';
      const tzMid = document.createElement('div');
      tzMid.className = 'tapzone tapzone--mid';
      tzMid.style.pointerEvents = 'none';
      const tzFwd = document.createElement('div');
      tzFwd.className = 'tapzone tapzone--fwd';
      tzBack.addEventListener('click', this._onTapBack);
      tzFwd.addEventListener('click', this._onTapForward);
      tapzones.append(tzBack, tzMid, tzFwd);

      // Overlay: compact, solid black, with clickable controls.
      const overlay = document.createElement('div');
      overlay.className = 'overlay export-hidden';
      overlay.setAttribute('role', 'toolbar');
      overlay.setAttribute('aria-label', 'Deck controls');
      overlay.innerHTML = `
        <button class="btn prev" type="button" aria-label="Previous slide" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>
        <button class="btn next" type="button" aria-label="Next slide" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <span class="divider"></span>
        <button class="btn reset" type="button" aria-label="Reset to first slide" title="Reset (R)">Reset<span class="kbd">R</span></button>
      `;
      overlay.querySelector('.prev').addEventListener('click', () => this._go(this._index - 1, 'click'));
      overlay.querySelector('.next').addEventListener('click', () => this._go(this._index + 1, 'click'));
      overlay.querySelector('.reset').addEventListener('click', () => this._go(0, 'click'));
      this._root.append(style, stage, tapzones, overlay);
      this._canvas = canvas;
      this._slot = slot;
      this._overlay = overlay;
      this._countEl = overlay.querySelector('.current');
      this._totalEl = overlay.querySelector('.total');
    }

    /** @page must live in the document stylesheet — it's a no-op inside
     *  shadow DOM. Inject/update a single <head> style tag so the print
     *  sheet matches the design size and Save-as-PDF yields one slide per
     *  page with no margins. */
    _syncPrintPageRule() {
      const id = 'deck-stage-print-page';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
        document.head.appendChild(tag);
      }
      tag.textContent = '@page { size: ' + this.designWidth + 'px ' + this.designHeight + 'px; margin: 0; } ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; overflow: visible !important; height: auto !important; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
    }
    _onSlotChange() {
      this._collectSlides();
      this._restoreIndex();
      this._applyIndex({
        showOverlay: false,
        broadcast: true,
        reason: 'init'
      });
      this._fit();
    }
    _collectSlides() {
      const assigned = this._slot.assignedElements({
        flatten: true
      });
      this._slides = assigned.filter(el => {
        // Skip template/style/script nodes even if someone slots them.
        const tag = el.tagName;
        return tag !== 'TEMPLATE' && tag !== 'SCRIPT' && tag !== 'STYLE';
      });
      this._slides.forEach((slide, i) => {
        const n = i + 1;
        // Determine a label for comment flow: prefer explicit data-label,
        // then an existing data-screen-label, then first heading, else "Slide".
        let label = slide.getAttribute('data-label');
        if (!label) {
          const existing = slide.getAttribute('data-screen-label');
          if (existing) {
            // Strip any leading number the author may have included.
            label = existing.replace(/^\s*\d+\s*/, '').trim() || existing;
          }
        }
        if (!label) {
          const h = slide.querySelector('h1, h2, h3, [data-title]');
          if (h) label = (h.textContent || '').trim().slice(0, 40);
        }
        if (!label) label = 'Slide';
        slide.setAttribute('data-screen-label', `${pad2(n)} ${label}`);

        // Validation attribute for comment flow / auto-checks.
        if (!slide.hasAttribute('data-om-validate')) {
          slide.setAttribute('data-om-validate', VALIDATE_ATTR);
        }
        slide.setAttribute('data-deck-slide', String(i));
      });
      if (this._totalEl) this._totalEl.textContent = String(this._slides.length || 1);
      if (this._index >= this._slides.length) this._index = Math.max(0, this._slides.length - 1);
    }
    _loadNotes() {
      const tag = document.getElementById('speaker-notes');
      if (!tag) {
        this._notes = [];
        return;
      }
      try {
        const parsed = JSON.parse(tag.textContent || '[]');
        if (Array.isArray(parsed)) this._notes = parsed;
      } catch (e) {
        console.warn('[deck-stage] Failed to parse #speaker-notes JSON:', e);
        this._notes = [];
      }
    }
    _restoreIndex() {
      try {
        const raw = localStorage.getItem(this._storageKey);
        if (raw != null) {
          const n = parseInt(raw, 10);
          if (Number.isFinite(n) && n >= 0 && n < this._slides.length) {
            this._index = n;
          }
        }
      } catch (e) {/* ignore */}
    }
    _persistIndex() {
      try {
        localStorage.setItem(this._storageKey, String(this._index));
      } catch (e) {/* ignore */}
    }
    _applyIndex({
      showOverlay = true,
      broadcast = true,
      reason = 'init'
    } = {}) {
      if (!this._slides.length) return;
      const prev = this._prevIndex == null ? -1 : this._prevIndex;
      const curr = this._index;
      this._slides.forEach((s, i) => {
        if (i === curr) s.setAttribute('data-deck-active', '');else s.removeAttribute('data-deck-active');
      });
      if (this._countEl) this._countEl.textContent = String(curr + 1);
      this._persistIndex();
      if (broadcast) {
        // (1) Legacy: host-window postMessage for speaker-notes renderers.
        try {
          window.postMessage({
            slideIndexChanged: curr
          }, '*');
        } catch (e) {}

        // (2) In-page CustomEvent on the <deck-stage> element itself.
        //     Bubbles and composes out of shadow DOM so slide code can listen:
        //       document.querySelector('deck-stage').addEventListener('slidechange', e => {
        //         e.detail.index, e.detail.previousIndex, e.detail.total, e.detail.slide, e.detail.reason
        //       });
        const detail = {
          index: curr,
          previousIndex: prev,
          total: this._slides.length,
          slide: this._slides[curr] || null,
          previousSlide: prev >= 0 ? this._slides[prev] || null : null,
          reason: reason // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
        };
        this.dispatchEvent(new CustomEvent('slidechange', {
          detail,
          bubbles: true,
          composed: true
        }));
      }
      this._prevIndex = curr;
      if (showOverlay) this._flashOverlay();
    }
    _flashOverlay() {
      if (!this._overlay) return;
      this._overlay.setAttribute('data-visible', '');
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._overlay.removeAttribute('data-visible');
      }, OVERLAY_HIDE_MS);
    }
    _fit() {
      if (!this._canvas) return;
      // PPTX export sets noscale so the DOM capture sees authored-size
      // geometry — the scaled canvas is in shadow DOM, so the exporter's
      // resetTransformSelector can't reach .canvas.style.transform directly.
      if (this.hasAttribute('noscale')) {
        this._canvas.style.transform = 'none';
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / this.designWidth, vh / this.designHeight);
      this._canvas.style.transform = `scale(${s})`;
    }
    _onResize() {
      this._fit();
    }
    _onMouseMove() {
      // Keep overlay visible while mouse moves; hide after idle.
      this._flashOverlay();
    }
    _onTapBack(e) {
      e.preventDefault();
      this._go(this._index - 1, 'tap');
    }
    _onTapForward(e) {
      e.preventDefault();
      this._go(this._index + 1, 'tap');
    }
    _onKey(e) {
      // Ignore when the user is typing.
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      let handled = true;
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || key === 'Spacebar') {
        this._go(this._index + 1, 'keyboard');
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        this._go(this._index - 1, 'keyboard');
      } else if (key === 'Home') {
        this._go(0, 'keyboard');
      } else if (key === 'End') {
        this._go(this._slides.length - 1, 'keyboard');
      } else if (key === 'r' || key === 'R') {
        this._go(0, 'keyboard');
      } else if (/^[0-9]$/.test(key)) {
        // 1..9 jump to that slide; 0 jumps to 10.
        const n = key === '0' ? 9 : parseInt(key, 10) - 1;
        if (n < this._slides.length) this._go(n, 'keyboard');
      } else {
        handled = false;
      }
      if (handled) {
        e.preventDefault();
        this._flashOverlay();
      }
    }
    _go(i, reason = 'api') {
      if (!this._slides.length) return;
      const clamped = Math.max(0, Math.min(this._slides.length - 1, i));
      if (clamped === this._index) {
        this._flashOverlay();
        return;
      }
      this._index = clamped;
      this._applyIndex({
        showOverlay: true,
        broadcast: true,
        reason
      });
    }

    // Public API ------------------------------------------------------------

    /** Current slide index (0-based). */
    get index() {
      return this._index;
    }
    /** Total slide count. */
    get length() {
      return this._slides.length;
    }
    /** Programmatically navigate. */
    goTo(i) {
      this._go(i, 'api');
    }
    next() {
      this._go(this._index + 1, 'api');
    }
    prev() {
      this._go(this._index - 1, 'api');
    }
    reset() {
      this._go(0, 'api');
    }
  }
  if (!customElements.get('deck-stage')) {
    customElements.define('deck-stage', DeckStage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "slides/deck-stage.js", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Pages.jsx
try { (() => {
const {
  useState: useStateM,
  useEffect: useEffectM
} = React;
function SiteHeader({
  page,
  setPage
}) {
  const [scrolled, setScrolled] = useStateM(false);
  useEffectM(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const go = p => e => {
    e.preventDefault();
    setPage(p);
    window.scrollTo({
      top: 0
    });
  };
  return /*#__PURE__*/React.createElement("header", {
    className: 'site-header' + (scrolled ? ' scrolled' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "site-header-inner"
  }, /*#__PURE__*/React.createElement("a", {
    className: "wm",
    href: "#",
    onClick: go('home')
  }, /*#__PURE__*/React.createElement("span", {
    className: "tick"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("span", null, "EnXi")), /*#__PURE__*/React.createElement("nav", {
    className: "site-nav"
  }, /*#__PURE__*/React.createElement("a", {
    onClick: go('home'),
    className: page === 'home' ? 'active' : ''
  }, "Product"), /*#__PURE__*/React.createElement("a", null, "Solutions"), /*#__PURE__*/React.createElement("a", {
    onClick: go('case'),
    className: page === 'case' ? 'active' : ''
  }, "Customers"), /*#__PURE__*/React.createElement("a", null, "Analyst desk"), /*#__PURE__*/React.createElement("a", null, "Pricing"), /*#__PURE__*/React.createElement("span", {
    className: "divider"
  }, "\xB7"), /*#__PURE__*/React.createElement("a", {
    onClick: go('notfor'),
    className: page === 'notfor' ? 'active' : ''
  }, "Not for"), /*#__PURE__*/React.createElement("a", null, "Sign in"))));
}
function SiteFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "site-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ledger"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-full site-footer-cols"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tick"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("span", null, "EnXi")), /*#__PURE__*/React.createElement("p", {
    className: "msig"
  }, "ERP for operators who have run one before. Made in Utrecht and Brooklyn.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", null, "Product"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Financials")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Operations")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Supply chain")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Close cycle")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", null, "Trust"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Public changelog")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Incident history")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Security")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Not good for")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", null, "Company"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Analyst desk")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Print quarterly")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Careers (4)")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", null, "Contact"))))), /*#__PURE__*/React.createElement("div", {
    className: "col-full row"
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 EnXi Systems B.V. \xB7 Utrecht, NL"), /*#__PURE__*/React.createElement("span", null, "Build 2026.04.20-r318 \xB7 Compiled 08:12 CET"))));
}
function Home({
  setPage
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "ledger hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-main"
  }, /*#__PURE__*/React.createElement("p", {
    className: "hero-quote"
  }, "\"We closed our March books on April 4th. Last year we were still closing on April\xA021st.\""), /*#__PURE__*/React.createElement("hr", {
    className: "hairline",
    style: {
      margin: '24px 0 16px'
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "hero-byline"
  }, "\u2014 Dana Reyes, CFO \xB7 Kraus-Maffei Industrial \xB7 Posted 2026-04-14"), /*#__PURE__*/React.createElement("p", {
    className: "hero-subline"
  }, "EnXi is an ERP for operators who have run one before. Financial close, procure-to-pay, project accounting, and variance analysis on a single ledger."), /*#__PURE__*/React.createElement("a", {
    className: "hero-cta",
    onClick: e => {
      e.preventDefault();
      setPage('case');
    }
  }, "See a customer's live dashboard ", /*#__PURE__*/React.createElement("span", {
    className: "arrow"
  }, "\u2197"))), /*#__PURE__*/React.createElement("div", {
    className: "col-marg hero-filed"
  }, /*#__PURE__*/React.createElement("b", null, "Filed under"), "Close cycles", /*#__PURE__*/React.createElement("br", null), "Manufacturing", /*#__PURE__*/React.createElement("br", null), "Mid-market", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", null, "Reading time"), "4 min to the claim.", /*#__PURE__*/React.createElement("br", null), "12 min to the proof.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", null, "Audited"), "By buyer's internal finance.", /*#__PURE__*/React.createElement("br", null), "See \xA7 \"Methodology\".")), /*#__PURE__*/React.createElement("section", {
    className: "ledger section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "I \xB7 The claim"), /*#__PURE__*/React.createElement("h2", {
    className: "lede"
  }, "Close the books in 4 days, not 17."), /*#__PURE__*/React.createElement("p", {
    className: "nut"
  }, "Mid-market manufacturers close, on median, in 9.4 business days. EnXi customers close in 4.1 \u2014 because the ledger, the subledgers, the intercompany book, and the variance model sit on one substrate, reconciled continuously, not at period-end.")), /*#__PURE__*/React.createElement("div", {
    className: "col-main stat-strip"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, "4.1", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: 'var(--enxi-color-ink-40)',
      marginLeft: 6
    }
  }, "d")), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Median close time, EnXi customers")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, "9.4", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: 'var(--enxi-color-ink-40)',
      marginLeft: 6
    }
  }, "d")), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Industry median, mid-market manufacturing")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, /*#__PURE__*/React.createElement("span", {
    className: "accent"
  }, "76%")), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Reduction in late journal entries, year-one")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, "312"), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Firms in the 2026 benchmark cohort"))), /*#__PURE__*/React.createElement("div", {
    className: "col-prose body-serif"
  }, /*#__PURE__*/React.createElement("p", null, "We built EnXi because the people who use an ERP for 7 hours a day did not ask for a reimagined experience. They asked to stop waiting for the subledger to close. To see AR aging without running a report. To find the five journal entries that are actually wrong, without scrolling past the 400 that aren't."), /*#__PURE__*/React.createElement("p", null, "The work of an operations leader is not glamorous, and neither is the software they want. Our product is designed to get out of the way of what they already know how to do \u2014 not to teach them a new way of thinking about their business.")), /*#__PURE__*/React.createElement("div", {
    className: "col-marg marg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Cohort \xB7 2026 benchmark"), "312 mid-market firms, $50M\u2013$2B revenue, surveyed Jan\u2013Mar 2026. Full methodology at /analyst/methodology."), /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Close cycle"), "From period-end calendar date to posted consolidated trial balance. Excludes statutory audit adjustments."), /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Footnote"), "Median is used rather than mean. The mean is pulled by four outliers with 60+ day close cycles.")), /*#__PURE__*/React.createElement("div", {
    className: "col-main pullq"
  }, "\"The first month on EnXi, I found a $412,000 variance my old ERP had been quietly distributing across four cost centers for two years. The variance didn't cost us money. The software hiding it did.\"", /*#__PURE__*/React.createElement("cite", null, "\u2014 R. Okafor, Controller \xB7 Helianthus Processing \xB7 2026-03-02"))), /*#__PURE__*/React.createElement("section", {
    className: "ledger section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "II \xB7 The evidence"), /*#__PURE__*/React.createElement("h2", {
    className: "lede"
  }, "Close cycle by cohort, 2022\u20132026.")), /*#__PURE__*/React.createElement("div", {
    className: "col-main chart-block"
  }, /*#__PURE__*/React.createElement("h4", null, "Business days to posted consolidated trial balance"), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, "n=312 firms \xB7 reported by CFO or controller \xB7 verified against posted close date"), /*#__PURE__*/React.createElement("div", {
    className: "chart-svg"
  }, /*#__PURE__*/React.createElement(SmallMultiples, null)), /*#__PURE__*/React.createElement("div", {
    className: "cite"
  }, "Source: EnXi 2026 Close Benchmarks \xB7 n=312 firms \xB7 Published 2026-04-18 \xB7 Methodology: analyst/methodology")), /*#__PURE__*/React.createElement("div", {
    className: "col-marg marg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Chart note"), "Small multiples, not stacked. Pie charts are forbidden in our style guide \u2014 they obscure change over time."), /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Cohort drift"), "7 firms left the cohort 2024\u21922026 (acquisition, divestiture). They are excluded from trend."))), /*#__PURE__*/React.createElement("section", {
    className: "ledger section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "III \xB7 The counter-argument"), /*#__PURE__*/React.createElement("h2", {
    className: "lede"
  }, "EnXi is not the right ERP for everyone."), /*#__PURE__*/React.createElement("p", {
    className: "nut"
  }, "We publish a dedicated page listing the organizations we are a poor fit for: pre-Series A startups, pure e-commerce retailers without inventory, consultancies under 50 people. If you're in one of those categories, save the six months and buy NetSuite."), /*#__PURE__*/React.createElement("a", {
    className: "hero-cta",
    onClick: e => {
      e.preventDefault();
      setPage('notfor');
    }
  }, "Read \"Not good for\" ", /*#__PURE__*/React.createElement("span", {
    className: "arrow"
  }, "\u2197")))));
}
function SmallMultiples() {
  const cohorts = [{
    label: 'EnXi customers',
    data: [7.2, 6.4, 5.2, 4.6, 4.1],
    accent: true
  }, {
    label: 'Industry median',
    data: [11.2, 10.8, 10.1, 9.6, 9.4]
  }, {
    label: 'Top quartile',
    data: [6.8, 6.2, 5.9, 5.6, 5.4]
  }, {
    label: 'Bottom quartile',
    data: [19.4, 18.8, 18.1, 17.6, 17.1]
  }];
  const years = ['2022', '2023', '2024', '2025', '2026'];
  const max = 20;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 800 240",
    preserveAspectRatio: "xMidYMid meet"
  }, cohorts.map((c, i) => {
    const ox = i % 4 * 200;
    const oy = 10;
    const w = 170,
      h = 180;
    const pts = c.data.map((v, j) => {
      const x = ox + 14 + j / (c.data.length - 1) * (w - 28);
      const y = oy + (1 - v / max) * h;
      return [x, y];
    });
    const path = pts.map((p, j) => (j === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("text", {
      x: ox + 14,
      y: oy - 2,
      fontSize: "11",
      fontFamily: "Inter",
      fill: "#4A4A4A",
      fontWeight: "600"
    }, c.label), /*#__PURE__*/React.createElement("line", {
      x1: ox + 14,
      x2: ox + w - 14,
      y1: oy + h,
      y2: oy + h,
      stroke: "#D8D4CA",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("path", {
      d: path,
      stroke: c.accent ? '#B4442C' : '#1B2A3A',
      strokeWidth: c.accent ? 1.8 : 1.2,
      fill: "none"
    }), pts.map((p, j) => /*#__PURE__*/React.createElement("circle", {
      key: j,
      cx: p[0],
      cy: p[1],
      r: "2",
      fill: c.accent ? '#B4442C' : '#1B2A3A'
    })), /*#__PURE__*/React.createElement("text", {
      x: pts[pts.length - 1][0],
      y: pts[pts.length - 1][1] - 8,
      fontSize: "11",
      fontFamily: "JetBrains Mono",
      fill: c.accent ? '#B4442C' : '#1A1A1A',
      textAnchor: "end"
    }, c.data[c.data.length - 1].toFixed(1), "d"), years.map((y, yi) => /*#__PURE__*/React.createElement("text", {
      key: yi,
      x: ox + 14 + yi / (years.length - 1) * (w - 28),
      y: oy + h + 14,
      fontSize: "9",
      fontFamily: "JetBrains Mono",
      fill: "#8A8A8A",
      textAnchor: "middle"
    }, y.slice(2))));
  }));
}
function CaseStudy() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "ledger page-lede"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "Customer \xB7 Post-mortem \xB7 6 min read"), /*#__PURE__*/React.createElement("h1", {
    className: "title"
  }, "Kraus-Maffei Industrial cut their month-end close from 17 days to 4."), /*#__PURE__*/React.createElement("p", {
    className: "dek"
  }, "A controlled post-mortem of a 14-month implementation. Includes what we got wrong, what the customer had to change, and what still isn't solved."), /*#__PURE__*/React.createElement("p", {
    className: "byline"
  }, "By the EnXi implementation team \xB7 Written with D. Reyes, CFO \xB7 Verified 2026-03-30 \xB7 4,182 words"))), /*#__PURE__*/React.createElement("section", {
    className: "ledger section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "roman"
  }, "I"), /*#__PURE__*/React.createElement("h2", {
    className: "sect-title"
  }, "Situation before")), /*#__PURE__*/React.createElement("div", {
    className: "col-prose body-serif"
  }, /*#__PURE__*/React.createElement("p", null, "In December 2024, Kraus-Maffei's finance team closed their November books on December 18th. The controller's team had worked through the weekend twice. Three journal entries were posted after the board meeting. The CFO filed the Q4 report late."), /*#__PURE__*/React.createElement("p", null, "The ERP in place \u2014 a 2008-era on-prem installation, heavily customized \u2014 had last been upgraded in 2017. Ten of the twenty-two customizations had undocumented dependencies. The intercompany book was reconciled quarterly, in Excel. The close cycle was a recurring crisis.")), /*#__PURE__*/React.createElement("div", {
    className: "col-marg marg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Baseline \xB7 Nov 2024"), "Close: 17 business days", /*#__PURE__*/React.createElement("br", null), "Unposted JEs at close: 41", /*#__PURE__*/React.createElement("br", null), "Manual reconciliations: 64"), /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Team"), "1 CFO, 1 Controller, 4 senior accountants, 2 AP, 2 AR, 3 analysts")), /*#__PURE__*/React.createElement("div", {
    className: "col-main",
    style: {
      marginTop: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "roman"
  }, "II"), /*#__PURE__*/React.createElement("h2", {
    className: "sect-title"
  }, "What we changed")), /*#__PURE__*/React.createElement("div", {
    className: "col-prose body-serif"
  }, /*#__PURE__*/React.createElement("p", null, "Implementation ran from January 2025 to March 2026, in four phases. The first phase migrated the GL and AP; the second, AR and fixed assets; the third, intercompany and consolidation; the fourth, the close workflow itself."), /*#__PURE__*/React.createElement("p", null, "We were wrong twice. Once, we underestimated the intercompany remediation \u2014 a six-week slip. Once, we shipped a variance model that silently rounded a class of micro-entries; we caught it in UAT and fixed it, but it belongs in this document.")), /*#__PURE__*/React.createElement("div", {
    className: "col-marg marg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Milestone \xB7 Jul 2025"), "Phase 2 go-live. First close on EnXi: 11 days."), /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Slip \xB7 Sep 2025"), "Intercompany remediation +6 weeks. Root cause: undocumented allocation rules.")), /*#__PURE__*/React.createElement("div", {
    className: "col-main pullq"
  }, "\"We were prepared to hear 'your data is clean.' We were not prepared to hear 'half of your allocation rules have never been written down, and the one person who remembered them retired in 2019.' We had to do that work ourselves.\"", /*#__PURE__*/React.createElement("cite", null, "\u2014 D. Reyes, CFO \xB7 Kraus-Maffei Industrial")), /*#__PURE__*/React.createElement("div", {
    className: "col-main",
    style: {
      marginTop: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "roman"
  }, "III"), /*#__PURE__*/React.createElement("h2", {
    className: "sect-title"
  }, "Results, as of Mar 2026")), /*#__PURE__*/React.createElement("div", {
    className: "col-main stat-strip"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, "4", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: 'var(--enxi-color-ink-40)'
    }
  }, "d")), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "March 2026 close")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, "76%"), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Reduction in manual reconciliations")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, /*#__PURE__*/React.createElement("span", {
    className: "accent"
  }, "3")), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Senior accountants reassigned from close to FP&A")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "n"
  }, "$412k"), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Variance recovered in month one (historical error)"))), /*#__PURE__*/React.createElement("div", {
    className: "col-main",
    style: {
      marginTop: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "roman"
  }, "IV"), /*#__PURE__*/React.createElement("h2", {
    className: "sect-title"
  }, "What still isn't solved")), /*#__PURE__*/React.createElement("div", {
    className: "col-prose body-serif"
  }, /*#__PURE__*/React.createElement("p", null, "Consolidated cash forecasting across the six operating entities still runs partly in Excel. The integration with Kraus-Maffei's Oracle HR instance is scheduled for Q3 2026 and carries implementation risk. Intercompany FX settlement takes two days longer than it should, because of a Bundesbank filing step we have not yet automated."), /*#__PURE__*/React.createElement("p", null, "These are honest. We will update this case study when they are resolved, and we will update it when they are not.")), /*#__PURE__*/React.createElement("div", {
    className: "col-marg marg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Next review"), "2026-Q3, with D. Reyes"), /*#__PURE__*/React.createElement("div", {
    className: "entry"
  }, /*#__PURE__*/React.createElement("b", null, "Change log for this page"), "2026-03-30 \u2014 initial publication", /*#__PURE__*/React.createElement("br", null), "2026-04-14 \u2014 updated March 2026 close figure from 5d to 4d"))));
}
function NotFor({
  setPage
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "ledger page-lede"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "Trust \xB7 3 min read"), /*#__PURE__*/React.createElement("h1", {
    className: "title"
  }, "EnXi is not the right ERP for everyone. Here's who we're a poor fit for."), /*#__PURE__*/React.createElement("p", {
    className: "dek"
  }, "We publish this page because the alternative \u2014 letting you find out during implementation \u2014 is worse for both of us. If you are in one of these categories, save the six months and the legal fees."), /*#__PURE__*/React.createElement("p", {
    className: "byline"
  }, "Maintained by the EnXi sales engineering team \xB7 Last updated 2026-04-02"))), /*#__PURE__*/React.createElement("section", {
    className: "ledger section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-wide"
  }, /*#__PURE__*/React.createElement("table", {
    className: "not-for"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "You are\u2026"), /*#__PURE__*/React.createElement("th", null, "Why EnXi is a poor fit"), /*#__PURE__*/React.createElement("th", null, "What we recommend"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "A pre-Series A startup."), /*#__PURE__*/React.createElement("td", null, "You don't need an ERP. You need QuickBooks and a good bookkeeper. EnXi's implementation costs more than your Series A valuation."), /*#__PURE__*/React.createElement("td", null, "QuickBooks Online \u2197")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "A pure e-commerce retailer without physical inventory."), /*#__PURE__*/React.createElement("td", null, "Our inventory, manufacturing, and supply-chain modules are 60% of the product. You'd pay for sophistication you will never use."), /*#__PURE__*/React.createElement("td", null, "Brightpearl or NetSuite \u2197")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "A consultancy with fewer than 50 people."), /*#__PURE__*/React.createElement("td", null, "You need project accounting, not enterprise financials. EnXi's project module is built for manufacturers running multi-year capital projects, not billable-hour shops."), /*#__PURE__*/React.createElement("td", null, "Harvest + Xero \u2197")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "A Fortune 100 enterprise with 40+ operating entities and SAP already deeply embedded."), /*#__PURE__*/React.createElement("td", null, "Our upper bound is 20 entities and $2B revenue. Past that, the consolidation engine has latency we have not yet engineered away. We will tell you this on the first call."), /*#__PURE__*/React.createElement("td", null, "Stay on SAP \u2197")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "A firm that needs a GRC / SOX-certified ERP for a public filing this fiscal year."), /*#__PURE__*/React.createElement("td", null, "We are SOC 2 Type II and ISO 27001, but we are not yet SOX-certified for accelerated filers. That work is in progress for 2027."), /*#__PURE__*/React.createElement("td", null, "Workday or Oracle Fusion \u2197")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Looking for a low-code platform you can heavily customize in-house."), /*#__PURE__*/React.createElement("td", null, "EnXi is opinionated. We believe most customizations are a workaround for a bad process. If your procurement policy is \"we need to customize everything,\" we are the wrong vendor."), /*#__PURE__*/React.createElement("td", null, "Acumatica \u2197"))))), /*#__PURE__*/React.createElement("div", {
    className: "col-main pullq",
    style: {
      marginTop: 48
    }
  }, "\"The 'Not good for' page is the thing we point every prospect to in the first call. Half the time they say, 'oh, we're definitely in your fit.' The other half, we save everybody a wasted quarter.\"", /*#__PURE__*/React.createElement("cite", null, "\u2014 J. Wen, VP Sales Engineering \xB7 EnXi"))));
}
window.SiteHeader = SiteHeader;
window.SiteFooter = SiteFooter;
window.Home = Home;
window.CaseStudy = CaseStudy;
window.NotFor = NotFor;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Pages.jsx", error: String((e && e.message) || e) }); }

// ui_kits/product/DashboardPage.jsx
try { (() => {
const {
  useState: useStateD
} = React;
function DashboardPage({
  setPage
}) {
  const kpis = [{
    lbl: 'Cash position',
    val: '$48.2M',
    delta: '+$1.4M WoW',
    state: 'up',
    strap: 'as of 08:43 · reconciled through Apr 18'
  }, {
    lbl: 'AR 30/60/90',
    val: '12.4 / 3.1 / 1.2',
    delta: '−0.8d DSO',
    state: 'up',
    strap: 'as of 08:40 · Apr 19'
  }, {
    lbl: 'AP due this week',
    val: '$6.81M',
    delta: '41 invoices',
    state: 'warn',
    strap: 'as of 08:43'
  }, {
    lbl: 'Unposted entries',
    val: '27',
    delta: '+4 vs. yest.',
    state: 'down',
    strap: 'as of 08:43'
  }, {
    lbl: 'Close progress',
    val: '62%',
    delta: 'Day 3 of 4',
    state: 'up',
    strap: 'Apr close · on track'
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "micro",
    style: {
      marginBottom: 6
    }
  }, "Morning readout"), /*#__PURE__*/React.createElement("h1", null, "Controller's overview")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "strap"
  }, "Last refresh 08:43 \xB7 auto-updates every 15 min"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary"
  }, "Export\u2026"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary"
  }, "Post batch \u2318\u21B5"))), /*#__PURE__*/React.createElement("div", {
    className: "kpi-row"
  }, kpis.map((k, i) => /*#__PURE__*/React.createElement("div", {
    className: "kpi",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, k.lbl), /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, k.val), /*#__PURE__*/React.createElement("div", {
    className: 'delta ' + k.state
  }, k.delta), /*#__PURE__*/React.createElement("div", {
    className: "strap"
  }, k.strap)))), /*#__PURE__*/React.createElement("div", {
    className: "split"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("h3", null, "Cash position \u2014 trailing 90 days", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "USD, reconciled")), /*#__PURE__*/React.createElement("div", {
    className: "chart-frame"
  }, /*#__PURE__*/React.createElement(CashChart, null))), /*#__PURE__*/React.createElement("div", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("h3", null, "Exceptions", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "7 open")), /*#__PURE__*/React.createElement("ul", {
    className: "xlist"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph danger"
  }, "\u25A0"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "Intercompany balance mismatch \u2014 DE07 \u2194 US03", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "$12,480 \xB7 3 JEs affected")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Review \u2192")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph warn"
  }, "\u25B2"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "AP auto-match confidence below threshold", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "14 invoices \xB7 vendor: Siemens AG")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Review \u2192")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph warn"
  }, "\u25B2"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "FX rate stale (EUR/USD, older than 6h)", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Last fetched 02:14 UTC")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Refresh \u2192")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph info"
  }, "\u25C6"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "New lease obligation requires ASC 842 journal", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Warehouse 4, Munich \xB7 $2.1M")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Open \u2192")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph info"
  }, "\u25C6"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "Bank reconciliation: 4 unmatched items", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Deutsche Bank \xB7 op. account")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Open \u2192"))))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tbl-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Unposted journal entries \u2014 Apr 2026"), /*#__PURE__*/React.createElement("div", {
    className: "tbl-filters"
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip indigo"
  }, /*#__PURE__*/React.createElement("b", null, "Period:"), " Apr 2026 ", /*#__PURE__*/React.createElement("span", {
    className: "x"
  }, "\xD7")), /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, /*#__PURE__*/React.createElement("b", null, "Status:"), " Draft ", /*#__PURE__*/React.createElement("span", {
    className: "x"
  }, "\xD7")), /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, /*#__PURE__*/React.createElement("b", null, "Prepared by:"), " Any ", /*#__PURE__*/React.createElement("span", {
    className: "x"
  }, "\xD7")), /*#__PURE__*/React.createElement("button", {
    className: "ghost-btn"
  }, "+ Filter"))), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 38
    }
  }), /*#__PURE__*/React.createElement("th", null, "Entry"), /*#__PURE__*/React.createElement("th", null, "Description"), /*#__PURE__*/React.createElement("th", null, "Prepared by"), /*#__PURE__*/React.createElement("th", null, "Approver"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Debit"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Credit"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, [['JE-04-1221', 'Accrue utilities — Munich plant', 'M. Fischer', 'D. Reyes', '184,220.00', '184,220.00', 'warn', 'Pending review'], ['JE-04-1222', 'FX revaluation — EUR AR', 'System', '—', '12,481.55', '12,481.55', 'info', 'Auto-prepared'], ['JE-04-1223', 'Depreciation — Fleet Q2', 'K. Tanaka', 'D. Reyes', '91,000.00', '91,000.00', 'warn', 'Pending review'], ['JE-04-1224', 'Lease ASC 842 — Warehouse 4', 'S. Patel', 'D. Reyes', '2,108,402.12', '2,108,402.12', 'danger', 'Variance flagged'], ['JE-04-1225', 'Payroll accrual — bi-weekly', 'A. Novak', 'D. Reyes', '612,304.00', '612,304.00', 'success', 'Ready to post'], ['JE-04-1226', 'Intercompany settlement — DE07↔US03', 'System', '—', '52,118.00', '52,118.00', 'danger', 'Mismatch']].map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: i === 3 ? 'selected' : ''
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: i === 4
  })), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r[0]), /*#__PURE__*/React.createElement("td", null, r[1]), /*#__PURE__*/React.createElement("td", null, r[2]), /*#__PURE__*/React.createElement("td", null, r[3]), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, r[4]), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, r[5]), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: 'chip ' + r[6]
  }, r[7]))))), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "5"
  }, "Total \u2014 6 entries"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "3,060,525.67"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "3,060,525.67"), /*#__PURE__*/React.createElement("td", null))))), /*#__PURE__*/React.createElement("p", {
    className: "micro",
    style: {
      marginTop: 18,
      fontFamily: 'var(--enxi-font-mono)',
      letterSpacing: 0,
      textTransform: 'none',
      fontWeight: 400
    }
  }, "Source: EnXi GL \xB7 tenant: kraus-maffei-de \xB7 as of 2026-04-20 08:43 CET"));
}
function CashChart() {
  // generate a calm, monochrome sequential line chart
  const pts = [];
  const n = 90;
  let y = 44;
  for (let i = 0; i < n; i++) {
    y += Math.sin(i * 0.35) * 0.6 + (Math.random() - 0.4) * 0.7;
    pts.push([i / (n - 1) * 100, y]);
  }
  const min = Math.min(...pts.map(p => p[1])),
    max = Math.max(...pts.map(p => p[1]));
  const path = pts.map((p, i) => {
    const yy = 10 + (1 - (p[1] - min) / (max - min)) * 70;
    return (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + yy.toFixed(2);
  }).join(' ');
  const todayX = 86;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 90",
    preserveAspectRatio: "none"
  }, [20, 40, 60, 80].map(gy => /*#__PURE__*/React.createElement("line", {
    key: gy,
    x1: "0",
    x2: "100",
    y1: gy,
    y2: gy,
    stroke: "#D8D4CA",
    strokeWidth: "0.2"
  })), /*#__PURE__*/React.createElement("path", {
    d: path,
    stroke: "#1B2A3A",
    strokeWidth: "0.6",
    fill: "none",
    vectorEffect: "non-scaling-stroke"
  }), /*#__PURE__*/React.createElement("path", {
    d: path + ` L 100 85 L 0 85 Z`,
    fill: "#1B2A3A",
    opacity: "0.05"
  }), /*#__PURE__*/React.createElement("line", {
    x1: todayX,
    x2: todayX,
    y1: "5",
    y2: "85",
    stroke: "#B4442C",
    strokeWidth: "0.4",
    vectorEffect: "non-scaling-stroke"
  }), /*#__PURE__*/React.createElement("text", {
    x: todayX + 1,
    y: "9",
    fontSize: "2.6",
    fill: "#B4442C",
    fontFamily: "JetBrains Mono"
  }, "Today \xB7 Apr 20"), /*#__PURE__*/React.createElement("text", {
    x: "0",
    y: "89",
    fontSize: "2.4",
    fill: "#8A8A8A",
    fontFamily: "JetBrains Mono"
  }, "Jan 20"), /*#__PURE__*/React.createElement("text", {
    x: "48",
    y: "89",
    fontSize: "2.4",
    fill: "#8A8A8A",
    fontFamily: "JetBrains Mono"
  }, "Mar 05"), /*#__PURE__*/React.createElement("text", {
    x: "92",
    y: "89",
    fontSize: "2.4",
    fill: "#8A8A8A",
    fontFamily: "JetBrains Mono"
  }, "Apr 20"));
}
window.DashboardPage = DashboardPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/product/DashboardPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/product/POPage.jsx
try { (() => {
const {
  useState: useStatePO
} = React;
function POPage({
  setPage,
  setToast
}) {
  const [submitted, setSubmitted] = useStatePO(false);
  const [lines, setLines] = useStatePO([{
    sku: 'HX-4120-B',
    desc: 'Hex bolt M12×40 (zinc, grade 8.8)',
    qty: '2,500',
    uom: 'EA',
    price: '0.84'
  }, {
    sku: 'GK-88-NBR',
    desc: 'Gasket NBR 88 — flange seal',
    qty: '400',
    uom: 'EA',
    price: '3.20'
  }, {
    sku: 'BRG-6204-2Z',
    desc: 'Deep-groove ball bearing 6204-2Z',
    qty: '60',
    uom: 'EA',
    price: '11.40'
  }]);
  const subtotal = lines.reduce((a, l) => a + parseFloat(l.qty.replace(',', '')) * parseFloat(l.price), 0);
  const shipping = 480;
  const tax = subtotal * 0.195;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "crumb"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: 'pointer'
    },
    onClick: () => setPage('dashboard')
  }, "Operations"), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: 'pointer'
    },
    onClick: () => setPage('dashboard')
  }, "Purchase orders"), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "/"), /*#__PURE__*/React.createElement("b", null, "PO-2026-04-0182 \xB7 Draft")), /*#__PURE__*/React.createElement("div", {
    className: "page-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Purchase order \u2014 Siemens AG")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary"
  }, "Save draft"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary"
  }, "Send for approval"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => {
      setSubmitted(true);
      setToast({
        msg: 'PO-2026-04-0182 committed · $9,130.00',
        action: {
          label: 'Undo',
          onClick: () => setSubmitted(false)
        }
      });
      setTimeout(() => setToast(null), 7000);
    }
  }, "Commit PO \u2318\u21B5"))), /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Vendor"), /*#__PURE__*/React.createElement("input", {
    defaultValue: "Siemens AG \xB7 DE-V-00472"
  }), /*#__PURE__*/React.createElement("div", {
    className: "help"
  }, "On-contract vendor \xB7 NET-30")), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Requisitioner"), /*#__PURE__*/React.createElement("input", {
    defaultValue: "K. Tanaka \xB7 Procurement"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Requested ship-to"), /*#__PURE__*/React.createElement("input", {
    defaultValue: "Warehouse 4 \u2014 Munich, DE"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Need-by date"), /*#__PURE__*/React.createElement("input", {
    defaultValue: "2026-05-04",
    className: "mono"
  }), /*#__PURE__*/React.createElement("div", {
    className: "err"
  }, "Vendor lead time is 16 days \u2014 confirm or choose a later date")), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "GL coding"), /*#__PURE__*/React.createElement("input", {
    defaultValue: "5100-PARTS \xB7 Cost center 402"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Project / WBS"), /*#__PURE__*/React.createElement("input", {
    defaultValue: "Q2-MX-FLANGE-RETROFIT",
    className: "mono"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "stanza",
    style: {
      marginTop: 0,
      borderTop: 0,
      paddingTop: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "stanza-h"
  }, /*#__PURE__*/React.createElement("h2", null, "Line items", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--enxi-font-mono)',
      fontSize: 11,
      color: '#8A8A8A',
      fontWeight: 400,
      marginLeft: 10
    }
  }, "3 lines \xB7 double-click a cell to edit")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost"
  }, "+ Add line")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "SKU"), /*#__PURE__*/React.createElement("th", null, "Description"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Qty"), /*#__PURE__*/React.createElement("th", null, "UOM"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Unit"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Extended"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, lines.map((l, i) => {
    const ext = parseFloat(l.qty.replace(',', '')) * parseFloat(l.price);
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, l.sku), /*#__PURE__*/React.createElement("td", null, l.desc), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, l.qty), /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, l.uom), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, l.price), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, ext.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: 'chip ' + (i === 1 ? 'warn' : 'success')
    }, i === 1 ? 'Stock low @ vendor' : 'In stock')));
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "totals"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("span", null, "Subtotal"), /*#__PURE__*/React.createElement("span", {
    className: "num"
  }, subtotal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("span", null, "Shipping (est.)"), /*#__PURE__*/React.createElement("span", {
    className: "num"
  }, shipping.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("span", null, "VAT (19.5%)"), /*#__PURE__*/React.createElement("span", {
    className: "num"
  }, tax.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement("div", {
    className: "row total"
  }, /*#__PURE__*/React.createElement("span", null, "Total \u2014 EUR"), /*#__PURE__*/React.createElement("span", {
    className: "num"
  }, (subtotal + shipping + tax).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })))), /*#__PURE__*/React.createElement("p", {
    className: "micro",
    style: {
      marginTop: 24,
      fontFamily: 'var(--enxi-font-mono)',
      letterSpacing: 0,
      textTransform: 'none',
      fontWeight: 400
    }
  }, "Draft saved 08:47 \xB7 auto-saves every keystroke \xB7 \u2318\u21B5 to commit, \u2318Z to undo last change"));
}
window.POPage = POPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/product/POPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/product/Shell.jsx
try { (() => {
const {
  useState
} = React;
function Shell({
  page,
  setPage,
  children,
  toast,
  setToast
}) {
  const nav = [{
    group: 'General',
    items: [{
      id: 'dashboard',
      label: 'Overview',
      icon: 'M3 12h4l3-8 4 16 3-8h4'
    }, {
      id: 'close',
      label: 'Period close',
      count: '3'
    }, {
      id: 'reports',
      label: 'Reports'
    }]
  }, {
    group: 'Financials',
    items: [{
      id: 'gl',
      label: 'General ledger'
    }, {
      id: 'ar',
      label: 'Receivables',
      count: '24'
    }, {
      id: 'ap',
      label: 'Payables',
      count: '11'
    }, {
      id: 'variance',
      label: 'Variance analysis',
      active: page === 'variance'
    }]
  }, {
    group: 'Operations',
    items: [{
      id: 'po',
      label: 'Purchase orders',
      active: page === 'po'
    }, {
      id: 'inv',
      label: 'Inventory'
    }, {
      id: 'vendors',
      label: 'Vendors'
    }]
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "workspace"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mark"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("span", null, "EnXi"), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "/"), /*#__PURE__*/React.createElement("span", {
    className: "ctx"
  }, "Kraus-Maffei Industrial"), /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 6l4 4 4-4",
    stroke: "#8A8A8A",
    strokeWidth: "1.25"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "cmdk",
    onClick: () => setToast && setToast({
      msg: 'Command palette would open',
      action: null
    })
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "7",
    r: "4.5",
    stroke: "#8A8A8A",
    strokeWidth: "1.25"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.5 10.5l3 3",
    stroke: "#8A8A8A",
    strokeWidth: "1.25"
  })), /*#__PURE__*/React.createElement("span", null, "Search or jump to\u2026"), /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    className: "user"
  }, /*#__PURE__*/React.createElement("span", null, "Period: Apr 2026"), /*#__PURE__*/React.createElement("div", {
    className: "avatar"
  }, "DR"))), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "rail"
  }, nav.map(g => /*#__PURE__*/React.createElement("div", {
    className: "rail-group",
    key: g.group
  }, /*#__PURE__*/React.createElement("div", {
    className: "rail-label"
  }, g.group), g.items.map(it => {
    const active = it.active || page === it.id;
    return /*#__PURE__*/React.createElement("div", {
      key: it.id,
      className: 'rail-item' + (active ? ' active' : ''),
      onClick: () => setPage && setPage(it.id)
    }, /*#__PURE__*/React.createElement("span", null, it.label), it.count && /*#__PURE__*/React.createElement("span", {
      className: "count"
    }, it.count));
  })))), /*#__PURE__*/React.createElement("main", {
    className: "content"
  }, children)), toast && /*#__PURE__*/React.createElement("div", {
    className: "toast"
  }, /*#__PURE__*/React.createElement("span", null, toast.msg), toast.action && /*#__PURE__*/React.createElement("button", {
    onClick: toast.action.onClick
  }, toast.action.label), /*#__PURE__*/React.createElement("button", {
    onClick: () => setToast(null)
  }, "\xD7")));
}
window.Shell = Shell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/product/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/product/VariancePage.jsx
try { (() => {
function VariancePage() {
  // 8 cost centers × 6 months variance grid; heatmap intensity + flagged cells
  const months = ['Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26'];
  const rows = [['Plant 1 — Munich', [1.2, -0.8, 0.4, -2.1, 0.9, 0.6]], ['Plant 2 — Stuttgart', [-0.4, 2.1, 1.8, 3.2, 5.4, 7.8]], ['Plant 3 — Poznań', [0.1, -0.3, 0.8, 0.2, -0.7, -1.1]], ['Warehouse 4 — Munich', [4.2, 3.1, 2.8, 3.8, 4.1, 6.2]], ['Warehouse 5 — Rotterdam', [-1.2, -0.4, 0.6, 0.8, 0.4, 0.2]], ['Service — EU West', [0.8, 0.6, 0.4, 0.2, -0.1, -0.4]], ['Service — NA', [2.1, 1.8, 2.4, 3.1, 3.8, 4.2]], ['Corporate', [0.2, 0.1, 0.3, -0.1, 0.2, 0.4]]];
  const level = v => {
    const a = Math.abs(v);
    if (a >= 5) return 'h3 flag';
    if (a >= 3) return 'h3';
    if (a >= 1.5) return 'h2';
    if (a >= 0.5) return 'h1';
    return '';
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "micro",
    style: {
      marginBottom: 6
    }
  }, "Monthly operating variance"), /*#__PURE__*/React.createElement("h1", null, "Budget vs. actual \u2014 cost centers")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "strap"
  }, "as of 08:43 \xB7 reconciled through Apr 18 \xB7 % of budget"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-secondary"
  }, "Export CSV"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary"
  }, "Open close packet"))), /*#__PURE__*/React.createElement("div", {
    className: "split"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("h3", null, "Material variance by plant", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "USD \xB7 trailing 6 months")), /*#__PURE__*/React.createElement("div", {
    className: "chart-frame"
  }, /*#__PURE__*/React.createElement(BarsChart, null))), /*#__PURE__*/React.createElement("div", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("h3", null, "Flagged lines", /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "> \xB15% of budget")), /*#__PURE__*/React.createElement("ul", {
    className: "xlist"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph danger"
  }, "\u25A0"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "Plant 2 \u2014 Stuttgart \xB7 Apr 26", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "+7.8% \xB7 material cost, $412k over")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Drill \u2192")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph danger"
  }, "\u25A0"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "Warehouse 4 \u2014 Munich \xB7 Apr 26", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "+6.2% \xB7 overtime labor")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Drill \u2192")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph warn"
  }, "\u25B2"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "Service \u2014 NA \xB7 Apr 26", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "+4.2% \xB7 subcontractor utilization")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Drill \u2192")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "glyph info"
  }, "\u25C6"), /*#__PURE__*/React.createElement("div", {
    className: "txt"
  }, "FX \u2014 EUR weaker than budgeted rate", /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Avg 1.062 vs. 1.080 budget")), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Model \u2192"))))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tbl-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Variance heatmap \u2014 %"), /*#__PURE__*/React.createElement("div", {
    className: "tbl-filters"
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip indigo"
  }, /*#__PURE__*/React.createElement("b", null, "View:"), " % of budget ", /*#__PURE__*/React.createElement("span", {
    className: "x"
  }, "\xD7")), /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, /*#__PURE__*/React.createElement("b", null, "Horizon:"), " 6 months ", /*#__PURE__*/React.createElement("span", {
    className: "x"
  }, "\xD7")), /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, /*#__PURE__*/React.createElement("b", null, "Threshold:"), " \xB15% ", /*#__PURE__*/React.createElement("span", {
    className: "x"
  }, "\xD7")))), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Cost center"), months.map(m => /*#__PURE__*/React.createElement("th", {
    key: m,
    className: "num"
  }, m)), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Trend"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, r[0]), r[1].map((v, j) => /*#__PURE__*/React.createElement("td", {
    key: j,
    className: 'v ' + level(v)
  }, (v > 0 ? '+' : '') + v.toFixed(1))), /*#__PURE__*/React.createElement("td", {
    className: "num mono",
    style: {
      color: '#8A8A8A'
    }
  }, (() => {
    const last = r[1][r[1].length - 1] - r[1][0];
    return (last > 0 ? '↗ +' : '↘ ') + last.toFixed(1);
  })())))), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Consolidated"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "+0.9"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "+0.8"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "+1.2"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "+1.4"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "+1.8"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "+2.4"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "\u2197 +1.5"))))), /*#__PURE__*/React.createElement("p", {
    className: "micro",
    style: {
      marginTop: 18,
      fontFamily: 'var(--enxi-font-mono)',
      letterSpacing: 0,
      textTransform: 'none',
      fontWeight: 400
    }
  }, "Source: GL posted + subledger accruals \xB7 computed 2026-04-20 08:43 CET \xB7 methodology: variance = (actual \u2212 budget) / budget"));
}
function BarsChart() {
  const series = [{
    name: 'Materials',
    color: '#3B5D82'
  }, {
    name: 'Labor',
    color: '#A97A1E'
  }, {
    name: 'Overhead',
    color: '#6B8C6F'
  }];
  const data = [[38, 18, 12], [42, 22, 14], [45, 24, 15], [48, 26, 16], [52, 28, 18], [58, 32, 20]];
  const labels = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const gap = 2,
    bw = (100 - gap * (data.length + 1)) / data.length;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 90",
    preserveAspectRatio: "none"
  }, [20, 40, 60, 80].map(gy => /*#__PURE__*/React.createElement("line", {
    key: gy,
    x1: "0",
    x2: "100",
    y1: gy,
    y2: gy,
    stroke: "#D8D4CA",
    strokeWidth: "0.2"
  })), data.map((stack, i) => {
    const x = gap + i * (bw + gap);
    const total = stack.reduce((a, b) => a + b, 0);
    let y = 80;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, stack.map((v, si) => {
      const h = v * 0.7;
      y -= h;
      return /*#__PURE__*/React.createElement("rect", {
        key: si,
        x: x,
        y: y,
        width: bw,
        height: h,
        fill: series[si].color
      });
    }), /*#__PURE__*/React.createElement("text", {
      x: x + bw / 2,
      y: "88",
      fontSize: "2.6",
      textAnchor: "middle",
      fill: "#8A8A8A",
      fontFamily: "JetBrains Mono"
    }, labels[i]));
  }), series.map((s, i) => /*#__PURE__*/React.createElement("g", {
    key: s.name,
    transform: `translate(${2 + i * 22}, 4)`
  }, /*#__PURE__*/React.createElement("rect", {
    width: "3",
    height: "3",
    fill: s.color
  }), /*#__PURE__*/React.createElement("text", {
    x: "5",
    y: "2.8",
    fontSize: "2.6",
    fill: "#4A4A4A",
    fontFamily: "Inter"
  }, s.name))));
}
window.VariancePage = VariancePage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/product/VariancePage.jsx", error: String((e && e.message) || e) }); }

})();
