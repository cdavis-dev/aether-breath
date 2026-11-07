import type { Phase, Settings, Snapshot } from "./types";
import { DEFAULT_SETTINGS } from "./types";

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function durationOf(phase: Phase, settings: Settings) {
  if (phase === "inhale") return settings.inhaleSec;
  if (phase === "hold") return settings.holdSec;
  if (phase === "exhale") return settings.exhaleSec;
  return 1;
}

export function createBreathEngine() {
  let phase: Phase = "idle";
  let phaseElapsed = 0;
  let cycle = 0;
  let expansion = 0.45;
  let speed = 0.42;
  let time = 0;
  let running = false;
  let paused = false;
  let settings: Settings = { ...DEFAULT_SETTINGS };
  let inhaleFrom = 0;
  let phaseT = 0;
  let lastEmitted: Phase = "idle";
  let progressEl: HTMLElement | null = null;

  const phaseListeners = new Set<(phase: Phase, cycle: number) => void>();
  const completeListeners = new Set<() => void>();

  function snapshot(): Snapshot {
    return {
      phase,
      phaseT,
      expansion,
      speed,
      cycle,
      time,
      running,
      paused,
    };
  }

  function emitPhase() {
    if (phase === lastEmitted) return;
    lastEmitted = phase;
    phaseListeners.forEach((fn) => fn(phase, cycle));
  }

  function nextPhase() {
    if (phase === "inhale") {
      phase = settings.holdSec > 0.05 ? "hold" : "exhale";
    } else if (phase === "hold") {
      phase = "exhale";
    } else if (phase === "exhale") {
      const finished = settings.cycles > 0 && cycle + 1 >= settings.cycles;
      if (finished) {
        phase = "complete";
        running = false;
        paused = false;
        completeListeners.forEach((fn) => fn());
      } else {
        cycle += 1;
        inhaleFrom = 0;
        phase = "inhale";
      }
    }
    phaseElapsed = 0;
    phaseT = 0;
  }

  function writeProgress() {
    if (!progressEl) return;
    progressEl.style.transform = `scaleX(${phaseT})`;
  }

  return {
    start(next: Settings) {
      settings = { ...next };
      running = true;
      paused = false;
      cycle = 0;
      inhaleFrom = expansion;
      phase = "inhale";
      phaseElapsed = 0;
      phaseT = 0;
      lastEmitted = "idle";
      emitPhase();
    },
    pause() {
      if (running) paused = true;
    },
    resume() {
      if (running) paused = false;
    },
    stop() {
      running = false;
      paused = false;
      phase = "idle";
      cycle = 0;
      phaseT = 0;
      emitPhase();
    },
    updateSettings(next: Settings) {
      settings = { ...next };
    },
    tick(dt: number): Snapshot {
      const d = Math.min(dt, 0.1);
      time += d;

      if (!running) {
        if (phase === "complete") {
          expansion += (0.05 - expansion) * (1 - Math.exp(-d * 1.6));
          speed += (0.16 - speed) * (1 - Math.exp(-d * 1.2));
          phaseT = 1;
        } else {
          const wave = Math.sin(time * 0.4);
          expansion = 0.4 + 0.14 * wave;
          speed = 0.4;
          phaseT = 0.5 + 0.5 * wave;
        }
        writeProgress();
        return snapshot();
      }

      if (paused) {
        writeProgress();
        return snapshot();
      }

      phaseElapsed += d;
      const dur = Math.max(durationOf(phase, settings), 0.05);
      const t = Math.min(phaseElapsed / dur, 1);
      phaseT = t;

      if (phase === "inhale") {
        const e = easeOutCubic(t);
        expansion = inhaleFrom + (1 - inhaleFrom) * e;
        speed = 0.36 + 0.74 * e;
      } else if (phase === "hold") {
        expansion = 1 + 0.014 * Math.sin(phaseElapsed * 1.35);
        speed = 1.08;
      } else if (phase === "exhale") {
        const e = easeInOutCubic(t);
        expansion = 1 - e;
        speed = 1.08 * (1 - 0.78 * e);
      }

      if (phaseElapsed >= dur) {
        nextPhase();
        emitPhase();
      }

      writeProgress();
      return snapshot();
    },
    get: snapshot,
    setProgressEl(el: HTMLElement | null) {
      progressEl = el;
    },
    onPhase(fn: (phase: Phase, cycle: number) => void) {
      phaseListeners.add(fn);
      return () => {
        phaseListeners.delete(fn);
      };
    },
    onComplete(fn: () => void) {
      completeListeners.add(fn);
      return () => {
        completeListeners.delete(fn);
      };
    },
  };
}

export type BreathEngine = ReturnType<typeof createBreathEngine>;
