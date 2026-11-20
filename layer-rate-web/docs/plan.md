# layer-rate-web: implementation plan (v1)

Status: draft for owner review. Date: 2026-11-18.

## 1. Goals and non-goals

Goals
- Public home page at `/` that says what layer-rate does and shows a real breakdown.
- Working app at `/app` with a side menu: Calculator, Printers, Filament, Settings.
- Calculator: enter filament grams, print time, quantity; get a quote with a breakdown table and a chart. It remembers the last printer, filament, pricing and job inputs.
- Compare: pick several printers and/or filaments and several markups/margins; show a grid of quotes.
- Printers and Filament: create, edit, delete saved presets.
- Settings: shop defaults, Export backup (JSON download), Import backup (validate, show what it replaces, confirm).
- All data in one versioned localStorage key. Nothing leaves the browser. If storage is blocked, warn and keep working in memory.
- Static build on GitHub Pages. Brand per `docs/brand-guidelines.md` and `assets/design-tokens.css`.

Non-goals (v1): accounts, sync, PDFs, shared links, analytics, server, quote history, fees editor, multi-material jobs, i18n, dark mode, logo.

Stack note: `LAYER_RATE_ARCHITECTURE.md` recommends Next.js + Postgres + Auth. We deliberately use **Vite + React + TypeScript** instead: there is no server, no database and no accounts in v1, so a static SPA is the smallest thing that works on GitHub Pages.

## 2. Key decisions

| Topic | Decision | Why |
|---|---|---|
| Core integration | Add `layer-rate-web` to the root npm `workspaces`; depend on `"layer-rate-core": "0.1.0"` | Same pattern the CLI already uses (`node_modules/layer-rate-core` is a workspace symlink). No `file:` copies, no publish step. Web imports the built `dist` (ESM, zod only), so the core must be built first: `npm run build -w layer-rate-core`. |
| Pricing math | Only in core. Web builds a `LayerRateQuoteInput` and calls `calculateQuote`. | Architecture rule: math lives in core. |
| Validation | `zod` (already in the tree via core) for the stored data / import schema; core's `validateQuoteInput` for quote inputs. | No new validation library. |
| Routing | `react-router` (`BrowserRouter`, `basename = import.meta.env.BASE_URL`) + copy `dist/index.html` to `dist/404.html` after build | Clean URLs (`/app/printers`) as the owner wrote them. GitHub Pages serves `404.html` for unknown paths, so deep links and refresh work. Hash routing would give `/#/app`, worse for a public site. Cost: deep links return HTTP 404 status with the right page; fine, the app has no SEO need. `shortcut:` note in the copy script. |
| Charts | Plain inline SVG, one component | Two simple charts (stacked bar, grouped bars). A library would be 40-100 kB for that. |
| Fonts | `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` (weights 400, 600), self-hosted in the bundle | Google Fonts would send a request to Google, which breaks "no data leaves the browser". |
| Styling | One `src/styles.css` that imports `../assets/design-tokens.css`; plain CSS classes | No Tailwind or UI kit needed for ~6 screens. |
| Tests | `vitest` (already used in core/CLI), node environment | Smoke test uses `react-dom/server` `renderToString` + `MemoryRouter`: no jsdom/testing-library deps. |
| Base path | Vite `base: "/layer-rate/"` (repo `MarcelodeFreitas/layer-rate`) | Project Pages URL. Change to `/` if a custom domain is used (open question). |

## 3. Folder layout

```
layer-rate/                      (monorepo root)
  package.json                   edit: add "layer-rate-web" to workspaces
  .github/workflows/pages.yml    new: build + deploy to GitHub Pages
  layer-rate-web/
    package.json  vite.config.ts  tsconfig.json  index.html
    assets/design-tokens.css     (exists, do not edit)
    docs/brand-guidelines.md     (exists)  docs/plan.md (this file)
    scripts/copy-404.mjs
    src/
      main.tsx                   BrowserRouter + StoreProvider
      routes.tsx                 AppRoutes (shared with smoke test)
      styles.css
      lib/schema.ts              zod schema, types, DEFAULT_DATA
      lib/storage.ts             load/save localStorage, blocked detection
      lib/quote.ts               buildQuoteInput, runQuote, priceSegments, format helpers
      lib/compare.ts             combinations + compare grid
      lib/backup.ts              export file, parse/validate import, summary
      lib/store.tsx              React context: data, update(), storageOk
      components/AppLayout.tsx   side menu + footer + storage warning
      components/BarChart.tsx    SVG stacked / grouped bars
      components/BreakdownTable.tsx
      components/PresetPage.tsx  generic list + edit form (printers, filaments)
      pages/Home.tsx  Calculator.tsx  ComparePanel.tsx  Settings.tsx
    tests/
      schema.test.ts storage.test.ts quote.test.ts compare.test.ts backup.test.ts smoke.test.tsx
```

