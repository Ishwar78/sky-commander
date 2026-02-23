// Web Audio API sound effects generator
class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicOsc: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicPlaying = false;
  private muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private volume = 0.7;

  setMuted(m: boolean) {
    this.muted = m;
    if (this.musicGain) {
      this.musicGain.gain.value = m ? 0 : 0.04 * this.volume;
    }
  }

  isMuted() {
    return this.muted;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.musicGain && !this.muted) {
      this.musicGain.gain.value = 0.04 * this.volume;
    }
  }

  shoot() {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  explosion() {
    if (this.muted) return;
    const ctx = this.getCtx();
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }

  powerUp() {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  hit() {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  gameOver() {
    if (this.muted) return;
    const ctx = this.getCtx();
    const notes = [440, 370, 311, 261];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  }

  startMusic() {
    if (this.musicPlaying) return;
    const ctx = this.getCtx();
    this.musicPlaying = true;

    const gain = ctx.createGain();
    gain.gain.value = this.muted ? 0 : 0.04;
    gain.connect(ctx.destination);
    this.musicGain = gain;

    const playNote = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.5, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(g).connect(gain);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    const loop = () => {
      if (!this.musicPlaying) return;
      const melody = [261, 329, 392, 523, 392, 329, 261, 196];
      melody.forEach((note, i) => playNote(note, i * 0.25, 0.22));
      setTimeout(loop, melody.length * 250);
    };
    loop();
  }

  stopMusic() {
    this.musicPlaying = false;
    this.musicGain = null;
  }
}

export const soundEngine = new SoundEngine();
