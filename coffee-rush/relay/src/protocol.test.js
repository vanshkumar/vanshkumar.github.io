import { describe, expect, it } from 'vitest';
import {
  CLOSE_CODES,
  createTokenBucket,
  consumeToken,
  isValidEncryptedEnvelope,
  normalizeRoomCode,
  safeParseRelayEnvelope,
  validateJoinEnvelope,
  validateRoomMessageEnvelope,
} from './protocol.js';

const encryptedPayload = {
  v: 1,
  alg: 'A256GCM',
  iv: 'abcdefghijklmnop',
  ciphertext: 'abcdefghijklmnopqrstuvwxyz',
};

describe('relay protocol validation', () => {
  it('normalizes room codes and validates joins', () => {
    expect(normalizeRoomCode(' ab-c 123 ')).toBe('ABC123');
    expect(
      validateJoinEnvelope(
        {
          type: 'JOIN',
          protocol: 1,
          roomId: 'ab12cd',
          clientId: 'client_123',
          roomAuth: 'shared_room_auth',
          hostAuth: 'private_host_auth',
          role: 'host',
        },
        'AB12CD',
      ),
    ).toBe('');
    expect(
      validateJoinEnvelope(
        {
          type: 'JOIN',
          protocol: 1,
          roomId: 'AB12CD',
          clientId: 'client_123',
          roomAuth: 'shared_room_auth',
          role: 'host',
        },
        'AB12CD',
      ),
    ).toBe('Invalid host auth.');
  });

  it('requires encrypted room payload envelopes', () => {
    expect(isValidEncryptedEnvelope(encryptedPayload)).toBe(true);
    expect(
      validateRoomMessageEnvelope(
        {
          type: 'ROOM_MESSAGE',
          roomId: 'AB12CD',
          target: 'client_456',
          data: encryptedPayload,
        },
        'AB12CD',
      ),
    ).toBe('');
    expect(
      validateRoomMessageEnvelope(
        {
          type: 'ROOM_MESSAGE',
          roomId: 'AB12CD',
          data: { type: 'HELLO' },
        },
        'AB12CD',
      ),
    ).toBe('Invalid encrypted payload.');
  });

  it('rejects oversized and malformed relay messages before routing', () => {
    expect(safeParseRelayEnvelope('{')).toMatchObject({
      error: 'Message is not valid JSON.',
    });
    expect(safeParseRelayEnvelope('x'.repeat(300 * 1024))).toMatchObject({
      error: 'Message is too large.',
      closeCode: CLOSE_CODES.TOO_LARGE,
    });
  });

  it('uses a refillable per-socket token bucket', () => {
    let bucket = createTokenBucket(0);

    for (let index = 0; index < 20; index += 1) {
      const result = consumeToken(bucket, 0);
      expect(result.allowed).toBe(true);
      bucket = result.bucket;
    }

    expect(consumeToken(bucket, 0).allowed).toBe(false);
    expect(consumeToken(bucket, 1_000).allowed).toBe(true);
  });
});