## 4. Data model (localStorage)

One key: `layer-rate`. Value: JSON, validated by `AppDataSchema` in `lib/schema.ts`.

```ts
type AppData = {
  version: 1;
  printers: Printer[];        // min 0
  filaments: Filament[];      // min 0
  settings: Settings;
  last: LastInputs;           // what the calculator remembers
};
type Printer = {              // field names = core input names (and plugin printers.example.json)
  id: string; name: string;   // id: crypto.randomUUID(); name non-empty, unique per list
  printerPurchasePrice: number; printerPowerWatts: number;
  printerLifetimeYears: number; typicalUsageHoursPerDay: number; repairRatioPercent: number;
};
type Filament = { id: string; name: string; costPerKg: number };   // core costPer {value, unit:"kg"}
type Pricing = { mode: "markup" | "margin"; percent: number };
type Settings = {
  currency: string;                       // ISO 4217, default "EUR"
  electricityCostPerKwh: number; laborCostPerHour: number;
  setupMinutes: number; operationsMinutes: number; postProcessingMinutes: number;
  failRatioPercent: number;               // 0..100
  taxPercent: number;                     // 0 = no tax line
};
type LastInputs = {
  printerId: string | null; filamentId: string | null;
  grams: number; hours: number; minutes: number; quantity: number;
  designCost: number; componentCost: number;
  pricing: Pricing;
  tab: "single" | "compare";
  compare: { printerIds: string[]; filamentIds: string[]; pricings: Pricing[] };
};
```

Rules: all numbers finite and >= 0; `printerLifetimeYears > 0`; `0 < typicalUsageHoursPerDay <= 24`; margin percent < 100; quantity positive integer. Dangling ids in `last` are allowed (UI falls back to the first preset).

`DEFAULT_DATA` (first run): printers "Ender 3" and "Bambu A1" from `layer-rate-plugin/examples/printers.example.json`; filament "PLA (generic)" 15 €/kg; settings from `layer-rate-cli/quote.example.json` (electricity 0.2, labor 10, 1 min each for setup/operations/post, fail 20 %, tax 0); last: 22 g, 1 h 50 min, qty 1, markup 223 %.

Versioning: `version` is a literal. A future v2 adds `migrate(raw)` in `storage.ts`; v1 rejects other versions.

## 5. Routes and screens

```
/                 Home
  header: "layer-rate" wordmark | "Open the calculator" button
  H1 one plain sentence: what it does
  live example: BreakdownTable + BarChart computed from DEFAULT_DATA (real core call)
  feature list (4 items, text + line rule, no icons): breakdown, compare, presets, private
  "How the price is built" short list; link to GitHub

/app              Calculator (menu: Calculator | Printers | Filament | Settings)
  tabs: [Single] [Compare]
  Single:
    Printer [select]  Filament [select]
    Filament g [__]  Print time [_h] [_min]  Quantity [_]
    Pricing [markup|margin] [__ %]   details "More": design cost, component cost
    -> big price per job (orange highlight, mono), total for quantity
    -> BreakdownTable (per job | all jobs) and BarChart (stacked: material, machine, labor, failed prints, components, profit, tax)
  Compare (ComparePanel): same job inputs (shared state)
    printers [checkbox list]  filaments [checkbox list]
    pricings: chips "markup 150 %" [x] + add row [mode][%][Add]
    -> grid: rows = printer x filament, columns = pricings, cells = price per job; invalid cell shows "-" with title text
    -> BarChart grouped: price per job per row for the first pricing

/app/printers     PresetPage: table of printers [Edit][Delete]; form with 5 numeric fields + name; Delete asks confirm
/app/filaments    PresetPage: table of filaments; form: name, cost per kg
/app/settings     defaults form (Settings fields)
                  Backup: [Export JSON] -> download layer-rate-backup-YYYY-MM-DD.json
                          [Import JSON] file input -> summary "Replaces: 2 printers, 1 filament, settings, last inputs
                           with: 3 printers, 4 filaments, ..." -> [Replace my data] [Cancel]
*                 "Page not found" + link to /
```

