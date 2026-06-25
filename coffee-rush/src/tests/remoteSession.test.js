import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  REMOTE_MODES,
  buildInviteUrl,
  clearRemoteSession,
  createRemoteSession,
  createRoomCode,
  getRoomCodeFromLocation,
  loadRemoteSession,
  normalizeRoomCode,
  saveRemoteSession,
} from '../persistence/remoteSession';

function createLocalStorage() {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe('remote session persistence', () => {
  beforeEach(() => {
    globalThis.window = {
      localStorage: createLocalStorage(),
      location: new URL('https://example.test/coffee-rush/#/'),
    };
  });

  afterEach(() => {
    delete globalThis.window;
  });

  it('normalizes room codes for links and form input', () => {
    expect(normalizeRoomCode(' ab-c 123 ')).toBe('ABC123');
    expect(getRoomCodeFromLocation(new URL('https://example.test/?room=zz-9911#/'))).toBe(
      'ZZ9911',
    );
    expect(buildInviteUrl('ab12cd', new URL('https://example.test/coffee-rush/#/game'))).toBe(
      'https://example.test/coffee-rush/?room=AB12CD#/',
    );
  });

  it('creates deterministic six-character room codes with injectable randomness', () => {
    const randomValues = [0, 0.1, 0.25, 0.5, 0.75, 0.99];
    let index = 0;

    expect(createRoomCode(() => randomValues[index++])).toHaveLength(6);
  });

  it('round-trips valid remote sessions and ignores invalid saved data', () => {
    const session = createRemoteSession({
      mode: REMOTE_MODES.HOST,
      roomId: 'ab12cd',
      clientId: 'self',
    });

    saveRemoteSession(session);
    expect(loadRemoteSession()).toMatchObject({
      mode: REMOTE_MODES.HOST,
      roomId: 'AB12CD',
      clientId: 'self',
    });

    clearRemoteSession();
    expect(loadRemoteSession()).toBeNull();

    window.localStorage.setItem(
      'coffee-rush:remote-session:v1',
      JSON.stringify({ mode: 'local', roomId: 'ABC123' }),
    );
    expect(loadRemoteSession()).toBeNull();
  });
});
