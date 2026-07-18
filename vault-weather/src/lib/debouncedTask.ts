export class DebouncedTask {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly callback: () => void,
    private readonly delayMs: number
  ) {}

  schedule(): void {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.callback();
    }, this.delayMs);
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
