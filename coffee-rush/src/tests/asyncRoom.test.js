import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../engine/initialState';
import {
  createAsyncEndpointUrl,
  createAsyncRoom,
  isValidAsyncAction,
  submitTurnCommit,
} from '../network/asyncRoom';
import {
  REMOTE_MODES,
  createRemoteSession,
} from '../persistence/remoteSession';

const RELAY_AUTH = 'relay_auth_token';
const HOST_AUTH = 'host_auth_token1';
const GAME_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function createSession(overrides = {}) {
  return createRemoteSession({
    mode: REMOTE_MODES.HOST,
    roomId: 'ab12cd',
    relayAuth: RELAY_AUTH,
    hostAuth: HOST_AUTH,
    gameKey: GAME_KEY,
    ...overrides,
  });
}

describe('async room client', () => {
  beforeEach(() => {
    globalThis.window = {
      location: new URL(
        'https://example.test/coffee-rush/?relay=wss://relay.example.test/room#/game',
      ),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.fetch;
  });

  it('builds HTTP endpoints from WebSocket relay URLs', () => {
    expect(
      createAsyncEndpointUrl(
        'wss://relay.example.test/room?debug=1',
        'head',
        'ab12cd',
        new URL('https://example.test/coffee-rush/#/'),
      ),
    ).toBe('https://relay.example.test/room/head?debug=1&room=AB12CD');
  });

  it('validates allowlisted reducer action shapes', () => {
    expect(
      isValidAsyncAction({
        type: 'MOVE',
        playerId: 'p1',
        meepleId: 'p1-m1',
        path: [1, 2, 3],
        rushSpent: 0,
      }),
    ).toBe(true);
    expect(
      isValidAsyncAction({
        type: 'MOVE',
        playerId: 'p1',
        meepleId: 'p1-m1',
        path: [1],
        rushSpent: 0,
        script: '<script>alert(1)</script>',
      }),
    ).toBe(false);
  });

  it('creates async rooms with encrypted initial snapshots', async () => {
    const state = createInitialState({
      playerNames: ['Ada', 'Ben'],
      seed: 'async-create-test',
    });
    const session = createSession();
    const requests = [];
    globalThis.fetch = vi.fn(async (url, options) => {
      requests.push({ url, options });
      const body = JSON.parse(options.body);

      expect(JSON.stringify(body)).not.toContain('Ada');
      expect(body.initialSnapshot).toMatchObject({ v: 1, alg: 'A256GCM' });

      return Response.json({
        protocol: 2,
        accepted: true,
        headIndex: 0,
        headHash: body.headHash,
        latestSnapshotIndex: 0,
      });
    });

    const acceptedSession = await createAsyncRoom(session, state);

    expect(requests[0].url).toContain('/room/create?room=AB12CD');
    expect(acceptedSession).toMatchObject({
      protocol: 2,
      headIndex: 0,
      roomId: 'AB12CD',
    });
    expect(acceptedSession.headHash).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('submits one encrypted commit for a completed local action batch', async () => {
    const state = createInitialState({
      playerNames: ['Ada', 'Ben'],
      seed: 'async-commit-test',
    });
    const session = createSession({
      headIndex: 0,
      headHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    globalThis.fetch = vi.fn(async (url, options) => {
      const body = JSON.parse(options.body);

      expect(url).toContain('/room/commits?room=AB12CD');
      expect(JSON.stringify(body)).not.toContain('PLACE_STARTING_MEEPLE');
      expect(body.encryptedCommit).toMatchObject({ v: 1, alg: 'A256GCM' });
      expect(body.encryptedSnapshot).toMatchObject({ v: 1, alg: 'A256GCM' });

      return Response.json({
        protocol: 2,
        accepted: true,
        headIndex: 1,
        headHash: body.commitHash,
        latestSnapshotIndex: 1,
      });
    });

    await expect(
      submitTurnCommit(
        session,
        { headIndex: 0, headHash: session.headHash },
        [
          {
            type: 'PLACE_STARTING_MEEPLE',
            playerId: 'p2',
            meepleId: 'p2-m1',
            cellId: 1,
            cupIdx: 0,
          },
        ],
        state,
      ),
    ).resolves.toMatchObject({
      accepted: true,
      headIndex: 1,
    });
  });
});
