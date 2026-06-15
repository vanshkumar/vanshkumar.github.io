import { BOARD_CELLS } from '../data/boardLayout';
import { UPGRADE_TILES } from '../data/upgradeTiles';
import { areAdjacent, getNeighbors, isOccupied } from './board';
import { cupMatchesOrder } from './orders';
import { PHASES } from './types';

export function getActivePlayer(state) {
  return state.players.find((player) => player.id === state.activePlayerId);
}

export function getPlayer(state, playerId) {
  return state.players.find((player) => player.id === playerId);
}

export function getNextPlayerId(state, fromPlayerId = state.activePlayerId, offset = 1) {
  const index = state.players.findIndex((player) => player.id === fromPlayerId);
  const nextIndex = (index + offset) % state.players.length;
  return state.players[nextIndex].id;
}

export function getPreviousPlayerId(state, fromPlayerId = state.startingPlayerId) {
  const index = state.players.findIndex((player) => player.id === fromPlayerId);
  const previousIndex = (index - 1 + state.players.length) % state.players.length;
  return state.players[previousIndex].id;
}

export function getLegalDestinations(state, meepleId, rushSpent = 0) {
  const player = getActivePlayer(state);
  const meeple = player?.meeples.find((candidate) => candidate.id === meepleId);

  if (!player || !meeple) {
    return [];
  }

  const allowDiagonal = player.upgrades.diagonal_movement;
  const maxSteps = 3 + rushSpent;
  const destinations = new Set();
  const queue = [{ cellId: meeple.cellId, steps: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.steps >= maxSteps) {
      continue;
    }

    for (const neighbor of getNeighbors(current.cellId, allowDiagonal)) {
      const nextSteps = current.steps + 1;

      if (!isOccupied(state, neighbor.id, meeple.id)) {
        destinations.add(neighbor.id);
      }

      queue.push({ cellId: neighbor.id, steps: nextSteps });
    }
  }

  return Array.from(destinations).sort((a, b) => a - b);
}

export function getMeepleForFirstMoveStep(state, selectedMeepleId, firstCellId) {
  const player = getActivePlayer(state);

  if (!player) {
    return selectedMeepleId;
  }

  const allowDiagonal = player.upgrades.diagonal_movement;
  const candidates = player.meeples.filter((meeple) =>
    areAdjacent(meeple.cellId, firstCellId, allowDiagonal),
  );

  if (candidates.some((meeple) => meeple.id === selectedMeepleId)) {
    return selectedMeepleId;
  }

  return candidates.length === 1 ? candidates[0].id : selectedMeepleId;
}

export function getSetupPlacement(state) {
  if (state.phase !== PHASES.SETUP_PLACEMENT) {
    return null;
  }

  const placement = state.setupPlacementQueue?.[0];
  if (!placement) {
    return null;
  }

  return {
    ...placement,
    player: getPlayer(state, placement.playerId),
  };
}

export function getLegalSetupCells(state) {
  return BOARD_CELLS.filter((cell) => !isOccupied(state, cell.id)).map((cell) => cell.id);
}

export function getCompletableOrders(player) {
  const matches = [];

  player.cups.forEach((cup, cupIdx) => {
    player.tabs.forEach((tab, tabIdx) => {
      tab.forEach((order) => {
        if (cupMatchesOrder(cup, order)) {
          matches.push({ cupIdx, tabIdx, order });
        }
      });
    });
  });

  return matches;
}

export function getScores(state) {
  return state.players
    .map((player) => {
      const activatedUpgrades = UPGRADE_TILES.filter((tile) => player.upgrades[tile.id]);
      const rating =
        player.completed.length +
        activatedUpgrades.length * 2 -
        player.penalties.length;

      return {
        playerId: player.id,
        name: player.name,
        rating,
        completed: player.completed.length,
        activatedUpgrades: activatedUpgrades.length,
        penalties: player.penalties.length,
        rushTokens: player.rushTokens,
      };
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.completed !== a.completed) return b.completed - a.completed;
      return b.rushTokens - a.rushTokens;
    });
}

export function getWinnerIds(state) {
  const scores = getScores(state);
  const top = scores[0];

  return scores
    .filter(
      (score) =>
        score.rating === top.rating &&
        score.completed === top.completed &&
        score.rushTokens === top.rushTokens,
    )
    .map((score) => score.playerId);
}

export function getBoardView(state) {
  return BOARD_CELLS.map((cell) => ({
    ...cell,
    meeples: state.players.flatMap((player) =>
      player.meeples
        .filter((meeple) => meeple.cellId === cell.id)
        .map((meeple) => ({
          ...meeple,
          playerId: player.id,
          color: player.color,
          playerName: player.name,
        })),
    ),
  }));
}
