'use strict';
// =====================================================================
// Player skins: random drops during play, collection, equip menu.
// Depends on globals from script.js (ctx, frame, BELTS, gameState, vibrate...).
// =====================================================================

const RARITIES = {
  common:    { label: 'COMMON',    color: '#bbbbbb', weight: 50 },
  rare:      { label: 'RARE',      color: '#38a8ff', weight: 30 },
  epic:      { label: 'EPIC',      color: '#c060ff', weight: 15 },
  legendary: { label: 'LEGENDARY', color: '#ffd700', weight: 5 },
};

// body/edge/band/eye: colors (null = take from the level palette).
// pattern: how the face of the cube is decorated.
const SKINS = [
  { id: 'classic', name: 'CLASSIC', rarity: 'common',    pattern: 'band',    body: null,      edge: null,      band: null,      eye: null },
  { id: 'ember',   name: 'EMBER',   rarity: 'common',    pattern: 'band',    body: '#ff5a1f', edge: '#3a0a00', band: '#ffd08a', eye: '#3a0a00' },
  { id: 'mint',    name: 'MINT',    rarity: 'common',    pattern: 'checker', body: '#5cffb0', edge: '#0b3d2a', band: '#0b3d2a', eye: '#0b3d2a' },
  { id: 'ocean',   name: 'OCEAN',   rarity: 'common',    pattern: 'ring',    body: '#1e6cff', edge: '#a8d4ff', band: '#a8d4ff', eye: '#ffffff' },
  { id: 'bee',     name: 'BUZZ',    rarity: 'rare',      pattern: 'stripes', body: '#ffd400', edge: '#111111', band: '#111111', eye: '#111111' },
  { id: 'ninja',   name: 'NINJA',   rarity: 'rare',      pattern: 'eyes',    body: '#111111', edge: '#cc0000', band: '#cc0000', eye: '#ffffff' },
  { id: 'smile',   name: 'SUNNY',   rarity: 'rare',      pattern: 'face',    body: '#ffe34d', edge: '#3a2800', band: '#3a2800', eye: '#3a2800' },
  { id: 'crystal', name: 'CRYSTAL', rarity: 'epic',      pattern: 'diamond', body: '#9fe8ff', edge: '#2a6a9a', band: '#ffffff', eye: '#2a6a9a', glow: '#9fe8ff' },
  { id: 'void',    name: 'VOID',    rarity: 'epic',      pattern: 'eyes',    body: '#14002a', edge: '#c060ff', band: '#c060ff', eye: '#e0b0ff', glow: '#a040ff' },
  { id: 'gold',    name: 'GOLDEN',  rarity: 'legendary', pattern: 'diamond', body: '#ffd700', edge: '#a07700', band: '#fff8b0', eye: '#7a5500', glow: '#ffd700' },
  { id: 'prism',   name: 'PRISM',   rarity: 'legendary', pattern: 'band',    body: 'rainbow', edge: '#ffffff', band: '#ffffff', eye: '#111111', glow: 'rainbow' },
];

// Average one drop roll success per ~90 seconds of active play.
const SKIN_DROP_CHANCE_PER_FRAME = 1 / (90 * 60);
const SKIN_STORE_KEY = 'iuBeltDash.skins.v1';

const skinState = { owned: new Set(['classic']), selected: 'classic' };

function loadSkins() {
  try {
    const d = JSON.parse(localStorage.getItem(SKIN_STORE_KEY) || '{}');
    if (Array.isArray(d.owned)) {
      for (const id of d.owned) if (SKINS.some((s) => s.id === id)) skinState.owned.add(id);
    }
    if (typeof d.selected === 'string' && skinState.owned.has(d.selected)) skinState.selected = d.selected;
  } catch (e) { /* storage unavailable — keep defaults */ }
}

function saveSkins() {
  try {
    localStorage.setItem(SKIN_STORE_KEY, JSON.stringify({ owned: [...skinState.owned], selected: skinState.selected }));
  } catch (e) { /* ignore */ }
}

