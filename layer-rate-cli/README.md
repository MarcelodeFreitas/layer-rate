# LayerRate CLI

LayerRate CLI is the command-line interface for LayerRate.

It reads quote input, calls `layer-rate-core`, and returns quote output for
humans, scripts, and agents. It does not implement pricing math.

## Commands

Create an editable example input:

```sh
layer-rate init quote.example.json
```

Calculate a quote from a file:

```sh
layer-rate quote quote.example.json
```

Return raw machine-readable output:

```sh
layer-rate quote quote.example.json --json
layer-rate quote quote.example.json --compact-json
```

Read input from stdin:

```sh
cat quote.example.json | layer-rate quote --stdin --json
```

Validate input:

```sh
layer-rate validate quote.example.json
layer-rate validate quote.example.json --json
```

Print the input schema:

```sh
layer-rate schema
```

## Development

```sh
npm install
npm test
npm run typecheck
npm run build
```
