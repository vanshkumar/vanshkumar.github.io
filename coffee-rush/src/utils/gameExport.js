export function createGameExport(state, undoStack = []) {
  return {
    exportedAt: new Date().toISOString(),
    app: 'coffee-rush',
    exportVersion: 1,
    summary: {
      turn: state.turn,
      phase: state.phase,
      activePlayerId: state.activePlayerId,
      startingPlayerId: state.startingPlayerId,
      playerCount: state.playerCount,
      deckCount: state.deck.length,
      actionCount: state.log.length,
      undoDepth: undoStack.length,
    },
    state,
    actionLog: state.log,
    undoStack,
  };
}

export function formatGameExport(state, undoStack = []) {
  return JSON.stringify(createGameExport(state, undoStack), null, 2);
}

export function gameExportBasename(state, now = new Date()) {
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return `coffee-rush-turn-${state.turn}-${state.phase}-${stamp}`;
}

export function gameExportFilename(state, now = new Date()) {
  return `${gameExportBasename(state, now)}.json`;
}

export function gameScreenshotFilename(state, now = new Date()) {
  return `${gameExportBasename(state, now)}.png`;
}
