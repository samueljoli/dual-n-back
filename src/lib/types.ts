/**
 * Top-level route/state for the single-window trainer.
 *
 * The app intentionally keeps navigation as an explicit finite state machine.
 * That makes keyboard shortcuts and timer cleanup easier to reason about than
 * nested route state for this small desktop app.
 */
export type Screen = "home" | "settings" | "stats" | "countdown" | "game" | "summary";

/**
 * One dual n-back stimulus.
 *
 * `position` is a zero-based index into the 3x3 visual grid, ordered left to
 * right, top to bottom. `letter` is the spoken auditory stimulus. The match
 * flags are precomputed against the configured n-back distance so scoring does
 * not need to re-derive trial history.
 */
export type Trial = {
  position: number;
  letter: string;
  isPositionMatch: boolean;
  isSoundMatch: boolean;
};

/**
 * User responses captured for a single trial.
 *
 * A value of `true` means the user claimed that modality matched the n-back
 * reference trial. Non-responses remain `false`.
 */
export type MatchResponse = {
  sound: boolean;
  position: boolean;
};

/**
 * Round score split by modality and error kind.
 *
 * `accuracy` is match accuracy, not total binary decision accuracy: it is
 * calculated as hits / (hits + misses + false alarms). Correctly doing nothing
 * on non-match trials is therefore not counted as a hit.
 */
export type Score = {
  visualHits: number;
  soundHits: number;
  visualMisses: number;
  soundMisses: number;
  visualFalseAlarms: number;
  soundFalseAlarms: number;
  accuracy: number;
};

/**
 * User-controlled round settings.
 *
 * These are kept serializable because they are the natural boundary for future
 * persistence in Tauri storage.
 */
export type GameSettings = {
  nLevel: number;
  trialCount: number;
  intervalMs: number;
  debugMode: boolean;
};

/**
 * A response modality that can be marked by keyboard or button input.
 */
export type MatchKind = keyof MatchResponse;
