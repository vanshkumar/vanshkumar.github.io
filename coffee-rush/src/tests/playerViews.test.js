import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import {
  getLocalViewPlayer,
  orderPlayersForLocalView,
} from '../engine/playerViews';

describe('local player view ordering', () => {
  it('pins the local player station even when another player is active', () => {
    const state = {
      ...createInitialState({
        playerNames: ['Ada', 'Ben', 'Cleo'],
        seed: 'local-player-view-test',
        startingPlayerIndex: 0,
      }),
      activePlayerId: 'p1',
    };

    expect(getLocalViewPlayer(state, 'p3').id).toBe('p3');
    expect(orderPlayersForLocalView(state, 'p3').map((player) => player.id)).toEqual([
      'p3',
      'p1',
      'p2',
    ]);
  });

  it('falls back to the active player for hot-seat and unknown local seats', () => {
    const state = {
      ...createInitialState({
        playerNames: ['Ada', 'Ben'],
        seed: 'hot-seat-player-view-test',
        startingPlayerIndex: 0,
      }),
      activePlayerId: 'p2',
    };

    expect(getLocalViewPlayer(state)?.id).toBe('p2');
    expect(getLocalViewPlayer(state, 'p9')?.id).toBe('p2');
    expect(orderPlayersForLocalView(state).map((player) => player.id)).toEqual([
      'p2',
      'p1',
    ]);
  });
});
