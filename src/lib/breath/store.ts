import { create } from "zustand";
import type { BreathEngine } from "./engine";
import type { Phase, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { clamp } from "@/lib/utils";
import { breathAudio } from "@/lib/audio/breath-audio";

const KEY = "aether-settings-v1";

function loadSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const cycles = Number(parsed.cycles);
    return {
      inhaleSec: clamp(Number(parsed.inhaleSec) || 4, 2, 10),
      holdSec: clamp(Number(parsed.holdSec ?? 4), 0, 10),
      exhaleSec: clamp(Number(parsed.exhaleSec) || 6, 2, 12),
      cycles: [0, 3, 6, 9, 12].includes(cycles) ? cycles : 6,
      sound: parsed.sound !== false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persist(settings: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, ...settings }));
  } catch {
    /* ignore quota / private mode */
  }
}

export type Screen = "start" | "session" | "complete";

interface SessionState {
  screen: Screen;
  phase: Phase;
  cycle: number;
  paused: boolean;
  settings: Settings;
  settingsOpen: boolean;
  begin: (engine: BreathEngine) => void;
  pause: (engine: BreathEngine) => void;
  resume: (engine: BreathEngine) => void;
  end: (engine: BreathEngine) => void;
  finish: () => void;
  toStart: (engine: BreathEngine) => void;
  setPhase: (phase: Phase, cycle: number) => void;
  setSettings: (partial: Partial<Settings>, engine?: BreathEngine) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const useSession = create<SessionState>((set, get) => ({
  screen: "start",
  phase: "idle",
  cycle: 0,
  paused: false,
  settings: loadSettings(),
  settingsOpen: false,
  begin: (engine) => {
    const { settings } = get();
    breathAudio.unlock();
    breathAudio.start();
    breathAudio.setEnabled(settings.sound);
    engine.start(settings);
    set({
      screen: "session",
      paused: false,
      phase: "inhale",
      cycle: 0,
      settingsOpen: false,
    });
  },
  pause: (engine) => {
    engine.pause();
    breathAudio.setEnabled(false);
    set({ paused: true });
  },
  resume: (engine) => {
    engine.resume();
    breathAudio.unlock();
    breathAudio.setEnabled(get().settings.sound);
    set({ paused: false });
  },
  end: (engine) => {
    engine.stop();
    breathAudio.stop();
    set({
      screen: "start",
      paused: false,
      phase: "idle",
      cycle: 0,
    });
  },
  finish: () => {
    breathAudio.stop();
    set({ screen: "complete", paused: false, phase: "complete" });
  },
  toStart: (engine) => {
    engine.stop();
    breathAudio.stop();
    set({
      screen: "start",
      paused: false,
      phase: "idle",
      cycle: 0,
    });
  },
  setPhase: (phase, cycle) => set({ phase, cycle }),
  setSettings: (partial, engine) => {
    const settings = { ...get().settings, ...partial };
    persist(settings);
    engine?.updateSettings(settings);
    if (partial.sound !== undefined) {
      breathAudio.setEnabled(partial.sound && get().screen === "session" && !get().paused);
    }
    set({ settings });
  },
  setSettingsOpen: (open) => set({ settingsOpen: open }),
}));
