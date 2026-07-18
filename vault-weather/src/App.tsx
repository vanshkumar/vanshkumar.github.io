import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { TFile } from 'obsidian';
import { activityTone, getItemUpdatedDate, sortWeatherItems } from './lib/weatherCore';
import { WeatherDataService } from './lib/weatherData';
import {
  COLLECTION_CONFIGS,
  COLLECTION_KEYS,
  type CollectionKey,
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

interface WeatherCardProps {
  item: WeatherItem;
  collectionKey: CollectionKey;
  openFile: (file: TFile) => Promise<void>;
}

function WeatherCard({ item, collectionKey, openFile }: WeatherCardProps) {
  const config = COLLECTION_CONFIGS[collectionKey];
  const tone = activityTone(item.activity.level);
  const updatedDate = getItemUpdatedDate(item);
  const hasCover = config.cardMode === 'cover' && Boolean(item.coverUrl);

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
  refreshToken: number;
  service: WeatherDataService;
  changeCollection: (key: CollectionKey) => void;
  createNote: (key: CollectionKey) => void;
  openFile: (file: TFile) => Promise<void>;
}

interface WeatherPageProps {
  collectionKey: CollectionKey;
  data: WeatherCollectionData | null;
  error: string;
  changeCollection: (key: CollectionKey) => void;
  createNote: (key: CollectionKey) => void;
  openFile: (file: TFile) => Promise<void>;
}

export function WeatherPage({
  collectionKey,
  data,
  error,
  changeCollection,
  createNote,
  openFile
}: WeatherPageProps) {
  const config = COLLECTION_CONFIGS[collectionKey];
  const visibleItems = useMemo(() => sortWeatherItems(data?.items ?? []), [data]);
  const activeCount = (data?.items ?? []).filter(
    (item) => item.activity.recentUpdateCount > 0
  ).length;

  return (
    <main className="weather-app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local vault surface</p>
          <h1>{config.title}</h1>
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
            onClick={() => createNote(collectionKey)}
            title={config.addLabel}
            aria-label={config.addLabel}
          >
            <Plus aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      {error ? <p className="status-error">{error}</p> : null}

      <section className="weather-list" aria-label={config.listLabel}>
        {data && visibleItems.length === 0 ? (
          <p className="empty-state">No notes found in {config.folder}.</p>
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
  refreshToken,
  service,
  changeCollection,
  createNote,
  openFile
}: VaultWeatherAppProps) {
  const [data, setData] = useState<WeatherCollectionData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');

    void service
      .buildCollection(collectionKey)
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
  }, [collectionKey, refreshToken, service]);

  return (
    <WeatherPage
      collectionKey={collectionKey}
      data={data?.key === collectionKey ? data : null}
      error={error}
      changeCollection={changeCollection}
      createNote={createNote}
      openFile={openFile}
    />
  );
}
