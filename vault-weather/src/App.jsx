import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { generatedAt as questionsGeneratedAt, questions } from './data/questions';
import { generatedAt as hunchesGeneratedAt, hunches } from './data/hunches';
import { generatedAt as shelfGeneratedAt, shelfItems } from './data/shelf';
import {
  activityTone,
  getItemUpdatedDate,
  sortWeatherItems
} from './lib/questionState';

const formatDate = (value) => {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
};

const parseRating = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    throw new Error('Shelf rating is required');
  }

  const rating = Number(trimmed);
  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    throw new Error('Shelf rating must be an integer from 0 to 5');
  }

  return rating;
};

const collectionConfigs = {
  questions: {
    route: '/',
    navLabel: 'Questions',
    title: 'Question Weather',
    countLabel: 'questions',
    listLabel: 'Questions',
    createPrompt: 'New question',
    createEndpoint: '/__question-weather-create',
    refreshEndpoint: '/__question-weather-refresh',
    createError: 'Could not create question',
    addLabel: 'Add question',
    refreshLabel: 'Refresh questions from vault',
    payloadKey: 'question',
    cardClassName: 'question-card',
    stackClassName: 'question-stack',
    items: questions,
    generatedAt: questionsGeneratedAt
  },
  hunches: {
    route: '/hunch-weather',
    navLabel: 'Hunches',
    title: 'Hunch Weather',
    countLabel: 'hunches',
    listLabel: 'Hunches',
    createPrompt: 'New hunch',
    createEndpoint: '/__hunch-weather-create',
    refreshEndpoint: '/__hunch-weather-refresh',
    createError: 'Could not create hunch',
    addLabel: 'Add hunch',
    refreshLabel: 'Refresh hunches from vault',
    payloadKey: 'hunch',
    cardClassName: 'hunch-card',
    stackClassName: 'hunch-stack',
    items: hunches,
    generatedAt: hunchesGeneratedAt
  },
  shelf: {
    route: '/shelf-weather',
    navLabel: 'Shelf',
    title: 'Shelf Weather',
    countLabel: 'shelf items',
    listLabel: 'Shelf',
    createPrompt: 'New shelf item',
    ratingPrompt: 'Shelf rating (0-5)',
    createEndpoint: '/__shelf-weather-create',
    refreshEndpoint: '/__shelf-weather-refresh',
    createError: 'Could not create shelf item',
    addLabel: 'Add shelf item',
    refreshLabel: 'Refresh shelf from vault',
    payloadKey: 'shelfItem',
    cardClassName: 'shelf-card',
    stackClassName: 'shelf-stack',
    cardMode: 'cover',
    items: shelfItems,
    generatedAt: shelfGeneratedAt
  }
};

const collectionLinks = Object.values(collectionConfigs);

const currentCollectionKey = () => {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/hunch-weather') return 'hunches';
  return pathname === '/shelf-weather' ? 'shelf' : 'questions';
};

function WeatherCard({ item, config }) {
  const activity = item.activity ?? {};
  const tone = activityTone(activity.level);
  const updatedDate = getItemUpdatedDate(item);
  const hasCover = config.cardMode === 'cover' && item.coverUrl;

  return (
    <article
      className={`weather-card ${config.cardClassName} tone-${tone}${hasCover ? ' has-cover' : ''}`}
    >
      <a
        className="weather-card-link"
        href={item.obsidianUrl}
        aria-label={`Open ${item.title} in Obsidian`}
      >
        <div className="weather-card-meta">
          <span>Updated {formatDate(updatedDate)}</span>
        </div>
        {hasCover ? (
          <div className="weather-card-cover">
            <img src={item.coverUrl} alt="" loading="lazy" aria-hidden="true" />
            <span className="sr-only">{item.title}</span>
          </div>
        ) : (
          <h2>{item.title}</h2>
        )}
      </a>
    </article>
  );
}

function WeatherPage({ config }) {
  const [createState, setCreateState] = useState('idle');
  const [createError, setCreateError] = useState('');
  const [refreshState, setRefreshState] = useState('idle');
  const visibleItems = useMemo(() => sortWeatherItems(config.items), [config.items]);

  useEffect(() => {
    document.title = config.title;
  }, [config.title]);

  const activeCount = config.items.filter(
    (item) => (item.activity?.recentUpdateCount ?? 0) > 0
  ).length;

  const createItem = async () => {
    const title = window.prompt(config.createPrompt);
    if (title === null) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const body = { title: trimmedTitle };
    if (config.ratingPrompt) {
      const rating = window.prompt(config.ratingPrompt);
      if (rating === null) return;

      try {
        body.rating = parseRating(rating);
      } catch (error) {
        setCreateState('error');
        setCreateError(
          error instanceof Error ? error.message : config.createError
        );
        return;
      }
    }

    setCreateState('creating');
    setCreateError('');
    try {
      const response = await fetch(config.createEndpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const payload = await response.json().catch(() => ({}));
      const createdItem = payload.item ?? payload[config.payloadKey];
      if (!response.ok || !createdItem?.obsidianUrl) {
        throw new Error(payload.error ?? config.createError);
      }

      window.location.href = createdItem.obsidianUrl;
      window.setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setCreateState('error');
      setCreateError(
        error instanceof Error ? error.message : config.createError
      );
    }
  };

  const refreshItems = async () => {
    setRefreshState('refreshing');
    try {
      const response = await fetch(config.refreshEndpoint, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      window.location.reload();
    } catch {
      setRefreshState('error');
    }
  };

  return (
    <main className="weather-app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local vault surface</p>
          <h1>{config.title}</h1>
          <p className="app-subtitle">
            {config.items.length} {config.countLabel} · {activeCount} active in the last 30 days · generated {formatDate(config.generatedAt)}
          </p>
        </div>
        <div className="header-actions">
          <nav className="collection-tabs" aria-label="Weather surfaces">
            {collectionLinks.map((link) => (
              <a
                key={link.route}
                className={`collection-tab${link.route === config.route ? ' active' : ''}`}
                href={link.route}
                aria-current={link.route === config.route ? 'page' : undefined}
              >
                {link.navLabel}
              </a>
            ))}
          </nav>
          <button
            className="action-button icon-button"
            type="button"
            onClick={createItem}
            disabled={createState === 'creating'}
            title={config.addLabel}
            aria-label={config.addLabel}
          >
            <Plus aria-hidden="true" size={18} />
          </button>
          <button
            className="action-button refresh-button"
            type="button"
            onClick={refreshItems}
            disabled={refreshState === 'refreshing'}
            title={config.refreshLabel}
            aria-label={config.refreshLabel}
          >
            <RefreshCw aria-hidden="true" size={16} />
            <span>{refreshState === 'refreshing' ? 'Refreshing' : 'Refresh'}</span>
          </button>
        </div>
      </header>
      {createState === 'error' ? (
        <p className="status-error">{createError}</p>
      ) : null}
      {refreshState === 'error' ? (
        <p className="status-error">Refresh is only available from the local dev server.</p>
      ) : null}

      <section className="weather-list" aria-label={config.listLabel}>
        <div className={`weather-stack ${config.stackClassName}`}>
          {visibleItems.map((item) => (
            <WeatherCard key={item.slug} item={item} config={config} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return <WeatherPage config={collectionConfigs[currentCollectionKey()]} />;
}
