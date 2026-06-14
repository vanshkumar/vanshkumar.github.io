import { BOARD_BY_ID, BOARD_CELLS } from '../data/boardLayout';

export function getCell(cellId) {
  return BOARD_BY_ID[Number(cellId)] ?? null;
}

export function getOccupiedCellIds(state, exceptMeepleId = null) {
  return state.players.flatMap((player) =>
    player.meeples
      .filter((meeple) => meeple.id !== exceptMeepleId)
      .map((meeple) => meeple.cellId),
  );
}

export function isOccupied(state, cellId, exceptMeepleId = null) {
  return getOccupiedCellIds(state, exceptMeepleId).includes(Number(cellId));
}

export function areAdjacent(fromId, toId, allowDiagonal = false) {
  const from = getCell(fromId);
  const to = getCell(toId);

  if (!from || !to || from.id === to.id) {
    return false;
  }

  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);

  if (allowDiagonal) {
    return rowDiff <= 1 && colDiff <= 1 && rowDiff + colDiff > 0;
  }

  return rowDiff + colDiff === 1;
}

export function getNeighbors(cellId, allowDiagonal = false) {
  return BOARD_CELLS.filter((cell) => areAdjacent(cellId, cell.id, allowDiagonal));
}

export function validateMovePath(state, player, meeple, path, rushSpent = 0) {
  if (!Array.isArray(path) || path.length < 1) {
    return 'Move at least one cell.';
  }

  if (path.length > 3 + rushSpent) {
    return 'That path uses too many movement steps.';
  }

  if (rushSpent > player.rushTokens) {
    return 'Not enough Rush tokens.';
  }

  const allowDiagonal = player.upgrades.diagonal_movement;
  let current = meeple.cellId;

  for (const cellId of path) {
    if (!getCell(cellId)) {
      return 'That path leaves the board.';
    }

    if (!areAdjacent(current, cellId, allowDiagonal)) {
      return 'Each movement step must use an adjacent cell.';
    }

    current = Number(cellId);
  }

  const finalCellId = Number(path[path.length - 1]);
  if (isOccupied(state, finalCellId, meeple.id)) {
    return 'You cannot end movement on an occupied cell.';
  }

  return null;
}

export function ingredientGainForCell(state, player, meeple, cellId) {
  const cell = getCell(cellId);
  let count = 1;

  if (player.upgrades.double_corners && cell.isCorner) {
    count *= 2;
  }

  if (player.upgrades.double_specialties && cell.isSpecialty) {
    count *= 2;
  }

  if (player.upgrades.double_meeples && isOccupied(state, cellId, meeple.id)) {
    count *= 2;
  }

  return Array.from({ length: count }, () => cell.ingredient);
}
