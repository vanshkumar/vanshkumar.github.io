export const PROTOCOL_VERSION = 1;
export const ASYNC_PROTOCOL_VERSION = 2;
export const ROOM_CODE_LENGTH = 6;
export const MAX_RELAY_ENVELOPE_BYTES = 256 * 1024;
export const MAX_HTTP_BODY_BYTES = 512 * 1024;
export const MAX_ENCRYPTED_COMMIT_BYTES = 256 * 1024;
export const MAX_ENCRYPTED_NOTIFICATION_ROSTER_BYTES = 64 * 1024;
export const MAX_ENCRYPTED_SNAPSHOT_BYTES = 512 * 1024;
export const MAX_ROOM_SOCKETS = 5;
export const JOIN_TIMEOUT_MS = 5_000;
export const ROOM_IDLE_TTL_MS = 30 * 60 * 1000;
export const ROOM_HARD_TTL_MS = 6 * 60 * 60 * 1000;
export const ASYNC_ROOM_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const TOKEN_BUCKET_CAPACITY = 20;
export const TOKEN_BUCKET_REFILL_PER_SECOND = 10;

const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;
const SECRET_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const HASH_PATTERN = /^[A-Za-z0-9_-]{32,96}$/;
const CLOSE_POLICY_VIOLATION = 1008;
const CLOSE_TOO_LARGE = 1009;
const TEXT_ENCODER = new TextEncoder();

export const CLOSE_CODES = {
  POLICY_VIOLATION: CLOSE_POLICY_VIOLATION,
  TOO_LARGE: CLOSE_TOO_LARGE,
};

export function normalizeRoomCode(value) {
  return String(value ?? '')
    .trim()
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, ROOM_CODE_LENGTH);
}

export function isValidRoomCode(value) {
  return ROOM_CODE_PATTERN.test(String(value ?? ''));
}

export function isValidClientId(value) {
  return CLIENT_ID_PATTERN.test(String(value ?? ''));
}

export function isValidSecret(value) {
  return SECRET_PATTERN.test(String(value ?? ''));
}

export function isValidHash(value) {
  return HASH_PATTERN.test(String(value ?? ''));
}

function isValidBase64UrlValue(value, minLength, maxLength) {
  const text = String(value ?? '');
  return (
    text.length >= minLength &&
    text.length <= maxLength &&
    BASE64_URL_PATTERN.test(text)
  );
}

export function isValidEncryptedEnvelope(value) {
  return isValidEncryptedEnvelopeWithMax(value, MAX_RELAY_ENVELOPE_BYTES);
}

export function isValidEncryptedEnvelopeWithMax(value, maxCiphertextLength) {
  return (
    value?.v === 1 &&
    value?.alg === 'A256GCM' &&
    isValidBase64UrlValue(value?.iv, 16, 24) &&
    isValidBase64UrlValue(value?.ciphertext, 16, maxCiphertextLength)
  );
}

export function safeParseRelayEnvelope(raw) {
  if (typeof raw !== 'string') {
    return { error: 'Expected a text WebSocket message.' };
  }

  if (new TextEncoder().encode(raw).length > MAX_RELAY_ENVELOPE_BYTES) {
    return { error: 'Message is too large.', closeCode: CLOSE_TOO_LARGE };
  }

  try {
    return { value: JSON.parse(raw) };
  } catch {
    return { error: 'Message is not valid JSON.' };
  }
}

export function validateJoinEnvelope(message, expectedRoomId) {
  if (message?.type !== 'JOIN') {
    return 'Expected JOIN before room messages.';
  }

  if (message.protocol !== PROTOCOL_VERSION) {
    return 'Unsupported relay protocol.';
  }

  if (normalizeRoomCode(message.roomId) !== expectedRoomId) {
    return 'Room mismatch.';
  }

  if (!isValidClientId(message.clientId)) {
    return 'Invalid client id.';
  }

  if (!['host', 'peer'].includes(message.role)) {
    return 'Invalid room role.';
  }

  if (!isValidSecret(message.roomAuth ?? message.roomSecret)) {
    return 'Invalid room auth.';
  }

  if (message.role === 'host' && !isValidSecret(message.hostAuth)) {
    return 'Invalid host auth.';
  }

  return '';
}

