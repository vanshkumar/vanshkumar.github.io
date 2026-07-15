import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import CupMemoryStrip from '../components/CupMemoryStrip';
import IngredientIcon from '../components/IngredientIcon';
import OrderPressureMarker from '../components/OrderPressureMarker';
import PassDeviceModal from '../components/PassDeviceModal';
import PlayerOrdersSheet from '../components/PlayerOrdersSheet';
import PlayerPanel from '../components/PlayerPanel';
import TurnBrief from '../components/TurnBrief';
import UpgradeMenu from '../components/UpgradeMenu';
import { UiIcon } from '../components/UiIcon';
import { INGREDIENTS, ingredientLabel } from '../data/ingredients';
import { getCell } from '../engine/board';
import {
  getLocalViewPlayer,
  orderPlayersForLocalView,
} from '../engine/playerViews';
import { normalizePlayerName } from '../engine/playerProfile';
import { applyAction } from '../engine/reducers';
import { canPlayerActivateUpgrade } from '../engine/upgrades';
import {
  getActivePlayer,
  getCompletableOrders,
  getLegalSetupCells,
  getMeepleForFirstMoveStep,
  getMovePathPreview,
  getPlayer,
  getSetupPlacement,
} from '../engine/selectors';
import { PHASES } from '../engine/types';
import {
  ASYNC_DRAFT_MISMATCH_MESSAGE,
  assertAsyncDraftReplayMatchesResult,
  closeAsyncRoom,
  decryptCommit,
  decryptSnapshot,
  fetchAsyncRoomHead,
  isValidAsyncAction,
  submitTurnCommit,
} from '../network/asyncRoom';
import {
  ASYNC_OFFLINE_DRAFT_CONNECTION,
  createAsyncDraftHydrationUnit,
  formatAsyncDraftConnectionLabel,
} from '../network/asyncDraftRestore';
import {
  ASYNC_COMMIT_RECOVERY_MESSAGE,
  ASYNC_DISCARD_DRAFT_MESSAGE,
  ASYNC_REPLAY_FROM_LATEST_MESSAGE,
  createAsyncCommitRecovery,
  createAsyncCommitRecoveryFromDraft,
} from '../network/asyncCommitRecovery';
import {
  ASYNC_ROOM_CLOSED_CONNECTION,
  ASYNC_ROOM_CLOSED_MESSAGE,
  shouldTreatAsyncRoomNotFoundAsClosed,
} from '../network/asyncRoomClosure';
import {
  canControlPlayer,
  getLocalActionError,
} from '../network/localPlayerAuthority';
import { hashState } from '../network/roomCrypto';
import {
  REMOTE_MESSAGE_TYPES,
  connectRoom,
  createAcceptedAction,
  createActionRequest,
  createInviteLink,
  createStateSnapshot,
} from '../network/roomSync';
import {
  WHATSAPP_COUNTRY_OPTIONS,
  clearNotificationContact,
  createAcceptedTurnReminder,
  createEmptyNotificationRoster,
  getLocalNotificationContact,
  getNotificationRosterDisplay,
  loadNotificationRoster,
  normalizeWhatsAppContact,
  openWhatsAppDraft,
  saveNotificationRoster,
  upsertNotificationContact,
} from '../network/turnNotifications';
import {
  clearGame,
  clearAsyncDraft,
  clearPendingPlayerProfile,
  loadGame,
  loadAsyncDraft,
  loadAsyncRoomState,
  loadMinimizedOrderIds,
  loadPendingPlayerProfile,
  loadUndoStack,
  saveAsyncDraft,
  saveAsyncRoomState,
  saveGame,
  saveMinimizedOrderIds,
  saveUndoStack,
} from '../persistence/localStorage';
import {
  REMOTE_MODES,
  REMOTE_PROTOCOLS,
  clearRemoteSession,
  formatPlayerSeat,
  loadRemoteSession,
  saveRemoteSession,
} from '../persistence/remoteSession';
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

const MAX_UNDO_STATES = 25;
const RESET_ACTION_UI_TYPES = ['PLACE_STARTING_MEEPLE', 'MOVE', 'END_TURN'];

function cellLabel(cellId) {
  const cell = getCell(cellId);
  return cell ? `Cell ${cell.id} · ${ingredientLabel(cell.ingredient)}` : 'Unplaced';
}

function phaseDisplayLabel(phase) {
  switch (phase) {
    case PHASES.SETUP_PLACEMENT:
      return 'Setup';
    case PHASES.UPGRADE:
      return 'Upgrade';
    case PHASES.MOVE:
      return 'Move';
    case PHASES.POUR:
      return 'Pour';
    default:
      return phase;
  }
}

function ingredientListLabel(ingredients) {
  if (!ingredients || ingredients.length === 0) return 'none yet';
  return ingredients.map((ingredient) => ingredientLabel(ingredient)).join(', ');
}

function getMinimizedOrderGameKey(state) {
  return state?.rngSeed ?? '';
}

function getActiveOrderIdSet(state) {
  const orderIds = new Set();

  state?.players.forEach((player) => {
    player.tabs.forEach((tab) => {
      tab.forEach((order) => orderIds.add(order.id));
    });
  });

  return orderIds;
}

