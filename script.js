'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const GROUND_Y = 430, PLAYER_SIZE = 34;

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
};

// ============== State ==============
let belt = 0;            // current campaign belt index (0 = training)
let inSecret = false;    // are we currently inside a secret level?
let secretIdx = 0;       // which secret
let secretMode = 'campaign'; // 'campaign' (5% detour) | 'direct' (from menu)
let pendingNextBelt = 1; // belt to start after a secret completes
let pendingTransition = 'BELT'; // 'BELT' | 'SECRET'
let pendingSecretIdx = 0;

let levelData = null, speed = 5, cameraX = 0;
let particles = [];
let gameState = 'menu';
let deathTimer = 0, transitionTimer = 0, frame = 0;
let attempts = 1, lastCheckpointX = 120;
let sessionStartTime = 0, iuTalents = 0;
let pausedDuration = 0, pauseStartTime = 0;
let levelStartTime = 0, levelPausedDuration = 0;

const player = { x: 120, y: GROUND_Y - PLAYER_SIZE, vy: 0, size: PLAYER_SIZE, onGround: true, rotation: 0 };
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
    if (gameState === 'won' || gameState === 'won-secret') { returnToMenu(); }
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
  if (gameState === 'won' || gameState === 'won-secret') returnToMenu();
  else if (gameState === 'playing' || gameState === 'dead') respawn();
});
bindBtn('resumeBtn', resumeGame);
bindBtn('restartBtn', () => {
  resumeGame();
  attempts = 1;
  if (inSecret) startSecretLevel(secretIdx, secretMode);
  else startLevel(belt);
});
bindBtn('abandonBtn', () => { resumeGame(); abandonTrial(); });
bindBtn('quitBtn', () => { resumeGame(); returnToMenu(); });
bindBtn('playBtnTop', enterGame);
bindBtn('playBtnBottom', enterGame);

function enterGame() {
  document.body.classList.add('playing');
  attempts = 1;
  inSecret = false;
  sessionStartTime = Date.now();
  pausedDuration = 0;
  iuTalents = 0;
  startLevel(1);
  if (IS_MOBILE) tryFullscreen();
  requestWakeLock();
  checkOrientation();
}

function returnToMenu() {
  document.body.classList.remove('playing');
  gameState = 'menu';
  inSecret = false;
  releaseWakeLock();
  exitFullscreen();
  document.getElementById('pauseOverlay').classList.remove('visible');
  refreshTrialsUI();
  window.scrollTo(0, 0);
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
  ['airplane',     5, 6],
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

function placePattern(obstacles, x, p, d) {
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
      obstacles.push({ type:'fspike', x:x+105,   y:GROUND_Y-100, w:30, h:30 });
      return 135;
    case 'jumpPad':
      // green pad → tall block requiring a boosted jump
      obstacles.push({ type:'pad',   x,       y:GROUND_Y-12,  w:60, h:12 });
      obstacles.push({ type:'block', x:x+250, y:GROUND_Y-130, w:60, h:130 });
      return 310;
    case 'saw':
      // rotating saw at jump-arc height
      obstacles.push({ type:'saw', x:x+10, y:GROUND_Y-95, w:50, h:50 });
      return 70;
    case 'airplane':
      obstacles.push({ type:'portal', mode:'airplane', x, y:GROUND_Y-150, w:46, h:150 });
      obstacles.push({ type:'block', x:x+240, y:0, w:48, h:180 });
      obstacles.push({ type:'block', x:x+240, y:300, w:48, h:GROUND_Y-300 });
      obstacles.push({ type:'block', x:x+480, y:0, w:48, h:245 });
      obstacles.push({ type:'block', x:x+480, y:365, w:48, h:GROUND_Y-365 });
      obstacles.push({ type:'block', x:x+700, y:0, w:48, h:140 });
      obstacles.push({ type:'block', x:x+700, y:280, w:48, h:GROUND_Y-280 });
      obstacles.push({ type:'portal', mode:'cube', x:x+870, y:GROUND_Y-150, w:46, h:150 });
      return 916;
  }
  return 50;
}

