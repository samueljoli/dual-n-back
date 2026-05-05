import { describe, expect, it } from "vitest";
import { calculateScore, createEmptyResponses, generateTrials, getComparisonTrial, getSummaryDiagramStart } from "./game";
import type { MatchResponse, Trial } from "./types";

const trials: Trial[] = [
  { position: 0, letter: "b", isPositionMatch: false, isSoundMatch: false },
  { position: 1, letter: "c", isPositionMatch: false, isSoundMatch: false },
  { position: 0, letter: "b", isPositionMatch: true, isSoundMatch: true },
  { position: 3, letter: "d", isPositionMatch: false, isSoundMatch: false },
];

describe("generateTrials", () => {
  it("marks n-back matches from generated positions and letters", () => {
    const randomValues = [0, 0, 0.1, 0.1, 0.9, 0.9, 0.8, 0.8];
    const generated = generateTrials({
      nLevel: 1,
      trialCount: 3,
      random: () => randomValues.shift() ?? 0.5,
    });

    expect(generated[1].isPositionMatch).toBe(true);
    expect(generated[1].isSoundMatch).toBe(true);
    expect(generated[2].isPositionMatch).toBe(false);
    expect(generated[2].isSoundMatch).toBe(false);
  });

  it("creates one empty response per trial", () => {
    expect(createEmptyResponses(trials)).toEqual([
      { sound: false, position: false },
      { sound: false, position: false },
      { sound: false, position: false },
      { sound: false, position: false },
    ]);
  });
});

describe("calculateScore", () => {
  it("scores hits, misses, false alarms, and match accuracy", () => {
    const responses: MatchResponse[] = [
      { sound: false, position: false },
      { sound: false, position: true },
      { sound: true, position: false },
      { sound: false, position: false },
    ];

    expect(calculateScore(trials, responses)).toEqual({
      visualHits: 0,
      soundHits: 1,
      visualMisses: 1,
      soundMisses: 0,
      visualFalseAlarms: 1,
      soundFalseAlarms: 0,
      accuracy: 33,
    });
  });

  it("does not count correct non-responses as hit accuracy", () => {
    expect(calculateScore(trials, createEmptyResponses(trials)).accuracy).toBe(0);
  });
});

describe("n-back helpers", () => {
  it("returns the compared n-back trial only when available", () => {
    expect(getComparisonTrial(trials, 1, 2)).toBeNull();
    expect(getComparisonTrial(trials, 2, 2)).toBe(trials[0]);
  });

  it("starts summary diagrams near the first match", () => {
    expect(getSummaryDiagramStart(trials, 2)).toBe(0);
  });
});
