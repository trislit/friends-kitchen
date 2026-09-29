/** Soft original loop. No samples. Stays quiet under the kitchen cues. */
const MELODY = Object.freeze([0, 2, 4, 2, 3, 4, 2, 0]);
const SCALE = Object.freeze([261.63, 293.66, 329.63, 392, 440]);

export function createKitchenMusic() {
  let context = null;
  let master = null;
  let muted = false;
  let disposed = false;
  let timer = 0;
  let nextTime = 0;
  let step = 0;

  function tone(frequency, time, duration, type, level) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  function schedule() {
    if (!context || disposed || muted || context.state !== "running") return;
    const beat = 60 / 72;
    while (nextTime < context.currentTime + 0.45) {
      const degree = MELODY[step % MELODY.length];
      tone(SCALE[degree], nextTime, beat * 1.6, "triangle", 0.05);
      if (step % 4 === 0) tone(SCALE[0] / 2, nextTime, beat * 3.4, "sine", 0.035);
      step += 1;
      nextTime += beat;
    }
  }

  function arm() {
    if (timer || !context || muted || disposed) return;
    nextTime = context.currentTime + 0.08;
    schedule();
    timer = window.setInterval(schedule, 160);
  }

  return Object.freeze({
    async unlock() {
      if (disposed || muted) return false;
      const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AudioContextClass) return false;
      if (!context || context.state === "closed") {
        context = new AudioContextClass();
        master = context.createGain();
        master.gain.value = 0.35;
        master.connect(context.destination);
        step = 0;
      }
      if (context.state !== "running") {
        try {
          await context.resume();
        } catch {
          return false;
        }
      }
      if (disposed || muted || context.state !== "running") return false;
      arm();
      return true;
    },
    setMuted(next) {
      if (typeof next !== "boolean") throw new TypeError("muted must be a boolean");
      muted = next;
      if (master) master.gain.value = next ? 0 : 0.35;
      if (next && timer) {
        window.clearInterval(timer);
        timer = 0;
      } else if (!next) arm();
    },
    dispose() {
      disposed = true;
      if (timer) window.clearInterval(timer);
      timer = 0;
      const previous = context;
      context = null;
      master = null;
      if (previous) void previous.close().catch(() => {});
    },
  });
}
