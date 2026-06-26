import { getActivePlayer, getPlayer } from './selectors';

export function getLocalViewPlayer(state, localPlayerId = '') {
  if (!state) return null;

  return getPlayer(state, localPlayerId) ?? getActivePlayer(state) ?? null;
}

export function orderPlayersForLocalView(state, localPlayerId = '') {
  const viewPlayer = getLocalViewPlayer(state, localPlayerId);

  if (!state || !viewPlayer) return [];

  return [
    viewPlayer,
    ...state.players.filter((player) => player.id !== viewPlayer.id),
  ];
}
