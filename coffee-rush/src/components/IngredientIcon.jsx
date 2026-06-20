import { ingredientLabel } from '../data/ingredients';

const ICONS = {
  coffee: (
    <>
      <path
        className="ingredient-icon-fill"
        d="M11.8 4.6c5.2 1.1 9.2 5.6 10.3 11.8 1.1 6.1-1.1 10.7-5 11.4-4 .7-8.1-2.8-9.4-8.7C6.4 13.1 7.5 5.7 11.8 4.6Z"
      />
      <path
        className="ingredient-icon-cut"
        d="M14.5 7.9c-1.6 4.8.2 9.1 3.8 13"
      />
    </>
  ),
  steam: (
    <>
      <path className="ingredient-icon-stroke" d="M10.4 25.8c-2.4-3.2 1.6-5.2.4-8.6-1-2.8-3.7-4.2-1.4-8" />
      <path className="ingredient-icon-stroke" d="M16 26.4c-2.5-3.5 2.1-5.5.7-9.3-1.1-3.1-3.1-5.1-.2-10.2" />
      <path className="ingredient-icon-stroke" d="M21.7 25.8c-2.3-3.1 1.5-5.1.4-8.2-.9-2.6-3.3-4-.9-8" />
    </>
  ),
  milk: (
    <>
      <path
        className="ingredient-icon-stroke ingredient-icon-soft-fill"
        d="M10.3 11.7 13 7.2h6l2.8 4.5v15.1H10.3Z"
      />
      <path className="ingredient-icon-stroke" d="M13 7.2h6M10.3 11.7h11.5" />
      <path className="ingredient-icon-fill" d="M13 16.6h6v6.8h-6Z" />
    </>
  ),
  water: (
    <>
      <path
        className="ingredient-icon-fill"
        d="M16 4.5c4.8 5.7 7.4 9.8 7.4 14.1a7.4 7.4 0 0 1-14.8 0c0-4.3 2.6-8.4 7.4-14.1Z"
      />
      <path className="ingredient-icon-shine" d="M13.2 17.9c.2-2.3 1.3-4.2 3-6.4" />
    </>
  ),
  ice: (
    <>
      <path className="ingredient-icon-stroke ingredient-icon-soft-fill" d="m16 4.8 9.4 5.5v11.1L16 26.9l-9.4-5.5V10.3Z" />
      <path className="ingredient-icon-stroke" d="m6.6 10.3 9.4 5.5 9.4-5.5M16 15.8v11.1" />
      <path className="ingredient-icon-shine" d="m11.3 12.4 4.7-2.8 4.7 2.8" />
    </>
  ),
  chocolate: (
    <>
      <path className="ingredient-icon-fill" d="M8.4 7.7h15.2v16.6H8.4Z" />
      <path className="ingredient-icon-cut" d="M13.5 8v16M18.5 8v16M8.7 13.3h14.7M8.7 18.7h14.7" />
    </>
  ),
  caramel: (
    <>
      <path className="ingredient-icon-stroke ingredient-icon-soft-fill" d="M10.2 9.5h11.6l2.7 3.4-2.7 9.6H10.2l-2.7-9.6Z" />
      <path className="ingredient-icon-fill" d="M12.3 12.2h7.4v7.6h-7.4Z" />
      <path className="ingredient-icon-shine" d="M13.4 15.1h5.2" />
    </>
  ),
  tea: (
    <>
      <path
        className="ingredient-icon-fill"
        d="M25.4 6.6c-8.8.1-15.9 4.9-16.7 11.1-.4 3.3 1.7 6.3 5.2 6.9 6.6 1.2 10.9-6.9 11.5-18Z"
      />
      <path className="ingredient-icon-cut" d="M22.8 9.2c-4.9 3.3-8.4 7-11.1 12.7" />
    </>
  ),
};

export default function IngredientIcon({ ingredient, small = false }) {
  return (
    <span
      className={`ingredient-icon ingredient-${ingredient} ${small ? 'ingredient-small' : ''}`}
      title={ingredientLabel(ingredient)}
      aria-label={ingredientLabel(ingredient)}
    >
      <svg
        className="ingredient-svg"
        viewBox="0 0 32 32"
        focusable="false"
        aria-hidden="true"
      >
        {ICONS[ingredient] ?? ICONS.coffee}
      </svg>
    </span>
  );
}
