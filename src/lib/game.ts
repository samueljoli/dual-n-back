import { LETTERS, POSITIONS, REPLAY } from "./constants";
import type { MatchResponse, Score, Trial } from "./types";

type TrialGenerationOptions = {
  /** Distance to compare against for match detection. */
  nLevel: number;
  /** Number of stimuli in the round. */
  trialCount: number;
  /** Injectable RNG for deterministic tests. Defaults to `Math.random`. */
  random?: () => number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomItem<T>(items: readonly T[], random: () => number) {
  return items[Math.floor(random() * items.length)];
}

/**
 * Generates a full round of dual n-back stimuli.
 *
 * Match opportunities begin only once `index >= nLevel`. When a match is chosen
 * for a modality, the new trial copies the value from the n-back reference
 * trial; otherwise it samples a fresh value from the configured alphabet/grid.
 *
 * The returned `Trial` objects include authoritative match flags. Consumers
 * should use those flags for scoring and debug UI instead of recomputing match
 * status from display data.
 */
export function generateTrials({ nLevel, trialCount, random = Math.random }: TrialGenerationOptions): Trial[] {
  const trials: Trial[] = [];

  for (let index = 0; index < trialCount; index += 1) {
    const canMatch = index >= nLevel;
    const shouldPositionMatch = canMatch && random() < 0.32;
    const shouldSoundMatch = canMatch && random() < 0.32;
    const previous = canMatch ? trials[index - nLevel] : null;
    const position = shouldPositionMatch && previous ? previous.position : randomItem(POSITIONS, random);
    const letter = shouldSoundMatch && previous ? previous.letter : randomItem(LETTERS, random);

    trials.push({
      position,
      letter,
      isPositionMatch: Boolean(previous && position === previous.position),
      isSoundMatch: Boolean(previous && letter === previous.letter),
    });
  }

  return trials;
}

/**
 * Creates the response vector for a newly generated round.
 *
 * Keeping responses parallel to `trials` gives O(1) update and scoring access
 * by trial index. Each trial starts with no claimed matches.
 */
export function createEmptyResponses(trials: Trial[]): MatchResponse[] {
  return trials.map(() => ({ sound: false, position: false }));
}

/**
 * Scores a completed dual n-back round.
 *
 * The headline `accuracy` intentionally ignores correct non-responses. In this
 * trainer, the user-facing metric should answer "how well did I identify the
 * actual matches?" rather than "how often did I avoid pressing a button?".
 */
export function calculateScore(trials: Trial[], responses: MatchResponse[]): Score {
  let visualHits = 0;
  let soundHits = 0;
  let visualMisses = 0;
  let soundMisses = 0;
  let visualFalseAlarms = 0;
  let soundFalseAlarms = 0;

  trials.forEach((trial, index) => {
    const response = responses[index] ?? { sound: false, position: false };

    if (trial.isPositionMatch && response.position) visualHits += 1;
    if (trial.isPositionMatch && !response.position) visualMisses += 1;
    if (!trial.isPositionMatch && response.position) visualFalseAlarms += 1;

    if (trial.isSoundMatch && response.sound) soundHits += 1;
    if (trial.isSoundMatch && !response.sound) soundMisses += 1;
    if (!trial.isSoundMatch && response.sound) soundFalseAlarms += 1;
  });

  const hits = visualHits + soundHits;
  const misses = visualMisses + soundMisses;
  const falseAlarms = visualFalseAlarms + soundFalseAlarms;
  const scoredResponses = hits + misses + falseAlarms;
  const accuracy = scoredResponses === 0 ? 100 : Math.round((hits / scoredResponses) * 100);

  return {
    visualHits,
    soundHits,
    visualMisses,
    soundMisses,
    visualFalseAlarms,
    soundFalseAlarms,
    accuracy: clamp(accuracy, 0, 100),
  };
}

/**
 * Returns the trial currently being compared against, if the round has advanced
 * far enough to have an n-back reference.
 */
export function getComparisonTrial(trials: Trial[], currentTrialIndex: number, nLevel: number): Trial | null {
  return currentTrialIndex >= nLevel ? trials[currentTrialIndex - nLevel] : null;
}

/**
 * Selects a replay window that includes the first match when possible.
 *
 * The summary diagram has limited horizontal space, so it shows a focused slice
 * of the round rather than every trial. When no match exists, it starts at the
 * beginning.
 */
export function getSummaryDiagramStart(trials: Trial[], nLevel: number) {
  const firstMatchIndex = trials.findIndex((trial, index) => index >= nLevel && (trial.isPositionMatch || trial.isSoundMatch));
  if (firstMatchIndex === -1) return 0;
  return Math.max(0, firstMatchIndex - nLevel - 1);
}

/**
 * Returns the summary replay slice plus its original trial offset.
 */
export function getSummaryDiagramTrials(trials: Trial[], nLevel: number) {
  const start = getSummaryDiagramStart(trials, nLevel);
  return {
    start,
    trials: trials.slice(start, Math.min(trials.length, start + REPLAY.maxTrials)),
  };
}
