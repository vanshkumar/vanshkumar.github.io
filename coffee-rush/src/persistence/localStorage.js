const STORAGE_KEY = 'coffee-rush:active-game:v2';
const UNDO_STORAGE_KEY = 'coffee-rush:undo-stack:v1';
const ASYNC_ROOM_STATE_PREFIX = 'coffee-rush:async-room-state:v1:';
const ASYNC_DRAFT_PREFIX = 'coffee-rush:async-draft:v1:';
const PENDING_PLAYER_PROFILE_PREFIX = 'coffee-rush:pending-player-profile:v1:';
const MAX_UNDO_STATES = 25;

function parseJson(raw, fallback) {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function roomStorageKey(prefix, roomId) {
  return `${prefix}${String(roomId ?? '').toUpperCase()}`;
}

function playerRoomStorageKey(prefix, roomId, playerId) {
  return `${roomStorageKey(prefix, roomId)}:${String(playerId ?? '').toLowerCase()}`;
}

export function saveGame(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadGame() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return parseJson(raw, null);
}

export function clearGame() {
  window.localStorage.removeItem(STORAGE_KEY);
  clearUndoStack();
  clearAllAsyncRoomStorage();
}

export function saveUndoStack(stack) {
  const trimmed = stack.slice(-MAX_UNDO_STATES);
  window.localStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(trimmed));
}

export function loadUndoStack() {
  const raw = window.localStorage.getItem(UNDO_STORAGE_KEY);
  const parsed = parseJson(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function clearUndoStack() {
  window.localStorage.removeItem(UNDO_STORAGE_KEY);
}

export function saveAsyncRoomState({ roomId, headIndex, headHash, state }) {
  if (!roomId || !state) return;

  window.localStorage.setItem(
    roomStorageKey(ASYNC_ROOM_STATE_PREFIX, roomId),
    JSON.stringify({
      version: 1,
      roomId,
      headIndex,
      headHash,
      state,
      savedAt: new Date().toISOString(),
    }),
  );
}

export function loadAsyncRoomState(roomId) {
  const parsed = parseJson(
    window.localStorage.getItem(roomStorageKey(ASYNC_ROOM_STATE_PREFIX, roomId)),
    null,
  );

  if (
    !parsed ||
    parsed.version !== 1 ||
    !Number.isInteger(Number(parsed.headIndex)) ||
    typeof parsed.headHash !== 'string' ||
    !parsed.state
  ) {
    return null;
  }

  return {
    ...parsed,
    headIndex: Number(parsed.headIndex),
  };
}

export function saveAsyncDraft({
  roomId,
  baseHeadIndex,
  baseHeadHash,
  actions,
  state,
  undoStack = [],
}) {
  if (!roomId || !Array.isArray(actions) || actions.length === 0 || !state) return;

  window.localStorage.setItem(
    roomStorageKey(ASYNC_DRAFT_PREFIX, roomId),
    JSON.stringify({
      version: 1,
      roomId,
      baseHeadIndex,
      baseHeadHash,
      actions,
      state,
      undoStack: Array.isArray(undoStack) ? undoStack.slice(-MAX_UNDO_STATES) : [],
      savedAt: new Date().toISOString(),
    }),
  );
}

export function loadAsyncDraft(roomId) {
  const parsed = parseJson(
    window.localStorage.getItem(roomStorageKey(ASYNC_DRAFT_PREFIX, roomId)),
    null,
  );

  if (
    !parsed ||
    parsed.version !== 1 ||
    !Number.isInteger(Number(parsed.baseHeadIndex)) ||
    typeof parsed.baseHeadHash !== 'string' ||
    !Array.isArray(parsed.actions) ||
    (parsed.undoStack !== undefined && !Array.isArray(parsed.undoStack)) ||
    !parsed.state
  ) {
    return null;
  }

  return {
    ...parsed,
    baseHeadIndex: Number(parsed.baseHeadIndex),
    undoStack: Array.isArray(parsed.undoStack) ? parsed.undoStack : [],
  };
}

export function clearAsyncDraft(roomId) {
  window.localStorage.removeItem(roomStorageKey(ASYNC_DRAFT_PREFIX, roomId));
}

export function clearAsyncRoomState(roomId) {
  window.localStorage.removeItem(roomStorageKey(ASYNC_ROOM_STATE_PREFIX, roomId));
}

export function clearAsyncRoomStorage(roomId) {
  clearAsyncDraft(roomId);
  clearAsyncRoomState(roomId);
}

export function savePendingPlayerProfile({
  roomId,
  playerId,
  name,
  country,
  nationalNumber,
}) {
  if (!roomId || !playerId || !name || !country || !nationalNumber) return;

  window.localStorage.setItem(
    playerRoomStorageKey(PENDING_PLAYER_PROFILE_PREFIX, roomId, playerId),
    JSON.stringify({
      version: 1,
      roomId,
      playerId,
      name,
      country,
      nationalNumber,
      savedAt: new Date().toISOString(),
    }),
  );
}

export function loadPendingPlayerProfile(roomId, playerId) {
  const parsed = parseJson(
    window.localStorage.getItem(
      playerRoomStorageKey(PENDING_PLAYER_PROFILE_PREFIX, roomId, playerId),
    ),
    null,
  );

  if (
    !parsed ||
    parsed.version !== 1 ||
    typeof parsed.name !== 'string' ||
    typeof parsed.country !== 'string' ||
    typeof parsed.nationalNumber !== 'string'
  ) {
    return null;
  }

  return {
    ...parsed,
    roomId,
    playerId,
  };
}

export function clearPendingPlayerProfile(roomId, playerId) {
  window.localStorage.removeItem(
    playerRoomStorageKey(PENDING_PLAYER_PROFILE_PREFIX, roomId, playerId),
  );
}

export function clearAllAsyncRoomStorage() {
  const keysToRemove = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (
      key?.startsWith(ASYNC_ROOM_STATE_PREFIX) ||
      key?.startsWith(ASYNC_DRAFT_PREFIX) ||
      key?.startsWith(PENDING_PLAYER_PROFILE_PREFIX)
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}
