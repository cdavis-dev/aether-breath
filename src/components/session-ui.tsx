import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  Infinity as InfinityIcon,
  Pause,
  Play,
  Settings2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { BreathEngine } from "@/lib/breath/engine";
import { useSession } from "@/lib/breath/store";
import {
  CYCLE_OPTIONS,
  PRESETS,
  type Phase,
  type Settings,
} from "@/lib/breath/types";
import { cn } from "@/lib/utils";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
  complete: "Rest",
};

function tapScale(staticMotion?: boolean) {
  return staticMotion ? "" : "active:not-disabled:scale-[0.96]";
}

function PrimaryButton({
  children,
  className,
  staticMotion,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { staticMotion?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-12 min-w-44 items-center justify-center rounded-full bg-accent px-7",
        "font-medium text-accent-fg",
        "transition-[scale,background-color,opacity] duration-150 ease-out",
        "hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:opacity-40",
        tapScale(staticMotion),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  className,
  staticMotion,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { staticMotion?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm text-muted",
        "shadow-[var(--shadow-border)]",
        "transition-[scale,box-shadow,color] duration-150 ease-out",
        "hover:text-fg hover:shadow-[var(--shadow-border-hover)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        tapScale(staticMotion),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-full text-fg",
        "shadow-[var(--shadow-border)]",
        "transition-[scale,box-shadow,color] duration-150 ease-out",
        "hover:shadow-[var(--shadow-border-hover)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "active:not-disabled:scale-[0.96]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  format?: (n: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full text-lg text-fg",
            "transition-[scale,opacity] duration-150 ease-out active:not-disabled:scale-[0.96]",
            "disabled:opacity-30",
          )}
        >
          −
        </button>
        <span className="w-14 text-center font-medium tabular-nums text-fg">
          {format ? format(value) : `${value}s`}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full text-lg text-fg",
            "transition-[scale,opacity] duration-150 ease-out active:not-disabled:scale-[0.96]",
            "disabled:opacity-30",
          )}
        >
          +
        </button>
      </div>
    </div>
  );
}

