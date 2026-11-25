// Tiny synthesized sound effects: no audio files, just short oscillator blips shaped per
// action (a wooden thock for the knife, a bright ding for the service bell, a low buzz for a
// mistake). The context is created lazily on the first user gesture, as browsers require.

export function createSound() {
  let context = null;

  function ensure() {
    if (context === null) {
      try {
        context = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        context = null;
      }
    }
    if (context !== null && context.state === 'suspended') context.resume();
    return context;
  }

  function tone(freqFrom, freqTo, seconds, type, gainPeak) {
    const audio = ensure();
    if (audio === null) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), now + seconds);
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + seconds);
  }

  return {
    unlock() { ensure(); },
    chop() { tone(220, 90, 0.08, 'square', 0.12); },
    sizzle() { tone(1400, 900, 0.15, 'sawtooth', 0.03); },
    plate() { tone(520, 700, 0.07, 'triangle', 0.1); },
    ding() { tone(1320, 1320, 0.35, 'sine', 0.16); tone(1760, 1760, 0.3, 'sine', 0.08); },
    error() { tone(160, 110, 0.22, 'square', 0.1); },
    expire() { tone(420, 180, 0.3, 'triangle', 0.12); },
  };
}
