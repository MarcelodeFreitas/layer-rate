import type { LayerRateQuoteInput } from "layer-rate-core";

export const exampleQuoteInput: LayerRateQuoteInput = {
  designCost: 0,
  materials: [
    {
      name: "PLA",
      amount: { value: 22, unit: "g" },
      costPer: { value: 15, unit: "kg" },
    },
  ],
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
