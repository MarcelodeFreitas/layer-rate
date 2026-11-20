# layer-rate-web: design spec (v2)

Date: 2026-11-18. Source of truth for look and layout. Behaviour and data come from `docs/plan.md`. Brand rules from `docs/brand-guidelines.md`.

## 1. Principles

- The numbers are the hero: price, breakdown table, stacked bar. Everything else gets out of the way.
- Light, calm surfaces. One dark element (the wordmark bar or the primary button), not a dark sidebar block.
- Print Orange appears once per screen: the per-job price. Nowhere else.
- Plain type hierarchy. No decorative borders, no zebra stripes, no shadows, no gradients.
- Every input has a visible label above it and a unit on the right.

## 2. Tokens (use the CSS custom properties in `src/styles.css`; add the ones marked NEW)

| Role | Value |
|---|---|
| ink | #021F38 |
| ink-soft (text secondary) | #4A5A6B |
| signal (focus, links, chart) | #1EB9EF |
| print (price highlight only) | #FF9000 |
| bg | #FFFFFF |
| surface (cards, sidebar) | #F4F7FA |
| border | #D5DEE7 |
| error | #B91C1C |
| warning | #B45309 |
| NEW --surface-2 | #EAF0F5 (hover, segmented control track) |
| NEW --space-1..6 | 4, 8, 16, 24, 32, 48 px |
| NEW --radius-control | 8px |
| NEW --radius-card | 12px |
| NEW --shadow | none (do not add shadows) |

Type scale (IBM Plex Sans, body 16px / 1.55):
- H1 (page titles): 28px, weight 600, ink.
- H2 (section titles): 18px, weight 600, ink. Uppercase is NOT used.
- Labels: 13px, weight 500, ink-soft, above the input.
- Table header: 12px, weight 500, ink-soft, letter-spacing 0.02em.
- Numbers: IBM Plex Mono, `font-variant-numeric: tabular-nums`, right-aligned.
- Big price: IBM Plex Mono 40px, weight 600, print orange.
- Home headline (H1 on `/`): 48px desktop, 34px mobile, weight 600, line-height 1.1.

## 3. App shell (`/layer-rate/app/*`)

Desktop (>= 900px):
- Two columns: side menu 232px, content fluid, max content width 1200px, padding 32px.
- Side menu: background `--surface`, border-right 1px `--border`, full height, padding 24px 16px.
  - Wordmark "layer-rate" at top, 18px weight 600, ink.  - Menu items: 14px weight 500, ink-soft, padding 10px 12px, radius 8px. Hover: `--surface-2`. Active (NavLink `.active`): ink text, white background, 1px border `--border`, plus a 3px signal bar on the left edge. No filled navy block.
- Storage warning banner: full width at top of content, background #FFF7ED, border-left 3px warning, text ink, padding 12px 16px.

Mobile (< 900px):
- Side menu becomes a top bar: wordmark left, nav items in a horizontal scroll row below, border-bottom. Items 14px, no wrap.

## 4. Calculator (`/app`)

Layout desktop: two columns, `grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr)`, gap 32px.
- Left column: input card.
- Right column: result card, `position: sticky; top: 24px`.

Page header: H1 "Calculator", then the segmented control (Single | Compare) on the same row, right-aligned on desktop.

Segmented control: track `--surface-2`, radius 8px, padding 4px, two buttons. Active button white with 1px border; inactive ink-soft text. Implemented as `role="tablist"` buttons with `aria-selected`.

Input card (`.card`, background `--surface`, radius 12px, padding 24px):
- Group 1 title "Job" (H2). Fields in a 2-column grid (`.field-grid`, gap 16px, 1 column under 560px):
  - Printer (select, full width, spans 2 columns)
  - Filament (select, spans 2 columns)
  - Filament used (number, unit "g")
  - Quantity (number, unit "pcs")
  - Hours (number, unit "h") and Minutes (number, unit "min") in the same row
- Group 2 title "Pricing" (H2), margin-top 24px. Fields: Mode (select: markup | margin), Percent (number, unit "%").
- `<details>` "More inputs": design cost and component cost, unit = currency.
- Every number input: a wrapper `.input-with-unit` with the input filling the row and the unit as a grey suffix inside the border (`--surface-2` background, 1px border, radius 8px right side).
- Inputs: background #FFFFFF, border 1px `--border`, height 40px, padding 0 12px, radius 8px. Focus: border `--signal`, plus 3px ring `rgba(30,185,239,0.25)`.

