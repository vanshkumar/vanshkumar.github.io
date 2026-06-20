import IngredientIcon from './IngredientIcon';
import { UiIcon } from './UiIcon';

export default function Cup({
  cup,
  index,
  selected,
  disabled = false,
  dumpDisabled = disabled,
  onSelect,
  onDump,
}) {
  return (
    <div className={`cup ${selected ? 'cup-selected' : ''}`}>
      <button
        className="cup-body"
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-label={`Cup ${index + 1}${cup.length === 0 ? ', empty' : ''}`}
      >
        <span className="cup-label">C{index + 1}</span>
        <span className="cup-ingredients">
          {cup.length === 0 && <span className="empty-cup">--</span>}
          {cup.map((ingredient, ingredientIndex) => (
            <IngredientIcon
              key={`${ingredient}-${ingredientIndex}`}
              ingredient={ingredient}
              small
            />
          ))}
        </span>
      </button>
      <button
        className="icon-button dump-button"
        type="button"
        onClick={onDump}
        title={`Dump Cup ${index + 1}`}
        aria-label={`Dump Cup ${index + 1}`}
        disabled={dumpDisabled}
      >
        <UiIcon name="trash" />
      </button>
    </div>
  );
}
