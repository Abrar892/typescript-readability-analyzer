import assert from "node:assert/strict";
import test from "node:test";
import {
  countCharacters,
  countLetters,
  splitSentences,
  tokenizeWords,
} from "../src/tokenizer";

test("splits on . ! and ?", () => {
  assert.deepEqual(splitSentences("Hello world. How are you? Fine!"), [
    "Hello world.",
    "How are you?",
    "Fine!",
  ]);
});

test("text without terminal punctuation is one sentence", () => {
  assert.deepEqual(splitSentences("Hello world"), ["Hello world"]);
});

test("abbreviations do not end a sentence", () => {
  assert.deepEqual(
    splitSentences("Dr. Smith went to Washington. He stayed."),
    ["Dr. Smith went to Washington.", "He stayed."],
  );
  assert.deepEqual(splitSentences("Meet me at 5 p.m. tomorrow."), [
    "Meet me at 5 p.m. tomorrow.",
  ]);
});

test("ellipses stay attached to their sentence", () => {
  assert.deepEqual(splitSentences("Wait... Really? Yes!"), [
    "Wait...",
    "Really?",
    "Yes!",
  ]);
});

test("blank input gives no sentences", () => {
  assert.deepEqual(splitSentences("   \n  "), []);
});

test("tokenizes words, keeping contractions and hyphens", () => {
  assert.deepEqual(
    tokenizeWords("Don't stop believin' — a well-known fact."),
    ["Don't", "stop", "believin", "a", "well-known", "fact"],
  );
});

test("numbers are not words", () => {
  assert.deepEqual(tokenizeWords("Chapter 2 has 10 pages"), [
    "Chapter",
    "has",
    "pages",
  ]);
});

test("counts letters and characters", () => {
  assert.equal(countLetters("Hello, World! 123"), 10);
  assert.equal(countCharacters("Hello, World! 123"), 13);
});
