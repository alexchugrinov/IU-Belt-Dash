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
    'M27 24L32 21L37 24L32 27Z M27 21L32 18L37 21',
    'M28 34L35 41 M27 40L33 47 M25 45L30 50',
  ],
  dunes: [
    'M12 38C21 27 29 29 36 38S51 41 54 30',
    'M12 47C23 38 31 39 38 46S49 49 54 43',
    'M47 18A3 3 0 1 0 47 24A3 3 0 1 0 47 18',
    'M44 17V12 M51 20L55 18 M43 22L39 24',
    'M12 53C22 49 27 51 33 54 M38 55L42 56 M47 51L52 49',
  ],
  mountain: [
    'M12 49L24 28L31 37L41 17L54 49Z',
    'M19 36L24 28L31 37 M36 27L41 17L48 35',
    'M16 45L22 34 M33 37L40 22 M45 38L50 48',
    'M17 53H49 M22 56H43',
  ],
  incense: [
    'M20 39L23 51H41L44 39Z',
    'M25 35C14 26 33 25 26 12 M38 35C49 25 32 22 40 11',
    'M18 39H46',
    'M31 34C25 28 37 26 32 20 M33 17C30 14 33 12 35 10',
    'M25 43H39 M26 47H38',
  ],
  dhow: [
    'M13 40H53L44 51H22Z',
    'M31 38V15L17 37Z M35 36V12L49 36Z',
    'M14 55C23 51 28 58 36 54S48 52 54 55',
    'M21 37L29 37 M38 35L46 35 M31 20L19 36 M35 18L47 36',
    'M17 58C24 56 29 60 35 58 M41 58L47 57',
  ],
  fort: [
    'M15 30H49V51H15Z',
    'M17 30V20H25V27H29V23H36V27H40V17H48V30',
    'M28 51V40A5 5 0 0 1 38 40V51',
    'M19 34H24V39H19Z M40 34H45V39H40Z M19 43H24V47H19Z M40 43H45V47H40Z',
    'M14 52H50 M20 15V18 M44 12V15',
  ],
  palm: [
    'M30 52L32 29L34 52',
    'M32 30C18 30 13 23 12 17C21 17 28 20 32 28',
    'M32 30C22 23 21 15 24 11C31 15 33 21 33 28',
    'M33 29C32 19 37 12 42 11C45 19 41 25 35 30',
    'M34 30C43 23 49 23 53 25C50 33 43 34 35 32',
    'M15 19L29 28 M25 13L31 27 M40 14L34 27 M50 27L36 30',
    'M28 43H35 M29 47H35',
  ],
  flag: [
    'M21 18V46 M22 20H44 M22 31H45 M22 42H45',
    'M26 51C22 46 28 43 31 47C34 51 28 54 26 51Z',
  ],
};
const SKIN_SHAPES = ['cube', 'diamond', 'circle', 'hexagon'];
const CUSTOM_SKIN_PATTERNS = ['prism', 'circuit', 'ember', 'grid', 'flare', 'crystal', 'stone', 'nebula'];
const DEFAULT_INTERFACE_THEME = { accent: '#ff526f', secondary: '#62e5db', background: '#111329' };
const RANDOM_INTERFACE_THEMES = [
  { accent: '#ff5470', secondary: '#62e5db', background: '#111329' },
  { accent: '#ffb547', secondary: '#a8f07a', background: '#172116' },
  { accent: '#b88cff', secondary: '#61e8ff', background: '#171329' },
  { accent: '#ff795e', secondary: '#ffd166', background: '#241516' },
  { accent: '#50d6b2', secondary: '#f5cf68', background: '#10231f' },
  { accent: '#f472cf', secondary: '#80a9ff', background: '#21142a' },
  { accent: '#75c9ff', secondary: '#ffcb68', background: '#101f32' },
];
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
  savedBelt: 0,          // last campaign belt started — CONTINUE resumes here
};
const savedBeltSkin = BELT_SKINS.find((skin) => skin && skin.id === selectedSkinId);
const savedSpecialSkin = SPECIAL_SKINS.find((skin) => skin.id === selectedSkinId);
if (!savedBeltSkin && !savedSpecialSkin &&
    !(secretIUUnlocked && selectedSkinId === SECRET_IU_SKIN.id) &&
    !(secretRogerUnlocked && selectedSkinId === SECRET_ROGER_SKIN.id) &&
    selectedSkinId !== 'level' && !customSkins.some((skin) => skin.id === selectedSkinId)) {
  selectedSkinId = 'level';
}

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
bindBtn('playBtnTop', enterGame);
bindBtn('playBtnNav', enterGame);
bindBtn('playBtnBottom', enterGame);
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
  ['staircase',   7, 8],
  ['orbGap',       5, 10],   // NEW: long spike field — tap the orange orb mid-air to jump again
  ['dashGap',      6, 9],    // NEW: very long spike field — hold on the green orb to dash across
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

