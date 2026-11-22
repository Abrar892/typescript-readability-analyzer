import assert from "node:assert/strict";
import test from "node:test";
import { analyzeText } from "../src/analyze";

const SIMPLE = "The cat sat on the mat. It was a happy cat.";

test("counts words, sentences and syllables", () => {
  const analysis = analyzeText(SIMPLE, "simple.txt");
  assert.equal(analysis.counts.words, 11);
  assert.equal(analysis.counts.sentences, 2);
  assert.equal(analysis.counts.syllables, 12);
  assert.equal(analysis.counts.complexWords, 0);
  assert.equal(analysis.counts.polysyllables, 0);
});

test("computes all six indices and an aggregate grade", () => {
  const analysis = analyzeText(SIMPLE, "simple.txt");
  assert.equal(analysis.indices.length, 6);
  // Median of the five grade-level indices for this text is about -0.6.
  assert.ok(Math.abs(analysis.aggregateGrade - -0.57) < 0.1);
  const flesch = analysis.indices.find((index) => index.id === "flesch")!;
  assert.ok(flesch.score > 100, "very easy text scores above 100");
});

test("detects complex and polysyllabic words", () => {
  const analysis = analyzeText(
    "The administration communicated the information.",
    "hard.txt",
  );
  assert.equal(analysis.counts.words, 5);
  assert.equal(analysis.counts.polysyllables, 3);
  assert.equal(analysis.counts.complexWords, 3);
  assert.deepEqual(analysis.sampleComplexWords, [
    "administration",
    "communicated",
    "information",
  ]);
});

test("proper nouns and hyphenated words are not complex", () => {
  const analysis = analyzeText(
    "He communicated well-known information in Washington.",
    "proper.txt",
  );
  // Washington is a proper noun; well-known is hyphenated; only
  // "communicated" and "information" count as complex.
  assert.equal(analysis.counts.complexWords, 2);
});

test("words made complex only by a suffix are not complex", () => {
  // "interesting" is 3 syllables but "interest" is 2, so Fog excludes it.
  const analysis = analyzeText("The interesting book was boring.", "suffix.txt");
  assert.equal(analysis.counts.complexWords, 0);
});

test("longest sentences come back longest-first", () => {
  const analysis = analyzeText(
    "Short. A much longer sentence with several words in it. Tiny.",
    "lengths.txt",
  );
  assert.equal(analysis.longestSentences[0].words, 9);
  assert.equal(analysis.longestSentences[0].text, "A much longer sentence with several words in it.");
});

test("empty text has zero counts", () => {
  const analysis = analyzeText("", "empty.txt");
  assert.equal(analysis.counts.words, 0);
  assert.equal(analysis.counts.sentences, 0);
});
