import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PlayerOrdersSheet from '../components/PlayerOrdersSheet';

const urgentOrder = {
  id: 'urgent-order',
  name: 'Caffe Latte',
  recipe: {
    coffee: 1,
    milk: 1,
    steam: 1,
  },
  isSpecialty: false,
};

const newOrder = {
  id: 'new-order',
  name: 'Caramel Macchiato',
  recipe: {
    coffee: 1,
    milk: 1,
    caramel: 1,
  },
  isSpecialty: true,
};

function createPlayer(overrides = {}) {
  return {
    id: 'p1',
    name: 'Ada',
    color: 'rose',
    cups: [['coffee'], [], []],
    completed: [],
    penalties: [],
    rushTokens: 2,
    tabs: [[newOrder], [], [], [urgentOrder]],
    ...overrides,
  };
}

describe('PlayerOrdersSheet', () => {
  it('renders order planning sections without cup state', () => {
    const html = renderToStaticMarkup(
      <PlayerOrdersSheet player={createPlayer()} onClose={() => {}} />,
    );

    expect(html).toContain('Ada orders');
    expect(html).toContain('Next penalty');
    expect(html).toContain('New');
    expect(html.indexOf('Caffe Latte')).toBeLessThan(html.indexOf('Caramel Macchiato'));
    expect(html).not.toContain('cup-memory');
    expect(html).not.toContain('cups-row');
  });

  it('marks ready active-player orders in the expanded view', () => {
    const html = renderToStaticMarkup(
      <PlayerOrdersSheet
        player={createPlayer()}
        readyOrderIds={new Set(['urgent-order'])}
        onClose={() => {}}
      />,
    );

    expect(html).toContain('order-card-ready');
    expect(html).toContain('Caffe Latte is ready to serve');
  });
});
