<script lang="ts">
  /**
   * End-of-round result screen.
   *
   * Shows the user-facing score first, then optional debug replay when enabled.
   * The screen exposes navigation callbacks but does not mutate game state.
   */
  import type { Score, Trial } from "../lib/types";
  import DebugReplay from "./DebugReplay.svelte";

  export let score: Score;
  export let nLevel: number;
  export let trials: Trial[];
  export let debugMode: boolean;
  export let onSettings: () => void;
  export let onReplay: () => void;
  export let onHome: () => void;
</script>

<section class="summary-screen">
  <p class="top-n">N = {nLevel}</p>
  <h2>Round complete</h2>
  <div class="accuracy-ring">
    <strong>{score.accuracy}%</strong>
    <span>accuracy</span>
  </div>

  <div class="summary-grid">
    <article><span>Hits</span><strong>{score.visualHits + score.soundHits}</strong></article>
    <article><span>Misses</span><strong>{score.visualMisses + score.soundMisses}</strong></article>
    <article><span>False alarms</span><strong>{score.visualFalseAlarms + score.soundFalseAlarms}</strong></article>
    <article><span>Trials</span><strong>{trials.length}</strong></article>
  </div>

  {#if debugMode}
    <DebugReplay {nLevel} {trials} />
  {/if}

  <div class="summary-actions">
    <button class="text-action" on:click={onSettings}>Settings</button>
    <button class="play-again" on:click={onReplay}>Play again</button>
    <button class="text-action" on:click={onHome}>Home</button>
  </div>
</section>