// ============== Level generation ==============
function buildLevel(opts) {
  // opts: { length, cpStep, tier, isSecret, minGap, d }
  const { length, cpStep, tier, isSecret, minGap, d } = opts;
  const obstacles = [], checkpoints = [];
  const SAFE_AFTER = 360, SAFE_BEFORE = 60;
  const cpZones = [];
  for (let cx = 800; cx < length - 300; cx += cpStep) {
    cpZones.push({ x: cx, zStart: cx - SAFE_BEFORE, zEnd: cx + SAFE_AFTER });
  }
  function hitsCpZone(left, right) {
    for (const cz of cpZones) if (right > cz.zStart && left < cz.zEnd) return cz;
    return null;
  }

  let x = 600;
  while (x < length - 400) {
    const czPre = hitsCpZone(x, x + 320);  // upper bound on any pattern width
    if (czPre) { x = czPre.zEnd + 50; continue; }
    const pat = pickPattern(tier, isSecret);
    const before = obstacles.length;
    const placedW = placePattern(obstacles, x, pat, d);
    const czPost = hitsCpZone(x, x + placedW);
    if (czPost) { obstacles.length = before; x = czPost.zEnd + 50; continue; }
    x += placedW + minGap + Math.random() * 80;
  }
  for (const cz of cpZones) checkpoints.push({ x: cz.x, reached: false });
  return { obstacles, checkpoints, length, infinite: false };
}

function generateLevel(b) {
  // LONGER levels — roughly 2x the previous version
  const length = 6000 + b * 1500;
  // FEWER checkpoints — wider spacing
  const cpStep = Math.max(2000, 3000 - b * 100);
  // Tighter obstacle spacing at higher belts
  const minGap = Math.max(130, 250 - b * 18);
  return buildLevel({
    length, cpStep, tier: b, isSecret: false, minGap, d: b / 8,
  });
}

function generateSecretLevel(idx) {
  const s = SECRETS[idx];
  return buildLevel({
    length: s.length, cpStep: s.cpStep, tier: 8, isSecret: true,
    minGap: 110, d: 1.1,
  });
}

// ============== Game flow ==============
function startLevel(b) {
  inSecret = false;
  belt = b;
  flightMode = false;
  pointerHeld = false;
  // Faster speed scaling with each belt
  speed = 5 + b * 0.5;
  player.x = 120; player.y = GROUND_Y - PLAYER_SIZE; player.vy = 0;
  player.onGround = true; player.rotation = 0;
  cameraX = 0; particles = [];
  lastCheckpointX = 120;
  levelData = generateLevel(b);
  gameState = 'playing';
  attempts = 1;
  levelStartTime = Date.now(); levelPausedDuration = 0;
  stats.currentBeltDeaths = 0;
  if (b > stats.maxBeltReached) {
    stats.maxBeltReached = b;
    checkAchievements();
  }
  updateHUD();
}

function startSecretLevel(idx, mode) {
  inSecret = true;
  secretIdx = idx;
  secretMode = mode;
  flightMode = false;
  pointerHeld = false;
  speed = SECRETS[idx].speed;
  player.x = 120; player.y = GROUND_Y - PLAYER_SIZE; player.vy = 0;
  player.onGround = true; player.rotation = 0;
  cameraX = 0; particles = [];
  lastCheckpointX = 120;
  levelData = generateSecretLevel(idx);
  gameState = 'playing';
  attempts = 1;
  levelStartTime = Date.now(); levelPausedDuration = 0;
  vibrate(VIBE.secret);
  updateHUD();
}

