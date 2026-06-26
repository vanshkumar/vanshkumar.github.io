export const ORDER_PRESSURE_DISPLAY_ORDER = [3, 2, 1, 0];

export function getOrderPressure(tabIndex) {
  return tabIndex + 1;
}

export function getOrderPressureLabel(tabIndex) {
  const labels = [
    'lowest pressure, newest order',
    'low pressure, two aging steps before penalty',
    'high pressure, one aging step before highest pressure',
    'highest pressure, next aging makes it a penalty',
  ];

  return labels[tabIndex] ?? 'order pressure';
}
