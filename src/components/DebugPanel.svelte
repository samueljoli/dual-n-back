<script lang="ts">
  /**
   * In-round answer inspector for development and calibration.
   *
   * This is intentionally separate from the replay diagram: it answers "what
   * should I press right now?" without adding large visual noise to the stage.
   */
  import type { Trial } from "../lib/types";

  export let currentTrial: Trial;
  export let comparisonTrial: Trial | null;
</script>

<aside class="debug-panel" aria-label="Debug answers">
  <p>Debug answers</p>
  <dl>
    <div>
      <dt>Sound</dt>
      <dd class:match={currentTrial.isSoundMatch}>{currentTrial.isSoundMatch ? "match" : "no match"}</dd>
    </div>
    <div>
      <dt>Position</dt>
      <dd class:match={currentTrial.isPositionMatch}>{currentTrial.isPositionMatch ? "match" : "no match"}</dd>
    </div>
    <div>
      <dt>Letter</dt>
      <dd>{currentTrial.letter}{comparisonTrial ? ` / ${comparisonTrial.letter}` : " / none"}</dd>
    </div>
    <div>
      <dt>Cell</dt>
      <dd>{currentTrial.position + 1}{comparisonTrial ? ` / ${comparisonTrial.position + 1}` : " / none"}</dd>
    </div>
  </dl>
</aside>
