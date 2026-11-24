'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const GROUND_Y = 430, PLAYER_SIZE = 34;
const CEIL_Y = 50;                 // underside of the roof — you run here when gravity is flipped
const MIRROR_Y = CEIL_Y + GROUND_Y; // y' = MIRROR_Y - y - h mirrors a box from floor to roof

const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const IS_MOBILE = IS_TOUCH && Math.min(window.innerWidth, window.innerHeight) < 900;
if (IS_MOBILE) document.body.classList.add('mobile');

// ============== Belt palette ==============
// White -> Yellow -> Orange -> Green -> Red -> Blue -> Brown -> Black
const BELTS = [
  { name: 'TRAINING', bg1:'#f8f8f8', bg2:'#e8e8e8', floor:'#c8c8c8', fg:'#1a1a1a', accent:'#7a7a7a', spike:'#333',    block:'#bbb',    glow:'#fff',    stripe:'#dcdcdc' },
  { name: 'WHITE',    bg1:'#ffffff', bg2:'#ececec', floor:'#bbbbbb', fg:'#1a1a1a', accent:'#666',    spike:'#222',    block:'#a8a8a8', glow:'#ffffff', stripe:'#d4d4d4' },
  { name: 'YELLOW',   bg1:'#f5cd2f', bg2:'#d6ad15', floor:'#8a6800', fg:'#3a2800', accent:'#7a5500', spike:'#3a2800', block:'#e8c130', glow:'#fff19a', stripe:'#b8871a' },
  { name: 'ORANGE',   bg1:'#f5b079', bg2:'#e08856', floor:'#9a4d28', fg:'#2d1100', accent:'#6a2a10', spike:'#3a1500', block:'#f0a070', glow:'#ffd5b0', stripe:'#c46a3a' },
  { name: 'GREEN',    bg1:'#5cba8a', bg2:'#3a8a60', floor:'#1f5a3a', fg:'#0a2010', accent:'#0d3d18', spike:'#062808', block:'#6acb98', glow:'#9ae0b8', stripe:'#2e7048' },
  { name: 'RED',      bg1:'#ec5826', bg2:'#c43e10', floor:'#7a2308', fg:'#2a0500', accent:'#5a1500', spike:'#1a0500', block:'#ff6e3a', glow:'#ff9870', stripe:'#a02e08' },
  { name: 'BLUE',     bg1:'#8a93cf', bg2:'#6470b0', floor:'#2c3478', fg:'#0a0e30', accent:'#1a2050', spike:'#080a20', block:'#9aa1d8', glow:'#c8cee8', stripe:'#454d8a' },
  { name: 'BROWN',    bg1:'#9b7250', bg2:'#6e4d35', floor:'#3a2418', fg:'#1a0c00', accent:'#28160c', spike:'#100806', block:'#a78562', glow:'#c69877', stripe:'#5a3e28' },
  { name: 'BLACK',    bg1:'#1a1a1a', bg2:'#000000', floor:'#660000', fg:'#ffffff', accent:'#cc0000', spike:'#cc0000', block:'#262626', glow:'#660000', stripe:'#0d0d0d' },
];

// ============== Secret trials ==============
const SECRETS = [
  {
    id: 0, name: 'CRIMSON TRIAL',
    achievementKey: 'NOVICE',
    achievementDesc: 'Reach the ORANGE belt',
    speed: 9.0, length: 13000, cpStep: 3500,
    bg1:'#5a0a0a', bg2:'#1a0000', floor:'#3a0000', fg:'#ffe0e0',
    accent:'#ff2020', spike:'#ff4040', block:'#7a1010',
    glow:'#ff8080', stripe:'#2a0000',
  },
  {
    id: 1, name: 'VOID TRIAL',
    achievementKey: 'FEARLESS',
    achievementDesc: 'Beat any belt without dying',
    speed: 9.5, length: 14500, cpStep: 4000,
    bg1:'#0a0028', bg2:'#000008', floor:'#180038', fg:'#e0d0ff',
    accent:'#a040ff', spike:'#c060ff', block:'#1a0030',
    glow:'#d090ff', stripe:'#08001a',
  },
  {
    id: 2, name: 'NEON TRIAL',
    achievementKey: 'CLIMBER',
    achievementDesc: 'Reach the BLACK belt',
    speed: 10.0, length: 16000, cpStep: 4500,
    bg1:'#001830', bg2:'#000810', floor:'#003040', fg:'#00ffff',
    accent:'#ff00aa', spike:'#ff00aa', block:'#003a60',
    glow:'#80ffff', stripe:'#001020',
  },
];

const ACHIEVEMENTS = {
  NOVICE:   { name: 'NOVICE',   desc: 'Reach the orange belt',          secretIdx: 0 },
  FEARLESS: { name: 'FEARLESS', desc: 'Beat any belt without dying',    secretIdx: 1 },
  CLIMBER:  { name: 'CLIMBER',  desc: 'Reach the black belt',           secretIdx: 2 },
};

const stats = {
  maxBeltReached: 0,
  totalDeaths: 0,
  currentBeltDeaths: 0,
  flawlessBeltAchieved: false,
  unlockedSecrets: new Set(),
  achievements: new Set(),
  savedBelt: 0,          // last campaign belt started — CONTINUE resumes here
};

// ============== Progress save (this browser only) ==============
const PROGRESS_KEY = 'iuBeltDashProgress';

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      version: 1,
      savedBelt: stats.savedBelt,
      maxBeltReached: stats.maxBeltReached,
      totalDeaths: stats.totalDeaths,
      flawlessBeltAchieved: stats.flawlessBeltAchieved,
      unlockedSecrets: [...stats.unlockedSecrets],
      achievements: [...stats.achievements],
    }));
  } catch (e) { /* storage blocked or full — game still works, just won't remember */ }
}

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
    if (!data || data.version !== 1) return;
    const beltIdx = (v) => (Number.isInteger(v) && v >= 0 && v < BELTS.length) ? v : 0;
    stats.savedBelt = beltIdx(data.savedBelt);
    stats.maxBeltReached = beltIdx(data.maxBeltReached);
    stats.totalDeaths = Number.isInteger(data.totalDeaths) && data.totalDeaths >= 0 ? data.totalDeaths : 0;
    stats.flawlessBeltAchieved = data.flawlessBeltAchieved === true;
    if (Array.isArray(data.unlockedSecrets)) {
      data.unlockedSecrets.forEach((i) => { if (Number.isInteger(i) && SECRETS[i]) stats.unlockedSecrets.add(i); });
    }
    if (Array.isArray(data.achievements)) {
      data.achievements.forEach((k) => { if (ACHIEVEMENTS[k]) stats.achievements.add(k); });
    }
  } catch (e) { /* corrupt or unreadable save — start fresh */ }
}

function resetProgress() {
  if (!window.confirm('Reset your saved belt, achievements and unlocked trials?')) return;
  try { localStorage.removeItem(PROGRESS_KEY); } catch (e) {}
  stats.savedBelt = 0;
  stats.maxBeltReached = 0;
  stats.totalDeaths = 0;
  stats.flawlessBeltAchieved = false;
  stats.unlockedSecrets.clear();
  stats.achievements.clear();
  refreshProgressUI();
  refreshTrialsUI();
}

function refreshProgressUI() {
  const btn = document.getElementById('continueBtn');
  const reset = document.getElementById('resetProgressBtn');
  const hasProgress = stats.savedBelt > 1 || stats.achievements.size > 0;
  btn.hidden = stats.savedBelt <= 1;
  document.getElementById('continueLabel').textContent = 'CONTINUE · ' + BELTS[stats.savedBelt].name + ' BELT';
  document.getElementById('playBtnLabel').textContent = stats.savedBelt > 1 ? 'NEW RUN' : 'PLAY NOW';
  reset.hidden = !hasProgress;
}

// ============== State ==============
let belt = 0;            // current campaign belt index (0 = training)
let inSecret = false;    // are we currently inside a secret level?
let secretIdx = 0;       // which secret
let secretMode = 'campaign'; // 'campaign' (5% detour) | 'direct' (from menu)
let pendingNextBelt = 1; // belt to start after a secret completes
let pendingTransition = 'BELT'; // 'BELT' | 'SECRET'
let pendingSecretIdx = 0;
let customLevelActive = false;
let activeCustomLevel = null;
let sharedCustomLevel = null;
let sharedLevelError = '';
let editorObstacles = [];
let editorTool = 'spike';
let verifyRun = null;          // signature of the level being verified right now
let verifiedSignature = null;  // signature of the last level the player beat in a verify run

let levelData = null, speed = 5, cameraX = 0;
let particles = [];
let gameState = 'menu';
let deathTimer = 0, transitionTimer = 0, frame = 0;
let attempts = 1, lastCheckpointX = 120, lastCheckpointGrav = 1;
let sessionStartTime = 0, iuTalents = 0;
let pausedDuration = 0, pauseStartTime = 0;
let levelStartTime = 0, levelPausedDuration = 0;

const player = { x: 120, y: GROUND_Y - PLAYER_SIZE, vy: 0, size: PLAYER_SIZE, onGround: true, rotation: 0, grav: 1, trail: [] };
const keys = {}; let jumpQueued = false, pointerHeld = false, flightMode = false;

// ============== Helpers ==============
function vibrate(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch(e){} } }
const VIBE = {
  jump: 8, death: [30, 60, 30, 60, 80], checkpoint: [10, 50, 10],
  belt: [40, 80, 40, 80, 100], win: [60, 100, 60, 100, 60, 100, 200],
  secret: [80, 60, 80, 60, 80, 200, 200],
  achievement: [20, 80, 20, 80, 200, 100, 200],
  pad: [12, 30, 30],
};

function getPalette() { return inSecret ? SECRETS[secretIdx] : BELTS[belt]; }

let wakeLock = null;
async function requestWakeLock() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch(e){} }
async function releaseWakeLock() { if (wakeLock) { try { await wakeLock.release(); } catch(e){} wakeLock = null; } }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && document.body.classList.contains('playing') && gameState === 'playing') requestWakeLock();
  if (document.visibilityState === 'hidden' && gameState === 'playing') pauseGame();
});

function checkOrientation() {
  const r = document.getElementById('rotate');
  if (IS_MOBILE && window.innerHeight > window.innerWidth) r.classList.add('visible');
  else r.classList.remove('visible');
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
checkOrientation();

// ============== Input ==============
window.addEventListener('keydown', (e) => {
  if (gameState === 'menu') return;
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    if (!keys[e.key] && !flightMode) jumpQueued = true;
    keys[e.key] = true;
    e.preventDefault();
  }
  if ((e.key === 'q' || e.key === 'Q') && inSecret && gameState === 'playing') abandonTrial();
  if (e.key === 'r' || e.key === 'R') {
    if (gameState === 'won' || gameState === 'won-secret' || gameState === 'won-custom') { returnToMenu(); }
    else respawn();
  }
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    if (gameState === 'playing') pauseGame();
    else if (gameState === 'paused') resumeGame();
  }
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

function tapJump(e) {
  if (gameState === 'menu' || gameState === 'paused') return;
  pointerHeld = true;
  if (!flightMode) jumpQueued = true;
  const t = (e.touches && e.touches[0]) || e;
  if (t && typeof t.clientX === 'number') {
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = t.clientX + 'px';
    r.style.top = t.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 500);
  }
}
canvas.addEventListener('mousedown', tapJump);
canvas.addEventListener('touchstart', (e) => { tapJump(e); e.preventDefault(); }, { passive: false });
window.addEventListener('mouseup', () => { pointerHeld = false; });
window.addEventListener('touchend', () => { pointerHeld = false; });
window.addEventListener('touchcancel', () => { pointerHeld = false; });

function bindBtn(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  const fire = (e) => { e.preventDefault(); e.stopPropagation(); handler(); };
  el.addEventListener('click', fire);
  el.addEventListener('touchstart', fire, { passive: false });
}

bindBtn('pauseBtn', () => { if (gameState === 'playing') pauseGame(); else if (gameState === 'paused') resumeGame(); });
bindBtn('respawnBtn', () => {
  if (gameState === 'won' || gameState === 'won-secret' || gameState === 'won-custom') returnToMenu();
  else if (gameState === 'playing' || gameState === 'dead') respawn();
});
bindBtn('resumeBtn', resumeGame);
bindBtn('restartBtn', () => {
  resumeGame();
  attempts = 1;
  if (customLevelActive && activeCustomLevel) startCustomLevel(activeCustomLevel);
  else if (inSecret) startSecretLevel(secretIdx, secretMode);
  else startLevel(belt);
});
bindBtn('abandonBtn', () => { resumeGame(); abandonTrial(); });
bindBtn('quitBtn', () => { resumeGame(); returnToMenu(); });
bindBtn('playBtnTop', () => enterGame(1));
bindBtn('playBtnBottom', () => enterGame(1));
bindBtn('continueBtn', () => enterGame(Math.max(1, stats.savedBelt)));
bindBtn('resetProgressBtn', resetProgress);

document.getElementById('createLevelBtn').addEventListener('click', openLevelEditor);
document.getElementById('closeEditorBtn').addEventListener('click', closeLevelEditor);
document.getElementById('saveDraftBtn').addEventListener('click', saveLevelDraft);
document.getElementById('publishLevelBtn').addEventListener('click', publishLevel);
document.getElementById('verifyLevelBtn').addEventListener('click', verifyLevel);
document.getElementById('undoObstacleBtn').addEventListener('click', () => {
  editorObstacles.pop();
  drawEditor();
});
document.getElementById('levelLengthInput').addEventListener('input', (e) => {
  document.getElementById('levelLengthValue').textContent = e.target.value;
  const length = Number(e.target.value);
  const before = editorObstacles.length;
  editorObstacles = editorObstacles.filter((item) => {
    const shape = EDITOR_OBSTACLES[item.type];
    return shape && item.x >= 420 && item.x + shape.w <= length - 180;
  });
  drawEditor();
  const removed = before - editorObstacles.length;
  if (removed) document.getElementById('editorStatus').textContent = 'Removed ' + removed + ' obstacle(s) that no longer fit.';
});
document.querySelectorAll('.editor-tools [data-tool]').forEach((button) => {
  button.addEventListener('click', () => {
    editorTool = button.dataset.tool;
    document.querySelectorAll('.editor-tools [data-tool]').forEach((tool) => tool.classList.toggle('selected', tool === button));
  });
});
document.getElementById('editorCanvas').addEventListener('click', placeEditorObstacle);
document.getElementById('levelEditorModal').addEventListener('click', (e) => {
  if (e.target.id === 'levelEditorModal') closeLevelEditor();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('levelEditorModal').classList.contains('open')) closeLevelEditor();
});

function enterGame(startBelt) {
  document.body.classList.add('playing');
  attempts = 1;
  inSecret = false;
  sessionStartTime = Date.now();
  pausedDuration = 0;
  iuTalents = 0;
  startLevel(startBelt || 1);
  if (IS_MOBILE) tryFullscreen();
  requestWakeLock();
  checkOrientation();
}

