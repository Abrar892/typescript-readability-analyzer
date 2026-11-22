/**
 * Heuristic English syllable counter.
 *
 * The estimate counts groups of consecutive vowels, then corrects for the
 * three patterns that trip a naive counter up most often:
 *
 *   - a silent trailing "e" ("like" is 1 syllable, not 2),
 *   - a consonant + "le" ending, which *is* a syllable ("table" is 2),
 *   - "-ed" after "t"/"d", which adds a syllable ("wanted" is 2,
 *     "walked" is 1), and "-es" after a sibilant ("horses" is 2).
 *
 * A few vowel pairs split into two syllables when they follow a consonant
 * ("media" is 3, "radio" is 3) — except after c/t, where they stay one
 * ("nation", "special"). Words the rules still get wrong live in
 * EXCEPTIONS. This is a heuristic, not a dictionary: it is right for the
 * large majority of common English words, and the README says so.
 */

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

/** Words where the rules above give the wrong answer. */
const EXCEPTIONS: Record<string, number> = {
  area: 3,
  being: 2,
  business: 2,
  chocolate: 2,
  comfortable: 3,
  every: 2,
  evening: 2,
  fluid: 2,
  idea: 3,
  interest: 2,
  interesting: 3,
  jeopardy: 3,
  journey: 2,
  leopard: 2,
  medicine: 3,
  rhythm: 2,
  ruin: 2,
  suicide: 3,
  vegetable: 3,
};

/** Vowel pairs that split into two syllables after a hard consonant. */
const SPLIT_PAIRS = new Set(["ia", "io", "eo", "ua", "uo"]);
const SPLIT_PREVIOUS = new Set([
  "b",
  "d",
  "f",
  "g",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "v",
  "z",
]);

function countVowelGroups(word: string): number {
  let groups = 0;
  let inGroup = false;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (VOWELS.has(ch)) {
      if (!inGroup) {
        groups++;
        inGroup = true;
      }
      // "y" only counts as a vowel when it is not the first letter.
      if (ch === "y" && i === 0) {
        groups--;
        inGroup = false;
      }
    } else {
      inGroup = false;
    }
  }
  return groups;
}

/** Count the syllables in one word (hyphenated compounds sum their parts). */
export function countSyllables(raw: string): number {
  const word = raw.toLowerCase().replace(/[^a-z\-']/g, "");
  if (word.length === 0) {
    return 0;
  }
  if (word.includes("-")) {
    return word
      .split("-")
      .filter((part) => part.length > 0)
      .reduce((sum, part) => sum + countSyllables(part), 0);
  }

  const known = EXCEPTIONS[word];
  if (known !== undefined) {
    return known;
  }

  let count = countVowelGroups(word);

  // Vowel pairs that split: "media" -> me-di-a, "video" -> vi-de-o.
  // "eo" only splits at the end of the word ("video", "rodeo") or after
  // the "geo-" root ("geography") — mid-word it stays one syllable
  // ("people", "leopard"). "ua" also splits after "t" ("actual",
  // "factual", "eventual").
  for (let i = 1; i < word.length - 1; i++) {
    const pair = word[i] + word[i + 1];
    const previous = word[i - 1];
    const isFinalPair = i + 2 === word.length;
    const canSplit =
      (SPLIT_PREVIOUS.has(previous) || (pair === "ua" && previous === "t")) &&
      word[i + 2] !== "n" &&
      (pair !== "eo" || isFinalPair || word.startsWith("geo"));
    if (SPLIT_PAIRS.has(pair) && canSplit) {
      count++;
    }
  }

  // Silent trailing "e" (or the "e" in a final "-es"), unless it is a
  // consonant + "le" ending or "-es" after a sibilant. The "e" is only
  // silent when it stands alone as its own vowel group — in "movies" or
  // "series" it belongs to the "ie" group and is a real syllable.
  if (word.endsWith("e") || word.endsWith("es")) {
    const eIndex = word.endsWith("es") ? word.length - 2 : word.length - 1;
    const beforeE = word[eIndex - 1];
    const loneE = beforeE !== undefined && !VOWELS.has(beforeE);
    const leEnding = /[^aeiouy]les?$/.test(word);
    const sibilantEs = /([sxz]|ch|sh|[cg])es$/.test(word);
    if (!leEnding && !sibilantEs && loneE) {
      count--;
    }
  }

  // "-ed" is silent unless the stem ends in "t" or "d".
  if (word.endsWith("ed") && word.length > 2) {
    const before = word[word.length - 3];
    if (before !== "t" && before !== "d") {
      count--;
    }
  }

  return Math.max(1, count);
}
