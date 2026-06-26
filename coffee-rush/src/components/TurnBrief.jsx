import { PHASES } from '../engine/types';
import CupMemoryStrip from './CupMemoryStrip';
import OrderGoalStrip from './OrderGoalStrip';

export default function TurnBrief({
  player,
  phase,
  completableOrders = [],
  showCupsInPour = false,
}) {
  const readyOrderIds = new Set(completableOrders.map((match) => match.order.id));
  const showCups = phase !== PHASES.POUR || showCupsInPour;

  return (
    <section className={`turn-brief turn-brief-${phase}`} aria-label={`${player.name} station context`}>
      {showCups && (
        <CupMemoryStrip cups={player.cups} label={`${player.name} current cups`} />
      )}
      <OrderGoalStrip tabs={player.tabs} readyOrderIds={readyOrderIds} />
    </section>
  );
}
