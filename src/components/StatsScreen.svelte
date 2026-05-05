<script lang="ts">
  /**
   * Lightweight session stats view.
   *
   * This currently presents only the most recent in-memory result. The prop
   * shape is deliberately compatible with future persistent history.
   */
  import type { Score } from "../lib/types";

  export let lastSession: Score | null;
  export let onBack: () => void;
</script>

<section class="panel-screen">
  <button class="back-button" on:click={onBack} aria-label="Back">‹</button>
  <h2>Stats</h2>
  {#if lastSession}
    <div class="summary-grid">
      <article><span>Accuracy</span><strong>{lastSession.accuracy}%</strong></article>
      <article><span>Hits</span><strong>{lastSession.visualHits + lastSession.soundHits}</strong></article>
      <article><span>Misses</span><strong>{lastSession.visualMisses + lastSession.soundMisses}</strong></article>
      <article><span>False alarms</span><strong>{lastSession.visualFalseAlarms + lastSession.soundFalseAlarms}</strong></article>
    </div>
  {:else}
    <p class="empty-copy">Complete a round to see your latest session here.</p>
  {/if}
</section>
