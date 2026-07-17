import { getPlayer } from '../engine/selectors';
import { PHASES } from '../engine/types';

export function canControlPlayer(localPlayerId, playerId) {
  return !localPlayerId || !playerId || localPlayerId === playerId;
}

export function getLocalActionError(state, localPlayerId, action) {
  if (canControlPlayer(localPlayerId, action?.playerId)) {
    return '';
  }

  const player = state ? getPlayer(state, action.playerId) : null;
  const playerName = player?.name ?? 'That player';

  if (state?.phase === PHASES.SETUP_PLACEMENT) {
    return `${playerName} is placing now. Wait for their setup placement to sync.`;
  }

  return `It is ${playerName}'s turn.`;
}
