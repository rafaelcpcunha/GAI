// Sons sintetizados com Web Audio (motor, bipes e batida). Inicializado num gesto do usuário.

const MUTE_KEY = "estrada-neon-mudo";

export function createAudio() {
  let ac = null;
  let master, engineGain, filter, osc1, osc2;
  let muted = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    muted = false;
  }

  const volume = () => (muted ? 0 : 0.6);

  function init() {
    if (ac) {
      if (ac.state === "suspended") ac.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = volume();
    master.connect(ac.destination);

    filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    engineGain = ac.createGain();
    engineGain.gain.value = 0;
    osc1 = ac.createOscillator();
    osc1.type = "sawtooth";
    osc2 = ac.createOscillator();
    osc2.type = "square";
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(master);
    osc1.start();
    osc2.start();
  }

  function engine(pct, on) {
    if (!ac || ac.state !== "running") return;
    const t = ac.currentTime;
    const f = 45 + pct * 165;
    osc1.frequency.setTargetAtTime(f, t, 0.08);
    osc2.frequency.setTargetAtTime(f * 0.5 + 1.5, t, 0.08);
    filter.frequency.setTargetAtTime(300 + pct * 1500, t, 0.1);
    engineGain.gain.setTargetAtTime(on ? 0.07 + pct * 0.07 : 0, t, 0.15);
  }

  function tone(freq, dur, type = "square", vol = 0.12) {
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur);
  }

  function crash() {
    if (!ac) return;
    const t = ac.currentTime;
    const len = Math.floor(ac.sampleRate * 0.35);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(g);
    g.connect(master);
    src.start(t);
  }

  function setMuted(m) {
    muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* armazenamento indisponível */
    }
    if (ac) master.gain.setTargetAtTime(volume(), ac.currentTime, 0.02);
  }

  return {
    init,
    engine,
    tone,
    crash,
    setMuted,
    get muted() {
      return muted;
    },
    suspend: () => ac?.suspend(),
    resume: () => ac?.resume(),
    destroy: () => ac?.close(),
  };
}
