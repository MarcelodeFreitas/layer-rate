import { Command, CommanderError } from "commander";
import {
  LayerRateValidationError,
  calculateQuote,
  quoteInputJsonSchema,
  solvePricingForPerJobPrice,
} from "layer-rate-core";
import { exampleQuoteInput } from "./example.js";
import { formatQuoteTable } from "./format.js";
import { messageFrom, readQuoteInput, writeJsonFile } from "./io.js";

interface QuoteOptions {
  stdin?: boolean;
  json?: boolean;
  compactJson?: boolean;
}

interface InitOptions {
  force?: boolean;
}

interface ValidateOptions {
  stdin?: boolean;
  json?: boolean;
}

interface SolveOptions {
  price: string;
  stdin?: boolean;
  json?: boolean;
  compactJson?: boolean;
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("layer-rate")
    .description("Command-line interface for the LayerRate pricing engine.")
    .version("0.1.0")
    .exitOverride();

  program
    .command("init")
    .description("Create an editable example quote input JSON file.")
    .argument("[file]", "output file", "quote.example.json")
    .option("--force", "overwrite an existing file")
    .action(async (file: string, options: InitOptions) => {
      await runAction(async () => {
        await writeJsonFile(file, exampleQuoteInput, options.force === true);
        process.stdout.write(`Created ${file}\n`);
      });
    });

  program
    .command("quote")
    .description("Calculate a quote from JSON input.")
    .argument("[file]", "quote input JSON file")
    .option("--stdin", "read quote input JSON from stdin")
    .option("--json", "print formatted JSON output")
    .option("--compact-json", "print single-line JSON output")
    .action(async (file: string | undefined, options: QuoteOptions) => {
      await runAction(async () => {
        const input = await readQuoteInput(file, options.stdin === true);
        const result = calculateQuote(input);
        const payload = { input, result };

        if (options.compactJson === true) {
          process.stdout.write(`${JSON.stringify(payload)}\n`);
          return;
        }

        if (options.json === true) {
          process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
          return;
        }

        process.stdout.write(`${formatQuoteTable(result)}\n`);
      });
    });

  program
    .command("validate")
    .description("Validate quote input by running the core calculation.")
    .argument("[file]", "quote input JSON file")
    .option("--stdin", "read quote input JSON from stdin")
    .option("--json", "print JSON validation output")
    .action(async (file: string | undefined, options: ValidateOptions) => {
      await runValidation(file, options);
    });

  program
    .command("solve")
    .description("Find the markup and margin that give a target per-job customer price.")
    .argument("[file]", "quote input JSON file")
    .requiredOption("--price <amount>", "target per-job customer price, tax included")
    .option("--stdin", "read quote input JSON from stdin")
    .option("--json", "print formatted JSON output")
    .option("--compact-json", "print single-line JSON output")
    .action(async (file: string | undefined, options: SolveOptions) => {
      await runAction(async () => {
        const input = await readQuoteInput(file, options.stdin === true);
        const targetPerJobPrice = Number(options.price);
        const solution = solvePricingForPerJobPrice(input, targetPerJobPrice);
        const payload = {
          input,
          targetPerJobPrice,
          solution: {
            markupPercent: solution.markupPercent,
            marginPercent: solution.marginPercent,
          },
          result: solution.result,
        };

        if (options.compactJson === true) {
          process.stdout.write(`${JSON.stringify(payload)}\n`);
          return;
        }

        if (options.json === true) {
          process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
          return;
        }

        process.stdout.write(
          [
            `Target per-job price: ${targetPerJobPrice.toFixed(2)}`,
            `Markup needed: ${solution.markupPercent.toFixed(2)}%`,
            `Margin on seller revenue: ${solution.marginPercent.toFixed(2)}%`,
            "",
            formatQuoteTable(solution.result),
            "",
          ].join("\n"),
        );
      });
    });

  program
    .command("schema")
    .description("Print the expected quote input schema.")
    .action(() => {
      process.stdout.write(`${JSON.stringify(quoteInputJsonSchema, null, 2)}\n`);
    });

  return program;
}

export async function runProgram(argv: string[]): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      process.exitCode = error.exitCode === 0 ? 0 : 2;
      return;
    }

    process.stderr.write(`${messageFrom(error)}\n`);
    process.exitCode = 2;
  }
}

async function runAction(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    process.stderr.write(`${messageFrom(error)}\n`);
    process.exitCode = 1;
  }
}

async function runValidation(
  file: string | undefined,
  options: ValidateOptions,
): Promise<void> {
  try {
    const input = await readQuoteInput(file, options.stdin === true);
    calculateQuote(input);

    if (options.json === true) {
      process.stdout.write(`${JSON.stringify({ valid: true }, null, 2)}\n`);
      return;
    }

    process.stdout.write("Valid quote input.\n");
  } catch (error) {
    const message = messageFrom(error);

    if (options.json === true) {
      const payload =
        error instanceof LayerRateValidationError
          ? { valid: false, error: message, issues: error.issues }
          : { valid: false, error: message };

      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      process.stderr.write(`${message}\n`);
    }

    process.exitCode = 1;
  }
}
