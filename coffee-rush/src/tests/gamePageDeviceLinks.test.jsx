import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import GamePage from '../pages/GamePage';
import { saveGame } from '../persistence/localStorage';
import {
  REMOTE_MODES,
  REMOTE_PROTOCOLS,
  createRemoteSession,
  saveRemoteSession,
} from '../persistence/remoteSession';

const RELAY_AUTH = 'relay_auth_token';
const GAME_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function createLocalStorage() {
  const values = new Map();

  return {
    get length() {
      return values.size;
    },
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

function renderAsyncGame({ playerNames, localPlayerId }) {
  globalThis.window = {
    localStorage: createLocalStorage(),
    location: new URL('https://example.test/coffee-rush/#/game'),
  };

  saveGame(
    createInitialState({
      playerNames,
      seed: 'device-link-render-test',
      startingPlayerIndex: 0,
    }),
  );
  saveRemoteSession(
    createRemoteSession({
      mode: REMOTE_MODES.PEER,
      roomId: 'ab12cd',
      relayAuth: RELAY_AUTH,
      gameKey: GAME_KEY,
      localPlayerId,
      invitePlayerId: localPlayerId,
      protocol: REMOTE_PROTOCOLS.ASYNC,
      headIndex: 1,
      headHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    }),
  );

  return renderToStaticMarkup(
    <StaticRouter location="/game">
      <GamePage />
    </StaticRouter>,
  );
}

describe('GamePage device links', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('lets an async player copy a device link for any seat in the room', () => {
    const html = renderAsyncGame({
      playerNames: ['Ada', 'Ben', 'Cleo', 'Dev'],
      localPlayerId: 'p2',
    });

    expect(html).toContain('Device links');
    expect(html).toMatch(/<option[^>]*value="p1"[^>]*>Ada \(Player 1\)<\/option>/);
    expect(html).toMatch(/<option[^>]*value="p2"[^>]*>Ben \(Player 2\)<\/option>/);
    expect(html).toMatch(/<option[^>]*value="p3"[^>]*>Cleo \(Player 3\)<\/option>/);
    expect(html).toMatch(/<option[^>]*value="p4"[^>]*>Dev \(Player 4\)<\/option>/);
    expect(html).toContain('Copy device link');
  });
});