export default function GamePage() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const initialGameRef = useRef();
  const stateRef = useRef(null);
  const undoStackRef = useRef([]);
  const remoteClientRef = useRef(null);
  const peerIdsRef = useRef([]);
  const pendingActionIdRef = useRef('');
  const remoteSessionRef = useRef(null);
  const remoteHandlersRef = useRef({});
  const asyncSyncRef = useRef(null);
  const asyncCanonicalRef = useRef(null);
  const asyncDraftRef = useRef(null);
  const asyncFailedCommitRef = useRef(null);
  const asyncClosedRoomRef = useRef(null);
  const asyncSyncInFlightRef = useRef(false);
  const notificationSyncRef = useRef(null);
  const notificationRosterRef = useRef(null);
  const notificationRosterHashRef = useRef('');
  const profileSaveInFlightRef = useRef(false);
  const profileSaveAttemptKeyRef = useRef('');
  const savePendingOnlineProfileRef = useRef(null);
  if (initialGameRef.current === undefined) {
    initialGameRef.current = loadGame();
  }

  const [state, setState] = useState(() => initialGameRef.current);
  const [undoStack, setUndoStack] = useState(() => loadUndoStack());
  const [minimizedOrderIds, setMinimizedOrderIds] = useState(() =>
    loadMinimizedOrderIds(getMinimizedOrderGameKey(initialGameRef.current)),
  );
  const [remoteSession, setRemoteSession] = useState(() => loadRemoteSession());
  const [asyncDraftActionCount, setAsyncDraftActionCount] = useState(0);
  const [asyncFailedCommit, setAsyncFailedCommit] = useState(null);
  const [asyncClosedRoom, setAsyncClosedRoom] = useState(null);
  const [notificationRoster, setNotificationRoster] = useState(null);
  const [notificationRosterHash, setNotificationRosterHash] = useState('');
  const [notificationCountry, setNotificationCountry] = useState('US');
  const [notificationNumber, setNotificationNumber] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);
  const [pendingPlayerProfile, setPendingPlayerProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [pendingTurnReminder, setPendingTurnReminder] = useState(null);
  const [remoteStatus, setRemoteStatus] = useState(() => ({
    connection: loadRemoteSession() ? 'connecting' : 'offline',
    selfId: '',
    peerIds: [],
    error: '',
    pendingActionId: '',
  }));
  const [error, setError] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMeepleId, setSelectedMeepleId] = useState('');
  const [path, setPath] = useState([]);
  const [rushSpent, setRushSpent] = useState(0);
  const [selectedCup, setSelectedCup] = useState(null);
  const [selectedSetupCellId, setSelectedSetupCellId] = useState(null);
  const [passTo, setPassTo] = useState('');
  const [isUpgradeMenuOpen, setIsUpgradeMenuOpen] = useState(false);
  const [isOrdersSheetOpen, setIsOrdersSheetOpen] = useState(false);
  const [deviceLinkPlayerId, setDeviceLinkPlayerId] = useState('');
  const isRemoteHost = remoteSession?.mode === REMOTE_MODES.HOST;
  const isRemotePeer = remoteSession?.mode === REMOTE_MODES.PEER;
  const isRemoteGame = Boolean(remoteSession);
  const isAsyncRemoteGame = remoteSession?.protocol === REMOTE_PROTOCOLS.ASYNC;
  const isLiveRemoteGame = isRemoteGame && !isAsyncRemoteGame;
  const isLiveRemoteHost = isRemoteHost && isLiveRemoteGame;
  const isLiveRemotePeer = isRemotePeer && isLiveRemoteGame;
  const remoteRoomKey = remoteSession
    ? `${remoteSession.protocol}:${remoteSession.mode}:${remoteSession.roomId}:${remoteSession.relayAuth}:${remoteSession.hostAuth}:${remoteSession.gameKey}:${remoteSession.localPlayerId}`
    : '';
  const isCurrentAsyncRoomClosed =
    isAsyncRemoteGame && asyncClosedRoom?.roomId === remoteSession?.roomId;
  remoteSessionRef.current = remoteSession;
  notificationRosterRef.current = notificationRoster;
  notificationRosterHashRef.current = notificationRosterHash;
  remoteHandlersRef.current = {
    handleRemoteMessage,
    sendHostSnapshot,
  };
  asyncSyncRef.current = syncAsyncRoom;
  notificationSyncRef.current = syncNotificationRoster;
  savePendingOnlineProfileRef.current = savePendingOnlineProfile;

  const activePlayer = state ? getActivePlayer(state) : null;
  const setupPlacement = state ? getSetupPlacement(state) : null;
  const localPlayerId = remoteSession?.localPlayerId ?? '';
  const isOnlineProfilePending = Boolean(isAsyncRemoteGame && pendingPlayerProfile);
  const localViewPlayer = useMemo(
    () => (state ? getLocalViewPlayer(state, localPlayerId) : null),
    [localPlayerId, state],
  );
  const canControlSetupPlacement =
    !isAsyncRemoteGame || canControlPlayer(localPlayerId, setupPlacement?.playerId);
  const canControlActivePlayer =
    !isAsyncRemoteGame || canControlPlayer(localPlayerId, activePlayer?.id);
  const isActiveTurnLocked =
    isAsyncRemoteGame && state?.phase !== PHASES.SETUP_PLACEMENT && !canControlActivePlayer;
  const remoteTurnLockMessage =
    isAsyncRemoteGame && state?.phase === PHASES.SETUP_PLACEMENT && !canControlSetupPlacement
      ? `${setupPlacement?.player?.name ?? 'That player'} is placing now. Wait for their setup placement to sync.`
      : isAsyncRemoteGame && state?.phase !== PHASES.SETUP_PLACEMENT && !canControlActivePlayer
        ? `It is ${activePlayer?.name ?? 'that player'}'s turn. Wait for their turn to sync.`
        : '';
  const completableOrders = useMemo(
    () =>
      activePlayer && state?.phase === PHASES.POUR && activePlayer.hand.length === 0
        ? getCompletableOrders(activePlayer)
        : [],
    [activePlayer, state?.phase],
  );
  const readyCupIndexes = useMemo(
    () => Array.from(new Set(completableOrders.map((match) => match.cupIdx))),
    [completableOrders],
  );
  const localViewCompletableOrders =
    localViewPlayer?.id === activePlayer?.id ? completableOrders : [];
  const selectedSetupCell =
    selectedSetupCellId === null ? null : getCell(selectedSetupCellId);
  const movePreview = useMemo(
    () =>
      state?.phase === PHASES.MOVE && selectedMeepleId
        ? getMovePathPreview(state, selectedMeepleId, path, rushSpent)
        : null,
    [path, rushSpent, selectedMeepleId, state],
  );
  const orderedPlayers = useMemo(
    () => (state ? orderPlayersForLocalView(state, localPlayerId) : []),
    [localPlayerId, state],
  );
  const minimizedOrderGameKey = getMinimizedOrderGameKey(state);
  const activeOrderIds = useMemo(() => getActiveOrderIdSet(state), [state]);
  const minimizedOrderIdSet = useMemo(
    () => new Set(minimizedOrderIds),
    [minimizedOrderIds],
  );
  const rosterForCurrentRoom = useMemo(
    () =>
      notificationRoster ??
      (remoteSession?.roomId ? createEmptyNotificationRoster(remoteSession.roomId) : null),
    [notificationRoster, remoteSession?.roomId],
  );
  const localNotificationContact = useMemo(
    () =>
      rosterForCurrentRoom
        ? getLocalNotificationContact(rosterForCurrentRoom, localPlayerId)
        : null,
    [localPlayerId, rosterForCurrentRoom],
  );
  const notificationDisplay = useMemo(
    () =>
      state && rosterForCurrentRoom
        ? getNotificationRosterDisplay(state.players, rosterForCurrentRoom)
        : [],
    [rosterForCurrentRoom, state],
  );
  const deviceLinkPlayers = useMemo(
    () => (isAsyncRemoteGame && state ? state.players : []),
    [isAsyncRemoteGame, state],
  );
  const selectedDeviceLinkPlayerId = useMemo(() => {
    if (deviceLinkPlayers.some((player) => player.id === deviceLinkPlayerId)) {
      return deviceLinkPlayerId;
    }

    if (deviceLinkPlayers.some((player) => player.id === localPlayerId)) {
      return localPlayerId;
    }

    return deviceLinkPlayers[0]?.id ?? '';
  }, [deviceLinkPlayerId, deviceLinkPlayers, localPlayerId]);
  const ordersSheetPlayer = isOrdersSheetOpen ? localViewPlayer : null;
  const ordersSheetReadyOrderIds = useMemo(
    () =>
      ordersSheetPlayer?.id === activePlayer?.id
        ? new Set(completableOrders.map((match) => match.order.id))
        : new Set(),
    [activePlayer?.id, completableOrders, ordersSheetPlayer?.id],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    undoStackRef.current = undoStack;
  }, [undoStack]);

  useEffect(() => {
    if (!state) {
      if (!isRemoteGame) {
        navigate('/');
      }
      return;
    }

    saveGame(state);

    if (state.phase === 'gameOver') {
      navigate('/results');
    }
  }, [isRemoteGame, navigate, state]);

  useEffect(() => {
    saveUndoStack(undoStack);
  }, [undoStack]);

  useEffect(() => {
    if (!minimizedOrderGameKey) return;

    setMinimizedOrderIds((current) => {
      const pruned = current.filter((orderId) => activeOrderIds.has(orderId));
      return pruned.length === current.length ? current : pruned;
    });
  }, [activeOrderIds, minimizedOrderGameKey]);

  useEffect(() => {
    if (!minimizedOrderGameKey) return;

    saveMinimizedOrderIds(minimizedOrderGameKey, minimizedOrderIds);
  }, [minimizedOrderGameKey, minimizedOrderIds]);

  useEffect(() => {
    if (setupPlacement) {
      setSelectedMeepleId(setupPlacement.meepleId);
      return;
    }

    if (activePlayer && !activePlayer.meeples.some((meeple) => meeple.id === selectedMeepleId)) {
      setSelectedMeepleId(activePlayer.meeples[0]?.id ?? '');
    }
  }, [activePlayer, selectedMeepleId, setupPlacement]);

  useEffect(() => {
    if (state?.phase !== PHASES.UPGRADE) {
      setIsUpgradeMenuOpen(false);
    }
  }, [state?.phase]);

  useEffect(() => {
    if (asyncFailedCommit) {
      setIsUpgradeMenuOpen(false);
    }
  }, [asyncFailedCommit]);

  useEffect(() => {
    const session = remoteSessionRef.current;

    if (!session || session.protocol === REMOTE_PROTOCOLS.ASYNC) return undefined;

    let disposed = false;

    setRemoteStatus((current) => ({
      ...current,
      connection: 'connecting',
      error: '',
      peerIds: [],
      pendingActionId: '',
    }));
    pendingActionIdRef.current = '';

    connectRoom({
      roomId: session.roomId,
      relayAuth: session.relayAuth,
      hostAuth: session.hostAuth,
      gameKey: session.gameKey,
      role: session.mode,
      onStatus: (connection) => {
        if (!disposed) {
          setRemoteStatus((current) => ({
            ...current,
            connection,
            error: connection === 'connected' ? '' : current.error,
          }));
        }
      },
      onError: (connectionError) => {
        if (!disposed) {
          setRemoteStatus((current) => ({
            ...current,
            connection: 'error',
            error: connectionError?.message ?? 'Could not connect to the room.',
          }));
        }
      },
      onPeerJoin: (peerId) => {
        peerIdsRef.current = Array.from(new Set([...peerIdsRef.current, peerId]));
        setRemoteStatus((current) => ({
          ...current,
          peerIds: peerIdsRef.current,
        }));

        if (session.mode === REMOTE_MODES.HOST) {
          window.setTimeout(() => remoteHandlersRef.current.sendHostSnapshot(peerId), 0);
        }
      },
      onPeerLeave: (peerId) => {
        peerIdsRef.current = peerIdsRef.current.filter((candidate) => candidate !== peerId);
        setRemoteStatus((current) => ({
          ...current,
          peerIds: peerIdsRef.current,
        }));
      },
      onMessage: (message, peerId) => {
        remoteHandlersRef.current.handleRemoteMessage(message, peerId);
      },
    })
      .then((client) => {
        if (disposed) {
          client.leave();
          return;
        }

        remoteClientRef.current = client;
        saveRemoteSession({ ...session, clientId: client.selfId });
        setRemoteSession((current) =>
          current ? { ...current, clientId: client.selfId } : current,
        );
        setRemoteStatus((current) => ({
          ...current,
          connection: 'connected',
          selfId: client.selfId,
        }));

        if (session.mode === REMOTE_MODES.PEER) {
          client
            .send({
              type: REMOTE_MESSAGE_TYPES.HELLO,
              clientId: client.selfId,
              knownActionIndex: stateRef.current?.log?.length ?? 0,
            })
            .catch(() => {
              setRemoteStatus((current) => ({
                ...current,
                error: 'Could not ask the host for the room snapshot.',
              }));
            });
        }
      })
      .catch(() => {});

    return () => {
      disposed = true;
      remoteClientRef.current?.leave();
      remoteClientRef.current = null;
      peerIdsRef.current = [];
    };
  }, [remoteRoomKey]);

  useEffect(() => {
    const session = remoteSessionRef.current;

    if (!session || session.protocol !== REMOTE_PROTOCOLS.ASYNC) return undefined;

    let disposed = false;
    asyncClosedRoomRef.current = null;
    setAsyncClosedRoom(null);
    const cached = loadAsyncRoomState(session.roomId);
    if (cached?.state) {
      asyncCanonicalRef.current = {
        headIndex: cached.headIndex,
        headHash: cached.headHash,
        state: cached.state,
      };

      if (!stateRef.current) {
        stateRef.current = cached.state;
        setState(cached.state);
      }
    }

    setRemoteStatus((current) => ({
      ...current,
      connection: 'syncing',
      error: '',
      peerIds: [],
      pendingActionId: '',
    }));

    asyncSyncRef.current?.({ restoreDraft: true, silent: true, isDisposed: () => disposed });

    const intervalId = window.setInterval(() => {
      asyncSyncRef.current?.({ silent: true, isDisposed: () => disposed });
    }, 15_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        asyncSyncRef.current?.({ silent: true, isDisposed: () => disposed });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      asyncCanonicalRef.current = null;
      asyncDraftRef.current = null;
      asyncFailedCommitRef.current = null;
      asyncClosedRoomRef.current = null;
      setAsyncDraftActionCount(0);
      setAsyncFailedCommit(null);
      setAsyncClosedRoom(null);
    };
  }, [remoteRoomKey]);

  useEffect(() => {
    const session = remoteSessionRef.current;

    if (!session || session.protocol !== REMOTE_PROTOCOLS.ASYNC) {
      notificationRosterRef.current = null;
      notificationRosterHashRef.current = '';
      setNotificationRoster(null);
      setNotificationRosterHash('');
      setNotificationStatus('');
      setNotificationError('');
      setPendingTurnReminder(null);
      return undefined;
    }

    let disposed = false;
    notificationSyncRef.current?.({ silent: true, isDisposed: () => disposed });

    const intervalId = window.setInterval(() => {
      notificationSyncRef.current?.({ silent: true, isDisposed: () => disposed });
    }, 30_000);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      notificationRosterRef.current = null;
      notificationRosterHashRef.current = '';
      setNotificationRoster(null);
      setNotificationRosterHash('');
      setNotificationStatus('');
      setNotificationError('');
      setPendingTurnReminder(null);
    };
  }, [remoteRoomKey]);

  useEffect(() => {
    const session = remoteSessionRef.current;

    profileSaveInFlightRef.current = false;
    profileSaveAttemptKeyRef.current = '';
    setProfileStatus('');
    setProfileError('');

    if (!session || session.protocol !== REMOTE_PROTOCOLS.ASYNC || !session.localPlayerId) {
      setPendingPlayerProfile(null);
      return;
    }

    setPendingPlayerProfile(
      loadPendingPlayerProfile(session.roomId, session.localPlayerId),
    );
  }, [remoteRoomKey]);

  useEffect(() => {
    if (!pendingPlayerProfile || !state || !isAsyncRemoteGame) return;

    const attemptKey = [
      pendingPlayerProfile.roomId,
      pendingPlayerProfile.playerId,
      pendingPlayerProfile.name,
      pendingPlayerProfile.country,
      pendingPlayerProfile.nationalNumber,
    ].join(':');

    if (
      profileSaveInFlightRef.current ||
      profileSaveAttemptKeyRef.current === attemptKey
    ) {
      return;
    }

    profileSaveAttemptKeyRef.current = attemptKey;
    void savePendingOnlineProfileRef.current?.();
  }, [isAsyncRemoteGame, pendingPlayerProfile, state]);

  useEffect(() => {
    if (!isAsyncRemoteGame) return;

    if (localNotificationContact) {
      setNotificationCountry(localNotificationContact.country);
      setNotificationNumber(localNotificationContact.nationalNumber);
      return;
    }

    setNotificationCountry('US');
    setNotificationNumber('');
  }, [
    isAsyncRemoteGame,
    localNotificationContact,
  ]);

  if (!state || !activePlayer) {
    if (isRemoteGame) {
      return (
        <main className="game-page">
          <section className="remote-waiting-panel">
            <h1>Coffee Rush</h1>
            <p>
              {isCurrentAsyncRoomClosed
                ? `Room ${remoteSession.roomId} is closed or no longer exists.`
                : isAsyncRemoteGame
                ? `Syncing encrypted room ${remoteSession.roomId}.`
                : `Joining room ${remoteSession.roomId}. Keep this screen open while the host sends the current game.`}
            </p>
            {remoteStatus.error && <div className="error-banner">{remoteStatus.error}</div>}
            <div className="button-row">
              <span className="remote-status-pill">
                {isCurrentAsyncRoomClosed
                  ? 'Room closed'
                  : remoteStatus.connection === 'error'
                  ? 'Connection error'
                  : remoteStatus.connection}
              </span>
              <button type="button" onClick={leaveRemoteGame}>
                {isCurrentAsyncRoomClosed ? 'Back to setup' : 'Leave'}
              </button>
            </div>
          </section>
        </main>
      );
    }

    return null;
  }

  function applyAcceptedGameAction(
    action,
    { showErrors = true, recordUndo = true } = {},
  ) {
    const currentState = stateRef.current;

    if (!currentState) {
      return { error: 'No active game state is loaded.' };
    }

    const beforePlayerId = currentState.activePlayerId;
    const result = applyAction(currentState, action);

    if (result.error) {
      if (showErrors) {
        setError(result.error);
      }
      return result;
    }

    setError('');
    setExportStatus('');
    stateRef.current = result.state;
    if (recordUndo) {
      const nextUndoStack = [
        ...undoStackRef.current.slice(-(MAX_UNDO_STATES - 1)),
        currentState,
      ];
      undoStackRef.current = nextUndoStack;
      setUndoStack(nextUndoStack);
    }
    setState(result.state);

    if (action.type === 'END_TURN' && result.state.phase !== 'gameOver') {
      const nextPlayer = getPlayer(result.state, result.state.activePlayerId);
      if (beforePlayerId !== result.state.activePlayerId) {
        setPassTo(nextPlayer.name);
      }
    }

    if (RESET_ACTION_UI_TYPES.includes(action.type)) {
      setPath([]);
      setRushSpent(0);
      setSelectedCup(null);
      setSelectedSetupCellId(null);
    }

    return result;
  }

  function updateAsyncSessionHead(headIndex, headHash) {
    const session = remoteSessionRef.current;
    if (!session) return;

    const nextSession = {
      ...session,
      protocol: REMOTE_PROTOCOLS.ASYNC,
      headIndex,
      headHash,
    };
    remoteSessionRef.current = nextSession;
    saveRemoteSession(nextSession);
    setRemoteSession(nextSession);
  }

  function setAsyncCanonicalState({ headIndex, headHash, state: canonicalState }) {
    asyncCanonicalRef.current = {
      headIndex,
      headHash,
      state: canonicalState,
    };
    stateRef.current = canonicalState;
    saveAsyncRoomState({
      roomId: remoteSessionRef.current?.roomId,
      headIndex,
      headHash,
      state: canonicalState,
    });
    updateAsyncSessionHead(headIndex, headHash);
  }

  function setAsyncFailedCommitState(failedCommit) {
    asyncFailedCommitRef.current = failedCommit;
    setAsyncFailedCommit(failedCommit);
  }

  function clearAsyncFailedCommitState() {
    setAsyncFailedCommitState(null);
  }

  function restoreAsyncFailedCommitFromDraft(draft, errorMessage = '') {
    const failedCommit = createAsyncCommitRecoveryFromDraft(draft, errorMessage);
    setAsyncFailedCommitState(failedCommit);
    return failedCommit;
  }

  function setAsyncDraftState(baseHead, actions, draftState) {
    const draftUndoStack = undoStackRef.current.slice();
    const nextDraft =
      actions.length > 0
        ? {
            baseHeadIndex: baseHead.headIndex,
            baseHeadHash: baseHead.headHash,
            actions,
            state: draftState,
            undoStack: draftUndoStack,
          }
        : null;

    asyncDraftRef.current = nextDraft;
    setAsyncDraftActionCount(actions.length);

    if (nextDraft) {
      saveAsyncDraft({
        roomId: remoteSessionRef.current?.roomId,
        baseHeadIndex: nextDraft.baseHeadIndex,
        baseHeadHash: nextDraft.baseHeadHash,
        actions,
        state: draftState,
        undoStack: draftUndoStack,
      });
    } else if (remoteSessionRef.current?.roomId) {
      clearAsyncFailedCommitState();
      clearAsyncDraft(remoteSessionRef.current.roomId);
    }
  }

  function applyAsyncDraftHydration(hydration) {
    if (!hydration) return false;

    if (hydration.canonical) {
      asyncCanonicalRef.current = hydration.canonical;
    }

    asyncDraftRef.current = hydration.draft;
    restoreAsyncFailedCommitFromDraft(
      hydration.draft,
      asyncFailedCommitRef.current?.error ?? '',
    );
    setAsyncDraftActionCount(hydration.draftActionCount);
    stateRef.current = hydration.state;
    undoStackRef.current = hydration.undoStack;
    setState(hydration.state);
    setUndoStack(hydration.undoStack);
    return true;
  }

  function clearAsyncDraftState() {
    asyncDraftRef.current = null;
    clearAsyncFailedCommitState();
    setAsyncDraftActionCount(0);
    if (remoteSessionRef.current?.roomId) {
      clearAsyncDraft(remoteSessionRef.current.roomId);
    }
  }

  function markAsyncRoomClosed(session) {
    const closedRoom = { roomId: session.roomId };

    asyncClosedRoomRef.current = closedRoom;
    setAsyncClosedRoom(closedRoom);
    asyncCanonicalRef.current = null;
    asyncDraftRef.current = null;
    clearAsyncFailedCommitState();
    pendingActionIdRef.current = '';
    clearGame();
    undoStackRef.current = [];
    stateRef.current = null;
    setAsyncDraftActionCount(0);
    setUndoStack([]);
    setState(null);
    setExportStatus('');
    setPassTo('');
    resetActionUi();
    setError(ASYNC_ROOM_CLOSED_MESSAGE);
    setRemoteStatus((current) => ({
      ...current,
      connection: ASYNC_ROOM_CLOSED_CONNECTION,
      selfId: 'async',
      error: ASYNC_ROOM_CLOSED_MESSAGE,
      pendingActionId: '',
    }));
  }

  function applyNotificationRosterHead(head) {
    notificationRosterRef.current = head.roster;
    notificationRosterHashRef.current = head.rosterHash;
    setNotificationRoster(head.roster);
    setNotificationRosterHash(head.rosterHash);
  }

  async function syncNotificationRoster({
    silent = false,
    isDisposed = () => false,
  } = {}) {
    const session = remoteSessionRef.current;
    if (!session || session.protocol !== REMOTE_PROTOCOLS.ASYNC) return null;

    if (!silent) {
      setNotificationStatus('Syncing WhatsApp reminders.');
      setNotificationError('');
    }

    try {
      const head = await loadNotificationRoster(session);
      if (isDisposed()) return null;

      applyNotificationRosterHead(head);
      setNotificationError('');
      if (!silent) {
        setNotificationStatus('WhatsApp reminders synced.');
      }
      return head;
    } catch (syncError) {
      if (isDisposed()) return null;

      setNotificationError(syncError?.message ?? 'Could not sync WhatsApp reminders.');
      if (!silent) {
        setNotificationStatus('');
      }
      return null;
    }
  }

  async function updateLocalNotificationRoster(mutator) {
    const session = remoteSessionRef.current;
    if (!session || session.protocol !== REMOTE_PROTOCOLS.ASYNC) {
      throw new Error('WhatsApp reminders need an async room.');
    }

    const baseRoster =
      notificationRosterRef.current ?? createEmptyNotificationRoster(session.roomId);
    const baseHash = notificationRosterHashRef.current ?? '';
    let nextRoster = mutator(baseRoster);
    let result = await saveNotificationRoster(session, nextRoster, baseHash);

    if (result.accepted === false && result.error === 'STALE_NOTIFICATION_ROSTER') {
      nextRoster = mutator(result.roster);
      result = await saveNotificationRoster(session, nextRoster, result.rosterHash);
    }

    if (result.accepted !== true) {
      throw new Error('Could not save WhatsApp reminders.');
    }

    applyNotificationRosterHead(result);
    return result;
  }

  async function saveWhatsAppReminderContact() {
    if (!localPlayerId) {
      setNotificationError('This browser is not assigned to a player seat.');
      return;
    }

    const normalized = normalizeWhatsAppContact({
      country: notificationCountry,
      nationalNumber: notificationNumber,
    });

    if (normalized.error) {
      setNotificationError(normalized.error);
      setNotificationStatus('');
      return;
    }

    setIsNotificationSaving(true);
    setNotificationError('');
    setNotificationStatus('Saving WhatsApp reminder.');

    try {
      await updateLocalNotificationRoster((roster) =>
        upsertNotificationContact(roster, localPlayerId, normalized.contact),
      );
      setNotificationStatus('WhatsApp reminder saved.');
    } catch (saveError) {
      setNotificationStatus('');
      setNotificationError(saveError?.message ?? 'Could not save WhatsApp reminder.');
    } finally {
      setIsNotificationSaving(false);
    }
  }

  async function clearWhatsAppReminderContact() {
    if (!localPlayerId) {
      setNotificationError('This browser is not assigned to a player seat.');
      return;
    }

    setIsNotificationSaving(true);
    setNotificationError('');
    setNotificationStatus('Clearing WhatsApp reminder.');

    try {
      await updateLocalNotificationRoster((roster) =>
        clearNotificationContact(roster, localPlayerId),
      );
      setNotificationStatus('WhatsApp reminder cleared.');
      setNotificationNumber('');
    } catch (clearError) {
      setNotificationStatus('');
      setNotificationError(clearError?.message ?? 'Could not clear WhatsApp reminder.');
    } finally {
      setIsNotificationSaving(false);
    }
  }

  async function savePendingOnlineProfile() {
    const session = remoteSessionRef.current;
    const profile = pendingPlayerProfile;

    if (!session || session.protocol !== REMOTE_PROTOCOLS.ASYNC || !profile) return;

    const name = normalizePlayerName(profile.name);
    const normalized = normalizeWhatsAppContact({
      country: profile.country,
      nationalNumber: profile.nationalNumber,
    });

    if (!name || normalized.error) {
      setProfileStatus('');
      setProfileError(normalized.error || 'Enter your name.');
      return;
    }

    profileSaveInFlightRef.current = true;
    setIsProfileSaving(true);
    setProfileStatus('Saving your player profile.');
    setProfileError('');

    try {
      const currentState = stateRef.current;
      const player = currentState ? getPlayer(currentState, session.localPlayerId) : null;

      if (!player) {
        throw new Error('This browser is not assigned to a player seat.');
      }

      if (player.name !== name) {
        const canonical = asyncCanonicalRef.current;

        if (!canonical?.headHash) {
          throw new Error('Still syncing the room.');
        }

        const action = {
          type: 'UPDATE_PLAYER_PROFILE',
          playerId: session.localPlayerId,
          name,
        };
        const result = applyAcceptedGameAction(action, { recordUndo: false });

        if (result.error) {
          throw new Error(result.error);
        }

        const committed = await commitAsyncActions(
          [action],
          result.state,
          {
            headIndex: canonical.headIndex,
            headHash: canonical.headHash,
          },
          {
            pendingStatus: 'Saving player profile.',
            successStatus: '',
          },
        );

        if (committed.error) {
          throw new Error(committed.error);
        }
      }

      await updateLocalNotificationRoster((roster) =>
        upsertNotificationContact(roster, session.localPlayerId, normalized.contact),
      );

      clearPendingPlayerProfile(session.roomId, session.localPlayerId);
      setPendingPlayerProfile(null);
      setProfileError('');
      setProfileStatus('Player profile saved.');
    } catch (saveError) {
      setProfileStatus('');
      setProfileError(saveError?.message ?? 'Could not save your player profile.');
    } finally {
      profileSaveInFlightRef.current = false;
      setIsProfileSaving(false);
    }
  }

  function retryPendingOnlineProfile() {
    profileSaveAttemptKeyRef.current = '';
    void savePendingOnlineProfile();
  }

  async function triggerAcceptedTurnReminder({ actions, resultState, commitResponse }) {
    const session = remoteSessionRef.current;
    if (!session || session.protocol !== REMOTE_PROTOCOLS.ASYNC) return;

    let roster = notificationRosterRef.current;
    if (!roster) {
      const synced = await syncNotificationRoster({ silent: true });
      roster = synced?.roster ?? null;
    }

    const reminder = createAcceptedTurnReminder({
      session,
      actions,
      resultState,
      commitResponse,
      roster,
    });

    if (!reminder) return;

    if (openWhatsAppDraft(reminder.whatsappUrl)) {
      setPendingTurnReminder(null);
      return;
    }

    setPendingTurnReminder(reminder);
    setExportStatus(`WhatsApp reminder ready for ${reminder.playerName}.`);
  }

  async function copyPendingTurnReminder() {
    if (!pendingTurnReminder) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pendingTurnReminder.message);
      } else {
        copyTextFallback(pendingTurnReminder.message);
      }
      setExportStatus('WhatsApp reminder copied.');
    } catch {
      try {
        copyTextFallback(pendingTurnReminder.message);
        setExportStatus('WhatsApp reminder copied.');
      } catch {
        setExportStatus('Could not copy the WhatsApp reminder.');
      }
    }
  }

  async function sharePendingTurnReminder() {
    if (!pendingTurnReminder) return;

    if (!navigator.share) {
      await copyPendingTurnReminder();
      return;
    }

    try {
      await navigator.share({ text: pendingTurnReminder.message });
      setExportStatus('WhatsApp reminder shared.');
    } catch {
      // Share cancellation should leave the fallback button available.
    }
  }

  function openPendingTurnReminder() {
    if (!pendingTurnReminder) return;
    if (openWhatsAppDraft(pendingTurnReminder.whatsappUrl)) {
      setPendingTurnReminder(null);
    }
  }

  async function applyAsyncCommits(baseState, baseHead, commits) {
    const session = remoteSessionRef.current;
    if (!session) {
      throw new Error('No async room session is loaded.');
    }

    let nextState = baseState;
    let headIndex = baseHead.headIndex;
    let headHash = baseHead.headHash;

    for (const commit of commits) {
      if (commit.commitIndex !== headIndex + 1 || commit.prevHash !== headHash) {
        throw new Error('The room commit chain is out of order.');
      }

      const payload = await decryptCommit(session, commit);
      for (const action of payload.actions) {
        if (!isValidAsyncAction(action)) {
          throw new Error('The room commit contains an invalid action.');
        }

        const result = applyAction(nextState, action);
        if (result.error) {
          throw new Error(result.error);
        }
        nextState = result.state;
      }

      const resultStateHash = await hashState(nextState);
      if (resultStateHash !== payload.resultStateHash) {
        throw new Error('The room commit result hash did not validate.');
      }

      headIndex = commit.commitIndex;
      headHash = commit.commitHash;
    }

    return {
      headIndex,
      headHash,
      state: nextState,
    };
  }

  async function syncAsyncRoom({
    restoreDraft = false,
    silent = false,
    discardDraft = false,
    isDisposed = () => false,
  } = {}) {
    const session = remoteSessionRef.current;
    if (!session || session.protocol !== REMOTE_PROTOCOLS.ASYNC) return;
    if (asyncClosedRoomRef.current?.roomId === session.roomId) {
      setRemoteStatus((current) => ({
        ...current,
        connection: ASYNC_ROOM_CLOSED_CONNECTION,
        selfId: 'async',
        error: ASYNC_ROOM_CLOSED_MESSAGE,
        pendingActionId: '',
      }));
      return;
    }
    if (asyncSyncInFlightRef.current) return;

    asyncSyncInFlightRef.current = true;
    if (!silent) {
      setRemoteStatus((current) => ({ ...current, connection: 'syncing', error: '' }));
    }

    try {
      const cached = asyncCanonicalRef.current ?? loadAsyncRoomState(session.roomId);
      const knownHead = cached
        ? { headIndex: cached.headIndex, headHash: cached.headHash }
        : session.headHash
          ? { headIndex: session.headIndex, headHash: session.headHash }
          : {};
      const head = await fetchAsyncRoomHead(session, knownHead);
      if (isDisposed()) return;

      let canonical = cached;

      if (head.latestSnapshot) {
        const snapshotHeadHash =
          head.latestSnapshotHeadHash ||
          (head.latestSnapshotIndex === head.headIndex ? head.headHash : '');
        const snapshot = await decryptSnapshot(
          session,
          head.latestSnapshot,
          head.latestSnapshotIndex,
          snapshotHeadHash,
        );
        canonical = {
          headIndex: snapshot.headIndex,
          headHash: snapshot.headHash,
          state: snapshot.state,
        };
      }

      if (!canonical?.state) {
        throw new Error('The room did not include a state snapshot.');
      }

      if (head.commits.length > 0) {
        canonical = await applyAsyncCommits(canonical.state, canonical, head.commits);
      }

      if (canonical.headIndex !== head.headIndex || canonical.headHash !== head.headHash) {
        throw new Error('The room head did not match the decrypted state.');
      }

      setAsyncCanonicalState(canonical);

      const savedDraft = restoreDraft ? loadAsyncDraft(session.roomId) : null;
      const currentDraft = discardDraft ? null : asyncDraftRef.current ?? savedDraft;
      const draftHydration = createAsyncDraftHydrationUnit({
        draft: currentDraft,
        canonical,
        fallbackUndoStack: undoStackRef.current,
      });

      if (draftHydration) {
        applyAsyncDraftHydration(draftHydration);
      } else {
        if (currentDraft?.actions?.length) {
          setError('The room advanced before this draft was committed. Replay the turn from the latest state.');
        }
        clearAsyncDraftState();
        undoStackRef.current = [];
        setUndoStack([]);
        stateRef.current = canonical.state;
        setState(canonical.state);
      }

      setRemoteStatus((current) => ({
        ...current,
        connection: 'connected',
        selfId: 'async',
        error: '',
        pendingActionId: pendingActionIdRef.current,
      }));
    } catch (syncError) {
      const canonical = asyncCanonicalRef.current;
      const cached = canonical ?? loadAsyncRoomState(session.roomId);
      const savedDraft = restoreDraft ? loadAsyncDraft(session.roomId) : null;
      const currentDraft = asyncDraftRef.current ?? savedDraft;

      if (
        shouldTreatAsyncRoomNotFoundAsClosed({
          syncError,
          session,
          canonical,
          cached,
          activeState: stateRef.current,
          draft: currentDraft,
        })
      ) {
        markAsyncRoomClosed(session);
        return;
      }

      const offlineDraftHydration = discardDraft
        ? null
        : createAsyncDraftHydrationUnit({
            draft: currentDraft,
            canonical: cached,
            fallbackUndoStack: undoStackRef.current,
          });
      if (offlineDraftHydration) {
        applyAsyncDraftHydration(offlineDraftHydration);
        setRemoteStatus((current) => ({
          ...current,
          connection: ASYNC_OFFLINE_DRAFT_CONNECTION,
          selfId: 'async',
          error: syncError?.message ?? 'Could not sync the async room.',
          pendingActionId: pendingActionIdRef.current,
        }));
        if (!silent) {
          setError(syncError?.message ?? 'Could not sync the async room.');
        }
        return;
      }

      if (
        syncError?.code === 'ROOM_NOT_FOUND' &&
        session.mode === REMOTE_MODES.PEER &&
        !asyncCanonicalRef.current &&
        !stateRef.current
      ) {
        const liveSession = {
          ...session,
          protocol: REMOTE_PROTOCOLS.LIVE,
        };
        remoteSessionRef.current = liveSession;
        saveRemoteSession(liveSession);
        setRemoteSession(liveSession);
        setRemoteStatus((current) => ({ ...current, connection: 'connecting' }));
        return;
      }

      setRemoteStatus((current) => ({
        ...current,
        connection: 'error',
        error: syncError?.message ?? 'Could not sync the async room.',
      }));
      if (!silent) {
        setError(syncError?.message ?? 'Could not sync the async room.');
      }
    } finally {
      asyncSyncInFlightRef.current = false;
    }
  }

  async function forceAsyncCanonicalReplay(message = ASYNC_DRAFT_MISMATCH_MESSAGE) {
    const canonical = asyncCanonicalRef.current;

    clearAsyncDraftState();
    undoStackRef.current = [];
    setUndoStack([]);
    setExportStatus('');
    resetActionUi();

    if (canonical?.state) {
      stateRef.current = canonical.state;
      setState(canonical.state);
    }

    await syncAsyncRoom({ discardDraft: true, silent: true });

    setError(message);
    setRemoteStatus((current) => ({
      ...current,
      error: message,
      pendingActionId: '',
    }));
  }

  async function assertAsyncCommitIntegrity(actions, resultState, baseHead) {
    const canonical = asyncCanonicalRef.current;

    if (
      !canonical?.state ||
      canonical.headIndex !== baseHead?.headIndex ||
      canonical.headHash !== baseHead?.headHash
    ) {
      throw new Error(ASYNC_DRAFT_MISMATCH_MESSAGE);
    }

    await assertAsyncDraftReplayMatchesResult(canonical.state, actions, resultState);
  }

  async function commitAsyncActions(actions, resultState, baseHead, options = {}) {
    const session = remoteSessionRef.current;
    if (!session) {
      return { error: 'No async room session is loaded.' };
    }

    try {
      await assertAsyncCommitIntegrity(actions, resultState, baseHead);
    } catch {
      await forceAsyncCanonicalReplay();
      return { error: ASYNC_DRAFT_MISMATCH_MESSAGE };
    }

    const isTurnCommit = actions.some((action) => action.type === 'END_TURN');
    const isProfileCommit = actions.every(
      (action) => action.type === 'UPDATE_PLAYER_PROFILE',
    );
    const pendingId = `async-${Date.now()}`;
    setPendingActionId(pendingId);
    setExportStatus(
      options.pendingStatus ??
        (isTurnCommit
          ? 'Committing turn.'
          : isProfileCommit
            ? 'Saving player profile.'
            : 'Committing setup.'),
    );

    try {
      const response = await submitTurnCommit(session, baseHead, actions, resultState);

      if (response?.accepted === false && response.error === 'STALE_HEAD') {
        clearPendingActionId(pendingId);
        clearAsyncDraftState();
        undoStackRef.current = [];
        setUndoStack([]);
        await syncAsyncRoom({ discardDraft: true });
        setExportStatus('');
        setError('Another device committed first. Synced the latest room state.');
        return { error: 'STALE_HEAD' };
      }

      setAsyncCanonicalState({
        headIndex: response.headIndex,
        headHash: response.headHash,
        state: resultState,
      });
      clearAsyncDraftState();
      undoStackRef.current = [];
      setUndoStack([]);
      clearPendingActionId(pendingId);
      setExportStatus(
        options.successStatus ??
          (isTurnCommit ? '' : isProfileCommit ? '' : 'Setup synced.'),
      );
      clearAsyncFailedCommitState();
      setRemoteStatus((current) => ({
        ...current,
        connection: 'connected',
        error: '',
      }));
      void triggerAcceptedTurnReminder({
        actions,
        resultState,
        commitResponse: response,
      });
      return { state: resultState };
    } catch (commitError) {
      const errorMessage = commitError?.message ?? 'Could not commit the async turn.';
      const failedCommit = createAsyncCommitRecovery({
        baseHead,
        actions,
        resultState,
        error: errorMessage,
      });

      setAsyncDraftState(baseHead, actions, resultState);
      setAsyncFailedCommitState(failedCommit);
      clearPendingActionId(pendingId);
      setExportStatus('');
      setPassTo('');
      setError(errorMessage);
      return { error: errorMessage };
    }
  }

  function pendingProfileMessage() {
    return profileError || 'Save your name and WhatsApp number before taking game actions.';
  }

  function dispatchAsyncAction(action) {
    if (asyncFailedCommitRef.current) {
      setError(ASYNC_COMMIT_RECOVERY_MESSAGE);
      return { error: ASYNC_COMMIT_RECOVERY_MESSAGE };
    }

    if (pendingPlayerProfile && action.type !== 'UPDATE_PLAYER_PROFILE') {
      const message = pendingProfileMessage();
      setError(message);
      return { error: message };
    }

    const localActionError = getLocalActionError(
      stateRef.current,
      remoteSessionRef.current?.localPlayerId,
      action,
    );

    if (localActionError) {
      setError(localActionError);
      return { error: localActionError };
    }

    if (pendingActionIdRef.current) {
      setError('Waiting for the room to accept the previous commit.');
      return { error: 'Waiting for the room to accept the previous commit.' };
    }

    const canonical = asyncCanonicalRef.current;
    if (!canonical?.headHash) {
      setError('Still syncing the room.');
      return { error: 'Still syncing the room.' };
    }

    const currentDraft = asyncDraftRef.current;
    const baseHead = currentDraft
      ? {
          headIndex: currentDraft.baseHeadIndex,
          headHash: currentDraft.baseHeadHash,
        }
      : {
          headIndex: canonical.headIndex,
          headHash: canonical.headHash,
        };
    const draftActions = currentDraft?.actions ?? [];
    const result = applyAcceptedGameAction(action);
    if (result.error) return result;

    const nextActions = [...draftActions, action];
    const shouldCommitNow =
      action.type === 'UPDATE_PLAYER_PROFILE' ||
      action.type === 'PLACE_STARTING_MEEPLE' ||
      action.type === 'END_TURN';

    if (shouldCommitNow) {
      commitAsyncActions(nextActions, result.state, baseHead);
      return { pending: true, state: result.state };
    }

    setAsyncDraftState(baseHead, nextActions, result.state);
    setExportStatus('');
    return result;
  }

  function dispatch(action) {
    if (isAsyncRemoteGame) {
      return dispatchAsyncAction(action);
    }

    if (isLiveRemotePeer) {
      const client = remoteClientRef.current;

      if (!client) {
        setError('Still connecting to the room.');
        return { error: 'Still connecting to the room.' };
      }

      if (pendingActionIdRef.current) {
        setError('Waiting for the host to confirm the previous action.');
        return { error: 'Waiting for the host to confirm the previous action.' };
      }

      const request = createActionRequest(action, client.selfId || remoteStatus.selfId || 'peer');
      setPendingActionId(request.clientActionId);
      setError('');
      setExportStatus('Waiting for the host to confirm that action.');

      client.send(request).catch(() => {
        clearPendingActionId(request.clientActionId);
        setExportStatus('');
        setError('Could not send that action to the host.');
      });

      return { pending: true };
    }

    const result = applyAcceptedGameAction(action);

    if (!result.error && isLiveRemoteHost) {
      remoteClientRef.current
        ?.send(createAcceptedAction(action, result.state.log.length))
        .catch(() => {});
    }

    return result;
  }

  function sendHostSnapshot(peerId) {
    const currentState = stateRef.current;
    const client = remoteClientRef.current;

    if (!currentState || !client) return;

    client.send(createStateSnapshot(currentState, undoStackRef.current), peerId).catch(() => {});
  }

  function requestRemoteResync() {
    remoteClientRef.current
      ?.send({
        type: REMOTE_MESSAGE_TYPES.RESYNC_REQUEST,
        knownActionIndex: stateRef.current?.log?.length ?? 0,
      })
      .catch(() => {});
  }

  function replaceFromRemoteSnapshot(message) {
    if (!message?.state) {
      setError('The host sent an unreadable room snapshot.');
      return;
    }

    stateRef.current = message.state;
    undoStackRef.current = Array.isArray(message.undoStack) ? message.undoStack : [];
    setState(message.state);
    setUndoStack(undoStackRef.current);
    setError('');
    setExportStatus('Synced with host.');
    clearPendingActionId();
    resetActionUi();
  }

  function handleRemoteMessage(message, peerId) {
    if (!message?.type) return;

    if (isLiveRemoteHost) {
      if (
        message.type === REMOTE_MESSAGE_TYPES.HELLO ||
        message.type === REMOTE_MESSAGE_TYPES.RESYNC_REQUEST
      ) {
        sendHostSnapshot(peerId);
        return;
      }

      if (message.type === REMOTE_MESSAGE_TYPES.ACTION_REQUEST) {
        const result = applyAcceptedGameAction(message.action, { showErrors: false });

        if (result.error) {
          remoteClientRef.current
            ?.send(
              {
                type: REMOTE_MESSAGE_TYPES.ACTION_REJECTED,
                clientActionId: message.clientActionId,
                error: result.error,
              },
              peerId,
            )
            .catch(() => {});
          return;
        }

        remoteClientRef.current
          ?.send(
            createAcceptedAction(
              message.action,
              result.state.log.length,
              message.clientActionId,
            ),
          )
          .catch(() => {});
        return;
      }
    }

    if (isLiveRemotePeer) {
      if (message.type === REMOTE_MESSAGE_TYPES.STATE_SNAPSHOT) {
        replaceFromRemoteSnapshot(message);
        return;
      }

      if (message.type === REMOTE_MESSAGE_TYPES.ACTION_ACCEPTED) {
        const currentActionIndex = stateRef.current?.log?.length ?? 0;

        if (!stateRef.current || message.actionIndex > currentActionIndex + 1) {
          requestRemoteResync();
          return;
        }

        if (message.actionIndex <= currentActionIndex) {
          if (message.clientActionId) {
            clearPendingActionId(message.clientActionId);
          }
          return;
        }

        const result = applyAcceptedGameAction(message.action);
        if (result.error) {
          requestRemoteResync();
          return;
        }

        if (message.clientActionId) {
          clearPendingActionId(message.clientActionId);
        }
        setExportStatus('');
        return;
      }

      if (message.type === REMOTE_MESSAGE_TYPES.ACTION_REJECTED) {
        if (message.clientActionId) {
          clearPendingActionId(message.clientActionId);
        }
        setExportStatus('');
        setError(message.error ?? 'The host rejected that action.');
        return;
      }

      if (message.type === REMOTE_MESSAGE_TYPES.ROOM_CLOSED) {
        clearGame();
        clearRemoteSession();
        navigate('/');
      }
    }
  }

  function resetActionUi() {
    setPath([]);
    setRushSpent(0);
    setSelectedCup(null);
    setSelectedSetupCellId(null);
    setPassTo('');
    setIsUpgradeMenuOpen(false);
  }

  function setPendingActionId(clientActionId) {
    pendingActionIdRef.current = clientActionId;
    setRemoteStatus((current) => ({
      ...current,
      pendingActionId: clientActionId,
    }));
  }

  function clearPendingActionId(clientActionId = '') {
    if (!clientActionId || pendingActionIdRef.current === clientActionId) {
      pendingActionIdRef.current = '';
    }

    setRemoteStatus((current) => {
      if (clientActionId && current.pendingActionId !== clientActionId) {
        return current;
      }

      return {
        ...current,
        pendingActionId: '',
      };
    });
  }

  function selectCup(cupIdx) {
    if (asyncFailedCommitRef.current) {
      setError(ASYNC_COMMIT_RECOVERY_MESSAGE);
      return;
    }

    if (isAsyncRemoteGame && !canControlActivePlayer) {
      setError(remoteTurnLockMessage);
      return;
    }

    setSelectedCup(cupIdx);
    setError('');
  }

  function selectMeeple(meepleId) {
    if (asyncFailedCommitRef.current) {
      setError(ASYNC_COMMIT_RECOVERY_MESSAGE);
      return;
    }

    if (isAsyncRemoteGame && !canControlActivePlayer) {
      setError(remoteTurnLockMessage);
      return;
    }

    setSelectedMeepleId(meepleId);
    setPath([]);
    setError('');
  }

  function undoLastAction() {
    if (isLiveRemotePeer) {
      setError('Only the host can undo in an online room.');
      return;
    }

    if (isAsyncRemoteGame && asyncDraftActionCount === 0) {
      setError('Online undo is only available for uncommitted draft actions.');
      return;
    }

    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const nextUndoStack = undoStack.slice(0, -1);
    undoStackRef.current = nextUndoStack;
    stateRef.current = previousState;
    setUndoStack(nextUndoStack);
    setState(previousState);
    setError('');
    setExportStatus('');
    resetActionUi();

    if (isAsyncRemoteGame) {
      const draft = asyncDraftRef.current;
      if (draft) {
        const nextActions = draft.actions.slice(0, -1);
        setAsyncDraftState(
          {
            headIndex: draft.baseHeadIndex,
            headHash: draft.baseHeadHash,
          },
          nextActions,
          previousState,
        );
      }
      return;
    }

    if (isLiveRemoteHost) {
      remoteClientRef.current
        ?.send(createStateSnapshot(previousState, nextUndoStack))
        .catch(() => {});
    }
  }

  async function retryFailedAsyncCommit() {
    const failedCommit = asyncFailedCommitRef.current;
    if (!failedCommit || pendingActionIdRef.current) return;

    setError('');
    setExportStatus('Retrying commit.');
    const result = await commitAsyncActions(
      failedCommit.actions,
      failedCommit.resultState,
      failedCommit.baseHead,
    );

    if (!result?.error) {
      resetActionUi();
    }
  }

  async function replayFailedAsyncCommitFromLatest() {
    const failedCommit = asyncFailedCommitRef.current;
    if (!failedCommit || pendingActionIdRef.current || asyncSyncInFlightRef.current) return;

    setError('');
    setExportStatus('Syncing latest room state.');
    await syncAsyncRoom({ discardDraft: true });
    setExportStatus('');

    if (asyncFailedCommitRef.current === failedCommit) {
      setError('Could not sync the latest room state.');
      return;
    }

    setError(ASYNC_REPLAY_FROM_LATEST_MESSAGE);
  }

  function discardFailedAsyncDraft() {
    if (!asyncFailedCommitRef.current || pendingActionIdRef.current) return;

    const session = remoteSessionRef.current;
    const canonical = asyncCanonicalRef.current ?? loadAsyncRoomState(session?.roomId);

    clearAsyncDraftState();
    undoStackRef.current = [];
    setUndoStack([]);
    resetActionUi();
    setPassTo('');
    setError('');
    setExportStatus(ASYNC_DISCARD_DRAFT_MESSAGE);

    if (canonical?.state) {
      setAsyncCanonicalState(canonical);
      stateRef.current = canonical.state;
      setState(canonical.state);
    }

    syncAsyncRoom({ discardDraft: true, silent: true });
  }

  function getExportText() {
    return formatGameExport(state, undoStack);
  }

  async function copyExport() {
    const exportText = getExportText();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        copyTextFallback(exportText);
      }
      setExportStatus('Game log copied.');
    } catch {
      try {
        copyTextFallback(exportText);
        setExportStatus('Game log copied.');
      } catch {
        setExportStatus('Could not copy. Download the log instead.');
      }
    }
  }

  function copyTextFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();

    const copied = document.execCommand('copy');
    textarea.remove();

    if (!copied) {
      throw new Error('Copy command failed.');
    }
  }

  async function downloadExport() {
    if (isExporting) return;

    setIsExporting(true);
    const exportedAt = new Date();
    const exportText = getExportText();
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

  async function copyInviteLink(
    invitePlayerId = remoteSession?.invitePlayerId,
    copiedMessage = '',
  ) {
    if (!remoteSession) return;

    const inviteSession = invitePlayerId
      ? { ...remoteSession, invitePlayerId }
      : remoteSession;
    const inviteLink = createInviteLink(inviteSession);
    const invitePlayer = stateRef.current
      ? getPlayer(stateRef.current, invitePlayerId)
      : null;
    const copiedStatus = copiedMessage || (invitePlayer
      ? `${invitePlayer.name} invite link copied.`
      : 'Invite link copied.');

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        copyTextFallback(inviteLink);
      }
      setExportStatus(copiedStatus);
    } catch {
      try {
        copyTextFallback(inviteLink);
        setExportStatus(copiedStatus);
      } catch {
        setExportStatus('Could not copy the private invite link.');
      }
    }
  }

  async function copyDeviceLink(playerId = selectedDeviceLinkPlayerId) {
    const targetPlayerId = playerId || localPlayerId;

    if (!targetPlayerId) {
      await copyInviteLink();
      return;
    }

    const targetPlayer = stateRef.current ? getPlayer(stateRef.current, targetPlayerId) : null;
    await copyInviteLink(
      targetPlayerId,
      `${targetPlayer?.name ?? formatPlayerSeat(targetPlayerId)} device link copied.`,
    );
  }

  function handleCellClick(cellId) {
    if (isOnlineProfilePending) {
      setError(pendingProfileMessage());
      return;
    }

    if (asyncFailedCommitRef.current) {
      setError(ASYNC_COMMIT_RECOVERY_MESSAGE);
      return;
    }

    if (setupPlacement) {
      if (!canControlSetupPlacement) {
        setError(remoteTurnLockMessage);
        return;
      }

      const cell = getCell(cellId);

      if (!cell || !getLegalSetupCells(state).includes(cell.id)) {
        setError('Choose an open board space.');
        return;
      }

      if (setupPlacement.autoPlaceInFirstCup) {
        placeStartingIngredient(0, cell.id);
        return;
      }

      setSelectedSetupCellId(cell.id);
      setSelectedCup(null);
      setError('');
      return;
    }

    if (state.phase !== 'move' || !selectedMeepleId) return;
    if (!canControlActivePlayer) {
      setError(remoteTurnLockMessage);
      return;
    }

    let moveMeepleId = selectedMeepleId;

    if (path.length === 0) {
      const inferredMeepleId = getMeepleForFirstMoveStep(
        state,
        selectedMeepleId,
        cellId,
      );
      moveMeepleId = inferredMeepleId;
      if (inferredMeepleId !== selectedMeepleId) {
        setSelectedMeepleId(inferredMeepleId);
      }
    }

    const preview = getMovePathPreview(state, moveMeepleId, path, rushSpent);
    const nextCell = preview.nextCells.find(
      (candidate) => Number(candidate.cellId) === Number(cellId),
    );

    if (!nextCell) {
      setError(
        preview.remainingSteps === 0
          ? 'Confirm this move or clear the path before choosing another cell.'
          : 'Choose a highlighted adjacent cell for the next movement step.',
      );
      return;
    }

    setError('');
    setPath((current) => [...current, cellId]);
  }

  function placeStartingIngredient(cupIdx, cellId = selectedSetupCellId) {
    if (!setupPlacement) return;

    if (!canControlSetupPlacement) {
      setError(remoteTurnLockMessage);
      return;
    }

    if (cellId === null) {
      setError('Choose a board space before choosing a cup.');
      return;
    }

    dispatch({
      type: 'PLACE_STARTING_MEEPLE',
      playerId: setupPlacement.playerId,
      meepleId: setupPlacement.meepleId,
      cellId,
      cupIdx,
    });
  }

  function confirmMove() {
    if (!canControlActivePlayer) {
      setError(remoteTurnLockMessage);
      return;
    }

    dispatch({
      type: 'MOVE',
      playerId: activePlayer.id,
      meepleId: selectedMeepleId,
      path,
      rushSpent,
    });
  }

  function updateRushSpent(nextRushSpent) {
    if (!canControlActivePlayer) {
      setError(remoteTurnLockMessage);
      return;
    }

    const clamped = Math.min(
      activePlayer.rushTokens,
      Math.max(0, Number(nextRushSpent) || 0),
    );
    setRushSpent(clamped);
  }

  function pourIngredient(ingredient) {
    if (selectedCup === null) {
      setError('Choose a cup before pouring.');
      return;
    }

    dispatch({
      type: 'POUR',
      playerId: activePlayer.id,
      ingredientFromHand: ingredient,
      cupIdx: selectedCup,
    });
  }

  function discardIngredient(ingredient) {
    dispatch({
      type: 'DISCARD_HAND',
      playerId: activePlayer.id,
      ingredientFromHand: ingredient,
    });
  }

  function emptyCup(cupIdx) {
    dispatch({
      type: 'DUMP_CUP',
      playerId: activePlayer.id,
      cupIdx,
    });
  }

  function fulfillOrder(cupIdx, orderRef) {
    dispatch({
      type: 'FULFILL_ORDER',
      playerId: activePlayer.id,
      cupIdx,
      orderRef,
    });
  }

  function activateUpgrade(tileId) {
    const result = dispatch({
      type: 'ACTIVATE_UPGRADE',
      playerId: activePlayer.id,
      tileId,
    });

    if (!result?.error) {
      setIsUpgradeMenuOpen(false);
    }
  }

  function toggleMinimizedOrder(orderId) {
    setMinimizedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((candidate) => candidate !== orderId)
        : [...current, orderId],
    );
  }

  function openOrdersSheet() {
    setIsOrdersSheetOpen(true);
  }

  async function newGame() {
    if (isAsyncRemoteGame) {
      if (isRemoteHost) {
        try {
          await closeAsyncRoom(remoteSessionRef.current);
        } catch {
          // The local reset should still happen if the close request fails.
        }
      }
      clearGame();
      clearRemoteSession();
      navigate('/');
      return;
    }

    if (isLiveRemotePeer) {
      leaveRemoteGame();
      return;
    }

    if (isLiveRemoteHost) {
      try {
        await remoteClientRef.current?.send({ type: REMOTE_MESSAGE_TYPES.ROOM_CLOSED });
        remoteClientRef.current?.closeRoom?.();
      } catch {
        // Leaving the room is still the correct local action if the final send fails.
      }
    }

    clearGame();
    clearRemoteSession();
    navigate('/');
  }

  function leaveRemoteGame() {
    remoteClientRef.current?.leave();
    remoteClientRef.current = null;
    clearGame();
    clearRemoteSession();
    setRemoteSession(null);
    navigate('/');
  }

  const visibleLastMessage =
    state.lastMessage?.startsWith('Pass to ') && !passTo ? '' : state.lastMessage;
  const canActivateUpgrade = canPlayerActivateUpgrade(activePlayer);
  const hasInactiveUpgrades = Object.values(activePlayer.upgrades).some(
    (active) => !active,
  );
  const upgradeActionLabel = hasInactiveUpgrades ? 'Activate upgrade' : 'View upgrades';
  const upgradeActionMeta = hasInactiveUpgrades
    ? canActivateUpgrade
      ? '3 orders'
      : `${activePlayer.completed.length}/3 orders`
    : 'All active';
  const phaseLabel = phaseDisplayLabel(state.phase);
  const remoteModeLabel = isAsyncRemoteGame
    ? isRemoteHost
      ? 'Async host'
      : 'Async'
    : isRemoteHost
      ? 'Host'
      : 'Peer';
  const remoteStatusLabel =
    isAsyncRemoteGame && remoteStatus.connection === ASYNC_OFFLINE_DRAFT_CONNECTION
      ? formatAsyncDraftConnectionLabel(remoteStatus.connection, asyncDraftActionCount)
      : remoteStatus.connection === 'connected'
      ? isAsyncRemoteGame
        ? asyncDraftActionCount > 0
          ? `${asyncDraftActionCount} draft`
          : 'synced'
        : isRemoteHost
        ? `${remoteStatus.peerIds.length} connected`
        : 'connected'
      : remoteStatus.connection;
  const isAsyncCommitRecoveryActive = Boolean(asyncFailedCommit);
  const isAsyncActionBlocked =
    isAsyncCommitRecoveryActive || isOnlineProfilePending;
  const isAsyncCommitRecoveryBusy =
    Boolean(remoteStatus.pendingActionId) || remoteStatus.connection === 'syncing';
  const undoDisabled =
    undoStack.length === 0 ||
    isLiveRemotePeer ||
    isAsyncCommitRecoveryActive ||
    isOnlineProfilePending ||
    (isAsyncRemoteGame && (asyncDraftActionCount === 0 || Boolean(remoteStatus.pendingActionId)));
  const invitePlayers =
    isAsyncRemoteGame && isRemoteHost && state
      ? state.players.filter((player) => player.id !== localPlayerId)
      : [];
  const hasDeviceLinkControls = deviceLinkPlayers.length > 0;
  const hasWhatsAppReminderControls = Boolean(isAsyncRemoteGame && rosterForCurrentRoom);
  const hasUtilityTools = hasDeviceLinkControls || hasWhatsAppReminderControls;
  function renderInviteControls() {
    return invitePlayers.length > 0 && isRemoteHost ? (
      <div className="invite-actions">
        {invitePlayers.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => copyInviteLink(player.id)}
          >
            Copy {player.name} invite
          </button>
        ))}
      </div>
    ) : null;
  }

  function renderDeviceLinkControls() {
    if (!hasDeviceLinkControls) return null;

    return (
      <section className="device-link-panel" aria-label="Device links">
        <div className="device-link-heading">Device links</div>
        <div className="device-link-row">
          <label>
            <span>Player</span>
            <select
              value={selectedDeviceLinkPlayerId}
              onChange={(event) => setDeviceLinkPlayerId(event.target.value)}
            >
              {deviceLinkPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({formatPlayerSeat(player.id)})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => copyDeviceLink(selectedDeviceLinkPlayerId)}
            disabled={!selectedDeviceLinkPlayerId}
          >
            Copy device link
          </button>
        </div>
      </section>
    );
  }

  function renderWhatsAppReminderControls() {
    if (!hasWhatsAppReminderControls) return null;

    const localSeatName = getPlayer(state, localPlayerId)?.name ?? 'Your seat';

    return (
      <section className="notification-control-panel" aria-label="WhatsApp reminders">
        <div className="notification-control-heading">WhatsApp reminders</div>
        <div className="notification-control-body">
          <div className="notification-roster-status" aria-label="Reminder status by player">
            {notificationDisplay.map((item) => (
              <span
                key={item.playerId}
                className={`notification-status-chip notification-status-${item.status}`}
              >
                {item.name}: {item.status}
              </span>
            ))}
          </div>
          <div className="notification-form-row">
            <label>
              <span>Country</span>
              <select
                value={notificationCountry}
                onChange={(event) => setNotificationCountry(event.target.value)}
                disabled={isNotificationSaving}
              >
                {WHATSAPP_COUNTRY_OPTIONS.map((option) => (
                  <option key={option.country} value={option.country}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{localSeatName} number</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={notificationNumber}
                onChange={(event) => setNotificationNumber(event.target.value)}
                disabled={isNotificationSaving}
              />
            </label>
            <div className="notification-actions">
              <button
                type="button"
                className="primary-button"
                onClick={saveWhatsAppReminderContact}
                disabled={isNotificationSaving}
              >
                Save
              </button>
              <button
                type="button"
                onClick={clearWhatsAppReminderContact}
                disabled={isNotificationSaving || !localNotificationContact}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => syncNotificationRoster()}
                disabled={isNotificationSaving}
              >
                Refresh
              </button>
            </div>
          </div>
          {(notificationStatus || notificationError) && (
            <small className={notificationError ? 'notification-error' : 'notification-status'}>
              {notificationError || notificationStatus}
            </small>
          )}
        </div>
      </section>
    );
  }

  function renderToolsMenu(className = '') {
    if (!hasUtilityTools) return null;

    return (
      <details className={`utility-tools-menu ${className}`.trim()}>
        <summary>Tools</summary>
        <div className="utility-tools-panel">
          {renderDeviceLinkControls()}
          {renderWhatsAppReminderControls()}
        </div>
      </details>
    );
  }

  function renderPendingTurnReminder() {
    if (!pendingTurnReminder) return null;

    return (
      <section className="turn-reminder-panel" aria-live="polite">
        <strong>WhatsApp reminder ready for {pendingTurnReminder.playerName}.</strong>
        <div className="button-row turn-reminder-actions">
          <button
            type="button"
            className="primary-button"
            onClick={openPendingTurnReminder}
          >
            Message {pendingTurnReminder.playerName}
          </button>
          <button type="button" onClick={copyPendingTurnReminder}>
            Copy message
          </button>
          <button type="button" onClick={sharePendingTurnReminder}>
            Share
          </button>
          <button type="button" onClick={() => setPendingTurnReminder(null)}>
            Dismiss
          </button>
        </div>
      </section>
    );
  }

  function renderPendingProfileSave() {
    if (!pendingPlayerProfile) return null;

    return (
      <section className="profile-save-panel" aria-live="assertive">
        <div className="phase-summary">
          <span className="phase-kicker">Player profile</span>
          <h2>{isProfileSaving ? 'Saving your profile' : 'Finish joining the room'}</h2>
          <p>{profileError || profileStatus || 'Saving your name and WhatsApp number.'}</p>
        </div>
        {profileError && (
          <div className="button-row profile-save-actions">
            <button
              className="primary-button"
              type="button"
              onClick={retryPendingOnlineProfile}
              disabled={isProfileSaving}
            >
              Retry
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="game-page" ref={pageRef}>
      <header className="game-header">
        <div className="header-title">
          <h1>Coffee Rush</h1>
          <p className="desktop-turn-label">
            Turn {state.turn} / {activePlayer.name} / {state.phase}
          </p>
          <p className="mobile-turn-label">
            T{state.turn} · {activePlayer.name} · {phaseLabel}
          </p>
        </div>
        <div className="header-actions header-actions-desktop">
          {isRemoteGame && (
            <>
              <span className="remote-status-pill">
                {remoteModeLabel} {remoteSession.roomId} · {remoteStatusLabel}
              </span>
              {renderInviteControls()}
            </>
          )}
          <span className="deck-counter">{state.deck.length} orders</span>
          {renderToolsMenu('desktop-tools-menu')}
          <button
            type="button"
            onClick={undoLastAction}
            disabled={undoDisabled}
          >
            Undo
          </button>
          <button type="button" onClick={copyExport}>
            Copy log
          </button>
          <button type="button" onClick={downloadExport} disabled={isExporting}>
            {isExporting ? 'Downloading...' : 'Download log + screenshot'}
          </button>
          <button type="button" onClick={newGame}>
            New
          </button>
        </div>
        <div className="header-actions-mobile">
          <button
            type="button"
            onClick={undoLastAction}
            disabled={undoDisabled}
          >
            Undo
          </button>
          <details className="mobile-utility-menu">
            <summary>Tools</summary>
            <div className="mobile-utility-panel">
              {isRemoteGame && (
                <>
                  <span className="remote-status-pill">
                    {remoteModeLabel} {remoteSession.roomId} · {remoteStatusLabel}
                  </span>
                  {renderDeviceLinkControls()}
                  {renderInviteControls()}
                </>
              )}
              <span className="deck-counter">{state.deck.length} orders</span>
              {renderWhatsAppReminderControls()}
              <button type="button" onClick={copyExport}>
                Copy log
              </button>
              <button type="button" onClick={downloadExport} disabled={isExporting}>
                {isExporting ? 'Downloading...' : 'Download log + screenshot'}
              </button>
              <button type="button" onClick={newGame}>
                New
              </button>
            </div>
          </details>
        </div>
      </header>

      {renderPendingTurnReminder()}
      {renderPendingProfileSave()}
      {error && <div className="error-banner">{error}</div>}
      {remoteStatus.error && <div className="error-banner">{remoteStatus.error}</div>}
      {exportStatus && <div className="message-banner">{exportStatus}</div>}
      {visibleLastMessage && <div className="message-banner">{visibleLastMessage}</div>}
      {isAsyncCommitRecoveryActive && (
        <section className="async-recovery-panel" aria-live="assertive">
          <div className="phase-summary">
            <span className="phase-kicker">Commit needs attention</span>
            <h2>Resolve the local draft</h2>
            <p>{ASYNC_COMMIT_RECOVERY_MESSAGE}</p>
            {asyncFailedCommit.error && (
              <small>Last error: {asyncFailedCommit.error}</small>
            )}
          </div>
          <div className="button-row async-recovery-actions">
            <button
              className="primary-button"
              type="button"
              onClick={retryFailedAsyncCommit}
              disabled={isAsyncCommitRecoveryBusy}
            >
              Retry commit
            </button>
            <button
              type="button"
              onClick={replayFailedAsyncCommitFromLatest}
              disabled={isAsyncCommitRecoveryBusy}
            >
              Replay from latest
            </button>
            <button
              type="button"
              onClick={discardFailedAsyncDraft}
              disabled={isAsyncCommitRecoveryBusy}
            >
              Discard local draft
            </button>
          </div>
        </section>
      )}

      <div className={`game-layout phase-${state.phase}`}>
        {state.phase !== PHASES.SETUP_PLACEMENT && localViewPlayer && (
          <TurnBrief
            player={localViewPlayer}
            phase={state.phase}
            completableOrders={localViewCompletableOrders}
            showCupsInPour={localViewPlayer.id !== activePlayer.id}
            minimizedOrderIds={minimizedOrderIdSet}
            onToggleMinimizedOrder={toggleMinimizedOrder}
            onOpenOrders={openOrdersSheet}
            allowOrderMinimize
          />
        )}

        {state.phase === PHASES.MOVE && (
          <section
            className="action-panel move-control-panel"
            aria-label={`${activePlayer.name} move controls`}
          >
            {isActiveTurnLocked ? (
              <div className="phase-tools">
                <div className="inline-warning">{remoteTurnLockMessage}</div>
              </div>
            ) : (
              <div className="phase-tools move-tools">
                {activePlayer.rushTokens > 0 && (
                  <div className="rush-stepper" aria-label="Rush spent">
                    <span>Rush</span>
                    <button
                      type="button"
                      onClick={() => updateRushSpent(rushSpent - 1)}
                      disabled={rushSpent <= 0 || isAsyncActionBlocked}
                      aria-label="Spend one fewer Rush token"
                    >
                      -
                    </button>
                    <strong>{rushSpent}</strong>
                    <button
                      type="button"
                      onClick={() => updateRushSpent(rushSpent + 1)}
                      disabled={
                        rushSpent >= activePlayer.rushTokens || isAsyncActionBlocked
                      }
                      aria-label="Spend one more Rush token"
                    >
                      +
                    </button>
                    <small>{activePlayer.rushTokens} available</small>
                  </div>
                )}
                <div className="move-status-line">
                  <span>
                    {movePreview?.stepsUsed ?? 0}/{movePreview?.maxSteps ?? 3} steps
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Collecting:{' '}
                    <span className="inline-icons">
                      {(movePreview?.gainedIngredients ?? []).length === 0
                        ? 'none'
                        : movePreview.gainedIngredients.map((ingredient, index) => (
                            <IngredientIcon
                              key={`${ingredient}-${index}`}
                              ingredient={ingredient}
                              small
                            />
                          ))}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        <Board
          state={state}
          selectedMeepleId={selectedMeepleId}
          path={path}
          rushSpent={rushSpent}
          onSelectMeeple={selectMeeple}
          onCellClick={handleCellClick}
          movePreview={movePreview}
          selectedSetupCellId={selectedSetupCellId}
          canSelectSetupCell={canControlSetupPlacement && !isOnlineProfilePending}
          canSelectMoveCell={canControlActivePlayer && !isOnlineProfilePending}
        />

        {state.phase !== PHASES.MOVE && (
          <section className="action-panel" aria-label={`${activePlayer.name} turn controls`}>
            {isActiveTurnLocked && (
              <div className="phase-tools">
                <div className="inline-warning">{remoteTurnLockMessage}</div>
              </div>
            )}

            {!isActiveTurnLocked && state.phase === PHASES.SETUP_PLACEMENT && setupPlacement && (
              <div className="phase-tools setup-placement-tools">
                <div className="phase-summary">
                  <span className="phase-kicker">Setup placement</span>
                  <h2>
                    {canControlSetupPlacement
                      ? `${setupPlacement.player.name}, place ${setupPlacement.meepleId.split('-')[1].toUpperCase()}`
                      : `Waiting for ${setupPlacement.player.name}`}
                  </h2>
                  <p>
                    {!canControlSetupPlacement
                      ? `${setupPlacement.player.name} needs to place this starting barista before setup can continue.`
                      : setupPlacement.autoPlaceInFirstCup
                        ? 'Pick any open board space. Its ingredient will go to Cup 1 automatically.'
                        : selectedSetupCell
                      ? `${ingredientLabel(
                          selectedSetupCell.ingredient,
                        )} selected from Cell ${selectedSetupCell.id}. Choose a cup for it.`
                      : 'Pick any open board space to collect its starting ingredient, then choose a cup.'}
                  </p>
                </div>
                {!canControlSetupPlacement && (
                  <div className="inline-warning">{remoteTurnLockMessage}</div>
                )}
                {!setupPlacement.autoPlaceInFirstCup && (
                  <div className="cup-picker detailed-picker" aria-label="Starting ingredient cup">
                    {setupPlacement.player.cups.map((cup, index) => (
                      <button
                        key={index}
                        className={selectedCup === index ? 'selected-tool' : ''}
                        type="button"
                        onClick={() => placeStartingIngredient(index)}
                        disabled={
                          !selectedSetupCell ||
                          isAsyncActionBlocked ||
                          !canControlSetupPlacement
                        }
                      >
                        <span>Cup {index + 1}</span>
                        <small>{ingredientListLabel(cup)}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isActiveTurnLocked && state.phase === PHASES.UPGRADE && (
              <div className="phase-tools">
                <div className="phase-summary">
                  <span className="phase-kicker">Start of turn</span>
                  <h2>{activePlayer.name}, choose an upgrade or move</h2>
                  <p>
                    {canActivateUpgrade
                      ? 'You may activate an upgrade for 3 completed orders, or skip straight to movement.'
                      : 'No upgrade is available until you have 3 completed orders.'}
                  </p>
                </div>
                <div className="turn-facts">
                  <span title="Completed orders">
                    <UiIcon name="orders" />
                    <strong>{activePlayer.completed.length}</strong>
                  </span>
                  <span title="Rush tokens">
                    <span className="rush-token rush-token-inline">R</span>
                    <strong>{activePlayer.rushTokens}</strong>
                  </span>
                </div>
                <div className="upgrade-action-row">
                  <button
                    className="upgrade-open-button"
                    type="button"
                    onClick={() => setIsUpgradeMenuOpen(true)}
                    disabled={isAsyncActionBlocked}
                  >
                    <span>{upgradeActionLabel}</span>
                    <small>{upgradeActionMeta}</small>
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() =>
                      dispatch({ type: 'SKIP_UPGRADES', playerId: activePlayer.id })
                    }
                    disabled={isAsyncActionBlocked}
                  >
                    Move
                  </button>
                </div>
              </div>
            )}

            {!isActiveTurnLocked && state.phase === PHASES.POUR && (
              <div className="phase-tools">
                <div className="phase-summary">
                  <span className="phase-kicker">Pour and serve</span>
                  <h2>Resolve cups for {activePlayer.name}</h2>
                  <p>
                    {activePlayer.hand.length > 0
                      ? 'Pour or discard every collected ingredient before serving.'
                      : completableOrders.length > 0
                        ? 'Serve ready orders, then end the turn.'
                        : 'No ingredients remain in hand. End the turn when ready.'}
                  </p>
                </div>
                <CupMemoryStrip
                  cups={activePlayer.cups}
                  selectedCup={selectedCup}
                  onSelectCup={
                    canControlActivePlayer && !isOnlineProfilePending
                      ? selectCup
                      : undefined
                  }
                  readyCupIndexes={readyCupIndexes}
                  label="Pour target cup"
                />
                {selectedCup !== null && activePlayer.cups[selectedCup]?.length > 0 && (
                  <div className="selected-cup-actions" aria-label="Selected cup actions">
                    <button
                      className="empty-cup-button"
                      type="button"
                      onClick={() => emptyCup(selectedCup)}
                      disabled={isAsyncActionBlocked}
                      aria-label={`Empty Cup ${selectedCup + 1}`}
                      title={`Empty Cup ${selectedCup + 1}`}
                    >
                      <UiIcon name="trash" />
                      <span>Empty C{selectedCup + 1}</span>
                    </button>
                  </div>
                )}
                <div className="hand-row" aria-label="Collected ingredients">
                  {activePlayer.hand.length === 0 && <span>No ingredients in hand</span>}
                  {activePlayer.hand.map((ingredient, index) => (
                    <div
                      className="hand-token"
                      key={`${ingredient}-${index}`}
                      aria-label={`Collected ${ingredientLabel(ingredient)}`}
                    >
                      <span className="hand-token-label">
                        <IngredientIcon ingredient={ingredient} small />
                        {ingredientLabel(ingredient)}
                      </span>
                      <button
                        className="pour-button"
                        type="button"
                        onClick={() => pourIngredient(ingredient)}
                        disabled={
                          selectedCup === null ||
                          isAsyncActionBlocked
                        }
                        aria-label={
                          selectedCup === null
                            ? `Choose a cup before pouring ${ingredientLabel(ingredient)}`
                            : `Pour ${ingredientLabel(ingredient)} into Cup ${selectedCup + 1}`
                        }
                      >
                        Pour
                      </button>
                      <button
                        type="button"
                        onClick={() => discardIngredient(ingredient)}
                        disabled={isAsyncActionBlocked}
                        aria-label={`Discard ${ingredientLabel(ingredient)}`}
                      >
                        Discard
                      </button>
                    </div>
                  ))}
                </div>
                {completableOrders.length > 0 && (
                  <div className="ready-orders" aria-label="Ready orders">
                    <strong>Ready to serve</strong>
                    {completableOrders.map((match) => (
                      <button
                        key={`${match.order.id}-${match.cupIdx}`}
                        className="serve-order-button"
                        type="button"
                        onClick={() => fulfillOrder(match.cupIdx, match.order.id)}
                        disabled={isAsyncActionBlocked}
                      >
                        <span>{`Serve C${match.cupIdx + 1}: ${match.order.name}`}</span>
                        <OrderPressureMarker tabIndex={match.tabIdx} compact />
                      </button>
                    ))}
                  </div>
                )}
                <div className="button-row">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => dispatch({ type: 'END_TURN', playerId: activePlayer.id })}
                    disabled={activePlayer.hand.length > 0 || isAsyncActionBlocked}
                  >
                    End turn
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {state.phase === PHASES.MOVE && !isActiveTurnLocked && (
          <section
            className="action-panel move-confirm-panel"
            aria-label={`${activePlayer.name} move confirmation`}
          >
            <div className="phase-tools move-confirm-tools">
              {movePreview?.error && (
                <div className="inline-warning">
                  {movePreview.remainingSteps > 0
                    ? `${movePreview.error} Continue to an open cell or clear the path.`
                    : movePreview.error}
                </div>
              )}
              {path.length > 0 && (
                <span className="path-readout">
                  {path.map((cellId) => cellLabel(cellId)).join(' -> ')}
                </span>
              )}
              <div className="button-row">
                <button
                  type="button"
                  onClick={() => setPath([])}
                  disabled={path.length === 0}
                >
                  Clear
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={confirmMove}
                  disabled={
                    !movePreview?.canConfirm ||
                    isAsyncActionBlocked
                  }
                >
                  Confirm move
                </button>
              </div>
            </div>
          </section>
        )}

        <aside className="players-column">
          {orderedPlayers.map((player) => (
            <PlayerPanel
              key={player.id}
              player={player}
              isActive={player.id === activePlayer.id}
              selectedCup={selectedCup}
              onSelectCup={selectCup}
              onDumpCup={(cupIdx) =>
                dispatch({ type: 'DUMP_CUP', playerId: activePlayer.id, cupIdx })
              }
              phase={state.phase}
              canInteract={canControlActivePlayer && !isOnlineProfilePending}
            />
          ))}
        </aside>
      </div>

      <footer className="ingredient-key">
        {INGREDIENTS.map((ingredient) => (
          <span key={ingredient}>
            <IngredientIcon ingredient={ingredient} small />
            {ingredient}
          </span>
        ))}
      </footer>

      <UpgradeMenu
        player={activePlayer}
        canActivate={canActivateUpgrade && canControlActivePlayer}
        isOpen={isUpgradeMenuOpen}
        onActivate={activateUpgrade}
        onClose={() => setIsUpgradeMenuOpen(false)}
      />
      <PassDeviceModal nextPlayerName={passTo} onContinue={() => setPassTo('')} />
      <PlayerOrdersSheet
        player={ordersSheetPlayer}
        readyOrderIds={ordersSheetReadyOrderIds}
        onClose={() => setIsOrdersSheetOpen(false)}
      />
    </main>
  );
}
