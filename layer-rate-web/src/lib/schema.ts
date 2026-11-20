import { z } from "zod";

export const STORAGE_KEY = "layer-rate" as const;

export const PricingSchema = z
  .object({
    mode: z.enum(["markup", "margin"]),
    percent: z.number().finite().min(0),
  })
  .superRefine((val, ctx) => {
    if (val.mode === "margin" && val.percent >= 100) {
      ctx.addIssue({
        code: "custom",
        message: "percent must be < 100 when mode is margin",
        path: ["percent"],
      });
    }
  });

export const PrinterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  printerPurchasePrice: z.number().finite().min(0),
  printerPowerWatts: z.number().finite().min(0),
  printerLifetimeYears: z.number().finite().gt(0),
  typicalUsageHoursPerDay: z.number().finite().gt(0).max(24),
  repairRatioPercent: z.number().finite().min(0).max(100),
});

export const FilamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  costPerKg: z.number().finite().min(0),
});

export const SettingsSchema = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  electricityCostPerKwh: z.number().finite().min(0),
  laborCostPerHour: z.number().finite().min(0),
  setupMinutes: z.number().finite().min(0),
  operationsMinutes: z.number().finite().min(0),
  postProcessingMinutes: z.number().finite().min(0),
  failRatioPercent: z.number().finite().min(0).max(100),
  taxPercent: z.number().finite().min(0).max(100),
});

export const LastInputsSchema = z.object({
  printerId: z.string().nullable(),
  filamentId: z.string().nullable(),
  grams: z.number().finite().min(0),
  hours: z.number().finite().min(0),
  minutes: z.number().finite().min(0),
  designCost: z.number().finite().min(0),
  componentCost: z.number().finite().min(0),
  quantity: z.number().int().min(1),
  pricing: PricingSchema,
  tab: z.enum(["single", "compare"]),
  compare: z.object({
    printerIds: z.array(z.string()),
    filamentIds: z.array(z.string()),
    pricings: z.array(PricingSchema),
  }),
});

export const AppDataSchema = z.object({
  version: z.literal(1),
  printers: z.array(PrinterSchema),
  filaments: z.array(FilamentSchema),
  settings: SettingsSchema,
  last: LastInputsSchema,
});

export type Pricing = z.infer<typeof PricingSchema>;
export type Printer = z.infer<typeof PrinterSchema>;
export type Filament = z.infer<typeof FilamentSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type LastInputs = z.infer<typeof LastInputsSchema>;
export type AppData = z.infer<typeof AppDataSchema>;

export const DEFAULT_DATA: AppData = {
  version: 1,
  printers: [
    {
      id: "ender-3",
      name: "Ender 3",
      printerPurchasePrice: 250,
      printerPowerWatts: 200,
      printerLifetimeYears: 5,
      typicalUsageHoursPerDay: 4,
      repairRatioPercent: 20,
    },
    {
      id: "bambu-a1",
      name: "Bambu A1",
      printerPurchasePrice: 400,
      printerPowerWatts: 150,
      printerLifetimeYears: 6,
      typicalUsageHoursPerDay: 6,
      repairRatioPercent: 10,
    },
    {
      id: "bambu-x1c",
      name: "Bambu Lab X1C",
      printerPurchasePrice: 1199,
      printerPowerWatts: 350,
      printerLifetimeYears: 5,
      typicalUsageHoursPerDay: 4,
      repairRatioPercent: 10,
    },
    {
      id: "bambu-h2d",
      name: "Bambu Lab H2D",
      printerPurchasePrice: 2199,
      printerPowerWatts: 500,
      printerLifetimeYears: 5,
      typicalUsageHoursPerDay: 4,
      repairRatioPercent: 10,
    },
  ],
  filaments: [
    { id: "pla-generic", name: "PLA (generic)", costPerKg: 15 },
    { id: "pla-basic", name: "PLA Basic", costPerKg: 12 },
    { id: "pla-silk", name: "PLA Silk", costPerKg: 15 },
    { id: "petg", name: "PETG", costPerKg: 15 },
    { id: "asa", name: "ASA", costPerKg: 27 },
  ],
  settings: {
    currency: "EUR",
    electricityCostPerKwh: 0.2,
    laborCostPerHour: 10,
    setupMinutes: 1,
    operationsMinutes: 1,
    postProcessingMinutes: 1,
    failRatioPercent: 20,
    taxPercent: 0,
  },
  last: {
    printerId: "ender-3",
    filamentId: "pla-generic",
    grams: 22,
    hours: 1,
    minutes: 50,
    quantity: 1,
    designCost: 0,
    componentCost: 0,
    pricing: { mode: "markup", percent: 223 },
    tab: "single",
    compare: { printerIds: [], filamentIds: [], pricings: [] },
  },
};
