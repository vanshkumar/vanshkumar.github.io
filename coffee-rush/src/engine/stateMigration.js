import { PHASES } from './types';

const PENALTY_END_THRESHOLD = 5;

export function migrateGameState(state) {
  const rushCorrectedState = refundUnusedRushReservations(state);

  if (
    !rushCorrectedState ||
    rushCorrectedState.phase === PHASES.GAME_OVER ||
    !rushCorrectedState.endTriggered ||
    rushCorrectedState.deck?.length !== 0 ||
    rushCorrectedState.players?.some(
      (player) => player.penalties?.length >= PENALTY_END_THRESHOLD,
    )
  ) {
    return rushCorrectedState;
  }

  return {
    ...rushCorrectedState,
    endTriggered: false,
    finalTurnPlayerId: null,
  };
}

function refundUnusedRushReservations(state) {
  if (!state || !Array.isArray(state.log) || !Array.isArray(state.players)) {
    return state;
  }

  const refundsByPlayerId = new Map();
  let correctedLog = null;

  state.log.forEach((action, index) => {
    if (action?.type !== 'MOVE' || !Array.isArray(action.path)) return;

    const recordedRushSpent = Number(action.rushSpent ?? 0);
    const actualRushSpent = Math.max(0, action.path.length - 3);
    if (!Number.isFinite(recordedRushSpent) || recordedRushSpent <= actualRushSpent) return;

    if (!correctedLog) correctedLog = state.log.slice();
    correctedLog[index] = {
      ...action,
      rushSpent: actualRushSpent,
    };
    refundsByPlayerId.set(
      action.playerId,
      (refundsByPlayerId.get(action.playerId) ?? 0) +
        recordedRushSpent -
        actualRushSpent,
    );
  });

  if (!correctedLog) return state;

  return {
    ...state,
    log: correctedLog,
    players: state.players.map((player) => ({
      ...player,
      rushTokens: player.rushTokens + (refundsByPlayerId.get(player.id) ?? 0),
    })),
  };
}
