import { describe, expect, it } from 'vitest';
import { ORDER_DECK } from '../data/orderDeck';
import { createInitialState } from '../engine/initialState';
import { applyAction } from '../engine/reducers';
import { getScores, getWinnerIds } from '../engine/selectors';

const ORDERS_BY_ID = Object.fromEntries(ORDER_DECK.map((order) => [order.id, order]));

const SETUP_CELL_BY_MEEPLE = {
  'p1-m1': 22,
  'p1-m2': 32,
  'p2-m1': 23,
  'p2-m2': 33,
};

function order(id) {
  const found = ORDERS_BY_ID[id];
  if (!found) {
    throw new Error(`Unknown test order id: ${id}`);
  }
  return found;
}

function recipeIngredients(testOrder) {
  return Object.entries(testOrder.recipe).flatMap(([ingredient, count]) =>
    Array.from({ length: count }, () => ingredient),
  );
}

function setup() {
  return createInitialState({
    playerNames: ['Pink', 'Blue'],
    seed: 'playthrough-mechanics',
  });
}

function finishSetup(state) {
  let nextState = state;

  while (nextState.phase === 'setupPlacement') {
    const placement = nextState.setupPlacementQueue[0];
    nextState = apply(nextState, {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: SETUP_CELL_BY_MEEPLE[placement.meepleId],
    });
  }

  return nextState;
}

function apply(state, action) {
  const result = applyAction(state, action);
  expect(result.error).toBeUndefined();
  return result.state;
}

function updatePlayer(state, playerId, updates) {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, ...updates(player) } : player,
    ),
  };
}

