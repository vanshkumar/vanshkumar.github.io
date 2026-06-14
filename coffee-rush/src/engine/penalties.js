import { drawOrders } from './orders';

export function applyFlowOfTime(state, playerId) {
  const playerIndex = state.players.findIndex((player) => player.id === playerId);
  const player = state.players[playerIndex];
  const falling = player.tabs[3];
  const nextTabs = [
    [],
    [...player.tabs[0]],
    [...player.tabs[1]],
    [...player.tabs[2]],
  ];
  let nextState = state;
  let updatedPlayer = {
    ...player,
    tabs: nextTabs,
    penalties: [...player.penalties, ...falling],
    rushTokens: player.rushTokens + falling.length,
  };

  if (updatedPlayer.penalties.length >= 5) {
    nextState = { ...nextState, endTriggered: true };
  }

  if (state.playerCount === 2) {
    const result = drawOrders(nextState, 1);
    nextState = result.state;
    updatedPlayer = {
      ...updatedPlayer,
      tabs: [[...updatedPlayer.tabs[0], ...result.drawn], ...updatedPlayer.tabs.slice(1)],
    };
  }

  return replacePlayer(nextState, updatedPlayer);
}

function replacePlayer(state, player) {
  return {
    ...state,
    players: state.players.map((candidate) =>
      candidate.id === player.id ? player : candidate,
    ),
  };
}