function respawn() {
  if (gameState === 'transition' || gameState === 'won' || gameState === 'won-secret' || gameState === 'menu') return;
  attempts++;
  player.x = lastCheckpointX;
  player.y = GROUND_Y - PLAYER_SIZE; player.vy = 0;
  flightMode = false;
  pointerHeld = false;
  player.onGround = true; player.rotation = 0;
  cameraX = Math.max(0, player.x - 280);
  particles = [];
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
  if (gameState === 'won' || gameState === 'won-secret') { updateParticles(); return; }
  if (gameState === 'dead') {
    deathTimer++; updateParticles();
    if (deathTimer > 55) respawn();
    return;
  }

  const jumpHeld = keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W'] || pointerHeld || jumpQueued;
  if (!flightMode && jumpHeld && player.onGround) {
    player.vy = -14.5;
    player.onGround = false;
    if (IS_MOBILE) vibrate(VIBE.jump);
  }
  jumpQueued = false;

  const wasOnGround = player.onGround;
  player.onGround = false;

  if (flightMode) {
    player.vy += jumpHeld ? -0.72 : 1.15;
    player.vy = Math.max(-8.5, Math.min(8.5, player.vy));
  } else {
    player.vy += 0.88;
    if (player.vy > 18) player.vy = 18;
  }
  const previousX = player.x;
  player.y += player.vy;
  player.x += speed;

  for (const o of levelData.obstacles) {
    if (o.type !== 'portal' || previousX + player.size > o.x || player.x + player.size <= o.x) continue;
    flightMode = o.mode === 'airplane';
    player.onGround = false;
    if (!flightMode) player.rotation = 0;
  }

  if (flightMode) {
    player.y = Math.max(12, Math.min(GROUND_Y - player.size - 12, player.y));
  }

  if (flightMode) player.rotation = 0;
  else if (!wasOnGround) player.rotation += 0.18;
  else {
    const target = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
    player.rotation += (target - player.rotation) * 0.4;
  }

  // Ground / pit
  if (!flightMode && player.y + player.size >= GROUND_Y) {
    let overPit = false;
    for (const o of levelData.obstacles) {
      if (o.type === 'pit' && player.x + player.size > o.x + 6 && player.x < o.x + o.w - 6) { overPit = true; break; }
    }
    if (!overPit) {
      player.y = GROUND_Y - player.size;
      player.vy = 0;
      player.onGround = true;
    } else if (player.y > GROUND_Y + 80) { die(); return; }
  }

  // Block landings / kills
  for (const o of levelData.obstacles) {
    if (o.type !== 'block') continue;
    if (o.x + o.w < player.x) continue;
    if (o.x > player.x + player.size) continue;
    const overlapX = player.x < o.x + o.w && player.x + player.size > o.x;
    const overlapY = player.y < o.y + o.h && player.y + player.size > o.y;
    if (!overlapX || !overlapY) continue;
    if (flightMode) { die(); return; }
    const playerBottom = player.y + player.size;
    const prevBottom = playerBottom - player.vy;
    if (player.vy >= 0 && prevBottom <= o.y + 2) {
      player.y = o.y - player.size;
      player.vy = 0;
      player.onGround = true;
    } else { die(); return; }
  }

  // Spikes (regular & pillar)
  for (const o of levelData.obstacles) {
    if (o.type !== 'spike') continue;
    if (o.x + o.w < player.x) continue;
    if (o.x > player.x + player.size) continue;
    const sb = { x: o.x + 5, y: o.y + 8, w: o.w - 10, h: o.h - 8 };
    if (player.x < sb.x + sb.w && player.x + player.size > sb.x &&
        player.y < sb.y + sb.h && player.y + player.size > sb.y) { die(); return; }
  }

  // Floating spikes (downward)
  for (const o of levelData.obstacles) {
    if (o.type !== 'fspike') continue;
    if (o.x + o.w < player.x) continue;
    if (o.x > player.x + player.size) continue;
    const sb = { x: o.x + 5, y: o.y, w: o.w - 10, h: o.h - 8 };
    if (player.x < sb.x + sb.w && player.x + player.size > sb.x &&
        player.y < sb.y + sb.h && player.y + player.size > sb.y) { die(); return; }
  }

  // Saws (circle hitbox)
  for (const o of levelData.obstacles) {
    if (o.type !== 'saw') continue;
    if (o.x + o.w < player.x) continue;
    if (o.x > player.x + player.size) continue;
    const cx = o.x + o.w/2, cy = o.y + o.h/2, r = Math.min(o.w, o.h)/2 - 3;
    const closestX = Math.max(player.x, Math.min(cx, player.x + player.size));
    const closestY = Math.max(player.y, Math.min(cy, player.y + player.size));
    const dx = cx - closestX, dy = cy - closestY;
    if (dx*dx + dy*dy < r*r) { die(); return; }
  }

  // Jump pads (boost on contact, not lethal)
  for (const o of levelData.obstacles) {
    if (o.type !== 'pad') continue;
    if (o.x + o.w < player.x) continue;
    if (o.x > player.x + player.size) continue;
    if (player.x < o.x + o.w && player.x + player.size > o.x &&
        player.y + player.size > o.y && player.y < o.y + o.h) {
      if (player.vy >= -10) {
        player.vy = -22;
        player.onGround = false;
        vibrate(VIBE.pad);
      }
    }
  }

  cameraX = player.x - 280;
  if (cameraX < 0) cameraX = 0;

  for (const cp of levelData.checkpoints) {
    if (!cp.reached && player.x > cp.x) {
      cp.reached = true;
      if (cp.x > lastCheckpointX) lastCheckpointX = cp.x;
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

// ============== Drawing ==============
function draw() {
  if (!levelData) {
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const B = getPalette();

  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, B.bg1);
  grad.addColorStop(1, B.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, GROUND_Y);

  ctx.save();
  const off = -((cameraX * 0.25) % 90);
  ctx.translate(off, 0);
  ctx.fillStyle = B.stripe;
  ctx.globalAlpha = 0.35;
  for (let i = -1; i < W / 90 + 2; i++) ctx.fillRect(i * 90, 0, 5, GROUND_Y);
  ctx.globalAlpha = 0.18;
  for (let i = -1; i < W / 90 + 2; i++) ctx.fillRect(i * 90 + 45, 60, 2, GROUND_Y - 60);
  ctx.globalAlpha = 1;
  ctx.restore();

  drawBeltMotif(B);

  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const o of levelData.obstacles) {
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
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  drawGround(B);

  if (!levelData.infinite) {
    const ex = levelData.length - cameraX;
    if (ex > -20 && ex < W + 80) {
      ctx.save();
      const pulse = 0.5 + Math.sin(frame * 0.1) * 0.5;
      ctx.fillStyle = B.accent;
      ctx.globalAlpha = 0.6 + pulse * 0.4;
      ctx.fillRect(ex, 0, 10, GROUND_Y);
      ctx.globalAlpha = 1;
      ctx.fillStyle = B.fg;
      for (let y = 0; y < GROUND_Y; y += 32) ctx.fillRect(ex, y, 10, 16);
      ctx.restore();
    }
  }

  if (gameState === 'dead')         drawDeathOverlay();
  if (gameState === 'transition')   drawTransitionOverlay();
  if (gameState === 'won')          drawWonOverlay();
  if (gameState === 'won-secret')   drawSecretWonOverlay();
}

function drawBeltMotif(B) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = B.fg;
  const cx = W * 0.78, cy = 130;
  ctx.fillRect(cx - 80, cy, 160, 18);
  ctx.fillRect(cx - 8, cy - 30, 16, 70);
  ctx.fillRect(cx - 50, cy + 18, 18, 40);
  ctx.fillRect(cx + 32, cy + 18, 18, 40);
  ctx.restore();
}

function drawPlayer(B) {
  if (flightMode) {
    drawAirplane(B);
    return;
  }
  ctx.save();
  ctx.translate(player.x + player.size/2, player.y + player.size/2);
  ctx.rotate(player.rotation);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-player.size/2 + 3, -player.size/2 + 4, player.size, player.size);
  ctx.fillStyle = B.fg;
  ctx.fillRect(-player.size/2, -player.size/2, player.size, player.size);
  ctx.strokeStyle = B.accent;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-player.size/2 + 1, -player.size/2 + 1, player.size - 2, player.size - 2);
  ctx.fillStyle = B.accent;
  ctx.fillRect(-player.size/2 + 5, -3, player.size - 10, 6);
  ctx.fillStyle = B.bg1;
  ctx.fillRect(-5, -player.size/2 + 7, 10, 6);
  ctx.fillStyle = B.fg;
  ctx.fillRect(-2, -player.size/2 + 9, 4, 3);
  ctx.restore();
}