Persistent banner in AppLayout when storage is blocked: "Your browser is blocking storage. The app works, but nothing is saved after you close this tab. Export a backup to keep your data."

## 6. Core integration

- `buildQuoteInput(printer, filament, settings, last): LayerRateQuoteInput` maps:
  `materials: [{ name: filament.name, amount: {value: grams, unit:"g"}, costPer: {value: costPerKg, unit:"kg"} }]`,
  `printTime: {hours, minutes}`, printer fields 1:1, `setupTime/operationsTime/postProcessingTime: {minutes}`,
  `taxPercent: settings.taxPercent || undefined`, no `fees`, `pricing: last.pricing`.
- `runQuote(input)`: `validateQuoteInput` first; if issues -> `{ ok: false, issues }` (messages shown next to the form); else `{ ok: true, result: calculateQuote(input) }`. `calculateQuote` also wrapped in try/catch for `LayerRateCalculationError`.
- `priceSegments(result)` groups `perJob` into chart segments + profit (`totalProfitAllJobs/quantity`) + tax. Invariant: segments sum to `perJobCustomerPrice` (no fees in v1).
- Rounding only at display (`Intl.NumberFormat` with `settings.currency`, 2 decimals). Core numbers stay raw.

## 7. Export / import

Export file = the whole `AppData` object, pretty-printed, plus nothing else (same schema as storage, so one validator).

Import rules (`parseImport(text)`):
1. Reject files > 1 MB before reading (UI) and text that is not JSON.
2. `version` must be `1`; otherwise error "This backup is version X; this app reads version 1."
3. Must pass `AppDataSchema`; errors listed as `path: message` (max 10 shown).
4. Ids unique within printers and within filaments.
5. Returns `{ ok: true, data, summary }` where summary = counts and names for current vs incoming.
6. Nothing is written until the user clicks "Replace my data". Import replaces everything (no merge).

## 8. Error handling

- Storage read: missing key -> `DEFAULT_DATA`. Invalid JSON or schema fail -> copy raw string to key `layer-rate.corrupt` (once, do not overwrite an existing one), use defaults, show a warning with an "Export current" hint. Never silently drop user data.
- Storage write: try/catch on every `setItem`; on failure (blocked or quota) set `storageOk=false` and show the banner. The app keeps state in memory.
- Blocked detection at startup: `try { localStorage.setItem/removeItem test key }`.
- Form inputs: invalid numbers keep the last valid quote visible and show the core message under the form.
- Compare: each cell computed independently; one invalid combo (e.g. margin >= 100) does not break the grid.
- Deleting a preset that `last` points to: the calculator falls back to the first remaining preset; zero presets -> message with link to the Printers/Filament page.

## 9. Testing

`npm test -w layer-rate-web` (vitest, node env). Unit tests:
- `schema.test.ts`: `DEFAULT_DATA` parses; bad version, negative number and margin 100 fail.
- `storage.test.ts`: in-memory `Storage` fake; missing key -> defaults; corrupt -> defaults + `layer-rate.corrupt` saved; save round-trips; throwing `setItem` -> returns false, no throw.
- `quote.test.ts`: `buildQuoteInput` from the CLI example values equals `layer-rate-cli/quote.example.json` (deep equal, after mapping); `priceSegments` sum equals `perJobCustomerPrice` within 1e-9; invalid input returns issues, no throw.
- `compare.test.ts`: 2 printers x 3 filaments x 2 pricings -> 6 rows x 2 cells; empty filament selection -> rows use none (empty grid); margin 100 cell is error, others ok.
- `backup.test.ts`: export -> import round-trip; non-JSON, wrong version, duplicate ids rejected; summary counts correct.
- `smoke.test.tsx` (one): `renderToString(<MemoryRouter initialEntries={["/app"]}><StoreProvider><AppRoutes /></StoreProvider></MemoryRouter>)` with no `localStorage` (node) contains "Ender 3" and a formatted price.
Plus `npm run typecheck -w layer-rate-web` and `npm run build -w layer-rate-web` in CI.

## 10. Deployment (GitHub Pages)

1. Repo Settings -> Pages -> Source: GitHub Actions (owner does this once).
2. `.github/workflows/pages.yml` on push to `main` (and `workflow_dispatch`):
   checkout with `submodules: true` -> setup-node 20 with npm cache -> `npm ci` (root) ->
   `npm run build -w layer-rate-core` -> `npm test -w layer-rate-web` -> `npm run build -w layer-rate-web` ->
   `actions/upload-pages-artifact` (path `layer-rate-web/dist`) -> `actions/deploy-pages`.
   Permissions: `pages: write`, `id-token: write`, `contents: read`.
