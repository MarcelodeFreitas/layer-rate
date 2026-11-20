import { Route, Routes, Link } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { Home } from "./pages/Home";
import { Calculator } from "./pages/Calculator";
import { PrintersPage, FilamentsPage } from "./pages/Presets";
import { Settings } from "./pages/Settings";
import { TimeCalculator } from "./pages/TimeCalculator";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Calculator />} />
        <Route path="printers" element={<PrintersPage />} />
        <Route path="filaments" element={<FilamentsPage />} />
        <Route path="time" element={<TimeCalculator />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route
        path="*"
        element={
          <main className="page">
            <h1>Page not found</h1>
            <p>
              <Link to="/">Back to the home page</Link>
            </p>
          </main>
        }
      />
    </Routes>
  );
}
