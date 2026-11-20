import { describe, it, expect } from "vitest";
import { CORRUPT_KEY, loadData, saveData } from "../src/lib/storage";
import { DEFAULT_DATA, STORAGE_KEY } from "../src/lib/schema";

class FakeStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

function throwingSetItem(): Storage {
  return {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

function throwingGetItem(): Storage {
  return {
    getItem: () => {
      throw new Error("denied");
    },
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

describe("loadData", () => {
  it("returns defaults when storage is null", () => {
    const r = loadData(null);
    expect(r.data).toEqual(DEFAULT_DATA);
    expect(r.storageOk).toBe(false);
    expect(r.recovered).toBe(false);
  });

  it("returns defaults with storageOk true when key is missing", () => {
    const fake = new FakeStorage();
    const r = loadData(fake);
    expect(r.data).toEqual(DEFAULT_DATA);
    expect(r.storageOk).toBe(true);
    expect(r.recovered).toBe(false);
  });

  it("round-trips save then load", () => {
    const fake = new FakeStorage();
    expect(saveData(fake, DEFAULT_DATA)).toBe(true);
    const r = loadData(fake);
    expect(r.data).toEqual(DEFAULT_DATA);
    expect(r.storageOk).toBe(true);
    expect(r.recovered).toBe(false);
  });

  it("recovers on corrupt JSON and stores it under CORRUPT_KEY", () => {
    const fake = new FakeStorage();
    fake.setItem(STORAGE_KEY, "{not json");
    const r = loadData(fake);
    expect(r.data).toEqual(DEFAULT_DATA);
    expect(r.recovered).toBe(true);
    expect(fake.getItem(CORRUPT_KEY)).toBe("{not json");
  });

  it("recovers on valid JSON with wrong version", () => {
    const fake = new FakeStorage();
    const bad = JSON.stringify({ ...DEFAULT_DATA, version: 2 });
    fake.setItem(STORAGE_KEY, bad);
    const r = loadData(fake);
    expect(r.recovered).toBe(true);
    expect(fake.getItem(CORRUPT_KEY)).toBe(bad);
  });

  it("does not overwrite an existing CORRUPT_KEY", () => {
    const fake = new FakeStorage();
    fake.setItem(CORRUPT_KEY, "old");
    fake.setItem(STORAGE_KEY, "{broken");
    loadData(fake);
    expect(fake.getItem(CORRUPT_KEY)).toBe("old");
  });

  it("returns storageOk false when getItem throws", () => {
    const r = loadData(throwingGetItem());
    expect(r.storageOk).toBe(false);
    expect(r.data).toEqual(DEFAULT_DATA);
  });
});

describe("saveData", () => {
  it("returns false and does not throw when setItem throws", () => {
    expect(() => saveData(throwingSetItem(), DEFAULT_DATA)).not.toThrow();
    expect(saveData(throwingSetItem(), DEFAULT_DATA)).toBe(false);
  });

  it("returns false when storage is null", () => {
    expect(saveData(null, DEFAULT_DATA)).toBe(false);
  });
});
