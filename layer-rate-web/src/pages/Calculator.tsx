import { useRef, useState } from "react";
import { Link } from "react-router";
import { useStore } from "../lib/store";
import { buildQuoteInput, runQuote, priceSegments, formatMoney, formatDuration } from "../lib/quote";
import { BarChart } from "../components/BarChart";
import { BreakdownTable } from "../components/BreakdownTable";
import { ComparePanel } from "./ComparePanel";
import type { LayerRateQuoteResult } from "layer-rate-core";

export function Calculator() {
  const { data, update } = useStore();
  const last = data.last;
  const printer = data.printers.find((p) => p.id === last.printerId) ?? data.printers[0];
  const filament = data.filaments.find((f) => f.id === last.filamentId) ?? data.filaments[0];
  const currency = data.settings.currency;
  const lastGood = useRef<LayerRateQuoteResult | null>(null);
  // Quantity shows what is being typed; the stored value only changes to a whole number of 1 or more.
  const [qtyDraft, setQtyDraft] = useState<string | null>(null);

  const num = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const setLast = (patch: Partial<typeof last>) => {
    update((d) => ({ ...d, last: { ...d.last, ...patch } }));
  };

  const setPricing = (patch: Partial<typeof last.pricing>) => {
    update((d) => ({ ...d, last: { ...d.last, pricing: { ...d.last.pricing, ...patch } } }));
  };

  let res: ReturnType<typeof runQuote> | null = null;
  if (data.printers.length > 0 && data.filaments.length > 0) {
    const input = buildQuoteInput(printer, filament, data.settings, last);
    res = runQuote(input);
  }

  if (res?.ok) {
    lastGood.current = res.result;
  }

  const shown = res?.ok ? res.result : lastGood.current;

  return (
    <main className="page">
      <div className="page-header">
        <h1>Calculator</h1>
        <div role="tablist" className="segmented-control">
          <button
            role="tab"
            aria-selected={last.tab === "single"}
            onClick={() => setLast({ tab: "single" })}
          >
            Single
          </button>
          <button
            role="tab"
            aria-selected={last.tab === "compare"}
            onClick={() => setLast({ tab: "compare" })}
          >
            Compare
          </button>
        </div>
      </div>
      {last.tab === "compare" ? (
        <ComparePanel />
      ) : data.printers.length === 0 ? (
        <p>
          Add a printer first. <Link to="/app/printers">Go to Printers</Link>
        </p>
      ) : data.filaments.length === 0 ? (
        <p>
          Add a filament first. <Link to="/app/filaments">Go to Filaments</Link>
        </p>
      ) : (
        <div className="calc-layout">
          <div className="calc-inputs">
            <form className="calc-form" onSubmit={(e) => e.preventDefault()}>
              <section className="card">
                <h2>Job</h2>
                <div className="field-grid">
                  <label className="span-2">
                    Printer{" "}
                    <select
                      value={last.printerId ?? printer.id}
                      onChange={(e) => setLast({ printerId: e.target.value })}
                    >
                      {data.printers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    Filament{" "}
                    <select
                      value={last.filamentId ?? filament.id}
                      onChange={(e) => setLast({ filamentId: e.target.value })}
                    >
                      {data.filaments.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Filament used{" "}
                    <span className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={last.grams || ""}
                        onChange={(e) => setLast({ grams: num(e.target.value) })}
                      />
                      <span className="unit">g</span>
                    </span>
                  </label>
                  <label>
                    Quantity{" "}
                    <span className="input-with-unit">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={qtyDraft ?? last.quantity}
                        onChange={(e) => {
                          setQtyDraft(e.target.value);
                          const n = Math.round(num(e.target.value));
                          if (n >= 1) setLast({ quantity: n });
                        }}
                        onBlur={() => setQtyDraft(null)}
                      />
                      <span className="unit">pcs</span>
                    </span>
                  </label>
                  <label>
                    Hours{" "}
                    <span className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={last.hours || ""}
                        onChange={(e) => setLast({ hours: num(e.target.value) })}
                      />
                      <span className="unit">h</span>
                    </span>
                  </label>
                  <label>
                    Minutes{" "}
                    <span className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        step="1"
                        value={last.minutes || ""}
                        onChange={(e) => setLast({ minutes: num(e.target.value) })}
                      />
                      <span className="unit">min</span>
                    </span>
                  </label>
                </div>
              </section>
              <section className="card">
                <h2>Pricing</h2>
                <div className="field-grid">
                  <label>
                    Pricing mode{" "}
                    <select
                      value={last.pricing.mode}
                      onChange={(e) => setPricing({ mode: e.target.value as "markup" | "margin" })}
                    >
                      <option value="markup">markup</option>
                      <option value="margin">margin</option>
                    </select>
                  </label>
                  <label>
                    Pricing percent{" "}
                    <span className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={last.pricing.percent || ""}
                        onChange={(e) => setPricing({ percent: num(e.target.value) })}
                      />
                      <span className="unit">%</span>
                    </span>
                  </label>
                </div>
                <details>
                  <summary>More inputs</summary>
                  <div className="field-grid">
                    <label>
                      Design cost{" "}
                      <span className="input-with-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={last.designCost || ""}
                          onChange={(e) => setLast({ designCost: num(e.target.value) })}
                        />
                        <span className="unit">{currency}</span>
                      </span>
                    </label>
                    <label>
                      Component cost{" "}
                      <span className="input-with-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={last.componentCost || ""}
                          onChange={(e) => setLast({ componentCost: num(e.target.value) })}
                        />
                        <span className="unit">{currency}</span>
                      </span>
                    </label>
                  </div>
                </details>
              </section>
            </form>
            {res && !res.ok && (
              <ul role="alert">
                {res.issues.map((issue, i) => (
                  <li key={i}>
                    {issue.path ? issue.path + ": " : ""}
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {shown && (
            <div className="card card--result calc-result">
              <p className="result-label">Price per job</p>
              <p className="price-highlight">{formatMoney(shown.perJobCustomerPrice, currency)}</p>
              <p className="result-summary">
                Total for {last.quantity} job(s):{" "}
                <span className="mono">{formatMoney(shown.customerPriceAllJobs, currency)}</span>
                {" · "}Print time:{" "}
                <span className="mono">{formatDuration(last.hours, last.minutes)}</span>
              </p>
              <hr className="divider" />
              <h2>Where the price goes</h2>
              <BarChart
                kind="stacked"
                items={priceSegments(shown, last.quantity)}
                format={(n) => formatMoney(n, currency)}
              />
              <h2>Breakdown</h2>
              <BreakdownTable result={shown} currency={currency} quantity={last.quantity} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
