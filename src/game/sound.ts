/**
 * Studio-Grade Procedural Web Audio API Synthesizer & Adaptive Soundtrack Engine for Portfolio Verse.
 * - Master Bus with Sacred Temple Hall Stereo Delay/Reverb Space & Dynamics Limiter.
 * - Calm Exploration Mode: Raga Yaman Tanpura Shruti Drone + Plucked Sitar/Veena with sympathetic Jawari resonance + Bansuri Flute vibrato + Santoor crystalline arpeggios + soft Tabla pulse.
 * - Fierce Combat / Boss Mode: Driving Sekiro/Rakshasa War-Taiko sub-drums + Tasha rim-shots + Bhairav Phrygian brass/shankha tension stabs.
 * - Tactile Foley & Combat SFX: Stereo-panned footsteps, Shinobi Shadow-Step Dash, 3-stage Katana combo harmonics, Sekiro deflect clangs, Perilous "危" attack warning stings, Player Hurt impacts, Weapon Forge anvil equip chimes, and Shinobi deathblows.
 */

export type MusicMood = 'silent' | 'calm' | 'combat';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private dryGain: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private unlocked = false;
  public muted = false;
  public currentMood: MusicMood = 'silent';
  private musicTimer: number | null = null;
  private stepIndex = 0;
  private footstepSide = 1;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlocked = true;
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted || !this.unlocked || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupMasterAcousticBus(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Builds a lush stereo temple-hall reverb/delay feedback network + gentle master compressor
   * so all synthesized instruments sound warm, organic, and commercial-game ready.
   */
  private setupMasterAcousticBus(ctx: AudioContext): void {
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, ctx.currentTime);
    compressor.knee.setValueAtTime(18, ctx.currentTime);
    compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
    compressor.attack.setValueAtTime(0.005, ctx.currentTime);
    compressor.release.setValueAtTime(0.18, ctx.currentTime);
    compressor.connect(ctx.destination);

    this.dryGain = ctx.createGain();
    this.dryGain.gain.setValueAtTime(0.92, ctx.currentTime);
    this.dryGain.connect(compressor);

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.setValueAtTime(0.32, ctx.currentTime);

    const delayL = ctx.createDelay(1.0);
    const delayR = ctx.createDelay(1.0);
    delayL.delayTime.setValueAtTime(0.19, ctx.currentTime);
    delayR.delayTime.setValueAtTime(0.27, ctx.currentTime);

    const fbL = ctx.createGain();
    const fbR = ctx.createGain();
    fbL.gain.setValueAtTime(0.38, ctx.currentTime);
    fbR.gain.setValueAtTime(0.36, ctx.currentTime);

    const dampFilter = ctx.createBiquadFilter();
    dampFilter.type = 'lowpass';
    dampFilter.frequency.setValueAtTime(2400, ctx.currentTime);

    this.reverbSend.connect(dampFilter);
    dampFilter.connect(delayL);
    dampFilter.connect(delayR);

    delayL.connect(fbL);
    fbL.connect(delayR);
    delayR.connect(fbR);
    fbR.connect(delayL);

    delayL.connect(compressor);
    delayR.connect(compressor);
  }

  private connectOutput(node: AudioNode, reverbAmount = 0.35): void {
    if (!this.ctx) return;
    if (this.dryGain) {
      node.connect(this.dryGain);
    } else {
      node.connect(this.ctx.destination);
    }
    if (this.reverbSend && reverbAmount > 0) {
      const send = this.ctx.createGain();
      send.gain.setValueAtTime(reverbAmount, this.ctx.currentTime);
      node.connect(send);
      send.connect(this.reverbSend);
    }
  }

  /**
   * Switches or maintains the adaptive background soundtrack ('calm' when exploring, 'combat' when fighting)
   */
  public setMusicMood(mood: MusicMood): void {
    if (this.muted) {
      this.stopMusicLoop();
      this.currentMood = 'silent';
      return;
    }
    if (this.currentMood === mood && this.musicTimer !== null) return;
    this.currentMood = mood;
    this.stopMusicLoop();

    if (mood === 'silent' || typeof window === 'undefined') return;

    const intervalMs = mood === 'combat' ? 195 : 640;
    this.stepIndex = 0;
    this.tickMusicPattern();
    this.musicTimer = window.setInterval(() => {
      this.tickMusicPattern();
    }, intervalMs);
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private tickMusicPattern(): void {
    if (this.muted || this.currentMood === 'silent') return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const step = this.stepIndex++;

    if (this.currentMood === 'calm') {
      // Raga Yaman (Kalyan) Scale in C: C4, D4, E4, F#4, G4, A4, B4, C5, D5, E5
      const ragaYaman = [261.63, 293.66, 329.63, 370.0, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25];
      const phrasePattern = [0, 2, 4, 3, 5, 4, 7, 6, 4, 2, 5, 7, 9, 7, 5, 4];
      const degree = phrasePattern[step % phrasePattern.length];
      const noteFreq = ragaYaman[degree % ragaYaman.length];

      // 1. Plucked Sitar / Veena with Jawari harmonic filter sweep + sympathetic Taraf shimmer
      if (step % 2 === 0 || step % 5 === 0) {
        const sitarOsc = ctx.createOscillator();
        const shimmerOsc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        sitarOsc.type = 'sawtooth';
        shimmerOsc.type = 'triangle';

        sitarOsc.frequency.setValueAtTime(noteFreq * 0.968, now);
        sitarOsc.frequency.exponentialRampToValueAtTime(noteFreq, now + 0.085);
        shimmerOsc.frequency.setValueAtTime(noteFreq * 2.0, now);

        filter.type = 'bandpass';
        filter.Q.setValueAtTime(3.0, now);
        filter.frequency.setValueAtTime(noteFreq * 4.0, now);
        filter.frequency.exponentialRampToValueAtTime(noteFreq * 1.4, now + 1.15);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.032, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0007, now + 1.5);

        sitarOsc.connect(filter);
        shimmerOsc.connect(filter);
        filter.connect(gain);
        this.connectOutput(gain, 0.58);

        sitarOsc.start(now);
        shimmerOsc.start(now);
        sitarOsc.stop(now + 1.55);
        shimmerOsc.stop(now + 1.55);
      }

      // 2. Crystalline Santoor (Hammered Dulcimer) high shimmer arpeggio on off-steps
      if (step % 3 === 1) {
        const santoorFreq = ragaYaman[(degree + 4) % ragaYaman.length] * 2;
        const santoor = ctx.createOscillator();
        const sGain = ctx.createGain();
        santoor.type = 'sine';
        santoor.frequency.setValueAtTime(santoorFreq, now);
        sGain.gain.setValueAtTime(0.015, now);
        sGain.gain.exponentialRampToValueAtTime(0.0006, now + 0.85);
        santoor.connect(sGain);
        this.connectOutput(sGain, 0.68);
        santoor.start(now);
        santoor.stop(now + 0.9);
      }

      // 3. Expressive Bansuri Bamboo Flute sustained note every 4th step
      if (step % 4 === 1) {
        const fluteFreq = ragaYaman[(degree + 2) % ragaYaman.length];
        const flute = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const fGain = ctx.createGain();
        const fFilter = ctx.createBiquadFilter();

        flute.type = 'sine';
        flute.frequency.setValueAtTime(fluteFreq * 0.985, now);
        flute.frequency.exponentialRampToValueAtTime(fluteFreq, now + 0.14);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5.4, now);
        lfoGain.gain.setValueAtTime(3.4, now);
        lfo.connect(lfoGain);
        lfoGain.connect(flute.frequency);

        fFilter.type = 'lowpass';
        fFilter.frequency.setValueAtTime(1450, now);

        fGain.gain.setValueAtTime(0.0008, now);
        fGain.gain.linearRampToValueAtTime(0.024, now + 0.36);
        fGain.gain.exponentialRampToValueAtTime(0.0006, now + 2.2);

        flute.connect(fFilter);
        fFilter.connect(fGain);
        this.connectOutput(fGain, 0.65);

        flute.start(now);
        lfo.start(now);
        flute.stop(now + 2.25);
        lfo.stop(now + 2.25);
      }

      // 4. Warm Tanpura Shruti Drone (C3 / G3 fifth) every 4 steps
      if (step % 4 === 0) {
        const droneFreq = step % 8 === 0 ? 130.81 : 196.0;
        const drone1 = ctx.createOscillator();
        const drone2 = ctx.createOscillator();
        const dFilter = ctx.createBiquadFilter();
        const dGain = ctx.createGain();

        drone1.type = 'triangle';
        drone2.type = 'sine';
        drone1.frequency.setValueAtTime(droneFreq, now);
        drone2.frequency.setValueAtTime(droneFreq * 1.501, now);

        dFilter.type = 'lowpass';
        dFilter.frequency.setValueAtTime(540, now);

        dGain.gain.setValueAtTime(0.001, now);
        dGain.gain.linearRampToValueAtTime(0.022, now + 0.65);
        dGain.gain.exponentialRampToValueAtTime(0.0008, now + 3.1);

        drone1.connect(dFilter);
        drone2.connect(dFilter);
        dFilter.connect(dGain);
        this.connectOutput(dGain, 0.52);

        drone1.start(now);
        drone2.start(now);
        drone1.stop(now + 3.2);
        drone2.stop(now + 3.2);
      }

      // 5. Soft Tabla / Bayan resonant pulse on gentle tal beats
      if (step % 4 === 2) {
        const tabla = ctx.createOscillator();
        const tGain = ctx.createGain();
        tabla.type = 'sine';
        tabla.frequency.setValueAtTime(114, now);
        tabla.frequency.exponentialRampToValueAtTime(78, now + 0.18);

        tGain.gain.setValueAtTime(0.02, now);
        tGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);

        tabla.connect(tGain);
        this.connectOutput(tGain, 0.25);
        tabla.start(now);
        tabla.stop(now + 0.24);
      }
    } else if (this.currentMood === 'combat') {
      // Fierce Sekiro / Rakshasa War-Taiko Percussion & Bhairav Stabs (8-step bar at 195ms/step)
      const beatInBar = step % 8;
      const isHeavyTaiko = beatInBar === 0 || beatInBar === 3 || beatInBar === 6;
      const isRimClack = beatInBar === 2 || beatInBar === 4 || beatInBar === 7;

      if (isHeavyTaiko) {
        const drum = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const dGain = ctx.createGain();

        drum.type = 'triangle';
        sub.type = 'sine';
        const startPitch = beatInBar === 0 ? 132 : 98;
        drum.frequency.setValueAtTime(startPitch, now);
        drum.frequency.exponentialRampToValueAtTime(32, now + 0.21);

        sub.frequency.setValueAtTime(startPitch * 0.5, now);
        sub.frequency.exponentialRampToValueAtTime(24, now + 0.23);

        dGain.gain.setValueAtTime(beatInBar === 0 ? 0.1 : 0.072, now);
        dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        drum.connect(dGain);
        sub.connect(dGain);
        this.connectOutput(dGain, 0.24);
        drum.start(now);
        sub.start(now);
        drum.stop(now + 0.25);
        sub.stop(now + 0.25);
      }

      if (isRimClack) {
        const clack = ctx.createOscillator();
        const cFilter = ctx.createBiquadFilter();
        const cGain = ctx.createGain();
        clack.type = 'square';
        clack.frequency.setValueAtTime(720 + beatInBar * 95, now);
        clack.frequency.exponentialRampToValueAtTime(195, now + 0.045);

        cFilter.type = 'bandpass';
        cFilter.frequency.setValueAtTime(980, now);

        cGain.gain.setValueAtTime(0.028, now);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        clack.connect(cFilter);
        cFilter.connect(cGain);
        this.connectOutput(cGain, 0.2);
        clack.start(now);
        clack.stop(now + 0.055);
      }

      // Fierce Bhairav / Phrygian Dominant brass & sarangi tension motif
      if (beatInBar === 0 || beatInBar === 3 || beatInBar === 6) {
        const bhairav = [130.81, 138.59, 164.81, 174.61, 196.0, 207.65, 246.94, 261.63];
        const stabFreq = bhairav[Math.floor(step / 2) % bhairav.length];
        const brass = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const bGain = ctx.createGain();

        brass.type = 'sawtooth';
        overtone.type = 'sawtooth';
        brass.frequency.setValueAtTime(stabFreq, now);
        overtone.frequency.setValueAtTime(stabFreq * 1.5, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(920, now);
        filter.frequency.exponentialRampToValueAtTime(340, now + 0.36);

        bGain.gain.setValueAtTime(0.034, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        brass.connect(filter);
        overtone.connect(filter);
        filter.connect(bGain);
        this.connectOutput(bGain, 0.4);
        brass.start(now);
        overtone.start(now);
        brass.stop(now + 0.4);
        overtone.stop(now + 0.4);
      }
    }
  }

  /**
   * Stereo-panned sandstone/meadow footstep with natural heel-toe cadence
   */
  public playFootstep(sprint = false): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    this.footstepSide *= -1;
    const pitchVar = 0.93 + Math.random() * 0.14;
    const baseFreq = (sprint ? 132 : 104) * pitchVar;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.065);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(sprint ? 520 : 410, now);

    gain.gain.setValueAtTime(sprint ? 0.055 : 0.042, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    if (panner) {
      panner.pan.setValueAtTime(this.footstepSide * 0.18, now);
      gain.connect(panner);
      this.connectOutput(panner, 0.1);
    } else {
      this.connectOutput(gain, 0.1);
    }

    osc.start(now);
    osc.stop(now + 0.075);
  }

  /**
   * Shinobi Shadow-Step Dash / Dodge whoosh + optional Perfect Dodge chime
   */
  public playDash(isPerfectDodge = false): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const wind = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    wind.type = 'sawtooth';
    wind.frequency.setValueAtTime(190, now);
    wind.frequency.exponentialRampToValueAtTime(540, now + 0.09);
    wind.frequency.exponentialRampToValueAtTime(95, now + 0.24);

    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.8, now);
    filter.frequency.setValueAtTime(640, now);

    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    wind.connect(filter);
    filter.connect(gain);
    this.connectOutput(gain, 0.3);
    wind.start(now);
    wind.stop(now + 0.26);

    if (isPerfectDodge) {
      const chime = ctx.createOscillator();
      const cGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(880, now);
      chime.frequency.exponentialRampToValueAtTime(1318.5, now + 0.22);
      cGain.gain.setValueAtTime(0.075, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      chime.connect(cGain);
      this.connectOutput(cGain, 0.5);
      chime.start(now);
      chime.stop(now + 0.28);
    }
  }

  /**
   * Jump takeoff & landing acoustic cue
   */
  public playJump(isLanding = false): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (isLanding) {
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    } else {
      osc.frequency.setValueAtTime(155, now);
      osc.frequency.exponentialRampToValueAtTime(310, now + 0.11);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    }

    osc.connect(gain);
    this.connectOutput(gain, 0.18);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Resonant brass Ghanta (Temple Bell) harmonic chime when inspecting a monument scroll
   */
  public playTempleBell(baseFreq = 432): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const partials = [1, 1.5, 2.0, 2.756, 4.1];
    const gains = [0.1, 0.06, 0.04, 0.025, 0.012];

    partials.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      const duration = 1.55 / (1 + idx * 0.42);
      gain.gain.setValueAtTime(gains[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      osc.connect(gain);
      this.connectOutput(gain, 0.55);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    });
  }

  /**
   * Ascending Veena/Sitar pentatonic arpeggio on collecting a Sacred Lotus Relic or Awakening an Astra Power
   */
  public playRelicChime(isMastery = false): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = isMastery
      ? [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 659.25]
      : [329.63, 392.0, 440.0, 523.25];

    notes.forEach((freq, i) => {
      const start = now + i * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.085, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.58);

      osc.connect(gain);
      this.connectOutput(gain, 0.5);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }

  /**
   * Metallic Vishwakarma Forge anvil ring when equipping one of the 4 Divine Weapons
   */
  public playWeaponForgeEquip(slotIndex = 1): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const base = 360 + slotIndex * 65;
    const ratios = [1, 1.498, 2.0, 3.0];

    ratios.forEach((r, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(base * r, now);
      osc.frequency.exponentialRampToValueAtTime(base * r * 1.03, now + 0.45);

      gain.gain.setValueAtTime(0.08 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.48);

      osc.connect(gain);
      this.connectOutput(gain, 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  /**
   * Sharp Sekiro "危" Perilous Attack warning cue when an Asura Demon winds up a strike
   */
  public playPerilousWarning(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    osc2.frequency.setValueAtTime(622.25, now); // tense tritone/minor second shimmer
    osc2.frequency.exponentialRampToValueAtTime(932.33, now + 0.18);

    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc1.connect(gain);
    osc2.connect(gain);
    this.connectOutput(gain, 0.42);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  /**
   * Visceral impact thud when an enemy strike hits the player
   */
  public playPlayerHurt(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.22);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    this.connectOutput(gain, 0.2);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Astra Blade / Katana Combo Slash aerodynamic whoosh + steel harmonic ring
   */
  public playAstraStrike(powerLevel = 0, isNova = false, comboStage = 1): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const steelRing = ctx.createOscillator();
    const gain = ctx.createGain();
    const ringGain = ctx.createGain();

    const comboPitchBoost = (comboStage - 1) * 58;
    const basePitch = (isNova ? 480 : 265) + powerLevel * 32 + comboPitchBoost;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.exponentialRampToValueAtTime(64, now + (isNova ? 0.35 : 0.18));

    sub.type = 'sine';
    sub.frequency.setValueAtTime(basePitch * 1.5, now);
    sub.frequency.exponentialRampToValueAtTime(120, now + (isNova ? 0.38 : 0.2));

    steelRing.type = 'sine';
    steelRing.frequency.setValueAtTime(1480 + comboStage * 220, now);
    steelRing.frequency.exponentialRampToValueAtTime(980, now + 0.16);

    gain.gain.setValueAtTime(isNova ? 0.14 : 0.095, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isNova ? 0.38 : 0.2));

    ringGain.gain.setValueAtTime(0.028, now);
    ringGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);

    osc.connect(gain);
    sub.connect(gain);
    steelRing.connect(ringGain);
    this.connectOutput(gain, 0.28);
    this.connectOutput(ringGain, 0.45);

    osc.start(now);
    sub.start(now);
    steelRing.start(now);
    osc.stop(now + (isNova ? 0.4 : 0.22));
    sub.stop(now + (isNova ? 0.4 : 0.22));
    steelRing.stop(now + 0.18);
  }

  /**
   * Crisp impact crunch when striking an Asura Demon or the September Layoff Boss
   */
  public playDemonHit(isKill = false): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isKill ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(isKill ? 220 : 165, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + (isKill ? 0.32 : 0.14));

    gain.gain.setValueAtTime(isKill ? 0.14 : 0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isKill ? 0.34 : 0.15));

    osc.connect(gain);
    this.connectOutput(gain, 0.22);
    osc.start(now);
    osc.stop(now + (isKill ? 0.35 : 0.16));
  }

  /**
   * Deep seismic Shankha & Brass horn when the September Layoff Boss awakens
   */
  public playBossAwaken(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [65.41, 98.0, 130.81, 155.56];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f * 0.96, now);
      osc.frequency.linearRampToValueAtTime(f, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(f * 0.85, now + 1.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.068, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.85);

      osc.connect(gain);
      this.connectOutput(gain, 0.55);
      osc.start(now);
      osc.stop(now + 1.9);
    });
  }

  /**
   * Crisp metallic Sekiro katana deflect clang (high-Q resonant ring + spark transient)
   */
  public playParryClang(perfect = true): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = perfect ? [1240, 1860, 2790, 3720] : [720, 1080, 1620];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'square' : 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.93, now + 0.34);

      const dur = perfect ? 0.38 / (1 + idx * 0.35) : 0.18;
      gain.gain.setValueAtTime((perfect ? 0.11 : 0.065) / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);

      osc.connect(gain);
      this.connectOutput(gain, 0.42);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    });
  }

  /**
   * Shinobi Grapple Hook launch & wind-zip whoosh
   */
  public playGrappleZip(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.42);

    gain.gain.setValueAtTime(0.095, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

    osc.connect(gain);
    this.connectOutput(gain, 0.32);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Resonant Sekiro Shinobi Deathblow chord
   */
  public playDeathblow(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [110, 220, 329.63, 659.25, 1318.5];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx < 2 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f * 1.04, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.88, now + 0.65);

      gain.gain.setValueAtTime(0.11 / (1 + idx * 0.25), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.68);

      osc.connect(gain);
      this.connectOutput(gain, 0.5);
      osc.start(now);
      osc.stop(now + 0.7);
    });
  }
}

export const sound = new SoundEngine();
