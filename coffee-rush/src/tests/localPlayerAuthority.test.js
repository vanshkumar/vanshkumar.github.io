import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import { applyAction } from '../engine/reducers';
import {
  canControlPlayer,
  getLocalActionError,
} from '../network/localPlayerAuthority';

function apply(state, action) {
  const result = applyAction(state, action);
  expect(result.error).toBeUndefined();
  return result.state;
}

describe('local async player authority', () => {
  it('blocks setup placement actions for a different local player', () => {
    const state = createInitialState({
      playerNames: ['Ada', 'Ben'],
      seed: 'local-player-authority-test',
      startingPlayerIndex: 0,
    });
    const placement = state.setupPlacementQueue[0];
    const action = {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: 22,
      cupIdx: 0,
    };

    expect(placement.playerId).toBe('p2');
    expect(canControlPlayer('p1', placement.playerId)).toBe(false);
    expect(getLocalActionError(state, 'p1', action)).toBe(
      'Ben is placing now. Wait for their setup placement to sync.',
    );
    expect(getLocalActionError(state, 'p2', action)).toBe('');
  });

  it('uses the same setup guard for three and four player seats', () => {
    const threePlayerState = createInitialState({
      playerNames: ['Ada', 'Ben', 'Cleo'],
      seed: 'local-player-authority-three-player-test',
      startingPlayerIndex: 0,
    });
    const threePlayerPlacement = threePlayerState.setupPlacementQueue[0];
    const threePlayerAction = {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: threePlayerPlacement.playerId,
      meepleId: threePlayerPlacement.meepleId,
      cellId: 22,
      cupIdx: 0,
    };

    expect(threePlayerPlacement.playerId).toBe('p3');
    expect(getLocalActionError(threePlayerState, 'p1', threePlayerAction)).toBe(
      'Cleo is placing now. Wait for their setup placement to sync.',
    );
    expect(getLocalActionError(threePlayerState, 'p2', threePlayerAction)).toBe(
      'Cleo is placing now. Wait for their setup placement to sync.',
    );
    expect(getLocalActionError(threePlayerState, 'p3', threePlayerAction)).toBe('');

    const state = createInitialState({
      playerNames: ['Ada', 'Ben', 'Cleo', 'Dev'],
      seed: 'local-player-authority-four-player-test',
      startingPlayerIndex: 0,
    });
    const placement = state.setupPlacementQueue[0];
    const action = {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: 22,
      cupIdx: 0,
    };

    expect(placement.playerId).toBe('p4');
    expect(getLocalActionError(state, 'p1', action)).toBe(
      'Dev is placing now. Wait for their setup placement to sync.',
    );
    expect(getLocalActionError(state, 'p2', action)).toBe(
      'Dev is placing now. Wait for their setup placement to sync.',
    );
    expect(getLocalActionError(state, 'p3', action)).toBe(
      'Dev is placing now. Wait for their setup placement to sync.',
    );
    expect(getLocalActionError(state, 'p4', action)).toBe('');
  });

  it('allows only the active player to start an async turn locally', () => {
    let state = createInitialState({
      playerNames: ['Ada', 'Ben'],
      seed: 'local-player-turn-authority-test',
      startingPlayerIndex: 0,
    });

    while (state.phase === 'setupPlacement') {
      const placement = state.setupPlacementQueue[0];
      state = apply(state, {
        type: 'PLACE_STARTING_MEEPLE',
        playerId: placement.playerId,
        meepleId: placement.meepleId,
        cellId: placement.playerId === 'p2' ? 22 : 23,
        cupIdx: 0,
      });
    }

    const action = { type: 'SKIP_UPGRADES', playerId: state.activePlayerId };

    expect(state.activePlayerId).toBe('p1');
    expect(getLocalActionError(state, 'p2', action)).toBe(
      "It is Ada's turn. Wait for their turn to sync.",
    );
    expect(getLocalActionError(state, 'p1', action)).toBe('');
  });
});
