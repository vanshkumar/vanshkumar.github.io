import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInitialState } from '../engine/initialState';
import {
  MAX_PLAYER_NAME_LENGTH,
  normalizePlayerName,
  playerNameError,
} from '../engine/playerProfile';
import {
  WHATSAPP_COUNTRY_OPTIONS,
  normalizeWhatsAppContact,
} from '../network/turnNotifications';
import {
  clearGame,
  loadGame,
  savePendingPlayerProfile,
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
  formatPlayerSeat,
  getInviteLocalPlayerId,
  getInviteFromLocation,
  hasQueryInviteSecrets,
  loadRemoteSession,
  parseInviteInput,
  saveRemoteSession,
} from '../persistence/remoteSession';

const QUERY_SECRET_INVITE_MESSAGE =
  'Invite links must keep private room keys after #. Ask the host for a fresh invite link.';
const ROOM_LINK_MISSING_KEY_MESSAGE =
  'This room link does not include the private room key. Open it on a device that already joined, or ask for a private invite/device link for this device.';

export default function SetupPage({ queryInviteSecretsScrubbed = false }) {
  const navigate = useNavigate();
  const savedGame = loadGame();
  const initialInvite = getInviteFromLocation();
  const initialRoomLinkMissingKey =
    initialInvite.roomId && (!initialInvite.relayAuth || !initialInvite.gameKey);
  const [playerCount, setPlayerCount] = useState(2);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [useOptionalStarterOrders, setUseOptionalStarterOrders] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileCountry, setProfileCountry] = useState('US');
  const [profileNumber, setProfileNumber] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState(
    initialInvite.relayAuth && initialInvite.gameKey
      ? window.location.href
      : initialInvite.roomId,
  );
  const [remoteError, setRemoteError] = useState('');
  const [querySecretWarning, setQuerySecretWarning] = useState(
    queryInviteSecretsScrubbed
      ? QUERY_SECRET_INVITE_MESSAGE
      : initialRoomLinkMissingKey
        ? ROOM_LINK_MISSING_KEY_MESSAGE
        : '',
  );
  const [isHostingOnline, setIsHostingOnline] = useState(false);
  const [pendingSeatSwitchKey, setPendingSeatSwitchKey] = useState('');
  const parsedJoinInvite = parseInviteInput(joinRoomCode);
  const joinLocalPlayerId = getInviteLocalPlayerId(parsedJoinInvite);
  const isJoiningPrivateInvite = Boolean(
    parsedJoinInvite.roomId &&
      parsedJoinInvite.relayAuth &&
      parsedJoinInvite.gameKey,
  );
  const joinButtonLabel = joinLocalPlayerId
    ? `Join as ${formatPlayerSeat(joinLocalPlayerId)}`
    : 'Join online game';
  const joinSeatHint = joinLocalPlayerId
    ? `You'll join this room as ${formatPlayerSeat(joinLocalPlayerId)}.`
    : '';
  const profileNameLabel = joinLocalPlayerId
    ? `Your name for ${formatPlayerSeat(joinLocalPlayerId)}`
    : 'Your name';
  const remotePlayHeading = isJoiningPrivateInvite ? 'Join online room' : 'Online room';
  const remotePlayDescription = isJoiningPrivateInvite && joinLocalPlayerId
    ? `Enter your details, then join as ${formatPlayerSeat(joinLocalPlayerId)}.`
    : 'Host a room or join with an invite. Each player uses their own phone.';
  const visibleRemoteError = remoteError || querySecretWarning;

  function playerSeatName(index) {
    if (index === 0) {
      return normalizePlayerName(profileName) || 'You';
    }

    return `Player ${index + 1}`;
  }

  function validateOnlineIdentity() {
    const nameError = playerNameError(profileName);

    if (nameError) {
      setQuerySecretWarning('');
      setRemoteError(nameError);
      return null;
    }

    const normalized = normalizeWhatsAppContact({
      country: profileCountry,
      nationalNumber: profileNumber,
    });

    if (normalized.error) {
      setQuerySecretWarning('');
      setRemoteError(normalized.error);
      return null;
    }

    return {
      name: normalizePlayerName(profileName),
      contact: normalized.contact,
    };
  }

  function createSetupState(hostName, seedPrefix = 'coffee-rush') {
    const playerNames = Array.from({ length: playerCount }, (_, index) =>
      index === 0 ? hostName : `Player ${index + 1}`,
    );

    return createInitialState({
      playerNames,
      seed: `${seedPrefix}-${Date.now()}`,
      startingPlayerIndex: Math.min(startingPlayerIndex, playerCount - 1),
      useOptionalStarterOrders,
    });
  }

  async function hostOnlineGame() {
    if (isHostingOnline) return;

    const identity = validateOnlineIdentity();
    if (!identity) return;

    setIsHostingOnline(true);
    setRemoteError('');
    setQuerySecretWarning('');

    const roomId = createRoomCode();
    const relayAuth = createRelayAuth();
    const hostAuth = createHostAuth();
    const gameKey = createGameKey();
    const state = createSetupState(identity.name, `coffee-rush-${roomId}`);
    const session = createRemoteSession({
      mode: REMOTE_MODES.HOST,
      protocol: REMOTE_PROTOCOLS.ASYNC,
      roomId,
      relayAuth,
      hostAuth,
      gameKey,
      localPlayerId: 'p1',
      invitePlayerId: playerCount >= 2 ? 'p2' : '',
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
      savePendingPlayerProfile({
        roomId,
        playerId: 'p1',
        name: identity.name,
        country: identity.contact.country,
        nationalNumber: identity.contact.nationalNumber,
      });
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
      setRemoteError(ROOM_LINK_MISSING_KEY_MESSAGE);
      return;
    }

    const localPlayerId = getInviteLocalPlayerId(invite);
    const existingSession = loadRemoteSession();
    const seatSwitchKey =
      existingSession?.roomId === invite.roomId &&
      existingSession.localPlayerId &&
      localPlayerId &&
      existingSession.localPlayerId !== localPlayerId
        ? `${invite.roomId}:${existingSession.localPlayerId}:${localPlayerId}`
        : '';
    const hostDowngradeKey =
      existingSession?.roomId === invite.roomId &&
      existingSession.localPlayerId === localPlayerId &&
      existingSession.mode === REMOTE_MODES.HOST
        ? `${invite.roomId}:${localPlayerId}:host-to-device`
        : '';

    if (seatSwitchKey && pendingSeatSwitchKey !== seatSwitchKey) {
      setPendingSeatSwitchKey(seatSwitchKey);
      setQuerySecretWarning('');
      setRemoteError(
        `This browser is already set up as ${formatPlayerSeat(existingSession.localPlayerId)} for room ${invite.roomId}. Press Join again to switch to ${formatPlayerSeat(localPlayerId)}.`,
      );
      return;
    }

    if (hostDowngradeKey && pendingSeatSwitchKey !== hostDowngradeKey) {
      setPendingSeatSwitchKey(hostDowngradeKey);
      setQuerySecretWarning('');
      setRemoteError(
        `This browser already has host controls for room ${invite.roomId}. Press Join again to replace them with a seat-only ${formatPlayerSeat(localPlayerId)} session.`,
      );
      return;
    }

    const identity = validateOnlineIdentity();
    if (!identity) return;

    setPendingSeatSwitchKey('');
    clearGame();
    clearRemoteSession();
    saveRemoteSession(
      createRemoteSession({
        mode: REMOTE_MODES.PEER,
        protocol: REMOTE_PROTOCOLS.ASYNC,
        roomId: invite.roomId,
        relayAuth: invite.relayAuth,
        gameKey: invite.gameKey,
        localPlayerId,
        invitePlayerId: localPlayerId,
      }),
    );
    savePendingPlayerProfile({
      roomId: invite.roomId,
      playerId: localPlayerId,
      name: identity.name,
      country: identity.contact.country,
      nationalNumber: identity.contact.nationalNumber,
    });
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
          {!isJoiningPrivateInvite && (
            <>
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
                  {Array.from({ length: playerCount }, (_, index) => (
                    <option key={index} value={index}>
                      {playerSeatName(index)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="setup-checkbox">
                <input
                  type="checkbox"
                  checked={useOptionalStarterOrders}
                  onChange={(event) => setUseOptionalStarterOrders(event.target.checked)}
                />
                <span>
                  Optional starter orders
                  <small>
                    Start each player with Ristretto/Espresso and remove unused
                    2-ingredient cards.
                  </small>
                </span>
              </label>
            </>
          )}

          <div className="profile-grid">
            <label>
              {profileNameLabel}
              <input
                value={profileName}
                onChange={(event) => {
                  setProfileName(event.target.value);
                  setRemoteError('');
                }}
                maxLength={MAX_PLAYER_NAME_LENGTH}
                autoComplete="name"
              />
            </label>
            <label>
              Country
              <select
                value={profileCountry}
                onChange={(event) => {
                  setProfileCountry(event.target.value);
                  setRemoteError('');
                }}
              >
                {WHATSAPP_COUNTRY_OPTIONS.map((option) => (
                  <option key={option.country} value={option.country}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              WhatsApp number
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={profileNumber}
                onChange={(event) => {
                  setProfileNumber(event.target.value);
                  setRemoteError('');
                }}
              />
            </label>
          </div>
        </div>

        <section className="remote-play-panel" aria-label="Play options">
          <div>
            <h2>{remotePlayHeading}</h2>
            <p>{remotePlayDescription}</p>
          </div>
          {visibleRemoteError && <div className="error-banner">{visibleRemoteError}</div>}
          {!isJoiningPrivateInvite && (
            <div className="remote-play-actions">
              <button
                className="primary-button"
                type="button"
                onClick={hostOnlineGame}
                disabled={isHostingOnline}
              >
                {isHostingOnline ? 'Creating room...' : 'Host online game'}
              </button>
            </div>
          )}
          <div className="join-room-row">
            <label>
              Invite link
              <input
                value={joinRoomCode}
                onChange={(event) => {
                  setJoinRoomCode(event.target.value.trim());
                  setRemoteError('');
                  setQuerySecretWarning('');
                  setPendingSeatSwitchKey('');
                }}
                placeholder="Paste invite link or ABC123.auth.key"
                inputMode="text"
                autoCapitalize="none"
                spellCheck={false}
              />
              {joinSeatHint && <small className="invite-seat-hint">{joinSeatHint}</small>}
            </label>
            <button type="button" onClick={joinOnlineGame}>
              {joinButtonLabel}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
