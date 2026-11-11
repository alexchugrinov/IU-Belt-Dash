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

const BELT_SKINS = [
  null,
  { id:'belt-1', name:'MUSCAT PEARL', main:'#eee8d8', accent:'#bd9a55', shape:'cube', pattern:'prism', omanMotif:'khanjar', unlockBelt:1 },
  { id:'belt-2', name:'WAHIBA DUNE', main:'#d4a449', accent:'#ffe1a0', shape:'cube', pattern:'circuit', omanMotif:'dunes', unlockBelt:2 },
  { id:'belt-3', name:'LUBAN EMBER', main:'#bc552c', accent:'#f4c46b', shape:'cube', pattern:'ember', omanMotif:'incense', unlockBelt:3 },
  { id:'belt-4', name:'JABAL AKHDAR', main:'#27845c', accent:'#a8dfb5', shape:'cube', pattern:'grid', omanMotif:'mountain', unlockBelt:4 },
  { id:'belt-5', name:'KHANJAR RUBY', main:'#c51f32', accent:'#fff0df', shape:'cube', pattern:'flare', omanMotif:'khanjar', unlockBelt:5 },
  { id:'belt-6', name:'ARABIAN SEA', main:'#267f9a', accent:'#b9e8e4', shape:'cube', pattern:'crystal', omanMotif:'dhow', unlockBelt:6 },
  { id:'belt-7', name:'NIZWA FORT', main:'#9b6949', accent:'#f1c27d', shape:'cube', pattern:'stone', omanMotif:'fort', unlockBelt:7 },
  { id:'belt-8', name:'MUSCAT NIGHT', main:'#211b2a', accent:'#e4b85e', shape:'cube', pattern:'nebula', omanMotif:'incense', unlockBelt:8 },
];
const SPECIAL_SKINS = [
  { id:'bonus-green', name:'OMAN PALM', main:'#287d50', accent:'#d7e8ad', shape:'cube', pattern:'grid', omanMotif:'palm', unlockBelt:3 },
  { id:'bonus-yellow', name:'GOLDEN KHANJAR', main:'#d1a42f', accent:'#fff0a8', shape:'cube', pattern:'circuit', omanMotif:'khanjar', unlockBelt:5 },
  { id:'bonus-orange', name:'LUBAN GLOW', main:'#c66b35', accent:'#ffe0a0', shape:'cube', pattern:'ember', omanMotif:'incense', unlockBelt:7 },
];
const SECRET_IU_SKIN = {
  id: 'secret-iu',
  name: 'IU OMAN',
  main: '#9e1725',
  accent: '#f5e8ce',
  shape: 'cube',
  pattern: 'iu',
  unlockBelt: 1,
};
const SECRET_ROGER_SKIN = {
  id: 'secret-roger',
  name: 'OMANI ROGER',
  main: '#182b35',
  accent: '#e8c76b',
  shape: 'cube',
  pattern: 'roger',
  unlockBelt: 1,
};
const OMAN_SKIN_ART = {
  khanjar: [
    'M18 18H46 M32 18V29 M24 29H40 M32 28C50 37 42 53 24 53C34 44 31 37 32 28Z',
    'M22 18L26 13H38L42 18',
  ],
  dunes: [
    'M12 38C21 27 29 29 36 38S51 41 54 30',
    'M12 47C23 38 31 39 38 46S49 49 54 43',
    'M47 18A3 3 0 1 0 47 24A3 3 0 1 0 47 18',
  ],
  mountain: [
    'M12 49L24 28L31 37L41 17L54 49Z',
    'M19 36L24 28L31 37 M36 27L41 17L48 35',
  ],
  incense: [
    'M20 39L23 51H41L44 39Z',
    'M25 35C14 26 33 25 26 12 M38 35C49 25 32 22 40 11',
    'M18 39H46',
  ],
  dhow: [
    'M13 40H53L44 51H22Z',
    'M31 38V15L17 37Z M35 36V12L49 36Z',
    'M14 55C23 51 28 58 36 54S48 52 54 55',
  ],
  fort: [
    'M15 30H49V51H15Z',
    'M17 30V20H25V27H29V23H36V27H40V17H48V30',
    'M28 51V40A5 5 0 0 1 38 40V51',
  ],
  palm: [
    'M30 52L32 29L34 52',
    'M32 30C18 30 13 23 12 17C21 17 28 20 32 28',
    'M32 30C22 23 21 15 24 11C31 15 33 21 33 28',
    'M33 29C32 19 37 12 42 11C45 19 41 25 35 30',
    'M34 30C43 23 49 23 53 25C50 33 43 34 35 32',
  ],
  flag: [
    'M21 18V46 M22 20H44 M22 31H45 M22 42H45',
    'M26 51C22 46 28 43 31 47C34 51 28 54 26 51Z',
  ],
};
const SKIN_SHAPES = ['cube', 'diamond', 'circle', 'hexagon'];
const CUSTOM_SKIN_PATTERNS = ['prism', 'circuit', 'ember', 'grid', 'flare', 'crystal', 'stone', 'nebula'];
const DEFAULT_INTERFACE_THEME = { accent: '#ff526f', secondary: '#62e5db', background: '#111329' };
const SKIN_STORAGE_KEY = 'iuBeltDashSkins';
const LEGACY_ANIMAL_SKIN_IDS = ['special-chameleon', 'special-lion', 'special-leopard'];

function reportSkinStorageError(action, error) {
  console.error('Could not ' + action + ' skin data:', error);
  const status = document.getElementById('skinEditorStatus');
  if (status) {
    status.textContent = action === 'load' ? 'Saved skin data could not be loaded.' : 'Skin data could not be saved.';
    status.dataset.state = 'error';
  }
}

function loadSkinSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SKIN_STORAGE_KEY) || '{}');
    const customSkins = Array.isArray(saved.customSkins) ? saved.customSkins.filter((skin) =>
      skin && typeof skin.name === 'string' && skin.name.trim() &&
      /^#[0-9a-f]{6}$/i.test(skin.main) && /^#[0-9a-f]{6}$/i.test(skin.accent) &&
      SKIN_SHAPES.includes(skin.shape)
    ).map((skin, index) => ({
      id: typeof skin.id === 'string' && skin.id ? skin.id : 'custom-saved-' + index,
      name: skin.name.trim().slice(0, 16),
      main: skin.main,
      accent: skin.accent,
      shape: skin.shape,
      pattern: CUSTOM_SKIN_PATTERNS.includes(skin.pattern) ? skin.pattern : 'prism',
    })) : [];
    const savedTheme = saved.theme && typeof saved.theme === 'object' ? saved.theme : {};
    return {
      maxBeltReached: Number.isInteger(saved.maxBeltReached) ? Math.max(0, Math.min(8, saved.maxBeltReached)) : 0,
      selectedSkinId: LEGACY_ANIMAL_SKIN_IDS.includes(saved.selectedSkinId)
        ? 'level'
        : typeof saved.selectedSkinId === 'string' ? saved.selectedSkinId : 'level',
      customSkins,
      secretIUUnlocked: saved.secretIUUnlocked === true,
      secretRogerUnlocked: saved.secretRogerUnlocked === true,
      theme: {
        accent: /^#[0-9a-f]{6}$/i.test(savedTheme.accent) ? savedTheme.accent : DEFAULT_INTERFACE_THEME.accent,
        secondary: /^#[0-9a-f]{6}$/i.test(savedTheme.secondary) ? savedTheme.secondary : DEFAULT_INTERFACE_THEME.secondary,
        background: /^#[0-9a-f]{6}$/i.test(savedTheme.background) ? savedTheme.background : DEFAULT_INTERFACE_THEME.background,
      },
    };
  } catch (error) {
    reportSkinStorageError('load', error);
    return {
      maxBeltReached: 0,
      selectedSkinId: 'level',
      customSkins: [],
      secretIUUnlocked: false,
      secretRogerUnlocked: false,
      theme: { ...DEFAULT_INTERFACE_THEME },
    };
  }
}

const skinSave = loadSkinSave();
let selectedSkinId = skinSave.selectedSkinId;
const customSkins = skinSave.customSkins;
let secretIUUnlocked = skinSave.secretIUUnlocked;
let secretRogerUnlocked = skinSave.secretRogerUnlocked;
let interfaceTheme = skinSave.theme;

function saveSkinProgress() {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify({
      maxBeltReached: stats.maxBeltReached,
      selectedSkinId,
      customSkins,
      secretIUUnlocked,
      secretRogerUnlocked,
      theme: interfaceTheme,
    }));
    return true;
  } catch (error) {
    reportSkinStorageError('save', error);
    return false;
  }
}

function getPlayerSkin() {
  if (selectedSkinId === 'level') return BELT_SKINS[belt] || BELT_SKINS[1];
  return customSkins.find((skin) => skin.id === selectedSkinId) ||
    BELT_SKINS.find((skin) => skin && skin.id === selectedSkinId) ||
    SPECIAL_SKINS.find((skin) => skin.id === selectedSkinId) ||
    (secretIUUnlocked && selectedSkinId === SECRET_IU_SKIN.id ? SECRET_IU_SKIN : null) ||
    (secretRogerUnlocked && selectedSkinId === SECRET_ROGER_SKIN.id ? SECRET_ROGER_SKIN : null) ||
    BELT_SKINS[Math.max(1, Math.min(stats.maxBeltReached, BELT_SKINS.length - 1))] ||
    BELT_SKINS[1];
}

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
  maxBeltReached: skinSave.maxBeltReached,
  totalDeaths: 0,
  currentBeltDeaths: 0,
  flawlessBeltAchieved: false,
  unlockedSecrets: new Set(),
  achievements: new Set(),
};
const savedBeltSkin = BELT_SKINS.find((skin) => skin && skin.id === selectedSkinId);
const savedSpecialSkin = SPECIAL_SKINS.find((skin) => skin.id === selectedSkinId);
if (!savedBeltSkin && !savedSpecialSkin &&
    !(secretIUUnlocked && selectedSkinId === SECRET_IU_SKIN.id) &&
    !(secretRogerUnlocked && selectedSkinId === SECRET_ROGER_SKIN.id) &&
    selectedSkinId !== 'level' && !customSkins.some((skin) => skin.id === selectedSkinId)) {
  selectedSkinId = 'level';
}

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
const keys = {}; let jumpQueued = false, pointerHeld = false;

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
    if (!keys[e.key]) jumpQueued = true;
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
  jumpQueued = true;
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
bindBtn('playBtnNav', enterGame);
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
    saveSkinProgress();
    refreshSkinGallery();
    checkAchievements();
  }
  updateHUD();
}