function drawAirplane(B) {
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  ctx.rotate(Math.max(-0.35, Math.min(0.35, player.vy * 0.035)));
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-15, 7, 30, 5);
  ctx.fillStyle = B.fg;
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
  ctx.stroke();
  ctx.fillStyle = B.accent;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-7, -15);
  ctx.lineTo(-11, -14);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-11, 14);
  ctx.lineTo(-7, 15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = B.bg1;
  ctx.fillRect(6, -2, 6, 4);
  ctx.fillStyle = B.glow;
  ctx.fillRect(-17, -2, 3, 4);
  ctx.restore();
}

function drawObstacle(o, B) {
  if (o.type === 'spike') {
    drawTriUp(o, B);
  } else if (o.type === 'fspike') {
    drawTriDown(o, B);
  } else if (o.type === 'block') {
    drawBlock(o, B);
  } else if (o.type === 'saw') {
    drawSaw(o, B);
  } else if (o.type === 'pad') {
    drawPad(o, B);
  } else if (o.type === 'portal') {
    drawPortal(o, B);
  }
}

function drawPortal(o, B) {
  const color = o.mode === 'airplane' ? '#38e8ff' : '#ffe34d';
  const pulse = 0.7 + Math.sin(frame * 0.12 + o.x) * 0.3;
  ctx.save();
  ctx.globalAlpha = 0.18 * pulse;
  ctx.fillStyle = color;
  ctx.fillRect(o.x - 8, o.y - 8, o.w + 16, o.h + 8);
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(o.x + 3, o.y + 3, o.w - 6, o.h - 6);
  ctx.lineWidth = 2;
  ctx.strokeRect(o.x + 11, o.y + 11, o.w - 22, o.h - 22);
  ctx.fillStyle = color;
  ctx.font = 'bold 12px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(o.mode === 'airplane' ? 'FLY' : 'EXIT', o.x + o.w / 2, o.y + 22);
  ctx.restore();
}

