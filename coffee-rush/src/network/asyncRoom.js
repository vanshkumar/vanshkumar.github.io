import { applyAction } from '../engine/reducers';
import { isValidPlayerName } from '../engine/playerProfile';
import { normalizeRoomCode } from '../persistence/remoteSession';
import { getRelayUrl } from './roomSync';
import {
  createCommitAad,
  createRoomCipher,
  createSnapshotAad,
  hashCommitEnvelope,
  hashInitialRoomHead,
  hashState,
  isEncryptedEnvelope,
} from './roomCrypto';

export const ASYNC_PROTOCOL_VERSION = 2;
export const ASYNC_ROOM_TTL_DAYS = 14;
export const MAX_ASYNC_ACTIONS_PER_COMMIT = 40;
export const MAX_DECRYPTED_PAYLOAD_BYTES = 512 * 1024;
export const ASYNC_DRAFT_MISMATCH_MESSAGE =
  'Your local draft no longer matches the synced room. Replay the turn from the latest state before committing.';

const HASH_PATTERN = /^[A-Za-z0-9_-]{32,96}$/;
const ACTION_FIELD_ALLOWLIST = {
  UPDATE_PLAYER_PROFILE: ['type', 'playerId', 'name'],
  PLACE_STARTING_MEEPLE: ['type', 'playerId', 'meepleId', 'cellId', 'cupIdx'],
  SKIP_UPGRADES: ['type', 'playerId'],
  ACTIVATE_UPGRADE: ['type', 'playerId', 'tileId'],
  MOVE: ['type', 'playerId', 'meepleId', 'path', 'rushSpent'],
  POUR: ['type', 'playerId', 'ingredientFromHand', 'cupIdx'],
  DISCARD_HAND: ['type', 'playerId', 'ingredientFromHand'],
  DUMP_CUP: ['type', 'playerId', 'cupIdx'],
  FULFILL_ORDER: ['type', 'playerId', 'cupIdx', 'orderRef'],
  END_TURN: ['type', 'playerId'],
};

export class AsyncRoomError extends Error {
  constructor(message, { code = '', status = 0 } = {}) {
    super(message);
    this.name = 'AsyncRoomError';
    this.code = code;
    this.status = status;
  }
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function isValidHash(value) {
  return HASH_PATTERN.test(String(value ?? ''));
}

function jsonByteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function isSafeJsonValue(value, depth = 0) {
  if (depth > 4) return false;
  if (value === null) return true;
  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return typeof value !== 'number' || Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.length <= 32 && value.every((item) => isSafeJsonValue(item, depth + 1));
  }
  if (isPlainObject(value)) {
    return Object.keys(value).every(
      (key) =>
        !['__proto__', 'constructor', 'prototype'].includes(key) &&
        isSafeJsonValue(value[key], depth + 1),
    );
  }
  return false;
}

export function isValidAsyncAction(action) {
  if (!isPlainObject(action) || typeof action.type !== 'string') return false;
  const allowedFields = ACTION_FIELD_ALLOWLIST[action.type];
  if (!allowedFields) return false;
  if (!Object.keys(action).every((key) => allowedFields.includes(key))) return false;
  if (jsonByteLength(action) > 4096 || !isSafeJsonValue(action)) return false;

  switch (action.type) {
    case 'UPDATE_PLAYER_PROFILE':
      return (
        typeof action.playerId === 'string' &&
        typeof action.name === 'string' &&
        isValidPlayerName(action.name)
      );
    case 'PLACE_STARTING_MEEPLE':
      return (
        typeof action.playerId === 'string' &&
        typeof action.meepleId === 'string' &&
        Number.isInteger(Number(action.cellId)) &&
        Number.isInteger(Number(action.cupIdx))
      );
    case 'SKIP_UPGRADES':
    case 'END_TURN':
      return typeof action.playerId === 'string';
    case 'ACTIVATE_UPGRADE':
      return typeof action.playerId === 'string' && typeof action.tileId === 'string';
    case 'MOVE':
      return (
        typeof action.playerId === 'string' &&
        typeof action.meepleId === 'string' &&
        Array.isArray(action.path) &&
        action.path.length <= 12 &&
        action.path.every((cellId) => Number.isInteger(Number(cellId))) &&
        Number.isInteger(Number(action.rushSpent ?? 0))
      );
    case 'POUR':
    case 'DISCARD_HAND':
      return (
        typeof action.playerId === 'string' &&
        typeof action.ingredientFromHand === 'string' &&
        (action.type === 'DISCARD_HAND' || Number.isInteger(Number(action.cupIdx)))
      );
    case 'DUMP_CUP':
      return typeof action.playerId === 'string' && Number.isInteger(Number(action.cupIdx));
    case 'FULFILL_ORDER':
      return (
        typeof action.playerId === 'string' &&
        Number.isInteger(Number(action.cupIdx)) &&
        typeof action.orderRef === 'string'
      );
    default:
      return false;
  }
}

