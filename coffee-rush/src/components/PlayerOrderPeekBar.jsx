import OrderPressureMarker from './OrderPressureMarker';
import { ORDER_PRESSURE_DISPLAY_ORDER } from './orderPressure';

export default function PlayerOrderPeekBar({
  players,
  activePlayerId = '',
  localPlayerId = '',
  onOpenPlayerOrders,
}) {
  if (!Array.isArray(players) || players.length === 0) {
    return null;
  }

  return (
    <nav className="order-peek-rail" aria-label="Open player order plans">
      {players.map((player) => {
        const pressureCounts = ORDER_PRESSURE_DISPLAY_ORDER.map((tabIndex) => ({
          tabIndex,
          count: player.tabs[tabIndex]?.length ?? 0,
        }));
        const totalOrders = pressureCounts.reduce((total, item) => total + item.count, 0);
        const hasCriticalOrders = (player.tabs[3]?.length ?? 0) > 0;

        return (
          <button
            key={player.id}
            className={`order-peek-button panel-${player.color} ${
              player.id === activePlayerId ? 'order-peek-active' : ''
            } ${player.id === localPlayerId ? 'order-peek-local' : ''} ${
              hasCriticalOrders ? 'order-peek-critical' : ''
            }`}
            type="button"
            onClick={() => onOpenPlayerOrders?.(player.id)}
            aria-label={`Open ${player.name} orders`}
          >
            <span className="order-peek-player">
              <span>{player.name}</span>
              {player.id === activePlayerId && <span className="order-peek-turn">Turn</span>}
            </span>
            <span className="order-peek-total">{totalOrders}</span>
            <span className="order-peek-pressures" aria-hidden="true">
              {pressureCounts.map(({ tabIndex, count }) => (
                <span
                  key={tabIndex}
                  className={`order-peek-pressure ${
                    count === 0 ? 'order-peek-pressure-empty' : ''
                  }`}
                >
                  <OrderPressureMarker tabIndex={tabIndex} compact labeled={false} />
                  <strong>{count}</strong>
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
