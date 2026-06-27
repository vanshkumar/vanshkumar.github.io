import { INGREDIENTS } from '../data/ingredients';
import IngredientIcon from './IngredientIcon';
import OrderPressureMarker from './OrderPressureMarker';
import {
  getOrderPressure,
  getOrderPressureLabel,
  ORDER_PRESSURE_DISPLAY_ORDER,
} from './orderPressure';

export default function OrderGoalStrip({
  tabs,
  readyOrderIds = new Set(),
  minimizedOrderIds = new Set(),
  onToggleMinimizedOrder,
  allowOrderMinimize = false,
}) {
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
        const isMinimized = minimizedOrderIds.has(order.id);
        const pressure = getOrderPressure(tabIndex);
        const pressureLabel = getOrderPressureLabel(tabIndex);
        const orderStateLabel = `${pressureLabel}, ${order.name}${
          isReady ? ', ready' : ''
        }`;

        if (isMinimized) {
          return (
            <button
              key={order.id}
              className={`order-goal-chip pressure-${pressure} ${
                tabIndex === 3 ? 'order-goal-chip-critical' : ''
              } ${isReady ? 'order-goal-chip-ready' : ''}`}
              type="button"
              onClick={() => onToggleMinimizedOrder?.(order.id)}
              aria-label={`${orderStateLabel}, minimized. Restore order`}
              title={`Restore ${order.name}`}
            >
              <OrderPressureMarker tabIndex={tabIndex} compact labeled={false} />
              <span className="order-goal-chip-name">{order.name}</span>
              {order.isSpecialty && <span className="order-goal-chip-rush">R</span>}
            </button>
          );
        }

        return (
          <div
            key={order.id}
            className={`order-goal-card pressure-${pressure} ${
              tabIndex === 3 ? 'order-goal-card-critical' : ''
            } ${isReady ? 'order-goal-ready' : ''}`}
            role="group"
            aria-label={orderStateLabel}
          >
            {allowOrderMinimize && (
              <button
                className="order-goal-minimize-button"
                type="button"
                onClick={() => onToggleMinimizedOrder?.(order.id)}
                aria-label={`Minimize ${order.name}`}
                title={`Minimize ${order.name}`}
              >
                <span className="order-goal-minimize-mark" aria-hidden="true" />
              </button>
            )}
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
