import { INGREDIENTS } from '../data/ingredients';
import IngredientIcon from './IngredientIcon';
import OrderPressureMarker from './OrderPressureMarker';
import {
  getOrderPressure,
  getOrderPressureLabel,
  ORDER_PRESSURE_DISPLAY_ORDER,
} from './orderPressure';

export default function OrderGoalStrip({ tabs, readyOrderIds = new Set() }) {
  const orders = ORDER_PRESSURE_DISPLAY_ORDER.flatMap((tabIndex) =>
    tabs[tabIndex].map((order) => ({ order, tabIndex })),
  );

  if (orders.length === 0) {
    return <span className="order-goal-empty">No active orders</span>;
  }

  return (
    <div className="order-goal-strip" aria-label="Active order goals">
      {orders.map(({ order, tabIndex }) => {
        const isReady = readyOrderIds.has(order.id);
        const pressure = getOrderPressure(tabIndex);

        return (
          <div
            key={order.id}
            className={`order-goal-card pressure-${pressure} ${
              tabIndex === 3 ? 'order-goal-card-critical' : ''
            } ${isReady ? 'order-goal-ready' : ''}`}
            role="group"
            aria-label={`${getOrderPressureLabel(tabIndex)}, ${order.name}${
              isReady ? ', ready' : ''
            }`}
          >
            <span className="order-goal-meta">
              <OrderPressureMarker tabIndex={tabIndex} compact labeled={false} />
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
