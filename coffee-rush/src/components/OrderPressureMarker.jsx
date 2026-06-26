import { getOrderPressure, getOrderPressureLabel } from './orderPressure';

const PIP_COUNT = 4;

export default function OrderPressureMarker({ tabIndex, compact = false, labeled = true }) {
  const pressure = getOrderPressure(tabIndex);
  const label = getOrderPressureLabel(tabIndex);
  const accessibilityProps = labeled
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': 'true' };

  return (
    <span
      className={`order-pressure-marker pressure-${pressure} ${
        compact ? 'order-pressure-marker-compact' : ''
      }`}
      title={label}
      {...accessibilityProps}
    >
      {Array.from({ length: PIP_COUNT }, (_, index) => (
        <span
          key={index}
          className={`order-pressure-pip ${
            index < pressure ? 'order-pressure-pip-filled' : ''
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
