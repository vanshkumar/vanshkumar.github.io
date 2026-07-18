import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  millisecondsUntilNextUtcDay,
  UtcDayRefreshTask
} from '../lib/utcDayRefresh';

afterEach(() => {
  vi.useRealTimers();
});

describe('UTC day refresh', () => {
  it('calculates the next activity-date boundary', () => {
    expect(millisecondsUntilNextUtcDay(new Date('2026-07-17T23:59:30.000Z'))).toBe(30_250);
  });

  it('refreshes once after the UTC date changes and schedules the following day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-17T23:59:30.000Z'));
    const callback = vi.fn();
    const task = new UtcDayRefreshTask(callback);

    task.schedule();
    vi.advanceTimersByTime(30_249);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(86_400_000);
    expect(callback).toHaveBeenCalledTimes(2);
    task.cancel();
  });
});
