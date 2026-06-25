import { bytesToBase64Url } from '../persistence/remoteSession';

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const ENCRYPTION_LABEL = 'A256GCM';
const NONCE_BYTES = 12;
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

function base64UrlToBytes(value) {
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

function isEncryptedEnvelope(value) {
  return (
    value?.v === 1 &&
    value?.alg === ENCRYPTION_LABEL &&
    typeof value?.iv === 'string' &&
    typeof value?.ciphertext === 'string'
  );
}

export async function createRoomCipher(gameKey) {
  const key = await importAesKey(gameKey);

  return {
    async encrypt(payload) {
      const iv = createNonce();
      const plaintext = TEXT_ENCODER.encode(JSON.stringify(payload));
      const ciphertext = await crypto.subtle.encrypt(
        { name: ENCRYPTION_ALGORITHM, iv },
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

    async decrypt(envelope) {
      if (!isEncryptedEnvelope(envelope)) {
        throw new Error('The room message is not encrypted.');
      }

      const plaintext = await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_ALGORITHM,
          iv: base64UrlToBytes(envelope.iv),
        },
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
