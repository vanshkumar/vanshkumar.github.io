import { PHASES } from './types';

const PENALTY_END_THRESHOLD = 5;

export function migrateGameState(state) {
  if (
    !state ||
    state.phase === PHASES.GAME_OVER ||
    !state.endTriggered ||
    state.deck?.length !== 0 ||
    state.players?.some((player) => player.penalties?.length >= PENALTY_END_THRESHOLD)
  ) {
    return state;
  }

  return {
    ...state,
    endTriggered: false,
    finalTurnPlayerId: null,
  };
}
