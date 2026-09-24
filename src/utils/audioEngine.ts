/**
 * Procedural Web Audio Nature Soundscape & Singing Bowl Engine
 * Generates continuous, soothing ambient soundscapes directly in the browser
 * with 0 external bandwidth dependencies or broken mp3 links.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private activeTracks: Map<string, { gainNode: GainNode; stopFn: () => void }> = new Map();
  private volumeLevels: Map<string, number> = new Map();

  constructor() {
    // Lazy initialization on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(val: number) {
    this.initContext();
    if (this.masterGain && this.ctx) {
      const safeVal = Math.max(0, Math.min(1, val));
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : safeVal, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setTrackVolume(trackId: string, volume: number) {
    this.volumeLevels.set(trackId, volume);
    const active = this.activeTracks.get(trackId);
    if (active && this.ctx) {
      active.gainNode.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.08);
    } else if (volume > 0 && !active) {
      this.startTrack(trackId, volume);
    }
  }

  public getTrackVolume(trackId: string): number {
    return this.volumeLevels.get(trackId) ?? 0;
  }

  public isTrackPlaying(trackId: string): boolean {
    return this.activeTracks.has(trackId);
  }

  public toggleTrack(trackId: string, targetVolume: number = 0.5): boolean {
    if (this.isTrackPlaying(trackId)) {
      this.stopTrack(trackId);
      return false;
    } else {
      this.startTrack(trackId, targetVolume);
      return true;
    }
  }

  public stopAllTracks() {
    for (const [id] of this.activeTracks) {
      this.stopTrack(id);
    }
  }

  public stopTrack(trackId: string) {
    const active = this.activeTracks.get(trackId);
    if (active && this.ctx) {
      // Smooth fade out
      active.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        active.stopFn();
        this.activeTracks.delete(trackId);
        this.volumeLevels.set(trackId, 0);
      }, 150);
    }
  }

  public startTrack(trackId: string, initialVolume: number = 0.5) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.activeTracks.has(trackId)) {
      this.setTrackVolume(trackId, initialVolume);
      return;
    }

    const trackGain = this.ctx.createGain();
    trackGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    trackGain.gain.setTargetAtTime(initialVolume, this.ctx.currentTime, 0.15);
    trackGain.connect(this.masterGain);
    this.volumeLevels.set(trackId, initialVolume);

    let stopFn: () => void = () => {};

    switch (trackId) {
      case 'rain':
        stopFn = this.createRainSynthesizer(trackGain);
        break;
      case 'ocean':
        stopFn = this.createOceanSynthesizer(trackGain);
        break;
      case 'forest':
        stopFn = this.createForestSynthesizer(trackGain);
        break;
      case 'campfire':
        stopFn = this.createCampfireSynthesizer(trackGain);
        break;
      case 'singing_bowl':
        stopFn = this.createSingingBowlDroneSynthesizer(trackGain);
        break;
      case 'night':
        stopFn = this.createNightSynthesizer(trackGain);
        break;
      case 'om_drone':
        stopFn = this.createOmDroneSynthesizer(trackGain);
        break;
      default:
        stopFn = () => {};
    }

    this.activeTracks.set(trackId, { gainNode: trackGain, stopFn });
  }

  // --- Procedural Sound Generators ---

  /**
   * Rain: Filtered brown/pink noise with subtle droplet spikes
   */
  private createRainSynthesizer(output: GainNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const outputData = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      outputData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter chain for soft raindrops on leaves
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(250, this.ctx.currentTime);

    whiteNoise.connect(highpass);
    highpass.connect(filter);
    filter.connect(output);
    whiteNoise.start();

    // Occasional gentle droplet pings
    let isRunning = true;
    const dropInterval = setInterval(() => {
      if (!isRunning || !this.ctx) return;
      if (Math.random() < 0.6) {
        this.triggerRaindrop(output);
      }
    }, 350);

    return () => {
      isRunning = false;
      clearInterval(dropInterval);
      try {
        whiteNoise.stop();
        whiteNoise.disconnect();
      } catch {
        // ignore
      }
    };
  }

  private triggerRaindrop(destination: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const dropGain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    const baseFreq = 800 + Math.random() * 900;

    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.06);

    dropGain.gain.setValueAtTime(0.04 * (0.5 + Math.random() * 0.5), now);
    dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(dropGain);
    dropGain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Ocean Waves: Lowpass brown noise modulated by slow rhythmic swells (6-8s wave cycle)
   */
  private createOceanSynthesizer(output: GainNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter sweeping to emulate waves crashing & receding
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // LFO for wave period
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8s cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(280, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Secondary subtle wave swell gain
    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    const lfoVol = this.ctx.createOscillator();
    lfoVol.type = 'sine';
    lfoVol.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoVolGain = this.ctx.createGain();
    lfoVolGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    lfoVol.connect(lfoVolGain);
    lfoVolGain.connect(waveGain.gain);

    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(output);

    noise.start();
    lfo.start();
    lfoVol.start();

    return () => {
      try {
        noise.stop();
        lfo.stop();
        lfoVol.stop();
      } catch {
        // ignore
      }
    };
  }

  /**
   * Forest Wind & Leaves + Random High Bird Chirps
   */
  private createForestSynthesizer(output: GainNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(550, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Gentle wind gust modulation
    const windLFO = this.ctx.createOscillator();
    windLFO.type = 'sine';
    windLFO.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const windLFOGain = this.ctx.createGain();
    windLFOGain.gain.setValueAtTime(220, this.ctx.currentTime);

    windLFO.connect(windLFOGain);
    windLFOGain.connect(bandpass.frequency);

    noise.connect(bandpass);
    bandpass.connect(output);

    noise.start();
    windLFO.start();

    // Occasional gentle bird chirp
    let isRunning = true;
    const birdTimer = setInterval(() => {
      if (!isRunning || !this.ctx) return;
      if (Math.random() < 0.35) {
        this.triggerBirdChirp(output);
      }
    }, 4500);

    return () => {
      isRunning = false;
      clearInterval(birdTimer);
      try {
        noise.stop();
        windLFO.stop();
      } catch {
        // ignore
      }
    };
  }

  private triggerBirdChirp(dest: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const pitch = 2400 + Math.random() * 800;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.35, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Campfire: Low warm rumble + stochastic snap/pop crackle spikes
   */
  private createCampfireSynthesizer(output: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Warm low rumble
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.05 * white) / 1.05;
      last = data[i];
    }
    const rumble = this.ctx.createBufferSource();
    rumble.buffer = buffer;
    rumble.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(260, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.6, this.ctx.currentTime);

    rumble.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(output);
    rumble.start();

    // Crackle generator
    let isRunning = true;
    const crackleInterval = setInterval(() => {
      if (!isRunning || !this.ctx) return;
      if (Math.random() < 0.7) {
        const now = this.ctx.currentTime;
        const clickOsc = this.ctx.createOscillator();
        const clickFilter = this.ctx.createBiquadFilter();
        const clickGain = this.ctx.createGain();

        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(800 + Math.random() * 2200, now);

        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(1200 + Math.random() * 2400, now);
        clickFilter.Q.setValueAtTime(4, now);

        const dur = 0.005 + Math.random() * 0.015;
        clickGain.gain.setValueAtTime(0.12 * Math.random(), now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        clickOsc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(output);

        clickOsc.start(now);
        clickOsc.stop(now + dur + 0.01);
      }
    }, 120);

    return () => {
      isRunning = false;
      clearInterval(crackleInterval);
      try {
        rumble.stop();
      } catch {
        // ignore
      }
    };
  }

  /**
   * Tibetan Singing Bowl Harmonic Drone: Rich sustained overtones with slow beating
   */
  private createSingingBowlDroneSynthesizer(output: GainNode): () => void {
    if (!this.ctx) return () => {};
    const baseFreq = 216; // 432 / 2
    const harmonics = [1, 2.02, 2.99, 4.05];
    const oscs: OscillatorNode[] = [];

    harmonics.forEach((h, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const hGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h, this.ctx.currentTime);

      // Subtle vibrato/detune beating
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2 + idx * 0.07, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const amp = 0.25 / (idx + 1);
      hGain.gain.setValueAtTime(amp, this.ctx.currentTime);

      osc.connect(hGain);
      hGain.connect(output);
      osc.start();
      oscs.push(osc);
    });

    return () => {
      oscs.forEach((o) => {
        try {
          o.stop();
        } catch {
          // ignore
        }
      });
    };
  }

  /**
   * Night Meadow: Quiet crickets and evening silence
   */
  private createNightSynthesizer(output: GainNode): () => void {
    if (!this.ctx) return () => {};
    let isRunning = true;

    // Soft warm night noise bed
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    noise.connect(filter);
    filter.connect(output);
    noise.start();

    // Rhythmic cricket chirping pattern
    const cricketTimer = setInterval(() => {
      if (!isRunning || !this.ctx) return;
      if (Math.random() < 0.8) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const cGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4400, now);

        // 3 micro-pulses
        for (let p = 0; p < 3; p++) {
          const t = now + p * 0.05;
          cGain.gain.setValueAtTime(0.001, t);
          cGain.gain.linearRampToValueAtTime(0.02, t + 0.015);
          cGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        }

        osc.connect(cGain);
        cGain.connect(output);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    }, 1800);

    return () => {
      isRunning = false;
      clearInterval(cricketTimer);
      try {
        noise.stop();
      } catch {
        // ignore
      }
    };
  }

  /**
   * Om Drone (432Hz Solfeggio fundamental warmth)
   */
  private createOmDroneSynthesizer(output: GainNode): () => void {
    if (!this.ctx) return () => {};
    const fundamental = 108; // 432 / 4
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(fundamental, this.ctx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(fundamental * 2, this.ctx.currentTime);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(fundamental * 4, this.ctx.currentTime); // 432Hz

    const g1 = this.ctx.createGain();
    const g2 = this.ctx.createGain();
    const g3 = this.ctx.createGain();

    g1.gain.setValueAtTime(0.35, this.ctx.currentTime);
    g2.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g3.gain.setValueAtTime(0.12, this.ctx.currentTime);

    // Subtle detune chorus
    osc1.detune.setValueAtTime(-2, this.ctx.currentTime);
    osc2.detune.setValueAtTime(2, this.ctx.currentTime);

    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);

    g1.connect(output);
    g2.connect(output);
    g3.connect(output);

    osc1.start();
    osc2.start();
    osc3.start();

    return () => {
      try {
        osc1.stop();
        osc2.stop();
        osc3.stop();
      } catch {
        // ignore
      }
    };
  }

  /**
   * Tibetan Singing Bowl Strike
   * Plays a physical modeling gong/bowl strike with realistic transient and 8-second harmonic ringdown.
   * Perfect for meditation start, interval reminders, and session completion!
   */
  public playSingingBowl(volume: number = 0.7) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const baseFreq = 264; // C4 pure resonant bowl
    // Authentic partials of a hand-hammered Tibetan bronze bowl
    const partials = [
      { ratio: 1.0, decay: 8.0, amp: 0.6 },
      { ratio: 2.76, decay: 6.0, amp: 0.35 },
      { ratio: 5.4, decay: 4.5, amp: 0.2 },
      { ratio: 8.9, decay: 3.0, amp: 0.1 },
    ];

    const masterStrikeGain = this.ctx.createGain();
    masterStrikeGain.gain.setValueAtTime(volume * (this.isMuted ? 0 : 1), now);
    masterStrikeGain.connect(this.masterGain);

    // Initial soft mallet felt strike noise
    const strikeBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
    const strikeData = strikeBuffer.getChannelData(0);
    for (let i = 0; i < strikeData.length; i++) {
      strikeData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
    }
    const strikeSource = this.ctx.createBufferSource();
    strikeSource.buffer = strikeBuffer;
    const strikeFilter = this.ctx.createBiquadFilter();
    strikeFilter.type = 'lowpass';
    strikeFilter.frequency.setValueAtTime(600, now);
    strikeSource.connect(strikeFilter);
    strikeFilter.connect(masterStrikeGain);
    strikeSource.start(now);

    partials.forEach(({ ratio, decay, amp }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      // Micro pitch drift during strike
      osc.frequency.exponentialRampToValueAtTime(baseFreq * ratio * 0.998, now + decay);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(amp, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.00001, now + decay);

      osc.connect(g);
      g.connect(masterStrikeGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }

  /**
   * Gentle Breath Cue Chime (Subtle soft tone for breath transitions)
   */
  public playBreathCue(isExhale: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = isExhale ? 396 : 528; // 528Hz (Transformation/Inhale), 396Hz (Liberation/Exhale)
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.3);
  }
}

export const audioEngine = new SoundEngine();
