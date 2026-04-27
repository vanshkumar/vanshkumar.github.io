# Coffee Rush — Implementation Plan

> **Handoff doc.** This was written by a planning session and is meant to be picked up cold by a future coding agent. Read this top-to-bottom before touching any files. The starting state is: this directory (`coffee-rush/`) is empty except for this file. All cross-references in the repo are live.

## Goal

Build a web version of the board game **Coffee Rush** (Korea Boardgames; 2-4 players, fast filler, meeple → ingredient pickup → cup assembly → order fulfilment with a 4-tab decay/penalty system). Ship it as a sibling sub-project of the personal Astro site, served at `/coffee-rush/`. The pattern to mirror is `../terminal-desires-ranker/` — an independent Vite SPA that the GitHub Pages deploy stitches into the site.

## Scope decisions (already made with the user — do not re-litigate)

1. **Multiplayer model — v1 is hot-seat (pass-and-play).** All players share one device. No backend, no networking. Architect the engine so a P2P (WebRTC, e.g. Trystero or PeerJS) transport can be added in v2 *without* touching rules code. **Do not build P2P in v1.** Just keep the engine pure, serializable, and action-driven so v2 is a transport-only change.
2. **IP / scope — faithful rules, original art.** Implement the published rules and balance, but draw your own simple icons (CSS + emoji or basic SVG). Do **not** copy any published artwork or verbatim card text.
3. **AI / solo — out of scope for v1.** No bots. The user will revisit after human-vs-human is fun.

## Why hot-seat solves the "static site needs shared state" problem

The honest answer to *"how do you do consistent multiplayer state on a static site?"*:

- **Hot-seat** sidesteps the question. One browser tab = one game state in memory + `localStorage`. Faithful to in-person board-game play.
- **Remote** on a static site would require either P2P (WebRTC + free public signaling like Trystero/PeerJS) or a BaaS (Firebase/Supabase free tier). Both are viable, neither is in v1.
- **The trick to keeping options open**: build the rules as a **pure, JSON-serializable, action-reducer engine** (`applyAction(state, action) → newState`). Then v2 is the same engine wrapped in a transport that broadcasts each `action` to peers and replays it. No rewrite.

## Reference: how the sibling project is integrated

`../terminal-desires-ranker/` is a Vite + React 18 SPA. Read these to understand the pattern (do not copy verbatim — use as a model):

- `../terminal-desires-ranker/package.json` — deps + scripts
- `../terminal-desires-ranker/vite.config.js` — single line that matters: `base: '/terminal-desires-ranker/'`
- `../terminal-desires-ranker/src/App.jsx` — uses `react-router-dom` HashRouter
- `../.github/workflows/deploy.yml` lines 33-55 — how it's built and assembled into `site/`

Astro itself is **not** involved in the sub-project. It builds independently. The deploy step copies `coffee-rush/dist/` into `site/coffee-rush/`.

## Tech stack

- **React 18 + Vite 6** (match the sibling)
- **react-router-dom v6** with **HashRouter** (so deep links work on GitHub Pages without server rewrites)
- **Vitest** for the engine unit tests
- Plain CSS — no styling framework
- Click-to-select interactions, **not** drag-and-drop (mobile-friendly, simpler)

## File layout to create

```
coffee-rush/
  package.json            React 18, Vite 6, react-router-dom, vitest
  vite.config.js          base: '/coffee-rush/'
  index.html
  README.md               quickstart + how to run dev server
  product_reqs.md         rule reference; cite sources (links below)
  technical_reqs.md       engine API contract + v2 P2P-readiness notes
  .claude/
    LEARNINGS.md          REQUIRED by ~/.claude/CLAUDE.md — see "Learnings loop" below
  public/
    404.html              SPA fallback for GitHub Pages
  src/
    main.jsx
    App.jsx               HashRouter, routes for setup / game / results
    pages/
      SetupPage.jsx        choose 2-4 players, names, seat order, "Start"
      GamePage.jsx         main game UI; reads engine state, dispatches actions
      ResultsPage.jsx      final scores + rematch
    components/
      Board.jsx            ingredient board + meeples
      PlayerPanel.jsx      one player's tabs/cups/tokens; rotates active player
      OrderCard.jsx
      Cup.jsx
      RushTokenTracker.jsx
      UpgradeTray.jsx
      PassDeviceModal.jsx  end-of-turn handoff prompt for hot-seat
    engine/                ── PURE, no React, no DOM ──
      types.js             state shape (TS-style JSDoc), action types
      initialState.js      setup given player count + names + seed
      reducers.js          applyAction(state, action) → { state, error }
      board.js             board layout, BFS for legal move paths
      orders.js            order deck, dealing, scoring
      penalties.js         tab decay, penalty card creation
      upgrades.js          upgrade tiles + activation effects
      selectors.js         derived views (legalMoves, score, isGameOver)
      rng.js               seeded RNG (mulberry32 or similar) — required for v2 replay safety
    data/
      ingredients.js       ingredient enum + colors/icons
      boardLayout.js       space → ingredient mapping
      orderDeck.js         all order cards (composition + scoring tier)
      upgradeTiles.js      tile defs + effect tags
    persistence/
      localStorage.js      save/load engine state under a single key
    tests/
      reducers.test.js     state transitions: move, pour, fulfil, decay, penalty
      orders.test.js       deck dealing + draw-N catchup mechanic
      scoring.test.js      end-of-game scoring + tiebreaks
      legalMoves.test.js   movement rules (3 spaces, pass-through, can't stop on occupied)
```

