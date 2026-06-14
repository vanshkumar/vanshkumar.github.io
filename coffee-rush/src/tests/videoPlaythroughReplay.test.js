import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine/reducers';
import { VIDEO_1080_REPLAY } from './fixtures/videoPlaythrough1080';

function playerById(state, playerId) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`Missing player ${playerId}`);
  }
  return player;
}

function assertCheckpoint(state, checkpoint) {
  if (checkpoint.phase) {
    expect(state.phase).toBe(checkpoint.phase);
  }

  if (checkpoint.activePlayerId) {
    expect(state.activePlayerId).toBe(checkpoint.activePlayerId);
  }

  for (const [playerId, playerCheckpoint] of Object.entries(checkpoint.players ?? {})) {
    const player = playerById(state, playerId);

    if (playerCheckpoint.meeples) {
      const meeplesById = Object.fromEntries(
        player.meeples.map((meeple) => [meeple.id, meeple.cellId]),
      );
      expect(meeplesById).toMatchObject(playerCheckpoint.meeples);
    }

    if (playerCheckpoint.hand) {
      expect(player.hand).toEqual(playerCheckpoint.hand);
    }

    if (playerCheckpoint.visibleOrderNamesByTab) {
      for (const [tabIndex, expectedNames] of playerCheckpoint.visibleOrderNamesByTab.entries()) {
        const actualNames = player.tabs[tabIndex].map((order) => order.name);
        expect(actualNames).toEqual(expect.arrayContaining(expectedNames));
      }
    }
  }
}

function replayActions(startState, actions) {
  return actions.reduce((state, action) => {
    const result = applyAction(state, action);
    expect(result.error).toBeUndefined();
    return result.state;
  }, startState);
}

describe('1080p video-derived playthrough replay', () => {
  it.each(VIDEO_1080_REPLAY.slices)('checks $id', (slice) => {
    const startState = slice.createStartState();

    assertCheckpoint(startState, slice.startCheckpoint);

    if (slice.actions) {
      expect(['observed', 'derived']).toContain(slice.evidence);
      const endState = replayActions(startState, slice.actions);

      assertCheckpoint(endState, slice.endCheckpoint);
    } else {
      expect(slice.evidence).toBe('checkpoint-only');
    }
  });
});