Result card (`.card--result`, background #FFFFFF, border 1px `--border`, radius 12px, padding 24px):
- Top: small label "Price per job" (13px, ink-soft). Under it the big price (`.price-highlight`, 40px, orange).
- Under the price, a single line: "Total for 3 jobs: EUR 12.34 · Print time 1 h 50 min" (14px, ink-soft, numbers in mono).
- Divider 1px `--border`, margin 16px 0.
- H2 "Where the price goes" then the stacked bar chart. Legend below the bar in a 2-column grid (name left, value right, mono).
- H2 "Breakdown" then the breakdown table.

Breakdown table rules:
- Full width, no zebra stripes, no outer borders.
- Header row: 12px ink-soft, bottom border 1px `--border`.
- Body rows: padding 10px 0, bottom border 1px `--border` at 60% opacity (use `#E5EBF1`).
- Value columns right-aligned, mono, tabular numbers.
- Summary rows ("Production cost", "Profit", "Tax", "Customer price"): weight 600. The "Customer price" row has a top border 2px ink. Do not make it orange.

Errors (`ul[role=alert]`): card with border-left 3px `--error`, text ink, 14px.

## 5. Compare tab

- Two picker cards side by side (desktop) with checkboxes styled as a list: 40px row height, hover `--surface-2`.
- Pricing: chips in a row (`--surface-2`, radius 999px, padding 4px 12px, mono text). Add row: select + number + "Add" button, all in one line.
- Grid table: same table rules as the breakdown table. Cells mono, right-aligned. Invalid cell shows "-" in ink-soft with the title attribute.
- Chart below, grouped bars in signal cyan. No orange.

## 6. Presets (Printers, Filament)

- Page header: H1 title on the left, primary "Add" button on the right.
- Table: name column left, numeric columns right (mono). Row actions Edit and Delete as small text buttons (ink, underline on hover), not boxed secondary buttons.
- Edit form: shown in a card below the table with a 2-column grid. Save = primary button, Cancel = text button. Error list uses the error style above.
- Empty state: one line, ink-soft, plus the Add button.

## 7. Settings

- Two cards stacked: "Defaults" (form in 2-column grid, Save primary button at the end) and "Backup" (paragraph, "Export backup" secondary button, file input styled as a secondary button, import summary card with "Replace my data" primary and "Cancel" text button).

## 8. Home (`/layer-rate/`)

Desktop layout:
- Header: wordmark left, "Open the calculator" button right. Bottom border 1px `--border`. Padding 24px 32px.
- Hero: two columns. Left: H1 "Know what a 3D print really costs.", paragraph (18px, ink-soft, max-width 480px), primary button "Open the calculator". Right: the live quote card (same styles as the Calculator result card, smaller: price 32px orange, stacked bar, then breakdown table limited to the summary rows: Material, Machine time, Labor, Failed prints, Customer price).
- Section "What it does": 4 features in a 2x2 grid. Each: H3 (16px weight 600) plus one sentence (ink-soft). No borders, no icons.
- Section "How the price is built": numbered steps, 4 items in a row on desktop (number in signal cyan mono, then sentence), stacked on mobile.
- Footer: 1px top border, text ink-soft 14px, GitHub link in signal cyan.

Mobile: hero stacks, live card below headline, features 1 column.

## 9. Components (shared)

- Buttons:
  - Primary: ink background, white text, 14px weight 600, height 40px, padding 0 16px, radius 8px. Hover ink-deep #01182E. Focus-visible: 3px signal ring offset 2px.
  - Secondary: white background, 1px border `--border`, ink text. Hover `--surface-2`.
  - Text button: no background, ink text, underline on hover.
- Focus ring for everything: `outline: 3px solid var(--signal); outline-offset: 2px`.
- Cards: `--surface` background, radius 12px, padding 24px, no shadow, no border (unless it is the result card, which has a 1px border).
- Headings: `h1` margin-bottom 16px; `h2` margin 24px 0 12px.
- Max line length for paragraphs: 65ch.

## 10. Accessibility

- Contrast: ink on white and ink-soft on white (#4A5A6B on #FFFFFF is 7:1). Do not put text in signal cyan on white for body copy; links and focus only.
- Targets: all buttons and inputs at least 40px high.
- Keyboard: every control reachable, focus ring visible.
- Reduced motion: no transitions longer than 150ms; respect `prefers-reduced-motion`.

## 11. Implementation notes for the implementer

- Only change: `src/styles.css` (rewrite it using the tokens above), and the class names in these files: `src/components/AppLayout.tsx` (add `.side-menu-brand`, keep NavLink classes), `src/pages/Calculator.tsx` (wrap groups in `.card` and `.field-grid`, add `.input-with-unit` wrappers, move the price into `.card--result`), `src/pages/ComparePanel.tsx`, `src/pages/Presets.tsx`, `src/components/PresetPage.tsx`, `src/pages/Settings.tsx`, `src/pages/Home.tsx`, `src/components/BarChart.tsx` (legend classes only).
- Do NOT change any logic, props, state, routes, or test expectations. Tests check text such as "Ender 3", a euro price, "blocking storage", "Know what a 3D print really costs.", "No data to show.".
- No new dependencies. No Tailwind, no UI kit.
- Keep the `dist/404.html` flow and the `/layer-rate/` base path.
- Inline style attributes in Home.tsx and BarChart.tsx should move to classes.