function returnToMenu() {
  document.body.classList.remove('playing');
  gameState = 'menu';
  inSecret = false;
  customLevelActive = false;
  activeCustomLevel = null;
  releaseWakeLock();
  exitFullscreen();
  document.getElementById('pauseOverlay').classList.remove('visible');
  refreshTrialsUI();
  refreshProgressUI();
  window.scrollTo(0, 0);
  if (verifyRun) {
    // Quit in the middle of a verify run — go back to the editor
    verifyRun = null;
    openLevelEditor();
    document.getElementById('editorStatus').textContent = 'Verification cancelled. Beat your level in one run to publish it.';
  }
}

function tryFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (req) { try { req.call(el); } catch(e){} }
  if (screen.orientation && screen.orientation.lock) {
    try { screen.orientation.lock('landscape').catch(()=>{}); } catch(e){}
  }
}
function exitFullscreen() {
  if (document.fullscreenElement) { try { document.exitFullscreen(); } catch(e){} }
  else if (document.webkitFullscreenElement) { try { document.webkitExitFullscreen(); } catch(e){} }
  if (screen.orientation && screen.orientation.unlock) { try { screen.orientation.unlock(); } catch(e){} }
}

function pauseGame() {
  if (gameState !== 'playing') return;
  gameState = 'paused';
  pauseStartTime = Date.now();
  document.getElementById('pauseTitle').textContent = inSecret ? 'TRIAL PAUSED' : 'PAUSED';
  document.getElementById('abandonBtn').classList.toggle('hidden', !inSecret);
  document.getElementById('pauseOverlay').classList.add('visible');
  releaseWakeLock();
}
function resumeGame() {
  if (gameState !== 'paused') return;
  const elapsed = Date.now() - pauseStartTime;
  pausedDuration += elapsed;
  levelPausedDuration += elapsed;
  gameState = 'playing';
  document.getElementById('pauseOverlay').classList.remove('visible');
  requestWakeLock();
}
function abandonTrial() {
  if (!inSecret) return;
  if (secretMode === 'campaign') {
    inSecret = false;
    startLevel(pendingNextBelt);
  } else {
    returnToMenu();
  }
}

// ============== Pattern bank ==============
// [name, minTier, weight] — minTier is the belt at which this pattern unlocks.
const PATTERNS = [
  ['spike1',       1, 30],
  ['block1',       1, 16],
  ['spike2',       2, 24],
  ['blockSpike',   2, 14],
  ['spike3',       3, 18],
  ['highBlock',    3, 10],
  ['pillar',       3, 14],   // NEW: tall spike (60-high triangle)
  ['spike4',       4, 12],
  ['gap',          4, 12],
  ['bigBlock',     4, 10],   // NEW: wide block 90×60
  ['doubleBlock',  5, 10],
  ['floatSpike',   5, 14],   // NEW: airborne downward spike — must NOT jump
  ['spikeOnBlock', 6, 12],
  ['jumpPad',      6, 9],    // NEW: green pad → boosted jump → tall block ahead
  ['saw',          7, 12],   // NEW: rotating circular saw (circle hitbox)
  ['staircase',    7, 8],
  ['orbGap',       5, 10],   // NEW: long spike field — tap the orange orb mid-air to jump again
  ['dashGap',      6, 9],    // NEW: very long spike field — hold on the green orb to dash across
  ['airplane',     5, 6],
  ['gravity',      4, 8],    // NEW: blue orb flips you onto the roof; mirrored patterns; blue orb back down
  // Block + spike structures
  ['blockHop',     2, 14],   // block, spike, block — hop from one block to the next
  ['spikeBlockSpike', 3, 12],// jump the spike onto a block, jump off over another spike
  ['stepTower',    3, 10],   // low block, spike, taller block
  ['wideTopSpike', 4, 11],   // wide block with a spike sitting on top
  ['lowPlatform',  4, 10],   // long low platform with a spike on it, then a ground spike
  ['blockChain',   5, 10],   // three blocks separated by spike pits
  ['spikeCeiling', 6, 9],    // hanging spikes overhead (don't jump!), then a ground spike
  ['spikeStairs',  6, 9],    // rising blocks with spikes in the gaps
  ['towerSpike',   7, 8],    // tall block with a spike on top of a lower step
];

function pickPattern(currentBelt, isSecret) {
  const tier = isSecret ? 8 : currentBelt;
  // Reduce weight of older patterns at higher tiers so new content dominates.
  let total = 0;
  const weights = [];
  for (const p of PATTERNS) {
    if (p[1] > tier) { weights.push(0); continue; }
    const fade = Math.max(0.32, 1 - (tier - p[1]) * 0.08);
    const w = p[2] * fade;
    weights.push(w);
    total += w;
  }
  let r = Math.random() * total;
  for (let i = 0; i < PATTERNS.length; i++) {
    if (weights[i] === 0) continue;
    r -= weights[i];
    if (r <= 0) return PATTERNS[i][0];
  }
  return 'spike1';
}

function mirrorObstacle(o) {
  return Object.assign({}, o, { y: MIRROR_Y - o.y - o.h, flip: !o.flip });
}

function placePattern(obstacles, x, p, d, spd = 8, tier = 8) {
  switch (p) {
    case 'spike1':
      obstacles.push({ type:'spike', x, y:GROUND_Y-30, w:30, h:30 }); return 30;
    case 'spike2':
      obstacles.push({ type:'spike', x,        y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'spike', x:x+30,   y:GROUND_Y-30, w:30, h:30 });
      return 60;
    case 'spike3':
      for (let i=0;i<3;i++) obstacles.push({ type:'spike', x:x+i*30, y:GROUND_Y-30, w:30, h:30 });
      return 90;
    case 'spike4':
      for (let i=0;i<4;i++) obstacles.push({ type:'spike', x:x+i*30, y:GROUND_Y-30, w:30, h:30 });
      return 120;
    case 'block1':
      obstacles.push({ type:'block', x, y:GROUND_Y-60, w:60, h:60 });
      return 60;
    case 'blockSpike':
      obstacles.push({ type:'block', x, y:GROUND_Y-60, w:60, h:60 });
      obstacles.push({ type:'spike', x:x+90, y:GROUND_Y-30, w:30, h:30 });
      return 120;
    case 'gap': {
      const gw = 80 + Math.floor(d * 90);
      obstacles.push({ type:'pit', x, y:GROUND_Y, w:gw, h:120 });
      return gw;
    }
    case 'highBlock':
      obstacles.push({ type:'block', x, y:GROUND_Y-90, w:60, h:90 });
      return 60;
    case 'doubleBlock':
      obstacles.push({ type:'block', x, y:GROUND_Y-60, w:60, h:60 });
      obstacles.push({ type:'spike', x:x+70,  y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'spike', x:x+100, y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+150, y:GROUND_Y-60, w:60, h:60 });
      return 210;
    case 'spikeOnBlock':
      obstacles.push({ type:'block', x, y:GROUND_Y-60, w:60, h:60 });
      obstacles.push({ type:'spike', x:x+15, y:GROUND_Y-90, w:30, h:30 });
      return 60;
    case 'staircase':
      obstacles.push({ type:'block', x,        y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+30,   y:GROUND_Y-60, w:30, h:60 });
      obstacles.push({ type:'block', x:x+60,   y:GROUND_Y-90, w:30, h:90 });
      obstacles.push({ type:'spike', x:x+105,  y:GROUND_Y-30, w:30, h:30 });
      return 135;

    // NEW PATTERNS
    case 'pillar':
      // tall single spike — same shape, double height
      obstacles.push({ type:'spike', x, y:GROUND_Y-60, w:30, h:60 });
      return 30;
    case 'bigBlock':
      obstacles.push({ type:'block', x, y:GROUND_Y-60, w:90, h:60 });
      return 90;
    case 'floatSpike':
      // ground spike forces a jump, then airborne spike threatens the apex —
      // player must jump the first one, then NOT jump again for the second
      obstacles.push({ type:'spike',  x,         y:GROUND_Y-30,  w:30, h:30 });
      // gap scales with speed so the arc always fits between the two spikes
      obstacles.push({ type:'fspike', x:x+Math.round(spd*12.5), y:GROUND_Y-100, w:30, h:30 });
      return 135;
    case 'jumpPad':
      // green pad → tall block requiring a boosted jump
      obstacles.push({ type:'pad',   x,       y:GROUND_Y-12,  w:60, h:12 });
      obstacles.push({ type:'block', x:x+250, y:GROUND_Y-130, w:60, h:130 });
      return 310;
    case 'orbGap':
      // 11 spikes is too long for one jump; orb floats mid-field
      for (let i=0;i<11;i++) obstacles.push({ type:'spike', x:x+i*30, y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'orb', x:x+165-18, y:GROUND_Y-120-18, w:36, h:36, used:false });
      return 330;
    case 'dashGap':
      // 15 spikes (450px) — too long even with an orb jump; dash straight across
      obstacles.push({ type:'dashOrb', x:x+10, y:GROUND_Y-128, w:36, h:36 });
      for (let i=0;i<15;i++) obstacles.push({ type:'spike', x:x+60+i*30, y:GROUND_Y-30, w:30, h:30 });
      return 510;
    // BLOCK + SPIKE STRUCTURES
    case 'blockHop':
      obstacles.push({ type:'block', x,        y:GROUND_Y-60, w:60, h:60 });
      obstacles.push({ type:'spike', x:x+75,   y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+120,  y:GROUND_Y-60, w:60, h:60 });
      return 180;
    case 'spikeBlockSpike': {
      // block width scales with speed so the landing spot fits the jump arc at every belt
      const bw = Math.round(spd * 17);
      obstacles.push({ type:'spike', x,             y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+45,        y:GROUND_Y-60, w:bw, h:60 });
      obstacles.push({ type:'spike', x:x+60+bw,     y:GROUND_Y-30, w:30, h:30 });
      return 90 + bw;
    }
    case 'stepTower':
      obstacles.push({ type:'block', x,        y:GROUND_Y-40, w:60, h:40 });
      obstacles.push({ type:'spike', x:x+75,   y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+120,  y:GROUND_Y-80, w:60, h:80 });
      return 180;
    case 'wideTopSpike':
      obstacles.push({ type:'block', x,        y:GROUND_Y-50, w:150, h:50 });
      obstacles.push({ type:'spike', x:x+60,   y:GROUND_Y-80, w:30, h:30 });
      return 150;
    case 'lowPlatform': {
      // platform length scales with speed: room to land, jump the top spike, land again
      const L = Math.round(spd * 32);
      const sx = Math.round(L * 0.45);
      const gx = L + Math.round(spd * 8);
      obstacles.push({ type:'block', x,        y:GROUND_Y-30, w:L, h:30 });
      obstacles.push({ type:'spike', x:x+sx,   y:GROUND_Y-60, w:30, h:30 });
      obstacles.push({ type:'spike', x:x+gx,   y:GROUND_Y-30, w:30, h:30 });
      return gx + 30;
    }
    case 'blockChain':
      obstacles.push({ type:'block', x,        y:GROUND_Y-60, w:60, h:60 });
      obstacles.push({ type:'spike', x:x+60,   y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'spike', x:x+90,   y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+120,  y:GROUND_Y-60, w:60, h:60 });
      obstacles.push({ type:'spike', x:x+180,  y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'spike', x:x+210,  y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+240,  y:GROUND_Y-60, w:60, h:60 });
      return 300;
    case 'spikeCeiling':
      for (let i=0;i<3;i++) obstacles.push({ type:'fspike', x:x+i*30, y:GROUND_Y-105, w:30, h:30 });
      obstacles.push({ type:'spike', x:x+90+Math.round(spd*14), y:GROUND_Y-30, w:30, h:30 });
      return 120 + Math.round(spd*14);
    case 'spikeStairs': {
      // step width scales with speed so each hop lands on the next step, not past it
      const sw = Math.round(spd * 12);
      obstacles.push({ type:'block', x,              y:GROUND_Y-30, w:sw, h:30 });
      obstacles.push({ type:'spike', x:x+sw,         y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+sw+30,      y:GROUND_Y-60, w:sw, h:60 });
      obstacles.push({ type:'spike', x:x+2*sw+30,    y:GROUND_Y-30, w:30, h:30 });
      obstacles.push({ type:'block', x:x+2*sw+60,    y:GROUND_Y-90, w:sw, h:90 });
      return 3 * sw + 60;
    }
    case 'towerSpike':
      obstacles.push({ type:'block', x,        y:GROUND_Y-50, w:90, h:50 });
      obstacles.push({ type:'spike', x:x+30,   y:GROUND_Y-80, w:30, h:30 });
      obstacles.push({ type:'block', x:x+90,   y:GROUND_Y-90, w:60, h:90 });
      return 150;

    case 'saw':
      // rotating saw at jump-arc height
      obstacles.push({ type:'saw', x:x+10, y:GROUND_Y-95, w:50, h:50 });
      return 70;
    case 'airplane':
      obstacles.push({ type:'portal', mode:'airplane', x, y:0, w:46, h:GROUND_Y });
      obstacles.push({ type:'block', x:x+240, y:0, w:48, h:180 });
      obstacles.push({ type:'block', x:x+240, y:300, w:48, h:GROUND_Y-300 });
      obstacles.push({ type:'block', x:x+480, y:0, w:48, h:245 });
      obstacles.push({ type:'block', x:x+480, y:365, w:48, h:GROUND_Y-365 });
      obstacles.push({ type:'block', x:x+700, y:0, w:48, h:140 });
      obstacles.push({ type:'block', x:x+700, y:280, w:48, h:GROUND_Y-280 });
      obstacles.push({ type:'portal', mode:'cube', x:x+870, y:0, w:46, h:GROUND_Y });
      return 916;
    case 'gravity': {
      // Entry: blue orb over a ground spike field too long to jump — tap it to fall UP to the roof.
      obstacles.push({ type:'gravOrb', x:x+10, y:GROUND_Y-128, w:36, h:36 });
      for (let i=0;i<13;i++) obstacles.push({ type:'spike', x:x+60+i*30, y:GROUND_Y-30, w:30, h:30 });
      // Roof: ordinary patterns, mirrored upside down.
      let cx = x + 520;
      const inner = Math.random() < 0.5 ? 1 : 2;
      for (let k = 0; k < inner; k++) {
        let pat;
        do { pat = pickPattern(tier, false); } while (pat === 'airplane' || pat === 'gravity' || pat === 'dashGap');
        const tmp = [];
        const w = placePattern(tmp, cx, pat, d, spd, tier);
        for (const o of tmp) obstacles.push(mirrorObstacle(o));
        cx += w + spd * (JUMP_AIR_FRAMES + 10);
      }
      // Exit: roof spike field — the only way out is the blue orb back down.
      obstacles.push(mirrorObstacle({ type:'gravOrb', x:cx+10, y:GROUND_Y-128, w:36, h:36 }));
      for (let i=0;i<13;i++) obstacles.push(mirrorObstacle({ type:'spike', x:cx+60+i*30, y:GROUND_Y-30, w:30, h:30 }));
      return cx + 470 - x;
    }
  }
  return 50;
}

