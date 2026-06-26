import { getCompletableOrders } from '../engine/selectors';
import Cup from './Cup';
import OrderCard from './OrderCard';
import RushTokenTracker from './RushTokenTracker';
import UpgradeTray from './UpgradeTray';

export default function PlayerPanel({
  player,
  isActive,
  selectedCup,
  onSelectCup,
  onDumpCup,
  phase,
  canInteract = true,
}) {
  const completable = isActive && phase === 'pour' ? getCompletableOrders(player) : [];
  const canSelectCups = canInteract && isActive && phase === 'pour';
  const canDumpCups = canInteract && isActive && phase === 'pour';

  return (
    <section className={`player-panel panel-${player.color} ${isActive ? 'active-panel' : ''}`}>
      <header className="player-header">
        <div>
          <h2>{player.name}</h2>
          <p>{player.completed.length} done / {player.penalties.length} penalties</p>
        </div>
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

      <div className="tabs-grid">
        {player.tabs.map((tab, tabIndex) => (
          <div key={tabIndex} className="order-tab">
            <span className="tab-label">Tab {tabIndex + 1}</span>
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
        ))}
      </div>
    </section>
  );
}