**Easiest seed for the project skeleton:** `cp -a terminal-desires-ranker coffee-rush.tmp` to crib the package.json/vite/eslint config, then move what you need into the empty `coffee-rush/` (which already exists from this planning session) and discard the rest. Update `name` in `package.json`. Update `base` in `vite.config.js` to `/coffee-rush/`. Strip out html2canvas (the ranker uses it; we don't).

## Engine API (the part that survives to v2 — design carefully)

Single entry point — no class methods, no React imports:

```js
applyAction(state: GameState, action: Action): { state: GameState, error?: string }
```

Action shapes (must be JSON-serializable):

```
{ type: 'MOVE',              playerId, path: [boardIdx, ...] }
{ type: 'USE_RUSH',          playerId, count }
{ type: 'POUR',              playerId, ingredientFromHand, cupIdx }
{ type: 'DUMP_CUP',          playerId, cupIdx }
{ type: 'FULFILL_ORDER',     playerId, cupIdx, orderRef }
{ type: 'ACTIVATE_UPGRADE',  playerId, tileId, completedOrderIds: [...] }
{ type: 'END_TURN',          playerId }
```

Hard rules for the engine module:
- **No imports from `react`, `react-dom`, or anything DOM/browser.** Engine must be runnable in Node for tests.
- **State is plain JSON.** No class instances, no `Map`/`Set`, no `Date` objects (use ISO strings or turn numbers), no functions on state.
- **Append every applied action to `state.log: Action[]`.** Two clients replaying the same log with the same seed must reach byte-identical states. This is the v2 sync guarantee.
- **Seeded RNG.** All randomness (deck shuffling, anything else) must go through `rng.js` and use `state.rngSeed` / `state.rngCursor`. No `Math.random()` anywhere in the engine.
- **Validation in the reducer.** Illegal actions return `{ state: prevState, error: '...' }`. The UI uses selectors to disable illegal moves; the reducer is the second line of defence.

## Rules to implement

Sources to bookmark in `product_reqs.md`:
- BoardGameArena rules summary: https://en.boardgamearena.com/gamepanel?game=coffeerush
- BGG page: https://boardgamegeek.com/boardgame/377061/coffee-rush
- Official PDF rulebook: https://cdnfile.koreaboardgames.com/_data/QR/Rules_EN/Coffee%20Rush%20Piece%20Of%20Cake_Rules_EN_web.pdf

The exact card-by-card composition of the order deck and the upgrade-tile catalogue need to be transcribed from the PDF rulebook (or from a physical copy if the user has one) during implementation. **Ask the user** for the rulebook contents if you can't extract the PDF — do not invent card distributions.

### Game summary (verified across BGA + reviews)

- **Setup:** 2-4 players. Each player gets 3 cups, a player board with 4 tabs and face-down upgrade tiles, 1 meeple, and a starting hand of 2 or 3 order cards depending on seat. **2-player variant:** each player runs 2 meeples instead of 1.
- **Turn (6 steps in order):**
  1. *Activate Upgrades* — optional; spend 3 completed orders ("up-voted" cards) to flip an upgrade tile face-up.
  2. *Move* — up to 3 spaces; +1 per Rush token spent (unlimited). May pass through but **not** end on an occupied space. Each space entered grants its ingredient.
  3. *Pour* — place collected ingredients into your 3 cups. Once poured, ingredients are locked in that cup. You may dump a whole cup (back to supply) to restart it.
  4. *Process Order* — match a cup's contents to an order card on your tabs; on match, return ingredients to supply, place card in your "up-vote" pile. **Catchup mechanic:** for every order you complete this turn, the next *N* players must each draw *N* new order cards onto their tabs.
  5. *Flow of Time* — every card on your player board slides down 1 tab. Cards falling off tab 4 become penalty cards in your "down-vote" pile; you immediately gain Rush tokens equal to your total penalties.
  6. *Check end* — see end-game triggers below.
- **End-game:** triggered when the order draw pile depletes, OR a player takes their 5th penalty (immediate end).
- **Scoring:** +1 per completed order, +2 per activated upgrade tile, −1 per penalty. Tiebreak: most completed orders, then most Rush tokens.

## v1 hot-seat UX

- **SetupPage**: choose 2-4 players, names, seat order. "Start game" → `/game`.
- **GamePage**: shows the active player's full info (cups, tabs, tokens, in-hand ingredients from their move) prominently. Other players' boards visible but de-emphasized.
- **PassDeviceModal**: at end of turn, prompt "Pass device to {next player}". Coffee Rush has no hidden info, so this is UX courtesy, not a security boundary.
- **`localStorage` autosave** on every dispatched action. Refresh resumes the game. Single key (e.g. `coffee-rush:active-game`).
- **ResultsPage**: final scores, tiebreak resolution, "Rematch" button (resets to SetupPage with same player names).

## v2 readiness (build now, ship later — do **not** wire up in v1)

In `technical_reqs.md`, document the v2 plan so a future session can implement P2P quickly:

- Engine is already pure + serializable.
- Action log is already on state.
- Seeded RNG is already in place.
- v2 wire-up sketch: pick **Trystero** (https://github.com/dmotz/trystero) for P2P — it ships with multiple free public signaling backends and zero infra. On dispatch, host validates and rebroadcasts the action to all peers; peers apply the same action. Room code = Trystero room name.

That's it for v2 prep. **Do not add Trystero or any networking code in v1.**

## Files to modify outside `coffee-rush/`

Only one file: `../.github/workflows/deploy.yml`. Add three new steps and one extra cp inside the existing "Assemble site artifact" step. Mirror the existing `terminal-desires-ranker` steps (currently at lines 39-53):

```yaml
- name: Install coffee-rush dependencies
  run: npm ci
  working-directory: coffee-rush

- name: Build coffee-rush
  run: npm run build
  working-directory: coffee-rush
```

And inside "Assemble site artifact":

```bash
mkdir -p site/coffee-rush
cp -a coffee-rush/dist/. site/coffee-rush/
```

**Do not** modify `astro.config.mjs`, `package.json` at the repo root, or anything in `src/` or `public/` of the Astro site. Coffee Rush is a sibling artifact, not an Astro page.

**Optional (only if the user explicitly asks):** add a card/link to coffee-rush from the Astro homepage or projects page.

## Learnings loop (REQUIRED by `~/.claude/CLAUDE.md`)

Create `coffee-rush/.claude/LEARNINGS.md` at project start. Per the user's global instructions:
- **Log every friction point.** Build fails, hung tests, logic errors → document root cause and fix before proceeding.
- **Mandatory update on intervention.** If you stop to ask the user for guidance, or they correct you, capture the "signpost" in `LEARNINGS.md`.
- **Iterate toward autonomy.** Read existing entries before working to avoid repeating mistakes.

This file is checked in. Future sessions read it.

## Verification (run all of these before declaring v1 done)

1. **Engine unit tests:** `cd coffee-rush && npm test` — all reducer / orders / scoring / legalMoves tests green. Specifically cover:
   - 3-space movement cap; rush tokens extend it
   - Can pass through but cannot stop on an occupied space
   - Pour locks ingredient in cup; dump-cup clears it
   - Fulfil removes order from tabs and triggers draw-N catchup on next players
   - Tab decay creates penalty + grants rush tokens equal to total penalties
   - 5th penalty ends game immediately
   - Empty draw pile ends game at end of round
   - Scoring formula and tiebreaks
2. **Local dev playthrough:** `npm run dev`. Start a 2-player and a 4-player game, play to completion, verify scores match a hand calculation.
3. **Build smoke test:** `npm run build` → `npx serve dist/`. Click through Setup → Game → Results without console errors. Confirm `/coffee-rush/` base path resolves all assets.
4. **Full-site assembly check:** at repo root run `npm run build && (cd coffee-rush && npm run build)` and locally replicate the deploy.yml `site/` assembly. Serve `site/`, confirm `/` (Astro) and `/coffee-rush/` both load.
5. **Refresh-resume:** mid-game refresh; game resumes from last action via `localStorage`.
6. **Mobile sanity check:** open dev server on a phone (`vite --host`) — confirm tap targets and pass-device modal feel right at 375px width.

P2P (v2) is **not** in scope for these checks. All v1 needs to guarantee for v2 is that the engine remains pure and the action log is intact — which the unit tests guarantee.

## Things to NOT do in v1 (common traps)

- Do not add Firebase, Supabase, Trystero, PeerJS, or any networking dep.
- Do not add AI / bot opponents.
- Do not copy artwork or verbatim card text from the published game.
- Do not use `Math.random()` inside the engine — must go through seeded RNG.
- Do not put React imports in the `engine/` directory.
- Do not modify `astro.config.mjs` or anything outside `coffee-rush/` and `deploy.yml`.
- Do not use drag-and-drop for v1 interactions; click-to-select is the chosen UX.
- Do not invent order-deck contents or upgrade-tile effects — transcribe from the rulebook PDF or ask the user.

## Open questions for the implementing session to resolve with the user

- Exact card distribution and upgrade-tile catalogue (transcribe from PDF rulebook or ask the user to share contents).
- Whether the 2-player "two meeples each" variant ships in v1 or is deferred (default: ship it; it's just a setup-time flag).
- Visual style direction for the original art (default: clean flat CSS with emoji ingredient icons; ask if the user wants something more bespoke).
