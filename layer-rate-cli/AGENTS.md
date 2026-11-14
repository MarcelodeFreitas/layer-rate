# Agent Instructions

## Project

LayerRate CLI is the command-line interface for the LayerRate 3D print pricing engine.

The goal is to provide a reliable scriptable interface around `layer-rate-core` for quote input generation, validation, schema inspection, and quote calculation.

Use `LayerRate CLI` for human-facing text and `layer-rate-cli` for the repository, folder, and package slug.

## Scope

- Keep this package focused on command-line workflows only.
- Do not implement pricing math in this package. Pricing formulas belong in `layer-rate-core`.
- Do not add React, Next.js, browser UI, database code, authentication, payments, or hosted-service features.
- Treat the CLI as a thin adapter around core quote input and output.
- Preserve support for both human-readable output and machine-readable JSON output.
- Keep stdin and file-based workflows first-class because agents and scripts depend on them.
- Keep `init` output editable and practical as a complete quote input example.

## Tech Stack

- TypeScript
- Node.js ESM with `NodeNext` module resolution
- Commander for CLI command parsing
- Vitest for tests
- Runtime dependencies should stay minimal and CLI-specific

## Command Design

The CLI should expose predictable commands:

- `init` creates an editable example quote input JSON file.
- `quote` reads quote input and prints either a readable table or JSON payload.
- `validate` verifies quote input by running the core calculation.
- `schema` prints the expected quote input schema.

When adding or changing commands:

- Prefer explicit flags over implicit behavior.
- Keep exit codes meaningful for shell scripts.
- Write validation and runtime errors to stderr unless the command has a JSON error mode.
- Do not require interactive prompts for normal operation.
- Keep JSON output parseable, stable, and free of extra text.

## Core Boundary

- Import quote calculation behavior from `layer-rate-core`.
- If a formula, pricing rule, or input model changes, update `layer-rate-core` first and adapt the CLI afterward.
- Keep CLI schema and examples aligned with core validation behavior.
- Do not duplicate core calculation logic in formatting, validation, or tests.

## Engineering Rules

- Run `npm test` before finishing behavior changes.
- Run `npm run typecheck` when changing TypeScript surfaces.
- Build before testing if tests execute files from `dist`.
- Keep tests focused on CLI behavior, exit codes, stdout, stderr, and JSON parseability.
- Prefer clear error messages that help users fix input files.
- Preserve cross-platform path handling with Node `path` and filesystem APIs.
- Avoid shell-specific assumptions in tests.
