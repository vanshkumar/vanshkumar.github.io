import { getCompletableOrders } from '../engine/selectors';
import Cup from './Cup';
import OrderCard from './OrderCard';
import OrderPressureMarker from './OrderPressureMarker';
import { getOrderPressureLabel, ORDER_PRESSURE_DISPLAY_ORDER } from './orderPressure';
import RushTokenTracker from './RushTokenTracker';
import UpgradeTray from './UpgradeTray';

export default function PlayerPanel({
  player,
  isActive,
  selectedCup,
  onSelectCup,
  onDumpCup,
  onOpenOrders,
  phase,
  canInteract = true,
}) {
  const completable =
    isActive && phase === 'pour' && player.hand.length === 0
      ? getCompletableOrders(player)
      : [];
  const canSelectCups = canInteract && isActive && phase === 'pour';
  const canDumpCups = canInteract && isActive && phase === 'pour';

  return (
    <section className={`player-panel panel-${player.color} ${isActive ? 'active-panel' : ''}`}>
      <header className="player-header">
        <div>
          <h2>{player.name}</h2>
          <p>{player.completed.length} done / {player.penalties.length} penalties</p>
        </div>
        {onOpenOrders && (
          <button
            className="player-orders-button"
            type="button"
            onClick={() => onOpenOrders(player.id)}
            aria-label={`Open ${player.name} orders`}
          >
            Orders
          </button>
        )}
        <RushTokenTracker count={player.rushTokens} />
      </header>

      <UpgradeTray player={player} />

      <div className="cups-row">
        {player.cups.map((cup, index) => (
          <Cup
            key={index}
            cup={cup}
            index={index}
            selected={isActive && selectedCup === index}
            disabled={!canSelectCups}
            dumpDisabled={!canDumpCups || cup.length === 0}
            onSelect={() => onSelectCup(index)}
            onDump={() => onDumpCup(index)}
          />
        ))}
      </div>

      <div className="tabs-grid" aria-label="Orders by pressure, highest first">
        {ORDER_PRESSURE_DISPLAY_ORDER.map((tabIndex) => {
          const tab = player.tabs[tabIndex];
          const pressure = tabIndex + 1;

          return (
            <div
              key={tabIndex}
              className={`order-tab order-pressure-lane pressure-${pressure} ${
                tabIndex === 3 ? 'order-pressure-lane-critical' : ''
              }`}
              aria-label={getOrderPressureLabel(tabIndex)}
            >
              <span className="tab-label order-pressure-header">
                <OrderPressureMarker tabIndex={tabIndex} labeled={false} />
              </span>
              <div className="tab-orders">
                {tab.length === 0 && <span className="empty-tab">clear</span>}
                {tab.map((order) => {
                  const completionMatch = isActive
                    ? completable.find((match) => match.order.id === order.id)
                    : null;
                  const canComplete = Boolean(completionMatch);
                  return (
                    <div
                      key={order.id}
                      className={`order-slot ${canComplete ? 'order-slot-ready' : ''}`}
                    >
                      <OrderCard
                        order={order}
                        compact
                        ready={canComplete}
                        selected={false}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
