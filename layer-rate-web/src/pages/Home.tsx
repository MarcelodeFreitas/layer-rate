import { Link } from "react-router";
import { DEFAULT_DATA } from "../lib/schema";
import { buildQuoteInput, runQuote, priceSegments, formatMoney } from "../lib/quote";
import { BarChart } from "../components/BarChart";
import { BreakdownTable } from "../components/BreakdownTable";
import logo from "../../assets/layer-rate-logo-no-background.svg";

export function Home() {
  const input = buildQuoteInput(
    DEFAULT_DATA.printers[0],
    DEFAULT_DATA.filaments[0],
    DEFAULT_DATA.settings,
    DEFAULT_DATA.last,
  );
  const res = runQuote(input);

  return (
    <main className="page">
      <header className="home-header">
        <Link to="/" className="wordmark"><img src={logo} alt="layer-rate" /></Link>
        <Link className="button" to="/app">Open the calculator</Link>
      </header>

      <div className="hero">
        <div>
          <h1>Know what a 3D print really costs.</h1>
          <p className="lead">
            layer-rate shows how a price is built, line by line: material, machine time, power,
            labor, failed prints, and your markup. Free and open source.
          </p>
          <Link className="button" to="/app">Open the calculator</Link>
        </div>

        <section className="card card--result live-card" aria-labelledby="example-title">
          <h2 id="example-title">A real quote</h2>
          <p className="muted">Ender 3, PLA, 22 g, 1 h 50 min, markup 223 %.</p>
          {res.ok ? (
            <>
              <p className="result-label">Price per job</p>
              <p className="price-highlight">
                {formatMoney(res.result.perJobCustomerPrice, DEFAULT_DATA.settings.currency)}
              </p>
              <BarChart
                kind="stacked"
                items={priceSegments(res.result, 1)}
                format={(n) => formatMoney(n, DEFAULT_DATA.settings.currency)}
              />
              <BreakdownTable
                result={res.result}
                currency={DEFAULT_DATA.settings.currency}
                quantity={1}
              />
            </>
          ) : (
            <p>The example could not be calculated.</p>
          )}
        </section>
      </div>

      <section className="home-section">
        <h2>What it does</h2>
        <ul className="feature-grid">
          <li className="feature">
            <h3>Breakdown</h3>
            <p>Every cost line, per job and for all jobs, in one table.</p>
          </li>
          <li className="feature">
            <h3>Compare</h3>
            <p>Set several printers, filaments and markups side by side.</p>
          </li>
          <li className="feature">
            <h3>Saved presets</h3>
            <p>Your printers, filament, and last inputs are remembered.</p>
          </li>
          <li className="feature">
            <h3>Private</h3>
            <p>Your data stays in your browser. Export a backup any time.</p>
          </li>
        </ul>
      </section>

      <section className="home-section">
        <h2>How the price is built</h2>
        <ol className="steps">
          <li>Material cost from grams used and the cost per kilogram of filament.</li>
          <li>Machine time from print hours, power draw, and purchase price spread over its lifetime.</li>
          <li>Labor for setup, operations, and post-processing at your hourly rate.</li>
          <li>Failed prints and your markup or margin on top.</li>
        </ol>
      </section>

      <footer className="site-footer">
        <p>
          layer-rate is open source.{" "}
          <a
            href="https://github.com/MarcelodeFreitas/layer-rate"
            target="_blank"
            rel="noopener noreferrer"
          >
            View the code on GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
