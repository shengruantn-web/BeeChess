/**
 * Tiny Web Audio mixer. Unlock from the first tap (age-card click) so iOS
 * actually plays. Sounds are synthesized — no asset downloads.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") {
    void audio.resume();
  }
}

export function setMuted(next: boolean): void {
  muted = next;
  if (master && ctx) {
    master.gain.setTargetAtTime(next ? 0 : 0.28, ctx.currentTime, 0.02);
  }
}

export function isMuted(): boolean {
  return muted;
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType,
  gain = 0.5,
  delay = 0,
): void {
  const audio = getCtx();
  if (!audio || !master || muted) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = audio.currentTime + delay;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function noise(duration: number, gain = 0.12): void {
  const audio = getCtx();
  if (!audio || !master || muted) return;
  const length = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const src = audio.createBufferSource();
  const g = audio.createGain();
  src.buffer = buffer;
  g.gain.value = gain;
  src.connect(g);
  g.connect(master);
  src.start();
  src.onended = () => {
    src.disconnect();
    g.disconnect();
  };
}

export const sfx = {
  move() {
    noise(0.04, 0.08);
    beep(420, 0.06, "triangle", 0.22);
  },
  capture() {
    noise(0.07, 0.14);
    beep(220, 0.09, "square", 0.18);
    beep(140, 0.12, "sine", 0.2, 0.02);
  },
  check() {
    beep(660, 0.09, "square", 0.16);
    beep(880, 0.12, "triangle", 0.18, 0.08);
  },
  warn() {
    beep(240, 0.14, "sawtooth", 0.12);
    beep(180, 0.16, "sine", 0.16, 0.05);
  },
  illegal() {
    beep(110, 0.12, "square", 0.2);
  },
  win() {
    beep(523, 0.14, "triangle", 0.2);
    beep(659, 0.14, "triangle", 0.2, 0.12);
    beep(784, 0.22, "triangle", 0.22, 0.24);
  },
  lose() {
    beep(392, 0.16, "sine", 0.18);
    beep(311, 0.18, "sine", 0.16, 0.12);
    beep(247, 0.28, "triangle", 0.16, 0.24);
  },
  draw() {
    beep(440, 0.16, "triangle", 0.16);
    beep(440, 0.2, "sine", 0.12, 0.18);
  },
  ui() {
    beep(640, 0.05, "sine", 0.12);
  },
};