3. Web `build` script: `tsc --noEmit && vite build && node scripts/copy-404.mjs`.
4. Check after deploy: `https://marcelodefreitas.github.io/layer-rate/app/printers` loads on refresh.
5. Root `package-lock.json` must be regenerated after adding the workspace (commit it).

## 11. Skipped on purpose

Fees editor (core supports fees; v1 sends none), multi-material jobs, quote history, merge-on-import, data migrations beyond a version check, charting library, CSS framework, i18n/PT translation, dark mode, PWA/offline cache, E2E browser tests, prerendered route HTML (404.html trick instead), analytics.

## 12. Open questions for the owner

1. Public repo? GitHub Pages on a private repo needs a paid plan. Custom domain (then `base` becomes `/`)?
2. Compare: keep it as a tab inside Calculator (plan) or as its own menu item?
3. Default currency EUR and tax 0 %: or default to 23 % IVA? Show prices with or without tax first?
4. Marketplace fees (Etsy, etc.) in v1, or wait? Core already supports them.
5. Default presets: ship the two example printers + generic PLA, or start empty?
6. Language: English only for v1, or Portuguese too?
7. Home page: link to GitHub repo and CLI/plugin install instructions?

## 13. Phased tasks

Legend: **L** = safe for a local model. **P** = planner/reviewer does it or reviews closely.
All commands run from the monorepo root. "test X" = `npm test -w layer-rate-web -- tests/X.test.ts`.

### Phase 0: scaffold

**T1 (P) Workspace and Vite scaffold**
- Files: root `package.json` (add workspace), `layer-rate-web/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx` (renders "layer-rate"), `scripts/copy-404.mjs`.
- Deps: react, react-dom, react-router, zod, layer-rate-core, @fontsource/ibm-plex-sans, @fontsource/ibm-plex-mono; dev: vite, @vitejs/plugin-react, typescript, vitest, @types/react, @types/react-dom.
- Scripts: `dev`, `build` (see 10.3), `test: vitest run`, `typecheck: tsc --noEmit`.
- Accept: `npm install && npm run build -w layer-rate-core && npm run build -w layer-rate-web` passes; `layer-rate-web/dist/404.html` exists; `main.tsx` contains `import { calculateQuote } from "layer-rate-core"` and typechecks.
- Depends: none.

### Phase 1: pure logic (no React)

**T2 (L) `src/lib/schema.ts` + `tests/schema.test.ts`**
- Output: zod `AppDataSchema`, `PrinterSchema`, `FilamentSchema`, `SettingsSchema`, `PricingSchema`; inferred types; `DEFAULT_DATA`; `STORAGE_KEY = "layer-rate"`. Spec: section 4.
- Accept: test schema passes; `AppDataSchema.parse(DEFAULT_DATA)` does not throw.
- Depends: T1.

**T3 (L) `src/lib/storage.ts` + `tests/storage.test.ts`**
- Output: `loadData(storage: Storage | null): { data: AppData; storageOk: boolean; recovered: boolean }`, `saveData(storage, data): boolean`, `getStorage(): Storage | null` (does the test write). Spec: section 8.
- Accept: test storage passes (cases in section 9).
- Depends: T2.

**T4 (L) `src/lib/quote.ts` + `tests/quote.test.ts`**
- Output: `buildQuoteInput`, `runQuote`, `priceSegments`, `formatMoney(value, currency)`, `formatDuration(h, m)`. Spec: section 6.
- Accept: test quote passes.
- Depends: T2.

**T5 (L) `src/lib/compare.ts` + `tests/compare.test.ts`**
- Output: `compareGrid(data: AppData): { rows: { printer, filament, cells: ({ok:true, perJob:number} | {ok:false, message:string})[] }[], pricings: Pricing[] }` using `last.compare` ids and the job inputs from `last`. Unknown ids skipped.
- Accept: test compare passes.
- Depends: T4.

**T6 (L) `src/lib/backup.ts` + `tests/backup.test.ts`**
- Output: `exportJson(data): string`, `backupFileName(date: Date): string`, `parseImport(text, current): {ok:true, data, summary} | {ok:false, errors: string[]}`. Spec: section 7.
- Accept: test backup passes.
- Depends: T2.

### Phase 2: state and shell

