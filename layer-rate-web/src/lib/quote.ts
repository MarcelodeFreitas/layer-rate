import {
  calculateQuote,
  validateQuoteInput,
  type LayerRateQuoteInput,
  type LayerRateQuoteResult,
  type LayerRateValidationIssue,
} from "layer-rate-core";
import type { Printer, Filament, Settings, LastInputs } from "./schema";

export function buildQuoteInput(
  printer: Printer,
  filament: Filament,
  settings: Settings,
  last: LastInputs,
): LayerRateQuoteInput {
  return {
    designCost: last.designCost,
    componentCost: last.componentCost,
    quantity: last.quantity,
    materials: [
      {
        name: filament.name,
        amount: { value: last.grams, unit: "g" },
        costPer: { value: filament.costPerKg, unit: "kg" },
      },
    ],
    printTime: { hours: last.days * 24 + last.hours, minutes: last.minutes },
    printerPurchasePrice: printer.printerPurchasePrice,
    printerPowerWatts: printer.printerPowerWatts,
    printerLifetimeYears: printer.printerLifetimeYears,
    typicalUsageHoursPerDay: printer.typicalUsageHoursPerDay,
    repairRatioPercent: printer.repairRatioPercent,
    electricityCostPerKwh: settings.electricityCostPerKwh,
    laborCostPerHour: settings.laborCostPerHour,
    failRatioPercent: settings.failRatioPercent,
    setupTime: { minutes: settings.setupMinutes },
    operationsTime: { minutes: settings.operationsMinutes },
    postProcessingTime: { minutes: settings.postProcessingMinutes },
    taxPercent: settings.taxPercent || undefined,
    pricing: last.pricing,
  };
}

export function runQuote(
  input: LayerRateQuoteInput,
):
  | { ok: true; result: LayerRateQuoteResult }
  | { ok: false; issues: LayerRateValidationIssue[] } {
  const issues = validateQuoteInput(input);
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  try {
    return { ok: true, result: calculateQuote(input) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, issues: [{ code: "CALCULATION_ERROR", path: "", message }] };
  }
}

export function priceSegments(
  result: LayerRateQuoteResult,
  quantity: number,
): { label: string; value: number }[] {
  const p = result.perJob;
  const segments: { label: string; value: number }[] = [
    { label: "Material", value: p.material },
    { label: "Machine", value: p.printerPower + p.runtime + p.machineMaintenanceSurcharge },
    { label: "Labor", value: p.operations + p.postProcessing + p.setup },
    { label: "Design", value: p.design },
    { label: "Components", value: p.components },
    { label: "Failed prints", value: p.failedJobSurcharge },
    { label: "Profit", value: result.totalProfitAllJobs / quantity },
    { label: "Tax", value: result.tax / quantity },
  ];
  return segments.filter((s) => s.value !== 0);
}

export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDuration(hours: number, minutes: number, days = 0): string {
  const parts = [days > 0 && `${days} d`, hours > 0 && `${hours} h`, minutes > 0 && `${minutes} min`].filter(Boolean);
  return parts.length ? parts.join(" ") : "0 min";
}