export function isValidGameStateShape(state) {
  return (
    isPlainObject(state) &&
    typeof state.version === 'string' &&
    typeof state.phase === 'string' &&
    Number.isInteger(Number(state.turn)) &&
    typeof state.activePlayerId === 'string' &&
    Array.isArray(state.players) &&
    state.players.length >= 2 &&
    state.players.length <= 4 &&
    Array.isArray(state.deck) &&
    Array.isArray(state.log) &&
    jsonByteLength(state) <= MAX_DECRYPTED_PAYLOAD_BYTES
  );
}

function validateEncryptedEnvelope(envelope, label) {
  if (!isEncryptedEnvelope(envelope)) {
    throw new AsyncRoomError(`The room ${label} is not an encrypted payload.`);
  }
}

function validateHeadResponse(response) {
  if (
    response?.protocol !== ASYNC_PROTOCOL_VERSION ||
    !Number.isInteger(response.headIndex) ||
    response.headIndex < 0 ||
    !isValidHash(response.headHash) ||
    !Number.isInteger(response.latestSnapshotIndex) ||
    response.latestSnapshotIndex < 0 ||
    !Array.isArray(response.commits)
  ) {
    throw new AsyncRoomError('The room head response was malformed.');
  }

  response.commits.forEach((commit) => {
    if (
      !Number.isInteger(commit?.commitIndex) ||
      commit.commitIndex < 1 ||
      !isValidHash(commit.prevHash) ||
      !isValidHash(commit.commitHash)
    ) {
      throw new AsyncRoomError('The room commit response was malformed.');
    }
    validateEncryptedEnvelope(commit.encryptedCommit, 'commit');
  });

  if (response.latestSnapshot !== undefined && response.latestSnapshot !== null) {
    validateEncryptedEnvelope(response.latestSnapshot, 'snapshot');
    if (
      response.latestSnapshotHeadHash !== undefined &&
      !isValidHash(response.latestSnapshotHeadHash)
    ) {
      throw new AsyncRoomError('The room snapshot response was malformed.');
    }
  }

  return response;
}

export function createAsyncEndpointUrl(
  relayUrl = getRelayUrl(),
  endpoint,
  roomId,
  location = window.location,
) {
  if (!relayUrl) {
    throw new AsyncRoomError('Online async rooms need a configured relay URL.');
  }

  const url = new URL(relayUrl, location.href);
  if (url.protocol === 'ws:') url.protocol = 'http:';
  if (url.protocol === 'wss:') url.protocol = 'https:';

  const path = url.pathname.replace(/\/+$/u, '');
  const basePath = path.endsWith('/room') ? path : `${path}/room`;
  url.pathname = `${basePath}/${endpoint}`;
  url.searchParams.set('room', normalizeRoomCode(roomId));
  return url.toString();
}

async function postAsyncRoom(session, endpoint, body) {
  const response = await fetch(createAsyncEndpointUrl(undefined, endpoint, session.roomId), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      protocol: ASYNC_PROTOCOL_VERSION,
      ...body,
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok && payload?.error !== 'STALE_HEAD') {
    throw new AsyncRoomError(payload?.error ?? 'The async room request failed.', {
      code: payload?.error ?? '',
      status: response.status,
    });
  }

  return payload;
}

