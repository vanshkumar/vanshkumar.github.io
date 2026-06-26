import { INGREDIENTS } from '../data/ingredients';
import { PHASES } from './types';
import { getCell, ingredientGainForCell, isOccupied, validateMovePath } from './board';
import { applyFlowOfTime } from './penalties';
import { cupMatchesOrder, drawOrders, findOrderOnTabs } from './orders';
import {
  getActivePlayer,
  getNextPlayerId,
  getPlayer,
  getPreviousPlayerId,
} from './selectors';

export function applyAction(state, action) {
  if (state.phase === PHASES.GAME_OVER) {
    return { state, error: 'The game is already over.' };
  }

  const handler = ACTIONS[action.type];

  if (!handler) {
    return { state, error: `Unknown action: ${action.type}` };
  }

  const result = handler(state, action);

  if (result.error) {
    return { state, error: result.error };
  }

  return {
    state: {
      ...result.state,
      log: [...state.log, action],
    },
  };
}

const ACTIONS = {
  PLACE_STARTING_MEEPLE: placeStartingMeeple,
  SKIP_UPGRADES: skipUpgrades,
  ACTIVATE_UPGRADE: activateUpgrade,
  MOVE: move,
  POUR: pour,
  DISCARD_HAND: discardHand,
  DUMP_CUP: dumpCup,
  FULFILL_ORDER: fulfillOrder,
  END_TURN: endTurn,
};

function placeStartingMeeple(state, action) {
  if (state.phase !== PHASES.SETUP_PLACEMENT) {
    return { error: 'Starting placement is already complete.' };
  }

  const placement = state.setupPlacementQueue?.[0];
  if (!placement) {
    return { error: 'No starting placement is waiting.' };
  }

  if (action.playerId !== placement.playerId || action.meepleId !== placement.meepleId) {
    return { error: 'Place the highlighted barista first.' };
  }

  const player = getPlayer(state, placement.playerId);
  const cell = getCell(action.cellId);

  if (!cell) {
    return { error: 'Choose a board space.' };
  }

  if (isOccupied(state, cell.id)) {
    return { error: 'Starting baristas need open spaces.' };
  }

  if (action.cupIdx === undefined || action.cupIdx === null || action.cupIdx === '') {
    return { error: 'Choose a cup for the starting ingredient.' };
  }

  const cupIdx = Number(action.cupIdx);
  if (!Number.isInteger(cupIdx) || !player.cups[cupIdx]) {
    return { error: 'Choose a valid cup for the starting ingredient.' };
  }

  const cups = player.cups.map((cup) => [...cup]);
  if (cups[cupIdx].length >= 4) {
    return { error: 'That cup is already full.' };
  }
  cups[cupIdx] = [...cups[cupIdx], cell.ingredient];

  const updatedPlayer = {
    ...player,
    cups,
    meeples: player.meeples.map((meeple) =>
      meeple.id === placement.meepleId ? { ...meeple, cellId: cell.id } : meeple,
    ),
  };
  const queue = state.setupPlacementQueue.slice(1);
  const nextPlacement = queue[0];

  return {
    state: {
      ...replacePlayer(state, updatedPlayer),
      setupPlacementQueue: queue,
      activePlayerId: nextPlacement?.playerId ?? state.startingPlayerId,
      phase: nextPlacement ? PHASES.SETUP_PLACEMENT : PHASES.UPGRADE,
      lastMessage: nextPlacement
        ? `${getPlayer(state, nextPlacement.playerId).name} places next.`
        : `${getPlayer(state, state.startingPlayerId).name} starts the first turn.`,
    },
  };
}

function skipUpgrades(state, action) {
  const player = requireActivePlayer(state, action.playerId);
  if (player.error) return player;

  if (state.phase !== PHASES.UPGRADE) {
    return { error: 'Upgrade decisions are only available at the start of turn.' };
  }

  return {
    state: {
      ...state,
      phase: PHASES.MOVE,
      lastMessage: '',
    },
  };
}

function activateUpgrade(state, action) {
  const playerResult = requireActivePlayer(state, action.playerId);
  if (playerResult.error) return playerResult;

  if (state.phase !== PHASES.UPGRADE) {
    return { error: 'Upgrades can only be activated at the start of turn.' };
  }

  const player = playerResult.value;
  const tileId = action.tileId;

  if (!Object.prototype.hasOwnProperty.call(player.upgrades, tileId)) {
    return { error: 'That upgrade does not exist.' };
  }

  if (player.upgrades[tileId]) {
    return { error: 'That upgrade is already active.' };
  }

  if (player.completed.length < 3) {
    return { error: 'You need 3 completed orders to activate an upgrade.' };
  }

  const updatedPlayer = {
    ...player,
    completed: player.completed.slice(3),
    upgrades: {
      ...player.upgrades,
      [tileId]: true,
    },
  };

  return {
    state: {
      ...replacePlayer(state, updatedPlayer),
      phase: PHASES.MOVE,
      lastMessage: '',
    },
  };
}

