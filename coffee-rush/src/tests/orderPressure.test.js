import { describe, expect, it } from 'vitest';
import {
  getOrderPressure,
  getOrderPressureLabel,
  ORDER_PRESSURE_DISPLAY_ORDER,
} from '../components/orderPressure';

describe('order pressure display helpers', () => {
  it('orders visible lanes from most urgent to least urgent', () => {
    expect(ORDER_PRESSURE_DISPLAY_ORDER).toEqual([3, 2, 1, 0]);
  });

  it('maps internal tab index to pressure pips without changing tab storage', () => {
    expect(getOrderPressure(0)).toBe(1);
    expect(getOrderPressure(3)).toBe(4);
  });

  it('labels the highest pressure lane as one aging step from penalty', () => {
    expect(getOrderPressureLabel(3)).toContain('next aging makes it a penalty');
  });
});