// ============== Level generation ==============
// Patterns are placed one at a time. After each one the checker advances every possible
// player route past it; if no route survives, that pattern is swapped for another.
// Every finished level is then re-checked from the start and from every checkpoint with the
// real (un-padded) physics, and graded against its belt. Failures are regenerated.
function buildLevel(opts) {
  const MAX_TRIES = 6;
  let best = null;
  for (let t = 0; t < MAX_TRIES; t++) {
    const ld = buildLevelOnce(opts);
    if (findImpossibleSpot(ld, opts.spd) !== null) continue;   // must be beatable, always
    const grade = gradeLevel(ld, opts);
    if (grade.ok) return ld;
    if (!best || grade.score > best.grade.score) best = { ld, grade };
  }
  // Nothing hit the target exactly: use the closest beatable one (or a guaranteed-safe one).
  return best ? best.ld : buildLevelOnce(Object.assign({}, opts, { pad: 0, safeOnly: true }));
}

// Does the level's content match its belt?
//  - dense enough: few slots were skipped because no pattern fit
//  - fresh enough: from belt 3 on, a fair share of patterns are ones unlocked recently
function gradeLevel(ld, opts) {
  const st = ld.stats;
  const fill = st.slots ? st.placed / st.slots : 0;
  const recent = st.placed ? st.recent / st.placed : 0;
  const needRecent = opts.isSecret || opts.tier < 3 ? 0 : 0.25;
  const ok = fill >= 0.85 && recent >= needRecent;
  return { ok, score: fill + Math.min(recent, needRecent) };
}

function buildLevelOnce(opts) {
  // opts: { length, cpStep, tier, isSecret, minGap, d, spd, react, pad, safeOnly }
  const { length, cpStep, tier, isSecret, minGap, d, spd, react } = opts;
  const pad = opts.pad || 0;
  const stats = { placed: 0, slots: 0, recent: 0 };
  const obstacles = [], checkpoints = [];
  const ld = { obstacles, checkpoints, length, infinite: false };
  indexLevel(ld);
  const SAFE_AFTER = 360, SAFE_BEFORE = 60;
  const cpZones = [];
  for (let cx = 800; cx < length - 300; cx += cpStep) {
    cpZones.push({ x: cx, zStart: cx - SAFE_BEFORE, zEnd: cx + SAFE_AFTER });
  }
  function hitsCpZone(left, right) {
    for (const cz of cpZones) if (right > cz.zStart && left < cz.zEnd) return cz;
    return null;
  }

  let routes = frontierStart(ld, 120);
  let x = 600;
  while (x < length - 400) {
    const czPre = hitsCpZone(x, x + 320);  // upper bound on most pattern widths
    if (czPre) {
      // After a checkpoint the player may be respawning there, so restart the check from it
      routes = frontierStart(ld, czPre.x);
      x = czPre.zEnd + 50;
      continue;
    }
    let placed = false;
    stats.slots++;
    for (let attempt = 0; attempt < 8 && !placed; attempt++) {
      const pat = opts.safeOnly ? 'spike1' : pickPattern(tier, isSecret);
      const before = obstacles.length;
      const placedW = placePattern(obstacles, x, pat, d, spd, isSecret ? 8 : tier);
      for (let i = before; i < obstacles.length; i++) obstacles[i].pid = before; // pattern id
      if (hitsCpZone(x, x + placedW)) { obstacles.length = before; continue; }
      indexLevel(ld);
      // Check with the belt's leniency margin: hazards count as `pad` px bigger, so only
      // patterns that can be cleared with room to spare (not frame-perfect) are accepted.
      checkPad = pad;
      let after;
      try { after = advanceFrontier(routes, ld, spd, x + placedW + 20); }
      finally { checkPad = 0; }
      if (after.length) {
        routes = after;
        x += placedW + Math.max(minGap, patternGap(spd, react));
        placed = true;
        stats.placed++;
        if (patternTier(pat) >= tier - 2) stats.recent++;
      } else {
        obstacles.length = before;   // impossible (or too tight) from here — try another pattern
        indexLevel(ld);
      }
    }
    if (!placed) x += 120;
  }
  for (const cz of cpZones) checkpoints.push({ x: cz.x, reached: false });
  ld.stats = stats;
  return indexLevel(ld);
}

function patternTier(name) {
  const p = PATTERNS.find((q) => q[0] === name);
  return p ? p[1] : 1;
}

// Leniency margin (px) by belt: early belts demand lots of slack, later belts less.
function beltPad(b) { return Math.max(1.5, 7 - b * 0.7); }

function generateLevel(b) {
  // LONGER levels — roughly 2x the previous version
  const length = 6000 + b * 1500;
  // FEWER checkpoints — wider spacing
  const cpStep = Math.max(2000, 3000 - b * 100);
  // Spacing is measured in time, not pixels: higher belts are faster, so the same
  // pixel gap would give far less time to react. Reaction window shrinks gently per belt.
  const react = Math.max(9, 19 - b * 1.25);
  return buildLevel({
    length, cpStep, tier: b, isSecret: false, minGap: 160, d: b / 8, spd: beltSpeed(b), react,
    pad: beltPad(b),
  });
}

// One normal jump spends ~33 frames in the air (vy -14.5, gravity 0.88).
const JUMP_AIR_FRAMES = 33;

// Distance between two patterns: a full jump's length (so you can land after clearing
// the previous obstacle) plus `react` frames of ground time before the next one.
// Occasionally adds a longer breather so the rhythm isn't relentless.
function patternGap(spd, react) {
  let frames = JUMP_AIR_FRAMES + react + Math.random() * 10;
  if (Math.random() < 0.15) frames += 25;
  return spd * frames;
}

function beltSpeed(b) { return 5 + b * 0.5; }

function generateSecretLevel(idx) {
  const s = SECRETS[idx];
  return buildLevel({
    length: s.length, cpStep: s.cpStep, tier: 8, isSecret: true,
    minGap: 110, d: 1.1, spd: s.speed, react: 6, pad: 1,
  });
}

// ============== Physics (shared by the game AND the level checker) ==============
// One step = one frame. The game and the solver call the same function, so if the
// solver can beat a level, a player pressing the same inputs can too.
const DASH_FRAMES = 90;      // dash orb: max 1.5 s of straight flight (60 fps)
// Leniency margin used only by the level generator's checker. 0 during real play.
// Hazards grow by this many px, so a route the checker accepts still works if the
// player is a little early or late.
let checkPad = 0;
const BUCKET = 120;          // spatial index cell width
const NEAR = [];

function indexLevel(ld) {
  ld.obstacles.forEach((o, i) => { o.oid = i; });
  const buckets = [];
  for (const o of ld.obstacles) {
    const a = Math.floor(o.x / BUCKET), b = Math.floor((o.x + o.w) / BUCKET);
    for (let k = a; k <= b; k++) (buckets[k] || (buckets[k] = [])).push(o);
  }
  ld.buckets = buckets;
  return ld;
}

function nearby(ld, x0, x1) {
  NEAR.length = 0;
  const a = Math.floor(x0 / BUCKET), b = Math.floor(x1 / BUCKET);
  for (let k = a; k <= b; k++) {
    const bk = ld.buckets[k];
    if (bk) for (const o of bk) if (!NEAR.includes(o)) NEAR.push(o);
  }
  return NEAR;
}

function touchesCircle(s, o, shrink) {
  const cx = o.x + o.w/2, cy = o.y + o.h/2, r = Math.min(o.w, o.h)/2 - shrink;
  const closestX = Math.max(s.x, Math.min(cx, s.x + PLAYER_SIZE));
  const closestY = Math.max(s.y, Math.min(cy, s.y + PLAYER_SIZE));
  const dx = cx - closestX, dy = cy - closestY;
  return dx*dx + dy*dy <= r*r;
}

// Player state for a fresh start / respawn at x (mode = last portal passed).
function makePlayerState(ld, x, grav = 1) {
  let flight = false, lastPortalX = -Infinity;
  for (const o of ld.obstacles) {
    if (o.type === 'portal' && o.x < x && o.x > lastPortalX) { lastPortalX = o.x; flight = o.mode === 'airplane'; }
  }
  const y = flight ? GROUND_Y / 2 : (grav < 0 ? CEIL_Y : GROUND_Y - PLAYER_SIZE);
  return { x, y, vy: 0, onGround: true, flight, used: [], dash: -1, grav };
}

// Advance s by one frame. held = jump button down, tapped = pressed this frame.
// s.grav is 1 (normal) or -1 (flipped by a blue orb): every vertical rule is multiplied by it.
function stepPhysics(s, held, tapped, ld, spd) {
  const r = { dead: false, jumped: false, pad: false, orb: null, dash: null, grav: null, wasOnGround: false };
  const size = PLAYER_SIZE;
  const g = s.grav;
  if (!s.flight && s.dash < 0 && held && s.onGround) {
    s.vy = -14.5 * g; s.onGround = false; r.jumped = true;
  }
  r.wasOnGround = s.onGround;
  s.onGround = false;

  // Dash: straight flight while held, until released or 1.5 s pass
  if (s.dash >= 0 && !(held && s.dash < DASH_FRAMES)) s.dash = -1;
  if (s.dash >= 0) { s.dash++; s.vy = 0; }
  else if (s.flight) {
    // Plane: hold pushes against gravity. Flipped, release floats up and hold dives.
    s.vy += (held ? -0.72 : 1.15) * g;
    s.vy = Math.max(-8.5, Math.min(8.5, s.vy));
  } else {
    s.vy += 0.88 * g;
    s.vy = Math.max(-18, Math.min(18, s.vy));
  }
  const prevX = s.x;
  s.y += s.vy;
  s.x += spd;
  const near = nearby(ld, prevX - 4, s.x + size + 4);

  for (const o of near) {
    if (o.type !== 'portal' || prevX + size > o.x || s.x + size <= o.x) continue;
    s.flight = o.mode === 'airplane';
    s.dash = -1;
    s.onGround = false;
  }
  if (s.flight) s.y = Math.max(CEIL_Y + 4, Math.min(GROUND_Y - size - 12, s.y));

  // Floor (normal gravity) / roof (flipped) — both can have pits
  if (!s.flight && g > 0 && s.y + size >= GROUND_Y) {
    let overPit = false;
    for (const o of near) {
      if (o.type === 'pit' && !o.flip && s.x + size > o.x + 6 && s.x < o.x + o.w - 6) { overPit = true; break; }
    }
    if (!overPit) { s.y = GROUND_Y - size; s.vy = 0; s.onGround = true; }
    else if (s.y > GROUND_Y + 80) { r.dead = true; return r; }
  }
  if (!s.flight && g < 0 && s.y <= CEIL_Y) {
    let overPit = false;
    for (const o of near) {
      if (o.type === 'pit' && o.flip && s.x + size > o.x + 6 && s.x < o.x + o.w - 6) { overPit = true; break; }
    }
    if (!overPit) { s.y = CEIL_Y; s.vy = 0; s.onGround = true; }
    else if (s.y + size < CEIL_Y - 80) { r.dead = true; return r; }
  }

  // Blocks: land on the side gravity pulls you onto, die on any other side (always die in the plane)
  for (const o of near) {
    if (o.type !== 'block') continue;
    if (!(s.x < o.x + o.w && s.x + size > o.x && s.y < o.y + o.h && s.y + size > o.y)) continue;
    if (s.flight) { r.dead = true; return r; }
    if (g > 0) {
      const prevBottom = s.y + size - s.vy;
      if (s.vy >= 0 && prevBottom <= o.y + 2) { s.y = o.y - size; s.vy = 0; s.onGround = true; continue; }
    } else {
      const prevTop = s.y - s.vy;
      if (s.vy <= 0 && prevTop >= o.y + o.h - 2) { s.y = o.y + o.h; s.vy = 0; s.onGround = true; continue; }
    }
    r.dead = true; return r;
  }

  const pad = checkPad;
  // Checker only: count a near-miss of a block's front face as a crash, so block landings
  // need some height to spare instead of clipping the corner on the exact frame.
  if (pad > 0) {
    for (const o of near) {
      if (o.type !== 'block') continue;
      if (!(s.x + size <= o.x && s.x + size + pad > o.x)) continue;
      const vHit = s.flight
        ? (s.y < o.y + o.h + pad && s.y + size + pad > o.y)
        : g > 0 ? (s.y + size > o.y + pad && s.y < o.y + o.h)
                : (s.y < o.y + o.h - pad && s.y + size > o.y);
      if (vHit) { r.dead = true; return r; }
    }
  }

  for (const o of near) {
    if (o.type === 'spike' || o.type === 'fspike') {
      const pointsUp = (o.type === 'spike') !== !!o.flip;
      const sb = pointsUp
        ? { x: o.x + 5 - pad, y: o.y + 8 - pad, w: o.w - 10 + 2*pad, h: o.h - 8 + pad }
        : { x: o.x + 5 - pad, y: o.y,           w: o.w - 10 + 2*pad, h: o.h - 8 + pad };
      if (s.x < sb.x + sb.w && s.x + size > sb.x && s.y < sb.y + sb.h && s.y + size > sb.y) { r.dead = true; return r; }
    } else if (o.type === 'saw') {
      if (touchesCircle(s, o, 3 - pad)) { r.dead = true; return r; }
    }
  }

  // Jump pads launch you away from whatever surface gravity holds you to
  for (const o of near) {
    if (o.type !== 'pad') continue;
    if (s.x < o.x + o.w && s.x + size > o.x && s.y + size > o.y && s.y < o.y + o.h && s.vy * g >= -10) {
      s.vy = -22 * g; s.onGround = false; s.dash = -1; r.pad = true;
    }
  }

  for (const o of near) {
    if ((o.type !== 'orb' && o.type !== 'dashOrb' && o.type !== 'gravOrb') || s.used.includes(o.oid)) continue;
    if (s.flight && o.type !== 'gravOrb') continue;   // only the blue orb works in the plane
    if (!touchesCircle(s, o, 0)) continue;
    // Gravity orb (blue): tap while touching → gravity flips
    if (o.type === 'gravOrb' && tapped && !r.jumped) {
      s.used = s.used.concat(o.oid);
      s.grav = -g; s.vy = 4 * s.grav; s.onGround = false; s.dash = -1; r.grav = o;
      break;
    }
    // Jump orb (orange): tap while touching → full jump
    if (o.type === 'orb' && tapped && !r.jumped) {
      s.used = s.used.concat(o.oid);
      s.vy = -14.5 * g; s.onGround = false; s.dash = -1; r.orb = o;
      break;
    }
    // Dash orb (green): hold while touching → fly straight
    if (o.type === 'dashOrb' && held && s.dash < 0) {
      s.used = s.used.concat(o.oid);
      s.dash = 0; s.vy = 0; s.onGround = false; r.dash = o;
      break;
    }
  }
  return r;
}

// ============== Level checker (proves a generated level can be beaten) ==============
// Breadth-first over frames: every frame each surviving state tries "held" and "not held".
// Near-identical states are merged so the search stays small. Every kept state was really
// simulated, so a level the checker passes can truly be beaten.
const MAX_STATES = 2500;

