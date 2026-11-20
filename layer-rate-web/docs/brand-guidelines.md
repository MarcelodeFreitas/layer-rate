# Brand Guidelines v1.0

> Last updated: 2026-11-18
> Status: Draft

## Quick Reference

| Element | Value |
|---------|-------|
| Primary Color | #021F38 (Ink Navy) |
| Secondary Color | #1EB9EF (Signal Cyan) |
| Accent Color | #FF9000 (Print Orange) |
| Primary Font | IBM Plex Sans |
| Numeric Font | IBM Plex Mono |
| Voice | Plain, precise, honest |
| Logo | Pending: layer-rate logo to be made by the owner. Text placeholder "layer-rate" until then. |

---

## 1. Brand Concept

layer-rate is an open-source 3D print pricing tool. It shows how a price is built, line by line: material, machine time, power, labor, failed prints, fees, and markup. The product is the visual: tables, breakdowns, and charts with real printer and filament names.

Rules for the look:
- No purple or blue-to-purple gradients.
- No emoji icons. Use simple line icons or none.
- No decorative blobs, stock photos, or abstract hero art.
- Numbers are always shown with units and aligned in tables.

---

## 2. Color Palette

### Primary

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Ink Navy | #021F38 | rgb(2,31,56) | Headings, body text, primary buttons |
| Ink Navy Deep | #01182E | rgb(1,24,46) | Hover states, header bar |

### Secondary

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Signal Cyan | #1EB9EF | rgb(30,185,239) | Links, focus rings, chart series 1 |

### Accent

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Print Orange | #FF9000 | rgb(255,144,0) | Highlight of the final price, chart series 2 only |

Orange is used sparingly: one highlighted number per screen.

### Neutral

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | #FFFFFF | rgb(255,255,255) | Page background |
| Surface | #F4F7FA | rgb(244,247,250) | Cards, table stripes |
| Text Secondary | #4A5A6B | rgb(74,90,107) | Captions, helper text |
| Border | #D5DEE7 | rgb(213,222,231) | Dividers, input borders |

### Semantic

| State | Hex | Usage |
|-------|-----|-------|
| Success | #15803D | Saved, confirmed |
| Warning | #B45309 | Check this value |
| Error | #B91C1C | Invalid input, failed import |

### Accessibility

- Ink Navy on white: high contrast (AAA for body text).
- Signal Cyan is used for links and focus rings only, never for small body text on white.
- Print Orange is never used for text on white. It is for fills and large numbers only.

---

## 3. Typography

### Font Stack

```css
--font-heading: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
--font-body: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
```

Use `--font-mono` for every number in a quote, table, or chart axis, so columns line up.

### Type Scale

| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|----------------|---------------|--------|-------------|
| H1 | 44px | 30px | 600 | 1.15 |
| H2 | 32px | 26px | 600 | 1.25 |
| H3 | 22px | 20px | 600 | 1.3 |
| Body | 16px | 16px | 400 | 1.55 |
| Small | 14px | 14px | 400 | 1.5 |
| Caption | 12px | 12px | 400 | 1.4 |

---

## 4. Logo Usage

- Current state: no logo. Show the text "layer-rate" in Font Heading, weight 600, Ink Navy.
- When the owner's logo arrives, it replaces the text wordmark in the header and favicon.

---

## 5. Voice & Tone

### Traits

| Trait | We Are | We Are Not |
|-------|--------|------------|
| Plain | Short sentences, everyday words | Jargon, corporate phrasing |
| Precise | Exact units, exact numbers | Vague claims |
| Honest | Shows how the price is built, including costs | Hides fees or margin |

### Prohibited Terms

| Avoid | Use instead |
|-------|-------------|
| Revolutionary | (say what it does) |
| Seamless | (say what it does) |
| Leverage | use |
| Best-in-class | (give the number) |

### Examples

- Good: "Material 12.40 €, machine time 3.10 €, failed-print allowance 0.80 €."
- Avoid: "Get seamless, best-in-class pricing in seconds."

---

## 6. Components

| Component | Style |
|-----------|-------|
| Primary button | Ink Navy fill, white text, 8px radius |
| Secondary button | White fill, Ink Navy border and text, 8px radius |
| Input | White, Border color, 8px radius, Signal Cyan focus ring |
| Card | Surface fill, 12px radius, no shadow |
| Table | Monospace numbers, right-aligned, Surface stripes |

### Spacing

4, 8, 16, 24, 32, 48px. Nothing else.

---

## 7. Imagery and Charts

- Charts: Signal Cyan for series 1, Ink Navy for series 2, Print Orange for one highlight only. Include axis labels with units.
- No stock photos. Use real screenshots of the app when a picture is needed.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-11-18 | Initial guidelines |

---

## Decisions to confirm

- Fonts (IBM Plex Sans and Mono): chosen by the assistant, not by the owner.
- Light theme only for v1.
- Neutral and semantic colors: chosen by the assistant.