function move(state, action) {
  const playerResult = requireActivePlayer(state, action.playerId);
  if (playerResult.error) return playerResult;

  if (state.phase !== PHASES.MOVE) {
    return { error: 'Move after resolving upgrades.' };
  }

  const player = playerResult.value;
  const meeple = player.meeples.find((candidate) => candidate.id === action.meepleId);

  if (!meeple) {
    return { error: 'Choose one of your meeples.' };
  }

  const rushSpent = Number(action.rushSpent ?? 0);
  const path = action.path.map(Number);
  const pathError = validateMovePath(state, player, meeple, path, rushSpent);

  if (pathError) {
    return { error: pathError };
  }

  const gained = path.flatMap((cellId) =>
    ingredientGainForCell(state, player, meeple, cellId),
  );
  const updatedPlayer = {
    ...player,
    rushTokens: player.rushTokens - rushSpent,
    hand: [...player.hand, ...gained],
    meeples: player.meeples.map((candidate) =>
      candidate.id === meeple.id
        ? { ...candidate, cellId: path[path.length - 1] }
        : candidate,
    ),
  };

  return {
    state: {
      ...replacePlayer(state, updatedPlayer),
      phase: PHASES.POUR,
      lastMessage: `${player.name} collected ${gained.length} ingredient${
        gained.length === 1 ? '' : 's'
      }.`,
    },
  };
}

function pour(state, action) {
  const playerResult = requireActivePlayer(state, action.playerId);
  if (playerResult.error) return playerResult;

  if (state.phase !== PHASES.POUR) {
    return { error: 'Pour after moving.' };
  }

  const player = playerResult.value;
  const cupIdx = Number(action.cupIdx);
  const ingredient = action.ingredientFromHand;

  if (!INGREDIENTS.includes(ingredient)) {
    return { error: 'That ingredient is not valid.' };
  }

  if (!player.hand.includes(ingredient)) {
    return { error: 'That ingredient is not in your hand.' };
  }

  if (!player.cups[cupIdx]) {
    return { error: 'That cup does not exist.' };
  }

  if (player.cups[cupIdx].length >= 4) {
    return { error: 'A cup can hold at most 4 ingredients.' };
  }

  const hand = removeOne(player.hand, ingredient);
  const cups = player.cups.map((cup, index) =>
    index === cupIdx ? [...cup, ingredient] : [...cup],
  );

  return {
    state: {
      ...replacePlayer(state, { ...player, hand, cups }),
      lastMessage: `${player.name} poured ${ingredient}.`,
    },
  };
}

function discardHand(state, action) {
  const playerResult = requireActivePlayer(state, action.playerId);
  if (playerResult.error) return playerResult;

  const player = playerResult.value;
  const ingredient = action.ingredientFromHand;

  if (!player.hand.includes(ingredient)) {
    return { error: 'That ingredient is not in your hand.' };
  }

  return {
    state: {
      ...replacePlayer(state, {
        ...player,
        hand: removeOne(player.hand, ingredient),
      }),
      lastMessage: `${player.name} returned ${ingredient} to supply.`,
    },
  };
}

function dumpCup(state, action) {
  const playerResult = requireActivePlayer(state, action.playerId);
  if (playerResult.error) return playerResult;

  if (state.phase !== PHASES.POUR) {
    return { error: 'Cups can only be dumped during pour.' };
  }

  const player = playerResult.value;
  const cupIdx = Number(action.cupIdx);

  if (!player.cups[cupIdx]) {
    return { error: 'That cup does not exist.' };
  }

  return {
    state: {
      ...replacePlayer(state, {
        ...player,
        cups: player.cups.map((cup, index) => (index === cupIdx ? [] : [...cup])),
      }),
      lastMessage: `${player.name} emptied a cup.`,
    },
  };
}

