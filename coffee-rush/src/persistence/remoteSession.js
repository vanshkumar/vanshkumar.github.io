const REMOTE_SESSION_KEY = 'coffee-rush:remote-session:v1';
const ROOM_CODE_LENGTH = 6;

export const REMOTE_MODES = {
  LOCAL: 'local',
  HOST: 'host',
  PEER: 'peer',
};

export function normalizeRoomCode(value) {
  return String(value ?? '')
    .trim()
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, ROOM_CODE_LENGTH);
}

export function createRoomCode(random = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += alphabet[Math.floor(random() * alphabet.length)];
  }

  return code;
}

export function createRemoteSession({ mode, roomId, clientId = '' }) {
  const normalizedRoomId = normalizeRoomCode(roomId);

  if (![REMOTE_MODES.HOST, REMOTE_MODES.PEER].includes(mode)) {
    throw new Error('Remote session mode must be host or peer.');
  }

  if (normalizedRoomId.length !== ROOM_CODE_LENGTH) {
    throw new Error('Remote room code must be 6 characters.');
  }

  return {
    version: 1,
    mode,
    roomId: normalizedRoomId,
    clientId,
    createdAt: new Date().toISOString(),
  };
}

export function saveRemoteSession(session) {
  window.localStorage.setItem(REMOTE_SESSION_KEY, JSON.stringify(session));
}

export function loadRemoteSession() {
  const raw = window.localStorage.getItem(REMOTE_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const mode = parsed?.mode;
    const roomId = normalizeRoomCode(parsed?.roomId);

    if (![REMOTE_MODES.HOST, REMOTE_MODES.PEER].includes(mode)) {
      return null;
    }

    if (roomId.length !== ROOM_CODE_LENGTH) {
      return null;
    }

    return {
      ...parsed,
      roomId,
      clientId: parsed.clientId ?? '',
    };
  } catch {
    return null;
  }
}

export function clearRemoteSession() {
  window.localStorage.removeItem(REMOTE_SESSION_KEY);
}

export function getRoomCodeFromLocation(location = window.location) {
  try {
    return normalizeRoomCode(new URL(location.href).searchParams.get('room'));
  } catch {
    return '';
  }
}

export function buildInviteUrl(roomId, location = window.location) {
  const url = new URL(location.href);
  url.searchParams.set('room', normalizeRoomCode(roomId));
  url.hash = '#/';
  return url.toString();
}
