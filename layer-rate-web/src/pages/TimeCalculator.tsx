import { useState } from "react";
import { addDuration, dayDiff, isSameDay, monthCells } from "../lib/time";

const weekdays = Array.from({ length: 7 }, (_, i) =>
  // 1 Jan 2024 was a Monday, so this gives Mon..Sun in the user's locale.
  new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: "short" }),
);
const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
const pad = (n: number) => String(n).padStart(2, "0");

export function TimeCalculator() {
  const [start, setStart] = useState(() => new Date());
  const [view, setView] = useState(() => new Date());
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const num = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const end = addDuration(start, days * 24 + hours, minutes);
  const durationLabel = [days && `${days} d`, hours && `${hours} h`, minutes && `${minutes} min`].filter(Boolean).join(" ") || "0 min";
  const nextDays = dayDiff(start, end);

  const pickDay = (day: Date) =>
    setStart(new Date(day.getFullYear(), day.getMonth(), day.getDate(), start.getHours(), start.getMinutes()));

  const pickTime = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      setStart(new Date(start.getFullYear(), start.getMonth(), start.getDate(), h, m));
    }
  };

  const goNow = () => {
    const now = new Date();
    setStart(now);
    setView(now);
  };

  const shiftMonth = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <main className="page">
      <div className="page-header">
        <h1>Time calculator</h1>
      </div>
      <div className="calc-layout">
        <div className="calc-inputs">
          <section className="card">
            <h2>Print time</h2>
            <div className="field-grid">
              <label>
                Days{" "}
                <span className="input-with-unit">
                  <input type="number" min="0" step="1" value={days || ""} onChange={(e) => setDays(num(e.target.value))} />
                  <span className="unit">d</span>
                </span>
              </label>
              <label>
                Hours{" "}
                <span className="input-with-unit">
                  <input type="number" min="0" step="1" value={hours || ""} onChange={(e) => setHours(num(e.target.value))} />
                  <span className="unit">h</span>
                </span>
              </label>
              <label>
                Minutes{" "}
                <span className="input-with-unit">
                  <input type="number" min="0" step="1" value={minutes || ""} onChange={(e) => setMinutes(num(e.target.value))} />
                  <span className="unit">min</span>
                </span>
              </label>
            </div>
          </section>
          <section className="card">
            <h2>Start</h2>
            <div className="field-grid">
              <label>
                Start time <input type="time" value={`${pad(start.getHours())}:${pad(start.getMinutes())}`} onChange={(e) => pickTime(e.target.value)} />
              </label>
              <div className="form-actions">
                <button type="button" className="secondary" onClick={goNow}>
                  Now
                </button>
              </div>
            </div>
            <div className="calendar">
              <div className="calendar-head">
                <button type="button" className="secondary" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                  ‹
                </button>
                <strong>{view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
                <button type="button" className="secondary" aria-label="Next month" onClick={() => shiftMonth(1)}>
                  ›
                </button>
              </div>
              <div className="calendar-grid">
                {weekdays.map((w) => (
                  <span key={w} className="calendar-weekday">
                    {w}
                  </span>
                ))}
                {monthCells(view).map((day) => {
                  const classes = ["calendar-day"];
                  if (day.getMonth() !== view.getMonth()) classes.push("is-outside");
                  if (isSameDay(day, start)) classes.push("is-start");
                  else if (nextDays > 0 && isSameDay(day, end)) classes.push("is-end");
                  return (
                    <button
                      key={day.getTime()}
                      type="button"
                      className={classes.join(" ")}
                      aria-pressed={isSameDay(day, start)}
                      aria-label={fmtDate(day)}
                      onClick={() => pickDay(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
        <div className="card card--result calc-result">
          <p className="result-label">Print finishes</p>
          <p className="price-highlight">{fmtTime(end)}</p>
          <p className="result-summary">
            {fmtDate(end)}
            {nextDays > 0 && (
              <>
                {" · "}
                <strong>{nextDays === 1 ? "next day" : `+${nextDays} days`}</strong>
              </>
            )}
          </p>
          <hr className="divider" />
          <p className="result-summary">
            Starts {fmtDate(start)} at {fmtTime(start)}
            {" · "}Print time: <span className="mono">{durationLabel}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
