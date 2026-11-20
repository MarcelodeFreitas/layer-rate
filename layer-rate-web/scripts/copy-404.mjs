// GitHub Pages serves 404.html for unknown paths, so deep links such as /app/printers
// load the SPA. The page keeps a 404 status code, which is acceptable for this app.
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
console.log("copied dist/index.html -> dist/404.html");
