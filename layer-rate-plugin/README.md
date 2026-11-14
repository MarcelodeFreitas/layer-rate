# LayerRate plugin for Claude Code

Price FDM 3D print jobs from inside Claude Code. Give it the filament grams, print time and job details, and it returns a transparent price and cost breakdown. The pricing math comes from the bundled LayerRate calculator, so nothing else needs to be installed.

## Requirements

- Claude Code.
- Node.js 20 or newer. The skill runs the bundled calculator with `node`.

## Install

From a local copy of this folder:

```sh
claude plugin marketplace add /path/to/layer-rate-plugin
claude plugin install layer-rate@layer-rate-local
```

When the plugin is enabled, Claude Code asks for your shared shop settings: electricity, labor, failed-job surcharge, markup or margin, tax, material prices per kg and currency. You can change them later with `/config`.

## Printers

Each printer has its own profile: purchase price, power, lifetime, hours per day and maintenance reserve. The skill keeps the profiles in the plugin's data folder, and it asks you for them the first time, so one shop can quote on several machines. Ask it to add a printer, or to compare a job across your printers.

`examples/printers.example.json` shows the profile format.

## Use

Ask in plain language, for example "price a 45 g PETG print that takes 3h20", or run `/layer-rate:quote`. Claude asks for anything missing, such as quantity or setup time, and never guesses shop values.

Save a job you repeat as a preset (printer, materials, times, component cost, fees) and call it by name next time, such as "the usual keychain". Presets live in the plugin data folder with the printers.

For what-if questions, ask in plain language: "what if the markup were 200", or "what margin do I get if I charge 8 euros". The calculator's `solve` command finds the markup and margin for a target price.

## Updating the calculator

The calculator is committed as `cli/layer-rate.mjs`. After changing the engine, run `npm run build` at the repository root so the bundle is rebuilt, then bump `version` in `.claude-plugin/plugin.json`.