function SettingsPanel({ engine }: { engine: BreathEngine }) {
  const open = useSession((s) => s.settingsOpen);
  const settings = useSession((s) => s.settings);
  const setSettings = useSession((s) => s.setSettings);
  const setSettingsOpen = useSession((s) => s.setSettingsOpen);

  function patch(partial: Partial<Settings>) {
    setSettings(partial, engine);
  }

  const activePreset = PRESETS.find(
    (p) =>
      p.inhaleSec === settings.inhaleSec &&
      p.holdSec === settings.holdSec &&
      p.exhaleSec === settings.exhaleSec,
  )?.id;

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex items-end justify-center p-4 sm:items-center",
        "transition-[opacity] duration-(--motion-fast) ease-[var(--ease-smooth-out)]",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-bg/70"
        onClick={() => setSettingsOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className={cn(
          "relative mb-[env(safe-area-inset-bottom)] w-full max-w-md rounded-xl bg-surface p-5",
          "shadow-[var(--shadow-border)]",
          "transition-[opacity,transform] duration-(--motion-slow) ease-[var(--ease-smooth-out)]",
          open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="settings-title" className="font-display text-2xl font-medium italic">
            Timing
          </h2>
          <IconButton label="Close" onClick={() => setSettingsOpen(false)}>
            <X className="size-4" strokeWidth={1.75} />
          </IconButton>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                patch({
                  inhaleSec: preset.inhaleSec,
                  holdSec: preset.holdSec,
                  exhaleSec: preset.exhaleSec,
                })
              }
              className={cn(
                "h-10 rounded-full px-4 text-sm",
                "transition-[scale,background-color,color] duration-150 ease-out",
                "active:not-disabled:scale-[0.96]",
                activePreset === preset.id
                  ? "bg-accent text-accent-fg"
                  : "text-muted shadow-[var(--shadow-border)] hover:text-fg",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <Stepper
            label="Inhale"
            value={settings.inhaleSec}
            min={2}
            max={10}
            onChange={(inhaleSec) => patch({ inhaleSec })}
          />
          <Stepper
            label="Hold"
            value={settings.holdSec}
            min={0}
            max={10}
            onChange={(holdSec) => patch({ holdSec })}
            format={(n) => (n === 0 ? "Off" : `${n}s`)}
          />
          <Stepper
            label="Exhale"
            value={settings.exhaleSec}
            min={2}
            max={12}
            onChange={(exhaleSec) => patch({ exhaleSec })}
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm text-muted">Cycles</p>
          <div className="flex flex-wrap gap-2">
            {CYCLE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patch({ cycles: n })}
                className={cn(
                  "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm",
                  "transition-[scale,background-color,color] duration-150 ease-out",
                  "active:not-disabled:scale-[0.96]",
                  settings.cycles === n
                    ? "bg-accent text-accent-fg"
                    : "text-muted shadow-[var(--shadow-border)] hover:text-fg",
                )}
                aria-label={n === 0 ? "Open session" : `${n} cycles`}
              >
                {n === 0 ? <InfinityIcon className="size-4" strokeWidth={1.75} /> : n}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-muted">Sound</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.sound}
            onClick={() => patch({ sound: !settings.sound })}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm",
              "transition-[scale,background-color,color] duration-150 ease-out",
              "active:not-disabled:scale-[0.96]",
              settings.sound
                ? "bg-accent text-accent-fg"
                : "text-muted shadow-[var(--shadow-border)]",
            )}
          >
            {settings.sound ? (
              <Volume2 className="size-4" strokeWidth={1.75} />
            ) : (
              <VolumeX className="size-4" strokeWidth={1.75} />
            )}
            {settings.sound ? "On" : "Off"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StartOverlay({ engine }: { engine: BreathEngine }) {
  const settings = useSession((s) => s.settings);
  const begin = useSession((s) => s.begin);
  const setSettingsOpen = useSession((s) => s.setSettingsOpen);
  const parts = [
    `${settings.inhaleSec}`,
    settings.holdSec > 0 ? `${settings.holdSec}` : null,
    `${settings.exhaleSec}`,
  ].filter(Boolean);

  return (
    <div
      data-screen="start"
      className="pointer-events-none absolute inset-0 flex flex-col justify-end"
    >
      <div
        className="pointer-events-auto flex flex-col items-start gap-6 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:px-10"
      >
        <div className="enter-1">
          <p className="mb-2 text-xs font-medium tracking-kicker text-subtle uppercase">
            Inhale · Hold · Exhale
          </p>
          <h1 className="font-display text-display leading-none font-medium tracking-display italic">
            Aether
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
            Follow the ring. Particles swell as you breathe in, rest in orbit, then
            gather home on the out-breath.
          </p>
        </div>
        <div className="enter-2 flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center">
          <PrimaryButton onClick={() => begin(engine)}>Begin</PrimaryButton>
          <div className="flex items-center gap-3">
            <p className="text-sm tabular-nums text-subtle">{parts.join(" · ")}s</p>
            <GhostButton onClick={() => setSettingsOpen(true)}>Adjust</GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionOverlay({ engine }: { engine: BreathEngine }) {
  const phase = useSession((s) => s.phase);
  const cycle = useSession((s) => s.cycle);
  const paused = useSession((s) => s.paused);
  const settings = useSession((s) => s.settings);
  const pause = useSession((s) => s.pause);
  const resume = useSession((s) => s.resume);
  const end = useSession((s) => s.end);
  const setSettings = useSession((s) => s.setSettings);
  const progressRef = useRef<HTMLDivElement>(null);
  const showHold = settings.holdSec > 0.05;
  const phases = (showHold ? (["inhale", "hold", "exhale"] as const) : (["inhale", "exhale"] as const));

  useEffect(() => {
    engine.setProgressEl(progressRef.current);
    return () => engine.setProgressEl(null);
  }, [engine]);

  const totalLabel =
    settings.cycles === 0
      ? `Cycle ${cycle + 1}`
      : `${cycle + 1} / ${settings.cycles}`;

  return (
    <div
      data-screen="session"
      className="pointer-events-none absolute inset-0 flex flex-col"
    >
      <header className="pointer-events-auto flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <p className="px-2 text-sm tabular-nums text-subtle">{totalLabel}</p>
        <div className="flex items-center gap-2">
          <IconButton
            label={settings.sound ? "Mute" : "Unmute"}
            onClick={() => setSettings({ sound: !settings.sound }, engine)}
          >
            <span className="relative block size-4">
              <Volume2
                className={cn(
                  "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-250 ease-in-out",
                  settings.sound
                    ? "scale-100 opacity-100 blur-none"
                    : "scale-[0.25] opacity-0 blur-[4px]",
                )}
                strokeWidth={1.75}
              />
              <VolumeX
                className={cn(
                  "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-250 ease-in-out",
                  settings.sound
                    ? "scale-[0.25] opacity-0 blur-[4px]"
                    : "scale-100 opacity-100 blur-none",
                )}
                strokeWidth={1.75}
              />
            </span>
          </IconButton>
          <IconButton
            label={paused ? "Resume" : "Pause"}
            onClick={() => (paused ? resume(engine) : pause(engine))}
          >
            <span className="relative block size-4">
              <Pause
                className={cn(
                  "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-250 ease-in-out",
                  paused
                    ? "scale-[0.25] opacity-0 blur-[4px]"
                    : "scale-100 opacity-100 blur-none",
                )}
                strokeWidth={1.75}
              />
              <Play
                className={cn(
                  "absolute inset-0 size-4 ml-px transition-[opacity,transform,filter] duration-250 ease-in-out",
                  paused
                    ? "scale-100 opacity-100 blur-none"
                    : "scale-[0.25] opacity-0 blur-[4px]",
                )}
                strokeWidth={1.75}
              />
            </span>
          </IconButton>
          <IconButton label="End session" onClick={() => end(engine)}>
            <X className="size-4" strokeWidth={1.75} />
          </IconButton>
        </div>
      </header>

      {paused ? (
        <div className="pointer-events-none flex flex-1 items-center justify-center">
          <p className="font-display text-3xl italic text-fg/80">Paused</p>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <footer className="pointer-events-none flex flex-col items-center gap-5 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <p
          aria-live="polite"
          className="font-display text-phase leading-none font-medium tracking-display italic text-fg"
        >
          {paused ? "Paused" : PHASE_LABEL[phase]}
        </p>
        <div className="flex items-center gap-8">
          {phases.map((p) => {
            const active = !paused && phase === p;
            return (
              <div key={p} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "text-xs tracking-label uppercase",
                    active ? "text-fg" : "text-subtle",
                  )}
                >
                  {p}
                </span>
                <span
                  className={cn(
                    "block size-1 rounded-full",
                    active ? "bg-aqua" : "bg-border",
                  )}
                />
              </div>
            );
          })}
        </div>
        <div className="h-px w-48 overflow-hidden bg-border">
          <div ref={progressRef} className="progress-fill" />
        </div>
      </footer>
    </div>
  );
}

function CompleteOverlay({ engine }: { engine: BreathEngine }) {
  const settings = useSession((s) => s.settings);
  const begin = useSession((s) => s.begin);
  const toStart = useSession((s) => s.toStart);
  const count = settings.cycles;

  return (
    <div
      data-screen="complete"
      className="pointer-events-none absolute inset-0 flex flex-col justify-end"
    >
      <div className="pointer-events-auto px-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10">
        <p className="enter-1 font-display text-display leading-none font-medium tracking-display italic">
          Rest
        </p>
        <p className="enter-2 mt-3 max-w-sm text-base text-muted">
          {count > 0
            ? `${count} cycle${count === 1 ? "" : "s"} complete.`
            : "The ring has settled."}
        </p>
        <div className="enter-3 mt-8 flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={() => begin(engine)}>Again</PrimaryButton>
          <GhostButton onClick={() => toStart(engine)}>Home</GhostButton>
        </div>
      </div>
    </div>
  );
}

export function SessionChrome({ engine }: { engine: BreathEngine }) {
  const screen = useSession((s) => s.screen);
  return (
    <>
      {screen === "start" ? <StartOverlay engine={engine} /> : null}
      {screen === "session" ? <SessionOverlay engine={engine} /> : null}
      {screen === "complete" ? <CompleteOverlay engine={engine} /> : null}
      <SettingsPanel engine={engine} />
    </>
  );
}
