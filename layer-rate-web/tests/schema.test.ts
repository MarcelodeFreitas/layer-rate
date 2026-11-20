import { describe, it, expect } from "vitest";
import {
  AppDataSchema,
  PrinterSchema,
  PricingSchema,
  LastInputsSchema,
  DEFAULT_DATA,
} from "../src/lib/schema";

describe("schema", () => {
  it("parses DEFAULT_DATA without throwing", () => {
    expect(() => AppDataSchema.parse(DEFAULT_DATA)).not.toThrow();
  });

  it("rejects version 2", () => {
    const bad = { ...DEFAULT_DATA, version: 2 };
    expect(AppDataSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a printer with printerPurchasePrice -1", () => {
    const bad = { ...DEFAULT_DATA.printers[0], printerPurchasePrice: -1 };
    expect(PrinterSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects margin pricing with percent 100", () => {
    expect(PricingSchema.safeParse({ mode: "margin", percent: 100 }).success).toBe(false);
  });

  it("accepts markup pricing with percent 100", () => {
    expect(PricingSchema.safeParse({ mode: "markup", percent: 100 }).success).toBe(true);
  });

  it("rejects quantity 0 in LastInputsSchema", () => {
    const bad = { ...DEFAULT_DATA.last, quantity: 0 };
    expect(LastInputsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects quantity 1.5 in LastInputsSchema", () => {
    const bad = { ...DEFAULT_DATA.last, quantity: 1.5 };
    expect(LastInputsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects typicalUsageHoursPerDay of 25", () => {
    const bad = { ...DEFAULT_DATA.printers[0], typicalUsageHoursPerDay: 25 };
    expect(PrinterSchema.safeParse(bad).success).toBe(false);
  });
});
