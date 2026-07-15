import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Board from '../components/Board';
import { createInitialState } from '../engine/initialState';

function renderBoard() {
  const state = createInitialState({
    playerNames: ['Ada', 'Grace'],
    seed: 'specialty-board-test',
  });

  return renderToStaticMarkup(
    <Board
      state={state}
      selectedMeepleId={null}
      path={[]}
      rushSpent={0}
      onSelectMeeple={() => {}}
      onCellClick={() => {}}
    />,
  );
}

describe('Board specialty cells', () => {
  it('renders the four physical-board specialty ribbons', () => {
    const html = renderBoard();

    expect(html.match(/class="specialty-cell-ribbon"/g)).toHaveLength(4);
    expect(html.match(/class="board-cell specialty-cell /g)).toHaveLength(4);
  });

  it('announces specialty ingredient cells accessibly', () => {
    const html = renderBoard();

    expect(html).toContain('aria-label="Cell 12, Caramel, specialty ingredient');
    expect(html).toContain('aria-label="Cell 24, Water, specialty ingredient');
    expect(html).toContain('aria-label="Cell 31, Tea, specialty ingredient');
    expect(html).toContain('aria-label="Cell 43, Chocolate, specialty ingredient');
    expect(html).not.toContain('>special</span>');
  });
});
