import { PHASES } from '../engine/types';
import CupMemoryStrip from './CupMemoryStrip';
import OrderGoalStrip from './OrderGoalStrip';
import { UiIcon } from './UiIcon';

export default function TurnBrief({
  player,
  phase,
  completableOrders = [],
  showCupsInPour = false,
  minimizedOrderIds = new Set(),
  onToggleMinimizedOrder,
  onOpenOrders,
  allowOrderMinimize = false,
}) {
  const readyOrderIds = new Set(completableOrders.map((match) => match.order.id));
  const showCups = phase !== PHASES.POUR || showCupsInPour;

  return (
    <section className={`turn-brief turn-brief-${phase}`} aria-label={`${player.name} station context`}>
      {onOpenOrders && (
        <div className="turn-brief-toolbar">
          <span className="turn-brief-player">{player.name}</span>
          <button
            className="turn-brief-orders-button"
            type="button"
            onClick={onOpenOrders}
            aria-label={`Open ${player.name} orders`}
          >
            <UiIcon name="orders" />
            <span>Orders</span>
          </button>
        </div>
      )}
      {showCups && (
        <CupMemoryStrip cups={player.cups} label={`${player.name} current cups`} />
      )}
      <OrderGoalStrip
        tabs={player.tabs}
        readyOrderIds={readyOrderIds}
        minimizedOrderIds={minimizedOrderIds}
        onToggleMinimizedOrder={onToggleMinimizedOrder}
        allowOrderMinimize={allowOrderMinimize}
      />
    </section>
  );
}
