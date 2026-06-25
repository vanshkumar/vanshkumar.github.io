import { INGREDIENTS } from '../data/ingredients';
import IngredientIcon from './IngredientIcon';

export default function OrderGoalStrip({ tabs, readyOrderIds = new Set() }) {
  const orders = tabs.flatMap((tab, tabIndex) =>
    tab.map((order) => ({ order, tabIndex })),
  );

  if (orders.length === 0) {
    return <span className="order-goal-empty">No active orders</span>;
  }

  return (
    <div className="order-goal-strip" aria-label="Active order goals">
      {orders.map(({ order, tabIndex }) => {
        const isReady = readyOrderIds.has(order.id);

        return (
          <div
            key={order.id}
            className={`order-goal-card ${isReady ? 'order-goal-ready' : ''}`}
            role="group"
            aria-label={`Tab ${tabIndex + 1}, ${order.name}${isReady ? ', ready' : ''}`}
          >
            <span className="order-goal-meta">
              <span>T{tabIndex + 1}</span>
              {order.isSpecialty && <span className="order-goal-rush">R</span>}
            </span>
            <span className="order-goal-name">{order.name}</span>
            <span className="recipe-list order-goal-recipe">
              {INGREDIENTS.flatMap((ingredient) =>
                Array.from({ length: order.recipe[ingredient] ?? 0 }, (_, index) => (
                  <IngredientIcon
                    key={`${ingredient}-${index}`}
                    ingredient={ingredient}
                    small
                  />
                )),
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
