import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

const ROOT = path.resolve(__dirname, "..", "..");
const CLI = path.join(ROOT, "dist", "src", "cli.js");
const SIMPLE = path.join(ROOT, "tests", "fixtures", "simple.txt");

function run(args: string[], input?: string) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    input,
    encoding: "utf-8",
  });
}

test("--help exits 0 and shows usage", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
});

test("--version prints the version", () => {
  const result = run(["--version"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /1\.0\.0/);
});

test("analyzes a file and prints a report", () => {
  const result = run([SIMPLE]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Readability — /);
  assert.match(result.stdout, /Aggregate grade level:/);
  assert.match(result.stdout, /Flesch Reading Ease/);
});

test("--json prints parseable JSON with six indices", () => {
  const result = run(["--json", SIMPLE]);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.counts.words, 11);
  assert.equal(parsed.indices.length, 6);
  assert.equal(typeof parsed.aggregateGrade, "number");
});

test("--index shows only the requested index", () => {
  const result = run(["--index", "fog", SIMPLE]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Gunning Fog Index/);
  assert.doesNotMatch(result.stdout, /Flesch Reading Ease/);
});

test("reads from stdin with -", () => {
  const result = run(["-"], "The cat sat on the mat.");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Readability — stdin/);
});

test("missing file exits 1", () => {
  const result = run(["no-such-file.txt"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /cannot read/);
});

test("unknown index exits 1", () => {
  const result = run(["--index", "bogus", SIMPLE]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown index/);
});

test("--fail-below exits 2 when the text is too easy", () => {
  // The fixture is very easy text, so a high floor fails the gate.
  assert.equal(run(["--fail-below", "8", SIMPLE]).status, 2);
  // A floor below its grade passes.
  assert.equal(run(["--fail-below", "-1", SIMPLE]).status, 0);
});