function placePattern(obstacles, x, p, d, spd = 8) {
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
  }
  return 50;
}

// ============== Level generation ==============
// Patterns are placed one at a time. After each one the checker advances every possible
// player route past it; if no route survives, that pattern is swapped for another.
function buildLevel(opts) {
  // opts: { length, cpStep, tier, isSecret, minGap, d, spd }
  const { length, cpStep, tier, isSecret, minGap, d, spd } = opts;
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
    for (let attempt = 0; attempt < 6 && !placed; attempt++) {
      const pat = pickPattern(tier, isSecret);
      const before = obstacles.length;
      const placedW = placePattern(obstacles, x, pat, d, spd);
      for (let i = before; i < obstacles.length; i++) obstacles[i].pid = before; // pattern id
      if (hitsCpZone(x, x + placedW)) { obstacles.length = before; continue; }
      indexLevel(ld);
      const after = advanceFrontier(routes, ld, spd, x + placedW + 20);
      if (after.length) {
        routes = after;
        x += placedW + minGap + Math.random() * 80;
        placed = true;
      } else {
        obstacles.length = before;   // impossible from here — try a different pattern
        indexLevel(ld);
      }
    }
    if (!placed) x += 120;
  }
  for (const cz of cpZones) checkpoints.push({ x: cz.x, reached: false });
  return indexLevel(ld);
}

function generateLevel(b) {
  // LONGER levels — roughly 2x the previous version
  const length = 6000 + b * 1500;
  // FEWER checkpoints — wider spacing
  const cpStep = Math.max(2000, 3000 - b * 100);
  // Tighter obstacle spacing at higher belts
  const minGap = Math.max(130, 250 - b * 18);
  return buildLevel({
    length, cpStep, tier: b, isSecret: false, minGap, d: b / 8, spd: beltSpeed(b),
  });
}

function beltSpeed(b) { return 5 + b * 0.5; }

function generateSecretLevel(idx) {
  const s = SECRETS[idx];
  return buildLevel({
    length: s.length, cpStep: s.cpStep, tier: 8, isSecret: true,
    minGap: 110, d: 1.1, spd: s.speed,
  });
}

// ============== Physics (shared by the game AND the level checker) ==============
// One step = one frame. The game and the solver call the same function, so if the
// solver can beat a level, a player pressing the same inputs can too.
const DASH_FRAMES = 90;      // dash orb: max 1.5 s of straight flight (60 fps)
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
function makePlayerState(ld, x) {
  let flight = false, lastPortalX = -Infinity;
  for (const o of ld.obstacles) {
    if (o.type === 'portal' && o.x < x && o.x > lastPortalX) { lastPortalX = o.x; flight = o.mode === 'airplane'; }
  }
  return { x, y: flight ? GROUND_Y / 2 : GROUND_Y - PLAYER_SIZE, vy: 0, onGround: true, flight, used: [], dash: -1 };
}

