---
name: quote
description: Calculate the price and full cost breakdown of an FDM 3D print job with the bundled LayerRate calculator, for the printer the user chooses. Use when the user asks what to charge, wants the price, cost, margin or breakdown of a print, or gives filament grams and print time (for example "quanto cobro por 45 g de PETG, 3h20", "calcula o preço desta peça", "price this print", "what's my cost on this job", "compare this job on my printers"). Also use for what-if questions ("what if the markup were 200", "what margin do I get if I charge 8 euros") and to load a saved job preset ("the usual keychain"). Also use to add or edit a printer or save a preset. Produces numbers only; customer-facing wording is handled by other skills.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/cli/layer-rate.mjs" *), Bash(node ${CLAUDE_PLUGIN_ROOT}/cli/layer-rate.mjs *)
---

# LayerRate quote

Calculate one print job with the bundled calculator. Never work out prices yourself. The calculator returns raw numbers; you round and present them.

## 1. Check the shared shop settings

These apply to every printer. Current values:

- Electricity per kWh: `${user_config.electricity_cost_per_kwh}`
- Labor per hour: `${user_config.labor_cost_per_hour}`
- Failed-job surcharge (%): `${user_config.fail_ratio_percent}`
- Pricing mode: `${user_config.pricing_mode}`
- Markup or margin (%): `${user_config.pricing_percent}`
- Tax (%): `${user_config.tax_percent}`
- Material costs per kg: `${user_config.material_costs_per_kg}`
- Currency: `${user_config.currency}`

If any of these is empty, or still shows the literal text `${user_config.`, stop and ask the user for it. Tell them they can set it in `/config`. Never guess a shop value.

## 2. Choose the printer

The printer profiles are in `${CLAUDE_PLUGIN_DATA}/printers.json`. Read that file with the Read tool.

- **File missing or no printers in it:** say the user has no printers saved yet. Ask for each value: name, purchase price, power in watts, lifetime in years, typical hours per day, and maintenance reserve %. Show the values back and wait for a yes. Then write the file with the Write tool. Keep any printers that are already there. Never guess these values.
- **One printer:** use it, and say which one you used.
- **Several printers:** ask which one to use. If the user asks to compare, run the quote once per printer and show the results side by side.

Each printer profile has these fields, which go straight into the quote input:

```json
{
  "printers": {
    "Ender 3": {
      "printerPurchasePrice": 250,
      "printerPowerWatts": 200,
      "printerLifetimeYears": 5,
      "typicalUsageHoursPerDay": 4,
      "repairRatioPercent": 20
    }
  }
}
```

To edit a printer, change only the values the user asks about. Write the file again with all the printers.

## 3. Load the job

Saved jobs (presets) are in `${CLAUDE_PLUGIN_DATA}/presets.json`, keyed by name. Read it with the Read tool if it exists. Each preset holds: `printer`, `materials`, `printTime`, `setupTime`, `operationsTime`, `postProcessingTime`, `componentCost`, `designCost` and `fees`. Quantity is never saved.

- **The user names a preset** (for example "the usual keychain"): use its values. Ask only for what they change, such as grams, print time or quantity.
- **No preset:** ask for what has no default. Never invent it:
  - Material and grams for each material (from the slicer).
  - Print time (from the slicer), in hours and minutes.
  - Any extra fees the user mentions, with name, fixed amount or percent, and whether the customer pays them on top (`addOnTop`) or they are built into the price (`recover`).
- **Defaults when the user does not mention them:**
  - Quantity: 1.
  - Setup, operations and post-processing time: 1 minute each.
  - Component cost and design cost: 0.
  - Fees: none.
  
  Say in the result which defaults were used, so the user can correct them.
- **After a job the user will repeat:** offer to save it as a preset under a short name. Write `presets.json` with the Write tool only after a yes, and keep the presets already there.

The material price comes from the material costs in step 1. If the material is not listed there, ask for its price per kg.

## 4. Build the input

The input is one JSON object: the printer profile fields, the shared settings, and the job. Follow these rules:

- Percent fields are whole numbers: `20` means 20%.
- Durations are objects: `{"hours": 1, "minutes": 50}`. Zero must be written `{"minutes": 0}`. Each duration needs at least one of `hours` or `minutes`.
- Material `amount` is in `g` or `kg`. Material `costPer` is the price per that unit, so use `{"value": 20, "unit": "kg"}` for 20 per kg.
- `pricing.mode` is `markup` or `margin`. Markup adds a percent on top of cost. Margin is the share of the sale price kept as profit, so margin must be below 100.
- `failRatioPercent` is a surcharge on the failed-job cost. It is not a failure probability.
- Fees are optional. Each fee needs `name`, `behavior` (`recover` or `addOnTop`), and either `fixedAmount` or `percent` greater than 0.
- Map the shared settings to the input fields: `electricityCostPerKwh`, `laborCostPerHour`, `failRatioPercent`, `pricing`, `taxPercent`.
- If you are unsure about a field name or rule, run the `schema` command and read it.

