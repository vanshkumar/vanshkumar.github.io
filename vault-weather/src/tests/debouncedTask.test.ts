import { afterEach, describe, expect, it, vi } from 'vitest';
import { DebouncedTask } from '../lib/debouncedTask';

afterEach(() => {
  vi.useRealTimers();
});

describe('DebouncedTask', () => {
  it('coalesces repeated vault events into one refresh', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const task = new DebouncedTask(callback, 150);

    task.schedule();
    task.schedule();
    task.schedule();
    vi.advanceTimersByTime(149);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancels pending refreshes during unload', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const task = new DebouncedTask(callback, 150);
    task.schedule();
    task.cancel();
    vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });
});
