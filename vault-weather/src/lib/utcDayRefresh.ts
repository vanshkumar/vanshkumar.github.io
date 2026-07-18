const REFRESH_SETTLE_MS = 250;

export const millisecondsUntilNextUtcDay = (now = new Date()): number => {
  const nextUtcDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(0, nextUtcDay - now.getTime()) + REFRESH_SETTLE_MS;
};

export class UtcDayRefreshTask {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly callback: () => void) {}

  schedule(): void {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.callback();
      this.schedule();
    }, millisecondsUntilNextUtcDay());
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