function currentSkin() {
  return SKINS.find((s) => s.id === skinState.selected) || SKINS[0];
}

// Resolves a skin's colors against the level palette (B) and the current frame.
function skinColors(skin, B, t) {
  const rainbow = 'hsl(' + ((t * 3) % 360) + ',90%,55%)';
  const pick = (v, fallback) => v === 'rainbow' ? rainbow : (v || fallback);
  return {
    body: pick(skin.body, B.fg),
    edge: pick(skin.edge, B.accent),
    band: pick(skin.band, B.accent),
    eye:  pick(skin.eye, B.bg1),
    glow: skin.glow ? pick(skin.glow) : null,
  };
}

// Draws the cube face centered at (0,0) on context c.
function drawSkinCube(c, size, skin, B, t) {
  const k = skinColors(skin, B, t);
  const h = size / 2;
  c.save();
  if (k.glow) {
    c.shadowColor = k.glow;
    c.shadowBlur = 10 + Math.sin(t * 0.12) * 5;
  }
  c.fillStyle = k.body;
  c.fillRect(-h, -h, size, size);
  c.shadowBlur = 0;
  c.strokeStyle = k.edge;
  c.lineWidth = size * 0.075;
  c.strokeRect(-h + 1, -h + 1, size - 2, size - 2);

  const u = size / 34;   // patterns are designed on the 34px game cube
  c.fillStyle = k.band;
  switch (skin.pattern) {
    case 'band':
      c.fillRect(-h + 5 * u, -3 * u, size - 10 * u, 6 * u);
      c.fillStyle = k.eye;
      c.fillRect(-5 * u, -h + 7 * u, 10 * u, 6 * u);
      c.fillStyle = k.body;
      c.fillRect(-2 * u, -h + 9 * u, 4 * u, 3 * u);
      break;
    case 'checker':
      c.fillRect(-13 * u, -13 * u, 12 * u, 12 * u);
      c.fillRect(1 * u, 1 * u, 12 * u, 12 * u);
      break;
    case 'ring':
      c.lineWidth = 3 * u;
      c.strokeStyle = k.band;
      c.strokeRect(-9 * u, -9 * u, 18 * u, 18 * u);
      c.fillStyle = k.eye;
      c.fillRect(-3 * u, -3 * u, 6 * u, 6 * u);
      break;
    case 'stripes':
      for (let i = -1; i <= 1; i++) c.fillRect(-h + 3 * u, i * 9 * u - 2 * u, size - 6 * u, 4 * u);
      break;
    case 'eyes':
      c.fillRect(-h + 3 * u, -7 * u, size - 6 * u, 9 * u);
      c.fillStyle = k.eye;
      c.fillRect(-9 * u, -5 * u, 6 * u, 4 * u);
      c.fillRect(3 * u, -5 * u, 6 * u, 4 * u);
      break;
    case 'face':
      c.fillRect(-8 * u, -8 * u, 5 * u, 5 * u);
      c.fillRect(3 * u, -8 * u, 5 * u, 5 * u);
      c.fillRect(-9 * u, 3 * u, 3 * u, 3 * u);
      c.fillRect(6 * u, 3 * u, 3 * u, 3 * u);
      c.fillRect(-7 * u, 6 * u, 14 * u, 3 * u);
      break;
    case 'diamond':
      c.beginPath();
      c.moveTo(0, -10 * u); c.lineTo(10 * u, 0); c.lineTo(0, 10 * u); c.lineTo(-10 * u, 0);
      c.closePath(); c.fill();
      c.fillStyle = k.eye;
      c.fillRect(-2 * u, -2 * u, 4 * u, 4 * u);
      break;
  }
  c.restore();
}

