import { useState, type ReactElement, type FormEvent, type ChangeEvent } from "react";
import { SettingsSchema, type AppData } from "../lib/schema";
import { useStore } from "../lib/store";
import { exportJson, backupFileName, parseImport, type ImportSummary } from "../lib/backup";

export function Settings(): ReactElement {
  const { data, update } = useStore();

  const [currency, setCurrency] = useState(data.settings.currency);
  // 0 starts as an empty field, so typing a value does not produce "056".
  const [electricityCostPerKwh, setElectricityCostPerKwh] = useState(String(data.settings.electricityCostPerKwh || ""));
  const [laborCostPerHour, setLaborCostPerHour] = useState(String(data.settings.laborCostPerHour || ""));
  const [setupMinutes, setSetupMinutes] = useState(String(data.settings.setupMinutes || ""));
  const [operationsMinutes, setOperationsMinutes] = useState(String(data.settings.operationsMinutes || ""));
  const [postProcessingMinutes, setPostProcessingMinutes] = useState(String(data.settings.postProcessingMinutes || ""));
  const [failRatioPercent, setFailRatioPercent] = useState(String(data.settings.failRatioPercent || ""));
  const [taxPercent, setTaxPercent] = useState(String(data.settings.taxPercent || ""));

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formSaved, setFormSaved] = useState(false);

  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [pending, setPending] = useState<{ data: AppData; summary: ImportSummary } | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormSaved(false);

    const obj = {
      currency: currency.toUpperCase(),
      electricityCostPerKwh: Number(electricityCostPerKwh),
      laborCostPerHour: Number(laborCostPerHour),
      setupMinutes: Number(setupMinutes),
      operationsMinutes: Number(operationsMinutes),
      postProcessingMinutes: Number(postProcessingMinutes),
      failRatioPercent: Number(failRatioPercent),
      taxPercent: Number(taxPercent),
    };

    const result = SettingsSchema.safeParse(obj);
    if (!result.success) {
      setFormErrors(result.error.issues.map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`));
      return;
    }
    setFormErrors([]);
    update((d) => ({ ...d, settings: result.data }));
    setFormSaved(true);
  }

  function handleExport() {
    const blob = new Blob([exportJson(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName(new Date());
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      setImportErrors(["File is larger than 1 MB."]);
      setPending(null);
      return;
    }
    const text = await file.text();
    const r = parseImport(text, data);
    if (!r.ok) {
      setImportErrors(r.errors);
      setPending(null);
    } else {
      setImportErrors([]);
      setPending({ data: r.data, summary: r.summary });
    }
    e.target.value = "";
  }

  function confirmImport() {
    if (!pending) return;
    update(() => pending.data);
    setPending(null);
    setImportStatus("Backup imported.");
  }

  function cancelImport() {
    setPending(null);
  }

  return (
    <main className="page">
      <h1>Settings</h1>

      <section className="card">
        <h2>Defaults</h2>
        <form onSubmit={handleSubmit}>
          <div className="field-grid">
            <label>
              Currency (3 letters, e.g. EUR)
              <input type="text" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </label>
            <label>
              Electricity cost per kWh
              <input type="number" step="0.01" value={electricityCostPerKwh} onChange={(e) => setElectricityCostPerKwh(e.target.value)} />
            </label>
            <label>
              Labor cost per hour
              <input type="number" step="0.01" value={laborCostPerHour} onChange={(e) => setLaborCostPerHour(e.target.value)} />
            </label>
            <label>
              Setup time (min)
              <input type="number" step="1" value={setupMinutes} onChange={(e) => setSetupMinutes(e.target.value)} />
            </label>
            <label>
              Operations time (min)
              <input type="number" step="1" value={operationsMinutes} onChange={(e) => setOperationsMinutes(e.target.value)} />
            </label>
            <label>
              Post-processing time (min)
              <input type="number" step="1" value={postProcessingMinutes} onChange={(e) => setPostProcessingMinutes(e.target.value)} />
            </label>
            <label>
              Failed prints (%)
              <input type="number" step="1" value={failRatioPercent} onChange={(e) => setFailRatioPercent(e.target.value)} />
            </label>
            <label>
              Tax (%)
              <input type="number" step="0.1" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">Save defaults</button>
          </div>
        </form>
        {formErrors.length > 0 && (
          <ul role="alert">
            {formErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
        {formSaved && <p role="status">Defaults saved.</p>}
      </section>

      <section className="card">
        <h2>Backup</h2>
        <p>Your data stays in this browser. Export a file to keep a copy or move to another browser.</p>
        <div className="action-row">
          <button type="button" className="secondary" onClick={handleExport}>Export backup</button>
        </div>
        <label>
          Import a backup file
          <input type="file" accept="application/json,.json" onChange={handleImport} />
        </label>
        {importErrors.length > 0 && (
          <ul role="alert">
            {importErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
        {pending && (
          <section className="card card--result import-summary" aria-labelledby="import-title">
            <h3 id="import-title">Replace your data?</h3>
            <p>
              This replaces {pending.summary.current.printers} printer(s) and {pending.summary.current.filaments} filament(s), plus your defaults and last inputs, with {pending.summary.incoming.printers} printer(s) and {pending.summary.incoming.filaments} filament(s)
            </p>
            <p>Printers: {pending.summary.incoming.printerNames.join(", ")}.</p>
            <p>Filament: {pending.summary.incoming.filamentNames.join(", ")}.</p>
            <div className="form-actions">
              <button type="button" onClick={confirmImport}>Replace my data</button>
              <button type="button" className="link-button" onClick={cancelImport}>Cancel</button>
            </div>
          </section>
        )}
        {importStatus && <p role="status">{importStatus}</p>}
      </section>
    </main>
  );
}
