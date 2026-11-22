/**
 * The six readability formulas, as pure functions of text counts.
 *
 * Every function takes the same counts object so the formulas stay
 * independently testable. Scores are left unrounded here; the report layer
 * decides how to display them.
 */

export interface IndexInput {
  words: number;
  sentences: number;
  syllables: number;
  characters: number;
  letters: number;
  complexWords: number;
  polysyllables: number;
}

export interface ReadabilityIndex {
  /** Short stable id used by `--index`. */
  id: string;
  name: string;
  /** The formula's raw score. */
  score: number;
  /** Equivalent US school grade level (may be fractional or negative). */
  grade: number;
  /** One-line reading of what the score means. */
  description: string;
}

function fleschLabel(score: number): string {
  if (score >= 90) return "Very easy — a fifth grader could read it";
  if (score >= 80) return "Easy — conversational English";
  if (score >= 70) return "Fairly easy";
  if (score >= 60) return "Standard — plain English";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult — best for college readers";
  return "Very difficult — graduate level";
}

/** Flesch Reading Ease: 0–100, higher is easier to read. */
export function fleschReadingEase(input: IndexInput): ReadabilityIndex {
  const { words, sentences, syllables } = input;
  const score =
    206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  // Map the 0–100 ease scale onto the grade bands Flesch himself published.
  const grade =
    score >= 90
      ? 5
      : score >= 80
        ? 6
        : score >= 70
          ? 7
          : score >= 60
            ? 8.5
            : score >= 50
              ? 11
              : score >= 30
                ? 14.5
                : 17;
  return {
    id: "flesch",
    name: "Flesch Reading Ease",
    score,
    grade,
    description: fleschLabel(score),
  };
}

/** Flesch-Kincaid Grade Level: US school grade needed to understand it. */
export function fleschKincaidGrade(input: IndexInput): ReadabilityIndex {
  const { words, sentences, syllables } = input;
  const grade =
    0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return {
    id: "fk",
    name: "Flesch-Kincaid Grade",
    score: grade,
    grade,
    description: `Readable by a US grade ${Math.max(1, Math.round(grade))} student`,
  };
}

/**
 * Gunning Fog Index: years of formal education needed on first reading.
 * A "complex" word has 3+ syllables, excluding proper nouns, hyphenated
 * compounds, and words made complex only by -es/-ed/-ing — the caller
 * applies those exclusions when counting complexWords.
 */
export function gunningFog(input: IndexInput): ReadabilityIndex {
  const { words, sentences, complexWords } = input;
  const grade =
    0.4 * (words / sentences + 100 * (complexWords / words));
  return {
    id: "fog",
    name: "Gunning Fog Index",
    score: grade,
    grade,
    description:
      grade > 12
        ? "Above high-school level — consider shorter sentences"
        : "Within high-school reading level",
  };
}

/**
 * SMOG grade: built for checking health-care writing, it counts
 * polysyllables (3+ syllables) and scales them to a 30-sentence sample.
 */
export function smog(input: IndexInput): ReadabilityIndex {
  const { sentences, polysyllables } = input;
  const scaled = polysyllables * (30 / sentences);
  const grade = 1.043 * Math.sqrt(scaled) + 3.1291;
  return {
    id: "smog",
    name: "SMOG Grade",
    score: grade,
    grade,
    description: `Needs about ${Math.max(1, Math.round(grade))} years of schooling`,
  };
}

/** Coleman-Liau Index: grade level from letters and sentences per 100 words. */
export function colemanLiau(input: IndexInput): ReadabilityIndex {
  const { words, sentences, letters } = input;
  const l = (letters / words) * 100;
  const s = (sentences / words) * 100;
  const grade = 0.0588 * l - 0.296 * s - 15.8;
  return {
    id: "coleman-liau",
    name: "Coleman-Liau Index",
    score: grade,
    grade,
    description: `Roughly US grade ${Math.max(1, Math.round(grade))}`,
  };
}

/** Automated Readability Index: grade level from characters per word. */
export function automatedReadability(input: IndexInput): ReadabilityIndex {
  const { words, sentences, characters } = input;
  const grade =
    4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43;
  return {
    id: "ari",
    name: "Automated Readability Index",
    score: grade,
    grade,
    description: `Roughly US grade ${Math.max(1, Math.round(grade))}`,
  };
}

export const ALL_INDICES = [
  fleschReadingEase,
  fleschKincaidGrade,
  gunningFog,
  smog,
  colemanLiau,
  automatedReadability,
] as const;

export function computeIndices(input: IndexInput): ReadabilityIndex[] {
  return ALL_INDICES.map((fn) => fn(input));
}
