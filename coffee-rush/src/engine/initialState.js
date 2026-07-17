import { ORDER_DECK } from '../data/orderDeck';
import { shuffleWithState } from './rng';
import { createUpgradeState } from './upgrades';
import { drawOrders } from './orders';
import { PHASES } from './types';

const COLORS = ['rose', 'blue', 'green', 'gold'];

export function createInitialState({
  playerNames,
  seed = 'coffee-rush',
  startingPlayerIndex = 0,
  useOptionalStarterOrders = true,
}) {
  const names = playerNames.slice(0, 4).filter(Boolean);

  if (names.length < 2 || names.length > 4) {
    throw new Error('Coffee Rush needs 2-4 players.');
  }

  const startingIndex = Math.min(Math.max(Number(startingPlayerIndex) || 0, 0), names.length - 1);

  let state = {
    version: '1.2.0',
    rngSeed: seed,
    rngCursor: 0,
    playerCount: names.length,
    phase: PHASES.SETUP_PLACEMENT,
    turn: 1,
    activePlayerId: 'p1',
    startingPlayerId: `p${startingIndex + 1}`,
    endTriggered: false,
    finalTurnPlayerId: null,
    deck: [],
    setupOptions: {
      useOptionalStarterOrders: Boolean(useOptionalStarterOrders),
    },
    players: names.map((name, index) => ({
      id: `p${index + 1}`,
      name,
      color: COLORS[index],
      cups: [[], [], []],
      hand: [],
      completed: [],
      penalties: [],
      rushTokens: 0,
      upgrades: createUpgradeState(),
      meeples: Array.from({ length: names.length === 2 ? 2 : 1 }, (_, meepleIndex) => ({
        id: `p${index + 1}-m${meepleIndex + 1}`,
        cellId: null,
      })),
      tabs: [[], [], [], []],
      turnCompletedOrderIds: [],
    })),
    log: [],
    lastMessage: '',
    setupPlacementQueue: [],
  };

  const optionalStarterOrders = useOptionalStarterOrders
    ? getTwoIngredientOrders(ORDER_DECK)
    : [];
  const deckSource = useOptionalStarterOrders
    ? ORDER_DECK.filter((order) => !optionalStarterOrders.some((starter) => starter.id === order.id))
    : ORDER_DECK;

  const shuffleResult = shuffleWithState(state, deckSource);
  state = {
    ...shuffleResult.state,
    deck: shuffleResult.items,
  };

  state = useOptionalStarterOrders
    ? dealOptionalStarterOrders(state, optionalStarterOrders)
    : dealStartingOrders(state);
  state = {
    ...state,
    setupPlacementQueue: createSetupPlacementQueue(state),
  };

  return {
    ...state,
    activePlayerId: state.setupPlacementQueue[0]?.playerId ?? state.startingPlayerId,
    lastMessage: 'Place starting baristas before the first turn.',
  };
}

function dealStartingOrders(state) {
  let nextState = state;
  let players = state.players;

  for (const player of players) {
    let result = drawOrders(nextState, 1);
    nextState = result.state;
    const tabOne = result.drawn;

    result = drawOrders(nextState, 1);
    nextState = result.state;
    const tabTwo = result.drawn;

    players = players.map((candidate) =>
      candidate.id === player.id
        ? { ...candidate, tabs: [tabOne, tabTwo, [], []] }
        : candidate,
    );
    nextState = { ...nextState, players };
  }

  const result = drawOrders(nextState, 1);
  nextState = result.state;

  return {
    ...nextState,
    players: nextState.players.map((player) =>
      player.id === state.startingPlayerId
        ? { ...player, tabs: [[...player.tabs[0], ...result.drawn], ...player.tabs.slice(1)] }
        : player,
    ),
  };
}

function dealOptionalStarterOrders(state, optionalStarterOrders) {
  if (optionalStarterOrders.length < state.players.length) {
    throw new Error('Optional starter orders need one two-ingredient card per player.');
  }

  let nextState = {
    ...state,
    players: state.players.map((player, index) => ({
      ...player,
      tabs: [[cloneOrder(optionalStarterOrders[index])], [], [], []],
    })),
  };

  for (const player of nextState.players) {
    const result = drawOrders(nextState, 1);
    nextState = {
      ...result.state,
      players: result.state.players.map((candidate) =>
        candidate.id === player.id
          ? { ...candidate, tabs: [candidate.tabs[0], result.drawn, [], []] }
          : candidate,
      ),
    };
  }

  const result = drawOrders(nextState, 1);
  nextState = result.state;

  return {
    ...nextState,
    players: nextState.players.map((player) =>
      player.id === state.startingPlayerId
        ? { ...player, tabs: [[...player.tabs[0], ...result.drawn], ...player.tabs.slice(1)] }
        : player,
    ),
  };
}

function getTwoIngredientOrders(deck) {
  return deck.filter((order) =>
    Object.values(order.recipe).reduce((total, count) => total + count, 0) === 2,
  );
}

function cloneOrder(order) {
  return {
    ...order,
    recipe: { ...order.recipe },
  };
}

function createSetupPlacementQueue(state) {
  const startingIndex = state.players.findIndex(
    (player) => player.id === state.startingPlayerId,
  );
  const counterClockwisePlayers = Array.from({ length: state.players.length }, (_, offset) => {
    const index =
      (startingIndex - 1 - offset + state.players.length) % state.players.length;
    return state.players[index];
  });
  const meepleCount = state.players[0].meeples.length;

  return Array.from({ length: meepleCount }).flatMap((_, meepleIndex) =>
    counterClockwisePlayers.map((player) => ({
      playerId: player.id,
      meepleId: player.meeples[meepleIndex].id,
    })),
  );
}
