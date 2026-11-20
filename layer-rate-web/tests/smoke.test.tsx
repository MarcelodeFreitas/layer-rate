import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { StoreProvider } from "../src/lib/store";
import { AppRoutes } from "../src/routes";
import { BarChart } from "../src/components/BarChart";

describe("smoke", () => {
  it("renders the calculator with default data and no storage", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/app"]}>
        <StoreProvider storage={null}>
          <AppRoutes />
        </StoreProvider>
      </MemoryRouter>,
    );
    expect(html).toContain("Ender 3");
    expect(html).toMatch(/€\d/);
    expect(html).toContain("blocking storage");
  });

  it("renders the home page", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <StoreProvider storage={null}>
          <AppRoutes />
        </StoreProvider>
      </MemoryRouter>,
    );
    expect(html).toContain("Know what a 3D print really costs.");
  });

  it("renders the time calculator with the current start and a calendar", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/app/time"]}>
        <StoreProvider storage={null}>
          <AppRoutes />
        </StoreProvider>
      </MemoryRouter>,
    );
    expect(html).toContain("Print finishes");
    expect(html).toContain("calendar-grid");
  });

  it("renders the bar chart with no items", () => {
    const html = renderToString(
      <BarChart kind="stacked" items={[]} format={(n) => String(n)} />,
    );
    expect(html).toContain("No data to show.");
  });
});
