import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  REMOTE_MODES,
  buildInviteUrl,
  clearRemoteSession,
  createGameKey,
  createHostAuth,
  createRelayAuth,
  createRemoteSession,
  createRoomCode,
  formatInviteToken,
  getInviteFromLocation,
  getRoomCodeFromLocation,
  loadRemoteSession,
  normalizeRoomCode,
  parseInviteInput,
  saveRemoteSession,
} from '../persistence/remoteSession';

const RELAY_AUTH = 'relay_auth_token';
const HOST_AUTH = 'host_auth_token1';
const GAME_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

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
    expect(
      getRoomCodeFromLocation(
        new URL('https://example.test/?room=zz-9911#/?auth=auth_1&key=key-2'),
      ),
    ).toBe('ZZ9911');
    expect(
      buildInviteUrl(
        { roomId: 'ab12cd', relayAuth: RELAY_AUTH, gameKey: GAME_KEY },
        new URL('https://example.test/coffee-rush/#/game'),
      ),
    ).toBe(
      `https://example.test/coffee-rush/?room=AB12CD#/?auth=${RELAY_AUTH}&key=${GAME_KEY}`,
    );
  });

  it('creates deterministic six-character room codes with injectable randomness', () => {
    const randomValues = [0, 0.1, 0.25, 0.5, 0.75, 0.99];
    let index = 0;

    expect(createRoomCode(() => randomValues[index++])).toHaveLength(6);
    expect(createRelayAuth()).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(createHostAuth()).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(createGameKey()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('parses full invite URLs and compact invite tokens', () => {
    const inviteUrl = new URL(
      `https://example.test/coffee-rush/?room=ab12cd#/?auth=${RELAY_AUTH}&key=${GAME_KEY}`,
    );

    expect(getInviteFromLocation(inviteUrl)).toEqual({
      roomId: 'AB12CD',
      relayAuth: RELAY_AUTH,
      gameKey: GAME_KEY,
    });
    expect(parseInviteInput(`ab12cd.${RELAY_AUTH}.${GAME_KEY}`)).toEqual({
      roomId: 'AB12CD',
      relayAuth: RELAY_AUTH,
      gameKey: GAME_KEY,
    });
    expect(formatInviteToken('ab12cd', RELAY_AUTH, GAME_KEY)).toBe(
      `AB12CD.${RELAY_AUTH}.${GAME_KEY}`,
    );
  });

  it('round-trips valid remote sessions and ignores invalid saved data', () => {
    const session = createRemoteSession({
      mode: REMOTE_MODES.HOST,
      roomId: 'ab12cd',
      relayAuth: RELAY_AUTH,
      hostAuth: HOST_AUTH,
      gameKey: GAME_KEY,
      clientId: 'self',
    });

    saveRemoteSession(session);
    expect(loadRemoteSession()).toMatchObject({
      mode: REMOTE_MODES.HOST,
      roomId: 'AB12CD',
      relayAuth: RELAY_AUTH,
      hostAuth: HOST_AUTH,
      gameKey: GAME_KEY,
      clientId: 'self',
    });

    clearRemoteSession();
    expect(loadRemoteSession()).toBeNull();

    window.localStorage.setItem(
      'coffee-rush:remote-session:v2',
      JSON.stringify({ mode: 'local', roomId: 'ABC123' }),
    );
    expect(loadRemoteSession()).toBeNull();
  });
});
