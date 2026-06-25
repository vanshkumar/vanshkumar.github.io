import { bytesToBase64Url } from '../persistence/remoteSession';

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const ENCRYPTION_LABEL = 'A256GCM';
const NONCE_BYTES = 12;
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export function base64UrlToBytes(value) {
  const padded = String(value ?? '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(String(value ?? '').length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
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

export async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    TEXT_ENCODER.encode(String(value)),
  );

  return bytesToBase64Url(new Uint8Array(digest));
}

export async function hashJson(value, label = 'coffee-rush:json') {
  return sha256Base64Url(`${label}:${canonicalJson(value)}`);
}

async function importAesKey(gameKey) {
  return crypto.subtle.importKey(
    'raw',
    base64UrlToBytes(gameKey),
    { name: ENCRYPTION_ALGORITHM },
    false,
    ['encrypt', 'decrypt'],
  );
}

function createNonce() {
  const nonce = new Uint8Array(NONCE_BYTES);
  crypto.getRandomValues(nonce);
  return nonce;
}

export function isEncryptedEnvelope(value) {
  return (
    value?.v === 1 &&
    value?.alg === ENCRYPTION_LABEL &&
    typeof value?.iv === 'string' &&
    typeof value?.ciphertext === 'string'
  );
}

function createEncryptionParams(iv, aad) {
  const params = { name: ENCRYPTION_ALGORITHM, iv };

  if (aad !== undefined) {
    params.additionalData = TEXT_ENCODER.encode(canonicalJson(aad));
  }

  return params;
}

export function createCommitAad({ roomId, index, prevHeadHash }) {
  return {
    roomId,
    protocol: 2,
    kind: 'commit',
    index,
    prevHeadHash,
  };
}

export function createSnapshotAad({ roomId, index, headHash }) {
  return {
    roomId,
    protocol: 2,
    kind: 'snapshot',
    index,
    headHash,
  };
}

export async function hashInitialRoomHead({ roomId, state }) {
  const stateHash = await hashJson(state, 'coffee-rush:state');
  return sha256Base64Url(`coffee-rush:v2:initial:${roomId}:0:${stateHash}`);
}

export async function hashState(state) {
  return hashJson(state, 'coffee-rush:state');
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
      roomId,
      Number(commitIndex),
      String(prevHeadHash ?? ''),
      canonicalJson(encryptedCommit),
    ].join(':'),
  );
}

export async function createRoomCipher(gameKey) {
  const key = await importAesKey(gameKey);

  return {
    async encrypt(payload, { aad } = {}) {
      const iv = createNonce();
      const plaintext = TEXT_ENCODER.encode(JSON.stringify(payload));
      const ciphertext = await crypto.subtle.encrypt(
        createEncryptionParams(iv, aad),
        key,
        plaintext,
      );

      return {
        v: 1,
        alg: ENCRYPTION_LABEL,
        iv: bytesToBase64Url(iv),
        ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
      };
    },

    async decrypt(envelope, { aad } = {}) {
      if (!isEncryptedEnvelope(envelope)) {
        throw new Error('The room message is not encrypted.');
      }

      const plaintext = await crypto.subtle.decrypt(
        createEncryptionParams(base64UrlToBytes(envelope.iv), aad),
        key,
        base64UrlToBytes(envelope.ciphertext),
      );

      return JSON.parse(TEXT_DECODER.decode(plaintext));
    },
  };
}

export const ROOM_ENCRYPTION = {
  algorithm: ENCRYPTION_LABEL,
  nonceBytes: NONCE_BYTES,
};
