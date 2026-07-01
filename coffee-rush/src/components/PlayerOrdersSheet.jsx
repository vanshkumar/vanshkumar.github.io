import { useEffect } from 'react';
import OrderCard from './OrderCard';
import OrderPressureMarker from './OrderPressureMarker';
import { ORDER_PRESSURE_DISPLAY_ORDER } from './orderPressure';

const PRESSURE_TITLES = {
  3: 'Next penalty',
  2: 'High',
  1: 'Low',
  0: 'New',
};

export default function PlayerOrdersSheet({
  player,
  readyOrderIds = new Set(),
  onClose,
}) {
  useEffect(() => {
    if (!player) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, player]);

  if (!player) {
    return null;
  }

  const totalOrders = player.tabs.reduce((total, tab) => total + tab.length, 0);
  const titleId = `orders-sheet-title-${player.id}`;

  return (
    <div className="orders-sheet-backdrop" onClick={onClose}>
      <section
        className={`orders-sheet panel-${player.color}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="orders-sheet-header">
          <div className="orders-sheet-title-block">
            <span className="phase-kicker">{totalOrders} active orders</span>
            <h2 id={titleId}>{player.name} orders</h2>
            <p>
              {player.completed.length} done / {player.penalties.length} penalties
              <span aria-hidden="true"> · </span>
              <span className="rush-token rush-token-inline">R</span> {player.rushTokens}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close order view">
            Close
          </button>
        </header>

        <div className="orders-sheet-body">
          {totalOrders === 0 && <span className="order-goal-empty">No active orders</span>}
          {ORDER_PRESSURE_DISPLAY_ORDER.map((tabIndex) => {
            const orders = player.tabs[tabIndex] ?? [];
            if (orders.length === 0) return null;

            return (
              <section className="orders-sheet-section" key={tabIndex}>
                <header className="orders-sheet-section-header">
                  <OrderPressureMarker tabIndex={tabIndex} />
                  <strong>{PRESSURE_TITLES[tabIndex]}</strong>
                  <span>{orders.length}</span>
                </header>
                <div className="orders-sheet-orders">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      ready={readyOrderIds.has(order.id)}
                      selected={false}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
