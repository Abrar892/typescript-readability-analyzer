#!/usr/bin/env node
/**
 * readability — score the readability of English text.
 *
 *   readability essay.txt
 *   cat essay.txt | readability
 *   readability --json --index fog chapter1.txt chapter2.txt
 *   readability --fail-below 8 draft.md   # CI gate: exit 2 if too hard
 */

import { readFileSync } from "node:fs";
import { analyzeText, type Analysis } from "./analyze";
import { formatJson, formatText } from "./report";

const VERSION = "1.0.0";

const HELP = `readability ${VERSION} — score the readability of English text

Usage:
  readability [options] [file ...]

  With no files (or "-" as a file) text is read from stdin.

Options:
  --json             Print machine-readable JSON instead of a report
  --index <id>       Show only one index: flesch, fk, fog, smog,
                     coleman-liau, ari
  --fail-below <n>   Exit 2 when the aggregate grade level is below n
  --help             Show this help
  --version          Print the version

Indices: Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog,
SMOG, Coleman-Liau and the Automated Readability Index.
`;

interface Options {
  files: string[];
  json: boolean;
  indexId: string | null;
  failBelow: number | null;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    files: [],
    json: false,
    indexId: null,
    failBelow: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--help") {
      process.stdout.write(HELP);
      process.exit(0);
    } else if (arg === "--version") {
      process.stdout.write(`${VERSION}\n`);
      process.exit(0);
    } else if (arg === "--index") {
      const value = argv[++i];
      if (!value) {
        throw new Error("--index needs a value (flesch, fk, fog, smog, coleman-liau, ari)");
      }
      options.indexId = value;
    } else if (arg.startsWith("--index=")) {
      options.indexId = arg.slice("--index=".length);
    } else if (arg === "--fail-below") {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value)) {
        throw new Error("--fail-below needs a number");
      }
      options.failBelow = value;
    } else if (arg.startsWith("--fail-below=")) {
      const value = Number(arg.slice("--fail-below=".length));
      if (!Number.isFinite(value)) {
        throw new Error("--fail-below needs a number");
      }
      options.failBelow = value;
    } else if (arg.startsWith("-") && arg !== "-") {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.files.push(arg);
    }
  }
  return options;
}

function readStdin(): string {
  return readFileSync(0, "utf-8");
}

function filterIndex(analysis: Analysis, indexId: string): Analysis {
  const found = analysis.indices.find((index) => index.id === indexId);
  if (!found) {
    throw new Error(
      `Unknown index: ${indexId} (flesch, fk, fog, smog, coleman-liau, ari)`,
    );
  }
  return { ...analysis, indices: [found] };
}

function main(): number {
  let options: Options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`readability: ${(error as Error).message}\n`);
    return 1;
  }

  const sources: { name: string; text: string }[] = [];
  const files = options.files.length > 0 ? options.files : ["-"];
  for (const file of files) {
    try {
      const text = file === "-" ? readStdin() : readFileSync(file, "utf-8");
      sources.push({ name: file === "-" ? "stdin" : file, text });
    } catch {
      process.stderr.write(`readability: cannot read ${file}\n`);
      return 1;
    }
  }

  let failedThreshold = false;
  const outputs: string[] = [];
  for (const source of sources) {
    let analysis = analyzeText(source.text, source.name);
    if (analysis.counts.words === 0) {
      process.stderr.write(`readability: no words found in ${source.name}\n`);
      return 1;
    }
    if (options.indexId) {
      try {
        analysis = filterIndex(analysis, options.indexId);
      } catch (error) {
        process.stderr.write(`readability: ${(error as Error).message}\n`);
        return 1;
      }
    }
    if (
      options.failBelow !== null &&
      analysis.aggregateGrade < options.failBelow
    ) {
      failedThreshold = true;
    }
    outputs.push(options.json ? formatJson(analysis) : formatText(analysis));
  }

  process.stdout.write(outputs.join("\n\n") + "\n");
  return failedThreshold ? 2 : 0;
}

process.exit(main());
