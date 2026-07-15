import {
  getBoardView,
  getLegalSetupCells,
  getMovePathPreview,
} from '../engine/selectors';
import { PHASES } from '../engine/types';
import { ingredientLabel } from '../data/ingredients';
import IngredientIcon from './IngredientIcon';

export default function Board({
  state,
  selectedMeepleId,
  path,
  rushSpent,
  onSelectMeeple,
  onCellClick,
  movePreview,
  selectedSetupCellId,
  canSelectSetupCell = true,
  canSelectMoveCell = true,
}) {
  const cells = getBoardView(state);
  const preview =
    movePreview ??
    (state.phase === PHASES.MOVE && selectedMeepleId
      ? getMovePathPreview(state, selectedMeepleId, path, rushSpent)
      : null);
  const nextCellById = new Map(
    (preview?.nextCells ?? []).map((cell) => [Number(cell.cellId), cell]),
  );
  const legalDestinations =
    state.phase === PHASES.SETUP_PLACEMENT && canSelectSetupCell
      ? getLegalSetupCells(state)
      : state.phase === PHASES.MOVE && canSelectMoveCell && preview
        ? preview.nextCells.map((cell) => cell.cellId)
        : [];

  return (
    <section className="board-shell" aria-label="Ingredient board">
      <div className="ingredient-board">
        {cells.map((cell) => {
          const isInPath = path.includes(cell.id);
          const pathStep = path.findIndex((cellId) => Number(cellId) === cell.id) + 1;
          const isLegal = legalDestinations.includes(cell.id);
          const nextCell = nextCellById.get(cell.id);
          const isCurrentMoveCell =
            state.phase === PHASES.MOVE && preview?.currentCellId === cell.id;
          const isSelectedSetupCell =
            state.phase === PHASES.SETUP_PLACEMENT &&
            Number(selectedSetupCellId) === cell.id;
          const legalCellNote =
            state.phase === PHASES.SETUP_PLACEMENT ? 'open setup space' : 'next step';
          const cellNotes = [
            cell.isSpecialty ? 'specialty ingredient' : '',
            cell.isCorner ? 'corner' : '',
            isLegal ? legalCellNote : '',
            nextCell && !nextCell.canEnd ? 'pass through only' : '',
            isInPath ? `path step ${pathStep}` : '',
            isCurrentMoveCell ? 'current position' : '',
            isSelectedSetupCell ? 'selected setup space' : '',
          ].filter(Boolean);

          return (
            <div
              key={cell.id}
              className={`board-cell ${cell.isSpecialty ? 'specialty-cell' : ''} ${
                isLegal ? 'legal-cell' : ''
              } ${
                nextCell && !nextCell.canEnd ? 'pass-only-cell' : ''
              } ${isInPath ? 'path-cell' : ''} ${
                isCurrentMoveCell ? 'current-cell' : ''
              } ${
                isSelectedSetupCell ? 'setup-selected-cell' : ''
              }`}
              role="button"
              tabIndex={0}
              data-testid={`cell-${cell.id}`}
              aria-label={`Cell ${cell.id}, ${ingredientLabel(cell.ingredient)}${
                cellNotes.length ? `, ${cellNotes.join(', ')}` : ''
              }`}
              onClick={() => onCellClick(cell.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  onCellClick(cell.id);
                }
              }}
            >
              {cell.isSpecialty && (
                <span className="specialty-cell-ribbon" aria-hidden="true" />
              )}
              <IngredientIcon ingredient={cell.ingredient} />
              {isInPath && <span className="path-step-marker">{pathStep}</span>}
              <span className="cell-flags">
                {cell.isCorner && <span>corner</span>}
              </span>
              <span className="meeple-stack">
                {cell.meeples.map((meeple) => {
                  const className = `meeple meeple-${meeple.color} ${
                    selectedMeepleId === meeple.id ? 'meeple-selected' : ''
                  }`;
                  const isSelectable =
                    state.phase !== PHASES.MOVE ||
                    (canSelectMoveCell && meeple.playerId === state.activePlayerId);

                  if (!isSelectable) {
                    return (
                      <span
                        key={meeple.id}
                        className={`${className} meeple-static`}
                        title={`${meeple.playerName} meeple`}
                      >
                        {meeple.playerName.slice(0, 1)}
                      </span>
                    );
                  }

                  return (
                    <button
                      key={meeple.id}
                      className={className}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectMeeple(meeple.id);
                      }}
                      title={`${meeple.playerName} meeple`}
                    >
                      {meeple.playerName.slice(0, 1)}
                    </button>
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
