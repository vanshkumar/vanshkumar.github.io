import { useNavigate } from 'react-router-dom';
import { getScores, getWinnerIds } from '../engine/selectors';
import {
  clearGame,
  loadGame,
  loadUndoStack,
  saveGame,
} from '../persistence/localStorage';
import { createInitialState } from '../engine/initialState';
import { formatGameExport, gameExportFilename } from '../utils/gameExport';

export default function ResultsPage() {
  const navigate = useNavigate();
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

  function downloadExport() {
    const blob = new Blob([formatGameExport(state, undoStack)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = gameExportFilename(state);
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="results-page">
      <section className="results-panel">
        <h1>{winners.length > 1 ? 'Shared win' : `${scores[0].name} wins`}</h1>
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
          <button type="button" onClick={downloadExport}>
            Download log
          </button>
          <button type="button" onClick={newGame}>
            Setup
          </button>
        </div>
      </section>
    </main>
  );
}
