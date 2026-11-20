import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project Pages URL. Change to "/" if a custom domain is used.
export default defineConfig({
  plugins: [react()],
  base: "/layer-rate/",
});