export function validateCreateRoomRequest(message) {
  if (message?.protocol !== ASYNC_PROTOCOL_VERSION) {
    return 'Unsupported async protocol.';
  }

  if (!isValidSecret(message.roomAuth)) {
    return 'Invalid room auth.';
  }

  if (message.hostAuth !== undefined && message.hostAuth !== '' && !isValidSecret(message.hostAuth)) {
    return 'Invalid host auth.';
  }

  if (!isValidEncryptedEnvelopeWithMax(message.initialSnapshot, MAX_ENCRYPTED_SNAPSHOT_BYTES)) {
    return 'Invalid encrypted snapshot.';
  }

  if (!isValidHash(message.headHash)) {
    return 'Invalid head hash.';
  }

  return '';
}

export function validateHeadRequest(message) {
  if (message?.protocol !== ASYNC_PROTOCOL_VERSION) {
    return 'Unsupported async protocol.';
  }

  if (!isValidSecret(message.roomAuth)) {
    return 'Invalid room auth.';
  }

  if (
    message.knownHeadIndex !== undefined &&
    (!Number.isInteger(message.knownHeadIndex) || message.knownHeadIndex < 0)
  ) {
    return 'Invalid known head index.';
  }

  if (
    message.knownHeadHash !== undefined &&
    message.knownHeadHash !== '' &&
    !isValidHash(message.knownHeadHash)
  ) {
    return 'Invalid known head hash.';
  }

  return '';
}

export function validateCommitRequest(message) {
  if (message?.protocol !== ASYNC_PROTOCOL_VERSION) {
    return 'Unsupported async protocol.';
  }

  if (!isValidSecret(message.roomAuth)) {
    return 'Invalid room auth.';
  }

  if (!Number.isInteger(message.expectedHeadIndex) || message.expectedHeadIndex < 0) {
    return 'Invalid expected head index.';
  }

  if (!isValidHash(message.prevHeadHash)) {
    return 'Invalid previous head hash.';
  }

  if (!isValidHash(message.commitHash)) {
    return 'Invalid commit hash.';
  }

  if (!isValidEncryptedEnvelopeWithMax(message.encryptedCommit, MAX_ENCRYPTED_COMMIT_BYTES)) {
    return 'Invalid encrypted commit.';
  }

  if (!isValidEncryptedEnvelopeWithMax(message.encryptedSnapshot, MAX_ENCRYPTED_SNAPSHOT_BYTES)) {
    return 'Invalid encrypted snapshot.';
  }

  return '';
}

export function validateSnapshotRequest(message) {
  if (message?.protocol !== ASYNC_PROTOCOL_VERSION) {
    return 'Unsupported async protocol.';
  }

  if (!isValidSecret(message.roomAuth)) {
    return 'Invalid room auth.';
  }

  if (!Number.isInteger(message.headIndex) || message.headIndex < 0) {
    return 'Invalid head index.';
  }

  if (!isValidHash(message.headHash)) {
    return 'Invalid head hash.';
  }

  if (!isValidEncryptedEnvelopeWithMax(message.encryptedSnapshot, MAX_ENCRYPTED_SNAPSHOT_BYTES)) {
    return 'Invalid encrypted snapshot.';
  }

  return '';
}

export function validateNotificationRosterHeadRequest(message) {
  if (message?.protocol !== ASYNC_PROTOCOL_VERSION) {
    return 'Unsupported async protocol.';
  }

  if (!isValidSecret(message.roomAuth)) {
    return 'Invalid room auth.';
  }

  return '';
}