function drawTriUp(o, B) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(o.x + 2, o.y + o.h + 2);
  ctx.lineTo(o.x + o.w/2 + 2, o.y + 2);
  ctx.lineTo(o.x + o.w + 2, o.y + o.h + 2);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = B.spike;
  ctx.beginPath();
  ctx.moveTo(o.x, o.y + o.h);
  ctx.lineTo(o.x + o.w/2, o.y);
  ctx.lineTo(o.x + o.w, o.y + o.h);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 1.5; ctx.stroke();

  ctx.fillStyle = B.accent;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(o.x + o.w/2, o.y + 6);
  ctx.lineTo(o.x + 7, o.y + o.h - 4);
  ctx.lineTo(o.x + o.w - 7, o.y + o.h - 4);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTriDown(o, B) {
  // Floating spike — triangle pointing DOWN, hanging in air
  ctx.save();
  // Hanging chain visual hint
  ctx.fillStyle = B.fg;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(o.x + o.w/2 - 1, 0, 2, o.y);
  ctx.globalAlpha = 1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(o.x + 2, o.y + 2);
  ctx.lineTo(o.x + o.w + 2, o.y + 2);
  ctx.lineTo(o.x + o.w/2 + 2, o.y + o.h + 2);
  ctx.closePath(); ctx.fill();

  // Body
  ctx.fillStyle = B.spike;
  ctx.beginPath();
  ctx.moveTo(o.x, o.y);
  ctx.lineTo(o.x + o.w, o.y);
  ctx.lineTo(o.x + o.w/2, o.y + o.h);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 1.5; ctx.stroke();

  // Highlight
  ctx.fillStyle = B.accent;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(o.x + 7, o.y + 4);
  ctx.lineTo(o.x + o.w - 7, o.y + 4);
  ctx.lineTo(o.x + o.w/2, o.y + o.h - 6);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBlock(o, B) {
  ctx.fillStyle = B.block;
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = B.glow;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, 5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(o.x + 2, o.y + o.h - 5, o.w - 4, 4);
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 2;
  ctx.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
  ctx.strokeStyle = B.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(o.x + 8, o.y + 8, o.w - 16, o.h - 16);
  // Center mark — repeats horizontally for wide blocks
  ctx.fillStyle = B.accent;
  const marks = Math.max(1, Math.floor(o.w / 60));
  for (let i = 0; i < marks; i++) {
    const cx = o.x + (i + 0.5) * (o.w / marks);
    ctx.fillRect(cx - 3, o.y + o.h/2 - 3, 6, 6);
  }
}

function drawSaw(o, B) {
  const cx = o.x + o.w/2, cy = o.y + o.h/2;
  const r = Math.min(o.w, o.h)/2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(frame * 0.22);
  // 8 teeth
  ctx.fillStyle = B.spike;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(r - 4, -4);
    ctx.lineTo(r + 5, 0);
    ctx.lineTo(r - 4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(Math.PI * 2 / 8);
  }
  // Hub disk
  ctx.fillStyle = B.fg;
  ctx.beginPath();
  ctx.arc(0, 0, r - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = B.accent;
  ctx.beginPath();
  ctx.arc(0, 0, r - 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = B.fg;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPad(o, B) {
  // Striped neon pad with up-arrow
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
  ctx.fillStyle = '#22cc44';
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = '#ddff44';
  for (let i = 0; i < o.w; i += 12) ctx.fillRect(o.x + i, o.y, 6, o.h);
  // Top glow
  ctx.fillStyle = '#aaffaa';
  ctx.globalAlpha = 0.6 + Math.sin(frame * 0.3 + o.x * 0.01) * 0.3;
  ctx.fillRect(o.x, o.y - 3, o.w, 3);
  ctx.globalAlpha = 1;
  // Up arrows
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
  const cx = cp.x, cy = GROUND_Y - 100;
  ctx.fillStyle = cp.reached ? B.accent : B.fg;
  ctx.fillRect(cx - 2, cy, 4, 100);
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  const wave = Math.sin(frame * 0.12 + cp.x * 0.01) * 3;
  ctx.fillStyle = cp.reached ? B.accent : B.glow;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 2);
  ctx.lineTo(cx + 36 + wave, cy + 12);
  ctx.lineTo(cx + 2, cy + 26);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = B.fg;
  ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = B.fg;
  ctx.font = 'bold 11px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(cp.reached ? '✓' : 'CP', cx + 14, cy + 18);
}

function drawGround(B) {
  ctx.fillStyle = B.floor;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = B.accent;
  ctx.fillRect(0, GROUND_Y, W, 4);
  ctx.save();
  const off = -(cameraX % 48);
  ctx.translate(off, 0);
  ctx.fillStyle = B.fg;
  ctx.globalAlpha = 0.12;
  for (let i = -1; i < W / 48 + 2; i++) ctx.fillRect(i * 48, GROUND_Y + 12, 24, H - GROUND_Y - 12);
  ctx.globalAlpha = 0.06;
  for (let i = -1; i < W / 48 + 2; i++) ctx.fillRect(i * 48 + 24, GROUND_Y + 12, 24, H - GROUND_Y - 12);
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX, 0);
  for (const o of levelData.obstacles) {
    if (o.type !== 'pit') continue;
    if (o.x + o.w < cameraX - 80) continue;
    if (o.x > cameraX + W + 80) continue;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(o.x, GROUND_Y, o.w, H - GROUND_Y);
    const lavaY = GROUND_Y + 28;
    ctx.fillStyle = '#cc1f00';
    ctx.fillRect(o.x, lavaY, o.w, H - lavaY);
    ctx.fillStyle = '#ff6a1a';
    for (let i = 0; i < o.w; i += 9) {
      const w = Math.sin((frame + i * 2) * 0.13) * 4;
      ctx.fillRect(o.x + i, lavaY + w, 5, 5);
    }
    ctx.fillStyle = B.accent;
    ctx.fillRect(o.x - 2, GROUND_Y, 3, 18);
    ctx.fillRect(o.x + o.w - 1, GROUND_Y, 3, 18);
  }
  ctx.restore();
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

// ============== HUD ==============
function updateHUD() {
  const B = getPalette();
  const nameEl = document.getElementById('beltName');
  const subEl  = document.getElementById('subtitle');
  if (inSecret) {
    nameEl.textContent = SECRETS[secretIdx].name;
    subEl.textContent = 'SECRET TRIAL';
  } else {
    nameEl.textContent = BELTS[belt].name + ' BELT';
    subEl.textContent = 'BELT ' + belt + ' OF 8';
  }
  nameEl.style.color = B.fg;
  subEl.style.color = inSecret ? '#ff4040' : B.fg;

  const bar = document.getElementById('beltBar');
  bar.innerHTML = '';
  for (let i = 1; i < BELTS.length; i++) {
    const pip = document.createElement('div');
    pip.className = 'pip' + ((!inSecret && i === belt) ? ' active' : '');
    pip.style.background = BELTS[i].bg1;
    pip.style.color = BELTS[i].bg1;
    pip.style.opacity = (i <= (inSecret ? belt : belt)) ? 1 : 0.28;
    bar.appendChild(pip);
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
refreshTrialsUI();

// ============== Loop ==============
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m + ':' + String(s % 60).padStart(2, '0');
}
function loop() {
  if (document.body.classList.contains('playing')) {
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
