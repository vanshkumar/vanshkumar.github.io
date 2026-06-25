import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInitialState } from '../engine/initialState';
import { clearGame, loadGame, saveGame } from '../persistence/localStorage';
import {
  REMOTE_MODES,
  clearRemoteSession,
  createRemoteSession,
  createRoomCode,
  getRoomCodeFromLocation,
  normalizeRoomCode,
  saveRemoteSession,
} from '../persistence/remoteSession';

export default function SetupPage() {
  const navigate = useNavigate();
  const savedGame = loadGame();
  const initialRoomCode = getRoomCodeFromLocation();
  const [playerCount, setPlayerCount] = useState(2);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [names, setNames] = useState(['Ada', 'Ben', 'Cleo', 'Dev']);
  const [joinRoomCode, setJoinRoomCode] = useState(initialRoomCode);
  const [remoteError, setRemoteError] = useState('');

  function updateName(index, value) {
    setNames((current) =>
      current.map((name, nameIndex) => (nameIndex === index ? value : name)),
    );
  }

  function createSetupState(seedPrefix = 'coffee-rush') {
    const playerNames = names.slice(0, playerCount).map((name, index) => {
      const trimmed = name.trim();
      return trimmed || `Player ${index + 1}`;
    });

    return createInitialState({
      playerNames,
      seed: `${seedPrefix}-${Date.now()}`,
      startingPlayerIndex: Math.min(startingPlayerIndex, playerCount - 1),
    });
  }

  function startGame() {
    const state = createSetupState();
    clearGame();
    clearRemoteSession();
    saveGame(state);
    navigate('/game');
  }

  function hostOnlineGame() {
    const roomId = createRoomCode();
    const state = createSetupState(`coffee-rush-${roomId}`);

    clearGame();
    clearRemoteSession();
    saveGame(state);
    saveRemoteSession(createRemoteSession({ mode: REMOTE_MODES.HOST, roomId }));
    navigate('/game');
  }

  function joinOnlineGame() {
    const roomId = normalizeRoomCode(joinRoomCode);

    if (roomId.length !== 6) {
      setRemoteError('Enter the 6-character room code from the host.');
      return;
    }

    clearGame();
    clearRemoteSession();
    saveRemoteSession(createRemoteSession({ mode: REMOTE_MODES.PEER, roomId }));
    navigate('/game');
  }

  function resumeGame() {
    navigate(savedGame?.phase === 'gameOver' ? '/results' : '/game');
  }

  function resetSavedGame() {
    clearGame();
    clearRemoteSession();
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

        <section className="remote-play-panel" aria-label="Play options">
          <div>
            <h2>Play mode</h2>
            <p>Local hot-seat stays on this device. Online rooms sync turns across phones.</p>
          </div>
          {remoteError && <div className="error-banner">{remoteError}</div>}
          <div className="remote-play-actions">
            <button className="primary-button" type="button" onClick={startGame}>
              Start local game
            </button>
            <button type="button" onClick={hostOnlineGame}>
              Host online game
            </button>
          </div>
          <div className="join-room-row">
            <label>
              Room code
              <input
                value={joinRoomCode}
                onChange={(event) => {
                  setJoinRoomCode(normalizeRoomCode(event.target.value));
                  setRemoteError('');
                }}
                placeholder="ABC123"
                inputMode="text"
                autoCapitalize="characters"
              />
            </label>
            <button type="button" onClick={joinOnlineGame}>
              Join online game
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
