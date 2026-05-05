<script lang="ts">
  /**
   * Start screen for the trainer.
   *
   * Keeps the app practice-first: the selected N-level and start action are the
   * primary controls, with Settings and Stats available as secondary actions.
   */
  export let nLevel: number;
  export let onStart: () => void;
  export let onSettings: () => void;
  export let onStats: () => void;
</script>

<section class="home-screen">
  <button class="help-button" aria-label="Help">?</button>

  <div class="brand">
    <h1>Dual N-Back</h1>
    <p>Scientifically proven memory workout</p>
  </div>

  <div class="start-zone">
    <p class="n-label">N = {nLevel}</p>
    <button class="play-button" on:click={onStart} aria-label="Start round">
      <span></span>
    </button>
  </div>

  <nav class="home-nav" aria-label="Main navigation">
    <button on:click={onSettings}>Settings</button>
    <div class="mark" aria-hidden="true">
      <i></i><i></i><i></i><i></i>
    </div>
    <button on:click={onStats}>Stats</button>
  </nav>
</section>