function frontierStart(ld, x) {
  return [Object.assign(makePlayerState(ld, x), { prevHeld: false })];
}

function stepFrontier(states, ld, spd) {
  const next = new Map();
  for (const s of states) {
    for (const held of [false, true]) {
      const n = { x: s.x, y: s.y, vy: s.vy, onGround: s.onGround, flight: s.flight, used: s.used, dash: s.dash, grav: s.grav, prevHeld: held };
      if (stepPhysics(n, held, held && !s.prevHeld, ld, spd).dead) continue;
      const key = (n.flight ? Math.round(n.y / 4) : Math.round(n.y / 2)) + '|' + Math.round(n.vy) + '|' +
        (n.onGround ? 1 : 0) + (n.flight ? 1 : 0) + (held ? 1 : 0) + (n.grav < 0 ? 1 : 0) + '|' +
        (n.dash < 0 ? -1 : n.dash >> 2) + '|' + n.used.join(',');
      if (!next.has(key)) next.set(key, n);
    }
    if (next.size >= MAX_STATES) break;
  }
  return [...next.values()];
}

// Advance all states until they pass goalX. Returns [] if every route dies.
function advanceFrontier(states, ld, spd, goalX) {
  while (states.length && states[0].x < goalX) states = stepFrontier(states, ld, spd);
  return states;
}

// Can the level be beaten from every checkpoint? Returns the x where it fails, or null.
function findImpossibleSpot(ld, spd) {
  const starts = [120, ...ld.checkpoints.map((c) => c.x)];
  for (let i = 0; i < starts.length; i++) {
    const goal = i + 1 < starts.length ? starts[i + 1] : ld.length;
    let states = frontierStart(ld, starts[i]);
    while (states.length && states[0].x < goal) {
      const next = stepFrontier(states, ld, spd);
      if (!next.length) return states[0].x;
      states = next;
    }
  }
  return null;
}

// ============== Game flow ==============
function resetPlayer(x) {
  Object.assign(player, makePlayerState(levelData, x, x === lastCheckpointX ? lastCheckpointGrav : 1));
  flightMode = player.flight;
  player.rotation = 0;
  player.trail = [];
  pointerHeld = false;
  cameraX = Math.max(0, x - 280);
  particles = [];
}

function startLevel(b) {
  inSecret = false;
  customLevelActive = false;
  activeCustomLevel = null;
  belt = b;
  // Faster speed scaling with each belt
  speed = beltSpeed(b);
  levelData = generateLevel(b);
  lastCheckpointX = 120; lastCheckpointGrav = 1;
  resetPlayer(120);
  gameState = 'playing';
  attempts = 1;
  levelStartTime = Date.now(); levelPausedDuration = 0;
  stats.currentBeltDeaths = 0;
  stats.savedBelt = b;
  if (b > stats.maxBeltReached) {
    stats.maxBeltReached = b;
    checkAchievements();
  }
  saveProgress();
  updateHUD();
}

function startSecretLevel(idx, mode) {
  inSecret = true;
  customLevelActive = false;
  activeCustomLevel = null;
  secretIdx = idx;
  secretMode = mode;
  speed = SECRETS[idx].speed;
  levelData = generateSecretLevel(idx);
  lastCheckpointX = 120; lastCheckpointGrav = 1;
  resetPlayer(120);
  gameState = 'playing';
  attempts = 1;
  levelStartTime = Date.now(); levelPausedDuration = 0;
  vibrate(VIBE.secret);
  updateHUD();
}

function buildCustomObstacles(level) {
  return level.obstacles.map((item) => {
    if (item.type === 'spike') return { type: 'spike', x: item.x, y: GROUND_Y - 30, w: 30, h: 30 };
    if (item.type === 'block') return { type: 'block', x: item.x, y: GROUND_Y - 60, w: 60, h: 60 };
    if (item.type === 'pit') return { type: 'pit', x: item.x, y: GROUND_Y, w: 100, h: 120 };
    if (item.type === 'saw') return { type: 'saw', x: item.x, y: GROUND_Y - 95, w: 50, h: 50 };
    if (item.type === 'orb') return { type: 'orb', x: item.x, y: GROUND_Y - 138, w: 36, h: 36 };
    if (item.type === 'dashOrb') return { type: 'dashOrb', x: item.x, y: GROUND_Y - 118, w: 36, h: 36 };
    if (item.type === 'gravOrb') return { type: 'gravOrb', x: item.x, y: GROUND_Y - 128, w: 36, h: 36 };
    if (item.type === 'roofGravOrb') return mirrorObstacle({ type: 'gravOrb', x: item.x, y: GROUND_Y - 128, w: 36, h: 36 });
    if (item.type === 'roofSpike') return mirrorObstacle({ type: 'spike', x: item.x, y: GROUND_Y - 30, w: 30, h: 30 });
    if (item.type === 'roofBlock') return mirrorObstacle({ type: 'block', x: item.x, y: GROUND_Y - 60, w: 60, h: 60 });
    if (item.type === 'portalFly') return { type: 'portal', mode: 'airplane', x: item.x, y: 0, w: 46, h: GROUND_Y };
    if (item.type === 'portalCube') return { type: 'portal', mode: 'cube', x: item.x, y: 0, w: 46, h: GROUND_Y };
    return { type: 'pad', x: item.x, y: GROUND_Y - 12, w: 60, h: 12 };
  });
}

function startCustomLevel(level) {
  inSecret = false;
  customLevelActive = true;
  activeCustomLevel = level;
  belt = 3;
  speed = 6;
  const checkpoints = [];
  // Verification runs have no checkpoints: you must beat the level in one go
  if (!verifyRun) for (let x = 1700; x < level.length - 500; x += 1700) checkpoints.push({ x, reached: false });
  levelData = indexLevel({ obstacles: buildCustomObstacles(level), checkpoints, length: level.length, infinite: false });
  lastCheckpointX = 120; lastCheckpointGrav = 1;
  resetPlayer(120);
  gameState = 'playing';
  attempts = 1;
  levelStartTime = Date.now(); levelPausedDuration = 0;
  stats.currentBeltDeaths = 0;
  updateHUD();
}

function respawn() {
  if (gameState === 'transition' || gameState === 'won' || gameState === 'won-secret' || gameState === 'won-custom' || gameState === 'menu') return;
  attempts++;
  resetPlayer(lastCheckpointX);
  gameState = 'playing';
  updateHUD();
}

function die() {
  if (gameState !== 'playing') return;
  gameState = 'dead';
  deathTimer = 0;
  stats.totalDeaths++;
  stats.currentBeltDeaths++;
  vibrate(VIBE.death);
  const B = getPalette();
  for (let i = 0; i < 50; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * 10;
    particles.push({
      x: player.x + player.size/2, y: player.y + player.size/2,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 3,
      size: 4 + Math.random() * 7, life: 1, decay: 0.018 + Math.random() * 0.015,
      color: Math.random() < 0.5 ? B.fg : B.accent,
    });
  }
}

function advanceLevel() {
  if (customLevelActive && verifyRun) {
    // Beat the level in a verify run — it can now be published
    verifiedSignature = verifyRun;
    verifyRun = null;
    vibrate(VIBE.win);
    returnToMenu();
    openLevelEditor();
    document.getElementById('editorStatus').textContent = 'Verified! You beat your level — you can publish it now.';
    return;
  }
  if (customLevelActive) {
    gameState = 'won-custom';
    vibrate(VIBE.win);
    return;
  }
  // We just finished the current level — handle stats & determine next.
  if (inSecret) {
    // Came out of a secret level
    inSecret = false;
    if (secretMode === 'direct') {
      // Played from menu — celebrate as a "won-secret" state
      gameState = 'won-secret';
      vibrate(VIBE.win);
      return;
    } else {
      // Campaign detour — continue to the queued next belt
      pendingTransition = 'BELT';
      gameState = 'transition';
      transitionTimer = 0;
      vibrate(VIBE.belt);
      return;
    }
  }

  // Regular belt completion
  if (belt > 0) {
    if (stats.currentBeltDeaths === 0) stats.flawlessBeltAchieved = true;
    iuTalents += 1 / attempts;
    checkAchievements();
    saveProgress();
  }

  if (belt < BELTS.length - 1) {
    let nextBelt = belt + 1;
    pendingNextBelt = nextBelt;
    // 5% chance to detour into a random secret trial
    if (belt > 0 && Math.random() < 0.05) {
      pendingSecretIdx = Math.floor(Math.random() * SECRETS.length);
      pendingTransition = 'SECRET';
    } else {
      pendingTransition = 'BELT';
    }
    gameState = 'transition';
    transitionTimer = 0;
    vibrate(pendingTransition === 'SECRET' ? VIBE.secret : VIBE.belt);
  } else {
    gameState = 'won';
    vibrate(VIBE.win);
  }
}

// ============== Achievements ==============
function checkAchievements() {
  if (stats.maxBeltReached >= 3 && !stats.achievements.has('NOVICE')) {
    unlockAchievement('NOVICE');
  }
  if (stats.flawlessBeltAchieved && !stats.achievements.has('FEARLESS')) {
    unlockAchievement('FEARLESS');
  }
  if (stats.maxBeltReached >= 8 && !stats.achievements.has('CLIMBER')) {
    unlockAchievement('CLIMBER');
  }
}

function unlockAchievement(key) {
  const a = ACHIEVEMENTS[key];
  if (!a) return;
  stats.achievements.add(key);
  stats.unlockedSecrets.add(a.secretIdx);
  saveProgress();
  showAchievementBanner(key);
  refreshTrialsUI();
  vibrate(VIBE.achievement);
}

function showAchievementBanner(key) {
  const a = ACHIEVEMENTS[key];
  const s = SECRETS[a.secretIdx];
  const el = document.getElementById('achievement');
  document.getElementById('achName').textContent = a.name;
  document.getElementById('achDesc').textContent = a.desc.toUpperCase();
  document.getElementById('achTrial').textContent = s.name + ' UNLOCKED';
  el.classList.add('show');
  clearTimeout(showAchievementBanner._t);
  showAchievementBanner._t = setTimeout(() => el.classList.remove('show'), 3500);
}

// ============== Update ==============
function update() {
  frame++;
  if (gameState === 'menu' || gameState === 'paused') return;

  if (gameState === 'transition') {
    transitionTimer++;
    const dur = pendingTransition === 'SECRET' ? 110 : 75;
    if (transitionTimer > dur) {
      if (pendingTransition === 'SECRET') startSecretLevel(pendingSecretIdx, 'campaign');
      else startLevel(pendingNextBelt);
    }
    return;
  }
  if (gameState === 'won' || gameState === 'won-secret' || gameState === 'won-custom') { updateParticles(); return; }
  if (gameState === 'dead') {
    deathTimer++; updateParticles();
    if (deathTimer > 55) respawn();
    return;
  }

  const jumpHeld = keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W'] || pointerHeld || jumpQueued;
  const tapped = jumpQueued;   // fresh press this frame (orbs need a tap, not a hold)
  jumpQueued = false;

  player.flight = flightMode;
  const wasFlying = player.flight;
  const res = stepPhysics(player, jumpHeld, tapped, levelData, speed);
  flightMode = player.flight;

  if (res.jumped && IS_MOBILE) vibrate(VIBE.jump);
  if (flightMode) player.rotation = 0;
  else if (wasFlying) player.rotation = 0;
  else if (player.dash >= 0 || res.wasOnGround) {
    const target = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
    player.rotation += (target - player.rotation) * 0.4;
  } else player.rotation += 0.18 * player.grav;

  if (res.dead) { die(); return; }
  player.trail.push({ x: player.x, y: player.y, rot: player.rotation });
  if (player.trail.length > 7) player.trail.shift();
  if (res.pad) vibrate(VIBE.pad);
  if (res.orb || res.dash || res.grav) {
    const o = res.orb || res.dash || res.grav;
    const color = res.orb ? '#ff9a1f' : res.dash ? '#3dff7a' : '#4aa8ff';
    vibrate(VIBE.pad);
    for (let i = 0; i < (res.grav ? 22 : 12); i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 4;
      particles.push({ x: o.x + o.w/2, y: o.y + o.h/2, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp,
        size: 3 + Math.random()*3, life: 1, decay: 0.04, color });
    }
  }
  if (player.dash >= 0 && frame % 2 === 0) {
    particles.push({ x: player.x, y: player.y + player.size/2 + (Math.random() - 0.5) * 20,
      vx: -2 - Math.random() * 2, vy: -0.4, size: 4 + Math.random() * 3, life: 1, decay: 0.06, color: '#3dff7a' });
  }

  cameraX = player.x - 280;
  if (cameraX < 0) cameraX = 0;

  for (const cp of levelData.checkpoints) {
    if (!cp.reached && player.x > cp.x) {
      cp.reached = true;
      if (cp.x > lastCheckpointX) { lastCheckpointX = cp.x; lastCheckpointGrav = player.grav; }
      vibrate(VIBE.checkpoint);
      const B = getPalette();
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 6;
        particles.push({
          x: cp.x, y: GROUND_Y - 70,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 3,
          size: 3 + Math.random() * 4, life: 1, decay: 0.025,
          color: B.accent,
        });
      }
    }
  }

  updateParticles();
  if (!levelData.infinite && player.x >= levelData.length) advanceLevel();
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.4; p.life -= p.decay;
  }
  particles = particles.filter(p => p.life > 0);
}

// ============== Colour helpers ==============
const colorCache = new Map();
function rgbOf(c) {
  if (c[0] !== '#') return c.match(/\d+/g).slice(0, 3).map(Number);   // 'rgb(r,g,b)' from mix()
  let h = c.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(a, b, t) {
  const key = a + '|' + b + '|' + t;
  let v = colorCache.get(key);
  if (!v) {
    const A = rgbOf(a), Z = rgbOf(b);
    v = 'rgb(' + A.map((x, i) => Math.round(x + (Z[i] - x) * t)).join(',') + ')';
    colorCache.set(key, v);
  }
  return v;
}
const lighten = (c, t) => mix(c, '#ffffff', t);
const darken  = (c, t) => mix(c, '#000000', t);
function rgba(c, a) {
  const key = c + '@' + a;
  let v = colorCache.get(key);
  if (!v) { v = 'rgba(' + rgbOf(c).join(',') + ',' + a + ')'; colorCache.set(key, v); }
  return v;
}
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

// ============== Textures (each belt / trial has its own look) ==============
// Floor, background wall and blocks are filled with a repeating 64px tile drawn once
// per belt and cached. Colours come from the belt palette, the pattern from the style.
const BELT_TEXTURES   = ['mats', 'tatami', 'bricks', 'planks', 'scales', 'stone', 'diamond', 'bamboo', 'metal'];
const SECRET_TEXTURES = ['cracks', 'stars', 'circuit'];
const TEX = 64;
const textureCache = new Map();

function currentTextureStyle() {
  return inSecret ? SECRET_TEXTURES[secretIdx] : BELT_TEXTURES[belt];
}

function getTexture(kind) {
  const B = getPalette();
  const style = currentTextureStyle();
  const key = style + '|' + kind + '|' + B.name;
  let pat = textureCache.get(key);
  if (pat) return pat;
  const c = document.createElement('canvas');
  c.width = c.height = TEX;
  const g = c.getContext('2d');
  if (kind === 'floor' || kind === 'block') {
    const base = kind === 'floor' ? B.floor : B.block;
    // soft diagonal shading so the tile isn't a flat colour
    const lg = g.createLinearGradient(0, 0, TEX, TEX);
    lg.addColorStop(0, lighten(base, 0.07));
    lg.addColorStop(1, darken(base, 0.07));
    g.fillStyle = lg;
    g.fillRect(0, 0, TEX, TEX);
    speckle(g, B.fg, B.glow, kind === 'floor' ? 11 : 23);
  }
  paintTexture(g, style, B.fg, kind === 'floor' ? B.accent : B.glow);
  pat = ctx.createPattern(c, 'repeat');
  textureCache.set(key, pat);
  return pat;
}

// Fine grain: tiny dark and light flecks, seeded so every tile is identical (seamless).
function speckle(g, ink, hi, seed) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 110; i++) {
    g.globalAlpha = 0.04 + rnd() * 0.08;
    g.fillStyle = rnd() < 0.55 ? ink : hi;
    const sz = 1 + Math.floor(rnd() * 2);
    g.fillRect(Math.floor(rnd() * TEX), Math.floor(rnd() * TEX), sz, sz);
  }
  g.globalAlpha = 1;
}

