import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { exampleQuoteInput } from "../src/example.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(rootDir, "dist", "index.js");

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

describe("layer-rate CLI", () => {
  it("--version exits successfully", async () => {
    const result = await runCli(["--version"]);

    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe("0.1.0");
  });

  it("init creates the example input file", async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, "quote.json");
      const result = await runCli(["init", file]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Created");
      expect(JSON.parse(await readFile(file, "utf8"))).toMatchObject({
        materials: [{ name: "PLA" }],
      });
    });
  });

  it("init refuses overwrite without --force", async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, "quote.json");
      await writeFile(file, "{}", "utf8");

      const result = await runCli(["init", file]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("File already exists");
    });
  });

  it("quote file.json prints readable table output", async () => {
    await withQuoteFile(async (file) => {
      const result = await runCli(["quote", file]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("LayerRate Quote");
      expect(result.stdout).toContain("Customer price (all jobs)");
      expect(result.stdout).toContain("5.01");
    });
  });

  it("quote file.json --json prints parseable JSON", async () => {
    await withQuoteFile(async (file) => {
      const result = await runCli(["quote", file, "--json"]);
      const payload = JSON.parse(result.stdout) as {
        result: { customerPriceAllJobs: number };
      };

      expect(result.code).toBe(0);
      expect(payload.result.customerPriceAllJobs).toBeCloseTo(5.01, 2);
    });
  });

  it("quote --stdin --json reads input from stdin", async () => {
    const result = await runCli(
      ["quote", "--stdin", "--json"],
      JSON.stringify(exampleQuoteInput),
    );
    const payload = JSON.parse(result.stdout) as {
      result: { productionCostAllJobs: number };
    };

    expect(result.code).toBe(0);
    expect(payload.result.productionCostAllJobs).toBeCloseTo(1.55, 2);
  });

  it("quote accepts UTF-8 BOM input from files and stdin", async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, "quote.json");
      await writeFile(file, `\ufeff${JSON.stringify(exampleQuoteInput)}`, "utf8");

      const fileResult = await runCli(["quote", file, "--json"]);
      const stdinResult = await runCli(
        ["quote", "--stdin", "--json"],
        `\ufeff${JSON.stringify(exampleQuoteInput)}`,
      );

      expect(fileResult.code).toBe(0);
      expect(stdinResult.code).toBe(0);
    });
  });

  it("validate file.json succeeds for valid input", async () => {
    await withQuoteFile(async (file) => {
      const result = await runCli(["validate", file]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Valid quote input.");
    });
  });

  it("validate --json reports invalid input cleanly", async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, "quote.json");
      await writeFile(file, JSON.stringify({ ...exampleQuoteInput, materials: [] }), "utf8");

      const result = await runCli(["validate", file, "--json"]);
      const payload = JSON.parse(result.stdout) as {
        valid: boolean;
        error: string;
        issues: { path: string; message: string }[];
      };

      expect(result.code).toBe(1);
      expect(payload.valid).toBe(false);
      expect(payload.error).toContain("materials must contain at least one material");
      expect(payload.issues).toEqual([
        expect.objectContaining({
          path: "materials",
          message: "materials must contain at least one material.",
        }),
      ]);
    });
  });

  it("validate rejects fee input that does not match the printed schema", async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, "quote.json");
      await writeFile(
        file,
        JSON.stringify({
          ...exampleQuoteInput,
          fees: [{ behavior: "recover", fixedAmount: 1 }],
        }),
        "utf8",
      );

      const result = await runCli(["validate", file, "--json"]);
      const payload = JSON.parse(result.stdout) as {
        valid: boolean;
        error: string;
        issues: { path: string; message: string }[];
      };

      expect(result.code).toBe(1);
      expect(payload.valid).toBe(false);
      expect(payload.error).toContain("fees[0].name must be a string");
      expect(payload.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "fees[0].name",
            message: "fees[0].name must be a string.",
          }),
        ]),
      );
    });
  });

  it("schema is printed from the core-owned quote input JSON schema", async () => {
    const result = await runCli(["schema"]);
    const schema = JSON.parse(result.stdout) as {
      title: string;
      required: string[];
      properties: {
        pricingOptions: { properties: Record<string, unknown> };
        fees: { items: { properties: Record<string, unknown> } };
      };
    };

    expect(result.code).toBe(0);
    expect(schema.title).toBe("LayerRateQuoteInput");
    expect(schema.required).toContain("materials");
    expect(schema.properties.pricingOptions.properties).toHaveProperty("taxBasis");
    expect(schema.properties.pricingOptions.properties).toHaveProperty(
      "addOnTopFeePercentBasis",
    );
    expect(schema.properties.fees.items.properties).toHaveProperty("behavior");
  });

  it("solve --price returns the markup and margin for a target price", async () => {
    await withQuoteFile(async (file) => {
      const result = await runCli(["solve", file, "--price", "5.01", "--json"]);
      const payload = JSON.parse(result.stdout) as {
        solution: { markupPercent: number; marginPercent: number };
      };

      expect(result.code).toBe(0);
      // The example quote is 223% markup, so 5.01 should solve back to about 223%.
      expect(payload.solution.markupPercent).toBeCloseTo(223, 0);
      expect(payload.solution.marginPercent).toBeCloseTo((223 / 323) * 100, 0);
    });
  });

  it("solve exits nonzero when the target is below production cost", async () => {
    await withQuoteFile(async (file) => {
      const result = await runCli(["solve", file, "--price", "0.5"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("below the production cost");
    });
  });

  it("schema represents the same valid example accepted by validation", async () => {
    await withQuoteFile(async (file) => {
      const schemaResult = await runCli(["schema"]);
      const validateResult = await runCli(["validate", file, "--json"]);
      const schema = JSON.parse(schemaResult.stdout) as {
        properties: { materials: unknown; pricing: unknown };
      };
      const payload = JSON.parse(validateResult.stdout) as { valid: boolean };

      expect(schema.properties).toHaveProperty("materials");
      expect(schema.properties).toHaveProperty("pricing");
      expect(payload.valid).toBe(true);
    });
  });

  it("package dependency uses the published core version range", async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(rootDir, "package.json"), "utf8"),
    ) as { dependencies: Record<string, string> };

    expect(packageJson.dependencies["layer-rate-core"]).toBe("^0.1.0");
  });

  it("workspace root declares core before cli for deterministic local orchestration", async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(rootDir, "..", "package.json"), "utf8"),
    ) as { private: boolean; workspaces: string[] };

    expect(packageJson.private).toBe(true);
    expect(packageJson.workspaces).toEqual(["layer-rate-core", "layer-rate-cli", "layer-rate-plugin"]);
  });

  it("missing file exits nonzero", async () => {
    const result = await runCli(["quote", "missing.json"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Could not read input file");
  });

  it("malformed JSON exits nonzero", async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, "quote.json");
      await writeFile(file, "{", "utf8");

      const result = await runCli(["quote", file]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Malformed JSON");
    });
  });
});

async function withQuoteFile(run: (file: string) => Promise<void>): Promise<void> {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "quote.json");
    await writeFile(file, JSON.stringify(exampleQuoteInput), "utf8");
    await run(file);
  });
}

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "layer-rate-cli-"));

  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function runCli(args: string[], input?: string): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      [cliPath, ...args],
      { cwd: rootDir },
      (error, stdout, stderr) => {
        resolve({
          code: typeof error?.code === "number" ? error.code : 0,
          stdout,
          stderr,
        });
      },
    );

    if (input !== undefined) {
      child.stdin?.end(input);
    }
  });
}
