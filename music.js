'use strict';
// Procedural music (Web Audio) — no audio files needed.
// Two tracks: a calm 'menu' loop and a driving 'game' loop, both Am - F - C - G.
const Music = (() => {
  const MUTE_KEY = 'iuBeltDashMuted';
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // MIDI notes
  const TRACKS = { menu: { bpm: 84 }, game: { bpm: 142 } };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  let ac = null, master = null, noiseBuf = null;
  let mode = 'menu', timer = null, step = 0, nextTime = 0;
  let muted = false, ducked = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  function level() { return muted ? 0 : (ducked ? 0.3 : 1); }
  function applyVolume() {
    if (master) master.gain.setTargetAtTime(level() * 0.5, ac.currentTime, 0.08);
  }

  function tone(type, midi, t, dur, vol, opts) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.value = hz(midi);
    let out = o;
    if (opts && opts.lp) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = opts.lp;
      o.connect(f); out = f;
    }
    const a = (opts && opts.attack) || 0.01;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function kick(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.2);
  }

  function hat(t) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf;
    f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.06);
  }

  function scheduleStep(s, t, spb) {
    const chord = CHORDS[Math.floor(s / 16) % 4];
    const k = s % 16;
    const sixteenth = spb / 4;
    if (mode === 'menu') {
      if (k === 0) chord.forEach((n) => tone('triangle', n, t, sixteenth * 16, 0.12, { attack: 0.4, lp: 1400 }));
      if (k === 0) tone('sine', chord[0] - 12, t, sixteenth * 16, 0.2, { attack: 0.2 });
      if (k % 2 === 0) tone('sine', chord[(k / 2) % 3] + 12, t, sixteenth * 3, 0.09, { attack: 0.02 });
    } else {
      if (k % 4 === 0) kick(t);
      if (k % 4 === 2) hat(t);
      if (k % 2 === 0) tone('sawtooth', chord[0] - 12, t, sixteenth * 1.8, 0.16, { lp: 500 });
      if (k === 0 || k === 3 || k === 6 || k === 8 || k === 11 || k === 14) {
        const idx = [0, 3, 6, 8, 11, 14].indexOf(k);
        tone('square', chord[idx % 3] + 24, t, sixteenth * 2, 0.06, { lp: 2600 });
      }
    }
  }

  function tick() {
    const spb = 60 / TRACKS[mode].bpm;
    while (nextTime < ac.currentTime + 0.2) {
      scheduleStep(step, nextTime, spb);
      nextTime += spb / 4;
      step = (step + 1) % 64;
    }
  }

  function start() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain();
        master.gain.value = level() * 0.5;
        master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      if (!timer) {
        step = 0;
        nextTime = ac.currentTime + 0.05;
        timer = setInterval(tick, 50);
      }
    } catch (e) { /* audio unavailable — game still works */ }
  }

  function setMode(m) {
    if (m === mode) return;
    mode = m;
    if (ac) { step = 0; nextTime = Math.max(nextTime, ac.currentTime + 0.05); }
  }

  function setDucked(d) {
    if (d === ducked) return;
    ducked = d;
    applyVolume();
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) {}
    applyVolume();
    const btn = document.getElementById('muteBtn');
    if (btn) {
      btn.textContent = m ? '🔇' : '🔊';
      btn.setAttribute('aria-label', m ? 'Unmute music' : 'Mute music');
      btn.setAttribute('aria-pressed', m ? 'true' : 'false');
    }
  }

  // Browsers block audio until the player interacts — start on the first gesture.
  const unlock = () => start();
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));

  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.visibilityState === 'hidden') ac.suspend();
    else ac.resume();
  });

  window.addEventListener('keydown', (e) => {
    const tag = e.target && e.target.tagName;
    if ((e.key === 'm' || e.key === 'M') && tag !== 'INPUT' && tag !== 'TEXTAREA') setMuted(!muted);
  });

  const btn = document.getElementById('muteBtn');
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); setMuted(!muted); });
  setMuted(muted);

  return { setMode, setDucked };
})();
