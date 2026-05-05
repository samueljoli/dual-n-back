<script lang="ts">
  /**
   * Manual training configuration.
   *
   * Settings are bound upward so `App.svelte` remains the single owner of round
   * state. This keeps future persistence straightforward.
   */
  import { N_OPTIONS } from "../lib/constants";

  export let nLevel: number;
  export let trialCount: number;
  export let intervalMs: number;
  export let debugMode: boolean;
  export let onBack: () => void;
  export let onTestSound: () => void;
</script>

<section class="panel-screen">
  <button class="back-button" on:click={onBack} aria-label="Back">‹</button>
  <h2>Settings</h2>

  <div class="setting-group">
    <div>
      <h3>Select N</h3>
      <p>Manual level for the next session.</p>
    </div>
    <div class="n-grid">
      {#each N_OPTIONS as option}
        <button class:active={nLevel === option} on:click={() => (nLevel = option)}>{option}</button>
      {/each}
    </div>
  </div>

  <label class="setting-row">
    <span>
      <strong>Trials</strong>
      <small>{trialCount} per round</small>
    </span>
    <input type="range" min="10" max="50" step="5" bind:value={trialCount} />
  </label>

  <label class="setting-row">
    <span>
      <strong>Speed</strong>
      <small>{(intervalMs / 1000).toFixed(1)} seconds</small>
    </span>
    <input type="range" min="1500" max="4000" step="250" bind:value={intervalMs} />
  </label>

  <label class="toggle-row">
    <span>
      <strong>Debug answers</strong>
      <small>Show the correct match selection during play.</small>
    </span>
    <input type="checkbox" bind:checked={debugMode} />
  </label>

  <button class="text-action" on:click={onTestSound}>Test sound</button>
</section>
