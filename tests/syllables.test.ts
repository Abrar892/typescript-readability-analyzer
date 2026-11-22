import assert from "node:assert/strict";
import test from "node:test";
import { countSyllables } from "../src/syllables";

const CASES: [string, number][] = [
  // One syllable.
  ["cat", 1],
  ["dog", 1],
  ["walked", 1],
  ["strength", 1],
  ["book", 1],
  ["tree", 1],
  ["school", 1],
  ["through", 1],
  ["queue", 1],
  // Two syllables.
  ["table", 2],
  ["apple", 2],
  ["happy", 2],
  ["walking", 2],
  ["wanted", 2],
  ["horses", 2],
  ["garden", 2],
  ["water", 2],
  ["people", 2],
  ["able", 2],
  ["silent", 2],
  ["open", 2],
  ["baby", 2],
  ["mother", 2],
  ["nation", 2],
  ["action", 2],
  ["special", 2],
  ["anxious", 2],
  ["business", 2],
  ["every", 2],
  ["evening", 2],
  ["journey", 2],
  ["chocolate", 2],
  ["rhythm", 2],
  ["being", 2],
  ["yesterday", 3],
  // Three syllables.
  ["banana", 3],
  ["computer", 3],
  ["elephant", 3],
  ["wonderful", 3],
  ["beautiful", 3],
  ["family", 3],
  ["different", 3],
  ["probably", 3],
  ["media", 3],
  ["radio", 3],
  ["video", 3],
  ["area", 3],
  ["idea", 3],
  ["interesting", 3],
  ["curious", 3],
  ["obvious", 3],
  ["comfortable", 3],
  ["medicine", 3],
  ["vegetable", 3],
  // "-es" endings: silent after most consonants, a syllable after sibilants.
  ["likes", 1],
  ["cakes", 1],
  ["homes", 1],
  ["tables", 2],
  ["apples", 2],
  ["handles", 2],
  ["horses", 2],
  ["changes", 2],
  ["dances", 2],
  ["boxes", 2],
  ["watches", 2],
  ["series", 2],
  ["movies", 2],
  // Vowel pairs that split only in the right places.
  ["actual", 3],
  ["factual", 3],
  ["eventual", 4],
  ["rodeo", 3],
  ["geography", 4],
  ["geology", 4],
  ["geometry", 4],
  ["leopard", 2],
  ["jeopardy", 3],
  ["fluid", 2],
  ["ruin", 2],
  ["style", 1],
  ["houses", 2],
  // Four or more.
  ["information", 4],
  ["education", 4],
  ["dictionary", 4],
  ["conversation", 4],
  ["university", 5],
];

for (const [word, expected] of CASES) {
  test(`"${word}" has ${expected} syllable(s)`, () => {
    assert.equal(countSyllables(word), expected);
  });
}

test("hyphenated compounds sum their parts", () => {
  assert.equal(countSyllables("well-known"), 2);
  assert.equal(countSyllables("mothers-in-law"), 4);
});

test("case does not matter", () => {
  assert.equal(countSyllables("Banana"), 3);
  assert.equal(countSyllables("COMPUTER"), 3);
});