function paintTexture(g, style, ink, hi) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const line = (pts, color, width, alpha) => {
    g.strokeStyle = color; g.lineWidth = width; g.globalAlpha = alpha;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  };
  const box = (x, y, w, h, color, width, alpha) => {
    g.strokeStyle = color; g.lineWidth = width; g.globalAlpha = alpha; g.strokeRect(x, y, w, h);
  };
  const dot = (x, y, r, color, alpha) => {
    g.fillStyle = color; g.globalAlpha = alpha; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  // bevelled panel: light top/left edge, dark bottom/right edge
  const panel = (x, y, w, h, alpha) => {
    line([[x, y + h], [x, y], [x + w, y]], hi, 1.5, alpha);
    line([[x + w, y], [x + w, y + h], [x, y + h]], ink, 1.5, alpha * 1.2);
  };
  switch (style) {
    case 'mats':      // training dojo mats
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        panel(i * 32 + 2, j * 32 + 2, 28, 28, 0.3);
        box(i * 32 + 6, j * 32 + 6, 20, 20, ink, 1, 0.12);
        dot(i * 32 + 16, j * 32 + 16, 3, hi, 0.45);
      }
      break;
    case 'tatami':    // woven straw mats
      panel(1, 1, 62, 30, 0.35);
      panel(1, 33, 30, 30, 0.35);
      panel(33, 33, 30, 30, 0.35);
      for (let y = 5; y < 30; y += 3) line([[3, y], [61, y]], y % 6 ? ink : hi, 1, 0.12);
      for (let x = 5; x < 64; x += 3) if (x < 30 || x > 34) line([[x, 35], [x, 61]], x % 6 ? ink : hi, 1, 0.12);
      line([[1, 1], [63, 1]], ink, 3, 0.25);
      break;
    case 'bricks':
      for (let r = 0; r < 4; r++) {
        const off = r % 2 ? 16 : 0;
        for (let bx = -32; bx < 64; bx += 32) {
          panel(bx + off + 1, r * 16 + 1, 30, 14, 0.35);
          line([[bx + off + 4, r * 16 + 4], [bx + off + 20, r * 16 + 4]], hi, 2, 0.3);
          dot(bx + off + 24, r * 16 + 10, 1, ink, 0.35);
        }
      }
      break;
    case 'planks':    // wooden floorboards
      for (let r = 0; r < 4; r++) {
        line([[0, r * 16], [64, r * 16]], ink, 2, 0.4);
        line([[0, r * 16 + 1.5], [64, r * 16 + 1.5]], hi, 1, 0.25);
        const seam = (r * 23) % 64;
        line([[seam, r * 16], [seam, r * 16 + 16]], ink, 2, 0.35);
        dot(seam + 4, r * 16 + 4, 1.5, ink, 0.55);
        dot(seam - 4, r * 16 + 12, 1.5, ink, 0.55);
        for (let k = 0; k < 2; k++) {
          const y = r * 16 + 5 + k * 6;
          line([[0, y], [20, y + 1], [40, y - 1], [64, y]], hi, 1, 0.25);
        }
        g.strokeStyle = ink; g.globalAlpha = 0.25; g.lineWidth = 1;   // knot
        g.beginPath(); g.ellipse((seam + 32) % 64, r * 16 + 8, 3, 1.6, 0, 0, Math.PI * 2); g.stroke();
      }
      break;
    case 'scales':    // jade scales
      for (let r = 0; r < 5; r++) {
        const off = r % 2 ? 16 : 0;
        for (let cx = -32; cx <= 96; cx += 32) {
          g.strokeStyle = ink; g.lineWidth = 2; g.globalAlpha = 0.32;
          g.beginPath(); g.arc(cx + off, r * 16, 16, 0, Math.PI); g.stroke();
          g.strokeStyle = hi; g.lineWidth = 1.5; g.globalAlpha = 0.35;
          g.beginPath(); g.arc(cx + off, r * 16, 11, 0.3, Math.PI - 0.3); g.stroke();
          dot(cx + off, r * 16 + 7, 1.5, hi, 0.35);
        }
      }
      break;
    case 'stone':     // cobblestones
      [[1, 1, 26, 18], [29, 1, 34, 22], [1, 21, 18, 22], [21, 25, 24, 18], [47, 25, 16, 20], [1, 45, 28, 18], [31, 45, 32, 18]]
        .forEach(([x, y, w, h]) => {
          g.globalAlpha = 0.12; g.fillStyle = hi;
          g.beginPath();
          if (g.roundRect) g.roundRect(x + 2, y + 2, w - 4, h / 2, 4); else g.rect(x + 2, y + 2, w - 4, h / 2);
          g.fill();
          g.globalAlpha = 0.35; g.strokeStyle = ink; g.lineWidth = 2;
          g.beginPath();
          if (g.roundRect) g.roundRect(x, y, w, h, 5); else g.rect(x, y, w, h);
          g.stroke();
          line([[x + 4, y + 3], [x + w - 6, y + 3]], hi, 2, 0.3);
        });
      break;
    case 'diamond':   // diagonal lattice
      for (let k = -64; k <= 64; k += 16) {
        line([[k, 0], [k + 64, 64]], ink, 1.5, 0.28);
        line([[k + 1, 0], [k + 65, 64]], hi, 1, 0.12);
        line([[k, 64], [k + 64, 0]], ink, 1.5, 0.28);
      }
      for (let x = 0; x <= 64; x += 16) for (let y = 0; y <= 64; y += 16) if ((x + y) % 32 === 0) {
        dot(x, y, 2.5, hi, 0.55); dot(x, y, 1, ink, 0.5);
      }
      break;
    case 'bamboo':
      for (let i = 0; i < 4; i++) {
        const x = i * 16;
        line([[x + 1, 0], [x + 1, 64]], ink, 2, 0.4);
        line([[x + 5, 0], [x + 5, 64]], hi, 2.5, 0.22);
        line([[x + 12, 0], [x + 12, 64]], ink, 1, 0.15);
        const ny = (i * 21 + 9) % 64;
        line([[x + 1, ny], [x + 15, ny]], ink, 3, 0.4);
        line([[x + 2, ny + 3], [x + 14, ny + 3]], hi, 1, 0.4);
        line([[x + 10, ny - 2], [x + 15, ny - 8]], ink, 1, 0.25);   // leaf scar
      }
      break;
    case 'metal':     // riveted steel plates
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const x = i * 32, y = j * 32;
        panel(x + 1, y + 1, 30, 30, 0.4);
        [[5, 5], [27, 5], [5, 27], [27, 27]].forEach(([dx, dy]) => { dot(x + dx, y + dy, 2.2, hi, 0.65); dot(x + dx + 0.6, y + dy + 0.6, 1, ink, 0.5); });
        line([[x + 8, y + 24], [x + 24, y + 8]], hi, 1, 0.22);
        line([[x + 11, y + 24], [x + 24, y + 11]], hi, 1, 0.12);
      }
      break;
    case 'cracks':    // glowing lava cracks
      [[[0, 10], [14, 18], [22, 12], [40, 26], [64, 10]],
       [[10, 64], [18, 44], [34, 40], [38, 26]],
       [[48, 64], [52, 48], [64, 44]],
       [[0, 44], [8, 40], [18, 44]]]
        .forEach((pts) => { line(pts, hi, 6, 0.1); line(pts, hi, 3, 0.2); line(pts, hi, 1.2, 0.7); });
      break;
    case 'stars':     // void starfield
      for (let i = 0; i < 16; i++) {
        const x = rnd() * 64, y = rnd() * 64, r = 0.6 + rnd() * 1.4;
        dot(x, y, r * 2.2, hi, 0.08);
        dot(x, y, r, hi, 0.4 + rnd() * 0.5);
      }
      line([[44, 14], [52, 14]], hi, 1, 0.6); line([[48, 10], [48, 18]], hi, 1, 0.6);
      break;
    case 'circuit':   // neon circuit traces
      [[[0, 12], [20, 12], [28, 20], [28, 40], [64, 40]],
       [[40, 0], [40, 24], [64, 24]],
       [[0, 52], [16, 52], [16, 64]],
       [[48, 64], [48, 54], [56, 46]]]
        .forEach((pts) => {
          line(pts, hi, 5, 0.1); line(pts, hi, 2, 0.5);
          const p = pts[pts.length - 1]; dot(p[0], p[1], 3, hi, 0.75); dot(p[0], p[1], 1.2, ink, 0.6);
        });
      dot(28, 30, 3, hi, 0.6);
      box(34, 46, 10, 10, hi, 1.5, 0.35);
      break;
  }
  g.globalAlpha = 1;
}

// ============== Drawing ==============
let vignette = null;

function draw() {
  if (!levelData) {
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const B = getPalette();

  drawBackground(B);

  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const o of levelData.obstacles) {
    if (o.type === 'pit') continue;
    if (o.x + o.w < cameraX - 80) continue;
    if (o.x > cameraX + W + 80) continue;
    drawObstacle(o, B);
  }
  for (const cp of levelData.checkpoints) {
    if (cp.x < cameraX - 100) continue;
    if (cp.x > cameraX + W + 100) continue;
    drawCheckpoint(cp, B);
  }

  ctx.globalAlpha = 1;
  if (gameState === 'playing' || gameState === 'transition' || gameState === 'paused') drawPlayer(B);

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    const s = p.size * (0.5 + p.life * 0.5);
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  drawSurface(B, false);
  drawSurface(B, true);

  if (!levelData.infinite) {
    const ex = levelData.length - cameraX;
    if (ex > -20 && ex < W + 80) {
      ctx.save();
      const pulse = 0.5 + Math.sin(frame * 0.1) * 0.5;
      const fg = ctx.createLinearGradient(ex - 60, 0, ex, 0);
      fg.addColorStop(0, rgba(B.glow, 0));
      fg.addColorStop(1, rgba(B.glow, 0.35 + pulse * 0.25));
      ctx.fillStyle = fg;
      ctx.fillRect(ex - 60, CEIL_Y, 60, GROUND_Y - CEIL_Y);
      // checkered finish banner
      for (let y = CEIL_Y; y < GROUND_Y; y += 12) {
        for (let c = 0; c < 2; c++) {
          ctx.fillStyle = ((y / 12 + c) % 2 < 1) ? B.fg : B.accent;
          ctx.fillRect(ex + c * 6, y, 6, 12);
        }
      }
      ctx.restore();
    }
  }

  if (!vignette) {
    vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
  }
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  if (gameState === 'dead')         drawDeathOverlay();
  if (gameState === 'transition')   drawTransitionOverlay();
  if (gameState === 'won')          drawWonOverlay();
  if (gameState === 'won-secret')   drawSecretWonOverlay();
  if (gameState === 'won-custom')   drawCustomWonOverlay();
}

function drawBackground(B) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, B.bg1);
  grad.addColorStop(0.7, B.bg2);
  grad.addColorStop(1, darken(B.bg2, 0.12));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, GROUND_Y);

  // soft sun / lantern glow behind the belt emblem
  const sun = ctx.createRadialGradient(W * 0.78, 150, 8, W * 0.78, 150, 300);
  sun.addColorStop(0, rgba(B.glow, 0.4));
  sun.addColorStop(1, rgba(B.glow, 0));
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, GROUND_Y);

  // Background wall texture (slow parallax)
  ctx.save();
  ctx.translate(-((cameraX * 0.25) % TEX), 0);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = getTexture('wall');
  ctx.fillRect(0, 0, W + TEX, GROUND_Y);
  ctx.globalAlpha = 1;
  ctx.restore();

  drawBeltMotif(B);
  drawPeaks(0.06, 180, 130, GROUND_Y - 60, mix(B.bg2, B.fg, 0.1), lighten(mix(B.bg2, B.fg, 0.1), 0.25), 11);
  drawDojos(0.2, 260, GROUND_Y, mix(B.bg2, B.fg, 0.2), B.glow, 37);

  // haze where the scenery meets the floor
  const haze = ctx.createLinearGradient(0, GROUND_Y - 70, 0, GROUND_Y);
  haze.addColorStop(0, rgba(B.bg2, 0));
  haze.addColorStop(1, rgba(B.bg2, 0.55));
  ctx.fillStyle = haze;
  ctx.fillRect(0, GROUND_Y - 70, W, 70);
}

