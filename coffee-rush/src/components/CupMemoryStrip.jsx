import { ingredientLabel } from '../data/ingredients';
import IngredientIcon from './IngredientIcon';

function cupContentsLabel(cup) {
  if (cup.length === 0) return 'empty';
  return cup.map((ingredient) => ingredientLabel(ingredient)).join(', ');
}

function cupAriaLabel(cup, index, isReady) {
  const readyText = isReady ? ', ready to serve' : '';
  return `Cup ${index + 1}, ${cupContentsLabel(cup)}, ${cup.length} of 4${readyText}`;
}

export default function CupMemoryStrip({
  cups,
  selectedCup = null,
  onSelectCup,
  readyCupIndexes = [],
  label = 'Current cups',
}) {
  const canSelect = typeof onSelectCup === 'function';
  const readyCupSet = new Set(readyCupIndexes);

  return (
    <div className="cup-memory-strip" aria-label={label}>
      {cups.map((cup, index) => {
        const isSelected = selectedCup === index;
        const isReady = readyCupSet.has(index);
        const className = [
          'cup-memory-tile',
          isSelected ? 'cup-memory-tile-selected' : '',
          isReady ? 'cup-memory-tile-ready' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const content = (
          <>
            <span className="cup-memory-topline">
              <span className="cup-memory-label">C{index + 1}</span>
              <span className="cup-memory-capacity">{cup.length}/4</span>
              {isReady && <span className="cup-ready-badge">Ready</span>}
            </span>
            <span className="cup-memory-icons">
              {cup.length === 0 && <span className="empty-cup">--</span>}
              {cup.map((ingredient, ingredientIndex) => (
                <IngredientIcon
                  key={`${ingredient}-${ingredientIndex}`}
                  ingredient={ingredient}
                  small
                />
              ))}
            </span>
          </>
        );

        return canSelect ? (
          <button
            key={index}
            className={className}
            type="button"
            onClick={() => onSelectCup(index)}
            aria-label={cupAriaLabel(cup, index, isReady)}
          >
            {content}
          </button>
        ) : (
          <div
            key={index}
            className={className}
            role="group"
            aria-label={cupAriaLabel(cup, index, isReady)}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
