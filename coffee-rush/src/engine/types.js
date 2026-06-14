/**
 * @typedef {Object} GameState
 * @property {string} version
 * @property {string} rngSeed
 * @property {number} rngCursor
 * @property {number} playerCount
 * @property {string} phase
 * @property {number} turn
 * @property {string} activePlayerId
 * @property {string} startingPlayerId
 * @property {boolean} endTriggered
 * @property {string|null} finalTurnPlayerId
 * @property {Array<Object>} deck
 * @property {Array<Object>} players
 * @property {Array<Object>} log
 */

export const PHASES = {
  SETUP_PLACEMENT: 'setupPlacement',
  UPGRADE: 'upgrade',
  MOVE: 'move',
  POUR: 'pour',
  GAME_OVER: 'gameOver',
};
