import { Link, NavLink, Outlet } from "react-router";
import { useStore } from "../lib/store";
import logo from "../../assets/layer-rate-logo-no-background.svg";

export function AppLayout() {
  const { storageOk } = useStore();

  return (
    <div className="app-shell">
      <nav className="side-menu" aria-label="Main menu">
        <Link className="side-menu-brand" to="/"><img src={logo} alt="layer-rate" /></Link>
        <div className="side-menu-nav">
          <NavLink className="nav-link" to="/app" end>Calculator</NavLink>
          <NavLink className="nav-link" to="/app/time">Time calculator</NavLink>
          <NavLink className="nav-link" to="/app/printers">Printers</NavLink>
          <NavLink className="nav-link" to="/app/filaments">Filament</NavLink>
          <NavLink className="nav-link" to="/app/settings">Settings</NavLink>
        </div>
      </nav>
      <div className="app-main">
        {!storageOk && (
          <p className="banner" role="alert">
            Your browser is blocking storage. The app works, but nothing is saved after you close
            this tab. Export a backup in Settings to keep your data.
          </p>
        )}
        <Outlet />
      </div>
    </div>
  );
}
