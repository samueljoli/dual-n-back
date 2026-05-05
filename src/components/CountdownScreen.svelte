<script lang="ts">
  /**
   * Pre-round readiness screen.
   *
   * The countdown gives the user a predictable transition between setup and the
   * first stimulus, which is especially important for auditory tasks.
   */
  export let countdown: number;
  export let nLevel: number;
  export let onBack: () => void;
</script>

<section class="countdown-screen">
  <button class="back-button" on:click={onBack} aria-label="Back">‹</button>
  <p class="top-n">N = {nLevel}</p>
  <div class="countdown-copy">
    <p>Get yourself ready</p>
    <strong>{countdown}</strong>
  </div>
  <p class="sound-reminder">Make sure that the sound is on</p>
</section>