**T7 (L) `src/lib/store.tsx`**
- Output: `StoreProvider` (loads once via `getStorage`/`loadData`), `useStore(): { data, update(fn: (d) => AppData), storageOk, recovered }`; `update` saves and sets `storageOk=false` if save fails.
- Accept: `npm run typecheck -w layer-rate-web`; reviewer reads it (< 60 lines).
- Depends: T3.

**T8 (P) Routing, layout, styles**
- Files: `src/routes.tsx` (export `AppRoutes`: routes from section 5 + `*` route, so the smoke test reuses them), `src/main.tsx` (BrowserRouter with basename around `AppRoutes`), `src/components/AppLayout.tsx` (side menu with `NavLink`, collapses to top bar under 720px, storage banner), `src/styles.css` (tokens import, fonts, buttons, inputs, tables, cards per brand section 6).
- Accept: build passes; `npm run dev`, every menu link renders a placeholder; refresh on `/layer-rate/app/settings` after `vite preview` works.
- Depends: T1, T7.

### Phase 3: components and pages

**T9 (L) `src/components/BarChart.tsx`**
- Props: `{ kind: "stacked" | "grouped"; items: { label: string; value: number }[]; format: (n) => string }`. Plain SVG, `role="img"` + `aria-label`, labels in mono font, Signal Cyan series, Print Orange only for the profit segment / highlighted bar, no gradients.
- Accept: typecheck; renders with empty `items` without crashing (`renderToString` assert in a 5-line test inside `smoke.test.tsx` or manual).
- Depends: T8.

**T10 (L) `src/components/BreakdownTable.tsx`**
- Props: `{ result: LayerRateQuoteResult; currency: string }`. Rows: the 10 `perJob`/`allJobs` fields with plain labels, production cost, profit, tax, customer price. Numbers right-aligned, mono, with units.
- Accept: typecheck; visual check against section 5.
- Depends: T4, T8.

**T11 (L) `src/pages/Calculator.tsx` (Single tab)**
- Uses `useStore`, `buildQuoteInput`, `runQuote`, T9, T10. Every input change calls `update` on `last` (that is the memory). Tabs switch `last.tab`; Compare tab renders `<ComparePanel />`.
- Accept: typecheck; manual: change grams, reload page, value persists; select another printer, reload, still selected.
- Depends: T9, T10.

**T12 (L) `src/pages/ComparePanel.tsx`**
- Checkbox lists bound to `last.compare.printerIds/filamentIds`; pricing chips add/remove; grid from `compareGrid`; grouped BarChart.
- Accept: typecheck; manual: 2 printers x 2 filaments x 2 pricings shows 4 rows x 2 columns; margin 100 shows "-".
- Depends: T5, T9, T11.

**T13 (L) `src/components/PresetPage.tsx` + wire `/app/printers`, `/app/filaments`**
- Generic props: `{ title; items; fields: { key; label; unit; min?; max? }[]; onSave(item); onDelete(id) }`. New item gets `crypto.randomUUID()`. Validate with the T2 schema before save; show messages. Delete uses `window.confirm`.
- Accept: typecheck; manual: add, edit, delete a printer and a filament; reload keeps changes.
- Depends: T2, T8.

**T14 (L) `src/pages/Settings.tsx`**
- Defaults form (Settings fields), Export button (Blob + `a[download]`), Import (file input, 1 MB limit, `parseImport`, summary, Replace/Cancel).
- Accept: typecheck; manual: export, delete a printer, import the file, printer is back; import a `.txt` shows an error and changes nothing.
- Depends: T6, T7, T8.

**T15 (L) `src/pages/Home.tsx`**
- Content per section 5, copy in brand voice (no prohibited terms). Live example via `runQuote(buildQuoteInput(...DEFAULT_DATA))`.
- Accept: typecheck; `grep -i -E "seamless|revolutionary|leverage|best-in-class" src/pages/Home.tsx` returns nothing.
- Depends: T9, T10.

### Phase 4: ship

**T16 (P) Smoke test, workflow, review**
- Files: `tests/smoke.test.tsx` (section 9), root `.github/workflows/pages.yml` (section 10), commit regenerated `package-lock.json`.
- Accept: `npm test -w layer-rate-web` all green; `npm run typecheck -w layer-rate-web`; workflow run green; deployed `/app/printers` loads on refresh; reviewer checks brand rules (no purple, no emoji, one orange number per screen, focus rings visible, keyboard nav through menu and forms).
- Depends: all.

Parallel after T2: T3, T4, T6. After T8: T9, T10, T13 in parallel.
