import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusAlert, StatusToast } from '../components/StatusFeedback';
import { getScores, getWinnerIds } from '../engine/selectors';
import {
  clearGame,
  loadGame,
  loadUndoStack,
} from '../persistence/localStorage';
import { clearRemoteSession } from '../persistence/remoteSession';
import {
  createElementScreenshotBlob,
  downloadFilesArchive,
  downloadTextFile,
} from '../utils/downloads';
import {
  formatGameExport,
  gameExportArchiveFilename,
  gameExportFilename,
  gameScreenshotFilename,
} from '../utils/gameExport';

export default function ResultsPage() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ id: 0, message: '' });
  const [isExporting, setIsExporting] = useState(false);
  const state = loadGame();
  const undoStack = loadUndoStack();

  if (!state) {
    return (
      <main className="results-page">
        <section className="results-panel">
          <h1>No saved game</h1>
          <button className="primary-button" type="button" onClick={() => navigate('/')}>
            Setup
          </button>
        </section>
      </main>
    );
  }

  const scores = getScores(state);
  const winners = getWinnerIds(state);

  function showToast(message) {
    setToast((current) => ({ id: current.id + 1, message }));
  }

  function newGame() {
    clearGame();
    clearRemoteSession();
    navigate('/');
  }

  async function downloadExport() {
    if (isExporting) return;

    setIsExporting(true);
    const exportedAt = new Date();
    const exportText = formatGameExport(state, undoStack);
    const exportFilename = gameExportFilename(state, exportedAt);
    const screenshotFilename = gameScreenshotFilename(state, exportedAt);

    try {
      const screenshotBlob = await createElementScreenshotBlob(pageRef.current);
      await downloadFilesArchive(
        [
          {
            name: exportFilename,
            blob: new Blob([exportText], { type: 'application/json' }),
            lastModified: exportedAt.getTime(),
          },
          {
            name: screenshotFilename,
            blob: screenshotBlob,
            lastModified: exportedAt.getTime(),
          },
        ],
        gameExportArchiveFilename(state, exportedAt),
      );
      setError('');
      showToast('Game log and screenshot downloaded.');
    } catch (screenshotError) {
      console.error(screenshotError);
      downloadTextFile(exportText, exportFilename, 'application/json');
      setToast((current) => ({ ...current, message: '' }));
      setError('Game log downloaded, but the screenshot failed.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="results-page" ref={pageRef}>
      <section className="results-panel">
        <h1>{winners.length > 1 ? 'Shared win' : `${scores[0].name} wins`}</h1>
        <StatusAlert messages={[error]} />
        <div className="score-table">
          {scores.map((score) => (
            <div
              key={score.playerId}
              className={`score-row ${winners.includes(score.playerId) ? 'winner-row' : ''}`}
            >
              <strong>{score.name}</strong>
              <span>{score.rating} rating</span>
              <small>
                {score.completed} orders / {score.activatedUpgrades} upgrades /{' '}
                {score.penalties} penalties / {score.rushTokens} Rush
              </small>
            </div>
          ))}
        </div>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={newGame}>
            New online room
          </button>
          <button type="button" onClick={downloadExport} disabled={isExporting}>
            {isExporting ? 'Downloading...' : 'Download log + screenshot'}
          </button>
        </div>
      </section>
      <StatusToast
        key={toast.id}
        message={toast.message}
        onDismiss={() => setToast((current) => ({ ...current, message: '' }))}
      />
    </main>
  );
}
