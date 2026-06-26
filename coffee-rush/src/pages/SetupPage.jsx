import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInitialState } from '../engine/initialState';
import {
  clearGame,
  loadGame,
  saveAsyncRoomState,
  saveGame,
} from '../persistence/localStorage';
import { createAsyncRoom } from '../network/asyncRoom';
import {
  REMOTE_MODES,
  REMOTE_PROTOCOLS,
  clearRemoteSession,
  createGameKey,
  createHostAuth,
  createRemoteSession,
  createRelayAuth,
  createRoomCode,
  formatInviteToken,
  getInviteFromLocation,
  hasQueryInviteSecrets,
  parseInviteInput,
  saveRemoteSession,
} from '../persistence/remoteSession';

const QUERY_SECRET_INVITE_MESSAGE =
  'Invite links must keep private room keys after #. Ask the host for a fresh invite link.';

export default function SetupPage({ queryInviteSecretsScrubbed = false }) {
  const navigate = useNavigate();
  const savedGame = loadGame();
  const initialInvite = getInviteFromLocation();
  const [playerCount, setPlayerCount] = useState(2);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [names, setNames] = useState(['Ada', 'Ben', 'Cleo', 'Dev']);
  const [joinRoomCode, setJoinRoomCode] = useState(
    initialInvite.relayAuth && initialInvite.gameKey
      ? formatInviteToken(
          initialInvite.roomId,
          initialInvite.relayAuth,
          initialInvite.gameKey,
        )
      : initialInvite.roomId,
  );
  const [remoteError, setRemoteError] = useState('');
  const [querySecretWarning, setQuerySecretWarning] = useState(
    queryInviteSecretsScrubbed ? QUERY_SECRET_INVITE_MESSAGE : '',
  );
  const [isHostingOnline, setIsHostingOnline] = useState(false);
  const visibleRemoteError = remoteError || querySecretWarning;

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

  async function hostOnlineGame() {
    if (isHostingOnline) return;

    setIsHostingOnline(true);
    setRemoteError('');
    setQuerySecretWarning('');

    const roomId = createRoomCode();
    const relayAuth = createRelayAuth();
    const hostAuth = createHostAuth();
    const gameKey = createGameKey();
    const state = createSetupState(`coffee-rush-${roomId}`);
    const session = createRemoteSession({
      mode: REMOTE_MODES.HOST,
      protocol: REMOTE_PROTOCOLS.ASYNC,
      roomId,
      relayAuth,
      hostAuth,
      gameKey,
    });

    try {
      const acceptedSession = await createAsyncRoom(session, state);

      clearGame();
      clearRemoteSession();
      saveGame(state);
      saveAsyncRoomState({
        roomId,
        headIndex: acceptedSession.headIndex,
        headHash: acceptedSession.headHash,
        state,
      });
      saveRemoteSession(acceptedSession);
      navigate('/game');
    } catch (error) {
      setRemoteError(
        error?.message ??
          'Could not create the async online room. Check the relay URL and try again.',
      );
    } finally {
      setIsHostingOnline(false);
    }
  }

  function joinOnlineGame() {
    if (hasQueryInviteSecrets(joinRoomCode)) {
      setQuerySecretWarning('');
      setRemoteError(QUERY_SECRET_INVITE_MESSAGE);
      return;
    }

    const invite = parseInviteInput(joinRoomCode);

    if (invite.roomId.length !== 6) {
      setQuerySecretWarning('');
      setRemoteError('Paste the invite link or room token from the host.');
      return;
    }

    if (!invite.relayAuth || !invite.gameKey) {
      setQuerySecretWarning('');
      setRemoteError('That invite is missing its private room key.');
      return;
    }

    clearGame();
    clearRemoteSession();
    saveRemoteSession(
      createRemoteSession({
        mode: REMOTE_MODES.PEER,
        protocol: REMOTE_PROTOCOLS.ASYNC,
        roomId: invite.roomId,
        relayAuth: invite.relayAuth,
        gameKey: invite.gameKey,
      }),
    );
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
          {visibleRemoteError && <div className="error-banner">{visibleRemoteError}</div>}
          <div className="remote-play-actions">
            <button className="primary-button" type="button" onClick={startGame}>
              Start local game
            </button>
            <button type="button" onClick={hostOnlineGame} disabled={isHostingOnline}>
              {isHostingOnline ? 'Creating room...' : 'Host online game'}
            </button>
          </div>
          <div className="join-room-row">
            <label>
              Invite link
              <input
                value={joinRoomCode}
                onChange={(event) => {
                  setJoinRoomCode(event.target.value.trim());
                  setRemoteError('');
                  setQuerySecretWarning('');
                }}
                placeholder="Paste invite link or ABC123.auth.key"
                inputMode="text"
                autoCapitalize="none"
                spellCheck={false}
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
