import type { AppData, Printer, Filament, Pricing } from "./schema";
import { buildQuoteInput, runQuote } from "./quote";

export type CompareCell = { ok: true; perJob: number } | { ok: false; message: string };
export type CompareRow = { printer: Printer; filament: Filament; cells: CompareCell[] };

export function compareGrid(data: AppData): { rows: CompareRow[]; pricings: Pricing[] } {
  const pricings = data.last.compare.pricings;
  const { printerIds, filamentIds } = data.last.compare;
  const rows: CompareRow[] = [];

  for (const printerId of printerIds) {
    const printer = data.printers.find((p) => p.id === printerId);
    if (!printer) continue;

    for (const filamentId of filamentIds) {
      const filament = data.filaments.find((f) => f.id === filamentId);
      if (!filament) continue;

      const cells: CompareCell[] = pricings.map((pricing) => {
        try {
          const input = buildQuoteInput(printer, filament, data.settings, { ...data.last, pricing });
          const result = runQuote(input);
          if (result.ok) {
            return { ok: true as const, perJob: result.result.perJobCustomerPrice };
          }
          return { ok: false as const, message: result.issues[0]?.message ?? "Invalid input" };
        } catch {
          return { ok: false as const, message: "Invalid input" };
        }
      });

      rows.push({ printer, filament, cells });
    }
  }

  return { rows, pricings };
}
