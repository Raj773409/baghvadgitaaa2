/**
 * Procedural Web Audio Sanctuary Soundscape for WelcomeExperience:
 * - Subtle midnight tanpura-like ambient drone
 * - Resonant Indian brass temple bell chime
 * - Gentle conch (shankha) harmonic breath swell
 * Respects browser autoplay policy strictly: never claims sound is active when AudioContext is suspended.
 */

export class WelcomeSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneNodes: Array<{ osc: OscillatorNode; lfo?: OscillatorNode }> = [];
  private disposed = false;
  private muted = false;
  private ducked = false;
  private droneStarted = false;
  private bellPlayed = false;
  private conchPlayed = false;

  public isRunning(): boolean {
    return Boolean(this.ctx && this.ctx.state === 'running' && !this.muted);
  }

  public async ensureUnlocked(): Promise<boolean> {
    if (this.disposed || typeof window === 'undefined') return false;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.72, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return false;
      }
    }

    return this.ctx.state === 'running';
  }

  public setMuted(nextMuted: boolean): void {
    this.muted = nextMuted;
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    const target = nextMuted ? 0 : this.ducked ? 0.28 : 0.72;
    this.masterGain.gain.setTargetAtTime(target, now, 0.14);
  }

  public setDucked(nextDucked: boolean): void {
    this.ducked = nextDucked;
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const target = nextDucked ? 0.28 : 0.72;
    this.masterGain.gain.setTargetAtTime(target, now, 0.22);
  }

  public startAmbientDrone(): void {
    if (this.disposed || this.droneStarted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;
    this.droneStarted = true;

    const now = this.ctx.currentTime;
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.0001, now);
    droneGain.gain.exponentialRampToValueAtTime(0.14, now + 2.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(0.9, now);

    droneGain.connect(filter);
    filter.connect(this.masterGain);
    this.droneGain = droneGain;

    // Warm C# Sa - Pa - Sa tanpura bed (138.59 Hz, 207.65 Hz, 277.18 Hz)
    const partials: Array<{ freq: number; type: OscillatorType; level: number }> = [
      { freq: 138.59, type: 'sine', level: 0.45 },
      { freq: 207.65, type: 'triangle', level: 0.18 },
      { freq: 277.18, type: 'sine', level: 0.22 },
      { freq: 139.02, type: 'sine', level: 0.15 },
    ];

    for (const p of partials) {
      const osc = this.ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.setValueAtTime(p.freq, now);

      const partGain = this.ctx.createGain();
      partGain.gain.setValueAtTime(p.level, now);

      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.14 + Math.random() * 0.08, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(p.level * 0.16, now);

      lfo.connect(lfoGain);
      lfoGain.connect(partGain.gain);

      osc.connect(partGain);
      partGain.connect(droneGain);

      osc.start(now);
      lfo.start(now);
      this.droneNodes.push({ osc, lfo });
    }
  }

  public playTempleBell(): void {
    if (this.disposed || this.bellPlayed || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;
    this.bellPlayed = true;

    const now = this.ctx.currentTime;
    const bellBus = this.ctx.createGain();
    bellBus.gain.setValueAtTime(0.24, now);
    bellBus.connect(this.masterGain);

    // Traditional bronze temple bell overtone ratios
    const partials = [
      { ratio: 1.0, amp: 0.48, decay: 3.4 },
      { ratio: 2.0, amp: 0.26, decay: 2.6 },
      { ratio: 2.756, amp: 0.18, decay: 2.1 },
      { ratio: 4.07, amp: 0.1, decay: 1.4 },
    ];
    const fundamental = 528;

    for (const part of partials) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * part.ratio, now);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(part.amp, now + 0.014);
      env.gain.exponentialRampToValueAtTime(0.0001, now + part.decay);

      osc.connect(env);
      env.connect(bellBus);
      osc.start(now);
      osc.stop(now + part.decay + 0.05);
    }
  }

  public playConchResonance(): void {
    if (this.disposed || this.conchPlayed || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== 'running') return;
    this.conchPlayed = true;

    const now = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(340, now);
    filter.frequency.linearRampToValueAtTime(460, now + 1.1);
    filter.Q.setValueAtTime(2.2, now);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.11, now + 0.65);
    env.gain.setValueAtTime(0.1, now + 1.8);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);

    filter.connect(env);
    env.connect(this.masterGain);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(207.65, now);
    osc1.frequency.linearRampToValueAtTime(214.0, now + 0.5);
    osc1.frequency.linearRampToValueAtTime(207.65, now + 2.4);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(415.3, now);

    osc1.connect(filter);
    osc2.connect(filter);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.2);
    osc2.stop(now + 3.2);
  }

  public resetCues(): void {
    this.bellPlayed = false;
    this.conchPlayed = false;
  }

  public fadeOutAndStop(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(0.0001, now, 0.25);
  }

  public dispose(): void {
    this.disposed = true;
    for (const node of this.droneNodes) {
      try {
        node.osc.stop();
        node.lfo?.stop();
      } catch {
        // Ignore already stopped oscillators
      }
    }
    this.droneNodes = [];
    this.droneGain?.disconnect();
    this.masterGain?.disconnect();
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}
