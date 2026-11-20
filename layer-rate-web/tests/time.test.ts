import { describe, it, expect } from "vitest";
import { addDuration, dayDiff, isSameDay, monthCells } from "../src/lib/time";

describe("time helpers", () => {
  it("adds hours and minutes across midnight", () => {
    const end = addDuration(new Date(2026, 10, 19, 22, 0), 2, 30);
    expect(end.getTime()).toBe(new Date(2026, 10, 20, 0, 30).getTime());
    expect(dayDiff(new Date(2026, 10, 19, 22, 0), end)).toBe(1);
  });

  it("zero duration ends at the start", () => {
    const start = new Date(2026, 10, 19, 9, 15);
    expect(addDuration(start, 0, 0).getTime()).toBe(start.getTime());
    expect(dayDiff(start, addDuration(start, 0, 0))).toBe(0);
  });

  it("counts calendar days across a month end", () => {
    expect(dayDiff(new Date(2026, 10, 30, 23), new Date(2026, 11, 1, 1))).toBe(1);
    expect(dayDiff(new Date(2026, 10, 1), new Date(2026, 10, 30))).toBe(29);
  });

  it("builds a Monday-first 6-week grid covering the month", () => {
    // 1 Nov 2026 is a Sunday, so the grid starts on Monday 26 Oct.
    const cells = monthCells(new Date(2026, 10, 15));
    expect(cells).toHaveLength(42);
    expect(isSameDay(cells[0], new Date(2026, 9, 26))).toBe(true);
    expect(isSameDay(cells[6], new Date(2026, 10, 1))).toBe(true);
    expect(cells.filter((d) => d.getMonth() === 10)).toHaveLength(30);
  });
});
