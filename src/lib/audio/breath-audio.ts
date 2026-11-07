type OscBundle = {
  osc: OscillatorNode;
  gain: GainNode;
};

function ramp(param: AudioParam, value: number, time: number, constant = 0.06) {
  param.setTargetAtTime(value, time, constant);
}

class BreathAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private drones: OscBundle[] = [];
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private started = false;
  private enabled = true;
  private desiredMaster = 0;

  unlock() {
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
  }

  start() {
    this.ensure();
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    if (ctx.state === "suspended") void ctx.resume();
    this.started = true;
    this.desiredMaster = this.enabled ? 1 : 0;
    ramp(this.master.gain, this.desiredMaster, ctx.currentTime, 0.25);
    if (this.droneGain) {
      ramp(this.droneGain.gain, this.enabled ? 0.045 : 0, ctx.currentTime, 0.4);
    }
  }

  stop() {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.droneGain) return;
    this.started = false;
    ramp(this.master.gain, 0, ctx.currentTime, 0.18);
    ramp(this.droneGain.gain, 0, ctx.currentTime, 0.18);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.droneGain) return;
    const target = on && this.started ? 1 : 0;
    this.desiredMaster = target;
    ramp(this.master.gain, target, ctx.currentTime, 0.08);
    ramp(this.droneGain.gain, on && this.started ? 0.045 : 0, ctx.currentTime, 0.12);
  }

  setMotion(expansion: number, speed: number) {
    const ctx = this.ctx;
    if (!ctx || !this.filter || !this.droneGain || !this.started || !this.enabled) {
      return;
    }
    const t = ctx.currentTime;
    ramp(this.filter.frequency, 280 + expansion * 980, t, 0.12);
    ramp(this.droneGain.gain, 0.028 + expansion * 0.032 + speed * 0.006, t, 0.16);
  }

  chime(phase: "inhale" | "hold" | "exhale" | "complete" | "idle") {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled || !this.started) return;
    if (phase === "idle") return;
    const t = ctx.currentTime + 0.02;
    if (phase === "inhale") {
      this.ping(392, t, 0.055);
      this.ping(588, t + 0.08, 0.028);
    } else if (phase === "hold") {
      this.ping(523.25, t, 0.05);
    } else if (phase === "exhale") {
      this.ping(329.63, t, 0.05);
      this.ping(246.94, t + 0.12, 0.03);
    } else {
      this.ping(392, t, 0.045);
      this.ping(493.88, t + 0.18, 0.04);
      this.ping(587.33, t + 0.36, 0.05);
    }
  }

  private ping(freq: number, when: number, gain: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, when);
    f.type = "lowpass";
    f.frequency.setValueAtTime(freq * 4, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
    osc.connect(f);
    f.connect(g);
    g.connect(master);
    osc.start(when);
    osc.stop(when + 1.8);
    osc.onended = () => {
      osc.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }

  private ensure() {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx({ latencyHint: "interactive" });
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0;
    droneGain.connect(filter);
    filter.connect(master);

    const specs: Array<{ freq: number; type: OscillatorType; vol: number }> = [
      { freq: 55, type: "sine", vol: 0.55 },
      { freq: 82.4, type: "sine", vol: 0.32 },
      { freq: 110, type: "triangle", vol: 0.08 },
    ];
    const drones: OscBundle[] = specs.map((spec) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = spec.type;
      osc.frequency.value = spec.freq;
      gain.gain.value = spec.vol;
      osc.connect(gain);
      gain.connect(droneGain);
      osc.start();
      return { osc, gain };
    });

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.ctx = ctx;
    this.master = master;
    this.filter = filter;
    this.droneGain = droneGain;
    this.drones = drones;
    this.lfo = lfo;
    this.lfoGain = lfoGain;
  }
}

export const breathAudio = new BreathAudio();