// Far mountain range with snow caps, scrolling very slowly.
function drawPeaks(par, seg, amp, baseY, color, capColor, seed) {
  const off = cameraX * par;
  const i0 = Math.floor(off / seg) - 1, i1 = i0 + Math.ceil(W / seg) + 2;
  const peaks = [];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-20, GROUND_Y);
  for (let i = i0; i <= i1; i++) {
    const x = i * seg - off, py = baseY - amp * (0.35 + hash(i + seed) * 0.65);
    ctx.lineTo(x, py);
    ctx.lineTo(x + seg / 2, baseY - amp * hash(i + seed + 0.5) * 0.3);
    peaks.push([x, py]);
  }
  ctx.lineTo(W + 20, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = capColor;
  ctx.globalAlpha = 0.6;
  for (const [x, py] of peaks) {
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x - seg * 0.12, py + 22);
    ctx.lineTo(x - seg * 0.03, py + 16);
    ctx.lineTo(x + seg * 0.05, py + 24);
    ctx.lineTo(x + seg * 0.11, py + 18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Nearer row of dojo / pagoda silhouettes with lit windows.
function drawDojos(par, seg, baseY, color, light, seed) {
  const off = cameraX * par;
  const i0 = Math.floor(off / seg) - 1, i1 = i0 + Math.ceil(W / seg) + 2;
  for (let i = i0; i <= i1; i++) {
    const r = hash(i + seed);
    if (r < 0.3) continue;
    const w = 70 + r * 60, h = 40 + hash(i + seed + 7) * 60;
    const x = i * seg - off + hash(i + seed + 3) * (seg - w - 30);
    let top = baseY - h;
    ctx.fillStyle = color;
    ctx.fillRect(x, top, w, h);
    const roof = (rx, ry, rw) => {
      ctx.beginPath();
      ctx.moveTo(rx - 18, ry + 6);
      ctx.quadraticCurveTo(rx - 4, ry + 2, rx + 6, ry - 12);
      ctx.lineTo(rx + rw - 6, ry - 12);
      ctx.quadraticCurveTo(rx + rw + 4, ry + 2, rx + rw + 18, ry + 6);
      ctx.closePath();
      ctx.fill();
    };
    roof(x, top, w);
    if (r > 0.65) {   // second storey
      const w2 = w * 0.6, x2 = x + (w - w2) / 2, h2 = 26;
      ctx.fillRect(x2, top - 12 - h2, w2, h2);
      roof(x2, top - 12 - h2, w2);
      top -= 12 + h2;
    }
    ctx.fillStyle = light;
    ctx.globalAlpha = 0.35;
    const wins = Math.max(1, Math.floor(w / 28));
    for (let k = 0; k < wins; k++) {
      if (hash(i * 7 + k + seed) < 0.4) continue;
      ctx.fillRect(x + 10 + k * ((w - 20) / wins), baseY - h + 14, 9, 12);
    }
    ctx.globalAlpha = 1;
  }
}

function drawBeltMotif(B) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = B.fg;
  const cx = W * 0.78, cy = 130;
  ctx.fillRect(cx - 80, cy, 160, 18);
  ctx.fillRect(cx - 8, cy - 30, 16, 70);
  ctx.fillRect(cx - 50, cy + 18, 18, 40);
  ctx.fillRect(cx + 32, cy + 18, 18, 40);
  ctx.restore();
}

function drawPlayer(B) {
  // motion trail
  const n = player.trail.length;
  for (let i = 0; i < n - 1; i++) {
    const t = player.trail[i];
    const k = (i + 1) / n;
    const s = player.size * (0.35 + k * 0.45);
    ctx.save();
    ctx.globalAlpha = k * 0.28;
    ctx.fillStyle = B.accent;
    ctx.translate(t.x + player.size / 2, t.y + player.size / 2);
    ctx.rotate(flightMode ? 0 : t.rot);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }
  if (flightMode) {
    drawAirplane(B);
    return;
  }
  const s = player.size, hs = s / 2;
  ctx.save();
  ctx.translate(player.x + hs, player.y + hs);
  if (player.grav < 0) ctx.scale(1, -1);   // upside down: the cube's face flips too
  ctx.rotate(player.grav < 0 ? -player.rotation : player.rotation);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-hs + 3, -hs + 4, s, s);
  const body = ctx.createLinearGradient(-hs, -hs, hs, hs);
  body.addColorStop(0, lighten(B.fg, 0.22));
  body.addColorStop(0.5, B.fg);
  body.addColorStop(1, darken(B.fg, 0.3));
  ctx.fillStyle = body;
  ctx.fillRect(-hs, -hs, s, s);
  ctx.fillStyle = rgba(B.accent, 0.3);
  ctx.fillRect(-hs + 6, -hs + 6, s - 12, s - 12);
  ctx.strokeStyle = B.accent;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-hs + 1.5, -hs + 1.5, s - 3, s - 3);
  // the belt around the cube, tied with a knot
  ctx.fillStyle = B.bg1;
  ctx.fillRect(-hs + 2, 3, s - 4, 6);
  ctx.strokeStyle = darken(B.bg1, 0.45);
  ctx.lineWidth = 1;
  ctx.strokeRect(-hs + 2.5, 3.5, s - 5, 5);
  ctx.fillStyle = B.bg1;
  ctx.fillRect(-4, 1, 8, 10);
  ctx.fillRect(-7, 10, 4, 7);
  ctx.fillRect(3, 10, 4, 7);
  // eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-10, -10, 7, 7);
  ctx.fillRect(3, -10, 7, 7);
  ctx.fillStyle = '#111';
  ctx.fillRect(-6, -8, 3, 4);
  ctx.fillRect(7, -8, 3, 4);
  // gloss
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-hs + 3, -hs + 3, s - 6, 4);
  ctx.restore();
}

function drawAirplane(B) {
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  if (player.grav < 0) ctx.scale(1, -1);   // flipped plane flies belly-up
  ctx.rotate(Math.max(-0.35, Math.min(0.35, player.vy * 0.035 * player.grav)));
  // exhaust flame
  const fl = 6 + Math.random() * 7;
  const fg = ctx.createLinearGradient(-17 - fl, 0, -15, 0);
  fg.addColorStop(0, 'rgba(255,80,0,0)');
  fg.addColorStop(0.5, 'rgba(255,150,30,0.85)');
  fg.addColorStop(1, '#fff6c0');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(-15, -3); ctx.lineTo(-17 - fl, 0); ctx.lineTo(-15, 3);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-15, 9, 30, 4);
  const body = ctx.createLinearGradient(0, -10, 0, 10);
  body.addColorStop(0, lighten(B.fg, 0.25));
  body.addColorStop(0.55, B.fg);
  body.addColorStop(1, darken(B.fg, 0.3));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(-10, -5);
  ctx.lineTo(-16, -10);
  ctx.lineTo(-14, -2);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-14, 2);
  ctx.lineTo(-16, 10);
  ctx.lineTo(-10, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = B.accent;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  const wing = ctx.createLinearGradient(-11, -15, -11, 15);
  wing.addColorStop(0, lighten(B.accent, 0.3));
  wing.addColorStop(1, darken(B.accent, 0.25));
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-7, -15);
  ctx.lineTo(-11, -14);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-11, 14);
  ctx.lineTo(-7, 15);
  ctx.closePath();
  ctx.fill();
  // cockpit glass
  const glass = ctx.createLinearGradient(5, -3, 12, 3);
  glass.addColorStop(0, '#e8fbff');
  glass.addColorStop(1, '#3aa6d8');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.ellipse(8, -1, 4.5, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawObstacle(o, B) {
  // Roof obstacles that have an "up" (spikes, pads) are drawn through a mirror,
  // so they hang from the ceiling exactly like the floor version stands on the ground.
  if (o.flip && (o.type === 'spike' || o.type === 'fspike' || o.type === 'pad')) {
    ctx.save();
    ctx.translate(0, MIRROR_Y);
    ctx.scale(1, -1);
    drawUpright(Object.assign({}, o, { y: MIRROR_Y - o.y - o.h }), B);
    ctx.restore();
  } else drawUpright(o, B);
}

function drawUpright(o, B) {
  if (o.type === 'spike') drawSpike(o.x, o.y, o.w, o.h, B);
  else if (o.type === 'fspike') drawTriDown(o, B);
  else if (o.type === 'block') drawBlock(o, B);
  else if (o.type === 'saw') drawSaw(o, B);
  else if (o.type === 'pad') drawPad(o, B);
  else if (o.type === 'orb' || o.type === 'dashOrb' || o.type === 'gravOrb') drawOrb(o);
  else if (o.type === 'portal') drawPortal(o, B);
}

const ORB_COLORS = {
  orb:     { ring: '#ffb347', body: '#ff8c00', core: '#ffe0a8', dark: '#9a4300' },   // jump orb (orange)
  dashOrb: { ring: '#7dffa8', body: '#1fcc55', core: '#c8ffdc', dark: '#0a6528' },   // dash orb (green)
  gravOrb: { ring: '#8cc8ff', body: '#2a7bff', core: '#d2e8ff', dark: '#0b2a78' },   // gravity orb (blue)
};

function drawOrb(o) {
  const c = ORB_COLORS[o.type];
  const used = player.used && player.used.includes(o.oid);
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2, r = o.w / 2;
  const pulse = 0.5 + Math.sin(frame * 0.15 + o.x * 0.01) * 0.5;
  const alpha = used ? 0.3 : 1;
  ctx.save();
  // halo
  ctx.globalAlpha = alpha;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r + 16);
  halo.addColorStop(0, rgba(c.body, 0.5));
  halo.addColorStop(1, rgba(c.body, 0));
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx, cy, r + 16, 0, Math.PI * 2); ctx.fill();
  // spinning dashed ring
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(frame * 0.04 * (o.type === 'gravOrb' ? -1 : 1));
  ctx.globalAlpha = alpha * (0.55 + pulse * 0.4);
  ctx.strokeStyle = c.ring;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 5]);
  ctx.beginPath(); ctx.arc(0, 0, r + 6 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.globalAlpha = alpha;
  // glossy body
  const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, 2, cx, cy, r);
  body.addColorStop(0, c.core);
  body.addColorStop(0.55, c.body);
  body.addColorStop(1, c.dark);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha * 0.9;
  ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(cx - r * 0.28, cy - r * 0.48, r * 0.36, r * 0.17, -0.45, 0, Math.PI * 2); ctx.fill();
  if (o.type === 'dashOrb') {
    // forward arrow: "hold to dash"
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(cx + 9, cy);
    ctx.lineTo(cx - 5, cy - 8);
    ctx.lineTo(cx - 5, cy + 8);
    ctx.closePath(); ctx.fill();
  } else if (o.type === 'gravOrb') {
    // double chevron pointing to where it sends you (up from the floor, down from the roof)
    const dir = o.flip ? 1 : -1;
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const off of [-4, 4]) {
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - dir * 3 + off);
      ctx.lineTo(cx, cy + dir * 4 + off);
      ctx.lineTo(cx + 7, cy - dir * 3 + off);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPortal(o, B) {
  const color = o.mode === 'airplane' ? '#38e8ff' : '#ffe34d';
  const pulse = 0.7 + Math.sin(frame * 0.12 + o.x) * 0.3;
  const cx = o.x + o.w / 2;
  ctx.save();
  // light column
  const col = ctx.createLinearGradient(o.x - 16, 0, o.x + o.w + 16, 0);
  col.addColorStop(0, rgba(color, 0));
  col.addColorStop(0.5, rgba(color, 0.3 * pulse));
  col.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = col;
  ctx.fillRect(o.x - 16, o.y, o.w + 32, o.h);
  // flowing chevrons (up = into the plane, down = back to the cube)
  ctx.save();
  ctx.beginPath(); ctx.rect(o.x + 10, o.y, o.w - 20, o.h); ctx.clip();
  const up = o.mode === 'airplane';
  const step = 30, off = (frame * 1.6) % step;
  ctx.strokeStyle = rgba(color, 0.75);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let y = o.y - step; y < o.y + o.h + step; y += step) {
    const yy = up ? y - off : y + off;
    const d = up ? -8 : 8;
    ctx.beginPath();
    ctx.moveTo(cx - 9, yy - d / 2);
    ctx.lineTo(cx, yy + d / 2);
    ctx.lineTo(cx + 9, yy - d / 2);
    ctx.stroke();
  }
  ctx.restore();
  // glowing side pillars
  ctx.shadowColor = color;
  ctx.shadowBlur = 14 * pulse;
  const pil = ctx.createLinearGradient(o.x, 0, o.x + 10, 0);
  pil.addColorStop(0, lighten(color, 0.5));
  pil.addColorStop(1, darken(color, 0.25));
  ctx.fillStyle = pil;
  roundRectPath(o.x + 1, o.y, 9, o.h, 4); ctx.fill();
  roundRectPath(o.x + o.w - 10, o.y, 9, o.h, 4); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.6;
  ctx.fillRect(o.x + 3, o.y, 2, o.h);
  ctx.fillRect(o.x + o.w - 8, o.y, 2, o.h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.font = 'bold 12px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(up ? 'FLY' : 'EXIT', cx, CEIL_Y + 22);
  ctx.restore();
}

