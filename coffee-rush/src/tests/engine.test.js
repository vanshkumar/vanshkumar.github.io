import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import { applyAction } from '../engine/reducers';
import { getLegalDestinations, getScores } from '../engine/selectors';

function setup(playerCount = 3) {
  return createInitialState({
    playerNames: Array.from({ length: playerCount }, (_, index) => `P${index + 1}`),
    seed: 'test-seed',
  });
}

function setupWithStartingPlayer(playerCount, startingPlayerIndex) {
  return createInitialState({
    playerNames: Array.from({ length: playerCount }, (_, index) => `P${index + 1}`),
    seed: 'test-seed',
    startingPlayerIndex,
  });
}

const SETUP_CELL_BY_MEEPLE = {
  'p1-m1': 22,
  'p1-m2': 32,
  'p2-m1': 23,
  'p2-m2': 33,
  'p3-m1': 34,
  'p4-m1': 43,
};

function finishSetup(state) {
  let nextState = state;

  while (nextState.phase === 'setupPlacement') {
    const placement = nextState.setupPlacementQueue[0];
    nextState = applyAction(nextState, {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: SETUP_CELL_BY_MEEPLE[placement.meepleId],
    }).state;
  }

  return nextState;
}

function moveToPour(state) {
  state = finishSetup(state);
  const active = state.players[0];
  return applyAction(
    applyAction(state, { type: 'SKIP_UPGRADES', playerId: active.id }).state,
    {
      type: 'MOVE',
      playerId: active.id,
      meepleId: active.meeples[0].id,
      path: [21],
      rushSpent: 0,
    },
  ).state;
}

describe('Coffee Rush engine', () => {
  it('uses seeded setup with 80-card deck minus setup orders', () => {
    const state = setup(4);

    expect(state.deck).toHaveLength(80 - 4 * 2 - 1);
    expect(state.players[0].tabs[0]).toHaveLength(2);
    expect(state.players[1].tabs[0]).toHaveLength(1);
    expect(state.phase).toBe('setupPlacement');
    expect(state.setupPlacementQueue.map((placement) => placement.playerId)).toEqual([
      'p4',
      'p3',
      'p2',
      'p1',
    ]);
  });

  it('places starting meeples in setup and takes their ingredients', () => {
    let state = setup(2);
    expect(state.setupPlacementQueue.map((placement) => placement.playerId)).toEqual([
      'p2',
      'p1',
      'p2',
      'p1',
    ]);

    const placement = state.setupPlacementQueue[0];
    state = applyAction(state, {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: 23,
    }).state;

    expect(state.players[1].meeples[0].cellId).toBe(23);
    expect(state.players[1].cups[0]).toHaveLength(1);

    state = finishSetup(state);
    expect(state.phase).toBe('upgrade');
    expect(state.activePlayerId).toBe('p1');
  });

  it('supports a chosen starting player and cup choice during setup', () => {
    let state = setupWithStartingPlayer(2, 1);

    expect(state.startingPlayerId).toBe('p2');
    expect(state.activePlayerId).toBe('p1');
    expect(state.players[1].tabs[0]).toHaveLength(2);
    expect(state.setupPlacementQueue.map((placement) => placement.playerId)).toEqual([
      'p1',
      'p2',
      'p1',
      'p2',
    ]);

    const placement = state.setupPlacementQueue[0];
    state = applyAction(state, {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: 22,
      cupIdx: 1,
    }).state;

    expect(state.players[0].cups[0]).toEqual([]);
    expect(state.players[0].cups[1]).toHaveLength(1);
  });

  it('validates movement cap and legal occupied endings', () => {
    let state = finishSetup(setup(2));
    const active = state.players[0];
    state = applyAction(state, { type: 'SKIP_UPGRADES', playerId: active.id }).state;

    const destinations = getLegalDestinations(state, active.meeples[0].id);
    expect(destinations).toContain(11);

    const tooLong = applyAction(state, {
      type: 'MOVE',
      playerId: active.id,
      meepleId: active.meeples[0].id,
      path: [21, 11, 12, 13],
      rushSpent: 0,
    });
    expect(tooLong.error).toMatch(/too many/);

    const occupiedEnd = applyAction(state, {
      type: 'MOVE',
      playerId: active.id,
      meepleId: active.meeples[0].id,
      path: [23],
      rushSpent: 0,
    });
    expect(occupiedEnd.error).toMatch(/occupied/);
  });

  it('pours ingredients into cups and dumps cups', () => {
    let state = moveToPour(setup(3));
    const player = state.players[0];
    const ingredient = player.hand[0];

    state = applyAction(state, {
      type: 'POUR',
      playerId: player.id,
      ingredientFromHand: ingredient,
      cupIdx: 1,
    }).state;

    expect(state.players[0].cups[1]).toContain(ingredient);

    state = applyAction(state, {
      type: 'DUMP_CUP',
      playerId: player.id,
      cupIdx: 1,
    }).state;

    expect(state.players[0].cups[1]).toEqual([]);
  });

  it('fulfills an order and draws catch-up cards at end turn', () => {
    let state = finishSetup(setup(3));
    const player = state.players[0];
    const order = player.tabs[0][0];

    state = {
      ...state,
      phase: 'pour',
      players: state.players.map((candidate) =>
        candidate.id === player.id
          ? { ...candidate, hand: [], cups: [Object.entries(order.recipe).flatMap(([ingredient, count]) => Array(count).fill(ingredient)), [], []] }
          : candidate,
      ),
    };

    state = applyAction(state, {
      type: 'FULFILL_ORDER',
      playerId: player.id,
      cupIdx: 0,
      orderRef: order.id,
    }).state;

    expect(state.players[0].completed).toHaveLength(1);

    const beforeP2 = state.players[1].tabs[0].length;
    const beforeP3 = state.players[2].tabs[0].length;
    state = applyAction(state, { type: 'END_TURN', playerId: player.id }).state;

    expect(state.players[1].tabs[0]).toHaveLength(beforeP2 + 1);
    expect(state.players[2].tabs[0]).toHaveLength(beforeP3 + 1);
  });

  it('slides tab four cards into penalties and grants rush tokens', () => {
    let state = finishSetup(setup(3));
    const player = state.players[0];
    const penaltyOrder = state.deck[0];

    state = {
      ...state,
      phase: 'pour',
      deck: state.deck.slice(1),
      players: state.players.map((candidate) =>
        candidate.id === player.id
          ? { ...candidate, hand: [], tabs: [[], [], [], [penaltyOrder]] }
          : candidate,
      ),
    };

    state = applyAction(state, { type: 'END_TURN', playerId: player.id }).state;

    expect(state.players[0].penalties).toHaveLength(1);
    expect(state.players[0].rushTokens).toBe(1);
  });

  it('scores rating and tiebreak values', () => {
    let state = finishSetup(setup(2));
    state = {
      ...state,
      players: state.players.map((player, index) =>
        index === 0
          ? {
              ...player,
              completed: [state.deck[0], state.deck[1]],
              penalties: [state.deck[2]],
              rushTokens: 2,
              upgrades: { ...player.upgrades, double_corners: true },
            }
          : player,
      ),
    };

    const scores = getScores(state);
    expect(scores[0].rating).toBe(3);
    expect(scores[0].completed).toBe(2);
  });
});
