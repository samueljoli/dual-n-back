<script lang="ts">
  /**
   * Active round surface.
   *
   * This component renders the stimulus stage, optional debug answer panel, and
   * modality response buttons. It does not own timers or scoring.
   */
  import { POSITIONS, POSITION_KEYS } from "../lib/constants";
  import type { MatchKind, Trial } from "../lib/types";
  import DebugPanel from "./DebugPanel.svelte";

  export let nLevel: number;
  export let progressLabel: string;
  export let currentTrial: Trial | null;
  export let comparisonTrial: Trial | null;
  export let currentLetterCue: string;
  export let debugMode: boolean;
  export let soundSelected: boolean;
  export let positionSelected: boolean;
  export let onBack: () => void;
  export let onMatch: (kind: MatchKind) => void;
</script>

<section class="game-screen">
  <button class="back-button" on:click={onBack} aria-label="Back">‹</button>
  <p class="top-n">N = {nLevel}</p>
  <p class="progress">{progressLabel}</p>

  <div class="stage" aria-label="Position stimulus stage">
    <div class="debug-grid" aria-hidden="true">
      {#each POSITIONS as position}
        <span>{position + 1}</span>
      {/each}
    </div>
    {#if currentTrial}
      <div class="stimulus-square {POSITION_KEYS[currentTrial.position]}"></div>
    {/if}
    {#if currentLetterCue}
      <span class="sr-only" aria-live="polite">Sound cue {currentLetterCue}</span>
    {/if}
  </div>

  {#if debugMode && currentTrial}
    <DebugPanel {currentTrial} {comparisonTrial} />
  {/if}

  <div class="match-row">
    <button
      class:selected={soundSelected}
      class:debug-correct={debugMode && currentTrial?.isSoundMatch}
      class="match-button"
      on:click={() => onMatch("sound")}
    >
      <span>Sound</span>
      <span>Match</span>
      <kbd>F</kbd>
    </button>
    <button
      class:selected={positionSelected}
      class:debug-correct={debugMode && currentTrial?.isPositionMatch}
      class="match-button"
      on:click={() => onMatch("position")}
    >
      <span>Position</span>
      <span>Match</span>
      <kbd>J</kbd>
    </button>
  </div>
</section>