// A spike pointing up, base at y + h: lit left face, shaded right face.
function drawSpike(x, y, w, h, B) {
  const tx = x + w / 2, by = y + h;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.moveTo(x + 3, by + 2); ctx.lineTo(tx + 3, y + 3); ctx.lineTo(x + w + 3, by + 2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = lighten(B.spike, 0.2);
  ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(x, by); ctx.lineTo(tx, by); ctx.closePath(); ctx.fill();
  ctx.fillStyle = darken(B.spike, 0.28);
  ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, by); ctx.lineTo(x + w, by); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(B.accent, 0.55);
  ctx.beginPath(); ctx.moveTo(tx, y + 7); ctx.lineTo(tx - 6, by - 3); ctx.lineTo(tx - 1, by - 3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(tx, y); ctx.lineTo(x + w, by); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.arc(tx - 0.5, y + 4, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTriDown(o, B) {
  // Floating spike — points DOWN, hanging from the roof on a chain
  ctx.save();
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.45;
  for (let y = CEIL_Y, k = 0; y < o.y; y += 7, k++) {
    if (k % 2) ctx.strokeRect(o.x + o.w / 2 - 1, y, 2, 7);
    else ctx.strokeRect(o.x + o.w / 2 - 3, y, 6, 7);
  }
  ctx.globalAlpha = 1;
  ctx.translate(0, o.y * 2 + o.h);
  ctx.scale(1, -1);
  drawSpike(o.x, o.y, o.w, o.h, B);
  ctx.restore();
}

function drawBlock(o, B) {
  const { x, y, w, h } = o;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + 4, y + 4, w, h);
  ctx.fillStyle = getTexture('block');
  ctx.fillRect(x, y, w, h);
  const sh = ctx.createLinearGradient(0, y, 0, y + h);
  sh.addColorStop(0, 'rgba(255,255,255,0.18)');
  sh.addColorStop(0.45, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = sh;
  ctx.fillRect(x, y, w, h);
  // bevel
  ctx.fillStyle = rgba(B.glow, 0.55);
  ctx.fillRect(x + 2, y + 2, w - 4, 3);
  ctx.fillRect(x + 2, y + 2, 3, h - 4);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 2, y + h - 5, w - 4, 3);
  ctx.fillRect(x + w - 5, y + 2, 3, h - 4);
  if (w > 26 && h > 26) {
    ctx.strokeStyle = rgba(B.fg, 0.22);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8.5, y + 8.5, w - 17, h - 17);
  }
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function drawSaw(o, B) {
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
  const r = Math.min(o.w, o.h) / 2;
  const spin = frame * 0.22;
  ctx.save();
  ctx.translate(cx, cy);
  // motion blur ring
  ctx.strokeStyle = rgba(B.accent, 0.22);
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, Math.PI * 2); ctx.stroke();
  // teeth
  ctx.save();
  ctx.rotate(spin);
  ctx.fillStyle = mix('#cfd3da', B.spike, 0.35);
  ctx.beginPath();
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2, a1 = (i + 0.6) / n * Math.PI * 2;
    ctx.lineTo(Math.cos(a0) * (r - 4), Math.sin(a0) * (r - 4));
    ctx.lineTo(Math.cos(a1) * (r + 5), Math.sin(a1) * (r + 5));
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
  // steel disc (lit from the top-left, so not rotated)
  const disc = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 2, 0, 0, r);
  disc.addColorStop(0, '#f6f8fa');
  disc.addColorStop(0.6, mix('#9aa0a8', B.spike, 0.3));
  disc.addColorStop(1, mix('#40454d', B.spike, 0.4));
  ctx.fillStyle = disc;
  ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.rotate(spin);
  ctx.fillStyle = darken(B.spike, 0.35);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = B.accent;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = B.fg;
  ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPad(o, B) {
  const glow = 0.25 + Math.sin(frame * 0.3 + o.x * 0.01) * 0.12;
  const beam = ctx.createLinearGradient(0, o.y - 44, 0, o.y);
  beam.addColorStop(0, 'rgba(140,255,150,0)');
  beam.addColorStop(1, 'rgba(140,255,150,' + glow.toFixed(3) + ')');
  ctx.fillStyle = beam;
  ctx.fillRect(o.x + 4, o.y - 44, o.w - 8, 44);
  ctx.fillStyle = '#123a1a';
  roundRectPath(o.x - 2, o.y + 1, o.w + 4, o.h + 1, 3); ctx.fill();
  const body = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
  body.addColorStop(0, '#b4ff7a');
  body.addColorStop(1, '#1f9e38');
  ctx.fillStyle = body;
  roundRectPath(o.x, o.y, o.w, o.h - 1, 4); ctx.fill();
  ctx.save();
  roundRectPath(o.x, o.y, o.w, o.h - 1, 4); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,140,0.5)';
  const off = (frame * 0.6) % 14;
  for (let i = -14; i < o.w + 14; i += 14) {
    ctx.beginPath();
    ctx.moveTo(o.x + i + off, o.y + o.h);
    ctx.lineTo(o.x + i + off + 6, o.y);
    ctx.lineTo(o.x + i + off + 11, o.y);
    ctx.lineTo(o.x + i + off + 5, o.y + o.h);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 2; i++) {
    const ax = o.x + (i + 0.5) * (o.w / 2);
    ctx.beginPath();
    ctx.moveTo(ax, o.y + 1);
    ctx.lineTo(ax - 5, o.y + 8);
    ctx.lineTo(ax + 5, o.y + 8);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCheckpoint(cp, B) {
  const cx = cp.x, top = GROUND_Y - 100;
  const pole = cp.reached ? B.accent : B.fg;
  ctx.save();
  if (cp.reached) {
    const g = ctx.createRadialGradient(cx, top + 14, 2, cx, top + 14, 50);
    g.addColorStop(0, rgba(B.glow, 0.45));
    g.addColorStop(1, rgba(B.glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - 50, top - 36, 100, 100);
  }
  ctx.fillStyle = darken(pole, 0.2);
  ctx.fillRect(cx - 9, GROUND_Y - 5, 18, 5);
  ctx.fillStyle = pole;
  ctx.fillRect(cx - 2, top, 4, 100);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(cx - 2, top, 1.5, 100);
  ctx.fillStyle = pole;
  ctx.beginPath(); ctx.arc(cx, top, 5, 0, Math.PI * 2); ctx.fill();
  // waving flag
  const w1 = Math.sin(frame * 0.12 + cp.x * 0.01) * 3;
  const w2 = Math.sin(frame * 0.12 + cp.x * 0.01 + 1.4) * 3;
  const flagColor = cp.reached ? B.accent : B.glow;
  const fg = ctx.createLinearGradient(cx, 0, cx + 40, 0);
  fg.addColorStop(0, lighten(flagColor, 0.15));
  fg.addColorStop(1, darken(flagColor, 0.15));
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(cx + 2, top + 2);
  ctx.quadraticCurveTo(cx + 18, top + 2 + w1, cx + 38 + w2, top + 12);
  ctx.quadraticCurveTo(cx + 18, top + 24 + w1, cx + 2, top + 26);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = B.fg;
  ctx.font = 'bold 11px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(cp.reached ? '✓' : 'CP', cx + 15, top + 18);
  ctx.restore();
}

// Floor, or (roof = true) the ceiling: the same surface drawn through a mirror.
function drawSurface(B, roof) {
  ctx.save();
  if (roof) { ctx.translate(0, MIRROR_Y); ctx.scale(1, -1); }
  ctx.save();
  ctx.translate(-(cameraX % TEX), 0);
  ctx.fillStyle = getTexture('floor');
  ctx.fillRect(0, GROUND_Y, W + TEX, H - GROUND_Y);
  ctx.restore();
  const depth = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  depth.addColorStop(0, 'rgba(0,0,0,0)');
  depth.addColorStop(1, 'rgba(0,0,0,' + (roof ? 0.55 : 0.45) + ')');
  ctx.fillStyle = depth;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  // glow above the edge, contact shadow, bright edge line
  const eg = ctx.createLinearGradient(0, GROUND_Y - 16, 0, GROUND_Y);
  eg.addColorStop(0, rgba(B.glow, 0));
  eg.addColorStop(1, rgba(B.glow, 0.22));
  ctx.fillStyle = eg;
  ctx.fillRect(0, GROUND_Y - 16, W, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(0, GROUND_Y + 4, W, 6);
  ctx.fillStyle = B.accent;
  ctx.fillRect(0, GROUND_Y, W, 4);
  ctx.fillStyle = lighten(B.accent, 0.5);
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, GROUND_Y, W, 1.5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = darken(B.accent, 0.35);
  for (let x = -(cameraX % 48); x < W; x += 48) ctx.fillRect(x, GROUND_Y + 4, 2, 5);

  ctx.translate(-cameraX, 0);
  for (const o of levelData.obstacles) {
    if (o.type !== 'pit' || !!o.flip !== roof) continue;
    if (o.x + o.w < cameraX - 80) continue;
    if (o.x > cameraX + W + 80) continue;
    drawPit(o, B);
  }
  ctx.restore();
}

function drawPit(o, B) {
  const lavaY = GROUND_Y + 28;
  ctx.fillStyle = '#070707';
  ctx.fillRect(o.x, GROUND_Y, o.w, H - GROUND_Y);
  const heat = ctx.createLinearGradient(0, GROUND_Y - 40, 0, lavaY);
  heat.addColorStop(0, 'rgba(255,90,20,0)');
  heat.addColorStop(1, 'rgba(255,90,20,0.35)');
  ctx.fillStyle = heat;
  ctx.fillRect(o.x, GROUND_Y - 40, o.w, lavaY - GROUND_Y + 40);
  const lava = ctx.createLinearGradient(0, lavaY, 0, H);
  lava.addColorStop(0, '#ffb02e');
  lava.addColorStop(0.25, '#ff4a0a');
  lava.addColorStop(1, '#8a1000');
  ctx.fillStyle = lava;
  ctx.fillRect(o.x, lavaY, o.w, H - lavaY);
  ctx.fillStyle = '#ffd36a';
  for (let i = 0; i < o.w; i += 9) {
    const wv = Math.sin((frame + i * 2) * 0.13) * 4;
    ctx.fillRect(o.x + i, lavaY + wv - 1, 6, 4);
  }
  for (let k = 0; k < 4; k++) {   // rising bubbles
    const t = (frame * 0.015 + k * 0.27 + o.x * 0.001) % 1;
    const bx = o.x + 8 + ((k * 37 + o.x) % Math.max(1, o.w - 16));
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#ffe9a0';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(bx, lavaY + 34 - t * 34, 2 + t * 2.5, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = B.accent;
  ctx.fillRect(o.x - 2, GROUND_Y, 3, 18);
  ctx.fillRect(o.x + o.w - 1, GROUND_Y, 3, 18);
}

function drawDeathOverlay() {
  const a = Math.min(0.55, deathTimer / 50);
  ctx.fillStyle = 'rgba(0,0,0,' + a + ')';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ff3333';
  ctx.font = 'bold 42px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('CRUSHED', W/2, H/2 - 8);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Courier New';
  ctx.fillText('returning to last checkpoint...', W/2, H/2 + 20);
}

function drawTransitionOverlay() {
  const t = transitionTimer / (pendingTransition === 'SECRET' ? 110 : 75);
  const isSecret = pendingTransition === 'SECRET';
  let nextName, nextBg;
  if (isSecret) {
    const s = SECRETS[pendingSecretIdx];
    nextName = s.name; nextBg = s.bg1;
    ctx.fillStyle = 'rgba(40,0,0,' + (0.55 + Math.sin(t * Math.PI * 3) * 0.25) + ')';
  } else {
    const next = BELTS[Math.min(pendingNextBelt, BELTS.length - 1)];
    nextName = next.name; nextBg = next.bg1;
    ctx.fillStyle = 'rgba(0,0,0,' + (0.55 + Math.sin(t * Math.PI) * 0.2) + ')';
  }
  ctx.fillRect(0, 0, W, H);

  if (isSecret) {
    ctx.fillStyle = '#ff2020';
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('— SECRET TRIAL DETECTED —', W/2, H/2 - 60);
  }

  ctx.fillStyle = nextBg;
  ctx.shadowColor = nextBg;
  ctx.shadowBlur = isSecret ? 36 : 24;
  ctx.font = 'bold ' + (isSecret ? 50 : 56) + 'px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(nextName, W/2, H/2 - 10);
  ctx.shadowBlur = 0;

  if (!isSecret) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('BELT', W/2, H/2 + 22);
  }
  ctx.fillStyle = '#aaa';
  ctx.font = '12px Courier New';
  ctx.fillText(isSecret ? 'prepare yourself' : 'the path continues...', W/2, H/2 + 56);
}

function drawWonOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.88)';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, H/2 - 60, 0, H/2 + 20);
  g.addColorStop(0, '#fff8b0');
  g.addColorStop(0.5, '#ffd700');
  g.addColorStop(1, '#a07700');
  ctx.fillStyle = g;
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 30;
  ctx.font = 'bold 54px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GRANDMASTER', W/2, H/2 - 20);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#cc0000';
  ctx.font = 'bold 18px Courier New';
  ctx.fillText('all eight belts conquered', W/2, H/2 + 18);
  ctx.fillStyle = '#aaa';
  ctx.font = '11px Courier New';
  ctx.fillText(IS_MOBILE ? 'tap RESPAWN to return to menu' : 'press R to return to menu', W/2, H/2 + 60);
}

function drawSecretWonOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ff2020';
  ctx.font = 'bold 14px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('— TRIAL CLEARED —', W/2, H/2 - 60);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#cc0000';
  ctx.shadowBlur = 24;
  ctx.font = 'bold 44px Courier New';
  ctx.fillText('SURVIVOR', W/2, H/2 - 10);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aaa';
  ctx.font = '11px Courier New';
  ctx.fillText(IS_MOBILE ? 'tap RESPAWN to return to menu' : 'press R to return to menu', W/2, H/2 + 40);
}

function drawCustomWonOverlay() {
  const title = activeCustomLevel ? activeCustomLevel.name : 'LEVEL COMPLETE';
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 15px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('— COMMUNITY LEVEL CLEARED —', W/2, H/2 - 60);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#cc0000';
  ctx.shadowBlur = 24;
  ctx.font = 'bold 34px Courier New';
  ctx.fillText(title.slice(0, 24), W/2, H/2 - 10);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aaa';
  ctx.font = '11px Courier New';
  ctx.fillText(IS_MOBILE ? 'tap RESPAWN to return to menu' : 'press R to return to menu', W/2, H/2 + 40);
}

// ============== HUD ==============
function updateHUD() {
  const B = getPalette();
  const nameEl = document.getElementById('beltName');
  const subEl  = document.getElementById('subtitle');
  if (customLevelActive && activeCustomLevel) {
    nameEl.textContent = activeCustomLevel.name;
    subEl.textContent = verifyRun ? 'VERIFYING · BEAT IT IN ONE RUN' : 'BY ' + activeCustomLevel.author;
  } else if (inSecret) {
    nameEl.textContent = SECRETS[secretIdx].name;
    subEl.textContent = 'SECRET TRIAL';
  } else {
    nameEl.textContent = BELTS[belt].name + ' BELT';
    subEl.textContent = 'BELT ' + belt + ' OF 8';
  }
  nameEl.style.color = B.fg;
  subEl.style.color = inSecret ? '#ff4040' : B.fg;

  const bar = document.getElementById('beltBar');
  bar.style.visibility = customLevelActive ? 'hidden' : 'visible';
  bar.innerHTML = '';
  for (let i = 1; i < BELTS.length; i++) {
    const pip = document.createElement('div');
    pip.className = 'pip' + ((!inSecret && !customLevelActive && i === belt) ? ' active' : '');
    pip.style.background = BELTS[i].bg1;
    pip.style.color = BELTS[i].bg1;
    pip.style.opacity = (i <= (inSecret ? belt : belt)) ? 1 : 0.28;
    bar.appendChild(pip);
  }
}

// ============== Player level editor & sharing ==============
const EDITOR_OBSTACLES = {
  spike: { w: 30, y: GROUND_Y - 30, h: 30, color: '#ff5555' },
  block: { w: 60, y: GROUND_Y - 60, h: 60, color: '#f0a070' },
  pit:   { w: 100, y: GROUND_Y, h: 24, color: '#ff6a1a' },
  saw:   { w: 50, y: GROUND_Y - 95, h: 50, color: '#b28cff' },
  pad:   { w: 60, y: GROUND_Y - 12, h: 12, color: '#44dd66' },
  orb:        { w: 36, y: GROUND_Y - 138, h: 36, color: '#ff8c00' },
  portalFly:  { w: 46, y: 0, h: GROUND_Y, color: '#38e8ff' },
  portalCube: { w: 46, y: 0, h: GROUND_Y, color: '#ffe34d' },
  dashOrb:    { w: 36, y: GROUND_Y - 118, h: 36, color: '#1fcc55' },
  gravOrb:     { w: 36, y: GROUND_Y - 128, h: 36, color: '#3d8bff' },
  roofGravOrb: { w: 36, y: MIRROR_Y - (GROUND_Y - 128) - 36, h: 36, color: '#3d8bff' },
  roofSpike:   { w: 30, y: CEIL_Y, h: 30, color: '#ff5555' },
  roofBlock:   { w: 60, y: CEIL_Y, h: 60, color: '#f0a070' },
};
const CUSTOM_LEVELS_KEY = 'iuBeltDashPlayerLevels';
const DEFAULT_MUSIC = 3;   // ORANGE

function openLevelEditor() {
  editorMusicPreview = Number(document.getElementById('levelMusicInput').value);
  document.getElementById('levelEditorModal').classList.add('open');
  document.getElementById('levelEditorModal').setAttribute('aria-hidden', 'false');
  document.getElementById('editorStatus').textContent = '';
  document.getElementById('publishedLevelLink').hidden = true;
  drawEditor();
}

let editorMusicPreview = null;   // track index being auditioned in the editor (null = menu loop)

function initMusicPicker() {
  const select = document.getElementById('levelMusicInput');
  Music.names.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = name;
    select.appendChild(opt);
  });
  select.value = DEFAULT_MUSIC;
  select.addEventListener('change', () => { editorMusicPreview = Number(select.value); });
}

