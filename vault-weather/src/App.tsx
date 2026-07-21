import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { TFile } from 'obsidian';
import { activityTone, getItemUpdatedDate, sortWeatherItems } from './lib/weatherCore';
import { WeatherDataService } from './lib/weatherData';
import {
  COLLECTION_CONFIGS,
  COLLECTION_KEYS,
  type CollectionKey,
  type TerrainFilter,
  type WeatherCollectionData,
  type WeatherItem
} from './lib/weatherTypes';

const formatDate = (value: string | null): string => {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
};

const filterMatches = (left: TerrainFilter, right: TerrainFilter): boolean =>
  left.mode === right.mode &&
  (left.mode !== 'tag' || (right.mode === 'tag' && left.tag === right.tag));

const tagLabel = (tag: string): string =>
  tag
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const terrainTitle = (filter: TerrainFilter): string => {
  if (filter.mode === 'untagged') return 'Untagged Weather';
  if (filter.mode === 'tag') return `${tagLabel(filter.tag)} Weather`;
  return 'Terrain Weather';
};

interface WeatherCardProps {
  item: WeatherItem;
  collectionKey: CollectionKey;
  openFile: (file: TFile) => Promise<void>;
}

function WeatherCard({ item, collectionKey, openFile }: WeatherCardProps) {
  const config = COLLECTION_CONFIGS[collectionKey];
  const tone = activityTone(item.activity.level);
  const updatedDate = getItemUpdatedDate(item);
  const hasCover = collectionKey === 'shelf' && Boolean(item.coverUrl);

  return (
    <article
      className={`weather-card ${config.cardClassName} tone-${tone}${hasCover ? ' has-cover' : ''}`}
    >
      <button
        className="weather-card-link"
        type="button"
        onClick={() => void openFile(item.file)}
        aria-label={`Open ${item.title} in Obsidian`}
      >
        <span className="weather-card-meta">Updated {formatDate(updatedDate)}</span>
        {hasCover ? (
          <span className="weather-card-cover">
            <img src={item.coverUrl ?? ''} alt="" loading="lazy" aria-hidden="true" />
            <span className="sr-only">{item.title}</span>
          </span>
        ) : (
          <span className="weather-card-title">{item.title}</span>
        )}
      </button>
    </article>
  );
}

interface VaultWeatherAppProps {
  collectionKey: CollectionKey;
  terrainFilter: TerrainFilter;
  refreshToken: number;
  service: WeatherDataService;
  changeCollection: (key: CollectionKey) => void;
  changeTerrainFilter: (filter: TerrainFilter) => void;
  createNote: (key: CollectionKey, tag?: string) => void;
  openFile: (file: TFile) => Promise<void>;
}

interface WeatherPageProps {
  collectionKey: CollectionKey;
  terrainFilter: TerrainFilter;
  data: WeatherCollectionData | null;
  error: string;
  changeCollection: (key: CollectionKey) => void;
  changeTerrainFilter: (filter: TerrainFilter) => void;
  createNote: (key: CollectionKey, tag?: string) => void;
  openFile: (file: TFile) => Promise<void>;
}

export function WeatherPage({
  collectionKey,
  terrainFilter,
  data,
  error,
  changeCollection,
  changeTerrainFilter,
  createNote,
  openFile
}: WeatherPageProps) {
  const config = COLLECTION_CONFIGS[collectionKey];
  const visibleItems = useMemo(() => sortWeatherItems(data?.items ?? []), [data]);
  const activeCount = (data?.items ?? []).filter(
    (item) => item.activity.recentUpdateCount > 0
  ).length;
  const title = collectionKey === 'terrain' ? terrainTitle(terrainFilter) : config.title;
  const creationTag =
    collectionKey === 'terrain' && terrainFilter.mode === 'tag' ? terrainFilter.tag : undefined;
  const addLabel = creationTag ? `Add ${creationTag} entry` : config.addLabel;

  return (
    <main className="weather-app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local vault surface</p>
          <h1>{title}</h1>
          <p className="app-subtitle">
            {data?.items.length ?? 0} {config.countLabel} · {activeCount} active in the last 30
            days · refreshed {formatDate(data?.refreshedAt ?? null)}
          </p>
        </div>
        <div className="header-actions">
          <nav className="collection-tabs" aria-label="Weather surfaces">
            {COLLECTION_KEYS.map((key) => {
              const link = COLLECTION_CONFIGS[key];
              const active = key === collectionKey;
              return (
                <button
                  key={key}
                  className={`collection-tab${active ? ' active' : ''}`}
                  type="button"
                  onClick={() => changeCollection(key)}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.navLabel}
                </button>
              );
            })}
          </nav>
          <button
            className="action-button icon-button"
            type="button"
            onClick={() => createNote(collectionKey, creationTag)}
            title={addLabel}
            aria-label={addLabel}
          >
            <Plus aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      {collectionKey === 'terrain' ? (
        <nav className="terrain-filter-tabs" aria-label="Terrain views">
          <button
            type="button"
            className={`terrain-filter-tab${terrainFilter.mode === 'all' ? ' active' : ''}`}
            onClick={() => changeTerrainFilter({ mode: 'all' })}
            aria-current={terrainFilter.mode === 'all' ? 'page' : undefined}
          >
            All
          </button>
          <button
            type="button"
            className={`terrain-filter-tab${terrainFilter.mode === 'untagged' ? ' active' : ''}`}
            onClick={() => changeTerrainFilter({ mode: 'untagged' })}
            aria-current={terrainFilter.mode === 'untagged' ? 'page' : undefined}
          >
            Untagged
          </button>
          {(data?.availableTags ?? []).map((tag) => {
            const filter: TerrainFilter = { mode: 'tag', tag };
            const active = filterMatches(terrainFilter, filter);
            return (
              <button
                key={tag}
                type="button"
                className={`terrain-filter-tab${active ? ' active' : ''}`}
                onClick={() => changeTerrainFilter(filter)}
                aria-current={active ? 'page' : undefined}
              >
                {tagLabel(tag)}
              </button>
            );
          })}
        </nav>
      ) : null}

      {error ? <p className="status-error">{error}</p> : null}

      <section className="weather-list" aria-label={config.listLabel}>
        {data && visibleItems.length === 0 ? (
          <p className="empty-state">No notes found in this view.</p>
        ) : (
          <div className={`weather-stack ${config.stackClassName}`}>
            {visibleItems.map((item) => (
              <WeatherCard
                key={item.vaultPath}
                item={item}
                collectionKey={collectionKey}
                openFile={openFile}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export function VaultWeatherApp({
  collectionKey,
  terrainFilter,
  refreshToken,
  service,
  changeCollection,
  changeTerrainFilter,
  createNote,
  openFile
}: VaultWeatherAppProps) {
  const [data, setData] = useState<WeatherCollectionData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    setData(null);

    void service
      .buildCollection(collectionKey, terrainFilter)
      .then((nextData) => {
        if (!cancelled) setData(nextData);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not read the vault');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [collectionKey, refreshToken, service, terrainFilter]);

  return (
    <WeatherPage
      collectionKey={collectionKey}
      terrainFilter={terrainFilter}
      data={data}
      error={error}
      changeCollection={changeCollection}
      changeTerrainFilter={changeTerrainFilter}
      createNote={createNote}
      openFile={openFile}
    />
  );
}
