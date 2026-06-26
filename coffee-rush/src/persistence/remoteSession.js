const REMOTE_SESSION_KEY = 'coffee-rush:remote-session:v3';
const ASYNC_REMOTE_SESSION_KEY = 'coffee-rush:remote-session:v2';
const LEGACY_REMOTE_SESSION_KEY = 'coffee-rush:remote-session:v1';
const ROOM_CODE_LENGTH = 6;
const RELAY_AUTH_BYTES = 16;
const GAME_KEY_BYTES = 32;
const SECRET_PATTERN = /^[A-Za-z0-9_-]+$/;
const AUTH_SECRET_MIN_LENGTH = 16;
const SECRET_MAX_LENGTH = 128;
const AES_KEY_TEXT_LENGTHS = new Set([22, 32, 43]);
const HASH_PATTERN = /^[A-Za-z0-9_-]{32,96}$/;
const QUERY_INVITE_SECRET_PARAMS = ['auth', 'key'];

export const REMOTE_MODES = {
  LOCAL: 'local',
  HOST: 'host',
  PEER: 'peer',
};

export const REMOTE_PROTOCOLS = {
  LIVE: 1,
  ASYNC: 2,
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

export function bytesToBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function createSecret(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function createRelayAuth() {
  return createSecret(RELAY_AUTH_BYTES);
}

export function createHostAuth() {
  return createSecret(RELAY_AUTH_BYTES);
}

export function createGameKey() {
  return createSecret(GAME_KEY_BYTES);
}

export function normalizeInviteSecret(
  value,
  { minLength = 1, maxLength = SECRET_MAX_LENGTH } = {},
) {
  const secret = String(value ?? '').trim();

  if (
    secret.length < minLength ||
    secret.length > maxLength ||
    !SECRET_PATTERN.test(secret)
  ) {
    return '';
  }

  return secret;
}

export function normalizeGameKey(value) {
  const secret = normalizeInviteSecret(value);

  if (!AES_KEY_TEXT_LENGTHS.has(secret.length)) {
    return '';
  }

  return secret;
}

export function normalizeHeadHash(value) {
  const hash = String(value ?? '').trim();
  return hash === '' || HASH_PATTERN.test(hash) ? hash : '';
}

function normalizeProtocol(value, fallback = REMOTE_PROTOCOLS.ASYNC) {
  if (Number(value) === REMOTE_PROTOCOLS.LIVE) return REMOTE_PROTOCOLS.LIVE;
  if (Number(value) === REMOTE_PROTOCOLS.ASYNC) return REMOTE_PROTOCOLS.ASYNC;
  return fallback;
}

function normalizeHeadIndex(value) {
  const index = Number(value ?? 0);
  return Number.isInteger(index) && index >= 0 ? index : 0;
}

export function createRemoteSession({
  mode,
  roomId,
  relayAuth,
  hostAuth = '',
  gameKey,
  clientId = '',
  protocol = REMOTE_PROTOCOLS.ASYNC,
  headIndex = 0,
  headHash = '',
  roomCreatedAt = '',
}) {
  const normalizedRoomId = normalizeRoomCode(roomId);
  const normalizedRelayAuth = normalizeInviteSecret(relayAuth, {
    minLength: AUTH_SECRET_MIN_LENGTH,
  });
  const normalizedHostAuth = normalizeInviteSecret(hostAuth, {
    minLength: AUTH_SECRET_MIN_LENGTH,
  });
  const normalizedGameKey = normalizeGameKey(gameKey);

  if (![REMOTE_MODES.HOST, REMOTE_MODES.PEER].includes(mode)) {
    throw new Error('Remote session mode must be host or peer.');
  }

  if (normalizedRoomId.length !== ROOM_CODE_LENGTH) {
    throw new Error('Remote room code must be 6 characters.');
  }

  if (!normalizedRelayAuth || !normalizedGameKey) {
    throw new Error('Remote rooms require a full invite link.');
  }

  if (mode === REMOTE_MODES.HOST && !normalizedHostAuth) {
    throw new Error('Hosted remote rooms require host auth.');
  }

  return {
    version: 3,
    protocol: normalizeProtocol(protocol),
    mode,
    roomId: normalizedRoomId,
    relayAuth: normalizedRelayAuth,
    hostAuth: normalizedHostAuth,
    gameKey: normalizedGameKey,
    clientId,
    headIndex: normalizeHeadIndex(headIndex),
    headHash: normalizeHeadHash(headHash),
    roomCreatedAt,
    createdAt: new Date().toISOString(),
  };
}

export function saveRemoteSession(session) {
  window.localStorage.setItem(REMOTE_SESSION_KEY, JSON.stringify(session));
}

export function loadRemoteSession() {
  const key = [REMOTE_SESSION_KEY, ASYNC_REMOTE_SESSION_KEY, LEGACY_REMOTE_SESSION_KEY].find(
    (candidate) => window.localStorage.getItem(candidate),
  );
  const raw = key ? window.localStorage.getItem(key) : null;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const fallbackProtocol =
      parsed?.version && Number(parsed.version) >= 3
        ? REMOTE_PROTOCOLS.ASYNC
        : REMOTE_PROTOCOLS.LIVE;
    const protocol = normalizeProtocol(parsed?.protocol, fallbackProtocol);
    const mode = parsed?.mode;
    const roomId = normalizeRoomCode(parsed?.roomId);
    const relayAuth = normalizeInviteSecret(parsed?.relayAuth, {
      minLength: AUTH_SECRET_MIN_LENGTH,
    });
    const hostAuth = normalizeInviteSecret(parsed?.hostAuth, {
      minLength: AUTH_SECRET_MIN_LENGTH,
    });
    const gameKey = normalizeGameKey(parsed?.gameKey);

    if (![REMOTE_MODES.HOST, REMOTE_MODES.PEER].includes(mode)) {
      return null;
    }

    if (roomId.length !== ROOM_CODE_LENGTH) {
      return null;
    }

    if (!relayAuth || !gameKey) {
      return null;
    }

    if (mode === REMOTE_MODES.HOST && !hostAuth) {
      return null;
    }

    return {
      ...parsed,
      protocol,
      roomId,
      relayAuth,
      hostAuth,
      gameKey,
      clientId: parsed.clientId ?? '',
      headIndex: normalizeHeadIndex(parsed.headIndex),
      headHash: normalizeHeadHash(parsed.headHash),
      roomCreatedAt: parsed.roomCreatedAt ?? '',
    };
  } catch {
    return null;
  }
}

export function clearRemoteSession() {
  window.localStorage.removeItem(REMOTE_SESSION_KEY);
  window.localStorage.removeItem(ASYNC_REMOTE_SESSION_KEY);
  window.localStorage.removeItem(LEGACY_REMOTE_SESSION_KEY);
}

function getHashSearchParams(hash) {
  const queryIndex = String(hash ?? '').indexOf('?');

  if (queryIndex === -1) {
    return new URLSearchParams();
  }

  return new URLSearchParams(String(hash).slice(queryIndex + 1));
}

export function hasQueryInviteSecrets(value = window.location, baseLocation = window.location) {
  try {
    const href = typeof value === 'string' ? value : value.href;
    const url = new URL(href, baseLocation.href);
    return QUERY_INVITE_SECRET_PARAMS.some((param) => url.searchParams.has(param));
  } catch {
    return false;
  }
}

export function scrubQueryInviteSecretsFromLocation(
  location = window.location,
  history = window.history,
) {
  try {
    const url = new URL(location.href);
    let changed = false;

    QUERY_INVITE_SECRET_PARAMS.forEach((param) => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    });

    if (!changed) return false;

    history?.replaceState?.(history.state ?? null, '', url.toString());
    return true;
  } catch {
    return false;
  }
}

