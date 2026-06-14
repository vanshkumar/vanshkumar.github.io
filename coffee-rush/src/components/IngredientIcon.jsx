import { INGREDIENT_META, ingredientLabel } from '../data/ingredients';

export default function IngredientIcon({ ingredient, small = false }) {
  const meta = INGREDIENT_META[ingredient];

  return (
    <span
      className={`ingredient-icon ingredient-${ingredient} ${small ? 'ingredient-small' : ''}`}
      title={ingredientLabel(ingredient)}
      aria-label={ingredientLabel(ingredient)}
    >
      <span className={`ingredient-shape shape-${meta?.icon ?? 'dot'}`} />
    </span>
  );
}
