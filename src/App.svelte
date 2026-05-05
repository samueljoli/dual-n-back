<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import { gsap } from "gsap";

  type Screen = "home" | "settings" | "stats" | "countdown" | "game" | "summary";

  type Trial = {
    position: number;
    letter: string;
    isPositionMatch: boolean;
    isSoundMatch: boolean;
  };

  type Response = {
    sound: boolean;
    position: boolean;
  };

  type Score = {
    visualHits: number;
    soundHits: number;
    visualMisses: number;
    soundMisses: number;
    visualFalseAlarms: number;
    soundFalseAlarms: number;
    accuracy: number;
  };

  const letters = ["b", "c", "f", "h", "k", "l", "m", "q", "r", "s", "t"];
  const positions = Array.from({ length: 9 }, (_, index) => index);
  const nOptions = Array.from({ length: 10 }, (_, index) => index + 1);
  const positionKeys = ["top-left", "top", "top-right", "left", "center", "right", "bottom-left", "bottom", "bottom-right"];
  const replayColumnWidth = 112;
  const replayBoardSize = 70;
  const replayBoardY = 60;
  const replayLetterY = 166;

  let screen: Screen = "home";
  let nLevel = 1;
  let trialCount = 20;
  let intervalMs = 2500;
  let debugMode = false;
  let countdown = 3;
  let currentTrialIndex = -1;
  let trials: Trial[] = [];
  let responses: Response[] = [];
  let score: Score | null = null;
  let currentLetterCue = "";
  let lastSession: Score | null = null;
  let countdownTimer: number | undefined;
  let trialTimer: number | undefined;
  let summaryDiagramSvg: SVGSVGElement | null = null;

  $: currentTrial = currentTrialIndex >= 0 ? trials[currentTrialIndex] : null;
  $: comparisonTrial = currentTrialIndex >= nLevel ? trials[currentTrialIndex - nLevel] : null;
  $: debugWindowStart = Math.max(0, currentTrialIndex - Math.max(nLevel, 2) - 2);
  $: debugTimeline = currentTrialIndex >= 0 ? trials.slice(debugWindowStart, currentTrialIndex + 1) : [];
  $: summaryDiagramStart = getSummaryDiagramStart();
  $: summaryDiagramTrials = trials.slice(summaryDiagramStart, Math.min(trials.length, summaryDiagramStart + 8));
  $: summaryDiagramWidth = 72 + summaryDiagramTrials.length * replayColumnWidth;
  $: progressLabel = currentTrialIndex >= 0 ? `${currentTrialIndex + 1} / ${trials.length}` : `0 / ${trialCount}`;
  $: soundSelected = currentTrialIndex >= 0 ? responses[currentTrialIndex]?.sound : false;
  $: positionSelected = currentTrialIndex >= 0 ? responses[currentTrialIndex]?.position : false;

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  function randomItem<T>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function generateTrials() {
    const nextTrials: Trial[] = [];

    for (let index = 0; index < trialCount; index += 1) {
      const canMatch = index >= nLevel;
      const makePositionMatch = canMatch && Math.random() < 0.32;
      const makeSoundMatch = canMatch && Math.random() < 0.32;
      const previous = canMatch ? nextTrials[index - nLevel] : null;
      const position = makePositionMatch && previous ? previous.position : randomItem(positions);
      const letter = makeSoundMatch && previous ? previous.letter : randomItem(letters);

      nextTrials.push({
        position,
        letter,
        isPositionMatch: Boolean(previous && position === previous.position),
        isSoundMatch: Boolean(previous && letter === previous.letter),
      });
    }

    return nextTrials;
  }

  function startCountdown() {
    clearTimers();
    trials = generateTrials();
    responses = trials.map(() => ({ sound: false, position: false }));
    score = null;
    currentTrialIndex = -1;
    currentLetterCue = "";
    countdown = 3;
    screen = "countdown";

    countdownTimer = window.setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        window.clearInterval(countdownTimer);
        countdownTimer = undefined;
        beginRound();
      }
    }, 1000);
  }

  function beginRound() {
    screen = "game";
    currentTrialIndex = -1;
    advanceTrial();
  }

  function advanceTrial() {
    currentTrialIndex += 1;

    if (currentTrialIndex >= trials.length) {
      finishRound();
      return;
    }

    announceLetter(trials[currentTrialIndex].letter);
    window.clearTimeout(trialTimer);
    trialTimer = window.setTimeout(advanceTrial, intervalMs);
  }

  function announceLetter(letter: string) {
    currentLetterCue = letter;

    if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
      window.setTimeout(() => {
        if (screen === "game") currentLetterCue = "";
      }, 650);
    }
  }

  function recordMatch(kind: keyof Response) {
    if (screen !== "game" || currentTrialIndex < 0 || !responses[currentTrialIndex]) return;
    responses[currentTrialIndex][kind] = true;
    responses = [...responses];
  }

  function finishRound() {
    clearTimers();
    score = calculateScore();
    lastSession = score;
    currentTrialIndex = -1;
    currentLetterCue = "";
    screen = "summary";
    window.setTimeout(animateSummaryDiagram, 0);
  }

  function calculateScore(): Score {
    let visualHits = 0;
    let soundHits = 0;
    let visualMisses = 0;
    let soundMisses = 0;
    let visualFalseAlarms = 0;
    let soundFalseAlarms = 0;

    trials.forEach((trial, index) => {
      const response = responses[index];

      if (trial.isPositionMatch && response.position) visualHits += 1;
      if (trial.isPositionMatch && !response.position) visualMisses += 1;
      if (!trial.isPositionMatch && response.position) visualFalseAlarms += 1;

      if (trial.isSoundMatch && response.sound) soundHits += 1;
      if (trial.isSoundMatch && !response.sound) soundMisses += 1;
      if (!trial.isSoundMatch && response.sound) soundFalseAlarms += 1;
    });

    const hits = visualHits + soundHits;
    const misses = visualMisses + soundMisses;
    const falseAlarms = visualFalseAlarms + soundFalseAlarms;
    const scoredResponses = hits + misses + falseAlarms;
    const accuracy = scoredResponses === 0 ? 100 : Math.round((hits / scoredResponses) * 100);

    return {
      visualHits,
      soundHits,
      visualMisses,
      soundMisses,
      visualFalseAlarms,
      soundFalseAlarms,
      accuracy: clamp(accuracy, 0, 100),
    };
  }

  function goHome() {
    clearTimers();
    screen = "home";
    currentTrialIndex = -1;
    currentLetterCue = "";
  }

  function testSound() {
    announceLetter(randomItem(letters));
  }

  function clearTimers() {
    if (countdownTimer) window.clearInterval(countdownTimer);
    if (trialTimer) window.clearTimeout(trialTimer);
    countdownTimer = undefined;
    trialTimer = undefined;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function getSummaryDiagramStart() {
    const firstMatchIndex = trials.findIndex((trial, index) => index >= nLevel && (trial.isPositionMatch || trial.isSoundMatch));
    if (firstMatchIndex === -1) return 0;
    return Math.max(0, firstMatchIndex - nLevel - 1);
  }

  function replayX(offset: number) {
    return 36 + offset * replayColumnWidth;
  }

  function replayDotX(position: number, offset: number) {
    const col = position % 3;
    return replayX(offset) + (col + 0.5) * (replayBoardSize / 3) - 8;
  }

  function replayDotY(position: number) {
    const row = Math.floor(position / 3);
    return replayBoardY + (row + 0.5) * (replayBoardSize / 3) - 8;
  }

  function isVisibleTrial(index: number) {
    return index >= summaryDiagramStart && index < summaryDiagramStart + summaryDiagramTrials.length;
  }

  async function animateSummaryDiagram() {
    await tick();
    if (!summaryDiagramSvg || screen !== "summary" || !debugMode) return;

    const svg = summaryDiagramSvg;
    const timeline = gsap.timeline();
    const hiddenItems = svg.querySelectorAll(".replay-letter-card, .replay-letter-text, .replay-dot, .replay-arrow, .replay-target-label");

    gsap.set(svg.querySelectorAll(".replay-top-board"), { opacity: 0, scale: 0.96, transformOrigin: "center" });
    gsap.set(hiddenItems, { opacity: 0, scale: 0.96, transformOrigin: "center" });

    timeline.to(svg.querySelectorAll(".replay-top-board"), {
      opacity: 1,
      scale: 1,
      duration: 0.28,
      ease: "power2.out",
      stagger: 0.035,
    });

    summaryDiagramTrials.forEach((_, offset) => {
      timeline.to(
        svg.querySelectorAll(`[data-replay-step="${offset}"]`),
        { opacity: 1, scale: 1, duration: 0.24, ease: "power2.out" },
        "+=0.08",
      );
      timeline.to(
        svg.querySelectorAll(`[data-replay-match="${offset}"]`),
        { opacity: 1, scale: 1, duration: 0.24, ease: "power2.out" },
        "-=0.06",
      );
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    const code = event.code;

    if (screen === "game") {
      if (key === "f" || code === "KeyF") {
        event.preventDefault();
        recordMatch("sound");
      }
      if (key === "j" || code === "KeyJ") {
        event.preventDefault();
        recordMatch("position");
      }
      if (key === "escape") goHome();
      return;
    }

    if ((key === " " || key === "enter") && (screen === "home" || screen === "summary")) {
      event.preventDefault();
      startCountdown();
    }

    if (key === "escape" && screen !== "home") goHome();
  }

  onDestroy(clearTimers);
</script>

<svelte:window on:keydown={handleKeydown} />

<main class="shell" data-screen={screen}>
  {#if screen === "home"}
    <section class="home-screen">
      <button class="help-button" aria-label="Help">?</button>

      <div class="brand">
        <h1>Dual N-Back</h1>
        <p>Scientifically proven memory workout</p>
      </div>

      <div class="start-zone">
        <p class="n-label">N = {nLevel}</p>
        <button class="play-button" on:click={startCountdown} aria-label="Start round">
          <span></span>
        </button>
      </div>

      <nav class="home-nav" aria-label="Main navigation">
        <button on:click={() => (screen = "settings")}>Settings</button>
        <div class="mark" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </div>
        <button on:click={() => (screen = "stats")}>Stats</button>
      </nav>
    </section>
  {:else if screen === "countdown"}
    <section class="countdown-screen">
      <button class="back-button" on:click={goHome} aria-label="Back">‹</button>
      <p class="top-n">N = {nLevel}</p>
      <div class="countdown-copy">
        <p>Get yourself ready</p>
        <strong>{countdown}</strong>
      </div>
      <p class="sound-reminder">Make sure that the sound is on</p>
    </section>
  {:else if screen === "game"}
    <section class="game-screen">
      <button class="back-button" on:click={goHome} aria-label="Back">‹</button>
      <p class="top-n">N = {nLevel}</p>
      <p class="progress">{progressLabel}</p>

      <div class="stage" aria-label="Position stimulus stage">
        <div class="debug-grid" aria-hidden="true">
          {#each positions as position}
            <span>{position + 1}</span>
          {/each}
        </div>
        {#if currentTrial}
          <div class="stimulus-square {positionKeys[currentTrial.position]}"></div>
        {/if}
        {#if currentLetterCue}
          <span class="sr-only" aria-live="polite">Sound cue {currentLetterCue}</span>
        {/if}
      </div>

      {#if debugMode && currentTrial}
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

      {/if}

      <div class="match-row">
        <button
          class:selected={soundSelected}
          class:debug-correct={debugMode && currentTrial?.isSoundMatch}
          class="match-button"
          on:click={() => recordMatch("sound")}
        >
          <span>Sound</span>
          <span>Match</span>
          <kbd>F</kbd>
        </button>
        <button
          class:selected={positionSelected}
          class:debug-correct={debugMode && currentTrial?.isPositionMatch}
          class="match-button"
          on:click={() => recordMatch("position")}
        >
          <span>Position</span>
          <span>Match</span>
          <kbd>J</kbd>
        </button>
      </div>
    </section>
  {:else if screen === "settings"}
    <section class="panel-screen">
      <button class="back-button" on:click={goHome} aria-label="Back">‹</button>
      <h2>Settings</h2>

      <div class="setting-group">
        <div>
          <h3>Select N</h3>
          <p>Manual level for the next session.</p>
        </div>
        <div class="n-grid">
          {#each nOptions as option}
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

      <button class="text-action" on:click={testSound}>Test sound</button>
    </section>
  {:else if screen === "stats"}
    <section class="panel-screen">
      <button class="back-button" on:click={goHome} aria-label="Back">‹</button>
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
  {:else if screen === "summary" && score}
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

      {#if debugMode && summaryDiagramTrials.length}
        <section class="summary-debug-replay" aria-label="Animated n-back debug replay">
          <h3>Debug replay</h3>
          <div class="replay-scroll">
            <svg
              bind:this={summaryDiagramSvg}
              class="debug-replay-svg"
              viewBox={`0 0 ${summaryDiagramWidth} 300`}
              role="img"
              aria-label={`Animated ${nLevel}-back comparison diagram`}
            >
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" class="replay-arrow-head" />
                </marker>
              </defs>

              <text x={summaryDiagramWidth / 2} y="24" class="replay-title">Example from this {nLevel}-back round</text>

              {#each summaryDiagramTrials as trial, offset}
                {@const trialIndex = summaryDiagramStart + offset}
                {@const x = replayX(offset)}
                {@const isCurrentMatch = trialIndex >= nLevel && (trial.isPositionMatch || trial.isSoundMatch)}
                <g class="replay-trial">
                  <rect class="replay-top-board" x={x} y={replayBoardY} width={replayBoardSize} height={replayBoardSize} />
                  <line class="replay-plus" x1={x + 29} y1={replayBoardY + 35} x2={x + 41} y2={replayBoardY + 35} />
                  <line class="replay-plus" x1={x + 35} y1={replayBoardY + 29} x2={x + 35} y2={replayBoardY + 41} />
                  <rect
                    class="replay-dot"
                    data-replay-step={offset}
                    x={replayDotX(trial.position, offset)}
                    y={replayDotY(trial.position)}
                    width="16"
                    height="16"
                    rx="3"
                  />
                  <line class="replay-link" x1={x + 35} y1="134" x2={x + 35} y2="160" />
                  <rect class:active={isCurrentMatch} class="replay-letter-card" data-replay-step={offset} x={x} y={replayLetterY} width={replayBoardSize} height={replayBoardSize} />
                  <text class="replay-letter-text" data-replay-step={offset} x={x + 35} y={replayLetterY + 49}>{trial.letter.toUpperCase()}</text>
                </g>
              {/each}

              {#each summaryDiagramTrials as trial, offset}
                {@const trialIndex = summaryDiagramStart + offset}
                {@const comparedIndex = trialIndex - nLevel}
                {@const comparedOffset = comparedIndex - summaryDiagramStart}
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

      <div class="summary-actions">
        <button class="text-action" on:click={() => (screen = "settings")}>Settings</button>
        <button class="play-again" on:click={startCountdown}>Play again</button>
        <button class="text-action" on:click={goHome}>Home</button>
      </div>
    </section>
  {/if}
</main>
