const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

let browser, server, baseURL, context, page, errors;
before(async () => {
  server = createServer(async (req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    const files = { '/': 'index.html', '/style.css': 'style.css', '/script.js': 'script.js', '/music.js': 'music.js', '/skins.js': 'skins.js' };
    if (!files[name]) { res.writeHead(404).end(); return; }
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
    res.setHeader('Content-Type', types[path.extname(files[name])]);
    res.end(await readFile(path.join(__dirname, '..', files[name])));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
});
after(async () => { await browser?.close(); await new Promise(resolve => server.close(resolve)); });
beforeEach(async () => {
  context = await browser.newContext();
  page = await context.newPage();
  errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL);
});
afterEach(async () => { await context.close(); assert.deepEqual(errors, [], 'No uncaught browser errors'); });

test('landing, editor and plane overlays retain their styles and visibility', async () => {
  assert.equal(await page.locator('#levelEditorModal').isVisible(), false);
  assert.equal(await page.locator('#skinsModal').isVisible(), false);
  assert.equal(await page.locator('#skinGallery button').count(), 12);
  await page.locator('#createLevelBtn').click();
  assert.equal(await page.locator('#levelEditorModal').isVisible(), true);
  assert.equal(await page.locator('#levelMusicInput option').count(), 12);
  assert.equal(await page.locator('#publishLevelBtn').isDisabled(), true);
  await page.locator('#closeEditorBtn').click();
  await page.locator('#skinsBtn').click();
  assert.equal(await page.locator('#planeGrid button').count(), 9);
  assert.equal(await page.locator('#skinsModal').evaluate(el => getComputedStyle(el).position), 'fixed');
  await page.locator('#skinsCloseBtn').click();
});

test('all Play buttons preserve the saved run when New Run is cancelled', async () => {
  await page.evaluate(() => { stats.savedBelt = 4; saveProgress(); refreshProgressUI(); });
  let dialogs = 0;
  page.on('dialog', async dialog => { dialogs++; await dialog.dismiss(); });
  for (const id of ['playBtnTop', 'playBtnNav']) {
    await page.locator(`#${id}`).click();
    assert.equal(await page.evaluate(() => gameState), 'menu');
    assert.equal(await page.evaluate(() => stats.savedBelt), 4);
  }
  assert.equal(dialogs, 2);
});

test('pause then R resumes once and respawns without losing inverted gravity', async () => {
  await page.evaluate(() => {
    enterGame(1);
    lastCheckpointGrav = -1;
    pauseGame();
  });
  await page.keyboard.press('r');
  assert.deepEqual(await page.evaluate(() => ({ state: gameState, grav: player.grav, attempts, overlay: document.getElementById('pauseOverlay').classList.contains('visible') })),
    { state: 'playing', grav: -1, attempts: 2, overlay: false });
});

test('shared levels preserve music, gravity tools and more than 50 obstacles', async () => {
  const result = await page.evaluate(() => {
    const level = { version: 1, name: 'Shared عمان', author: 'Student', length: 9000, music: 11,
      obstacles: Array.from({ length: 100 }, (_, i) => ({ type: i % 2 ? 'roofGravOrb' : 'gravOrb', x: 450 + i * 60 })) };
    const decoded = decodeLevel(encodeLevel(level));
    const old = decodeLevel(encodeLevel({ ...level, music: undefined }));
    return { count: decoded.obstacles.length, name: decoded.name, music: decoded.music, oldMusic: old.music, roofFlip: buildCustomObstacles(decoded)[1].flip };
  });
  assert.deepEqual(result, { count: 100, name: 'Shared عمان', music: 11, oldMusic: 3, roofFlip: true });
});

test('gravity, dash and airplane use shared physics and planes leave the ceiling immediately', async () => {
  assert.deepEqual(await page.evaluate(() => {
    const level = type => indexLevel({ obstacles: [{ type, x: 120, y: 240, w: 36, h: 36 }], checkpoints: [], length: 3000 });
    const state = () => ({ ...makePlayerState(level('gravOrb'), 120), y: 240, onGround: false });
    const gravity = state(); stepPhysics(gravity, true, true, level('gravOrb'), 6);
    const dash = state(); stepPhysics(dash, true, true, level('dashOrb'), 6);
    const ld = indexLevel({ obstacles: [], checkpoints: [], length: 3000 });
    const plane = { ...state(), flight: true, y: CEIL_Y + 4, vy: -8 };
    stepPhysics(plane, true, false, ld, 6);
    const edge = plane.y; stepPhysics(plane, false, false, ld, 6);
    PLANE_SKINS.forEach(p => paintPlanePreview(document.createElement('canvas'), p));
    return { gravity: gravity.grav, dash: dash.dash, leavesCeiling: plane.y > edge };
  }), { gravity: -1, dash: 0, leavesCeiling: true });
});

test('campaign progress, plane rewards and skin selection survive reload', async () => {
  const selected = await page.evaluate(() => {
    stats.savedBelt = 4; stats.maxBeltReached = 4; saveProgress();
    unlockPlaneForBelt(3);
    return skinState.plane;
  });
  await page.reload();
  assert.deepEqual(await page.evaluate(() => ({ savedBelt: stats.savedBelt, plane: skinState.plane, owned: skinState.planesOwned.size })),
    { savedBelt: 4, plane: selected, owned: 4 });
  assert.equal(await page.locator('#continueBtn').isVisible(), true);
});

test('physics speed is independent of display refresh and frame cap', async () => {
  const distances = await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const results = [];
    for (const hz of [30, 60, 120, 144]) for (const cap of [0, 30, 60, 120]) {
      document.body.classList.add('playing');
      levelData = indexLevel({ obstacles: [], checkpoints: [], length: 100000, infinite: true });
      belt = 1; speed = 6; lastCheckpointX = 120; lastCheckpointGrav = 1;
      resetPlayer(120); gameState = 'playing';
      fpsCap = cap; stepAcc = 0; lastFrameTime = 1000; lastRenderTime = 1000;
      for (let frame = 1; frame <= hz * 2; frame++) loop(1000 + frame * 1000 / hz);
      results.push(player.x - 120);
    }
    return results;
  });
  assert.ok(Math.max(...distances) - Math.min(...distances) <= 18, JSON.stringify(distances));
  assert.ok(distances.every(d => d >= 990 && d <= 1014), JSON.stringify(distances));
});

