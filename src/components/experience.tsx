import { useEffect, useMemo } from "react";
import { BreathCanvas } from "@/components/breath-canvas";
import { SessionChrome } from "@/components/session-ui";
import { breathAudio } from "@/lib/audio/breath-audio";
import { createBreathEngine } from "@/lib/breath/engine";
import { useSession } from "@/lib/breath/store";

export function Experience() {
  const engine = useMemo(() => createBreathEngine(), []);

  useEffect(() => {
    const offPhase = engine.onPhase((phase, cycle) => {
      useSession.getState().setPhase(phase, cycle);
      if (phase === "inhale" || phase === "hold" || phase === "exhale") {
        breathAudio.chime(phase);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(phase === "hold" ? 6 : 10);
        }
      }
    });
    const offComplete = engine.onComplete(() => {
      breathAudio.chime("complete");
      useSession.getState().finish();
    });

    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const session = useSession.getState();
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        if (session.settingsOpen) return;
        if (session.screen === "start" || session.screen === "complete") {
          session.begin(engine);
        } else if (session.screen === "session") {
          if (session.paused) session.resume(engine);
          else session.pause(engine);
        }
      }
      if (event.key === "Escape") {
        if (session.settingsOpen) {
          session.setSettingsOpen(false);
          return;
        }
        if (session.screen === "session") session.end(engine);
      }
    }

    function onVis() {
      if (document.visibilityState === "visible") breathAudio.unlock();
    }

    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      offPhase();
      offComplete();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      engine.stop();
      breathAudio.stop();
    };
  }, [engine]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg select-none">
      <BreathCanvas engine={engine} />
      <div className="vignette" />
      <SessionChrome engine={engine} />
    </main>
  );
}