describe('Coffee Rush playthrough mechanics', () => {
  it('spends Rush to extend movement beyond the normal three steps', () => {
    let state = finishSetup(setup());
    state = apply(state, { type: 'SKIP_UPGRADES', playerId: 'p1' });
    state = updatePlayer(state, 'p1', () => ({ rushTokens: 1 }));

    const withoutRush = applyAction(state, {
      type: 'MOVE',
      playerId: 'p1',
      meepleId: 'p1-m1',
      path: [21, 11, 12, 13],
      rushSpent: 0,
    });
    expect(withoutRush.error).toMatch(/too many/);

    state = apply(state, {
      type: 'MOVE',
      playerId: 'p1',
      meepleId: 'p1-m1',
      path: [21, 11, 12, 13],
      rushSpent: 1,
    });

    expect(state.players[0].rushTokens).toBe(0);
    expect(state.players[0].meeples[0].cellId).toBe(13);
    expect(state.players[0].hand).toEqual(['coffee', 'ice', 'caramel', 'steam']);
  });

  it('grants Rush immediately when a specialty order is fulfilled', () => {
    const specialty = order('order_010');
    let state = finishSetup(setup());
    state = {
      ...state,
      phase: 'pour',
      players: state.players.map((player) =>
        player.id === 'p1'
          ? {
              ...player,
              hand: [],
              rushTokens: 0,
              cups: [recipeIngredients(specialty), [], []],
              tabs: [[specialty], [], [], []],
            }
          : player,
      ),
    };

    state = apply(state, {
      type: 'FULFILL_ORDER',
      playerId: 'p1',
      cupIdx: 0,
      orderRef: specialty.id,
    });

    expect(state.players[0].rushTokens).toBe(1);
    expect(state.players[0].completed).toEqual([specialty]);
    expect(state.players[0].cups[0]).toEqual([]);
  });

  it('draws two-player catch-up pressure for each order completed in a turn', () => {
    const firstOrder = order('order_001');
    const secondOrder = order('order_003');
    const catchUpA = order('order_005');
    const catchUpB = order('order_006');
    const freshOrder = order('order_007');
    let state = finishSetup(setup());
    state = {
      ...state,
      phase: 'pour',
      deck: [catchUpA, catchUpB, freshOrder, order('order_008')],
      players: state.players.map((player) =>
        player.id === 'p1'
          ? {
              ...player,
              hand: [],
              cups: [recipeIngredients(firstOrder), recipeIngredients(secondOrder), []],
              tabs: [[firstOrder, secondOrder], [], [], []],
            }
          : player,
      ),
    };

    state = apply(state, {
      type: 'FULFILL_ORDER',
      playerId: 'p1',
      cupIdx: 0,
      orderRef: firstOrder.id,
    });
    state = apply(state, {
      type: 'FULFILL_ORDER',
      playerId: 'p1',
      cupIdx: 1,
      orderRef: secondOrder.id,
    });

    const beforeOpponentTabOne = state.players[1].tabs[0].length;
    state = apply(state, { type: 'END_TURN', playerId: 'p1' });

    expect(state.players[1].tabs[0]).toHaveLength(beforeOpponentTabOne + 2);
    expect(state.players[1].tabs[0]).toEqual(expect.arrayContaining([catchUpA, catchUpB]));
    expect(state.players[0].tabs[0]).toEqual([freshOrder]);
  });

  it('marks the final turn when a fifth penalty is taken in two-player mode', () => {
    const fallingOrder = order('order_011');
    let state = finishSetup(setup());
    state = {
      ...state,
      phase: 'pour',
      deck: [order('order_012'), order('order_013')],
      players: state.players.map((player) =>
        player.id === 'p1'
          ? {
              ...player,
              hand: [],
              penalties: [order('order_001'), order('order_002'), order('order_003'), order('order_004')],
              rushTokens: 0,
              tabs: [[], [], [], [fallingOrder]],
            }
          : player,
      ),
    };

    state = apply(state, { type: 'END_TURN', playerId: 'p1' });

    expect(state.endTriggered).toBe(true);
    expect(state.finalTurnPlayerId).toBe('p2');
    expect(state.phase).toBe('upgrade');
    expect(state.players[0].penalties).toHaveLength(5);
    expect(state.players[0].rushTokens).toBe(1);
  });

  it('activates diagonal movement by spending three completed orders', () => {
    let state = finishSetup(setup());
    state = updatePlayer(state, 'p1', () => ({
      completed: [order('order_001'), order('order_002'), order('order_003')],
    }));

    state = apply(state, {
      type: 'ACTIVATE_UPGRADE',
      playerId: 'p1',
      tileId: 'diagonal_movement',
    });

    expect(state.players[0].completed).toEqual([]);
    expect(state.players[0].upgrades.diagonal_movement).toBe(true);

    state = apply(state, {
      type: 'MOVE',
      playerId: 'p1',
      meepleId: 'p1-m1',
      path: [11],
      rushSpent: 0,
    });

    expect(state.players[0].meeples[0].cellId).toBe(11);
    expect(state.players[0].hand).toEqual(['ice']);
  });

  it('doubles ingredient gain on corner cells after the double-corners upgrade', () => {
    let state = finishSetup(setup());
    state = apply(state, { type: 'SKIP_UPGRADES', playerId: 'p1' });
    state = updatePlayer(state, 'p1', (player) => ({
      upgrades: { ...player.upgrades, double_corners: true },
    }));

    state = apply(state, {
      type: 'MOVE',
      playerId: 'p1',
      meepleId: 'p1-m1',
      path: [21, 11],
      rushSpent: 0,
    });

    expect(state.players[0].hand).toEqual(['coffee', 'ice', 'ice']);
  });

  it('keeps final scoring ties shared after rating, completions, and Rush are equal', () => {
    let state = finishSetup(setup());
    state = {
      ...state,
      players: state.players.map((player) => ({
        ...player,
        completed: [order('order_001'), order('order_002')],
        penalties: [order('order_003')],
        rushTokens: 1,
      })),
    };

    expect(getScores(state).map((score) => score.rating)).toEqual([1, 1]);
    expect(getWinnerIds(state)).toEqual(['p1', 'p2']);
  });
});
