import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import OrderGoalStrip from '../components/OrderGoalStrip';

const standardOrder = {
  id: 'order-a',
  name: 'Iced Latte',
  recipe: {
    coffee: 1,
    milk: 1,
    ice: 1,
  },
  isSpecialty: false,
};

const specialtyOrder = {
  id: 'order-b',
  name: 'Caramel Macchiato',
  recipe: {
    coffee: 1,
    milk: 1,
    caramel: 1,
  },
  isSpecialty: true,
};

function renderOrderGoalStrip(props = {}) {
  return renderToStaticMarkup(
    <OrderGoalStrip
      tabs={[[standardOrder], [], [], [specialtyOrder]]}
      onToggleMinimizedOrder={() => {}}
      allowOrderMinimize
      {...props}
    />,
  );
}

describe('OrderGoalStrip', () => {
  it('renders full order goals with a compact minimize control', () => {
    const html = renderOrderGoalStrip();

    expect(html).toContain('order-goal-card');
    expect(html).toContain('order-goal-minimize-button');
    expect(html).toContain('aria-label="Minimize Iced Latte"');
    expect(html).not.toContain('order-goal-chip');
  });

  it('renders minimized specialty orders as pressure chips with restore semantics', () => {
    const html = renderOrderGoalStrip({
      minimizedOrderIds: new Set(['order-b']),
    });

    expect(html).toContain('order-goal-chip');
    expect(html).toContain('order-goal-chip-critical');
    expect(html).toContain('order-goal-chip-rush');
    expect(html).not.toContain('order-goal-chip-name');
    expect(html).toContain('title="Restore Caramel Macchiato"');
    expect(html).toContain('highest pressure, next aging makes it a penalty');
    expect(html).toContain('minimized. Restore order');
  });

  it('keeps ready state visible while minimized', () => {
    const html = renderOrderGoalStrip({
      minimizedOrderIds: new Set(['order-b']),
      readyOrderIds: new Set(['order-b']),
    });

    expect(html).toContain('order-goal-chip-ready');
    expect(html).toContain('Caramel Macchiato, ready, minimized');
  });
});