// ============== Random drops ==============
function pickDropSkin() {
  const pool = SKINS.filter((s) => !skinState.owned.has(s.id));
  if (!pool.length) return null;
  let total = 0;
  for (const s of pool) total += RARITIES[s.rarity].weight;
  let r = Math.random() * total;
  for (const s of pool) {
    r -= RARITIES[s.rarity].weight;
    if (r <= 0) return s;
  }
  return pool[pool.length - 1];
}

// Called every frame of active play from update().
function maybeDropSkin() {
  if (Math.random() >= SKIN_DROP_CHANCE_PER_FRAME) return;
  const skin = pickDropSkin();
  if (!skin) return;
  skinState.owned.add(skin.id);
  skinState.selected = skin.id;   // equip right away so the player sees it
  saveSkins();
  showSkinToast(skin);
  vibrate(VIBE.achievement);
  // celebratory burst around the player
  const k = skinColors(skin, getPalette(), frame);
  for (let i = 0; i < 30; i++) {
    const ang = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
    particles.push({
      x: player.x + player.size / 2, y: player.y + player.size / 2,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 3,
      size: 3 + Math.random() * 5, life: 1, decay: 0.022,
      color: i % 2 ? k.body : RARITIES[skin.rarity].color,
    });
  }
}

function showSkinToast(skin) {
  const el = document.getElementById('skinToast');
  const r = RARITIES[skin.rarity];
  el.style.setProperty('--rarity', r.color);
  document.getElementById('skinToastName').textContent = skin.name;
  document.getElementById('skinToastRarity').textContent = r.label;
  const cv = document.getElementById('skinToastPreview');
  paintSkinPreview(cv, skin);
  el.classList.add('show');
  clearTimeout(showSkinToast._t);
  showSkinToast._t = setTimeout(() => el.classList.remove('show'), 3500);
}

// ============== Skins menu ==============
const PREVIEW_PALETTE = BELTS[8];   // black belt palette: white cube, red trim

function paintSkinPreview(cv, skin) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  c.save();
  c.translate(cv.width / 2, cv.height / 2);
  drawSkinCube(c, cv.width * 0.56, skin, PREVIEW_PALETTE, 40);
  c.restore();
}

function refreshSkinsUI() {
  const grid = document.getElementById('skinGrid');
  grid.innerHTML = '';
  for (const s of SKINS) {
    const owned = skinState.owned.has(s.id);
    const r = RARITIES[s.rarity];
    const card = document.createElement('button');
    card.className = 'skin-card' + (owned ? '' : ' locked') + (s.id === skinState.selected ? ' selected' : '');
    card.style.setProperty('--rarity', r.color);
    card.disabled = !owned;
    if (owned) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 64;
      paintSkinPreview(cv, s);
      card.appendChild(cv);
    } else {
      const q = document.createElement('div');
      q.className = 'skin-lock';
      q.textContent = '?';
      card.appendChild(q);
    }
    const name = document.createElement('div');
    name.className = 'skin-name';
    name.textContent = owned ? s.name : '???';
    const rar = document.createElement('div');
    rar.className = 'skin-rarity';
    rar.textContent = s.id === skinState.selected ? 'EQUIPPED' : r.label;
    card.append(name, rar);
    if (owned) {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        skinState.selected = s.id;
        saveSkins();
        refreshSkinsUI();
      });
    }
    grid.appendChild(card);
  }
  document.getElementById('skinCount').textContent =
    skinState.owned.size + ' / ' + SKINS.length + ' COLLECTED';
}

function openSkins() {
  refreshSkinsUI();
  document.getElementById('skinsModal').hidden = false;
}

document.getElementById('skinsBtn').addEventListener('click', (e) => { e.preventDefault(); openSkins(); });
document.getElementById('skinsCloseBtn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('skinsModal').hidden = true;
});
window.addEventListener('keydown', (e) => {
  const m = document.getElementById('skinsModal');
  if (e.key === 'Escape' && !m.hidden) m.hidden = true;
});

loadSkins();
