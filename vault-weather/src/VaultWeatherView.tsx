import { ItemView, type TFile, type ViewStateResult, type WorkspaceLeaf } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';
import { VaultWeatherApp } from './App';
import { CreateNoteModal } from './CreateNoteModal';
import { WeatherDataService } from './lib/weatherData';
import {
  ALL_TERRAIN_FILTER,
  isCollectionKey,
  isTerrainFilter,
  type CollectionKey,
  type TerrainFilter
} from './lib/weatherTypes';

export const VAULT_WEATHER_VIEW_TYPE = 'vault-weather-view';

export class VaultWeatherView extends ItemView {
  private reactRoot: Root | null = null;
  private collectionKey: CollectionKey = 'terrain';
  private terrainFilter: TerrainFilter = ALL_TERRAIN_FILTER;
  private refreshToken = 0;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly service: WeatherDataService
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VAULT_WEATHER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Vault Weather';
  }

  getIcon(): string {
    return 'cloud-sun';
  }

  async onOpen(): Promise<void> {
    const contentEl = this.containerEl.children[1] as HTMLElement;
    contentEl.empty();
    contentEl.addClass('vault-weather-view');
    this.reactRoot = createRoot(contentEl);
    this.renderView();
  }

  async onClose(): Promise<void> {
    this.reactRoot?.unmount();
    this.reactRoot = null;
  }

  getState(): Record<string, unknown> {
    return { collectionKey: this.collectionKey, terrainFilter: this.terrainFilter };
  }

  async setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void> {
    if (isCollectionKey(state.collectionKey)) this.collectionKey = state.collectionKey;
    if (isTerrainFilter(state.terrainFilter)) this.terrainFilter = state.terrainFilter;
    await super.setState(state, result);
    this.renderView();
  }

  refresh(): void {
    this.refreshToken += 1;
    this.renderView();
  }

  private renderView(): void {
    this.reactRoot?.render(
      <VaultWeatherApp
        collectionKey={this.collectionKey}
        terrainFilter={this.terrainFilter}
        refreshToken={this.refreshToken}
        service={this.service}
        changeCollection={(key) => this.changeCollection(key)}
        changeTerrainFilter={(filter) => this.changeTerrainFilter(filter)}
        createNote={(key, tag) => this.openCreateModal(key, tag)}
        openFile={(file) => this.openFile(file)}
      />
    );
  }

  private changeCollection(key: CollectionKey): void {
    this.collectionKey = key;
    this.app.workspace.requestSaveLayout();
    this.renderView();
  }

  private changeTerrainFilter(filter: TerrainFilter): void {
    this.collectionKey = 'terrain';
    this.terrainFilter = filter;
    this.app.workspace.requestSaveLayout();
    this.renderView();
  }

  private openCreateModal(key: CollectionKey, tag?: string): void {
    new CreateNoteModal(this.app, key, async (title, rating) => {
      const file = await this.service.createNote({ collectionKey: key, title, rating, tag });
      this.refresh();
      await this.openFile(file);
    }).open();
  }

  private async openFile(file: TFile): Promise<void> {
    await this.app.workspace.getLeaf('tab').openFile(file);
  }
}