function closeLevelEditor() {
  editorMusicPreview = null;
  const modal = document.getElementById('levelEditorModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function placeEditorObstacle(event) {
  const canvasEl = event.currentTarget;
  const rect = canvasEl.getBoundingClientRect();
  const length = Number(document.getElementById('levelLengthInput').value);
  const clickedX = ((event.clientX - rect.left) / rect.width) * canvasEl.width;
  const worldX = Math.round((clickedX / canvasEl.width) * length / 30) * 30;
  if (editorTool === 'erase') {
    let nearest = -1;
    let nearestDistance = Infinity;
    editorObstacles.forEach((obstacle, index) => {
      const distance = Math.abs(obstacle.x - worldX);
      if (distance < nearestDistance && distance < 100) {
        nearest = index;
        nearestDistance = distance;
      }
    });
    if (nearest >= 0) editorObstacles.splice(nearest, 1);
    drawEditor();
    return;
  }
  if (editorObstacles.length >= 50) {
    document.getElementById('editorStatus').textContent = 'This level already has the maximum of 50 obstacles.';
    return;
  }
  const obstacle = EDITOR_OBSTACLES[editorTool];
  if (!obstacle || worldX < 420 || worldX + obstacle.w > length - 180) {
    document.getElementById('editorStatus').textContent = 'Place obstacles after the start and before the finish.';
    return;
  }
  editorObstacles.push({ type: editorTool, x: worldX });
  editorObstacles.sort((a, b) => a.x - b.x);
  document.getElementById('editorStatus').textContent = '';
  drawEditor();
}

function drawEditor() {
  const editorCanvas = document.getElementById('editorCanvas');
  if (!editorCanvas) return;
  const editorCtx = editorCanvas.getContext('2d');
  const length = Number(document.getElementById('levelLengthInput').value);
  editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
  editorCtx.fillStyle = '#171717';
  editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
  editorCtx.fillStyle = '#222';
  for (let x = 0; x < editorCanvas.width; x += 48) editorCtx.fillRect(x, 0, 1, editorCanvas.height);
  const groundY = editorCanvas.height * (GROUND_Y / H);
  editorCtx.fillStyle = '#444';
  editorCtx.fillRect(0, groundY, editorCanvas.width, editorCanvas.height - groundY);
  editorCtx.fillStyle = '#cc0000';
  editorCtx.fillRect(0, groundY, editorCanvas.width, 3);
  const ceilY = editorCanvas.height * (CEIL_Y / H);
  editorCtx.fillStyle = '#333';
  editorCtx.fillRect(0, 0, editorCanvas.width, ceilY);
  editorCtx.fillStyle = '#3d8bff';
  editorCtx.fillRect(0, ceilY - 2, editorCanvas.width, 2);
  editorCtx.fillStyle = '#66ccff';
  editorCtx.fillRect(120 / length * editorCanvas.width, groundY - 38, 3, 38);
  editorCtx.fillStyle = '#ffd700';
  editorCtx.fillRect(editorCanvas.width - 4, 0, 4, groundY);
  editorObstacles.forEach((item) => {
    const shape = EDITOR_OBSTACLES[item.type];
    if (!shape) return;
    const x = item.x / length * editorCanvas.width;
    const y = shape.y / H * editorCanvas.height;
    const w = shape.w / length * editorCanvas.width;
    const h = Math.max(4, shape.h / H * editorCanvas.height);
    editorCtx.fillStyle = shape.color;
    editorCtx.fillRect(x, y, Math.max(w, 4), h);
  });
  document.getElementById('editorStatus').textContent = editorObstacles.length + ' / 50 obstacles';
  updateVerifyUI();
}

// ---- Verification: you must beat your own level before publishing it ----
function levelSignature(length, obstacles) {
  return JSON.stringify([length, obstacles.map(({ type, x }) => [type, x])]);
}

function editorSignature() {
  return levelSignature(Number(document.getElementById('levelLengthInput').value), editorObstacles);
}

function updateVerifyUI() {
  const verified = editorObstacles.length > 0 && verifiedSignature === editorSignature();
  const badge = document.getElementById('verifyBadge');
  badge.textContent = verified ? '✓ VERIFIED — ready to publish' : '✗ NOT VERIFIED — beat your level once to publish it';
  badge.classList.toggle('ok', verified);
  document.getElementById('publishLevelBtn').disabled = !verified;
}

function verifyLevel() {
  try {
    const level = readEditorLevel();
    verifyRun = levelSignature(level.length, level.obstacles);
    startSharedLevel(level);
  } catch (error) {
    document.getElementById('editorStatus').textContent = error.message;
  }
}

function readEditorLevel() {
  const name = document.getElementById('levelNameInput').value.trim().slice(0, 40);
  const author = document.getElementById('levelAuthorInput').value.trim().slice(0, 24);
  const length = Number(document.getElementById('levelLengthInput').value);
  if (!name || !author) throw new Error('Enter both a level name and a creator name.');
  if (!Number.isInteger(length) || length < 3000 || length > 9000) throw new Error('Choose a valid level length.');
  if (!editorObstacles.length) throw new Error('Add at least one obstacle before saving or publishing.');
  return validateCustomLevel({
    version: 1,
    name,
    author,
    length,
    music: Number(document.getElementById('levelMusicInput').value),
    obstacles: editorObstacles.map(({ type, x }) => ({ type, x })),
  });
}

function loadSavedLevels() {
  const stored = localStorage.getItem(CUSTOM_LEVELS_KEY);
  if (!stored) return [];
  const parsed = JSON.parse(stored);
  if (!Array.isArray(parsed)) throw new Error('Saved levels data is not a list.');
  return parsed.map(validateCustomLevel).slice(0, 10);
}

function persistLevel(level) {
  const levels = loadSavedLevels().filter((saved) => !(saved.name === level.name && saved.author === level.author));
  levels.unshift(level);
  localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(levels.slice(0, 10)));
}

function validateCustomLevel(value) {
  if (!value || value.version !== 1 || typeof value.name !== 'string' || typeof value.author !== 'string' ||
      !Number.isInteger(value.length) || value.length < 3000 || value.length > 9000 ||
      !Array.isArray(value.obstacles) || value.obstacles.length < 1 || value.obstacles.length > 50) {
    throw new Error('This level link is invalid or uses an unsupported format.');
  }
  const name = value.name.trim().slice(0, 40);
  const author = value.author.trim().slice(0, 24);
  if (!name || !author) throw new Error('This level link is missing its name or creator.');
  const obstacles = value.obstacles.map((item) => {
    if (!item || !Object.prototype.hasOwnProperty.call(EDITOR_OBSTACLES, item.type) ||
        !Number.isInteger(item.x) || item.x < 420 || item.x + EDITOR_OBSTACLES[item.type].w > value.length - 180) {
      throw new Error('This level contains an invalid obstacle.');
    }
    return { type: item.type, x: item.x };
  });
  // Older links have no music field — they get the default track
  const music = (Number.isInteger(value.music) && value.music >= 0 && value.music < Music.count) ? value.music : DEFAULT_MUSIC;
  return { version: 1, name, author, length: value.length, music, obstacles };
}

function encodeLevel(level) {
  const bytes = new TextEncoder().encode(JSON.stringify(level));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeLevel(encoded) {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length > 8000) {
    throw new Error('This level link is malformed or too large.');
  }
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return validateCustomLevel(JSON.parse(new TextDecoder().decode(bytes)));
}

async function copyLevelLink(link) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard access is unavailable.');
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    return false;
  }
}

async function publishLevel() {
  const status = document.getElementById('editorStatus');
  const linkField = document.getElementById('publishedLevelLink');
  try {
    const level = readEditorLevel();
    if (levelSignature(level.length, level.obstacles) !== verifiedSignature) {
      throw new Error('Beat your level first: press TEST & VERIFY and finish it in one run.');
    }
    const link =window.location.href.split('#')[0] + '#level=' + encodeLevel(level);
    if (link.length > 6000) throw new Error('This level link is too long to share. Remove some obstacles and try again.');
    linkField.value = link;
    linkField.hidden = false;
    let localSaveError = '';
    try {
      persistLevel(level);
      refreshCommunityLevels();
    } catch (error) {
      localSaveError = ' This browser could not save a local copy: ' + error.message;
    }
    const copied = await copyLevelLink(link);
    if (copied) status.textContent = 'Published! Share the copied link so anyone can play your level.' + localSaveError;
    else {
      linkField.focus();
      linkField.select();
      status.textContent = 'Link ready. Clipboard access was denied; copy the selected link below.' + localSaveError;
    }
  } catch (error) {
    status.textContent = error.message;
  }
}

function saveLevelDraft() {
  const status = document.getElementById('editorStatus');
  try {
    persistLevel(readEditorLevel());
    refreshCommunityLevels();
    status.textContent = 'Draft saved in this browser.';
  } catch (error) {
    status.textContent = error.message;
  }
}

function editSavedLevel(level) {
  document.getElementById('levelMusicInput').value = level.music;
  document.getElementById('levelNameInput').value = level.name;
  document.getElementById('levelAuthorInput').value = level.author;
  document.getElementById('levelLengthInput').value = level.length;
  document.getElementById('levelLengthValue').textContent = level.length;
  editorObstacles = level.obstacles.map((item) => ({ type: item.type, x: item.x }));
  openLevelEditor();
}

function removeSavedLevel(level) {
  try {
    const remaining = loadSavedLevels().filter((saved) => !(saved.name === level.name && saved.author === level.author));
    localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(remaining));
    refreshCommunityLevels();
  } catch (error) {
    const saved = document.getElementById('savedLevels');
    const message = document.createElement('p');
    message.className = 'community-copy';
    message.textContent = 'Could not remove this level: ' + error.message;
    saved.prepend(message);
  }
}

function startSharedLevel(level) {
  closeLevelEditor();
  document.body.classList.add('playing');
  sessionStartTime = Date.now();
  pausedDuration = 0;
  iuTalents = 0;
  startCustomLevel(level);
  if (IS_MOBILE) tryFullscreen();
  requestWakeLock();
  checkOrientation();
}

function refreshCommunityLevels() {
  const shared = document.getElementById('sharedLevelFeature');
  const saved = document.getElementById('savedLevels');
  shared.innerHTML = '';
  saved.innerHTML = '';
  if (sharedCustomLevel) {
    const title = document.createElement('h3');
    title.textContent = sharedCustomLevel.name;
    const byline = document.createElement('p');
    byline.textContent = 'SHARED LEVEL BY ' + sharedCustomLevel.author + ' · ' + sharedCustomLevel.obstacles.length + ' OBSTACLES';
    const play = document.createElement('button');
    play.type = 'button';
    play.textContent = 'PLAY THIS LEVEL';
    play.addEventListener('click', () => startSharedLevel(sharedCustomLevel));
    shared.append(title, byline, play);
    shared.hidden = false;
  } else if (sharedLevelError) {
    shared.textContent = sharedLevelError;
    shared.hidden = false;
  } else {
    shared.hidden = true;
  }
  try {
    loadSavedLevels().forEach((level) => {
      const card = document.createElement('article');
      card.className = 'community-card';
      const title = document.createElement('h3');
      title.textContent = level.name;
      const byline = document.createElement('p');
      byline.textContent = 'BY ' + level.author + ' · ' + level.obstacles.length + ' OBSTACLES';
      const play = document.createElement('button');
      play.type = 'button';
      play.textContent = 'PLAY';
      play.addEventListener('click', () => startSharedLevel(level));
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'EDIT';
      edit.addEventListener('click', () => editSavedLevel(level));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'REMOVE';
      remove.addEventListener('click', () => removeSavedLevel(level));
      card.append(title, byline, play, edit, remove);
      saved.appendChild(card);
    });
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'community-copy';
    message.textContent = 'Could not load saved levels: ' + error.message;
    saved.appendChild(message);
  }
}

function loadSharedLevelFromHash() {
  const match = window.location.hash.match(/^#level=([A-Za-z0-9_-]+)$/);
  if (!match) {
    if (window.location.hash.startsWith('#level=')) {
      sharedLevelError = 'This shared level link is invalid or has been damaged.';
    }
    return;
  }
  try {
    sharedCustomLevel = decodeLevel(match[1]);
  } catch (error) {
    sharedLevelError = 'Could not load this shared level: ' + error.message;
  }
}

// ============== Trials UI on landing ==============
function refreshTrialsUI() {
  const cont = document.getElementById('trialsContainer');
  const prog = document.getElementById('trialProgress');
  if (!cont) return;
  cont.innerHTML = '';
  let unlocked = 0;
  SECRETS.forEach((s, idx) => {
    const isUnlocked = stats.unlockedSecrets.has(idx);
    if (isUnlocked) unlocked++;
    const card = document.createElement('div');
    card.className = 'trial-card ' + (isUnlocked ? 'unlocked' : 'locked');
    card.style.setProperty('--trial-bg', s.bg1);
    const name = document.createElement('div');
    name.className = 'trial-name';
    name.textContent = s.name;
    const status = document.createElement('div');
    status.className = 'trial-status';
    if (isUnlocked) {
      status.textContent = 'TAP TO PLAY';
    } else {
      const a = ACHIEVEMENTS[s.achievementKey];
      status.textContent = a.name + ': ' + a.desc.toUpperCase();
    }
    card.appendChild(name);
    card.appendChild(status);
    if (isUnlocked) {
      const fire = (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.add('playing');
        attempts = 1;
        startSecretLevel(idx, 'direct');
        if (IS_MOBILE) tryFullscreen();
        requestWakeLock();
        checkOrientation();
      };
      card.addEventListener('click', fire);
      card.addEventListener('touchstart', fire, { passive: false });
    }
    cont.appendChild(card);
  });
  prog.textContent = unlocked + ' OF 3 TRIALS UNLOCKED';
}
initMusicPicker();
loadProgress();
loadSharedLevelFromHash();
refreshCommunityLevels();
refreshTrialsUI();
refreshProgressUI();

// ============== Loop ==============
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m + ':' + String(s % 60).padStart(2, '0');
}
// Which track plays: belts use their own (0 = training … 8 = black), the three secret trials
// use 9-11, community levels use the one their creator picked, and the menu loop otherwise.
function currentMusicTrack(inGame) {
  if (!inGame) return editorMusicPreview;
  if (customLevelActive && activeCustomLevel) return activeCustomLevel.music;
  if (inSecret) return BELTS.length + secretIdx;
  return belt;
}
function loop() {
  const inGame = document.body.classList.contains('playing');
  Music.setTrack(currentMusicTrack(inGame));
  Music.setDucked(inGame && gameState === 'paused');
  if (inGame) {
    update();
    draw();
    if (levelData) {
      const now = Date.now();
      const onPause = (gameState === 'paused') ? (now - pauseStartTime) : 0;
      document.getElementById('attempts').textContent = attempts;
      document.getElementById('levelTimeHud').textContent = formatTime(now - levelStartTime - levelPausedDuration - onPause);
      document.getElementById('timeHud').textContent = formatTime(now - sessionStartTime - pausedDuration - onPause);
      document.getElementById('talentsHud').textContent = iuTalents.toFixed(2);
    }
  }
  requestAnimationFrame(loop);
}
loop();
