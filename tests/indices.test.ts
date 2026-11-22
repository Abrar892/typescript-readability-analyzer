import assert from "node:assert/strict";
import test from "node:test";
import {
  automatedReadability,
  colemanLiau,
  computeIndices,
  fleschKincaidGrade,
  fleschReadingEase,
  gunningFog,
  smog,
  type IndexInput,
} from "../src/indices";

// 100 words, 5 sentences, 150 syllables, 450 letters, 10 complex words.
const INPUT: IndexInput = {
  words: 100,
  sentences: 5,
  syllables: 150,
  characters: 450,
  letters: 450,
  complexWords: 10,
  polysyllables: 10,
};

function closeTo(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 0.01,
    `expected ${actual} to be within 0.01 of ${expected}`,
  );
}

test("Flesch Reading Ease: 206.835 - 1.015*20 - 84.6*1.5", () => {
  closeTo(fleschReadingEase(INPUT).score, 59.635);
});

test("Flesch-Kincaid Grade: 0.39*20 + 11.8*1.5 - 15.59", () => {
  closeTo(fleschKincaidGrade(INPUT).score, 9.91);
});

test("Gunning Fog: 0.4 * (20 + 100*10/100)", () => {
  closeTo(gunningFog(INPUT).score, 12);
});

test("SMOG: 1.043*sqrt(10*30/5) + 3.1291", () => {
  closeTo(smog(INPUT).score, 11.208);
});

test("Coleman-Liau: 0.0588*450 - 0.296*5 - 15.8", () => {
  closeTo(colemanLiau(INPUT).score, 9.18);
});

test("ARI: 4.71*4.5 + 0.5*20 - 21.43", () => {
  closeTo(automatedReadability(INPUT).score, 9.765);
});

test("computeIndices returns all six, in order", () => {
  const indices = computeIndices(INPUT);
  assert.deepEqual(
    indices.map((index) => index.id),
    ["flesch", "fk", "fog", "smog", "coleman-liau", "ari"],
  );
  for (const index of indices) {
    assert.equal(typeof index.score, "number");
    assert.equal(typeof index.grade, "number");
    assert.ok(index.description.length > 0);
  }
});

test("Flesch label calls very easy text very easy", () => {
  const easy = fleschReadingEase({
    ...INPUT,
    words: 100,
    sentences: 10,
    syllables: 110,
  });
  assert.ok(easy.score > 90);
  assert.match(easy.description, /Very easy/);
});
