import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { StoreProvider } from "./lib/store";
import { AppRoutes } from "./routes";
import "./styles.css";

// BASE_URL is "/layer-rate/" for GitHub Pages; the router wants no trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={basename}>
    <StoreProvider>
      <AppRoutes />
    </StoreProvider>
  </BrowserRouter>,
);
