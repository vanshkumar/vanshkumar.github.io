import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScores, getWinnerIds } from '../engine/selectors';
import {
  clearGame,
  loadGame,
  loadUndoStack,
  saveGame,
} from '../persistence/localStorage';
import { createInitialState } from '../engine/initialState';
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
  const [exportStatus, setExportStatus] = useState('');
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

  function rematch() {
    const next = createInitialState({
      playerNames: state.players.map((player) => player.name),
      seed: `coffee-rush-${Date.now()}`,
    });
    clearGame();
    saveGame(next);
    navigate('/game');
  }

  function newGame() {
    clearGame();
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
      setExportStatus('Game log and screenshot downloaded.');
    } catch (screenshotError) {
      console.error(screenshotError);
      downloadTextFile(exportText, exportFilename, 'application/json');
      setExportStatus('Game log downloaded. Screenshot failed.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="results-page" ref={pageRef}>
      <section className="results-panel">
        <h1>{winners.length > 1 ? 'Shared win' : `${scores[0].name} wins`}</h1>
        {exportStatus && <div className="message-banner">{exportStatus}</div>}
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
          <button className="primary-button" type="button" onClick={rematch}>
            Rematch
          </button>
          <button type="button" onClick={downloadExport} disabled={isExporting}>
            {isExporting ? 'Downloading...' : 'Download log + screenshot'}
          </button>
          <button type="button" onClick={newGame}>
            Setup
          </button>
        </div>
      </section>
    </main>
  );
}
