# Coffee Rush Technical Requirements

## Engine Contract

The game rules live in `src/engine/` and expose one reducer entry point:

```js
applyAction(state, action) => { state, error? }
```

Rules modules must stay pure and serializable:

- No React, DOM, browser storage, timers, or network imports.
- State is plain JSON: arrays, objects, strings, booleans, and numbers.
- Every successful action appends to `state.log`.
- Randomness uses `state.rngSeed` and `state.rngCursor`; no `Math.random()` in
  engine code.
- Invalid actions return the previous state and an error string.

## v2 Transport Readiness

Future remote play should broadcast actions, not state mutations. A host can
validate actions with `applyAction`, rebroadcast accepted actions, and peers can
replay the same action log against the same seed.

Trystero is the preferred future P2P candidate, but v1 deliberately ships no
networking dependency or signaling flow.
