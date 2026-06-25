import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  REMOTE_MESSAGE_TYPES,
  createAcceptedAction,
  createActionRequest,
  createStateSnapshot,
  getRelayUrl,
} from '../network/roomSync';
import { createInitialState } from '../engine/initialState';

describe('room sync messages', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates peer action requests with stable ids', () => {
    const action = { type: 'SKIP_UPGRADES', playerId: 'p1' };

    expect(createActionRequest(action, 'peer-a', () => 42)).toEqual({
      type: REMOTE_MESSAGE_TYPES.ACTION_REQUEST,
      clientId: 'peer-a',
      clientActionId: 'peer-a-42',
      action,
    });
  });

  it('creates accepted actions and snapshots with action indexes', () => {
    const action = { type: 'SKIP_UPGRADES', playerId: 'p1' };
    const state = {
      ...createInitialState({
        playerNames: ['Ada', 'Ben'],
        seed: 'sync-test',
      }),
      log: [action],
    };
    const undoStack = [{ ...state, log: [] }];

    expect(createAcceptedAction(action, 1)).toEqual({
      type: REMOTE_MESSAGE_TYPES.ACTION_ACCEPTED,
      action,
      actionIndex: 1,
    });
    expect(createAcceptedAction(action, 1, 'peer-a-42')).toMatchObject({
      clientActionId: 'peer-a-42',
    });
    expect(createStateSnapshot(state, undoStack)).toMatchObject({
      type: REMOTE_MESSAGE_TYPES.STATE_SNAPSHOT,
      state,
      undoStack,
      actionIndex: 1,
    });
  });

  it('prefers explicit relay URLs over build-time relay configuration', () => {
    vi.stubEnv('VITE_COFFEE_RUSH_RELAY_URL', 'wss://relay.example.test');

    expect(getRelayUrl(new URL('https://example.test/coffee-rush/#/'))).toBe(
      'wss://relay.example.test',
    );
    expect(
      getRelayUrl(
        new URL('https://example.test/coffee-rush/?relay=ws://127.0.0.1:8787#/'),
      ),
    ).toBe('ws://127.0.0.1:8787');
  });
});
