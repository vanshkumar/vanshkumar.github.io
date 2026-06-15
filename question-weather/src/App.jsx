import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { generatedAt, questions } from './data/questions';
import {
  activityTone,
  getQuestionUpdatedDate,
  sortQuestions
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

function QuestionCard({ question }) {
  const activity = question.activity ?? {};
  const tone = activityTone(activity.level);
  const updatedDate = getQuestionUpdatedDate(question);

  return (
    <article className={`question-card tone-${tone}`}>
      <a
        className="question-card-link"
        href={question.obsidianUrl}
        aria-label={`Open ${question.title} in Obsidian`}
      >
        <div className="question-card-meta">
          <span>Updated {formatDate(updatedDate)}</span>
        </div>
        <h2>{question.title}</h2>
      </a>
    </article>
  );
}

export default function App() {
  const [createState, setCreateState] = useState('idle');
  const [createError, setCreateError] = useState('');
  const [refreshState, setRefreshState] = useState('idle');
  const visibleQuestions = useMemo(() => sortQuestions(questions), []);

  const activeCount = questions.filter(
    (question) => (question.activity?.recentUpdateCount ?? 0) > 0
  ).length;

  const createQuestion = async () => {
    const title = window.prompt('New question');
    if (title === null) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setCreateState('creating');
    setCreateError('');
    try {
      const response = await fetch('/__question-weather-create', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ title: trimmedTitle })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.question?.obsidianUrl) {
        throw new Error(payload.error ?? 'Could not create question');
      }

      window.location.href = payload.question.obsidianUrl;
      window.setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setCreateState('error');
      setCreateError(
        error instanceof Error ? error.message : 'Could not create question'
      );
    }
  };

  const refreshQuestions = async () => {
    setRefreshState('refreshing');
    try {
      const response = await fetch('/__question-weather-refresh', {
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
    <main className="question-weather-app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local vault surface</p>
          <h1>Question Weather</h1>
          <p className="app-subtitle">
            {questions.length} questions · {activeCount} active in the last 30 days · generated {formatDate(generatedAt)}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="action-button icon-button"
            type="button"
            onClick={createQuestion}
            disabled={createState === 'creating'}
            title="Add question"
            aria-label="Add question"
          >
            <Plus aria-hidden="true" size={18} />
          </button>
          <button
            className="action-button refresh-button"
            type="button"
            onClick={refreshQuestions}
            disabled={refreshState === 'refreshing'}
            title="Refresh questions from vault"
            aria-label="Refresh questions from vault"
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

      <section className="question-list" aria-label="Questions">
        <div className="question-stack">
          {visibleQuestions.map((question) => (
            <QuestionCard key={question.slug} question={question} />
          ))}
        </div>
      </section>
    </main>
  );
}
