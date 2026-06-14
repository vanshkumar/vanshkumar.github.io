import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInitialState } from '../engine/initialState';
import { clearGame, loadGame, saveGame } from '../persistence/localStorage';

export default function SetupPage() {
  const navigate = useNavigate();
  const savedGame = loadGame();
  const [playerCount, setPlayerCount] = useState(2);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [names, setNames] = useState(['Ada', 'Ben', 'Cleo', 'Dev']);

  function updateName(index, value) {
    setNames((current) =>
      current.map((name, nameIndex) => (nameIndex === index ? value : name)),
    );
  }

  function startGame() {
    const playerNames = names.slice(0, playerCount).map((name, index) => {
      const trimmed = name.trim();
      return trimmed || `Player ${index + 1}`;
    });
    const state = createInitialState({
      playerNames,
      seed: `coffee-rush-${Date.now()}`,
      startingPlayerIndex: Math.min(startingPlayerIndex, playerCount - 1),
    });
    clearGame();
    saveGame(state);
    navigate('/game');
  }

  function resumeGame() {
    navigate(savedGame?.phase === 'gameOver' ? '/results' : '/game');
  }

  function resetSavedGame() {
    clearGame();
    window.location.reload();
  }

  return (
    <main className="setup-page">
      <section className="setup-main">
        <div className="brand-lockup">
          <span className="brand-mark">CR</span>
          <div>
            <h1>Coffee Rush</h1>
            <p>Hot-seat table play for fast orders and noisy cups.</p>
          </div>
        </div>

        {savedGame && (
          <div className="resume-strip">
            <span>Saved game: turn {savedGame.turn}</span>
            <div className="button-row">
              <button type="button" onClick={resumeGame}>
                Resume
              </button>
              <button type="button" onClick={resetSavedGame}>
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="setup-controls">
          <label>
            Players
            <select
              value={playerCount}
              onChange={(event) => {
                const nextCount = Number(event.target.value);
                setPlayerCount(nextCount);
                setStartingPlayerIndex((current) => Math.min(current, nextCount - 1));
              }}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>

          <label>
            Starting player
            <select
              value={startingPlayerIndex}
              onChange={(event) => setStartingPlayerIndex(Number(event.target.value))}
            >
              {names.slice(0, playerCount).map((name, index) => (
                <option key={index} value={index}>
                  {name.trim() || `Player ${index + 1}`}
                </option>
              ))}
            </select>
          </label>

          <div className="name-grid">
            {names.slice(0, playerCount).map((name, index) => (
              <label key={index}>
                Player {index + 1}
                <input
                  value={name}
                  onChange={(event) => updateName(index, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>

        <button className="primary-button" type="button" onClick={startGame}>
          Start game
        </button>
      </section>
    </main>
  );
}
