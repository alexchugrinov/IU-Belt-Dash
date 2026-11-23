'use strict';
// Procedural music (Web Audio) — no audio files needed.
// A calm 'menu' loop plus 12 game tracks: one per belt (training … black), one per secret
// trial, all chosen from the TRACKS table below. Level creators pick one of the 12.
const Music = (() => {
  const MUTE_KEY = 'iuBeltDashMuted';
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // chord shapes (semitones above the root)
  const SH = { M: [0, 4, 7], m: [0, 3, 7], s: [0, 5, 7], d: [0, 3, 6], 7: [0, 4, 10], m7: [0, 3, 10] };
  const ch = (root, type) => SH[type].map((i) => root + i);

  // Patterns are 16-step strings: x = hit, . = rest. Lead patterns are arrays of chord-tone
  // indexes (0,1,2 = chord tones, 3,4,5 = same an octave up), -1 = rest.
  const TRACKS = [
    { name: 'TRAINING', bpm: 100, prog: [ch(60, 'M'), ch(55, 'M'), ch(57, 'm'), ch(53, 'M')],
      kick: 'x...x...x...x...', hat: '..x...x...x...x.', bass: 'x.......x.......', bassWave: 'triangle',
      lead: { wave: 'triangle', lp: 3000, vol: 0.1, oct: 12, len: 2.2, pat: [0, -1, 1, -1, 2, -1, 1, -1, 0, -1, 2, -1, 4, -1, 2, -1] } },
    { name: 'WHITE', bpm: 112, prog: [ch(55, 'M'), ch(62, 'M'), ch(64, 'm'), ch(60, 'M')],
      kick: 'x.......x.......', hat: 'x.x.x.x.x.x.x.x.', bass: 'x...x...x...x...', bassWave: 'sine',
      pad: { wave: 'triangle', vol: 0.05 },
      lead: { wave: 'sine', lp: 4000, vol: 0.1, oct: 24, len: 2.5, pat: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 2, 1] } },
    { name: 'YELLOW', bpm: 124, prog: [ch(62, 'M'), ch(59, 'm'), ch(55, 'M'), ch(64, 'M')],
      kick: 'x...x...x...x.x.', hat: '.x.x.x.x.x.x.x.x', bass: 'x.x.x.x.x.x.x.x.', bassWave: 'square',
      lead: { wave: 'square', lp: 2800, vol: 0.06, oct: 12, len: 1.6, pat: [0, -1, 2, 3, -1, 2, 1, -1, 0, -1, 2, 4, -1, 3, 2, -1] } },
    { name: 'ORANGE', bpm: 132, prog: [ch(57, 'm'), ch(53, 'M'), ch(48, 'M'), ch(55, 'M')],
      kick: 'x...x...x...x...', hat: '..x...x...x...x.', bass: 'x.x.x.x.x.x.x.x.', bassWave: 'sawtooth',
      lead: { wave: 'square', lp: 2600, vol: 0.06, oct: 24, len: 2, pat: [0, -1, -1, 1, -1, -1, 2, -1, 0, -1, 1, -1, -1, 2, -1, -1] } },
    { name: 'GREEN', bpm: 120, prog: [ch(64, 'm'), ch(60, 'M'), ch(62, 'M'), ch(59, 'm')],
      kick: 'x.....x.x.......', hat: 'x.x.x.x.x.x.x.x.', bass: 'x..x..x.x..x..x.', bassWave: 'triangle',
      pad: { wave: 'sine', vol: 0.06 },
      lead: { wave: 'triangle', lp: 3200, vol: 0.12, oct: 12, len: 1.8, pat: [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 2, 1, 3, 2, 1] } },
    { name: 'RED', bpm: 150, prog: [ch(62, 'm'), ch(58, 'M'), ch(53, 'M'), ch(57, 'M')],
      kick: 'x..xx..xx..xx..x', hat: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...', bass: 'xxxxxxxxxxxxxxxx', bassWave: 'sawtooth',
      lead: { wave: 'sawtooth', lp: 2400, vol: 0.05, oct: 24, len: 1.4, pat: [0, 0, -1, 2, -1, 1, -1, 0, 3, 3, -1, 2, -1, 1, -1, 2] } },
    { name: 'BLUE', bpm: 128, prog: [ch(54, 'm'), ch(50, 'M'), ch(57, 'M'), ch(52, 'm')],
      kick: 'x.......x.x.....', hat: '..x...x...x...x.', snare: '....x.......x...', bass: 'x..x...x..x.....', bassWave: 'sine',
      pad: { wave: 'sawtooth', vol: 0.03, lp: 900 },
      lead: { wave: 'triangle', lp: 3000, vol: 0.12, oct: 24, len: 3, pat: [0, -1, -1, 2, -1, -1, 4, -1, 3, -1, -1, 1, -1, -1, 2, -1] } },
    { name: 'BROWN', bpm: 110, prog: [ch(48, 'm'), ch(56, 'M'), ch(53, 'm'), ch(55, 'M')],
      kick: 'x..x..x...x.x...', hat: '..x...x...x...x.', snare: '....x.......x...', bass: 'x.....x.x.....x.', bassWave: 'sawtooth',
      lead: { wave: 'square', lp: 1800, vol: 0.05, oct: 12, len: 2.5, pat: [0, -1, -1, -1, 2, -1, -1, 1, -1, -1, 0, -1, -1, -1, 2, -1] } },
    { name: 'BLACK', bpm: 160, prog: [ch(57, 'm'), ch(56, 'M'), ch(53, 'M'), ch(52, 'M')],
      kick: 'x.x.x.x.x.x.x.xx', hat: 'xxxxxxxxxxxxxxxx', snare: '....x.......x..x', bass: 'xxxxxxxxxxxxxxxx', bassWave: 'sawtooth',
      lead: { wave: 'sawtooth', lp: 3200, vol: 0.05, oct: 24, len: 1.2, pat: [0, 2, 1, 2, 0, 2, 3, 2, 0, 2, 1, 2, 4, 3, 2, 1] } },
    { name: 'CRIMSON', bpm: 168, prog: [ch(52, 'm'), ch(53, 'M'), ch(52, 'm'), ch(50, 'M')],
      kick: 'x..xx..xx..xx.x.', hat: 'x.xxx.xxx.xxx.xx', snare: '....x.......x...', bass: 'xxxxxxxxxxxxxxxx', bassWave: 'sawtooth',
      lead: { wave: 'square', lp: 3500, vol: 0.05, oct: 24, len: 1.2, pat: [0, 0, 1, 0, 2, 0, 1, 0, 3, 3, 2, 3, 1, 3, 2, 3] } },
    { name: 'VOID', bpm: 84, prog: [ch(57, 's'), ch(54, 'd'), ch(55, 's'), ch(52, 'd')],
      kick: 'x...............', hat: '................', bass: 'x...............', bassWave: 'sine',
      pad: { wave: 'sawtooth', vol: 0.035, lp: 700 },
      lead: { wave: 'sine', lp: 5000, vol: 0.1, oct: 36, len: 4, pat: [0, -1, -1, -1, -1, -1, 2, -1, -1, -1, -1, -1, 1, -1, -1, -1] } },
    { name: 'NEON', bpm: 140, prog: [ch(57, 'm'), ch(53, 'M'), ch(60, 'M'), ch(55, 'M')],
      kick: 'x...x...x...x...', hat: '.x.x.x.x.x.x.x.x', snare: '....x.......x...', bass: 'x.xxx.xxx.xxx.xx', bassWave: 'sawtooth',
      lead: { wave: 'sawtooth', lp: 3600, vol: 0.045, oct: 24, len: 0.9, pat: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 2, 3] } },
  ];
  const MENU = { name: 'MENU', bpm: 84, prog: [ch(57, 'm'), ch(53, 'M'), ch(48, 'M'), ch(55, 'M')] };

  let ac = null, master = null, noiseBuf = null;
  let track = null, timer = null, step = 0, nextTime = 0;   // track: null = menu, else TRACKS index
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

  function snare(t) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf;
    f.type = 'bandpass'; f.frequency.value = 1800;
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.1);
    tone('triangle', 52, t, 0.08, 0.2);
  }

  function scheduleMenu(s, t, spb) {
    const chord = MENU.prog[Math.floor(s / 16) % 4];
    const k = s % 16, sixteenth = spb / 4;
    if (k === 0) chord.forEach((n) => tone('triangle', n, t, sixteenth * 16, 0.12, { attack: 0.4, lp: 1400 }));
    if (k === 0) tone('sine', chord[0] - 12, t, sixteenth * 16, 0.2, { attack: 0.2 });
    if (k % 2 === 0) tone('sine', chord[(k / 2) % 3] + 12, t, sixteenth * 3, 0.09, { attack: 0.02 });
  }

  function scheduleStep(s, t, spb) {
    if (track === null) { scheduleMenu(s, t, spb); return; }
    const T = TRACKS[track];
    const chord = T.prog[Math.floor(s / 16) % 4];
    const k = s % 16, sixteenth = spb / 4;
    if (T.kick[k] === 'x') kick(t);
    if (T.hat && T.hat[k] === 'x') hat(t);
    if (T.snare && T.snare[k] === 'x') snare(t);
    if (T.bass[k] === 'x') tone(T.bassWave, chord[0] - 12, t, sixteenth * 1.9, T.bassWave === 'sine' ? 0.28 : 0.15, { lp: 500 });
    if (T.pad && k === 0) {
      chord.forEach((n) => tone(T.pad.wave, n, t, sixteenth * 16, T.pad.vol, { attack: 0.5, lp: T.pad.lp || 1500 }));
    }
    const L = T.lead, idx = L.pat[k];
    if (idx >= 0) {
      tone(L.wave, chord[idx % 3] + 12 * Math.floor(idx / 3) + L.oct, t, sixteenth * L.len, L.vol, { lp: L.lp });
    }
  }

  function tick() {
    const bpm = track === null ? MENU.bpm : TRACKS[track].bpm;
    const spb = 60 / bpm;
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

  // i = null → menu loop, otherwise an index into TRACKS
  function setTrack(i) {
    const next = (Number.isInteger(i) && i >= 0 && i < TRACKS.length) ? i : null;
    if (next === track) return;
    track = next;
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
    if ((e.key === 'm' || e.key === 'M') && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') setMuted(!muted);
  });

  const btn = document.getElementById('muteBtn');
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); setMuted(!muted); });
  setMuted(muted);

  return { setTrack, setDucked, names: TRACKS.map((t) => t.name), count: TRACKS.length };
})();