export function parseInviteInput(value, baseLocation = window.location) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return {
      roomId: '',
      relayAuth: '',
      gameKey: '',
    };
  }

  const tokenParts = raw.split('.');
  if (tokenParts.length === 3) {
    return {
      roomId: normalizeRoomCode(tokenParts[0]),
      relayAuth: normalizeInviteSecret(tokenParts[1], {
        minLength: AUTH_SECRET_MIN_LENGTH,
      }),
      gameKey: normalizeGameKey(tokenParts[2]),
    };
  }

  if (!raw.includes('://') && !raw.startsWith('/') && !raw.startsWith('?')) {
    return {
      roomId: normalizeRoomCode(raw),
      relayAuth: '',
      gameKey: '',
    };
  }

  try {
    const url = new URL(raw, baseLocation.href);
    const hashParams = getHashSearchParams(url.hash);

    return {
      roomId: normalizeRoomCode(url.searchParams.get('room')),
      relayAuth: normalizeInviteSecret(
        hashParams.get('auth'),
        { minLength: AUTH_SECRET_MIN_LENGTH },
      ),
      gameKey: normalizeGameKey(hashParams.get('key')),
    };
  } catch {
    return {
      roomId: normalizeRoomCode(raw),
      relayAuth: '',
      gameKey: '',
    };
  }
}

export function getInviteFromLocation(location = window.location) {
  try {
    return parseInviteInput(new URL(location.href).toString(), location);
  } catch {
    return {
      roomId: '',
      relayAuth: '',
      gameKey: '',
    };
  }
}

export function formatInviteToken(roomId, relayAuth, gameKey) {
  const normalizedRoomId = normalizeRoomCode(roomId);
  const normalizedRelayAuth = normalizeInviteSecret(relayAuth, {
    minLength: AUTH_SECRET_MIN_LENGTH,
  });
  const normalizedGameKey = normalizeGameKey(gameKey);

  if (!normalizedRoomId || !normalizedRelayAuth || !normalizedGameKey) {
    return normalizedRoomId;
  }

  return `${normalizedRoomId}.${normalizedRelayAuth}.${normalizedGameKey}`;
}

export function getRoomCodeFromLocation(location = window.location) {
  return getInviteFromLocation(location).roomId;
}

export function buildInviteUrl({ roomId, relayAuth, gameKey }, location = window.location) {
  const url = new URL(location.href);
  url.searchParams.set('room', normalizeRoomCode(roomId));
  const hashParams = new URLSearchParams();
  hashParams.set(
    'auth',
    normalizeInviteSecret(relayAuth, { minLength: AUTH_SECRET_MIN_LENGTH }),
  );
  hashParams.set('key', normalizeGameKey(gameKey));
  url.hash = `#/?${hashParams.toString()}`;
  return url.toString();
}
