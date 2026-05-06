<script lang="ts">
  /**
   * App-level state coordinator.
   *
   * Screen components own presentation. Pure game rules live in `src/lib`.
   * This file owns cross-cutting browser concerns: timers, speech cleanup,
   * keyboard shortcuts, and top-level screen transitions.
   */
  import { onDestroy } from "svelte";
  import CountdownScreen from "./components/CountdownScreen.svelte";
  import GameScreen from "./components/GameScreen.svelte";
  import HomeScreen from "./components/HomeScreen.svelte";
  import SettingsScreen from "./components/SettingsScreen.svelte";
  import StatsScreen from "./components/StatsScreen.svelte";
  import SummaryScreen from "./components/SummaryScreen.svelte";
  import { LETTERS } from "./lib/constants";
  import { calculateScore, createEmptyResponses, generateTrials, getComparisonTrial } from "./lib/game";
  import { speakLetter, stopSpeech } from "./lib/speech";
  import type { MatchKind, MatchResponse, Score, Screen, Trial } from "./lib/types";

  let screen: Screen = "home";
  let nLevel = 1;
  let trialCount = 20;
  let intervalMs = 2500;
  let debugMode = false;
  let countdown = 3;
  let currentTrialIndex = -1;
  let trials: Trial[] = [];
  let responses: MatchResponse[] = [];
  let score: Score | null = null;
  let currentLetterCue = "";
  let lastSession: Score | null = null;
  let countdownTimer: number | undefined;
  let trialTimer: number | undefined;
  let pulseKind: MatchKind | null = null;
  let pulseTimer: number | undefined;

  $: currentTrial = currentTrialIndex >= 0 ? trials[currentTrialIndex] : null;
  $: comparisonTrial = getComparisonTrial(trials, currentTrialIndex, nLevel);
  $: progressLabel = currentTrialIndex >= 0 ? `${currentTrialIndex + 1} / ${trials.length}` : `0 / ${trialCount}`;
  $: soundSelected = currentTrialIndex >= 0 ? responses[currentTrialIndex]?.sound : false;
  $: positionSelected = currentTrialIndex >= 0 ? responses[currentTrialIndex]?.position : false;

  function startCountdown() {
    clearTimers();
    trials = generateTrials({ nLevel, trialCount });
    responses = createEmptyResponses(trials);
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
    speakLetter(letter, () => {
      if (screen === "game") currentLetterCue = "";
    });
  }

  function recordMatch(kind: MatchKind) {
    if (screen !== "game" || currentTrialIndex < 0 || !responses[currentTrialIndex]) return;
    responses[currentTrialIndex][kind] = true;
    responses = [...responses];
    pulseKind = kind;
    if (pulseTimer) window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => {
      pulseKind = null;
      pulseTimer = undefined;
    }, 620);
  }

  function finishRound() {
    clearTimers();
    score = calculateScore(trials, responses);
    lastSession = score;
    currentTrialIndex = -1;
    currentLetterCue = "";
    screen = "summary";
  }

  function goHome() {
    clearTimers();
    screen = "home";
    currentTrialIndex = -1;
    currentLetterCue = "";
  }

  function testSound() {
    announceLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  }

  function clearTimers() {
    if (countdownTimer) window.clearInterval(countdownTimer);
    if (trialTimer) window.clearTimeout(trialTimer);
    if (pulseTimer) window.clearTimeout(pulseTimer);
    countdownTimer = undefined;
    trialTimer = undefined;
    pulseTimer = undefined;
    pulseKind = null;
    stopSpeech();
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
    <HomeScreen
      {nLevel}
      onStart={startCountdown}
      onSettings={() => (screen = "settings")}
      onStats={() => (screen = "stats")}
    />
  {:else if screen === "countdown"}
    <CountdownScreen {countdown} {nLevel} onBack={goHome} />
  {:else if screen === "game"}
    <GameScreen
      {nLevel}
      {progressLabel}
      {currentTrial}
      {comparisonTrial}
      {currentLetterCue}
      {debugMode}
      {soundSelected}
      {positionSelected}
      {pulseKind}
      onBack={goHome}
      onMatch={recordMatch}
    />
  {:else if screen === "settings"}
    <SettingsScreen
      bind:nLevel
      bind:trialCount
      bind:intervalMs
      bind:debugMode
      onBack={goHome}
      onTestSound={testSound}
    />
  {:else if screen === "stats"}
    <StatsScreen {lastSession} onBack={goHome} />
  {:else if screen === "summary" && score}
    <SummaryScreen
      {score}
      {nLevel}
      {trials}
      {debugMode}
      onSettings={() => (screen = "settings")}
      onReplay={startCountdown}
      onHome={goHome}
    />
  {/if}
</main>