test('mobile landing and modals fit the viewport with readable text', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('#createLevelBtn').click();
  assert.equal(await page.locator('#levelEditorModal').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  for (const selector of ['.hero-copy', '.skin-help', '.editor-help', '.skin-card-copy small']) {
    assert.ok(await page.locator(selector).first().evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 12), selector);
  }
});

test('a completed verification run can publish, reload and play a level with its selected music', async () => {
  await page.locator('#createLevelBtn').click();
  await page.locator('#levelNameInput').fill('Integration course');
  await page.locator('#levelAuthorInput').fill('Students');
  await page.locator('#levelMusicInput').selectOption('11');
  await page.evaluate(() => {
    editorObstacles = [{ type: 'spike', x: 900 }];
    drawEditor();
  });
  await page.locator('#verifyLevelBtn').click();
  assert.equal(await page.evaluate(() => gameState), 'playing');
  assert.equal(await page.evaluate(() => levelData.checkpoints.length), 0);
  await page.evaluate(() => {
    // Advance the actual gameplay loop through the simple verified course.
    // Jump immediately before the spike, then run to the finish.
    for (let i = 0; i < 1000 && gameState === 'playing'; i++) {
      jumpQueued = player.onGround && player.x >= 810 && player.x < 900;
      update();
    }
  });
  assert.equal(await page.locator('#publishLevelBtn').isEnabled(), true);
  await page.locator('#publishLevelBtn').click();
  const link = await page.locator('#publishedLevelLink').inputValue();
  assert.ok(link.includes('#level='));
  await page.goto(link);
  await page.reload(); // Open the shared URL as a fresh page, as another player would.
  assert.equal(await page.locator('#sharedLevelFeature').isVisible(), true);
  assert.equal(await page.evaluate(() => sharedCustomLevel.music), 11);
  await page.evaluate(() => startSharedLevel(sharedCustomLevel));
  assert.equal(await page.evaluate(() => currentMusicTrack(true)), 11);
  assert.ok(await page.evaluate(() => levelData.checkpoints.every(cp => customCheckpointSafe(levelData, speed, cp.x, 1, Math.min(levelData.length, cp.x + CUSTOM_CP_STEP)))));
});

test('all belt and secret generators produce routes accepted by the shared checker', async () => {
  const result = await page.evaluate(() => {
    const failures = [];
    for (let b = 1; b < BELTS.length; b++) {
      const spot = findImpossibleSpot(generateLevel(b), beltSpeed(b));
      if (spot !== null) failures.push({ belt: b, spot });
    }
    for (let i = 0; i < SECRETS.length; i++) {
      const spot = findImpossibleSpot(generateSecretLevel(i), SECRETS[i].speed);
      if (spot !== null) failures.push({ secret: i, spot });
    }
    return failures;
  });
  assert.deepEqual(result, []);
});
