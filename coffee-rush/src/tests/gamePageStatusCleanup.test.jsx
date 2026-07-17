import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import { PHASES } from '../engine/types';
import GamePage from '../pages/GamePage';
import { saveGame } from '../persistence/localStorage';

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

function cupForOrder(order) {
  return Object.entries(order.recipe).flatMap(([ingredient, count]) =>
    Array.from({ length: count }, () => ingredient),
  );
}

function renderReadyPourState() {
  globalThis.window = {
    localStorage: createLocalStorage(),
    location: new URL('https://example.test/coffee-rush/#/game'),
  };

  const initialState = createInitialState({
    playerNames: ['Ada', 'Ben'],
    seed: 'status-cleanup-render-test',
    startingPlayerIndex: 0,
  });
  const activeOrder = initialState.players[0].tabs.flat()[0];
  const readyState = {
    ...initialState,
    activePlayerId: 'p1',
    phase: PHASES.POUR,
    setupPlacementQueue: [],
    lastMessage: 'Ada poured milk.',
    players: initialState.players.map((player) =>
      player.id === 'p1'
        ? {
            ...player,
            cups: [cupForOrder(activeOrder), [], []],
            hand: [],
          }
        : player,
    ),
  };

  saveGame(readyState);

  return {
    activeOrder,
    html: renderToStaticMarkup(
      <StaticRouter location="/game">
        <GamePage />
      </StaticRouter>,
    ),
  };
}

describe('GamePage status cleanup', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('keeps ready actions while removing passive narration and duplicate readiness copy', () => {
    const { activeOrder, html } = renderReadyPourState();

    expect(html).not.toContain('Ada poured milk.');
    expect(html).not.toContain('message-banner');
    expect(html).not.toContain('Ready to serve');
    expect(html).not.toContain('No ingredients remain in hand');
    expect(html).toContain('cup-ready-badge');
    expect(html).toContain('Ready');
    expect(html).toContain(`Serve C1: ${activeOrder.name}`);
    expect(html).toContain('No ingredients in hand');
  });
});
