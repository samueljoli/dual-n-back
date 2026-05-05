/**
 * Auditory cue alphabet for generated trials.
 *
 * Letters are lowercase so browser speech synthesis says the phoneme directly
 * instead of announcing "capital K" or similar.
 */
export const LETTERS = ["b", "c", "f", "h", "k", "l", "m", "q", "r", "s", "t"] as const;

/**
 * Zero-based 3x3 board positions, ordered left-to-right and top-to-bottom.
 */
export const POSITIONS = Array.from({ length: 9 }, (_, index) => index);

/**
 * Manual N-level choices exposed in Settings.
 */
export const N_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

/**
 * CSS placement classes corresponding to `POSITIONS`.
 */
export const POSITION_KEYS = [
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
] as const;

/**
 * SVG geometry constants for the debug replay diagram.
 */
export const REPLAY = {
  columnWidth: 112,
  boardSize: 70,
  boardY: 60,
  letterY: 166,
  maxTrials: 8,
} as const;
