# Exact Playthrough Test Plan

Source video: `/Users/vanshkumar/Downloads/videoplayback (1).mp4`

## Current Verdict

The 1080p video is good enough to attempt an exact **state checkpoint replay** for the two-player playthrough. It is not good enough to promise a strictly observed, frame-perfect physical replay of every hand movement.

That distinction matters:

- **Useful exact test:** given an annotated fixture, the engine should reach the same board positions, cups, orders, completed orders, penalties, Rush tokens, active player, turn, and phase at each checkpoint.
- **Not fully provable from video alone:** every precise physical path, every cup assignment at the instant of pouring, and every face-down deck state, because some actions are covered by hands or cups.

## What 1080p Improves

- Most visible order card names are readable in stable overhead frames.
- Center-board barista positions are readable at turn checkpoints.
- Many cup contents are readable when cups are not under glare or covered by hands.
- Order aging and fresh-card placement are easier to verify after hands clear.

## Remaining Ambiguities

- The file is still video-only; there is no audio commentary to resolve hidden actions.
- Some movement paths are covered by hands during the decisive frames.
- Some cups sit on top of order cards or under glare, hiding exact cup contents or card names.
- The deck is face-down before draws, so the fixture should specify observed draw order rather than relying on a random seed to reproduce the physical deck.
- Equivalent paths can sometimes produce the same final state and ingredient multiset. In those cases the replay can be state-exact without proving the human took that exact path.

## Recommended Fixture Standard

Each turn in the fixture should have one of these evidence levels:

- `observed`: action inputs and end state are directly visible.
- `derived`: action inputs are inferred from before/after state and legal rules.
- `checkpoint-only`: exact input sequence is not recoverable, but the post-turn state is visible enough to assert.
- `blocked`: the video does not expose enough state to use the turn in an exact comparison.

The replay test should fail only on `observed` and `derived` turn mismatches. `checkpoint-only` turns should be used as state snapshots or scenario tests, not as proof of the physical action sequence.

## Test Architecture

1. Create a video-derived fixture with:
   - player labels and starting player
   - setup placements and starting cup choices
   - initial visible order tabs
   - observed draw sequence for later Tab 1 and catch-up cards
   - per-turn actions: upgrade choice, move path, Rush spent, pours, order fulfillments, dumps/discards, end turn
   - checkpoint assertions after setup and after each turn

2. Add test helpers for:
   - constructing a state from a fixture-defined deck/order sequence
   - replaying engine actions through `applyAction`
   - comparing normalized state fields while ignoring UI-only fields like `lastMessage` and `log`

3. Use the fixture in layers:
   - first: setup plus first continuous turn around `23:08-24:08`
   - then: extend by one turn at a time
   - stop or split when a `blocked` segment prevents strict continuity

## First Candidate Exact Window

The `23:08` checkpoint is high quality:

- Blue baristas: `C11 ice`, `C34 coffee`
- Pink baristas: `C13 steam`, `C42 ice`
- Blue visible orders include `Iced Black Tea`, `Iced Einspanner`, `Cold Brew`, `Cocoa`, `Iced Green Tea`, `Iced Choco Latte`, and `Caramel Caffe Latte`
- Pink visible orders include `Iced Caramel Caffe Latte`, `Caffe Latte`, `Chocolate Latte`, `Espresso Doppio`, `Chocolate Shake`, `Iced Milk Tea`, and `Caramel Frappe`

The following Blue turn appears derivable:

- Start: Blue at `C11` and `C34`
- Move: lower Blue barista from `C34` to `C22`
- Likely path: `C33 -> C23 -> C22`
- Gained ingredients: milk, ice, milk
- End board: Blue at `C11` and `C22`; Pink unchanged

This is the best first replay-test slice because the start and end states are clear even though the hand partially covers the movement.

## Implemented Slice

The first replay slice is implemented in:

- `src/tests/fixtures/videoPlaythrough1080.js`
- `src/tests/videoPlaythroughReplay.test.js`
- `src/tests/playthroughMechanics.test.js`

It currently asserts:

- the visible `23:08` board state
- visible order names for the slice
- Blue's derived move from `C34` to `C22` through `C33 -> C23 -> C22`
- the resulting hand ingredients: milk, ice, milk
- the post-Blue-flow `24:40` checkpoint as checkpoint-only
- Pink's `24:50` endpoint on `C31 tea` as checkpoint-only because the route is not visible enough
- Blue's later derived move from `C22` to `C32`
- the resulting hand ingredient: steam

The replay deliberately does not assert the full Blue or Pink post-pour turn states yet. The cup/order areas are partially covered during those pours, so those parts should be extended only after separate annotated frame passes.

## Targeted Mechanics Coverage

The limited video-replay work now feeds a broader deterministic mechanics suite. `src/tests/playthroughMechanics.test.js` covers high-value mechanics seen or motivated by the playthrough without requiring exact full-game continuity:

- Rush spending to extend movement.
- Specialty order completion granting Rush.
- Two-player catch-up cards for multiple completed orders.
- Fifth-penalty final-turn trigger.
- Upgrade activation by spending three completed orders.
- Upgraded ingredient gain on corner cells.
- Shared final scoring ties.

## Practical Conclusion

Use the 1080p video for a rigorous replay-to-checkpoints suite. Do not present it as a fully exact human-move oracle unless each fixture row is marked `observed` or `derived` and the ambiguous rows are excluded from strict replay assertions.
