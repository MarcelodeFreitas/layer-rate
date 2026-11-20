const DAY_MS = 86_400_000;

/** Start plus a duration. Adds elapsed time, so a DST change does not shift the result. */
export function addDuration(start: Date, hours: number, minutes: number): Date {
  return new Date(start.getTime() + (hours * 60 + minutes) * 60_000);
}

/** Calendar days from one date to another (0 = same day, 1 = next day). */
export function dayDiff(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY_MS);
}

/** 42 local dates (6 weeks, Monday first) covering the month of `view`. */
export function monthCells(view: Date): Date[] {
  const y = view.getFullYear();
  const m = view.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(y, m, 1 - offset + i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayDiff(a, b) === 0;
}
