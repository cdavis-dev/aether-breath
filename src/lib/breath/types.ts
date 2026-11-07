export type Phase = "idle" | "inhale" | "hold" | "exhale" | "complete";

export interface Settings {
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  cycles: number;
  sound: boolean;
}

export interface Snapshot {
  phase: Phase;
  phaseT: number;
  expansion: number;
  speed: number;
  cycle: number;
  time: number;
  running: boolean;
  paused: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  inhaleSec: 4,
  holdSec: 4,
  exhaleSec: 6,
  cycles: 6,
  sound: true,
};

export const PRESETS = [
  { id: "soft", label: "Soft", inhaleSec: 4, holdSec: 4, exhaleSec: 6 },
  { id: "even", label: "Even", inhaleSec: 4, holdSec: 4, exhaleSec: 4 },
  { id: "deep", label: "Deep", inhaleSec: 5, holdSec: 5, exhaleSec: 8 },
  { id: "brief", label: "Brief", inhaleSec: 3, holdSec: 2, exhaleSec: 4 },
] as const;

export const CYCLE_OPTIONS = [3, 6, 9, 12, 0] as const;
