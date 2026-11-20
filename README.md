<p align="center">
  <a href="https://marcelodefreitas.github.io/layer-rate/">
    <img src="layer-rate-web/assets/layer-rate-logo-no-background.svg" alt="layer-rate" width="360">
  </a>
</p>

<p align="center">
  <a href="https://marcelodefreitas.github.io/layer-rate/"><strong>Open the calculator</strong></a>
</p>

layer-rate is an open-source 3D print pricing tool. It shows how a price is built, line by line: material, machine time, power, labor, failed prints, fees, and markup.

## Packages

This is a monorepo with four packages.

| Package | What it is |
| --- | --- |
| [`layer-rate-core`](layer-rate-core) | The pricing engine. Pure calculation, no UI. Git submodule. |
| [`layer-rate-cli`](layer-rate-cli) | Command-line tool that reads quote input and prints the breakdown. |
| [`layer-rate-plugin`](layer-rate-plugin) | Claude Code plugin that prices a print from inside Claude Code. |
| [`layer-rate-web`](layer-rate-web) | The web calculator, hosted on GitHub Pages. Printers, filaments, presets and time calculator are saved in your browser. |

## Run the web app locally

Requires Node.js 20 or newer.

```sh
git clone --recurse-submodules https://github.com/MarcelodeFreitas/layer-rate.git
cd layer-rate
npm ci
npm run build -w layer-rate-core
npm run dev -w layer-rate-web
```

Then open the address Vite prints, with the `/layer-rate/` base path.

## Tests

```sh
npm run build -w layer-rate-core
npm test -w layer-rate-web
```

## Deployment

Pushes to `main` build `layer-rate-web` and deploy it to GitHub Pages through [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## License

MIT. See [`layer-rate-core/LICENSE`](layer-rate-core/LICENSE).
