import { INGREDIENTS } from '../data/ingredients';
import IngredientIcon from './IngredientIcon';

export default function OrderCard({ order, compact = false, selected = false, onClick }) {
  return (
    <button
      className={`order-card ${compact ? 'order-card-compact' : ''} ${
        selected ? 'order-selected' : ''
      }`}
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={order.name}
    >
      <span className="order-name">{order.name}</span>
      {order.isSpecialty && <span className="specialty-ribbon">Rush</span>}
      <span className="recipe-list">
        {INGREDIENTS.flatMap((ingredient) =>
          Array.from({ length: order.recipe[ingredient] ?? 0 }, (_, index) => (
            <IngredientIcon key={`${ingredient}-${index}`} ingredient={ingredient} small />
          )),
        )}
      </span>
    </button>
  );
}
