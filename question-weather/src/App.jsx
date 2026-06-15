import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
  const [refreshState, setRefreshState] = useState('idle');
  const visibleQuestions = useMemo(() => sortQuestions(questions), []);

  const activeCount = questions.filter(
    (question) => (question.activity?.recentUpdateCount ?? 0) > 0
  ).length;

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
        <button
          className="refresh-button"
          type="button"
          onClick={refreshQuestions}
          disabled={refreshState === 'refreshing'}
          title="Refresh questions from vault"
          aria-label="Refresh questions from vault"
        >
          <RefreshCw aria-hidden="true" size={16} />
          <span>{refreshState === 'refreshing' ? 'Refreshing' : 'Refresh'}</span>
        </button>
      </header>
      {refreshState === 'error' ? (
        <p className="refresh-error">Refresh is only available from the local dev server.</p>
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
