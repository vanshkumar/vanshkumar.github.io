export const PROTOCOL_VERSION = 1;
export const ROOM_CODE_LENGTH = 6;
export const MAX_RELAY_ENVELOPE_BYTES = 256 * 1024;
export const MAX_ROOM_SOCKETS = 5;
export const JOIN_TIMEOUT_MS = 5_000;
export const ROOM_IDLE_TTL_MS = 30 * 60 * 1000;
export const ROOM_HARD_TTL_MS = 6 * 60 * 60 * 1000;
export const TOKEN_BUCKET_CAPACITY = 20;
export const TOKEN_BUCKET_REFILL_PER_SECOND = 10;

const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;
const SECRET_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const CLOSE_POLICY_VIOLATION = 1008;
const CLOSE_TOO_LARGE = 1009;

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

function isValidBase64UrlValue(value, minLength, maxLength) {
  const text = String(value ?? '');
  return (
    text.length >= minLength &&
    text.length <= maxLength &&
    BASE64_URL_PATTERN.test(text)
  );
}

export function isValidEncryptedEnvelope(value) {
  return (
    value?.v === 1 &&
    value?.alg === 'A256GCM' &&
    isValidBase64UrlValue(value?.iv, 16, 24) &&
    isValidBase64UrlValue(value?.ciphertext, 16, MAX_RELAY_ENVELOPE_BYTES)
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
