import { getCompletableOrders } from '../engine/selectors';
import Cup from './Cup';
import OrderCard from './OrderCard';
import RushTokenTracker from './RushTokenTracker';
import UpgradeTray from './UpgradeTray';

export default function PlayerPanel({
  player,
  isActive,
  selectedCup,
  selectedOrderRef,
  onSelectCup,
  onDumpCup,
  onSelectOrder,
  phase,
  onActivateUpgrade,
}) {
  const completable = getCompletableOrders(player);
  const canSelectCups = isActive && ['pour', 'setupPlacement'].includes(phase);
  const canDumpCups = isActive && phase === 'pour';

  return (
    <section className={`player-panel panel-${player.color} ${isActive ? 'active-panel' : ''}`}>
      <header className="player-header">
        <div>
          <h2>{player.name}</h2>
          <p>{player.completed.length} done / {player.penalties.length} penalties</p>
        </div>
        <RushTokenTracker count={player.rushTokens} />
      </header>

      <UpgradeTray
        player={player}
        isActive={isActive}
        phase={phase}
        onActivate={onActivateUpgrade}
      />

      <div className="cups-row">
        {player.cups.map((cup, index) => (
          <Cup
            key={index}
            cup={cup}
            index={index}
            selected={isActive && selectedCup === index}
            disabled={!canSelectCups}
            dumpDisabled={!canDumpCups}
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
                const canComplete =
                  isActive && completable.some((match) => match.order.id === order.id);
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    compact
                    selected={selectedOrderRef === order.id}
                    onClick={canComplete ? () => onSelectOrder(order.id) : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
