import { readFile, writeFile } from "node:fs/promises";
import { parseQuoteInput, type LayerRateQuoteInput } from "layer-rate-core";

export async function readQuoteInput(
  filePath: string | undefined,
  useStdin: boolean,
): Promise<LayerRateQuoteInput> {
  if (useStdin && filePath !== undefined) {
    throw new Error("Use either a file path or --stdin, not both.");
  }

  if (useStdin) {
    return parseQuoteJson(await readStdin(), "stdin");
  }

  if (filePath === undefined) {
    throw new Error("A quote input file is required unless --stdin is used.");
  }

  let contents: string;

  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Could not read input file "${filePath}": ${messageFrom(error)}`);
  }

  return parseQuoteJson(contents, filePath);
}

export async function writeJsonFile(
  filePath: string,
  value: unknown,
  force: boolean,
): Promise<void> {
  try {
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      flag: force ? "w" : "wx",
    });
  } catch (error) {
    if (isFileExistsError(error) && !force) {
      throw new Error(`File already exists: ${filePath}. Use --force to overwrite it.`);
    }

    throw error;
  }
}

export function messageFrom(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseQuoteJson(contents: string, source: string): LayerRateQuoteInput {
  let value: unknown;

  try {
    value = JSON.parse(stripBom(contents)) as unknown;
  } catch (error) {
    throw new Error(`Malformed JSON in ${source}: ${messageFrom(error)}`);
  }

  return parseQuoteInput(value);
}

function stripBom(contents: string): string {
  return contents.charCodeAt(0) === 0xfeff ? contents.slice(1) : contents;
}

function isFileExistsError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "EEXIST"
  );
}
