import { describe, it, expect } from "vitest";
import { exportJson, backupFileName, parseImport } from "../src/lib/backup";
import { DEFAULT_DATA, type AppData } from "../src/lib/schema";

describe("backup", () => {
  it("round-trips DEFAULT_DATA", () => {
    const r = parseImport(exportJson(DEFAULT_DATA), DEFAULT_DATA);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(DEFAULT_DATA);
  });

  it("rejects non-JSON text", () => {
    const r = parseImport("hello", DEFAULT_DATA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("This file is not valid JSON.");
  });

  it("rejects wrong version", () => {
    const r = parseImport(JSON.stringify({ ...DEFAULT_DATA, version: 2 }), DEFAULT_DATA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("version 2");
  });

  it("rejects duplicate printer ids", () => {
    const data: AppData = {
      ...DEFAULT_DATA,
      printers: [
        DEFAULT_DATA.printers[0],
        { ...DEFAULT_DATA.printers[1], id: DEFAULT_DATA.printers[0].id },
      ],
    };
    const r = parseImport(exportJson(data), DEFAULT_DATA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("Duplicate printer id");
  });

  it("computes summary counts correctly", () => {
    const incoming: AppData = {
      ...DEFAULT_DATA,
      filaments: [...DEFAULT_DATA.filaments, { id: "nylon", name: "Nylon", costPerKg: 20 }],
    };
    const r = parseImport(exportJson(incoming), DEFAULT_DATA);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary.current).toEqual({
        printers: DEFAULT_DATA.printers.length,
        filaments: DEFAULT_DATA.filaments.length,
      });
      expect(r.summary.incoming.filaments).toBe(DEFAULT_DATA.filaments.length + 1);
      expect(r.summary.incoming.filamentNames).toHaveLength(DEFAULT_DATA.filaments.length + 1);
    }
  });

  it("formats backup file name", () => {
    expect(backupFileName(new Date(2026, 10, 18))).toBe("layer-rate-backup-2026-11-18.json");
  });

  it("rejects oversized text", () => {
    const r = parseImport("a".repeat(1_000_001), DEFAULT_DATA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("File is larger than 1 MB.");
  });
});