## 5. Run the calculator

Pipe the JSON through a quoted heredoc. Replace the example values with the real ones:

```bash
node "${CLAUDE_PLUGIN_ROOT}/cli/layer-rate.mjs" quote --stdin --compact-json <<'JSON'
{
  "designCost": 0,
  "materials": [
    { "name": "PETG", "amount": { "value": 45, "unit": "g" }, "costPer": { "value": 22, "unit": "kg" } }
  ],
  "printTime": { "hours": 3, "minutes": 20 },
  "setupTime": { "minutes": 2 },
  "operationsTime": { "minutes": 3 },
  "postProcessingTime": { "minutes": 0 },
  "printerPurchasePrice": 250,
  "printerPowerWatts": 200,
  "printerLifetimeYears": 5,
  "typicalUsageHoursPerDay": 4,
  "repairRatioPercent": 20,
  "electricityCostPerKwh": 0.2,
  "laborCostPerHour": 10,
  "failRatioPercent": 10,
  "componentCost": 0,
  "pricing": { "mode": "markup", "percent": 100 },
  "taxPercent": 0,
  "quantity": 1
}
JSON
```

Handle the result:

- Exit code 0: the output is JSON with `input` and `result`. Go to step 7.
- Exit code 1: the input is invalid. Run the same JSON through `validate --stdin --json` instead. Read `issues[].path` and `issues[].message`, fix the field or ask the user, then retry once.
- Exit code 2: the command was used wrongly. Report it and stop.
- `node` is not found, or the version is older than 20: tell the user that Node.js 20 or newer is required, and stop.
- Bash heredocs are not available (for example on Windows without Git Bash): write the JSON to a file with the Write tool, then run `node "${CLAUDE_PLUGIN_ROOT}/cli/layer-rate.mjs" quote <file> --compact-json`.

## 6. What-if questions

Use the same input JSON as step 5. Never work out a margin or price yourself.

- **Another markup or margin** ("what if the markup were 200", "and at 40% margin"): change only `pricing` in the input, run `quote`, and show the new result. If the user asks for several, run once per value and show them side by side.
- **Margin is capped below 100.** If the user says "margin 200", they mean a markup of 200%. Use `markup`, and say that you did.
- **What margin do I get at a price** ("if I charge 8 euros, what's my margin"): run `solve` with the target per-job price, tax included. The price is per unit, the same figure as `perJobCustomerPrice`:

```bash
node "${CLAUDE_PLUGIN_ROOT}/cli/layer-rate.mjs" solve --stdin --price 8 --compact-json <<'JSON'
{ ...the same input JSON as step 5... }
JSON
```

  The output has `solution.markupPercent` and `solution.marginPercent`, plus the full `result` at that markup. If it exits with an error saying the price is below production cost, tell the user that no markup reaches that price.
- **Margin here** is profit as a share of what the seller receives, which is the same basis as margin pricing.

## 7. Present the result

Round money to 2 decimals for display only. Use the user's number style:

- Portuguese: comma decimal and the euro sign after the number, for example `10,63€`.
- English: point decimal and the euro sign before, for example `€10.63`.

Show:

- The printer used, and the preset if one was loaded.
- **Inputs used:** every input field, including the ones left at a default. Mark each default as "(default)". That covers quantity, each material's grams and price per kg, print time, setup, operations and post-processing time, design and component cost, fees (or "none"), electricity per kWh, labor per hour, failed-job surcharge, printer price, power, lifetime, hours per day, repair reserve, pricing mode and percent, and tax.
- Price per unit, and total customer price for all jobs.
- Production cost, profit and tax.
- **Cost breakdown:** a table of every `result.perJob` line, including zero lines. Each row has the euro amount and its share of production cost in percent, to one decimal. The shares should add up to 100.
- For a what-if, the markup and margin next to the price.
- One sentence naming the two largest cost lines.

## 8. Hand off

End with the per-unit price and the total. Do not write a customer message here. If the user wants a reply to a customer, use the customer-reply skill that is available, such as `b3dp-quote`, and give it these numbers.
