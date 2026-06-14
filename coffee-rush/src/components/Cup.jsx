import IngredientIcon from './IngredientIcon';

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
      <button className="cup-body" type="button" onClick={onSelect} disabled={disabled}>
        <span className="cup-label">Cup {index + 1}</span>
        <span className="cup-ingredients">
          {cup.length === 0 && <span className="empty-cup">empty</span>}
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
        title="Dump cup"
        disabled={dumpDisabled}
      >
        x
      </button>
    </div>
  );
}
