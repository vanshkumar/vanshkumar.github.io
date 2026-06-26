import { describe, expect, it } from 'vitest';
import {
  ASYNC_ROOM_CLOSED_CONNECTION,
  ASYNC_ROOM_CLOSED_MESSAGE,
  shouldTreatAsyncRoomNotFoundAsClosed,
} from '../network/asyncRoomClosure';
import {
  REMOTE_MODES,
  REMOTE_PROTOCOLS,
  createRemoteSession,
} from '../persistence/remoteSession';

const RELAY_AUTH = 'relay_auth_token';
const HOST_AUTH = 'host_auth_token1';
const GAME_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const ROOM_NOT_FOUND = { code: 'ROOM_NOT_FOUND' };

function createPeerSession(overrides = {}) {
  return createRemoteSession({
    mode: REMOTE_MODES.PEER,
    protocol: REMOTE_PROTOCOLS.ASYNC,
    roomId: 'ab12cd',
    relayAuth: RELAY_AUTH,
    gameKey: GAME_KEY,
    ...overrides,
  });
}

describe('async closed-room handling', () => {
  it('marks existing async peers with cached room state as closed', () => {
    const session = createPeerSession();

    expect(
      shouldTreatAsyncRoomNotFoundAsClosed({
        syncError: ROOM_NOT_FOUND,
        session,
        cached: { state: { phase: 'setupPlacement' } },
      }),
    ).toBe(true);
    expect(ASYNC_ROOM_CLOSED_CONNECTION).toBe('closed');
    expect(ASYNC_ROOM_CLOSED_MESSAGE).toMatch(/closed or no longer exists/u);
  });

  it('keeps fresh old-invite peers outside the existing-peer closed-state fix', () => {
    const session = createPeerSession();

    expect(
      shouldTreatAsyncRoomNotFoundAsClosed({
        syncError: ROOM_NOT_FOUND,
        session,
      }),
    ).toBe(false);
  });

  it('does not treat live peers or hosts as async closed peers', () => {
    const livePeer = createPeerSession({ protocol: REMOTE_PROTOCOLS.LIVE });
    const asyncHost = createRemoteSession({
      mode: REMOTE_MODES.HOST,
      protocol: REMOTE_PROTOCOLS.ASYNC,
      roomId: 'ab12cd',
      relayAuth: RELAY_AUTH,
      hostAuth: HOST_AUTH,
      gameKey: GAME_KEY,
    });

    expect(
      shouldTreatAsyncRoomNotFoundAsClosed({
        syncError: ROOM_NOT_FOUND,
        session: livePeer,
        activeState: { phase: 'setupPlacement' },
      }),
    ).toBe(false);
    expect(
      shouldTreatAsyncRoomNotFoundAsClosed({
        syncError: ROOM_NOT_FOUND,
        session: asyncHost,
        activeState: { phase: 'setupPlacement' },
      }),
    ).toBe(false);
  });
});
