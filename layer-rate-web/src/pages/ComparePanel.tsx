import { useState, type ReactElement } from "react";
import { useStore } from "../lib/store";
import { compareGrid } from "../lib/compare";
import { formatMoney } from "../lib/quote";
import { BarChart } from "../components/BarChart";
import type { Pricing } from "../lib/schema";

export function ComparePanel(): ReactElement {
  const { data, update } = useStore();
  const { printerIds, filamentIds } = data.last.compare;
  const pricings = data.last.compare.pricings;
  const grid = compareGrid(data);
  const currency = data.settings.currency;

  const [mode, setMode] = useState("markup");
  const [percent, setPercent] = useState("");
  const [error, setError] = useState("");

  function togglePrinter(id: string) {
    const next = printerIds.includes(id)
      ? printerIds.filter((x) => x !== id)
      : [...printerIds, id];
    const ordered = data.printers.map((p) => p.id).filter((pid) => next.includes(pid));
    update((d) => ({ ...d, last: { ...d.last, compare: { ...d.last.compare, printerIds: ordered } } }));
  }

  function toggleFilament(id: string) {
    const next = filamentIds.includes(id)
      ? filamentIds.filter((x) => x !== id)
      : [...filamentIds, id];
    const ordered = data.filaments.map((f) => f.id).filter((fid) => next.includes(fid));
    update((d) => ({ ...d, last: { ...d.last, compare: { ...d.last.compare, filamentIds: ordered } } }));
  }

  function removePricing(index: number) {
    const next = pricings.filter((_, i) => i !== index);
    update((d) => ({ ...d, last: { ...d.last, compare: { ...d.last.compare, pricings: next } } }));
  }

  function addPricing() {
    const val = Number(percent);
    if (!Number.isFinite(val) || val < 0) {
      setError("Enter a valid non-negative number.");
      return;
    }
    if (mode === "margin" && val >= 100) {
      setError("Margin must be less than 100%.");
      return;
    }
    const newPricing: Pricing = { mode: mode as "markup" | "margin", percent: val };
    update((d) => ({
      ...d,
      last: { ...d.last, compare: { ...d.last.compare, pricings: [...d.last.compare.pricings, newPricing] } },
    }));
    setPercent("");
    setError("");
  }

  const chartItems = grid.rows
    .filter((row) => row.cells.length > 0 && row.cells[0].ok)
    .map((row) => ({
      label: row.printer.name + " / " + row.filament.name,
      value: (row.cells[0] as { ok: true; perJob: number }).perJob,
    }));

  return (
    <section className="compare">
      <div className="picker-grid">
        <fieldset className="card picker">
          <legend>Printers</legend>
          {data.printers.length === 0 ? (
            <p>Add printers and filament first.</p>
          ) : (
            data.printers.map((p) => (
              <label key={p.id} className="check-row">
                <input
                  type="checkbox"
                  checked={printerIds.includes(p.id)}
                  onChange={() => togglePrinter(p.id)}
                />{" "}
                {p.name}
              </label>
            ))
          )}
        </fieldset>
        <fieldset className="card picker">
          <legend>Filament</legend>
          {data.filaments.length === 0 ? (
            <p>Add printers and filament first.</p>
          ) : (
            data.filaments.map((f) => (
              <label key={f.id} className="check-row">
                <input
                  type="checkbox"
                  checked={filamentIds.includes(f.id)}
                  onChange={() => toggleFilament(f.id)}
                />{" "}
                {f.name}
              </label>
            ))
          )}
        </fieldset>
      </div>

      <fieldset className="card">
        <legend>Pricing</legend>
        <div className="chip-row">
          {pricings.map((p, i) => (
            <span key={i} className="chip">
              {p.mode} {p.percent} %{" "}
              <button
                className="link-button"
                aria-label={`Remove ${p.mode} ${p.percent} %`}
                onClick={() => removePricing(i)}
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="add-row">
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="markup">markup</option>
            <option value="margin">margin</option>
          </select>
          <span className="input-with-unit">
            <input
              type="number"
              min="0"
              step="0.1"
              aria-label="Percent"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
            <span className="unit">%</span>
          </span>
          <button onClick={addPricing}>Add</button>
        </div>
        {error && <p role="alert" className="form-error">{error}</p>}
      </fieldset>

      {grid.rows.length === 0 ? (
        <p>Select at least one printer and one filament to see quotes.</p>
      ) : (
        <table className="grid-table">
          <caption>Price per job</caption>
          <thead>
            <tr>
              <th>Printer</th>
              <th>Filament</th>
              {grid.pricings.map((p, i) => (
                <th key={i} className="num">
                  {p.mode} {p.percent} %
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row, ri) => (
              <tr key={ri}>
                <th scope="row">{row.printer.name}</th>
                <td>{row.filament.name}</td>
                {row.cells.map((cell, ci) =>
                  cell.ok ? (
                    <td key={ci} className="num">
                      {formatMoney(cell.perJob, currency)}
                    </td>
                  ) : (
                    <td
                      key={ci}
                      className="num invalid"
                      title={cell.message}
                      aria-label={"not available: " + cell.message}
                    >
                      -
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {chartItems.length > 0 && (
        <div>
          <h2>Price per job, first pricing</h2>
          <BarChart
            kind="grouped"
            items={chartItems}
            format={(n) => formatMoney(n, currency)}
          />
        </div>
      )}
    </section>
  );
}
