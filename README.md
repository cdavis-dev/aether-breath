# Aether

A guided breathing session in the browser. A ring of particles expands while you inhale, holds its orbit, then gathers inward on the exhale. The phase name, a progress line, and a soft chime mark each change.

There is no account. Timing and sound are saved in this browser only.

## A session

A session moves through three phases:

| Phase | What you do | What the ring does |
| --- | --- | --- |
| Inhale | Breathe in | Particles swell outward |
| Hold | Rest | The ring stays in orbit |
| Exhale | Breathe out | Particles gather inward |

The default pattern is 4 seconds in, 4 seconds held, and 6 seconds out, for 6 cycles. A hold of 0 skips that phase. An open session (the infinity option) keeps going until you end it.

When the last cycle finishes, the screen rests and offers **Again** or **Home**.

## Controls

On the start screen:

- **Begin**, or Space, starts a session
- **Adjust** opens timing and sound

During a session:

- Space pauses and resumes
- Escape, or the close button, ends the session and returns home
- The speaker button mutes and unmutes
- The phase label and progress line follow the current breath

On phones that support it, a short vibration marks each phase change.

## Timing

Presets set inhale, hold, and exhale together. You can still change each value afterward.

| Preset | Inhale | Hold | Exhale |
| --- | --- | --- | --- |
| Soft | 4s | 4s | 6s |
| Even | 4s | 4s | 4s |
| Deep | 5s | 5s | 8s |
| Brief | 3s | 2s | 4s |

Manual ranges:

- Inhale: 2–10 seconds
- Hold: off, or 1–10 seconds
- Exhale: 2–12 seconds
- Cycles: 3, 6, 9, 12, or open

Sound is a quiet drone that follows the ring, plus a chime at each phase. Both can be turned off.

## Run locally

Needs Node 22.

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

Other commands:

```bash
npm run build      # production build
npm run typecheck
npm run lint
npm test
```

## Deploy

This is a [TanStack Start](https://tanstack.com/start) app (React, Three.js, Zustand, and the Web Audio API). `vercel.json` targets Vercel. Push to `main` to publish.
