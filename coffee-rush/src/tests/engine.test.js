import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import { applyAction } from '../engine/reducers';
import {
  getCompletableOrders,
  getLegalDestinations,
  getMeepleForFirstMoveStep,
  getMovePathPreview,
  getScores,
} from '../engine/selectors';

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

function setupWithOptionalStarterOrders(playerCount = 3) {
  return createInitialState({
    playerNames: Array.from({ length: playerCount }, (_, index) => `P${index + 1}`),
    seed: 'test-seed',
    useOptionalStarterOrders: true,
  });
}

function countOrderIngredients(order) {
  return Object.values(order.recipe).reduce((total, count) => total + count, 0);
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
      cupIdx: 0,
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

  it('supports the optional starter-order setup from the rulebook', () => {
    const state = setupWithOptionalStarterOrders(3);
    const startingPlayer = state.players.find((player) => player.id === state.startingPlayerId);

    expect(state.setupOptions.useOptionalStarterOrders).toBe(true);
    expect(state.deck).toHaveLength(76 - 3 - 1);
    expect(state.deck.some((order) => countOrderIngredients(order) === 2)).toBe(false);
    expect(state.players.map((player) => player.tabs[0][0].name)).toEqual([
      'Ristretto',
      'Ristretto',
      'Espresso',
    ]);
    expect(state.players.every((player) => countOrderIngredients(player.tabs[0][0]) === 2)).toBe(
      true,
    );
    expect(state.players.every((player) => player.tabs[1].length === 1)).toBe(true);
    expect(startingPlayer.tabs[0]).toHaveLength(2);
  });

  it('updates player profile names as a logged game action', () => {
    const state = setup(2);
    const result = applyAction(state, {
      type: 'UPDATE_PLAYER_PROFILE',
      playerId: 'p2',
      name: '  Fresh   Bean  ',
    });

    expect(result.error).toBeUndefined();
    expect(result.state.players[1].name).toBe('Fresh Bean');
    expect(result.state.phase).toBe(state.phase);
    expect(result.state.log.at(-1)).toEqual({
      type: 'UPDATE_PLAYER_PROFILE',
      playerId: 'p2',
      name: '  Fresh   Bean  ',
    });

    const invalid = applyAction(state, {
      type: 'UPDATE_PLAYER_PROFILE',
      playerId: 'p2',
      name: '',
    });
    expect(invalid.error).toBe('Enter your name.');
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
      cupIdx: 0,
    }).state;

    expect(state.players[1].meeples[0].cellId).toBe(23);
    expect(state.players[1].cups[0]).toHaveLength(1);

    state = finishSetup(state);
    expect(state.phase).toBe('move');
    expect(state.activePlayerId).toBe('p1');
  });

  it('starts turns in move until the active player can activate an upgrade', () => {
    let state = finishSetup(setup(2));

    expect(state.phase).toBe('move');
    expect(state.activePlayerId).toBe('p1');

    const skipped = applyAction(state, { type: 'SKIP_UPGRADES', playerId: 'p1' });
    expect(skipped.error).toBeUndefined();
    expect(skipped.state.phase).toBe('move');

    state = {
      ...state,
      phase: 'pour',
      players: state.players.map((player) =>
        player.id === 'p1' ? { ...player, hand: [] } : player,
      ),
    };
    state = applyAction(state, { type: 'END_TURN', playerId: 'p1' }).state;

    expect(state.activePlayerId).toBe('p2');
    expect(state.phase).toBe('move');

    state = {
      ...state,
      phase: 'pour',
      players: state.players.map((player) =>
        player.id === 'p1'
          ? { ...player, completed: [state.deck[0], state.deck[1], state.deck[2]] }
          : player.id === 'p2'
            ? { ...player, hand: [] }
            : player,
      ),
    };
    state = applyAction(state, { type: 'END_TURN', playerId: 'p2' }).state;

    expect(state.activePlayerId).toBe('p1');
    expect(state.phase).toBe('upgrade');
  });

  it('keeps the player in upgrade choice after an activation when three orders remain', () => {
    let state = finishSetup(setup(2));
    const completedOrders = state.deck.slice(0, 6);
    state = {
      ...state,
      phase: 'upgrade',
      players: state.players.map((player) =>
        player.id === 'p1' ? { ...player, completed: completedOrders } : player,
      ),
    };

    const firstActivation = applyAction(state, {
      type: 'ACTIVATE_UPGRADE',
      playerId: 'p1',
      tileId: 'diagonal_movement',
    });
    expect(firstActivation.error).toBeUndefined();
    expect(firstActivation.state.phase).toBe('upgrade');
    expect(firstActivation.state.players[0].completed).toEqual(
      completedOrders.slice(3),
    );
    expect(firstActivation.state.players[0].upgrades.diagonal_movement).toBe(true);

    const secondActivation = applyAction(firstActivation.state, {
      type: 'ACTIVATE_UPGRADE',
      playerId: 'p1',
      tileId: 'double_corners',
    });
    expect(secondActivation.error).toBeUndefined();
    expect(secondActivation.state.phase).toBe('move');
    expect(secondActivation.state.players[0].completed).toEqual([]);
    expect(secondActivation.state.players[0].upgrades.double_corners).toBe(true);
  });

  it('requires an explicit cup for starting ingredients', () => {
    const state = setup(2);
    const placement = state.setupPlacementQueue[0];
    const result = applyAction(state, {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: 23,
    });

    expect(result.error).toMatch(/Choose a cup/);
    expect(state.players[1].cups).toEqual([[], [], []]);
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

  it('previews movement steps, ingredients, and occupied pass-through cells', () => {
    let state = finishSetup(setup(2));
    const active = state.players[0];
    state = applyAction(state, { type: 'SKIP_UPGRADES', playerId: active.id }).state;

    const emptyPreview = getMovePathPreview(state, 'p1-m1', [], 0);
    expect(emptyPreview.stepsUsed).toBe(0);
    expect(emptyPreview.remainingSteps).toBe(3);
    expect(emptyPreview.canConfirm).toBe(false);
    expect(emptyPreview.nextCells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cellId: 12, ingredient: 'caramel', canEnd: true }),
        expect.objectContaining({ cellId: 23, ingredient: 'ice', canEnd: false }),
      ]),
    );

    const occupiedFinalPreview = getMovePathPreview(state, 'p1-m1', [23], 0);
    expect(occupiedFinalPreview.gainedIngredients).toEqual(['ice']);
    expect(occupiedFinalPreview.canConfirm).toBe(false);
    expect(occupiedFinalPreview.error).toMatch(/occupied/);
    expect(occupiedFinalPreview.nextCells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cellId: 33, ingredient: 'milk', canEnd: false }),
      ]),
    );

    const validPreview = getMovePathPreview(state, 'p1-m1', [23, 33, 43], 0);
    expect(validPreview.gainedIngredients).toEqual(['ice', 'milk', 'chocolate']);
    expect(validPreview.remainingSteps).toBe(0);
    expect(validPreview.canConfirm).toBe(true);
  });

  it('previews invalid movement paths and rush extensions', () => {
    let state = finishSetup(setup(2));
    state = applyAction(state, { type: 'SKIP_UPGRADES', playerId: 'p1' }).state;

    const invalidPreview = getMovePathPreview(state, 'p1-m1', [44], 0);
    expect(invalidPreview.canConfirm).toBe(false);
    expect(invalidPreview.error).toMatch(/adjacent/);
    expect(invalidPreview.nextCells).toEqual([]);

    const tooLongPreview = getMovePathPreview(state, 'p1-m1', [21, 11, 12, 13], 0);
    expect(tooLongPreview.canConfirm).toBe(false);
    expect(tooLongPreview.error).toMatch(/too many/);

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 'p1' ? { ...player, rushTokens: 1 } : player,
      ),
    };

    const rushPreview = getMovePathPreview(state, 'p1-m1', [21, 11, 12, 13], 1);
    expect(rushPreview.maxSteps).toBe(4);
    expect(rushPreview.remainingSteps).toBe(0);
    expect(rushPreview.canConfirm).toBe(true);
  });

  it('allows moving through occupied cells when the final cell is open', () => {
    let state = finishSetup(setup(2));
    state = applyAction(state, { type: 'SKIP_UPGRADES', playerId: 'p1' }).state;

    const result = applyAction(state, {
      type: 'MOVE',
      playerId: 'p1',
      meepleId: 'p1-m1',
      path: [23, 33, 43],
      rushSpent: 0,
    });

    expect(result.error).toBeUndefined();
    expect(result.state.players[0].meeples[0].cellId).toBe(43);
    expect(result.state.players[0].hand).toHaveLength(3);
  });

  it('infers the active meeple from the first clicked movement step', () => {
    let state = finishSetup(setup(2));
    state = {
      ...state,
      phase: 'move',
      activePlayerId: 'p2',
      players: state.players.map((player) =>
        player.id === 'p1'
          ? {
              ...player,
              meeples: [
                { ...player.meeples[0], cellId: 34 },
                { ...player.meeples[1], cellId: 33 },
              ],
            }
          : {
              ...player,
              meeples: [
                { ...player.meeples[0], cellId: 22 },
                { ...player.meeples[1], cellId: 44 },
              ],
            },
      ),
    };

    expect(getMeepleForFirstMoveStep(state, 'p2-m1', 34)).toBe('p2-m2');
    expect(getMeepleForFirstMoveStep(state, 'p2-m2', 34)).toBe('p2-m2');
    expect(getMeepleForFirstMoveStep(state, 'p2-m1', 23)).toBe('p2-m1');

    const result = applyAction(state, {
      type: 'MOVE',
      playerId: 'p2',
      meepleId: 'p2-m2',
      path: [34, 33, 43],
      rushSpent: 0,
    });

    expect(result.error).toBeUndefined();
    expect(result.state.players[1].meeples[1].cellId).toBe(43);
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

  it('only dumps cups during the pour phase', () => {
    const state = finishSetup(setup(2));
    const player = state.players[0];

    const result = applyAction(state, {
      type: 'DUMP_CUP',
      playerId: player.id,
      cupIdx: 0,
    });

    expect(result.error).toBe('Cups can only be dumped during pour.');
    expect(result.state).toBe(state);
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

  it('does not fulfill an order while collected ingredients remain unplaced', () => {
    const state = finishSetup(setup(3));
    const player = state.players[0];
    const order = player.tabs[0][0];
    const matchingCup = Object.entries(order.recipe).flatMap(([ingredient, count]) =>
      Array(count).fill(ingredient),
    );
    const pourState = {
      ...state,
      phase: 'pour',
      players: state.players.map((candidate) =>
        candidate.id === player.id
          ? { ...candidate, hand: ['water'], cups: [matchingCup, [], []] }
          : candidate,
      ),
    };

    const result = applyAction(pourState, {
      type: 'FULFILL_ORDER',
      playerId: player.id,
      cupIdx: 0,
      orderRef: order.id,
    });

    expect(result.error).toBe('Place or discard all collected ingredients before serving orders.');
    expect(result.state).toBe(pourState);
  });

  it('collapses duplicate ready-order actions for the same cup and recipe', () => {
    const firstOrder = {
      id: 'order_004',
      name: 'Espresso Doppio',
      isSpecialty: false,
      recipe: { coffee: 2, steam: 1 },
    };
    const duplicateOrder = {
      id: 'order_014',
      name: 'Espresso Doppio',
      isSpecialty: false,
      recipe: { coffee: 2, steam: 1 },
    };
    const player = {
      cups: [
        ['coffee', 'coffee', 'steam'],
        ['coffee', 'coffee', 'steam'],
        [],
      ],
      tabs: [[firstOrder, duplicateOrder], [], [], []],
    };

    const matches = getCompletableOrders(player);

    expect(matches).toHaveLength(2);
    expect(matches.map((match) => [match.cupIdx, match.order.id])).toEqual([
      [0, firstOrder.id],
      [1, firstOrder.id],
    ]);
  });

  it('chooses the most urgent duplicate ready order for a matching cup', () => {
    const lessUrgentOrder = {
      id: 'order_004',
      name: 'Espresso Doppio',
      isSpecialty: false,
      recipe: { coffee: 2, steam: 1 },
    };
    const urgentOrder = {
      id: 'order_014',
      name: 'Espresso Doppio',
      isSpecialty: false,
      recipe: { coffee: 2, steam: 1 },
    };
    const player = {
      cups: [['coffee', 'coffee', 'steam'], [], []],
      tabs: [[lessUrgentOrder], [], [], [urgentOrder]],
    };

    const matches = getCompletableOrders(player);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      cupIdx: 0,
      tabIdx: 3,
      order: urgentOrder,
    });
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
