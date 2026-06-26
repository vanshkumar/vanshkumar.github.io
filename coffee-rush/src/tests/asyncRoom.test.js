import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../engine/initialState';
import { applyAction } from '../engine/reducers';
import {
  ASYNC_DRAFT_MISMATCH_MESSAGE,
  assertAsyncDraftReplayMatchesResult,
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
const SETUP_CELL_BY_MEEPLE = {
  'p1-m1': 22,
  'p1-m2': 32,
  'p2-m1': 23,
  'p2-m2': 33,
};

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

function apply(state, action) {
  const result = applyAction(state, action);
  expect(result.error).toBeUndefined();
  return result.state;
}

function serializePlaintextRelayFields(body) {
  const scrubbed = { ...body };
  [
    'roomAuth',
    'hostAuth',
    'headHash',
    'baseHeadHash',
    'commitHash',
    'initialSnapshot',
    'encryptedCommit',
    'encryptedSnapshot',
  ].forEach((key) => {
    if (key in scrubbed) scrubbed[key] = `[${key}]`;
  });
  return JSON.stringify(scrubbed);
}

function finishSetup(state) {
  let nextState = state;

  while (nextState.phase === 'setupPlacement') {
    const placement = nextState.setupPlacementQueue[0];
    nextState = apply(nextState, {
      type: 'PLACE_STARTING_MEEPLE',
      playerId: placement.playerId,
      meepleId: placement.meepleId,
      cellId: SETUP_CELL_BY_MEEPLE[placement.meepleId],
      cupIdx: 0,
    });
  }

  return nextState;
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
        type: 'UPDATE_PLAYER_PROFILE',
        playerId: 'p2',
        name: 'Fresh Bean',
      }),
    ).toBe(true);
    expect(
      isValidAsyncAction({
        type: 'UPDATE_PLAYER_PROFILE',
        playerId: 'p2',
        name: '',
      }),
    ).toBe(false);
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

      expect(serializePlaintextRelayFields(body)).not.toContain('Ada');
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
      expect(serializePlaintextRelayFields(body)).not.toContain('PLACE_STARTING_MEEPLE');
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

  it('rejects restored async drafts whose actions do not replay to the visible commit result', async () => {
    const canonicalState = finishSetup(
      createInitialState({
        playerNames: ['Ada', 'Ben'],
        seed: 'async-draft-mismatch-test',
      }),
    );
    const activePlayer = canonicalState.players.find(
      (player) => player.id === canonicalState.activePlayerId,
    );
    const draftActions = [
      { type: 'SKIP_UPGRADES', playerId: activePlayer.id },
      {
        type: 'MOVE',
        playerId: activePlayer.id,
        meepleId: activePlayer.meeples[0].id,
        path: [21],
        rushSpent: 0,
      },
    ];
    const draftMoveState = draftActions.reduce(apply, canonicalState);
    const discardAction = {
      type: 'DISCARD_HAND',
      playerId: activePlayer.id,
      ingredientFromHand: draftMoveState.players[0].hand[0],
    };
    const draftState = apply(draftMoveState, discardAction);
    const endTurnAction = { type: 'END_TURN', playerId: activePlayer.id };
    const visibleResultState = apply(draftState, endTurnAction);

    await expect(
      assertAsyncDraftReplayMatchesResult(
        canonicalState,
        [...draftActions, discardAction, endTurnAction],
        visibleResultState,
      ),
    ).resolves.toMatchObject({
      state: visibleResultState,
      stateHash: expect.any(String),
    });

    globalThis.fetch = vi.fn();

    await expect(
      assertAsyncDraftReplayMatchesResult(
        canonicalState,
        [endTurnAction],
        visibleResultState,
      ),
    ).rejects.toMatchObject({
      code: 'DRAFT_STATE_MISMATCH',
      message: ASYNC_DRAFT_MISMATCH_MESSAGE,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
