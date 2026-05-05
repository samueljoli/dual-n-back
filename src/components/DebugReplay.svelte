<script lang="ts">
  /**
   * Animated explanation of an n-back comparison window.
   *
   * The SVG is rendered once the round is complete. GSAP then reveals boards,
   * letters, dots, and target arrows in sequence so the user can inspect why a
   * trial counted as a visual or auditory match.
   */
  import { onDestroy, onMount, tick } from "svelte";
  import { gsap } from "gsap";
  import { POSITION_KEYS, REPLAY } from "../lib/constants";
  import { getSummaryDiagramTrials } from "../lib/game";
  import type { Trial } from "../lib/types";

  export let nLevel: number;
  export let trials: Trial[];

  let summaryDiagramSvg: SVGSVGElement | null = null;
  let timeline: gsap.core.Timeline | null = null;

  $: diagram = getSummaryDiagramTrials(trials, nLevel);
  $: diagramWidth = 72 + diagram.trials.length * REPLAY.columnWidth;

  function replayX(offset: number) {
    return 36 + offset * REPLAY.columnWidth;
  }

  function replayDotX(position: number, offset: number) {
    const col = position % 3;
    return replayX(offset) + (col + 0.5) * (REPLAY.boardSize / 3) - 8;
  }

  function replayDotY(position: number) {
    const row = Math.floor(position / 3);
    return REPLAY.boardY + (row + 0.5) * (REPLAY.boardSize / 3) - 8;
  }

  function isVisibleTrial(index: number) {
    return index >= diagram.start && index < diagram.start + diagram.trials.length;
  }

  async function animate() {
    await tick();
    if (!summaryDiagramSvg) return;

    timeline?.kill();
    const svg = summaryDiagramSvg;
    const hiddenItems = svg.querySelectorAll(".replay-letter-card, .replay-letter-text, .replay-dot, .replay-arrow, .replay-target-label");

    gsap.set(svg.querySelectorAll(".replay-top-board"), { opacity: 0, scale: 0.96, transformOrigin: "center" });
    gsap.set(hiddenItems, { opacity: 0, scale: 0.96, transformOrigin: "center" });

    timeline = gsap.timeline();
    timeline.to(svg.querySelectorAll(".replay-top-board"), {
      opacity: 1,
      scale: 1,
      duration: 0.28,
      ease: "power2.out",
      stagger: 0.035,
    });

    diagram.trials.forEach((_, offset) => {
      timeline?.to(
        svg.querySelectorAll(`[data-replay-step="${offset}"]`),
        { opacity: 1, scale: 1, duration: 0.24, ease: "power2.out" },
        "+=0.08",
      );
      timeline?.to(
        svg.querySelectorAll(`[data-replay-match="${offset}"]`),
        { opacity: 1, scale: 1, duration: 0.24, ease: "power2.out" },
        "-=0.06",
      );
    });
  }

  onMount(animate);
  onDestroy(() => timeline?.kill());
</script>

{#if diagram.trials.length}
  <section class="summary-debug-replay" aria-label="Animated n-back debug replay">
    <h3>Debug replay</h3>
    <div class="replay-scroll">
      <svg
        bind:this={summaryDiagramSvg}
        class="debug-replay-svg"
        viewBox={`0 0 ${diagramWidth} 300`}
        role="img"
        aria-label={`Animated ${nLevel}-back comparison diagram`}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" class="replay-arrow-head" />
          </marker>
        </defs>

        <text x={diagramWidth / 2} y="24" class="replay-title">Example from this {nLevel}-back round</text>

        {#each diagram.trials as trial, offset}
          {@const trialIndex = diagram.start + offset}
          {@const x = replayX(offset)}
          {@const isCurrentMatch = trialIndex >= nLevel && (trial.isPositionMatch || trial.isSoundMatch)}
          <g class="replay-trial">
            <rect class="replay-top-board" x={x} y={REPLAY.boardY} width={REPLAY.boardSize} height={REPLAY.boardSize} />
            <line class="replay-plus" x1={x + 29} y1={REPLAY.boardY + 35} x2={x + 41} y2={REPLAY.boardY + 35} />
            <line class="replay-plus" x1={x + 35} y1={REPLAY.boardY + 29} x2={x + 35} y2={REPLAY.boardY + 41} />
            <rect
              class="replay-dot {POSITION_KEYS[trial.position]}"
              data-replay-step={offset}
              x={replayDotX(trial.position, offset)}
              y={replayDotY(trial.position)}
              width="16"
              height="16"
              rx="3"
            />
            <line class="replay-link" x1={x + 35} y1="134" x2={x + 35} y2="160" />
            <rect class:active={isCurrentMatch} class="replay-letter-card" data-replay-step={offset} x={x} y={REPLAY.letterY} width={REPLAY.boardSize} height={REPLAY.boardSize} />
            <text class="replay-letter-text" data-replay-step={offset} x={x + 35} y={REPLAY.letterY + 49}>{trial.letter.toUpperCase()}</text>
          </g>
        {/each}

        {#each diagram.trials as trial, offset}
          {@const trialIndex = diagram.start + offset}
          {@const comparedIndex = trialIndex - nLevel}
          {@const comparedOffset = comparedIndex - diagram.start}
          {#if trialIndex >= nLevel && isVisibleTrial(comparedIndex) && trial.isPositionMatch}
            <path
              class="replay-arrow visual"
              data-replay-match={offset}
              d={`M ${replayX(comparedOffset) + 35} 54 V 42 H ${replayX(offset) + 35} V 54`}
              marker-end="url(#arrowhead)"
            />
            <text class="replay-target-label" data-replay-match={offset} x={(replayX(comparedOffset) + replayX(offset)) / 2 + 35} y="37">visual target</text>
          {/if}
          {#if trialIndex >= nLevel && isVisibleTrial(comparedIndex) && trial.isSoundMatch}
            <path
              class="replay-arrow audio"
              data-replay-match={offset}
              d={`M ${replayX(comparedOffset) + 35} 244 V 274 H ${replayX(offset) + 35} V 244`}
              marker-end="url(#arrowhead)"
            />
            <text class="replay-target-label audio-label" data-replay-match={offset} x={(replayX(comparedOffset) + replayX(offset)) / 2 + 35} y="294">auditory target</text>
          {/if}
        {/each}
      </svg>
    </div>
  </section>
{/if}
