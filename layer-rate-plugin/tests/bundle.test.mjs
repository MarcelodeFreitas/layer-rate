import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFile } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateQuote } from "layer-rate-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const bundle = path.join(here, "..", "cli", "layer-rate.mjs");
const example = path.join(here, "..", "..", "layer-rate-cli", "quote.example.json");
const cliPkg = path.join(here, "..", "..", "layer-rate-cli", "package.json");
const printersExample = path.join(here, "..", "examples", "printers.example.json");

// shortcut: needs layer-rate-core and layer-rate-cli dist built first (run root npm run build), tests are run from the root npm test
describe("layer-rate bundle", () => {
  let folder;
  let copied;

  beforeAll(async () => {
    // The space in the folder name checks path quoting; no node_modules is copied.
    folder = await mkdtemp(path.join(tmpdir(), "layer rate "));
    copied = path.join(folder, "layer-rate.mjs");
    await copyFile(bundle, copied);
  });

  afterAll(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  function run(args, stdin) {
    return new Promise((resolve) => {
      const child = execFile(process.execPath, [copied, ...args], { cwd: folder }, (error, stdout, stderr) => {
        resolve({ code: error ? error.code : 0, stdout, stderr });
      });
      if (typeof stdin === "string") {
        child.stdin.end(stdin);
      }
    });
  }

  it("prints the CLI version", async () => {
    const pkg = JSON.parse(await readFile(cliPkg, "utf8"));
    const { code, stdout } = await run(["--version"]);
    expect(code).toBe(0);
    expect(stdout.trim()).toBe(pkg.version);
  });

  it("quote matches calculateQuote", async () => {
    const input = JSON.parse(await readFile(example, "utf8"));
    const { code, stdout } = await run(["quote", "--stdin", "--compact-json"], JSON.stringify(input));
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.result).toEqual(calculateQuote(input));
  });

  it("validate rejects bad input", async () => {
    const input = JSON.parse(await readFile(example, "utf8"));
    const bad = { ...input, quantity: 0 };
    const { code, stdout } = await run(["validate", "--stdin", "--json"], JSON.stringify(bad));
    expect(code).toBe(1);
    const parsed = JSON.parse(stdout);
    expect(parsed.valid).toBe(false);
    expect(parsed.issues.length).toBeGreaterThan(0);
  });

  it("every example printer profile validates with the shared settings", async () => {
    const base = JSON.parse(await readFile(example, "utf8"));
    const profiles = JSON.parse(await readFile(printersExample, "utf8")).printers;
    for (const [name, profile] of Object.entries(profiles)) {
      const input = { ...base, ...profile };
      const { code, stdout } = await run(["validate", "--stdin", "--json"], JSON.stringify(input));
      expect(code, name).toBe(0);
      expect(JSON.parse(stdout).valid, name).toBe(true);
    }
  });

  it("schema prints valid JSON", async () => {
    const { code, stdout } = await run(["schema"]);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.properties).toBeDefined();
  });
});
