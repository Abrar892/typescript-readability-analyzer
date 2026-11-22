/**
 * Sentence splitting, word tokenisation and character counting.
 *
 * Sentence boundaries are `.`, `!` and `?`. Common abbreviations are
 * protected first so "Dr. Smith went to Washington." stays one sentence.
 * Words keep internal apostrophes and hyphens ("don't", "well-known")
 * because the syllable counter needs the whole token.
 */

const ABBREVIATIONS = [
  "Mr",
  "Mrs",
  "Ms",
  "Dr",
  "Prof",
  "Sr",
  "Jr",
  "St",
  "vs",
  "etc",
  "e.g",
  "i.e",
  "U.S",
  "U.K",
  "a.m",
  "p.m",
];

const PLACEHOLDER = "";

/** Split text into sentences, keeping the trailing punctuation. */
export function splitSentences(text: string): string[] {
  let work = text;
  for (const abbr of ABBREVIATIONS) {
    const escaped = abbr.replace(/\./g, "\\.");
    work = work.replace(new RegExp(`\\b${escaped}\\.`, "g"), (m) =>
      m.replace(/\./g, PLACEHOLDER),
    );
  }

  const sentences: string[] = [];
  const re = /[^.!?]+(?:[.!?]+["'”’]?|$)/g;
  for (const match of work.matchAll(re)) {
    const sentence = match[0].replaceAll(PLACEHOLDER, ".").trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
  }
  return sentences;
}

const WORD_RE = /[A-Za-z]+(?:['’\-][A-Za-z]+)*/g;

/** All word tokens in a string, in order. Numbers are not words. */
export function tokenizeWords(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

/** Letters only (a-z, A-Z). Used by Coleman-Liau. */
export function countLetters(text: string): number {
  return (text.match(/[A-Za-z]/g) ?? []).length;
}

/** Letters plus digits. Used by the Automated Readability Index. */
export function countCharacters(text: string): number {
  return (text.match(/[A-Za-z0-9]/g) ?? []).length;
}
