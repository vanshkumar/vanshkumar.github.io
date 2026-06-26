import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import { applyAction } from '../engine/reducers';
import { PHASES } from '../engine/types';
import {
  ASYNC_COMMIT_RECOVERY_MESSAGE,
  createAsyncCommitRecovery,
  createAsyncCommitRecoveryFromDraft,
} from '../network/asyncCommitRecovery';

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

function createCommitBoundaryFixture() {
  const canonicalState = finishSetup(
    createInitialState({
      playerNames: ['Ada', 'Ben'],
      seed: 'async-commit-recovery-test',
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
  const beforeCommitState = apply(afterMove, discardAction);
  const endTurnAction = { type: 'END_TURN', playerId: activePlayer.id };
  const resultState = apply(beforeCommitState, endTurnAction);
  const actions = [skipAction, moveAction, discardAction, endTurnAction];
  const baseHead = {
    headIndex: 4,
    headHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };

  return {
    actions,
    baseHead,
    beforeCommitState,
    resultState,
  };
}

describe('async commit recovery', () => {
  it('keeps the failed commit action batch available for retry', () => {
    const { actions, baseHead, resultState } = createCommitBoundaryFixture();

    const recovery = createAsyncCommitRecovery({
      actions,
      baseHead,
      resultState,
      error: 'Failed to fetch',
    });

    expect(ASYNC_COMMIT_RECOVERY_MESSAGE).toContain('Retry the commit');
    expect(recovery).toMatchObject({
      baseHead,
      actions,
      resultState,
      error: 'Failed to fetch',
    });
    expect(recovery.actions[recovery.actions.length - 1]).toMatchObject({
      type: 'END_TURN',
    });
  });

  it('does not turn ordinary uncommitted drafts into a failed commit boundary', () => {
    const { actions, baseHead, beforeCommitState } = createCommitBoundaryFixture();
    const ordinaryDraftActions = actions.slice(0, -1);

    expect(
      createAsyncCommitRecovery({
        actions: ordinaryDraftActions,
        baseHead,
        resultState: beforeCommitState,
      }),
    ).toBeNull();
  });

  it('restores a failed commit boundary from a saved async draft', () => {
    const { actions, baseHead, resultState } = createCommitBoundaryFixture();

    expect(
      createAsyncCommitRecoveryFromDraft({
        baseHeadIndex: baseHead.headIndex,
        baseHeadHash: baseHead.headHash,
        actions,
        state: resultState,
      }),
    ).toMatchObject({
      baseHead,
      actions,
      resultState,
    });
  });
});
