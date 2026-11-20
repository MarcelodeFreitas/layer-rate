import { describe, it, expect } from "vitest";
import { compareGrid } from "../src/lib/compare";
import { DEFAULT_DATA, type AppData } from "../src/lib/schema";

function makeData(overrides: Partial<AppData["last"]["compare"]> = {}): AppData {
  return {
    ...DEFAULT_DATA,
    filaments: [
      { id: "pla", name: "PLA", costPerKg: 15 },
      { id: "petg", name: "PETG", costPerKg: 20 },
      { id: "abs", name: "ABS", costPerKg: 18 },
    ],
    last: {
      ...DEFAULT_DATA.last,
      compare: {
        printerIds: ["ender-3", "bambu-a1"],
        filamentIds: ["pla", "petg", "abs"],
        pricings: [
          { mode: "markup", percent: 150 },
          { mode: "margin", percent: 100 },
        ],
        ...overrides,
      },
    },
  };
}

describe("compareGrid", () => {
  it("returns 6 rows each with 2 cells", () => {
    const { rows } = compareGrid(makeData());
    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.cells).toHaveLength(2);
    }
  });

  it("markup cells are ok with perJob > 0", () => {
    const { rows } = compareGrid(makeData());
    for (const row of rows) {
      const cell = row.cells[0];
      expect(cell.ok).toBe(true);
      if (cell.ok) expect(cell.perJob).toBeGreaterThan(0);
    }
  });

  it("margin-100 cells are not ok with non-empty message", () => {
    const { rows } = compareGrid(makeData());
    for (const row of rows) {
      const cell = row.cells[1];
      expect(cell.ok).toBe(false);
      if (!cell.ok) expect(cell.message.length).toBeGreaterThan(0);
    }
  });

  it("empty filamentIds yields empty rows", () => {
    const { rows } = compareGrid(makeData({ filamentIds: [] }));
    expect(rows).toEqual([]);
  });

  it("skips unknown printer id", () => {
    const { rows } = compareGrid(makeData({ printerIds: ["ender-3", "nope"] }));
    expect(rows).toHaveLength(3);
  });
});
