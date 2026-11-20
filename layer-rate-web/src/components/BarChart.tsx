import type { ReactElement } from "react";

export type ChartItem = { label: string; value: number };

const PALETTE = ["#0A1628", "#29ABE2", "#47505E", "#7FCDEE", "#787F89", "#B4E2F5", "#A9ADB4"];

function sv(v: number): number {
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

export function BarChart(props: {
  kind: "stacked" | "grouped";
  items: ChartItem[];
  format: (n: number) => string;
}): ReactElement {
  const { kind, items, format } = props;

  if (items.length === 0) {
    return (
      <figure>
        <p>No data to show.</p>
      </figure>
    );
  }

  const data = items.map((i) => ({ label: i.label, value: sv(i.value) }));
  const al = data.map((d) => `${d.label}: ${format(d.value)}`).join(", ");

  if (kind === "stacked") {
    const total = data.reduce((s, d) => s + d.value, 0);
    let ci = 0;
    const colored = data.map((d) => ({
      ...d,
      color: d.label === "Profit" ? "#F7941D" : PALETTE[ci++ % PALETTE.length],
    }));
    let x = 0;
    const rects = colored
      .filter((d) => d.value > 0)
      .map((d) => {
        const w = total > 0 ? (d.value / total) * 600 : 0;
        const el = (
          <rect
            key={d.label}
            x={x}
            y={5}
            width={w}
            height={30}
            fill={d.color}
            stroke="#ffffff"
            strokeWidth={2}
          />
        );
        x += w;
        return el;
      });

    return (
      <figure>
        <svg viewBox="0 0 600 40" width="100%" role="img" aria-label={al}>
          {rects}
        </svg>
        <ul className="chart-legend">
          {colored.map((d) => (
            <li key={d.label} className="chart-legend-item">
              {/* per-item series colour: the only inline style left */}
              <span className="chart-legend-swatch" style={{ background: d.color }} />
              <span className="chart-legend-label">{d.label}</span>
              <span className="chart-legend-value">{format(d.value)}</span>
            </li>
          ))}
        </ul>
      </figure>
    );
  }

  // HTML rows, not an SVG: long labels wrap instead of running under the bars.
  const max = Math.max(...data.map((d) => d.value));
  return (
    <figure>
      <ul className="bar-rows" aria-label={al}>
        {data.map((d) => (
          <li key={d.label}>
            <div className="bar-row-head">
              <span className="bar-row-label">{d.label}</span>
              <span className="bar-row-value">{format(d.value)}</span>
            </div>
            <div className="bar-track">
              {/* data-driven bar length: the only inline style here */}
              <span className="bar-fill" style={{ width: `${max > 0 ? (d.value / max) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