// Advance s by one frame. held = jump button down, tapped = pressed this frame.
function stepPhysics(s, held, tapped, ld, spd) {
  const r = { dead: false, jumped: false, pad: false, orb: null, dash: null, wasOnGround: false };
  const size = PLAYER_SIZE;
  if (!s.flight && s.dash < 0 && held && s.onGround) {
    s.vy = -14.5; s.onGround = false; r.jumped = true;
  }
  r.wasOnGround = s.onGround;
  s.onGround = false;

  // Dash: straight flight while held, until released or 1.5 s pass
  if (s.dash >= 0 && !(held && s.dash < DASH_FRAMES)) s.dash = -1;
  if (s.dash >= 0) { s.dash++; s.vy = 0; }
  else if (s.flight) {
    s.vy += held ? -0.72 : 1.15;
    s.vy = Math.max(-8.5, Math.min(8.5, s.vy));
  } else {
    s.vy += 0.88;
    if (s.vy > 18) s.vy = 18;
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
  if (s.flight) s.y = Math.max(12, Math.min(GROUND_Y - size - 12, s.y));

  // Ground / pit
  if (!s.flight && s.y + size >= GROUND_Y) {
    let overPit = false;
    for (const o of near) {
      if (o.type === 'pit' && s.x + size > o.x + 6 && s.x < o.x + o.w - 6) { overPit = true; break; }
    }
    if (!overPit) { s.y = GROUND_Y - size; s.vy = 0; s.onGround = true; }
    else if (s.y > GROUND_Y + 80) { r.dead = true; return r; }
  }

  // Blocks: land on top, die on sides/bottom (always die in the plane)
  for (const o of near) {
    if (o.type !== 'block') continue;
    if (!(s.x < o.x + o.w && s.x + size > o.x && s.y < o.y + o.h && s.y + size > o.y)) continue;
    if (s.flight) { r.dead = true; return r; }
    const prevBottom = s.y + size - s.vy;
    if (s.vy >= 0 && prevBottom <= o.y + 2) { s.y = o.y - size; s.vy = 0; s.onGround = true; }
    else { r.dead = true; return r; }
  }

  for (const o of near) {
    if (o.type === 'spike' || o.type === 'fspike') {
      const sb = o.type === 'spike'
        ? { x: o.x + 5, y: o.y + 8, w: o.w - 10, h: o.h - 8 }
        : { x: o.x + 5, y: o.y,     w: o.w - 10, h: o.h - 8 };
      if (s.x < sb.x + sb.w && s.x + size > sb.x && s.y < sb.y + sb.h && s.y + size > sb.y) { r.dead = true; return r; }
    } else if (o.type === 'saw') {
      if (touchesCircle(s, o, 3)) { r.dead = true; return r; }
    }
  }

  // Jump pads
  for (const o of near) {
    if (o.type !== 'pad') continue;
    if (s.x < o.x + o.w && s.x + size > o.x && s.y + size > o.y && s.y < o.y + o.h && s.vy >= -10) {
      s.vy = -22; s.onGround = false; s.dash = -1; r.pad = true;
    }
  }

  if (!s.flight) {
    for (const o of near) {
      if ((o.type !== 'orb' && o.type !== 'dashOrb') || s.used.includes(o.oid)) continue;
      if (!touchesCircle(s, o, 0)) continue;
      // Jump orb (orange): tap while touching → full jump
      if (o.type === 'orb' && tapped && !r.jumped) {
        s.used = s.used.concat(o.oid);
        s.vy = -14.5; s.onGround = false; s.dash = -1; r.orb = o;
        break;
      }
      // Dash orb (green): hold while touching → fly straight
      if (o.type === 'dashOrb' && held && s.dash < 0) {
        s.used = s.used.concat(o.oid);
        s.dash = 0; s.vy = 0; s.onGround = false; r.dash = o;
        break;
      }
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
      const n = { x: s.x, y: s.y, vy: s.vy, onGround: s.onGround, flight: s.flight, used: s.used, dash: s.dash, prevHeld: held };
      if (stepPhysics(n, held, held && !s.prevHeld, ld, spd).dead) continue;
      const key = (n.flight ? Math.round(n.y / 4) : Math.round(n.y / 2)) + '|' + Math.round(n.vy) + '|' +
        (n.onGround ? 1 : 0) + (n.flight ? 1 : 0) + (held ? 1 : 0) + '|' +
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
  Object.assign(player, makePlayerState(levelData, x));
  flightMode = player.flight;
  player.rotation = 0;
  pointerHeld = false;
  cameraX = Math.max(0, x - 280);
  particles = [];
}

function startLevel(b) {
  inSecret = false;
  customLevelActive = false;
  activeCustomLevel = null;
  belt = b;
  pointerHeld = false;
  // Faster speed scaling with each belt
  speed = beltSpeed(b);
  levelData = generateLevel(b);
  lastCheckpointX = 120;
  resetPlayer(120);
  gameState = 'playing';
  attempts = 1;
  levelStartTime = Date.now(); levelPausedDuration = 0;
  stats.currentBeltDeaths = 0;
  stats.savedBelt = b;
  if (b > stats.maxBeltReached) {
    stats.maxBeltReached = b;
    saveSkinProgress();
    refreshSkinGallery();
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
  pointerHeld = false;
  speed = SECRETS[idx].speed;
  levelData = generateSecretLevel(idx);
  lastCheckpointX = 120;
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
  lastCheckpointX = 120;
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
  player.x = lastCheckpointX;
  player.y = GROUND_Y - PLAYER_SIZE; player.vy = 0;
  pointerHeld = false;
  player.onGround = true; player.rotation = 0;
  cameraX = Math.max(0, player.x - 280);
  particles = [];
  if (levelData) for (const o of levelData.obstacles) if (o.type === 'orb') o.used = false;
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
  const tapped = jumpQueued;
  let groundJumped = false;
  if (jumpHeld && player.onGround) {
    player.vy = -14.5;
    player.onGround = false;
    groundJumped = true;
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

  // Jump orbs: tap while touching to jump again (one use per orb)
  if (tapped && !groundJumped) {
    for (const o of levelData.obstacles) {
      if (o.type !== 'orb' || o.used) continue;
      if (o.x + o.w < player.x) continue;
      if (o.x > player.x + player.size) continue;
      const cx = o.x + o.w/2, cy = o.y + o.h/2, r = o.w/2;
      const closestX = Math.max(player.x, Math.min(cx, player.x + player.size));
      const closestY = Math.max(player.y, Math.min(cy, player.y + player.size));
      const dx = cx - closestX, dy = cy - closestY;
      if (dx*dx + dy*dy <= r*r) {
        o.used = true;
        player.vy = -14.5;
        player.onGround = false;
        vibrate(VIBE.pad);
        for (let i = 0; i < 12; i++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 2 + Math.random() * 4;
          particles.push({ x: cx, y: cy, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp,
            size: 3 + Math.random()*3, life: 1, decay: 0.04, color: '#ff9a1f' });
        }
        break;
      }
    }
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
  } else player.rotation += 0.18;

  if (res.dead) { die(); return; }
  if (res.pad) vibrate(VIBE.pad);
  if (res.orb || res.dash) {
    const o = res.orb || res.dash;
    const color = res.orb ? '#ff9a1f' : '#3dff7a';
    vibrate(VIBE.pad);
    for (let i = 0; i < 12; i++) {
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
  if (kind === 'floor') { g.fillStyle = B.floor; g.fillRect(0, 0, TEX, TEX); }
  if (kind === 'block') { g.fillStyle = B.block; g.fillRect(0, 0, TEX, TEX); }
  paintTexture(g, style, B.fg, kind === 'floor' ? B.accent : B.glow);
  pat = ctx.createPattern(c, 'repeat');
  textureCache.set(key, pat);
  return pat;
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
  switch (style) {
    case 'mats':      // training dojo mats
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        box(i * 32 + 2, j * 32 + 2, 28, 28, ink, 2, 0.25);
        dot(i * 32 + 16, j * 32 + 16, 3, hi, 0.4);
      }
      break;
    case 'tatami':    // woven straw mats
      box(1, 1, 62, 30, ink, 2, 0.3);
      box(1, 33, 30, 30, ink, 2, 0.3);
      box(33, 33, 30, 30, ink, 2, 0.3);
      for (let y = 5; y < 30; y += 4) line([[3, y], [61, y]], ink, 1, 0.1);
      for (let x = 5; x < 64; x += 4) line([[x, 35], [x, 61]], ink, 1, 0.1);
      break;
    case 'bricks':
      for (let r = 0; r < 4; r++) {
        const off = r % 2 ? 16 : 0;
        for (let bx = -32; bx < 64; bx += 32) {
          box(bx + off + 1, r * 16 + 1, 30, 14, ink, 2, 0.3);
          line([[bx + off + 3, r * 16 + 3], [bx + off + 28, r * 16 + 3]], hi, 2, 0.35);
        }
      }
      break;
    case 'planks':    // wooden floorboards
      for (let r = 0; r < 4; r++) {
        line([[0, r * 16], [64, r * 16]], ink, 2, 0.35);
        const seam = (r * 23) % 64;
        line([[seam, r * 16], [seam, r * 16 + 16]], ink, 2, 0.3);
        dot(seam + 4, r * 16 + 4, 1.5, ink, 0.5);
        dot(seam - 4, r * 16 + 12, 1.5, ink, 0.5);
        for (let k = 0; k < 2; k++) {
          const y = r * 16 + 5 + k * 6;
          line([[0, y], [20, y + 1], [40, y - 1], [64, y]], hi, 1, 0.25);
        }
      }
      break;
    case 'scales':    // jade scales
      for (let r = 0; r < 5; r++) {
        const off = r % 2 ? 16 : 0;
        for (let cx = -32; cx <= 96; cx += 32) {
          g.strokeStyle = ink; g.lineWidth = 2; g.globalAlpha = 0.3;
          g.beginPath(); g.arc(cx + off, r * 16, 16, 0, Math.PI); g.stroke();
          g.strokeStyle = hi; g.lineWidth = 1; g.globalAlpha = 0.3;
          g.beginPath(); g.arc(cx + off, r * 16, 11, 0.3, Math.PI - 0.3); g.stroke();
        }
      }
      break;
    case 'stone':     // cobblestones
      [[1, 1, 26, 18], [29, 1, 34, 22], [1, 21, 18, 22], [21, 25, 24, 18], [47, 25, 16, 20], [1, 45, 28, 18], [31, 45, 32, 18]]
        .forEach(([x, y, w, h]) => {
          g.globalAlpha = 0.3; g.strokeStyle = ink; g.lineWidth = 2;
          g.beginPath();
          if (g.roundRect) g.roundRect(x, y, w, h, 5); else g.rect(x, y, w, h);
          g.stroke();
          line([[x + 4, y + 3], [x + w - 6, y + 3]], hi, 2, 0.3);
        });
      break;
    case 'diamond':   // diagonal lattice
      for (let k = -64; k <= 64; k += 16) {
        line([[k, 0], [k + 64, 64]], ink, 1.5, 0.25);
        line([[k, 64], [k + 64, 0]], ink, 1.5, 0.25);
      }
      for (let x = 0; x <= 64; x += 16) for (let y = 0; y <= 64; y += 16) if ((x + y) % 32 === 0) dot(x, y, 2, hi, 0.5);
      break;
    case 'bamboo':
      for (let i = 0; i < 4; i++) {
        const x = i * 16;
        line([[x + 1, 0], [x + 1, 64]], ink, 2, 0.35);
        line([[x + 6, 0], [x + 6, 64]], hi, 2, 0.2);
        const ny = (i * 21 + 9) % 64;
        line([[x + 1, ny], [x + 15, ny]], ink, 3, 0.35);
        line([[x + 2, ny + 3], [x + 14, ny + 3]], hi, 1, 0.35);
      }
      break;
    case 'metal':     // riveted steel plates
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const x = i * 32, y = j * 32;
        box(x + 1, y + 1, 30, 30, ink, 2, 0.35);
        [[5, 5], [27, 5], [5, 27], [27, 27]].forEach(([dx, dy]) => dot(x + dx, y + dy, 2, hi, 0.6));
        line([[x + 8, y + 24], [x + 24, y + 8]], hi, 1, 0.2);
      }
      break;
    case 'cracks':    // glowing lava cracks
      [[[0, 10], [14, 18], [22, 12], [40, 26], [64, 10]],
       [[10, 64], [18, 44], [34, 40], [38, 26]],
       [[48, 64], [52, 48], [64, 44]],
       [[0, 44], [8, 40], [18, 44]]]
        .forEach((pts) => { line(pts, hi, 4, 0.18); line(pts, hi, 1.5, 0.55); });
      break;
    case 'stars':     // void starfield
      for (let i = 0; i < 14; i++) {
        const x = rnd() * 64, y = rnd() * 64, r = 0.6 + rnd() * 1.4;
        dot(x, y, r, hi, 0.4 + rnd() * 0.5);
      }
      line([[44, 14], [52, 14]], hi, 1, 0.5); line([[48, 10], [48, 18]], hi, 1, 0.5);
      break;
    case 'circuit':   // neon circuit traces
      [[[0, 12], [20, 12], [28, 20], [28, 40], [64, 40]],
       [[40, 0], [40, 24], [64, 24]],
       [[0, 52], [16, 52], [16, 64]],
       [[48, 64], [48, 54], [56, 46]]]
        .forEach((pts) => { line(pts, hi, 2, 0.45); const p = pts[pts.length - 1]; dot(p[0], p[1], 2.5, hi, 0.7); });
      dot(28, 30, 3, hi, 0.6);
      break;
  }
  g.globalAlpha = 1;
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

  // Background wall texture (slow parallax)
  ctx.save();
  ctx.translate(-((cameraX * 0.25) % TEX), 0);
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = getTexture('wall');
  ctx.fillRect(0, 0, W + TEX, GROUND_Y);
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
  if (gameState === 'won-custom')   drawCustomWonOverlay();
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
  if (skin.shape === 'cube') {
    ctx.beginPath();
    ctx.moveTo(-half + 2, -half + 2);
    ctx.lineTo(half * 0.62, -half + 2);
    ctx.lineTo(-half + 2, half * 0.62);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(half - 2, half - 2);
    ctx.lineTo(-half * 0.48, half - 2);
    ctx.lineTo(half - 2, -half * 0.48);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();

    const bevel = ctx.createLinearGradient(-half, -half, half, half);
    bevel.addColorStop(0, 'rgba(255,255,255,0.72)');
    bevel.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    bevel.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.strokeStyle = bevel;
    ctx.lineWidth = 1;
    drawSkinPath(skin.shape, player.size - 4);
    ctx.stroke();
  }
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
  ctx.fillStyle = 'rgba(255,244,216,0.12)';
  ctx.beginPath();
  ctx.moveTo(-12, -14);
  ctx.lineTo(-8, -14);
  ctx.lineTo(8, 14);
  ctx.lineTo(4, 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,242,206,0.72)';
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(-13.5, 0);
  ctx.lineTo(-13.5, 9);
  ctx.moveTo(13.5, -9);
  ctx.lineTo(13.5, 0);
  ctx.stroke();
  ctx.save();
  ctx.scale(1.55, 1.55);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (motif === 'khanjar') {
    ctx.fillStyle = '#fff2ce';
    ctx.beginPath();
    ctx.moveTo(-1.5, -1.5);
    ctx.lineTo(2.4, -1.5);
    ctx.bezierCurveTo(6, 1.5, 4, 6.5, -4.5, 9);
    ctx.bezierCurveTo(0, 4, -0.5, 1, -1.5, -1.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d9b866';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = '#f4c46b';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(5, -6);
    ctx.moveTo(-3, -2);
    ctx.lineTo(3, -2);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -2);
    ctx.stroke();
    ctx.strokeStyle = '#fff2ce';
    ctx.lineWidth = 0.8;
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
    ctx.fillStyle = 'rgba(245,194,107,0.24)';
    ctx.beginPath();
    ctx.arc(5, -5, 6, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = 'rgba(33,134,83,0.35)';
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-5, 1);
    ctx.lineTo(-1, 8);
    ctx.closePath();
    ctx.fill();
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
    ctx.fillStyle = 'rgba(255,242,206,0.16)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.strokeStyle = '#d9b866';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.lineTo(8, 4);
    ctx.moveTo(-5, 6);
    ctx.lineTo(5, 6);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
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
    ctx.fillStyle = '#e2c283';
    ctx.fillRect(-8, -2, 16, 10);
    ctx.fillStyle = color;
    ctx.fillRect(-7, -6, 4, 4);
    ctx.fillRect(-2, -4, 4, 2);
    ctx.fillRect(3, -7, 4, 5);
    ctx.fillStyle = '#f5f0e5';
    ctx.fillRect(-6, 0, 2, 2);
    ctx.fillRect(4, 0, 2, 2);
    ctx.fillStyle = '#172027';
    ctx.fillRect(-2, 3, 4, 5);
    ctx.fillStyle = '#d9b866';
    ctx.fillRect(-1, 5, 2, 2);
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
    ctx.strokeStyle = '#fff2ce';
    ctx.lineWidth = 0.9;
    for (const [x, y, angle] of [[-5, -2, -0.5], [-2, -5, -0.3], [3, -5, 0.25], [6, -2, 0.5]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#c82032';
    for (const [x, y] of [[-2.5, 4], [3, 6]]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
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
  } else if (o.type === 'orb' || o.type === 'dashOrb') {
    drawOrb(o);
  }
}

const ORB_COLORS = {
  orb:     { ring: '#ffb347', body: '#ff8c00', core: '#ffc266' },   // jump orb (orange)
  dashOrb: { ring: '#7dffa8', body: '#1fcc55', core: '#9dffbf' },   // dash orb (green)
};

function drawOrb(o) {
  const c = ORB_COLORS[o.type];
  const used = player.used && player.used.includes(o.oid);
  const cx = o.x + o.w/2, cy = o.y + o.h/2, r = o.w/2;
  const pulse = 0.5 + Math.sin(frame * 0.15 + o.x * 0.01) * 0.5;
  const alpha = used ? 0.3 : 1;
  ctx.save();
  // outer pulsing ring
  ctx.strokeStyle = c.ring;
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha * (0.5 + pulse * 0.4);
  ctx.beginPath(); ctx.arc(cx, cy, r + 5 + pulse * 4, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = alpha;
  // orb body
  ctx.shadowColor = c.body;
  ctx.shadowBlur = used ? 0 : 16;
  ctx.fillStyle = c.body;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c.core;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  if (o.type === 'dashOrb') {
    // forward arrow: "hold to dash"
    ctx.fillStyle = '#0a3a18';
    ctx.beginPath();
    ctx.moveTo(cx + 9, cy);
    ctx.lineTo(cx - 5, cy - 8);
    ctx.lineTo(cx - 5, cy + 8);
    ctx.closePath(); ctx.fill();
  }
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
  ctx.fillStyle = getTexture('block');
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
  // Floor texture scrolls with the world
  ctx.save();
  ctx.translate(-(cameraX % TEX), 0);
  ctx.fillStyle = getTexture('floor');
  ctx.fillRect(0, GROUND_Y, W + TEX, H - GROUND_Y);
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, GROUND_Y + 4, W, 6);
  ctx.fillStyle = B.accent;
  ctx.fillRect(0, GROUND_Y, W, 4);

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
document.getElementById('themeRandomBtn').addEventListener('click', () => {
  const choices = RANDOM_INTERFACE_THEMES.filter((theme) =>
    theme.accent !== interfaceTheme.accent ||
    theme.secondary !== interfaceTheme.secondary ||
    theme.background !== interfaceTheme.background
  );
  const theme = choices[Math.floor(Math.random() * choices.length)] || RANDOM_INTERFACE_THEMES[0];
  themeAccentInput.value = theme.accent;
  themeSecondaryInput.value = theme.secondary;
  themeBackgroundInput.value = theme.background;
  interfaceTheme = { ...theme };
  applyInterfaceTheme(interfaceTheme);
  const saved = saveSkinProgress();
  themeEditorStatus.textContent = saved ? 'RANDOM STYLE APPLIED & SAVED' : 'RANDOM STYLE APPLIED, BUT COULD NOT BE SAVED';
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
};
const CUSTOM_LEVELS_KEY = 'iuBeltDashPlayerLevels';

function openLevelEditor() {
  document.getElementById('levelEditorModal').classList.add('open');
  document.getElementById('levelEditorModal').setAttribute('aria-hidden', 'false');
  document.getElementById('editorStatus').textContent = '';
  document.getElementById('publishedLevelLink').hidden = true;
  drawEditor();
}

function closeLevelEditor() {
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
  document.getElementById('editorStatus').textContent = editorObstacles.length + ' obstacles';
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
      !Array.isArray(value.obstacles) || value.obstacles.length < 1) {
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
  return { version: 1, name, author, length: value.length, obstacles };
}

function encodeLevel(level) {
  const bytes = new TextEncoder().encode(JSON.stringify(level));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeLevel(encoded) {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error('This level link is malformed.');
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
    const link = window.location.href.split('#')[0] + '#level=' + encodeLevel(level);
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
function loop() {
  const inGame = document.body.classList.contains('playing');
  Music.setMode(inGame ? 'game' : 'menu');
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
