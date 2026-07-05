# EnXi Product UI Kit — The ERP

A click-thru recreation of the EnXi ERP product surface. Three primary screens:

- **Ledger Dashboard** — the Controller's 8:45 AM status readout
- **Purchase Order Creation** — the form-heavy workflow (task mode)
- **Variance Analysis** — the Analyst's dense table

## Components
- `AppShell.jsx` — top bar, left rail, content frame, ⌘K palette hint
- `KpiCard.jsx` — value, delta pill, freshness strap
- `DataTable.jsx` — hairline verticals, tabular mono, no zebra
- `Button.jsx` — four action levels
- `Input.jsx`, `Chip.jsx`, `Drawer.jsx`

## Notes
- Icons: Lucide @ 1.25px stroke (CDN), the closest match to EnXi's custom spec. Flagged for replacement.
- Fonts: Inter / JetBrains Mono / Source Serif 4 / DM Serif Display substitutes.
