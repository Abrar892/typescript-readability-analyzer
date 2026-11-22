/**
 * Turn raw text into a full readability analysis: counts, all six indices,
 * an aggregate grade, and the sentences and words worth a second look.
 */

import { computeIndices, type IndexInput, type ReadabilityIndex } from "./indices";
import { countSyllables } from "./syllables";
import {
  countCharacters,
  countLetters,
  splitSentences,
  tokenizeWords,
} from "./tokenizer";

export interface TextCounts {
  words: number;
  sentences: number;
  syllables: number;
  characters: number;
  letters: number;
  complexWords: number;
  polysyllables: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  avgCharsPerWord: number;
}

export interface LongSentence {
  text: string;
  words: number;
}

export interface Analysis {
  source: string;
  counts: TextCounts;
  indices: ReadabilityIndex[];
  /** Median of the five grade-level indices — the headline number. */
  aggregateGrade: number;
  fleschLabel: string;
  longestSentences: LongSentence[];
  sampleComplexWords: string[];
}

const COMPLEX_SUFFIXES = ["es", "ed", "ing"];

/**
 * A word is "complex" for Gunning Fog when it has 3+ syllables and is not
 * a proper noun, not hyphenated, and not complex only because of a suffix.
 */
function isComplexWord(word: string, sentenceInitial: boolean): boolean {
  if (word.includes("-")) return false;
  if (/^[A-Z]/.test(word) && !sentenceInitial) return false; // proper noun
  if (countSyllables(word) < 3) return false;
  for (const suffix of COMPLEX_SUFFIXES) {
    if (word.toLowerCase().endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      if (stem.length > 0 && countSyllables(stem) < 3) return false;
    }
  }
  return true;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function analyzeText(text: string, source: string): Analysis {
  const sentences = splitSentences(text);
  const words = tokenizeWords(text);
  const letters = countLetters(text);
  const characters = countCharacters(text);

  let syllables = 0;
  let polysyllables = 0;
  let complexWords = 0;
  const complexSeen = new Set<string>();
  const sentenceStats: LongSentence[] = [];

  for (const sentence of sentences) {
    const sentenceWords = tokenizeWords(sentence);
    sentenceStats.push({ text: sentence, words: sentenceWords.length });
    sentenceWords.forEach((word, index) => {
      const count = countSyllables(word);
      syllables += count;
      if (count >= 3) polysyllables++;
      if (isComplexWord(word, index === 0)) {
        complexWords++;
        complexSeen.add(word.toLowerCase());
      }
    });
  }

  const counts: TextCounts = {
    words: words.length,
    sentences: sentences.length,
    syllables,
    characters,
    letters,
    complexWords,
    polysyllables,
    avgWordsPerSentence:
      sentences.length > 0 ? words.length / sentences.length : 0,
    avgSyllablesPerWord: words.length > 0 ? syllables / words.length : 0,
    avgCharsPerWord: words.length > 0 ? characters / words.length : 0,
  };

  const input: IndexInput = {
    words: counts.words,
    sentences: counts.sentences,
    syllables: counts.syllables,
    characters: counts.characters,
    letters: counts.letters,
    complexWords: counts.complexWords,
    polysyllables: counts.polysyllables,
  };
  const indices = computeIndices(input);

  const gradeLevels = indices
    .filter((index) => index.id !== "flesch")
    .map((index) => index.grade);
  const aggregateGrade = median(gradeLevels);
  const flesch = indices.find((index) => index.id === "flesch")!;

  const longestSentences = sentenceStats
    .sort((a, b) => b.words - a.words)
    .slice(0, 3);

  return {
    source,
    counts,
    indices,
    aggregateGrade,
    fleschLabel: flesch.description,
    longestSentences,
    sampleComplexWords: [...complexSeen].sort().slice(0, 10),
  };
}
