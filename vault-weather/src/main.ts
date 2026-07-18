import { Plugin } from 'obsidian';
import { DebouncedTask } from './lib/debouncedTask';
import { UtcDayRefreshTask } from './lib/utcDayRefresh';
import { WeatherDataService } from './lib/weatherData';
import { VAULT_WEATHER_VIEW_TYPE, VaultWeatherView } from './VaultWeatherView';

export default class VaultWeatherPlugin extends Plugin {
  private refreshTask: DebouncedTask | null = null;
  private utcDayRefreshTask: UtcDayRefreshTask | null = null;

  async onload(): Promise<void> {
    const service = new WeatherDataService(this.app);

    this.registerView(
      VAULT_WEATHER_VIEW_TYPE,
      (leaf) => new VaultWeatherView(leaf, service)
    );

    this.addRibbonIcon('cloud-sun', 'Open Vault Weather', () => {
      void this.activateView();
    });

    this.addCommand({
      id: 'open-vault-weather',
      name: 'Open Vault Weather',
      callback: () => void this.activateView()
    });

    this.refreshTask = new DebouncedTask(() => this.refreshOpenViews(), 150);
    this.utcDayRefreshTask = new UtcDayRefreshTask(() => this.refreshOpenViews());
    this.utcDayRefreshTask.schedule();
    this.app.workspace.onLayoutReady(() => {
      const scheduleRefresh = () => this.refreshTask?.schedule();
      this.registerEvent(this.app.metadataCache.on('changed', scheduleRefresh));
      this.registerEvent(this.app.vault.on('create', scheduleRefresh));
      this.registerEvent(this.app.vault.on('modify', scheduleRefresh));
      this.registerEvent(this.app.vault.on('delete', scheduleRefresh));
      this.registerEvent(this.app.vault.on('rename', scheduleRefresh));
      this.registerEvent(
        this.app.workspace.on('active-leaf-change', (leaf) => {
          if (leaf?.view instanceof VaultWeatherView) leaf.view.refresh();
        })
      );
    });
  }

  onunload(): void {
    this.refreshTask?.cancel();
    this.refreshTask = null;
    this.utcDayRefreshTask?.cancel();
    this.utcDayRefreshTask = null;
  }

  private async activateView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(VAULT_WEATHER_VIEW_TYPE)[0];
    if (existingLeaf) {
      if (existingLeaf.view instanceof VaultWeatherView) existingLeaf.view.refresh();
      await this.app.workspace.revealLeaf(existingLeaf);
      return;
    }

    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: VAULT_WEATHER_VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  private refreshOpenViews(): void {
    this.app.workspace.getLeavesOfType(VAULT_WEATHER_VIEW_TYPE).forEach((leaf) => {
      if (leaf.view instanceof VaultWeatherView) leaf.view.refresh();
    });
  }
}
