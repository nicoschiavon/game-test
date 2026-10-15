// Reproductor WebAudio: singleton perezoso (el contexto se crea en el primer
// gesto del usuario por la política de autoplay). Voces limitadas.

import { ARP, BASS, HAT, STEPS, stepDur } from './music';
import { SFX, canPlay } from './synth';

const MAX_VOICES = 8;

class AudioSys {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private voices = 0;
  private last: Record<string, number> = {};
  private muted = false;
  private volumes = { master: 0.8, music: 0.7, sfx: 0.8 };
  private musicTimer: number | null = null;
  private step = 0;
  private nextT = 0;

  /** Llamar desde el primer input (pointer/keydown). Idempotente. */
  unlock(): void {
    if (this.ctx || typeof window === 'undefined') return;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  get ready(): boolean {
    return this.ctx !== null;
  }

  setVolumes(master: number, music: number, sfx: number): void {
    this.volumes = { master: master / 100, music: music / 100, sfx: sfx / 100 };
    this.applyVolumes();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.applyVolumes();
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volumes.master, t);
    this.musicGain.gain.setValueAtTime(this.volumes.music, t);
    this.sfxGain.gain.setValueAtTime(this.volumes.sfx, t);
  }

  sfx(name: string): void {
    const spec = SFX[name];
    if (!spec || !this.ctx || !this.sfxGain || this.muted) return;
    const now = performance.now();
    if (!canPlay(this.last, name, now)) return;
    this.last[name] = now;
    const t0 = this.ctx.currentTime;
    for (const tone of spec.tones) this.tone(tone, t0 + (tone.delay ?? 0));
    for (const nz of spec.noises) this.noise(nz, t0 + (nz.delay ?? 0));
  }

  private tone(tone: { freq: number; end?: number; dur: number; type: OscillatorType; vol: number }, at: number): void {
    if (!this.ctx || !this.sfxGain || this.voices >= MAX_VOICES) return;
    this.voices++;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = tone.type;
    o.frequency.setValueAtTime(tone.freq, at);
    if (tone.end) o.frequency.exponentialRampToValueAtTime(Math.max(1, tone.end), at + tone.dur);
    g.gain.setValueAtTime(tone.vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + tone.dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(at);
    o.stop(at + tone.dur + 0.02);
    o.onended = () => {
      this.voices = Math.max(0, this.voices - 1);
    };
  }

  private noise(nz: { dur: number; vol: number; lowpass?: number }, at: number): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuf || this.voices >= MAX_VOICES) return;
    this.voices++;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(nz.vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + nz.dur);
    if (nz.lowpass) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = nz.lowpass;
      src.connect(f);
      f.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(this.sfxGain);
    src.start(at);
    src.stop(at + nz.dur + 0.02);
    src.onended = () => {
      this.voices = Math.max(0, this.voices - 1);
    };
  }

  musicStart(): void {
    if (!this.ctx || this.musicTimer !== null) return;
    this.step = 0;
    this.nextT = this.ctx.currentTime + 0.06;
    this.musicTimer = window.setInterval(() => this.schedule(), 40);
  }

  musicStop(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private schedule(): void {
    if (!this.ctx || !this.musicGain || this.muted) {
      if (this.ctx) this.nextT = Math.max(this.nextT, this.ctx.currentTime + 0.06);
      return;
    }
    const ahead = 0.12;
    while (this.nextT < this.ctx.currentTime + ahead) {
      const i = this.step % STEPS;
      const dur = stepDur();
      if (BASS[i] > 0) this.mnote(BASS[i], this.nextT, dur * 0.9, 'triangle', 0.5);
      if (ARP[i] > 0) this.mnote(ARP[i], this.nextT, dur * 0.8, 'square', 0.16);
      if (HAT[i]) this.mnoise(this.nextT, 0.03, 0.08);
      this.nextT += dur;
      this.step++;
    }
  }

  private mnote(freq: number, at: number, dur: number, type: OscillatorType, vol: number): void {
    if (!this.ctx || !this.musicGain || this.voices >= MAX_VOICES) return;
    this.voices++;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    o.connect(g);
    g.connect(this.musicGain);
    o.start(at);
    o.stop(at + dur + 0.02);
    o.onended = () => {
      this.voices = Math.max(0, this.voices - 1);
    };
  }

  private mnoise(at: number, dur: number, vol: number): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.musicGain);
    src.start(at);
    src.stop(at + dur + 0.02);
  }
}

export const audio = new AudioSys();
