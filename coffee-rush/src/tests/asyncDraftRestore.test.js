import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import { applyAction } from '../engine/reducers';
import { PHASES } from '../engine/types';
import {
  ASYNC_OFFLINE_DRAFT_CONNECTION,
  createAsyncDraftHydrationUnit,
} from '../network/asyncDraftRestore';

const SETUP_CELL_BY_MEEPLE = {
  'p1-m1': 22,
  'p1-m2': 32,
  'p2-m1': 23,
  'p2-m2': 33,
};

function apply(state, action) {
  const result = applyAction(state, action);
  expect(result.error).toBeUndefined();
  return result.state;
}

function finishSetup(state) {
  let nextState = state;

  while (nextState.phase === PHASES.SETUP_PLACEMENT) {
    const placement = nextState.setupPlacementQueue[0];
    nextState = apply(nextState, {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: SETUP_CELL_BY_MEEPLE[placement.meepleId],
      cupIdx: 0,
    });
  }

  return nextState;
}

function createRestoredDraftFixture() {
  const canonicalState = finishSetup(
    createInitialState({
      playerNames: ['Ada', 'Ben'],
      seed: 'async-offline-draft-hydration-test',
    }),
  );
  const activePlayer = canonicalState.players.find(
    (player) => player.id === canonicalState.activePlayerId,
  );
  const skipAction = { type: 'SKIP_UPGRADES', playerId: activePlayer.id };
  const afterSkip = apply(canonicalState, skipAction);
  const moveAction = {
    type: 'MOVE',
    playerId: activePlayer.id,
    meepleId: activePlayer.meeples[0].id,
    path: [21],
    rushSpent: 0,
  };
  const afterMove = apply(afterSkip, moveAction);
  const discardAction = {
    type: 'DISCARD_HAND',
    playerId: activePlayer.id,
    ingredientFromHand: afterMove.players[0].hand[0],
  };
  const draftState = apply(afterMove, discardAction);
  const actions = [skipAction, moveAction, discardAction];
  const undoStack = [canonicalState, afterSkip, afterMove];
  const headHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  return {
    activePlayer,
    canonical: {
      headIndex: 4,
      headHash,
      state: canonicalState,
    },
    draft: {
      baseHeadIndex: 4,
      baseHeadHash: headHash,
      actions,
      state: draftState,
      undoStack,
    },
  };
}

describe('async draft restore hydration', () => {
  it('keeps status, draft actions, visible state, and undo stack together offline', () => {
    const { activePlayer, canonical, draft } = createRestoredDraftFixture();

    const hydration = createAsyncDraftHydrationUnit({ draft, canonical });

    expect(hydration).toMatchObject({
      connection: ASYNC_OFFLINE_DRAFT_CONNECTION,
      statusLabel: '3 offline draft',
      draftActionCount: 3,
    });
    expect(hydration.canonical).toMatchObject({
      headIndex: canonical.headIndex,
      headHash: canonical.headHash,
    });
    expect(hydration.draft.actions).toHaveLength(3);
    expect(hydration.state.phase).toBe(PHASES.POUR);
    expect(hydration.state.activePlayerId).toBe(activePlayer.id);
    expect(hydration.undoStack).toHaveLength(3);
  });

  it('rejects a saved draft when the cached canonical head is different', () => {
    const { canonical, draft } = createRestoredDraftFixture();

    expect(
      createAsyncDraftHydrationUnit({
        draft,
        canonical: {
          ...canonical,
          headIndex: canonical.headIndex + 1,
        },
      }),
    ).toBeNull();
  });
});
