import { STORAGE_KEY, AppDataSchema, DEFAULT_DATA, type AppData } from "./schema";

export const CORRUPT_KEY = "layer-rate.corrupt" as const;

export function getStorage(): Storage | null {
  if (typeof localStorage === "undefined") return null;
  try {
    localStorage.setItem("layer-rate-probe", "1");
    localStorage.removeItem("layer-rate-probe");
    return localStorage;
  } catch {
    return null;
  }
}

export function loadData(
  storage: Storage | null,
): { data: AppData; storageOk: boolean; recovered: boolean } {
  if (storage === null) {
    return { data: DEFAULT_DATA, storageOk: false, recovered: false };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { data: DEFAULT_DATA, storageOk: false, recovered: false };
  }

  if (raw === null) {
    return { data: DEFAULT_DATA, storageOk: true, recovered: false };
  }

  let parsed: unknown;
  let parseOk = false;
  try {
    parsed = JSON.parse(raw);
    parseOk = true;
  } catch {
    // JSON parse failed
  }

  if (parseOk) {
    const result = AppDataSchema.safeParse(parsed);
    if (result.success) {
      return { data: result.data, storageOk: true, recovered: false };
    }
  }

  // Recovery: preserve the corrupt payload for debugging
  try {
    if (storage.getItem(CORRUPT_KEY) === null) {
      storage.setItem(CORRUPT_KEY, raw);
    }
  } catch {
    // ignore
  }

  return { data: DEFAULT_DATA, storageOk: true, recovered: true };
}

export function saveData(storage: Storage | null, data: AppData): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
