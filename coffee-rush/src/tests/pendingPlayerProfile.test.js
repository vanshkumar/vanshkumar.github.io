import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingPlayerProfile,
  loadPendingPlayerProfile,
  savePendingPlayerProfile,
} from '../persistence/localStorage';

function createLocalStorage() {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe('pending player profile storage', () => {
  beforeEach(() => {
    globalThis.window = {
      localStorage: createLocalStorage(),
    };
  });

  afterEach(() => {
    delete globalThis.window;
  });

  it('round-trips and clears profile handoff data by room and player', () => {
    savePendingPlayerProfile({
      roomId: 'ab12cd',
      playerId: 'p2',
      name: 'Fresh Bean',
      country: 'UK',
      nationalNumber: '7700900123',
    });

    expect(loadPendingPlayerProfile('AB12CD', 'p2')).toMatchObject({
      roomId: 'AB12CD',
      playerId: 'p2',
      name: 'Fresh Bean',
      country: 'UK',
      nationalNumber: '7700900123',
    });
    expect(loadPendingPlayerProfile('AB12CD', 'p1')).toBeNull();

    clearPendingPlayerProfile('AB12CD', 'p2');
    expect(loadPendingPlayerProfile('AB12CD', 'p2')).toBeNull();
  });
});
