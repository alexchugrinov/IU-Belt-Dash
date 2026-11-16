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

// ============== Plane skins (one reward per belt) ==============
// Each draw(c, t) paints the plane centered at (0,0), nose pointing +x,
// within roughly ±20 × ±18 px. t = frame counter for animation.
function poly(c, pts, fill, stroke, lw) {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1.5; c.stroke(); }
}

const PLANE_SKINS = [
  { id: 'classic', name: 'CLASSIC JET', belt: 0, color: '#bbbbbb', draw: null },   // follows cube skin colors

  { id: 'gull', name: 'MUSCAT GULL', belt: 1, color: '#f4f1e8',
    draw(c, t) {
      const flap = Math.sin(t * 0.25) * 3;
      c.lineJoin = 'round';
      poly(c, [3, -2, -3, -11 - flap, -13, -14 - flap, -7, -5, -6, -1], '#cfcabd', '#55524a');
      c.beginPath(); c.ellipse(0, 0, 15, 5.5, 0, 0, Math.PI * 2);
      c.fillStyle = '#f7f4ec'; c.fill(); c.strokeStyle = '#55524a'; c.lineWidth = 1.5; c.stroke();
      poly(c, [-13, 0, -21, -6, -19, 0, -21, 6], '#f7f4ec', '#55524a');
      poly(c, [4, 1, -2, 10 + flap, -12, 13 + flap, -6, 5, -6, 2], '#ffffff', '#55524a');
      poly(c, [-9, 11 + flap, -12, 13 + flap, -8, 9 + flap], '#2a2a2a');
      poly(c, [14, -1.8, 21, 0, 14, 1.8], '#f0b030');
      c.fillStyle = '#222'; c.fillRect(9, -3, 2, 2);
    } },

  { id: 'glider', name: 'WAHIBA GLIDER', belt: 2, color: '#f5cd2f',
    draw(c, t) {
      c.lineJoin = 'round';
      poly(c, [-13, -2, -19, -13, -15, -13, -9, -2], '#d6a52c', '#5a3c08');
      c.fillStyle = '#5a3c08'; c.fillRect(-22, -14, 10, 2.5);
      c.beginPath();
      c.moveTo(19, 0); c.quadraticCurveTo(10, -7, -4, -4.5); c.lineTo(-19, -2);
      c.lineTo(-19, 1.5); c.quadraticCurveTo(2, 6, 19, 0); c.closePath();
      c.fillStyle = '#f2c53d'; c.fill(); c.strokeStyle = '#5a3c08'; c.lineWidth = 1.5; c.stroke();
      // dune stripe
      c.beginPath(); c.moveTo(-17, 0.5);
      for (let x = -17; x <= 12; x += 1) c.lineTo(x, 0.5 + Math.sin(x * 0.45 + t * 0.15) * 1.2);
      c.strokeStyle = '#c4622a'; c.lineWidth = 1.6; c.stroke();
      c.beginPath(); c.ellipse(8, -3.6, 5, 2.2, -0.1, 0, Math.PI * 2);
      c.fillStyle = '#8fdcff'; c.fill(); c.strokeStyle = '#5a3c08'; c.lineWidth = 1; c.stroke();
      poly(c, [6, 1, -1, 1, -10, 10, -5, 10], '#e0ad2f', '#5a3c08');
    } },

  { id: 'luban', name: 'LUBAN JET', belt: 3, color: '#f5b079',
    draw(c, t) {
      // frankincense smoke trail
      for (let i = 0; i < 4; i++) {
        const drift = (t * 0.6) % 7;
        c.globalAlpha = 0.45 - i * 0.1;
        c.fillStyle = '#efe4d2';
        c.beginPath();
        c.arc(-20 - i * 7 - drift, Math.sin(t * 0.1 + i) * 2, 2 + i * 0.8, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      c.lineJoin = 'round';
      poly(c, [-9, -5, -15, -13, -18, -13, -15, -5], '#b84f22', '#4a1a00');
      c.beginPath();
      c.moveTo(19, 0); c.quadraticCurveTo(12, -7, -8, -6); c.lineTo(-15, -6);
      c.lineTo(-15, 6); c.lineTo(-8, 6); c.quadraticCurveTo(12, 7, 19, 0); c.closePath();
      c.fillStyle = '#d8682e'; c.fill(); c.strokeStyle = '#4a1a00'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#f4c46b';
      c.fillRect(-6, -5.8, 2, 11.6);
      c.fillRect(-1, -6.3, 2, 12.6);
      c.beginPath(); c.arc(10, -2, 2.6, 0, Math.PI * 2);
      c.fillStyle = '#ffe9b0'; c.fill(); c.strokeStyle = '#4a1a00'; c.lineWidth = 1; c.stroke();
      poly(c, [2, 2, -10, 11, -14, 11, -6, 2], '#b84f22', '#4a1a00');
      c.fillStyle = '#ffd27a';
      c.globalAlpha = 0.7 + Math.sin(t * 0.5) * 0.3;
      c.fillRect(-18, -3, 3, 6);
      c.globalAlpha = 1;
    } },

  { id: 'falcon', name: 'JABAL FALCON', belt: 4, color: '#5cba8a',
    draw(c, t) {
      const flap = Math.sin(t * 0.3) * 4;
      c.lineJoin = 'round';
      poly(c, [2, -2, -6, -14 - flap, -13, -12 - flap, -8, -2], '#1f5a3a', '#0d2a1a');
      poly(c, [-11, -2, -21, -5, -21, 4, -11, 2], '#1f5a3a', '#0d2a1a');
      c.beginPath(); c.ellipse(0, 0, 13, 5.5, 0, 0, Math.PI * 2);
      c.fillStyle = '#2e8a5a'; c.fill(); c.strokeStyle = '#0d2a1a'; c.lineWidth = 1.5; c.stroke();
      c.beginPath(); c.ellipse(2, 2.2, 9, 2.4, 0, 0, Math.PI * 2);
      c.fillStyle = '#d6ecc8'; c.fill();
      c.beginPath(); c.arc(12, -2, 4.6, 0, Math.PI * 2);
      c.fillStyle = '#2e8a5a'; c.fill(); c.strokeStyle = '#0d2a1a'; c.stroke();
      c.beginPath(); c.moveTo(15.5, -3.5); c.quadraticCurveTo(20.5, -2.5, 17.5, 1.5); c.lineTo(15.5, 0); c.closePath();
      c.fillStyle = '#f2c230'; c.fill();
      c.fillStyle = '#ffd400'; c.beginPath(); c.arc(13, -3, 1.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111'; c.fillRect(13, -3.6, 1, 1.2);
      poly(c, [3, 0, -5, 13 + flap, -14, 10 + flap, -8, 1], '#3fa870', '#0d2a1a');
      c.strokeStyle = '#1f5a3a'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.moveTo(-1 - i * 3, 3); c.lineTo(-6 - i * 3, 11 + flap); c.stroke();
      }
    } },

  { id: 'khanjar', name: 'KHANJAR', belt: 5, color: '#ec5826',
    draw(c, t) {
      c.lineJoin = 'round';
      poly(c, [-8, -3, -14, -11, -11, -11, -4, -3], '#a3162a', '#3a0008');
      c.beginPath();
      c.moveTo(-2, -4); c.quadraticCurveTo(14, -7, 21, 5); c.quadraticCurveTo(10, 0, -2, 3); c.closePath();
      c.fillStyle = '#e6e8ef'; c.fill(); c.strokeStyle = '#4a4a55'; c.lineWidth = 1.4; c.stroke();
      // moving glint along the blade
      const g = ((t * 0.8) % 40) - 10;
      if (g > -1 && g < 17) {
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.fillRect(g, -3.5 + g * 0.18, 2, 2);
      }
      c.fillStyle = '#e0b04a'; c.fillRect(-4.5, -6, 3, 11);
      c.fillStyle = '#c51f32'; c.fillRect(-16, -3.5, 12, 7);
      c.strokeStyle = '#3a0008'; c.lineWidth = 1.2; c.strokeRect(-16, -3.5, 12, 7);
      c.fillStyle = '#e0b04a'; c.fillRect(-12.5, -3.5, 1.5, 7); c.fillRect(-8.5, -3.5, 1.5, 7);
      c.beginPath(); c.arc(-17.5, 0, 3.6, 0, Math.PI * 2);
      c.fillStyle = '#e0b04a'; c.fill(); c.strokeStyle = '#6a4a10'; c.stroke();
      poly(c, [-6, 3, -14, 12, -10, 12, -2, 3], '#c51f32', '#3a0008');
    } },

  { id: 'dhow', name: 'FLYING DHOW', belt: 6, color: '#8a93cf',
    draw(c, t) {
      c.lineJoin = 'round';
      c.fillStyle = '#5a3a1a'; c.fillRect(-1, -15, 2, 17);
      const wave = Math.sin(t * 0.3) * 1.5;
      poly(c, [1, -15, 7, -14 + wave, 1, -12], '#c51f32');
      poly(c, [-15, -1, 13, -16, 2, 0], '#f4eedd', '#6a5a40', 1.2);
      c.strokeStyle = '#267f9a'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-8, -2.5); c.lineTo(9, -11.5); c.stroke();
      c.beginPath();
      c.moveTo(-19, 1); c.lineTo(19, -1); c.quadraticCurveTo(13, 9, -12, 8); c.closePath();
      c.fillStyle = '#8a5a32'; c.fill(); c.strokeStyle = '#3a2010'; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = '#2aa0c0'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-15, 3.5); c.lineTo(15, 2); c.stroke();
      poly(c, [-4, 6, -12, 13, -6, 13, 3, 6], '#267f9a', '#103a48');
      // sea spray under the hull
      c.fillStyle = 'rgba(200,240,255,0.7)';
      for (let i = 0; i < 3; i++) c.fillRect(-14 - i * 5 - (t * 0.7 % 5), 9 + i, 2, 2);
    } },

  { id: 'fort', name: 'NIZWA FORT', belt: 7, color: '#9b7250',
    draw(c, t) {
      c.lineJoin = 'round';
      c.fillStyle = '#3a2418'; c.fillRect(-9.5, -19, 1.2, 8);
      poly(c, [-8.3, -19, -2, -17, -8.3, -15], '#c51f32');
      c.fillStyle = '#9b6949';
      for (let i = 0; i < 5; i++) c.fillRect(-14 + i * 5.5, -11.5, 3.5, 4);
      c.fillRect(-14, -8, 26, 14);
      c.strokeStyle = '#3a2418'; c.lineWidth = 1.5; c.strokeRect(-14, -8, 26, 14);
      c.strokeStyle = 'rgba(58,36,24,0.45)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(-14, -2); c.lineTo(12, -2); c.moveTo(-14, 3); c.lineTo(12, 3);
      c.moveTo(-6, -8); c.lineTo(-6, -2); c.moveTo(4, -2); c.lineTo(4, 3); c.stroke();
      c.fillStyle = '#3a2418';
      c.beginPath(); c.moveTo(-4, 6); c.lineTo(-4, 1); c.arc(-1, 1, 3, Math.PI, 0); c.lineTo(2, 6); c.closePath(); c.fill();
      c.fillRect(7, -6, 2, 5);
      poly(c, [12, -7, 19, 0, 12, 6], '#c49a6c', '#3a2418');
      const spin = Math.abs(Math.sin(t * 0.9));
      c.fillStyle = 'rgba(230,230,230,0.85)';
      c.fillRect(19, -9 * spin, 1.6, 18 * spin);
      poly(c, [-6, 6, -16, 13, -10, 13, 2, 6], '#7a4e32', '#3a2418');
    } },

  { id: 'night', name: 'MUSCAT NIGHT', belt: 8, color: '#cc0000',
    draw(c, t) {
      for (let i = 0; i < 5; i++) {
        const x = -16 - ((t * 0.9 + i * 9) % 30);
        c.globalAlpha = 0.8 * (1 - (-16 - x) / 30);
        c.fillStyle = '#e4b85e';
        c.fillRect(x, Math.sin(i * 2.1) * 6, 1.5, 1.5);
      }
      c.globalAlpha = 1;
      c.lineJoin = 'round';
      c.save();
      c.shadowColor = '#7a5cff'; c.shadowBlur = 10;
      c.fillStyle = '#9a7cff'; c.fillRect(-12, -2, 3, 4);
      c.restore();
      poly(c, [20, 0, -14, -11, -9, 0, -14, 11], '#1a1622', '#e4b85e', 1.4);
      c.strokeStyle = 'rgba(228,184,94,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(18, 0); c.lineTo(-9, 0); c.stroke();
      poly(c, [12, -1, 4, -4, 1, -1], '#5a4a8a');
      const blink = Math.floor(t / 20) % 2 === 0;
      c.fillStyle = blink ? '#ff3030' : '#551010'; c.fillRect(-14, -11, 2, 2);
      c.fillStyle = blink ? '#30ff60' : '#105520'; c.fillRect(-14, 9, 2, 2);
      // crescent emblem
      c.fillStyle = '#e4b85e';
      c.beginPath(); c.arc(-2, 5, 2.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a1622';
      c.beginPath(); c.arc(-1.1, 4.4, 2, 0, Math.PI * 2); c.fill();
    } },
];

// Average one drop roll success per ~90 seconds of active play.
const SKIN_DROP_CHANCE_PER_FRAME = 1 / (90 * 60);
const SKIN_STORE_KEY = 'iuBeltDash.skins.v1';

const skinState = {
  owned: new Set(['classic']), selected: 'classic',
  planesOwned: new Set(['classic']), plane: 'classic',
};

function loadSkins() {
  try {
    const d = JSON.parse(localStorage.getItem(SKIN_STORE_KEY) || '{}');
    if (Array.isArray(d.owned)) {
      for (const id of d.owned) if (SKINS.some((s) => s.id === id)) skinState.owned.add(id);
    }
    if (typeof d.selected === 'string' && skinState.owned.has(d.selected)) skinState.selected = d.selected;
    if (Array.isArray(d.planesOwned)) {
      for (const id of d.planesOwned) if (PLANE_SKINS.some((p) => p.id === id)) skinState.planesOwned.add(id);
    }
    if (typeof d.plane === 'string' && skinState.planesOwned.has(d.plane)) skinState.plane = d.plane;
  } catch (e) { /* storage unavailable — keep defaults */ }
}

function saveSkins() {
  try {
    localStorage.setItem(SKIN_STORE_KEY, JSON.stringify({
      owned: [...skinState.owned], selected: skinState.selected,
      planesOwned: [...skinState.planesOwned], plane: skinState.plane,
    }));
  } catch (e) { /* ignore */ }
}

function currentSkin() {
  return SKINS.find((s) => s.id === skinState.selected) || SKINS[0];
}

function currentPlane() {
  return PLANE_SKINS.find((p) => p.id === skinState.plane) || PLANE_SKINS[0];
}

// Called from advanceLevel() when belt b (1..8) is completed.
function unlockPlaneForBelt(b) {
  const plane = PLANE_SKINS.find((p) => p.belt === b);
  if (!plane || skinState.planesOwned.has(plane.id)) return;
  skinState.planesOwned.add(plane.id);
  skinState.plane = plane.id;   // equip right away — it shows up at the next FLY portal
  saveSkins();
  showUnlockToast({
    label: '✈ NEW PLANE UNLOCKED ✈',
    name: plane.name,
    sub: BELTS[b].name + ' BELT REWARD',
    color: plane.color,
    paint: (cv) => paintPlanePreview(cv, plane),
  });
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
  const r = RARITIES[skin.rarity];
  showUnlockToast({
    label: '✦ NEW SKIN DROPPED ✦', name: skin.name, sub: r.label, color: r.color,
    paint: (cv) => paintSkinPreview(cv, skin),
  });
}

function showUnlockToast({ label, name, sub, color, paint }) {
  const el = document.getElementById('skinToast');
  el.style.setProperty('--rarity', color);
  el.querySelector('.st-label').textContent = label;
  document.getElementById('skinToastName').textContent = name;
  document.getElementById('skinToastRarity').textContent = sub;
  paint(document.getElementById('skinToastPreview'));
  el.classList.add('show');
  clearTimeout(showUnlockToast._t);
  showUnlockToast._t = setTimeout(() => el.classList.remove('show'), 3500);
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
    skinState.owned.size + ' / ' + SKINS.length + ' CUBES · ' +
    skinState.planesOwned.size + ' / ' + PLANE_SKINS.length + ' PLANES';
  refreshPlanesUI();
}

function paintPlanePreview(cv, plane) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  c.save();
  c.translate(cv.width / 2, cv.height / 2);
  const s = cv.width / 46;
  c.scale(s, s);
  if (plane.draw) plane.draw(c, 40);
  else drawClassicPlane(c, PREVIEW_PALETTE);
  c.restore();
}

function refreshPlanesUI() {
  const grid = document.getElementById('planeGrid');
  grid.innerHTML = '';
  for (const p of PLANE_SKINS) {
    const owned = skinState.planesOwned.has(p.id);
    const card = document.createElement('button');
    card.className = 'skin-card' + (owned ? '' : ' locked') + (p.id === skinState.plane ? ' selected' : '');
    card.style.setProperty('--rarity', p.color);
    card.disabled = !owned;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    paintPlanePreview(cv, p);
    if (!owned) cv.classList.add('silhouette');
    card.appendChild(cv);
    const name = document.createElement('div');
    name.className = 'skin-name';
    name.textContent = owned ? p.name : '???';
    const sub = document.createElement('div');
    sub.className = 'skin-rarity';
    sub.textContent = p.id === skinState.plane ? 'EQUIPPED'
      : owned ? (p.belt ? BELTS[p.belt].name + ' BELT' : 'STARTER')
      : 'BEAT ' + BELTS[p.belt].name + ' BELT';
    card.append(name, sub);
    if (owned) {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        skinState.plane = p.id;
        saveSkins();
        refreshSkinsUI();
      });
    }
    grid.appendChild(card);
  }
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
