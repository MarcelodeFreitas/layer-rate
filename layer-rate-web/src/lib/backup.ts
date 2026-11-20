import { AppDataSchema, type AppData } from "./schema";

export interface ImportSummary {
  current: { printers: number; filaments: number };
  incoming: {
    printers: number;
    filaments: number;
    printerNames: string[];
    filamentNames: string[];
  };
}

export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function backupFileName(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `layer-rate-backup-${y}-${m}-${d}.json`;
}

export function parseImport(
  text: string,
  current: AppData,
): { ok: true; data: AppData; summary: ImportSummary } | { ok: false; errors: string[] } {
  if (text.length > 1_000_000) {
    return { ok: false, errors: ["File is larger than 1 MB."] };
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["This file is not valid JSON."] };
  }

  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "version" in value &&
    (value as Record<string, unknown>).version !== 1
  ) {
    const v = (value as Record<string, unknown>).version;
    return { ok: false, errors: [`This backup is version ${String(v)}; this app reads version 1.`] };
  }

  const result = AppDataSchema.safeParse(value);
  if (!result.success) {
    const errors = result.error.issues.slice(0, 10).map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    });
    return { ok: false, errors };
  }

  const data = result.data;

  const pIds = new Set<string>();
  for (const p of data.printers) {
    if (pIds.has(p.id)) return { ok: false, errors: [`Duplicate printer id: ${p.id}`] };
    pIds.add(p.id);
  }

  const fIds = new Set<string>();
  for (const f of data.filaments) {
    if (fIds.has(f.id)) return { ok: false, errors: [`Duplicate filament id: ${f.id}`] };
    fIds.add(f.id);
  }

  const summary: ImportSummary = {
    current: { printers: current.printers.length, filaments: current.filaments.length },
    incoming: {
      printers: data.printers.length,
      filaments: data.filaments.length,
      printerNames: data.printers.map((p) => p.name),
      filamentNames: data.filaments.map((f) => f.name),
    },
  };

  return { ok: true, data, summary };
}
