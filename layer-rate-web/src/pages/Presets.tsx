import { PresetPage, type FieldDef } from "../components/PresetPage";
import { PrinterSchema, FilamentSchema, type Printer, type Filament } from "../lib/schema";
import { useStore } from "../lib/store";

const printerFields: FieldDef[] = [
  { key: "printerPurchasePrice", label: "Purchase price", step: "0.01" },
  { key: "printerPowerWatts", label: "Power", unit: "W" },
  { key: "printerLifetimeYears", label: "Lifetime", unit: "years", step: "0.5" },
  { key: "typicalUsageHoursPerDay", label: "Use per day", unit: "h", step: "0.5" },
  { key: "repairRatioPercent", label: "Repair ratio", unit: "%", step: "1" },
];

export function PrintersPage() {
  const { data, update } = useStore();
  return (
    <main className="page">
      <PresetPage
        title="Printers"
        items={data.printers}
        fields={printerFields}
        schema={PrinterSchema}
        onSave={(item) => update(d => ({ ...d, printers: d.printers.some(p => p.id === item.id) ? d.printers.map(p => p.id === item.id ? (item as Printer) : p) : [...d.printers, item as Printer] }))}
        onDelete={(id) => update(d => ({ ...d, printers: d.printers.filter(p => p.id !== id) }))}
      />
    </main>
  );
}

const filamentFields: FieldDef[] = [{ key: "costPerKg", label: "Cost per kg", step: "0.01" }];

export function FilamentsPage() {
  const { data, update } = useStore();
  return (
    <main className="page">
      <PresetPage
        title="Filament"
        items={data.filaments}
        fields={filamentFields}
        schema={FilamentSchema}
        onSave={(item) => update(d => ({ ...d, filaments: d.filaments.some(f => f.id === item.id) ? d.filaments.map(f => f.id === item.id ? (item as Filament) : f) : [...d.filaments, item as Filament] }))}
        onDelete={(id) => update(d => ({ ...d, filaments: d.filaments.filter(f => f.id !== id) }))}
      />
    </main>
  );
}
