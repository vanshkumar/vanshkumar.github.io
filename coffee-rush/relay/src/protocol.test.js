import { describe, expect, it } from 'vitest';
import {
  ASYNC_PROTOCOL_VERSION,
  CLOSE_CODES,
  createNotificationRosterHeadPayload,
  createTokenBucket,
  consumeToken,
  hashCommitEnvelope,
  hashNotificationRosterEnvelope,
  isValidEncryptedEnvelope,
  isNotificationRosterUpdateStale,
  normalizeRoomCode,
  safeParseRelayEnvelope,
  validateCommitRequest,
  validateCreateRoomRequest,
  validateHeadRequest,
  validateJoinEnvelope,
  validateNotificationRosterHeadRequest,
  validateNotificationRosterUpdateRequest,
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

  it('validates async v2 create, head, and commit requests', () => {
    const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    expect(
      validateCreateRoomRequest({
        protocol: ASYNC_PROTOCOL_VERSION,
        roomAuth: 'shared_room_auth',
        hostAuth: 'private_host_auth',
        initialSnapshot: encryptedPayload,
        headHash: hash,
      }),
    ).toBe('');
    expect(
      validateHeadRequest({
        protocol: ASYNC_PROTOCOL_VERSION,
        roomAuth: 'shared_room_auth',
        knownHeadIndex: 0,
        knownHeadHash: hash,
      }),
    ).toBe('');
    expect(
      validateCommitRequest({
        protocol: ASYNC_PROTOCOL_VERSION,
        roomAuth: 'shared_room_auth',
        expectedHeadIndex: 0,
        prevHeadHash: hash,
        commitHash: hash,
        encryptedCommit: encryptedPayload,
        encryptedSnapshot: encryptedPayload,
      }),
    ).toBe('');
    expect(
      validateCommitRequest({
        protocol: ASYNC_PROTOCOL_VERSION,
        roomAuth: 'shared_room_auth',
        expectedHeadIndex: 0,
        prevHeadHash: hash,
        commitHash: hash,
        encryptedCommit: { type: 'TURN_COMMIT' },
        encryptedSnapshot: encryptedPayload,
      }),
    ).toBe('Invalid encrypted commit.');
  });

  it('hashes encrypted commits deterministically for the visible sequence chain', async () => {
    const commit = {
      roomId: 'ab12cd',
      commitIndex: 1,
      prevHeadHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      encryptedCommit: encryptedPayload,
    };

    await expect(hashCommitEnvelope(commit)).resolves.toBe(
      await hashCommitEnvelope({
        ...commit,
        roomId: 'AB12CD',
      }),
    );
    await expect(
      hashCommitEnvelope({
        ...commit,
        commitIndex: 2,
      }),
    ).resolves.not.toBe(await hashCommitEnvelope(commit));
  });

  it('validates encrypted notification roster requests without plaintext contacts', async () => {
    const hash = await hashNotificationRosterEnvelope({
      roomId: 'ab12cd',
      encryptedRoster: encryptedPayload,
    });

    expect(
      validateNotificationRosterHeadRequest({
        protocol: ASYNC_PROTOCOL_VERSION,
        roomAuth: 'shared_room_auth',
      }),
    ).toBe('');
    expect(
      validateNotificationRosterUpdateRequest({
        protocol: ASYNC_PROTOCOL_VERSION,
        roomAuth: 'shared_room_auth',
        previousRosterHash: '',
        rosterHash: hash,
        encryptedRoster: encryptedPayload,
      }),
    ).toBe('');
    expect(
      validateNotificationRosterUpdateRequest({
        protocol: ASYNC_PROTOCOL_VERSION,
        roomAuth: 'shared_room_auth',
        previousRosterHash: '',
        rosterHash: hash,
        encryptedRoster: {
          contacts: {
            p1: {
              whatsappNumber: '14155551212',
            },
          },
        },
      }),
    ).toBe('Invalid encrypted notification roster.');

    expect(isNotificationRosterUpdateStale('', '')).toBe(false);
    expect(isNotificationRosterUpdateStale(hash, '')).toBe(true);

    const responseText = JSON.stringify(
      createNotificationRosterHeadPayload({
        rosterHash: hash,
        encryptedRoster: encryptedPayload,
        updatedAt: 1,
        plaintextContact: '14155551212',
      }),
    );

    expect(responseText).toContain(hash);
    expect(responseText).not.toContain('14155551212');
    expect(responseText).not.toContain('plaintextContact');
  });
});