function startSecretLevel(idx, mode) {
  inSecret = true;
  secretIdx = idx;
  secretMode = mode;
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
  if (jumpHeld && player.onGround) {
    player.vy = -14.5;
    player.onGround = false;
    if (IS_MOBILE) vibrate(VIBE.jump);
  }
  jumpQueued = false;

  const wasOnGround = player.onGround;
  player.onGround = false;

  player.vy += 0.88;
  if (player.vy > 18) player.vy = 18;
  player.y += player.vy;
  player.x += speed;

  if (!wasOnGround) player.rotation += 0.18;
  else {
    const target = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
    player.rotation += (target - player.rotation) * 0.4;
  }

  // Ground / pit
  if (player.y + player.size >= GROUND_Y) {
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
  if (gameState === 'playing' || gameState === 'transition' || gameState === 'paused') drawPlayer();

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

function drawPlayer() {
  const skin = getPlayerSkin();
  ctx.save();
  ctx.translate(player.x + player.size/2, player.y + player.size/2);
  ctx.rotate(player.rotation);
  drawSkinAccessories(skin);
  drawSkinBody(skin);
  ctx.shadowColor = skin.accent;
  ctx.shadowBlur = 7;
  ctx.strokeStyle = skin.accent;
  ctx.lineWidth = 2;
  drawSkinPath(skin.shape, player.size - 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  drawSkinPath(skin.shape, player.size - 7);
  ctx.stroke();
  ctx.restore();
}

function drawSkinAccessories(skin) {
  const half = player.size / 2;
  if (skin.pattern === 'roger') return;
  if (skin.pattern === 'lion') {
    const mane = ctx.createLinearGradient(-half * 1.4, -half * 1.4, half * 1.2, half * 1.4);
    mane.addColorStop(0, '#ffdc72');
    mane.addColorStop(0.65, '#d77b32');
    mane.addColorStop(1, '#713319');
    ctx.fillStyle = mane;
    ctx.beginPath();
    ctx.moveTo(-half * 1.25, -half * 0.9);
    ctx.lineTo(-half * 1.35, -half * 1.35);
    ctx.lineTo(-half * 0.75, -half * 1.2);
    ctx.lineTo(-half * 0.35, -half * 1.45);
    ctx.lineTo(0, -half * 1.2);
    ctx.lineTo(half * 0.45, -half * 1.45);
    ctx.lineTo(half * 0.8, -half * 1.15);
    ctx.lineTo(half * 1.3, -half * 1.3);
    ctx.lineTo(half * 1.2, -half * 0.7);
    ctx.lineTo(half * 1.45, -half * 0.35);
    ctx.lineTo(half * 1.2, 0);
    ctx.lineTo(half * 1.45, half * 0.45);
    ctx.lineTo(half * 1.15, half * 0.8);
    ctx.lineTo(half * 1.3, half * 1.3);
    ctx.lineTo(half * 0.65, half * 1.18);
    ctx.lineTo(half * 0.25, half * 1.45);
    ctx.lineTo(-half * 0.15, half * 1.2);
    ctx.lineTo(-half * 0.6, half * 1.45);
    ctx.lineTo(-half * 0.9, half * 1.15);
    ctx.lineTo(-half * 1.35, half * 1.25);
    ctx.lineTo(-half * 1.18, half * 0.65);
    ctx.lineTo(-half * 1.45, half * 0.25);
    ctx.lineTo(-half * 1.2, -half * 0.2);
    ctx.lineTo(-half * 1.45, -half * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#713319';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,226,139,0.72)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 2 * i / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * half * 0.95, Math.sin(angle) * half * 0.95);
      ctx.lineTo(Math.cos(angle) * half * 1.35, Math.sin(angle) * half * 1.35);
      ctx.stroke();
    }
  } else if (skin.pattern === 'chameleon' || skin.pattern === 'leopard') {
    const tailColor = skin.pattern === 'chameleon' ? '#54ba43' : '#c58a38';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (skin.pattern === 'chameleon') {
      ctx.strokeStyle = '#387e35';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-half * 0.42, half * 0.52);
      ctx.lineTo(-half * 0.82, half * 0.9);
      ctx.lineTo(-half * 1.15, half * 0.86);
      ctx.moveTo(half * 0.42, half * 0.52);
      ctx.lineTo(half * 0.82, half * 0.9);
      ctx.lineTo(half * 1.15, half * 0.86);
      ctx.stroke();
      ctx.fillStyle = '#baff45';
      for (const x of [-half * 1.15, half * 1.15]) {
        ctx.beginPath();
        ctx.ellipse(x, half * 0.86, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = '#26321e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-half * 0.55, half * 0.3);
    if (skin.pattern === 'chameleon') {
      ctx.bezierCurveTo(-half * 1.3, half * 0.55, -half * 1.72, half * 1.25, -half * 1.95, half * 0.9);
      ctx.bezierCurveTo(-half * 2.18, half * 0.55, -half * 1.72, half * 0.3, -half * 1.5, half * 0.65);
      ctx.bezierCurveTo(-half * 1.34, half * 0.9, -half * 1.62, half * 1.03, -half * 1.72, half * 0.82);
    } else {
      ctx.bezierCurveTo(-half * 1.25, half * 0.7, -half * 1.55, half * 1.3, -half * 1.85, half * 0.9);
      ctx.bezierCurveTo(-half * 2.1, half * 0.45, -half * 1.55, half * 0.15, -half * 1.4, half * 0.6);
    }
    ctx.stroke();
    ctx.strokeStyle = tailColor;
    ctx.lineWidth = 5;
    ctx.stroke();
    if (skin.pattern === 'leopard') {
      ctx.fillStyle = '#f6d381';
      for (const [x, y] of [[-25, 16], [-35, 18]]) {
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (skin.pattern === 'lion' || skin.pattern === 'leopard') {
    ctx.fillStyle = skin.pattern === 'lion' ? '#d98a39' : skin.main;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * half * 0.15, -half * 0.72);
      ctx.lineTo(side * half * 0.32, -half * 1.28);
      ctx.lineTo(side * half * 0.9, -half * 1.12);
      ctx.lineTo(side * half * 1.02, -half * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = skin.accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = skin.pattern === 'lion' ? '#f5ae5b' : '#f6c39a';
      ctx.beginPath();
      ctx.moveTo(side * half * 0.36, -half * 0.78);
      ctx.lineTo(side * half * 0.43, -half * 1.08);
      ctx.lineTo(side * half * 0.77, -half * 1.01);
      ctx.lineTo(side * half * 0.83, -half * 0.64);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = skin.pattern === 'lion' ? '#d98a39' : skin.main;
    }
  }

}

function drawSkinPath(shape, size) {
  const half = size / 2;
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(0, 0, half, 0, Math.PI * 2);
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -half);
    ctx.lineTo(half, 0);
    ctx.lineTo(0, half);
    ctx.lineTo(-half, 0);
    ctx.closePath();
  } else if (shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i - Math.PI / 6;
      const x = Math.cos(angle) * half;
      const y = Math.sin(angle) * half;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else {
    ctx.rect(-half, -half, size, size);
  }
}

function drawSkinBody(skin) {
  const half = player.size / 2;
  const gradient = ctx.createLinearGradient(-half, -half, half, half);
  gradient.addColorStop(0, skin.accent);
  gradient.addColorStop(0.28, skin.main);
  gradient.addColorStop(1, skin.main);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = gradient;
  drawSkinPath(skin.shape, player.size);
  ctx.fill();
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  drawSkinPath(skin.shape, player.size - 2);
  ctx.clip();
  if (skin.omanMotif) drawOmanFlagBase(half);
  if (skin.pattern === 'roger') {
    ctx.save();
    ctx.strokeStyle = '#f7eedc';
    ctx.fillStyle = '#f7eedc';
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.lineTo(8, 14);
    ctx.moveTo(8, 7);
    ctx.lineTo(-8, 14);
    ctx.stroke();
    for (const [x, y] of [[-8, 7], [8, 7], [-8, 14], [8, 14]]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(0, -3, 6.2, 6.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-4.3, 1, 8.6, 3.2);
    ctx.fillStyle = '#211829';
    ctx.beginPath();
    ctx.ellipse(-2.3, -3, 1.7, 2.1, 0, 0, Math.PI * 2);
    ctx.ellipse(2.3, -3, 1.7, 2.1, 0, 0, Math.PI * 2);
    ctx.moveTo(0.8, -0.5);
    ctx.lineTo(-0.8, -0.5);
    ctx.lineTo(0, 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#211829';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-2.6, 1.7);
    ctx.lineTo(-2.6, 3.6);
    ctx.moveTo(0, 1.7);
    ctx.lineTo(0, 3.6);
    ctx.moveTo(2.6, 1.7);
    ctx.lineTo(2.6, 3.6);
    ctx.stroke();
    ctx.restore();
  } else if (skin.pattern === 'iu') {
    ctx.fillStyle = 'rgba(7,8,28,0.8)';
    ctx.fillRect(-half * 0.58, -half * 0.42, half * 1.16, half * 0.84);
    ctx.strokeStyle = skin.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(-half * 0.58, -half * 0.42, half * 1.16, half * 0.84);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = skin.accent;
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#e9ffff';
    ctx.fillStyle = '#e9ffff';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(-2.2, -2.6);
    ctx.lineTo(-2.5, -4.5);
    ctx.quadraticCurveTo(-2.5, -7, 0, -7);
    ctx.quadraticCurveTo(2.5, -7, 2.5, -4.5);
    ctx.lineTo(2.2, -2.4);
    ctx.lineTo(1.4, -1.6);
    ctx.lineTo(-1.4, -1.6);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#25194e';
    ctx.beginPath();
    ctx.arc(-1.25, -4.3, 0.72, 0, Math.PI * 2);
    ctx.arc(1.25, -4.3, 0.72, 0, Math.PI * 2);
    ctx.moveTo(0.35, -2.9);
    ctx.lineTo(-0.35, -2.9);
    ctx.lineTo(0, -3.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e9ffff';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(0, -1.5);
    ctx.lineTo(0, 7.7);
    ctx.moveTo(-4.6, 1);
    ctx.quadraticCurveTo(0, -0.5, 4.6, 1);
    ctx.moveTo(-4.2, 3.2);
    ctx.quadraticCurveTo(0, 1.7, 4.2, 3.2);
    ctx.moveTo(-3.7, 5.4);
    ctx.quadraticCurveTo(0, 3.9, 3.7, 5.4);
    ctx.moveTo(-4.8, 0.8);
    ctx.lineTo(-6.2, 3.9);
    ctx.moveTo(4.8, 0.8);
    ctx.lineTo(6.2, 3.9);
    ctx.stroke();
    ctx.fillStyle = '#ffe27a';
    for (const [x, y] of [[-6.2, 3.9], [6.2, 3.9], [0, 7.8]]) {
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (skin.pattern === 'chameleon') {
    ctx.strokeStyle = 'rgba(35, 115, 49, 0.72)';
    ctx.lineWidth = 1.2;
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        const x = col * 8 + (row % 2 ? 4 : 0);
        const y = row * 8;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (skin.pattern === 'leopard') {
    for (const [x, y, radius] of [[-8,-8,3], [1,-10,2.5], [9,-5,3], [-10,1,2.5], [0,0,3.5], [9,5,2.5], [-6,9,3], [3,10,2]]) {
      ctx.fillStyle = skin.accent;
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.78, (x + y) * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6d381';
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 0.38, radius * 0.28, (x + y) * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (skin.pattern === 'leaf') {
    ctx.fillStyle = skin.accent;
    for (const [x, y, angle] of [[-8,-7,-0.6], [7,-8,0.7], [-8,7,0.5], [8,6,-0.6]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (skin.pattern === 'stone') {
    ctx.fillStyle = 'rgba(61,42,33,0.36)';
    for (const [x, y, width, height] of [[-10,-9,7,4], [1,-10,8,5], [-7,1,9,5], [5,4,8,6], [-2,10,6,3]]) {
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = 'rgba(255,231,190,0.36)';
      ctx.strokeRect(x, y, width, height);
    }
  } else if (skin.pattern === 'nebula') {
    for (const [x, y, radius] of [[-8,-8,2], [6,-7,1.5], [0,0,3], [-7,7,1.4], [8,6,2]]) {
      ctx.fillStyle = '#08090d';
      ctx.shadowColor = '#08090d';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(8,9,13,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 10, -2.6, -0.2);
    ctx.stroke();
  } else if (skin.pattern === 'flare' || skin.pattern === 'ember') {
    ctx.strokeStyle = 'rgba(8,10,15,0.82)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(2, -4);
    ctx.lineTo(9, -8);
    ctx.lineTo(5, 0);
    ctx.lineTo(12, 4);
    ctx.lineTo(3, 5);
    ctx.lineTo(0, 13);
    ctx.lineTo(-3, 5);
    ctx.lineTo(-12, 4);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, -8);
    ctx.lineTo(-2, -4);
    ctx.closePath();
    ctx.stroke();
  } else if (skin.pattern === 'prism') {
    ctx.strokeStyle = 'rgba(7,10,18,0.82)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-half + 3, -half + 4);
    ctx.lineTo(0, -half + 10);
    ctx.lineTo(half - 4, -half + 3);
    ctx.lineTo(half - 8, 1);
    ctx.lineTo(2, half - 4);
    ctx.lineTo(-half + 5, 2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -half + 10);
    ctx.lineTo(2, half - 4);
    ctx.stroke();
  } else if (skin.pattern === 'circuit') {
    ctx.strokeStyle = 'rgba(8,11,18,0.84)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'square';
    for (const [x, y, direction] of [[-10,-9,1], [10,-8,-1], [-9,10,-1], [10,9,1]]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + direction * 4, y);
      ctx.lineTo(x + direction * 4, y + (y < 0 ? 5 : -5));
      ctx.stroke();
      ctx.fillStyle = '#080b12';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(8,11,18,0.82)';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();
  } else if (skin.pattern === 'grid') {
    ctx.strokeStyle = 'rgba(5,10,12,0.78)';
    ctx.lineWidth = 1;
    for (let offset = -half + 7; offset <= half - 5; offset += 7) {
      ctx.beginPath();
      ctx.moveTo(offset, -half + 3);
      ctx.lineTo(offset, half - 3);
      ctx.moveTo(-half + 3, offset);
      ctx.lineTo(half - 3, offset);
      ctx.stroke();
    }
    ctx.fillStyle = '#050a0c';
    for (const [x, y] of [[-8,-8], [8,-8], [-8,8], [8,8]]) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  } else if (skin.pattern === 'crystal') {
    ctx.fillStyle = 'rgba(6,9,17,0.82)';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(5, -2);
    ctx.lineTo(1, 1);
    ctx.lineTo(7, 11);
    ctx.lineTo(-2, 3);
    ctx.lineTo(-6, -4);
    ctx.closePath();
    ctx.fill();
  } else if (skin.pattern !== 'plain') {
    ctx.strokeStyle = skin.pattern === 'glow' ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.48)';
    ctx.lineWidth = skin.pattern === 'glow' ? 2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(-half + 6, -half + 7);
    ctx.lineTo(half - 6, -half + 7);
    ctx.stroke();
    if (skin.pattern === 'glow') {
      ctx.fillStyle = 'rgba(102,206,255,0.82)';
      ctx.fillRect(-half + 5, half - 7, player.size - 10, 2);
    }
  }

  if (skin.omanMotif) drawOmanSkinMotif(skin.omanMotif, skin.accent);

  const volume = ctx.createLinearGradient(0, -half, 0, half);
  volume.addColorStop(0, 'rgba(255,255,255,0.2)');
  volume.addColorStop(0.42, 'rgba(255,255,255,0.015)');
  volume.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = volume;
  ctx.fillRect(-half, -half, player.size, player.size);
  ctx.restore();
  ctx.restore();
}

function drawOmanSkinMotif(motif, color) {
  ctx.save();
  if (motif === 'flag') {
    ctx.fillStyle = '#f5f0e5';
    ctx.fillRect(-7, 8, 14, 2.2);
    ctx.fillStyle = '#c82032';
    ctx.fillRect(-7, 8, 3, 6.5);
    ctx.fillRect(-4, 10.2, 11, 2.2);
    ctx.fillStyle = '#218653';
    ctx.fillRect(-4, 12.4, 11, 2.1);
    ctx.strokeStyle = '#172027';
    ctx.lineWidth = 1;
    ctx.strokeRect(-7, 8, 14, 6.5);
    ctx.restore();
    return;
  }

  ctx.fillStyle = 'rgba(11,19,24,0.94)';
  ctx.fillRect(-15, -15, 30, 30);
  ctx.strokeStyle = '#d9b866';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-15, -15, 30, 30);
  ctx.strokeStyle = '#f5f0e5';
  ctx.lineWidth = 1;
  ctx.strokeRect(-12, -12, 24, 24);
  ctx.fillStyle = '#d9b866';
  for (const [x, y] of [[-13, -13], [13, -13], [-13, 13], [13, 13]]) {
    ctx.beginPath();
    ctx.arc(x, y, 1.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(217,184,102,0.82)';
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 9, -11.5);
    ctx.lineTo(side * 7.5, -9.5);
    ctx.lineTo(side * 9, -7.5);
    ctx.moveTo(side * 9, 11.5);
    ctx.lineTo(side * 7.5, 9.5);
    ctx.lineTo(side * 9, 7.5);
    ctx.stroke();
  }
  ctx.save();
  ctx.scale(1.55, 1.55);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (motif === 'khanjar') {
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(5, -6);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -2);
    ctx.moveTo(-3, -2);
    ctx.lineTo(3, -2);
    ctx.moveTo(0, -2);
    ctx.bezierCurveTo(5, 1, 3, 7, -2, 8);
    ctx.bezierCurveTo(0, 4, 1, 1, 0, -2);
    ctx.stroke();
  } else if (motif === 'dunes') {
    ctx.beginPath();
    ctx.arc(5, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -5, 4, Math.PI * 1.12, Math.PI * 1.86);
    ctx.stroke();
    ctx.strokeStyle = '#fff2ce';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(5, -5, 4, Math.PI * 1.12, Math.PI * 1.86);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -1);
    ctx.quadraticCurveTo(-3, -6, 1, -1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.quadraticCurveTo(-3, -4, 1, 2);
    ctx.quadraticCurveTo(4, 7, 8, 0);
    ctx.moveTo(-8, 7);
    ctx.quadraticCurveTo(-3, 2, 1, 7);
    ctx.quadraticCurveTo(4, 10, 8, 5);
    ctx.stroke();
  } else if (motif === 'mountain') {
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.lineTo(-3, -2);
    ctx.lineTo(0, 2);
    ctx.lineTo(4, -7);
    ctx.lineTo(9, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f5f0e5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.lineTo(-3, -2);
    ctx.lineTo(0, 2);
    ctx.moveTo(2, -2);
    ctx.lineTo(4, -7);
    ctx.lineTo(7, 1);
    ctx.stroke();
  } else if (motif === 'incense') {
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.lineTo(-4, 8);
    ctx.lineTo(4, 8);
    ctx.lineTo(6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff2ce';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.lineTo(5, 5);
    ctx.moveTo(-4, 7);
    ctx.lineTo(4, 7);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, 3);
    ctx.bezierCurveTo(-8, -2, 1, -3, -2, -8);
    ctx.moveTo(2, 3);
    ctx.bezierCurveTo(7, -1, 0, -4, 3, -8);
    ctx.stroke();
  } else if (motif === 'dhow') {
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.lineTo(8, 4);
    ctx.lineTo(4, 8);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1, 3);
    ctx.lineTo(-1, -7);
    ctx.lineTo(-7, 2);
    ctx.closePath();
    ctx.moveTo(1, 2);
    ctx.lineTo(1, -8);
    ctx.lineTo(7, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff2ce';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1, -5);
    ctx.lineTo(-4, 1);
    ctx.moveTo(1, -6);
    ctx.lineTo(4, 1);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 9);
    ctx.quadraticCurveTo(0, 6.5, 10, 9);
    ctx.stroke();
  } else if (motif === 'fort') {
    ctx.fillRect(-8, -2, 16, 10);
    ctx.fillRect(-7, -6, 4, 4);
    ctx.fillRect(-2, -4, 4, 2);
    ctx.fillRect(3, -7, 4, 5);
    ctx.fillStyle = '#172027';
    ctx.fillRect(-2, 3, 4, 5);
  } else if (motif === 'palm') {
    ctx.beginPath();
    ctx.moveTo(-1, 8);
    ctx.lineTo(1, 8);
    ctx.lineTo(1, -1);
    ctx.moveTo(-2, 5);
    ctx.lineTo(3, 5);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-7, -1, -8, -6);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-5, -7, -3, -8);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(0, -7, 3, -8);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(7, -3, 8, -6);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function drawOmanFlagBase(half) {
  const size = half * 2;
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = '#f5f0e5';
  ctx.fillRect(-half, -half, size, size / 3);
  ctx.fillStyle = '#c82032';
  ctx.fillRect(-half, -half, size / 4, size);
  ctx.fillRect(-half + size / 4, -half + size / 3, size * 0.75, size / 3);
  ctx.fillStyle = '#218653';
  ctx.fillRect(-half + size / 4, half - size / 3, size * 0.75, size / 3);
  ctx.restore();
}

function drawSkinPattern(skin) {
  const half = player.size / 2;
  ctx.save();
  drawSkinPath(skin.shape, player.size - 5);
  ctx.clip();
  const ink = 'rgba(5,7,12,0.9)';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  if (skin.pattern === 'prism') {
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(9, -5);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 12);
    ctx.lineTo(-7, 5);
    ctx.lineTo(-9, -5);
    ctx.closePath();
    ctx.moveTo(0, -13);
    ctx.lineTo(0, 12);
    ctx.moveTo(-9, -5);
    ctx.lineTo(0, 1);
    ctx.lineTo(9, -5);
    ctx.stroke();
  } else if (skin.pattern === 'circuit') {
    ctx.beginPath();
    ctx.moveTo(-12, -9);
    ctx.lineTo(-6, -9);
    ctx.lineTo(-6, -3);
    ctx.lineTo(-3, -3);
    ctx.moveTo(12, -9);
    ctx.lineTo(7, -9);
    ctx.lineTo(7, 3);
    ctx.lineTo(3, 3);
    ctx.moveTo(-12, 9);
    ctx.lineTo(-7, 9);
    ctx.lineTo(-7, 4);
    ctx.lineTo(-3, 4);
    ctx.moveTo(12, 9);
    ctx.lineTo(6, 9);
    ctx.lineTo(6, -3);
    ctx.lineTo(3, -3);
    ctx.stroke();
    ctx.strokeRect(-3, -3, 6, 6);
    ctx.fillStyle = ink;
    for (const [x, y] of [[-12,-9], [12,-9], [-12,9], [12,9]]) {
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  } else if (skin.pattern === 'ember') {
    ctx.beginPath();
    ctx.moveTo(-10, 11);
    ctx.lineTo(-8, 2);
    ctx.lineTo(-4, 6);
    ctx.lineTo(-3, -3);
    ctx.lineTo(0, -12);
    ctx.lineTo(3, -3);
    ctx.lineTo(7, -7);
    ctx.lineTo(6, 2);
    ctx.lineTo(10, -1);
    ctx.lineTo(9, 11);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, 10);
    ctx.lineTo(0, 3);
    ctx.lineTo(4, 10);
    ctx.stroke();
  } else if (skin.pattern === 'grid') {
    ctx.strokeRect(-10, -10, 20, 20);
    ctx.strokeRect(-5, -5, 10, 10);
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-5, 0);
    ctx.moveTo(5, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -5);
    ctx.moveTo(0, 5);
    ctx.lineTo(0, 10);
    ctx.stroke();
    ctx.fillStyle = ink;
    for (const [x, y] of [[-10,-10], [10,-10], [-10,10], [10,10]]) {
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  } else if (skin.pattern === 'flare') {
    ctx.beginPath();
    for (let point = 0; point < 16; point++) {
      const angle = -Math.PI / 2 + point * Math.PI / 8;
      const radius = point % 2 === 0 ? 12 : 4.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (point === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = ink;
    ctx.fill();
  } else if (skin.pattern === 'crystal') {
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(5, -3);
    ctx.lineTo(2, 0);
    ctx.lineTo(7, 11);
    ctx.lineTo(-1, 5);
    ctx.lineTo(-5, -3);
    ctx.closePath();
    ctx.fillStyle = 'rgba(5,7,12,0.82)';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -7);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.moveTo(10, -8);
    ctx.lineTo(6, -4);
    ctx.lineTo(10, 4);
    ctx.closePath();
    ctx.stroke();
  } else if (skin.pattern === 'stone') {
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(-4, -10);
    ctx.lineTo(-2, -4);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-12, -2);
    ctx.closePath();
    ctx.moveTo(2, -10);
    ctx.lineTo(10, -8);
    ctx.lineTo(12, -1);
    ctx.lineTo(6, 2);
    ctx.lineTo(1, -3);
    ctx.closePath();
    ctx.moveTo(-8, 4);
    ctx.lineTo(-2, 1);
    ctx.lineTo(3, 5);
    ctx.lineTo(2, 11);
    ctx.lineTo(-7, 10);
    ctx.closePath();
    ctx.moveTo(7, 5);
    ctx.lineTo(12, 3);
    ctx.lineTo(11, 10);
    ctx.lineTo(5, 11);
    ctx.closePath();
    ctx.stroke();
  } else if (skin.pattern === 'nebula') {
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(0, 0, 12, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ink;
    for (const [x, y] of [[0,-11], [10,0], [0,11], [-10,0]]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 2);
      ctx.lineTo(x + 2, y);
      ctx.lineTo(x, y + 2);
      ctx.lineTo(x - 2, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawSkinFace(skin) {
  if (skin.pattern === 'chameleon') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#387e35';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.quadraticCurveTo(-8, -23, -8, -27);
    ctx.moveTo(6, -12);
    ctx.quadraticCurveTo(10, -22, 10, -26);
    ctx.stroke();

    for (const [x, y] of [[-8, -28], [10, -27]]) {
      ctx.fillStyle = '#f6ffff';
      ctx.beginPath();
      ctx.ellipse(x, y, 5.4, 5.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#387e35';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#25351f';
      ctx.beginPath();
      ctx.ellipse(x + 1.1, y + 0.3, 1.7, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 0.4, y - 1.5, 1.2, 1.2);
    }

    ctx.fillStyle = '#baff45';
    ctx.beginPath();
    ctx.ellipse(0, 3, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#387e35';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#25351f';
    ctx.beginPath();
    ctx.arc(-4, 2, 1, 0, Math.PI * 2);
    ctx.arc(4, 2, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#31542b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 8);
    ctx.quadraticCurveTo(0, 12, 5, 8);
    ctx.stroke();
    ctx.strokeStyle = '#ff7893';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(4, 9);
    ctx.quadraticCurveTo(12, 11, 14, 14);
    ctx.stroke();
    ctx.fillStyle = '#ffb0bd';
    ctx.beginPath();
    ctx.moveTo(13, 13);
    ctx.lineTo(17, 14);
    ctx.lineTo(14, 17);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (skin.pattern === 'lion' || skin.pattern === 'leopard') {
    const eyeColor = skin.pattern === 'lion' ? '#4a2718' : '#38251b';
    for (const x of [-6, 6]) {
      ctx.fillStyle = '#fffaf1';
      ctx.beginPath();
      ctx.ellipse(x, -3, 3.2, 4.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.ellipse(x + 0.6, -2.5, 1.25, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x - 0.3, -4, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = skin.pattern === 'lion' ? '#fff0bd' : '#f6d9a1';
    for (const x of [-3, 3]) {
      ctx.beginPath();
      ctx.ellipse(x, 5, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#493020';
    ctx.beginPath();
    ctx.moveTo(-2.2, 3);
    ctx.quadraticCurveTo(0, 1.5, 2.2, 3);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#493020';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 9);
    ctx.moveTo(0, 9);
    ctx.quadraticCurveTo(-3, 11, -5, 9);
    ctx.moveTo(0, 9);
    ctx.quadraticCurveTo(3, 11, 5, 9);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = 'rgba(10,18,32,0.8)';
  ctx.beginPath();
  ctx.rect(-11, -5, 22, 10);
  ctx.fill();
  ctx.strokeStyle = skin.accent;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  for (const x of [-6, 6]) {
    ctx.fillStyle = skin.pattern === 'nebula' ? '#ff8db8' : '#e9fbff';
    ctx.shadowColor = skin.accent;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.ellipse(x, -1, 2.3, 2.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.fillRect(-3, 7, 6, 1);
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
  }
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

// ============== Player skin gallery ==============
function addSkinCard(container, skin, id, description, unlocked) {
  const selected = selectedSkinId === id;
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'skin-card' + (selected ? ' selected' : '');
  card.disabled = !unlocked;
  card.dataset.skinId = id;
  card.setAttribute('aria-pressed', String(selected));
  card.setAttribute('aria-label', skin.name + (unlocked ? ', equip skin' : ', locked'));
  card.style.setProperty('--skin-main', skin.main);
  card.style.setProperty('--skin-accent', skin.accent);

  const preview = document.createElement('span');
  preview.className = 'skin-swatch ' + skin.shape + ' ' + skin.pattern +
    (skin.omanMotif ? ' oman-skin' : '');
  if (skin.omanMotif) preview.dataset.omanMotif = skin.omanMotif;
  const top = document.createElement('span');
  top.className = 'skin-swatch-top';
  const side = document.createElement('span');
  side.className = 'skin-swatch-side';
  const face = document.createElement('span');
  face.className = 'skin-swatch-front';
  if (skin.omanMotif && OMAN_SKIN_ART[skin.omanMotif]) {
    const artwork = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    artwork.classList.add('oman-motif-art');
    artwork.setAttribute('viewBox', '0 0 64 64');
    artwork.setAttribute('aria-hidden', 'true');
    const panel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    panel.setAttribute('x', '5');
    panel.setAttribute('y', '5');
    panel.setAttribute('width', '54');
    panel.setAttribute('height', '54');
    panel.setAttribute('rx', '9');
    panel.setAttribute('class', 'oman-motif-panel');
    artwork.appendChild(panel);
    for (const [index, pathData] of OMAN_SKIN_ART[skin.omanMotif].entries()) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', index === 0 ? 'oman-motif-primary' : 'oman-motif-detail');
      artwork.appendChild(path);
    }
    face.appendChild(artwork);
  }
  preview.append(top, side, face);
  const copy = document.createElement('span');
  copy.className = 'skin-card-copy';
  copy.textContent = skin.name;
  const detail = document.createElement('small');
  detail.textContent = description;
  copy.appendChild(detail);
  card.appendChild(preview);
  card.appendChild(copy);
  if (unlocked) {
    card.addEventListener('click', () => {
      selectedSkinId = id;
      const saved = saveSkinProgress();
      const status = document.getElementById('skinEditorStatus');
      if (status && saved) {
        status.textContent = skin.name + ' EQUIPPED';
        status.dataset.state = 'success';
      }
      refreshSkinGallery();
    });
  }
  container.appendChild(card);
}

function refreshSkinGallery() {
  const gallery = document.getElementById('skinGallery');
  if (!gallery) return;
  gallery.replaceChildren();

  const autoBelt = Math.max(1, Math.min(8, stats.maxBeltReached));
  addSkinCard(gallery, BELT_SKINS[autoBelt], 'level', 'AUTO · NEW EACH BELT', true);
  for (let i = 1; i < BELT_SKINS.length; i++) {
    const skin = BELT_SKINS[i];
    addSkinCard(
      gallery,
      skin,
      skin.id,
      'OMAN · ' + BELTS[skin.unlockBelt].name + ' BELT',
      true
    );
  }
  for (const skin of SPECIAL_SKINS) {
    addSkinCard(
      gallery,
      skin,
      skin.id,
      'OMAN-INSPIRED BONUS CUBE',
      true
    );
  }
  if (secretIUUnlocked) {
    addSkinCard(gallery, SECRET_IU_SKIN, SECRET_IU_SKIN.id, 'SECRET SKELETON', true);
  }
  if (secretRogerUnlocked) {
    addSkinCard(gallery, SECRET_ROGER_SKIN, SECRET_ROGER_SKIN.id, 'PIRATE SKELETON', true);
  }
  for (const skin of customSkins) addSkinCard(gallery, skin, skin.id, 'YOUR ORIGINAL SKIN', true);

  const unlockedCount = BELT_SKINS.length - 1 + SPECIAL_SKINS.length +
    (secretIUUnlocked ? 1 : 0) + (secretRogerUnlocked ? 1 : 0);
  const progress = document.getElementById('skinProgress');
  if (progress) {
    progress.textContent = 'ALL ' + unlockedCount + ' GAME SKINS UNLOCKED  ·  BELT ' +
      stats.maxBeltReached + ' / 8';
  }
  const beltProgress = document.getElementById('menuBeltProgress');
  if (beltProgress) beltProgress.textContent = 'BELT ' + Math.max(1, stats.maxBeltReached) + ' / 8';
  const skinCount = document.getElementById('menuSkinCount');
  if (skinCount) {
    skinCount.textContent = String(unlockedCount).padStart(2, '0') + ' SKINS UNLOCKED';
  }
}

function updateCustomSkinPreview() {
  const preview = document.getElementById('customSkinPreview');
  const nameInput = document.getElementById('customSkinName');
  const nameLabel = document.getElementById('customSkinPreviewName');
  if (!preview || !nameInput || !nameLabel) return;
  const shape = document.getElementById('customSkinShape').value;
  const pattern = document.getElementById('customSkinPattern').value;
  preview.className = 'custom-preview-cube ' +
    (SKIN_SHAPES.includes(shape) ? shape : 'cube') + ' pattern-' +
    (CUSTOM_SKIN_PATTERNS.includes(pattern) ? pattern : 'prism');
  preview.style.setProperty('--preview-main', document.getElementById('customSkinMain').value);
  preview.style.setProperty('--preview-accent', document.getElementById('customSkinAccent').value);
  nameLabel.textContent = nameInput.value.trim().slice(0, 16) || 'MY RUNNER';
}

function getInterfaceThemeFromInputs() {
  return {
    accent: document.getElementById('themeAccent').value,
    secondary: document.getElementById('themeSecondary').value,
    background: document.getElementById('themeBackground').value,
  };
}

function applyInterfaceTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--user-ui-accent', theme.accent);
  root.style.setProperty('--user-ui-secondary', theme.secondary);
  root.style.setProperty('--user-ui-background', theme.background);
}

function updateInterfaceThemePreview() {
  applyInterfaceTheme(getInterfaceThemeFromInputs());
}

const themeAccentInput = document.getElementById('themeAccent');
const themeSecondaryInput = document.getElementById('themeSecondary');
const themeBackgroundInput = document.getElementById('themeBackground');
const themeEditorStatus = document.getElementById('themeEditorStatus');
themeAccentInput.value = interfaceTheme.accent;
themeSecondaryInput.value = interfaceTheme.secondary;
themeBackgroundInput.value = interfaceTheme.background;
applyInterfaceTheme(interfaceTheme);

document.getElementById('customThemeForm').addEventListener('input', updateInterfaceThemePreview);
document.getElementById('customThemeForm').addEventListener('change', updateInterfaceThemePreview);
document.getElementById('customThemeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  interfaceTheme = getInterfaceThemeFromInputs();
  applyInterfaceTheme(interfaceTheme);
  const saved = saveSkinProgress();
  themeEditorStatus.textContent = saved ? 'YOUR INTERFACE STYLE IS SAVED' : 'STYLE APPLIED, BUT COULD NOT BE SAVED';
  themeEditorStatus.dataset.state = saved ? 'success' : 'error';
});
document.getElementById('themeResetBtn').addEventListener('click', () => {
  themeAccentInput.value = DEFAULT_INTERFACE_THEME.accent;
  themeSecondaryInput.value = DEFAULT_INTERFACE_THEME.secondary;
  themeBackgroundInput.value = DEFAULT_INTERFACE_THEME.background;
  interfaceTheme = { ...DEFAULT_INTERFACE_THEME };
  applyInterfaceTheme(interfaceTheme);
  const saved = saveSkinProgress();
  themeEditorStatus.textContent = saved ? 'DEFAULT STYLE RESTORED' : 'DEFAULT STYLE APPLIED, BUT COULD NOT BE SAVED';
  themeEditorStatus.dataset.state = saved ? 'success' : 'error';
});

document.getElementById('customSkinForm').addEventListener('input', updateCustomSkinPreview);
document.getElementById('customSkinForm').addEventListener('change', updateCustomSkinPreview);
updateCustomSkinPreview();

document.getElementById('customSkinForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const nameInput = document.getElementById('customSkinName');
  const name = nameInput.value.trim();
  const status = document.getElementById('skinEditorStatus');
  if (!name) {
    status.textContent = 'ENTER A NAME FOR YOUR SKIN';
    status.dataset.state = 'error';
    nameInput.focus();
    return;
  }

  const skin = {
    id: 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    name: name.slice(0, 16),
    main: document.getElementById('customSkinMain').value,
    accent: document.getElementById('customSkinAccent').value,
    shape: document.getElementById('customSkinShape').value,
    pattern: document.getElementById('customSkinPattern').value,
  };
  customSkins.push(skin);
  selectedSkinId = skin.id;
  const saved = saveSkinProgress();
  nameInput.value = '';
  status.textContent = saved ? skin.name + ' CREATED & EQUIPPED' : 'CREATED FOR THIS SESSION · SAVE FAILED';
  status.dataset.state = saved ? 'success' : 'error';
  refreshSkinGallery();
});

const siteBrand = document.querySelector('.site-brand');
let secretBrandClickCount = 0;
let secretBrandClickTimer;
if (secretIUUnlocked) siteBrand.classList.add('secret-unlocked');
siteBrand.addEventListener('click', (event) => {
  if (secretIUUnlocked) return;
  secretBrandClickCount++;
  window.clearTimeout(secretBrandClickTimer);
  secretBrandClickTimer = window.setTimeout(() => {
    secretBrandClickCount = 0;
  }, 2200);
  if (secretBrandClickCount < 5) return;

  event.preventDefault();
  window.clearTimeout(secretBrandClickTimer);
  secretBrandClickCount = 0;
  secretIUUnlocked = true;
  selectedSkinId = SECRET_IU_SKIN.id;
  siteBrand.classList.add('secret-unlocked');
  const saved = saveSkinProgress();
  refreshSkinGallery();

  const progress = document.getElementById('skinProgress');
  progress.textContent = saved
    ? 'SECRET CHARACTER IU DISCOVERED · EQUIPPED'
    : 'SECRET CHARACTER IU UNLOCKED FOR THIS SESSION · SAVE FAILED';
  progress.dataset.state = saved ? 'success' : 'error';
  const secretCard = document.querySelector('#skinGallery [data-skin-id="secret-iu"]');
  secretCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  secretCard.focus({ preventScroll: true });
});

const secretRogerButton = document.getElementById('secretRogerButton');
if (secretRogerUnlocked) {
  secretRogerButton.classList.add('secret-found');
  secretRogerButton.textContent = '☠';
  secretRogerButton.setAttribute('aria-label', 'Secret skin unlocked: Vesoliy Roger');
}
secretRogerButton.addEventListener('click', () => {
  if (secretRogerUnlocked) return;
  secretRogerUnlocked = true;
  selectedSkinId = SECRET_ROGER_SKIN.id;
  secretRogerButton.classList.add('secret-found');
  secretRogerButton.textContent = '☠';
  secretRogerButton.setAttribute('aria-label', 'Secret skin unlocked: Vesoliy Roger');
  const saved = saveSkinProgress();
  refreshSkinGallery();

  const progress = document.getElementById('skinProgress');
  progress.textContent = saved
    ? 'SECRET SKIN VESOLIY ROGER DISCOVERED · EQUIPPED'
    : 'SECRET SKIN VESOLIY ROGER UNLOCKED FOR THIS SESSION · SAVE FAILED';
  progress.dataset.state = saved ? 'success' : 'error';
  const secretCard = document.querySelector('#skinGallery [data-skin-id="secret-roger"]');
  secretCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  secretCard.focus({ preventScroll: true });
});

refreshSkinGallery();

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
