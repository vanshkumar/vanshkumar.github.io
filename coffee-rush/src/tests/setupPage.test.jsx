import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import SetupPage from '../pages/SetupPage';

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

function renderSetupPage(href) {
  globalThis.window = {
    localStorage: createLocalStorage(),
    location: new URL(href),
  };

  return renderToStaticMarkup(
    <StaticRouter location="/">
      <SetupPage />
    </StaticRouter>,
  );
}

describe('SetupPage invite entry', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('hides host-only setup copy for a player-specific private invite', () => {
    const html = renderSetupPage(
      `https://example.test/coffee-rush/?room=ab12cd#/?auth=${RELAY_AUTH}&key=${GAME_KEY}&player=p2`,
    );

    expect(html).toContain('Join online room');
    expect(html).toContain('Your name for Player 2');
    expect(html).toContain('join as Player 2');
    expect(html).toContain('Join as Player 2');
    expect(html).not.toContain('Starting player');
    expect(html).not.toContain('Host online game');
    expect(html).not.toContain('>You</option>');
  });
});
