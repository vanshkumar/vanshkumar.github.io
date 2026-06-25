import { PHASES } from '../engine/types';
import CupMemoryStrip from './CupMemoryStrip';
import OrderGoalStrip from './OrderGoalStrip';

export default function TurnBrief({ player, phase, completableOrders = [] }) {
  const readyOrderIds = new Set(completableOrders.map((match) => match.order.id));
  const showCups = phase !== PHASES.POUR;

  return (
    <section className={`turn-brief turn-brief-${phase}`} aria-label={`${player.name} turn context`}>
      {showCups && (
        <CupMemoryStrip cups={player.cups} label={`${player.name} current cups`} />
      )}
      <OrderGoalStrip tabs={player.tabs} readyOrderIds={readyOrderIds} />
    </section>
  );
}
