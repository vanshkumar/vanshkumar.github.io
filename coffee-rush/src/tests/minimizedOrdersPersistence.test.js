import { afterEach, describe, expect, it } from 'vitest';
import {
  clearMinimizedOrderIds,
  loadMinimizedOrderIds,
  saveMinimizedOrderIds,
} from '../persistence/localStorage';

const STORAGE_KEY = 'coffee-rush:minimized-orders:v1';

function createLocalStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));

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

describe('minimized order persistence', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('saves and loads minimized order ids for the current game only', () => {
    globalThis.window = { localStorage: createLocalStorage() };

    saveMinimizedOrderIds('game-a', ['order-1', 'order-2', 'order-1']);

    expect(loadMinimizedOrderIds('game-a')).toEqual(['order-1', 'order-2']);
    expect(loadMinimizedOrderIds('game-b')).toEqual([]);
  });

  it('falls back to an empty list for invalid stored data', () => {
    globalThis.window = {
      localStorage: createLocalStorage({
        [STORAGE_KEY]: '{"version":2,"gameKey":"game-a","orderIds":["order-1"]}',
      }),
    };

    expect(loadMinimizedOrderIds('game-a')).toEqual([]);

    window.localStorage.setItem(STORAGE_KEY, '{bad json');
    expect(loadMinimizedOrderIds('game-a')).toEqual([]);
  });

  it('clears minimized order state', () => {
    globalThis.window = { localStorage: createLocalStorage() };

    saveMinimizedOrderIds('game-a', ['order-1']);
    clearMinimizedOrderIds();

    expect(loadMinimizedOrderIds('game-a')).toEqual([]);
  });
});
