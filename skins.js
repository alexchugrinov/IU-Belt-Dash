'use strict';
// =====================================================================
// Plane skins: one unlocked per completed belt, equip menu, unlock popup.
// (Cube skins live in the runner garage — see improve-runner-skin-artwork.)
// Depends on globals from script.js (BELTS, stats, drawClassicPlane...).
// =====================================================================

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
  { id: 'classic', name: 'CLASSIC JET', belt: 0, color: '#bbbbbb', draw: null },   // original plane, level palette colors

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

const SKIN_STORE_KEY = 'iuBeltDash.skins.v1';

const skinState = { planesOwned: new Set(['classic']), plane: 'classic' };

function loadSkins() {
  try {
    const d = JSON.parse(localStorage.getItem(SKIN_STORE_KEY) || '{}');
    if (Array.isArray(d.planesOwned)) {
      for (const id of d.planesOwned) if (PLANE_SKINS.some((p) => p.id === id)) skinState.planesOwned.add(id);
    }
    if (typeof d.plane === 'string' && skinState.planesOwned.has(d.plane)) skinState.plane = d.plane;
  } catch (e) { /* storage unavailable — keep defaults */ }
}

function saveSkins() {
  try {
    localStorage.setItem(SKIN_STORE_KEY, JSON.stringify({
      planesOwned: [...skinState.planesOwned], plane: skinState.plane,
    }));
  } catch (e) { /* ignore */ }
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

// ============== Planes menu ==============
const PREVIEW_PALETTE = BELTS[8];   // black belt palette: white plane, red trim

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
        refreshPlanesUI();
      });
    }
    grid.appendChild(card);
  }
  document.getElementById('skinCount').textContent =
    skinState.planesOwned.size + ' / ' + PLANE_SKINS.length + ' PLANES';
}

function openSkins() {
  refreshPlanesUI();
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

// Saved campaign progress (script.js loadProgress) — grant planes for belts the
// player already beat before plane rewards existed. Reaching belt N means
// belts 1..N-1 were completed. Silent: no popup on page load.
(function grantPlanesFromProgress() {
  let changed = false;
  for (const p of PLANE_SKINS) {
    if (p.belt > 0 && p.belt < stats.maxBeltReached && !skinState.planesOwned.has(p.id)) {
      skinState.planesOwned.add(p.id);
      changed = true;
    }
  }
  if (changed) saveSkins();
})();
