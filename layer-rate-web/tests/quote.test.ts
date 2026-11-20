import { describe, it, expect } from "vitest";
import { buildQuoteInput, runQuote, priceSegments, formatMoney, formatDuration } from "../src/lib/quote";
import type { Printer, Filament, Settings, LastInputs } from "../src/lib/schema";

// Expected QuoteInput for the fixtures above (was a gitignored CLI JSON file, missing in CI).
const example = {
  designCost: 0,
  materials: [{ name: "PLA", amount: { value: 22, unit: "g" }, costPer: { value: 15, unit: "kg" } }],
  printTime: { hours: 1, minutes: 50 },
  printerPurchasePrice: 1000,
  printerPowerWatts: 350,
  electricityCostPerKwh: 0.2,
  printerLifetimeYears: 5,
  typicalUsageHoursPerDay: 3,
  repairRatioPercent: 20,
  laborCostPerHour: 10,
  setupTime: { minutes: 1 },
  operationsTime: { minutes: 1 },
  postProcessingTime: { minutes: 1 },
  failRatioPercent: 20,
  componentCost: 0,
  pricing: { mode: "markup", percent: 223 },
  quantity: 1,
};

const printer: Printer = {
  id: "x",
  name: "Ender 3",
  printerPurchasePrice: 1000,
  printerPowerWatts: 350,
  printerLifetimeYears: 5,
  typicalUsageHoursPerDay: 3,
  repairRatioPercent: 20,
};

const filament: Filament = { id: "x", name: "PLA", costPerKg: 15 };

const settings: Settings = {
  currency: "EUR",
  electricityCostPerKwh: 0.2,
  laborCostPerHour: 10,
  setupMinutes: 1,
  operationsMinutes: 1,
  postProcessingMinutes: 1,
  failRatioPercent: 20,
  taxPercent: 0,
};

const last: LastInputs = {
  printerId: "x",
  filamentId: "x",
  grams: 22,
  hours: 1,
  minutes: 50,
  quantity: 1,
  designCost: 0,
  componentCost: 0,
  pricing: { mode: "markup", percent: 223 },
  tab: "single",
  compare: { printerIds: [], filamentIds: [], pricings: [] },
};

describe("buildQuoteInput", () => {
  it("matches the example JSON", () => {
    expect(buildQuoteInput(printer, filament, settings, last)).toEqual(example);
  });
});

describe("runQuote", () => {
  it("returns ok with a positive perJobCustomerPrice", () => {
    const input = buildQuoteInput(printer, filament, settings, last);
    const res = runQuote(input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(Number.isFinite(res.result.perJobCustomerPrice)).toBe(true);
      expect(res.result.perJobCustomerPrice).toBeGreaterThan(0);
    }
  });

  it("priceSegments sum equals perJobCustomerPrice", () => {
    const input = buildQuoteInput(printer, filament, settings, last);
    const res = runQuote(input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const segments = priceSegments(res.result, 1);
      const sum = segments.reduce((acc, s) => acc + s.value, 0);
      expect(Math.abs(sum - res.result.perJobCustomerPrice)).toBeLessThan(1e-9);
    }
  });

  it("returns ok:false for invalid pricing (margin 100%)", () => {
    const input = buildQuoteInput(printer, filament, settings, last);
    const bad = { ...input, pricing: { mode: "margin" as const, percent: 100 } };
    const res = runQuote(bad);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues.length).toBeGreaterThan(0);
    }
  });
});

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(1, 50)).toBe("1 h 50 min");
  });
  it("formats minutes only", () => {
    expect(formatDuration(0, 5)).toBe("5 min");
  });
});

describe("formatMoney", () => {
  it("formats 12.5 EUR with two decimals", () => {
    expect(formatMoney(12.5, "EUR")).toContain("12.50");
  });
});
