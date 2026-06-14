import {
  getBoardView,
  getLegalDestinations,
  getLegalSetupCells,
} from '../engine/selectors';
import { PHASES } from '../engine/types';
import IngredientIcon from './IngredientIcon';

export default function Board({
  state,
  selectedMeepleId,
  path,
  rushSpent,
  onSelectMeeple,
  onCellClick,
}) {
  const cells = getBoardView(state);
  const legalDestinations =
    state.phase === PHASES.SETUP_PLACEMENT
      ? getLegalSetupCells(state)
      : selectedMeepleId
        ? getLegalDestinations(state, selectedMeepleId, rushSpent)
        : [];

  return (
    <section className="board-shell" aria-label="Ingredient board">
      <div className="ingredient-board">
        {cells.map((cell) => {
          const isInPath = path.includes(cell.id);
          const isLegal = legalDestinations.includes(cell.id);

          return (
            <div
              key={cell.id}
              className={`board-cell ${isLegal ? 'legal-cell' : ''} ${
                isInPath ? 'path-cell' : ''
              }`}
              role="button"
              tabIndex={0}
              data-testid={`cell-${cell.id}`}
              aria-label={`Cell ${cell.id}, ${cell.ingredient}`}
              onClick={() => onCellClick(cell.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  onCellClick(cell.id);
                }
              }}
            >
              <IngredientIcon ingredient={cell.ingredient} />
              <span className="cell-flags">
                {cell.isCorner && <span>corner</span>}
                {cell.isSpecialty && <span>special</span>}
              </span>
              <span className="meeple-stack">
                {cell.meeples.map((meeple) => (
                  <button
                    key={meeple.id}
                    className={`meeple meeple-${meeple.color} ${
                      selectedMeepleId === meeple.id ? 'meeple-selected' : ''
                    }`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectMeeple(meeple.id);
                    }}
                    title={`${meeple.playerName} meeple`}
                  >
                    {meeple.playerName.slice(0, 1)}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
