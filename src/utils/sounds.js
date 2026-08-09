const endingSoundFiles = import.meta.glob("../../sounds/**/*.mp3", {
  eager: true,
  query: "?url",
  import: "default",
});

const endingSounds = Object.entries(endingSoundFiles).reduce((groups, [path, url]) => {
  const category = path.match(/sounds\/(bad|good|neutral) end\//)?.[1];
  if (category) groups[category].push(url);
  return groups;
}, { bad: [], good: [], neutral: [] });

const failedEndings = new Set(["oxygen", "airlock", "betrayed", "bad"]);

export function getEndingSoundCategory(ending) {
  return failedEndings.has(ending) ? "bad" : ending;
}

class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambientGain = null;
    this.ambientOsc = null;
    this.endingAudio = null;
  }

  init() {
    if (typeof window === "undefined") return false;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;

    try {
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  play(type = "click") {
    if (this.muted) return;
    const method = `play${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    if (typeof this[method] === "function") this[method]();
  }

  playClick() {
    if (this.muted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playFootstep() {
    if (this.muted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playAirlock() {
    if (this.muted || !this.init()) return;
    const now = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    noise.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(now);
  }

  playAlarm() {
    if (this.muted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.25);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playPickup() {
    if (this.muted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.frequency.setValueAtTime(783.99, now + 0.16);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playEnding(ending) {
    this.stopEnding();
    if (this.muted || typeof Audio === "undefined") return;

    const choices = endingSounds[getEndingSoundCategory(ending)] ?? [];
    if (!choices.length) return;

    const url = choices[Math.floor(Math.random() * choices.length)];
    this.endingAudio = new Audio(url);
    this.endingAudio.play().catch(() => {});
  }

  stopEnding() {
    if (!this.endingAudio) return;
    this.endingAudio.pause();
    this.endingAudio.currentTime = 0;
    this.endingAudio = null;
  }

  startAmbientHum() {
    if (this.muted || this.ambientOsc || !this.init()) return;
    const now = this.ctx.currentTime;
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    this.ambientOsc.type = "sawtooth";
    this.ambientOsc.frequency.setValueAtTime(55, now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, now);
    this.ambientGain.gain.setValueAtTime(0.035, now);
    this.ambientOsc.connect(filter).connect(this.ambientGain).connect(this.ctx.destination);
    this.ambientOsc.start(now);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.muted ? 0 : 0.035, this.ctx.currentTime, 0.02);
    }
    if (this.endingAudio) this.endingAudio.muted = this.muted;
    if (!this.muted) this.startAmbientHum();
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const sounds = new SoundController();