export async function createAsyncRoom(session, initialState) {
  const cipher = await createRoomCipher(session.gameKey);
  const headHash = await hashInitialRoomHead({
    roomId: session.roomId,
    state: initialState,
  });
  const initialSnapshot = await cipher.encrypt(
    {
      type: 'STATE_SNAPSHOT',
      roomId: session.roomId,
      headIndex: 0,
      headHash,
      state: initialState,
    },
    {
      aad: createSnapshotAad({
        roomId: session.roomId,
        index: 0,
        headHash,
      }),
    },
  );
  const response = await postAsyncRoom(session, 'create', {
    roomAuth: session.relayAuth,
    hostAuth: session.hostAuth,
    initialSnapshot,
    headHash,
  });

  if (response?.accepted !== true || response.headIndex !== 0 || response.headHash !== headHash) {
    throw new AsyncRoomError('The relay did not accept the async room.');
  }

  return {
    ...session,
    protocol: ASYNC_PROTOCOL_VERSION,
    headIndex: 0,
    headHash,
    roomCreatedAt: new Date().toISOString(),
  };
}

export async function fetchAsyncRoomHead(session, knownHead = {}) {
  const response = await postAsyncRoom(session, 'head', {
    roomAuth: session.relayAuth,
    knownHeadIndex: Number.isInteger(knownHead.headIndex) ? knownHead.headIndex : undefined,
    knownHeadHash: knownHead.headHash || undefined,
  });

  return validateHeadResponse(response);
}

export async function assertAsyncDraftReplayMatchesResult(baseState, actions, resultState) {
  if (!isValidGameStateShape(baseState)) {
    throw new AsyncRoomError('Cannot verify the draft without a synced room state.', {
      code: 'DRAFT_BASE_MISSING',
    });
  }

  if (
    !Array.isArray(actions) ||
    actions.length === 0 ||
    actions.length > MAX_ASYNC_ACTIONS_PER_COMMIT ||
    !actions.every(isValidAsyncAction)
  ) {
    throw new AsyncRoomError('The completed turn has invalid room actions.');
  }

  if (!isValidGameStateShape(resultState)) {
    throw new AsyncRoomError('The completed turn produced an invalid game state.');
  }

  let replayedState = baseState;

  for (const action of actions) {
    const result = applyAction(replayedState, action);
    if (result.error) {
      throw new AsyncRoomError(ASYNC_DRAFT_MISMATCH_MESSAGE, {
        code: 'DRAFT_STATE_MISMATCH',
      });
    }
    replayedState = result.state;
  }

  const [replayedStateHash, resultStateHash] = await Promise.all([
    hashState(replayedState),
    hashState(resultState),
  ]);

  if (replayedStateHash !== resultStateHash) {
    throw new AsyncRoomError(ASYNC_DRAFT_MISMATCH_MESSAGE, {
      code: 'DRAFT_STATE_MISMATCH',
    });
  }

  return {
    state: replayedState,
    stateHash: resultStateHash,
  };
}

