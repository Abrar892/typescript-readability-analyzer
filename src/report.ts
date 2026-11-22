/**
 * Render an analysis as human-readable text or JSON.
 * Scores are shown to two decimals; grades to one.
 */

import type { Analysis } from "./analyze";

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function formatText(analysis: Analysis): string {
  const c = analysis.counts;
  const lines: string[] = [
    `Readability — ${analysis.source}`,
    "",
    `Words: ${c.words}   Sentences: ${c.sentences}   Syllables: ${c.syllables}`,
    `Avg words/sentence: ${round(c.avgWordsPerSentence)}   Avg syllables/word: ${round(c.avgSyllablesPerWord)}`,
    `Complex words (3+ syllables): ${c.complexWords}   Polysyllables: ${c.polysyllables}`,
    "",
    `Aggregate grade level: ${round(analysis.aggregateGrade, 1)}`,
    `${analysis.fleschLabel}`,
    "",
    "Indices:",
  ];
  for (const index of analysis.indices) {
    lines.push(
      `  ${index.name.padEnd(28)} ${round(index.score).toFixed(2).padStart(7)}  — ${index.description}`,
    );
  }
  if (analysis.longestSentences.length > 0) {
    lines.push("", "Longest sentences:");
    for (const sentence of analysis.longestSentences) {
      lines.push(
        `  (${sentence.words} words) ${truncate(sentence.text, 100)}`,
      );
    }
  }
  if (analysis.sampleComplexWords.length > 0) {
    lines.push(
      "",
      `Complex words: ${analysis.sampleComplexWords.join(", ")}`,
    );
  }
  return lines.join("\n");
}

export function formatJson(analysis: Analysis): string {
  return JSON.stringify(
    {
      source: analysis.source,
      counts: {
        words: analysis.counts.words,
        sentences: analysis.counts.sentences,
        syllables: analysis.counts.syllables,
        characters: analysis.counts.characters,
        letters: analysis.counts.letters,
        complexWords: analysis.counts.complexWords,
        polysyllables: analysis.counts.polysyllables,
        avgWordsPerSentence: round(analysis.counts.avgWordsPerSentence),
        avgSyllablesPerWord: round(analysis.counts.avgSyllablesPerWord),
        avgCharsPerWord: round(analysis.counts.avgCharsPerWord),
      },
      aggregateGrade: round(analysis.aggregateGrade, 1),
      fleschLabel: analysis.fleschLabel,
      indices: analysis.indices.map((index) => ({
        id: index.id,
        name: index.name,
        score: round(index.score),
        grade: round(index.grade, 1),
        description: index.description,
      })),
      longestSentences: analysis.longestSentences,
      sampleComplexWords: analysis.sampleComplexWords,
    },
    null,
    2,
  );
}
