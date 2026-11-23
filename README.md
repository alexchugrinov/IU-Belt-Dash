# IU Belt Dash

A Geometry Dash-inspired browser game. Run and jump through eight belts, unlock secret trials, collect runner skins, and create levels to share with friends.

### ▶ [Play IU Belt Dash](https://alexchugrinov.github.io/IU-Belt-Dash/)

## Play

Open `index.html` in a modern browser. Tap/click or press `Space`, `Up`, or `W` to jump. Press `R` to respawn and `P` or `Escape` to pause.

## Skins

Each belt has an Oman-inspired runner skin. Choose a skin in the Runner Garage, create a custom cube or interface theme, and unlock bonus and secret skins as you progress. Skin selection, custom skins, and belt unlocks are saved on this device.

Blue gravity orbs (from the Green belt on) flip gravity: you run on the roof, every control works in reverse, and roof sections end with a spike field you escape by tapping another blue orb.

## Create and share levels

Choose **Create a Level** on the landing page. Place obstacles on the track, save a draft in this browser, or publish to copy a playable link. The level is encoded in the link, so anyone who opens it can play without an account. Drafts are stored locally in the browser.

This project is a static site and has no server-side level directory: shared links work across players, but published levels are not listed globally for everyone.

## Project files

- `index.html` — landing page, skin garage, community levels, level editor, and game canvas
- `style.css` — responsive interface, skin cards, editor, and animations
- `script.js` — game logic, skin artwork, level editor and sharing, save data, and input handling
- `music.js` — procedural soundtrack and per-level music selection
- `skins.js` — plane rewards, collection, and saved selection

## Development and checks

The game is a static site; no build step is needed. For local play, run
`python3 -m http.server 8000` and open `http://localhost:8000`.

To run the browser regression suite:

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

If Chrome is already installed, use `PLAYWRIGHT_CHANNEL=chrome npm test` instead.
Tests cover merge-sensitive behavior: saved progress, new-run confirmation,
shared levels and music, gravity, plane rewards, frame-rate independence,
and desktop/mobile editor visibility. Pull requests run these checks in GitHub Actions.

## Working together

Start each task from the latest `main` on a separate branch. Keep pull requests
focused on one feature. Before asking for review, merge the latest `origin/main`
into your branch, resolve conflicts by checking both features, and run the checks
above. Avoid replacing an entire file with one side of a conflict: `script.js`
contains shared physics used by both gameplay and level verification.

Merge with a merge commit to preserve the students' branch history. The repository
requires three approvals, including its code owner; a new push dismisses earlier
approvals. Finish code changes and testing before requesting final reviews.
Do not delete a student branch until all of its commits are included in `main`.