export async function submitTurnCommit(session, baseHead, actions, resultState) {
  if (
    !Number.isInteger(baseHead?.headIndex) ||
    baseHead.headIndex < 0 ||
    !isValidHash(baseHead.headHash)
  ) {
    throw new AsyncRoomError('Cannot commit without a current room head.');
  }

  if (
    !Array.isArray(actions) ||
    actions.length === 0 ||
    actions.length > MAX_ASYNC_ACTIONS_PER_COMMIT ||
    !actions.every(isValidAsyncAction)
  ) {
    throw new AsyncRoomError('The completed turn has invalid room actions.');
  }

  if (!isValidGameStateShape(resultState)) {
    throw new AsyncRoomError('The completed turn produced an invalid game state.');
  }

  const cipher = await createRoomCipher(session.gameKey);
  const commitIndex = baseHead.headIndex + 1;
  const resultStateHash = await hashState(resultState);
  const encryptedCommit = await cipher.encrypt(
    {
      type: 'TURN_COMMIT',
      roomId: session.roomId,
      baseIndex: baseHead.headIndex,
      baseHash: baseHead.headHash,
      actions,
      resultStateHash,
    },
    {
      aad: createCommitAad({
        roomId: session.roomId,
        index: commitIndex,
        prevHeadHash: baseHead.headHash,
      }),
    },
  );
  const commitHash = await hashCommitEnvelope({
    roomId: session.roomId,
    commitIndex,
    prevHeadHash: baseHead.headHash,
    encryptedCommit,
  });
  const encryptedSnapshot = await cipher.encrypt(
    {
      type: 'STATE_SNAPSHOT',
      roomId: session.roomId,
      headIndex: commitIndex,
      headHash: commitHash,
      state: resultState,
    },
    {
      aad: createSnapshotAad({
        roomId: session.roomId,
        index: commitIndex,
        headHash: commitHash,
      }),
    },
  );

  const response = await postAsyncRoom(session, 'commits', {
    roomAuth: session.relayAuth,
    expectedHeadIndex: baseHead.headIndex,
    prevHeadHash: baseHead.headHash,
    commitHash,
    encryptedCommit,
    encryptedSnapshot,
  });

  if (response?.accepted === false && response.error === 'STALE_HEAD') {
    return response;
  }

  if (response?.accepted !== true || response.headIndex !== commitIndex) {
    throw new AsyncRoomError('The relay did not accept the turn commit.');
  }

  return response;
}

export async function closeAsyncRoom(session) {
  if (!session.hostAuth) return null;

  return postAsyncRoom(session, 'close', {
    roomAuth: session.relayAuth,
    hostAuth: session.hostAuth,
  });
}

export async function decryptSnapshot(session, encryptedSnapshot, headIndex, headHash) {
  validateEncryptedEnvelope(encryptedSnapshot, 'snapshot');
  const cipher = await createRoomCipher(session.gameKey);
  const payload = await cipher.decrypt(encryptedSnapshot, {
    aad: createSnapshotAad({
      roomId: session.roomId,
      index: headIndex,
      headHash,
    }),
  });

  if (
    payload?.type !== 'STATE_SNAPSHOT' ||
    payload.roomId !== session.roomId ||
    payload.headIndex !== headIndex ||
    payload.headHash !== headHash ||
    !isValidGameStateShape(payload.state)
  ) {
    throw new AsyncRoomError('The room snapshot did not validate.');
  }

  return payload;
}

export async function decryptCommit(session, commit) {
  validateEncryptedEnvelope(commit?.encryptedCommit, 'commit');
  const expectedCommitHash = await hashCommitEnvelope({
    roomId: session.roomId,
    commitIndex: commit.commitIndex,
    prevHeadHash: commit.prevHash,
    encryptedCommit: commit.encryptedCommit,
  });
  if (commit.commitHash !== expectedCommitHash) {
    throw new AsyncRoomError('The room commit hash did not validate.');
  }

  const cipher = await createRoomCipher(session.gameKey);
  const payload = await cipher.decrypt(commit.encryptedCommit, {
    aad: createCommitAad({
      roomId: session.roomId,
      index: commit.commitIndex,
      prevHeadHash: commit.prevHash,
    }),
  });

  if (
    payload?.type !== 'TURN_COMMIT' ||
    payload.roomId !== session.roomId ||
    payload.baseIndex !== commit.commitIndex - 1 ||
    payload.baseHash !== commit.prevHash ||
    !Array.isArray(payload.actions) ||
    payload.actions.length === 0 ||
    payload.actions.length > MAX_ASYNC_ACTIONS_PER_COMMIT ||
    !payload.actions.every(isValidAsyncAction) ||
    !isValidHash(payload.resultStateHash)
  ) {
    throw new AsyncRoomError('The room commit did not validate.');
  }

  return payload;
}
