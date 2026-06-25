import { describe, expect, it } from 'vitest';
import { bytesToBase64Url } from '../persistence/remoteSession';
import { createRoomCipher, ROOM_ENCRYPTION } from '../network/roomCrypto';

describe('room message encryption', () => {
  it('round-trips room payloads with AES-GCM envelopes', async () => {
    const gameKey = bytesToBase64Url(new Uint8Array(32).fill(7));
    const cipher = await createRoomCipher(gameKey);
    const encrypted = await cipher.encrypt({
      type: 'HELLO',
      knownActionIndex: 3,
    });

    expect(encrypted).toMatchObject({
      v: 1,
      alg: ROOM_ENCRYPTION.algorithm,
    });
    expect(JSON.stringify(encrypted)).not.toContain('HELLO');
    await expect(cipher.decrypt(encrypted)).resolves.toEqual({
      type: 'HELLO',
      knownActionIndex: 3,
    });
  });

  it('rejects messages encrypted for a different game key', async () => {
    const cipher = await createRoomCipher(bytesToBase64Url(new Uint8Array(32).fill(7)));
    const otherCipher = await createRoomCipher(
      bytesToBase64Url(new Uint8Array(32).fill(8)),
    );
    const encrypted = await cipher.encrypt({ type: 'RESYNC_REQUEST' });

    await expect(otherCipher.decrypt(encrypted)).rejects.toThrow();
  });
});
