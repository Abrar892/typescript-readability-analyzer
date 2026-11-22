# readability-analyzer

A zero-dependency CLI that scores the readability of English text with six
classic formulas, so you can see at a glance whether a draft reads like a
storybook or a legal contract.

## What it measures

| Index | What it tells you |
| --- | --- |
| Flesch Reading Ease | 0–100 score; higher is easier (60–70 is plain English) |
| Flesch-Kincaid Grade | US school grade needed to understand the text |
| Gunning Fog Index | Years of formal education needed on first reading |
| SMOG Grade | Grade level, weighted toward polysyllabic words |
| Coleman-Liau Index | Grade level from letters and sentences per 100 words |
| Automated Readability Index | Grade level from characters per word |

The headline number is the **aggregate grade level**: the median of the
five grade-level indices. A median is used deliberately — no single formula
is authoritative, and the median keeps one outlier from moving the verdict.

## Install

```bash
npm install
npm run build
```

Requires Node 18 or later. There are no runtime dependencies.

## Usage

```bash
# Score a file
node dist/src/cli.js essay.txt

# Read from stdin
cat essay.txt | node dist/src/cli.js

# Score several files at once
node dist/src/cli.js chapter1.txt chapter2.txt

# Machine-readable output
node dist/src/cli.js --json essay.txt

# Only one index
node dist/src/cli.js --index fog essay.txt

# CI gate: fail (exit 2) when the text is below grade 8
node dist/src/cli.js --fail-below 8 draft.md
```

With `npm link`, the command is available as `readability`.

### Example output

```
Readability — essay.txt

Words: 142   Sentences: 9   Syllables: 231
Avg words/sentence: 15.8   Avg syllables/word: 1.6
Complex words (3+ syllables): 18   Polysyllables: 18

Aggregate grade level: 10.4
Standard — plain English

Indices:
  Flesch Reading Ease             58.20  — Fairly difficult
  Flesch-Kincaid Grade            10.10  — Readable by a US grade 10 student
  Gunning Fog Index               12.40  — Above high-school level — consider shorter sentences
  SMOG Grade                      11.20  — Needs about 11 years of schooling
  Coleman-Liau Index               9.80  — Roughly US grade 10
  Automated Readability Index     10.30  — Roughly US grade 10

Longest sentences:
  (31 words) Historians still debate which of these factors mattered most…

Complex words: administration, communicated, infrastructure
```

### Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Analysis succeeded |
| 1 | Usage error, unreadable file, or no words found |
| 2 | `--fail-below` threshold not met |

## How it works

1. **Tokenisation** — sentences split on `.` `!` `?`, with common
   abbreviations (`Dr.`, `e.g.`, `p.m.`) protected so they don't end a
   sentence. Words keep internal apostrophes and hyphens.
2. **Syllable counting** — a heuristic estimator: count vowel groups, then
   correct for a silent trailing `e`, consonant + `le` endings, `-ed`
   after `t`/`d`, `-es` after sibilants, and vowel pairs that split into
   two syllables (`media`, `radio`, `video`). A small exceptions table
   covers words the rules still miss (`interesting`, `business`,
   `rhythm`). This is a heuristic, not a dictionary — it is right for the
   large majority of common English words, and rare misses move a score
   by a fraction of a grade.
3. **Complex words** — following the Gunning Fog definition: 3+ syllables,
   excluding proper nouns, hyphenated compounds, and words made complex
   only by `-es`/`-ed`/`-ing`.

## Design decisions

- **Zero runtime dependencies.** The whole point is a small tool you can
  trust; pulling in a natural-language library for six arithmetic formulas
  would be the wrong trade.
- **Pure functions for the formulas.** Every index is a function of a
  counts object, so each formula is unit-testable against hand-computed
  values with no file I/O in the way.
- **Median, not mean, for the aggregate grade.** The formulas disagree —
  SMOG runs high, Coleman-Liau runs low on short words — and the median
  is the honest summary of five disagreeing experts.
- **The CLI is a thin shell.** Argument parsing, analysis and reporting
  are separate modules, so the report format can change without touching
  the maths.

## Tests

```bash
npm test
```

Runs the TypeScript build, then the `node:test` suite: tokenizer,
syllable counter (60+ words with hand-checked counts), each formula
against hand-computed values, analysis rules, and end-to-end CLI
behaviour including stdin, `--json`, `--index` and `--fail-below`.

## License

MIT