function fulfillOrder(state, action) {
  const playerResult = requireActivePlayer(state, action.playerId);
  if (playerResult.error) return playerResult;

  if (state.phase !== PHASES.POUR) {
    return { error: 'Orders are processed after movement.' };
  }

  const player = playerResult.value;

  if (player.hand.length > 0) {
    return { error: 'Place or discard all collected ingredients before serving orders.' };
  }

  const cupIdx = Number(action.cupIdx);
  const cup = player.cups[cupIdx];

  if (!cup) {
    return { error: 'That cup does not exist.' };
  }

  const found = findOrderOnTabs(player, action.orderRef);

  if (!found) {
    return { error: 'That order is not on your board.' };
  }

  if (!cupMatchesOrder(cup, found.order)) {
    return { error: 'That cup does not match the selected order.' };
  }

  const tabs = player.tabs.map((tab, tabIndex) =>
    tabIndex === found.tabIndex
      ? tab.filter((order) => order.id !== found.order.id)
      : [...tab],
  );
  const updatedPlayer = {
    ...player,
    cups: player.cups.map((candidate, index) => (index === cupIdx ? [] : [...candidate])),
    tabs,
    completed: [...player.completed, found.order],
    rushTokens: player.rushTokens + (found.order.isSpecialty ? 1 : 0),
    turnCompletedOrderIds: [...player.turnCompletedOrderIds, found.order.id],
  };

  return {
    state: {
      ...replacePlayer(state, updatedPlayer),
      lastMessage: `${player.name} completed ${found.order.name}.`,
    },
  };
}

function endTurn(state, action) {
  const playerResult = requireActivePlayer(state, action.playerId);
  if (playerResult.error) return playerResult;

  if (state.phase !== PHASES.POUR) {
    return { error: 'Move before ending your turn.' };
  }

  const player = playerResult.value;

  if (player.hand.length > 0) {
    return { error: 'Place or discard all collected ingredients first.' };
  }

  let nextState = applyTooManyOrders(state, player);
  nextState = applyFlowOfTime(nextState, player.id);
  nextState = markFinalTurn(nextState, player.id);

  if (shouldEndAfterTurn(nextState, player.id)) {
    return {
      state: {
        ...nextState,
        phase: PHASES.GAME_OVER,
        lastMessage: 'Game over.',
      },
    };
  }

  const nextPlayerId = getNextPlayerId(nextState, player.id);
  nextState = {
    ...nextState,
    activePlayerId: nextPlayerId,
    phase: PHASES.UPGRADE,
    turn: nextPlayerId === nextState.startingPlayerId ? nextState.turn + 1 : nextState.turn,
    players: nextState.players.map((candidate) =>
      candidate.id === nextPlayerId
        ? { ...candidate, turnCompletedOrderIds: [] }
        : candidate,
    ),
    lastMessage: `Pass to ${getPlayer(nextState, nextPlayerId).name}.`,
  };

  return { state: nextState };
}

function applyTooManyOrders(state, player) {
  const completedCount = player.turnCompletedOrderIds.length;
  if (completedCount === 0) {
    return state;
  }

  let nextState = state;
  const recipientCount = state.playerCount === 2 ? 1 : 2;

  for (let offset = 1; offset <= recipientCount; offset += 1) {
    const recipientId = getNextPlayerId(nextState, player.id, offset);
    const result = drawOrders(nextState, completedCount);
    nextState = result.state;
    nextState = replacePlayer(
      nextState,
      appendOrdersToTabOne(getPlayer(nextState, recipientId), result.drawn),
    );
  }

  return nextState;
}

function appendOrdersToTabOne(player, orders) {
  return {
    ...player,
    tabs: [[...player.tabs[0], ...orders], ...player.tabs.slice(1)],
  };
}

function markFinalTurn(state, endingPlayerId) {
  if (!state.endTriggered || state.finalTurnPlayerId) {
    return state;
  }

  if (state.playerCount === 2) {
    const starterTriggered = endingPlayerId === state.startingPlayerId;
    return {
      ...state,
      finalTurnPlayerId: starterTriggered
        ? getNextPlayerId(state, state.startingPlayerId)
        : endingPlayerId,
    };
  }

  return {
    ...state,
    finalTurnPlayerId: getPreviousPlayerId(state),
  };
}

function shouldEndAfterTurn(state, endingPlayerId) {
  return state.endTriggered && state.finalTurnPlayerId === endingPlayerId;
}

function requireActivePlayer(state, playerId) {
  if (playerId !== state.activePlayerId) {
    return { error: "It is not that player's turn." };
  }

  const player = getActivePlayer(state);
  if (!player) {
    return { error: 'No active player.' };
  }

  return { value: player };
}

function replacePlayer(state, player) {
  return {
    ...state,
    players: state.players.map((candidate) =>
      candidate.id === player.id ? player : candidate,
    ),
  };
}

function removeOne(items, item) {
  const index = items.indexOf(item);
  return [...items.slice(0, index), ...items.slice(index + 1)];
}