export function validateNotificationRosterUpdateRequest(message) {
  if (message?.protocol !== ASYNC_PROTOCOL_VERSION) {
    return 'Unsupported async protocol.';
  }

  if (!isValidSecret(message.roomAuth)) {
    return 'Invalid room auth.';
  }

  if (
    message.previousRosterHash !== undefined &&
    message.previousRosterHash !== '' &&
    !isValidHash(message.previousRosterHash)
  ) {
    return 'Invalid previous notification roster hash.';
  }

  if (!isValidHash(message.rosterHash)) {
    return 'Invalid notification roster hash.';
  }

  if (
    !isValidEncryptedEnvelopeWithMax(
      message.encryptedRoster,
      MAX_ENCRYPTED_NOTIFICATION_ROSTER_BYTES,
    )
  ) {
    return 'Invalid encrypted notification roster.';
  }

  return '';
}

export function validateCloseRoomRequest(message) {
  if (message?.protocol !== ASYNC_PROTOCOL_VERSION) {
    return 'Unsupported async protocol.';
  }

  if (!isValidSecret(message.roomAuth)) {
    return 'Invalid room auth.';
  }

  if (!isValidSecret(message.hostAuth)) {
    return 'Invalid host auth.';
  }

  return '';
}

export function validateRoomMessageEnvelope(message, expectedRoomId) {
  if (message?.type !== 'ROOM_MESSAGE') {
    return 'Unsupported room envelope.';
  }

  if (normalizeRoomCode(message.roomId) !== expectedRoomId) {
    return 'Room mismatch.';
  }

  if (
    message.target !== undefined &&
    message.target !== '' &&
    !isValidClientId(message.target)
  ) {
    return 'Invalid message target.';
  }

  if (!isValidEncryptedEnvelope(message.data)) {
    return 'Invalid encrypted payload.';
  }

  return '';
}

function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      if (value[key] !== undefined) {
        result[key] = canonicalize(value[key]);
      }
      return result;
    }, {});
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function bytesToBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', TEXT_ENCODER.encode(String(value)));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function hashCommitEnvelope({
  roomId,
  commitIndex,
  prevHeadHash,
  encryptedCommit,
}) {
  return sha256Base64Url(
    [
      'coffee-rush:v2',
      normalizeRoomCode(roomId),
      Number(commitIndex),
      String(prevHeadHash ?? ''),
      canonicalJson(encryptedCommit),
    ].join(':'),
  );
}

export async function hashNotificationRosterEnvelope({
  roomId,
  encryptedRoster,
}) {
  return sha256Base64Url(
    [
      'coffee-rush:v2:notifications',
      normalizeRoomCode(roomId),
      canonicalJson(encryptedRoster),
    ].join(':'),
  );
}

export function isNotificationRosterUpdateStale(currentRosterHash, previousRosterHash = '') {
  return String(currentRosterHash ?? '') !== String(previousRosterHash ?? '');
}

export function createNotificationRosterHeadPayload(rosterRecord = null) {
  return {
    protocol: ASYNC_PROTOCOL_VERSION,
    rosterHash: rosterRecord?.rosterHash ?? '',
    encryptedRoster: rosterRecord?.encryptedRoster ?? null,
    updatedAt: rosterRecord?.updatedAt ?? 0,
  };
}

export function createTokenBucket(now = Date.now()) {
  return {
    tokens: TOKEN_BUCKET_CAPACITY,
    updatedAt: now,
  };
}

export function consumeToken(bucket, now = Date.now()) {
  const elapsedSeconds = Math.max(0, (now - bucket.updatedAt) / 1000);
  const tokens = Math.min(
    TOKEN_BUCKET_CAPACITY,
    bucket.tokens + elapsedSeconds * TOKEN_BUCKET_REFILL_PER_SECOND,
  );

  if (tokens < 1) {
    return {
      allowed: false,
      bucket: {
        tokens,
        updatedAt: now,
      },
    };
  }

  return {
    allowed: true,
    bucket: {
      tokens: tokens - 1,
      updatedAt: now,
    },
  };
}
