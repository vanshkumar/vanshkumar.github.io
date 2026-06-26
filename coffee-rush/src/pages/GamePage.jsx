import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import CupMemoryStrip from '../components/CupMemoryStrip';
import IngredientIcon from '../components/IngredientIcon';
import PassDeviceModal from '../components/PassDeviceModal';
import PlayerPanel from '../components/PlayerPanel';
import TurnBrief from '../components/TurnBrief';
import UpgradeMenu from '../components/UpgradeMenu';
import { UiIcon } from '../components/UiIcon';
import { INGREDIENTS, ingredientLabel } from '../data/ingredients';
import { getCell } from '../engine/board';
import { applyAction } from '../engine/reducers';
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
  clearGame,
  clearAsyncDraft,
  loadGame,
  loadAsyncDraft,
  loadAsyncRoomState,
  loadUndoStack,
  saveAsyncDraft,
  saveAsyncRoomState,
  saveGame,
  saveUndoStack,
} from '../persistence/localStorage';
import {
  REMOTE_MODES,
  REMOTE_PROTOCOLS,
  clearRemoteSession,
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

function meepleLabel(meeple) {
  return meeple.id.split('-')[1].toUpperCase();
}

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

export default function GamePage() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
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
  const asyncSyncInFlightRef = useRef(false);
  const [state, setState] = useState(() => loadGame());
  const [undoStack, setUndoStack] = useState(() => loadUndoStack());
  const [remoteSession, setRemoteSession] = useState(() => loadRemoteSession());
  const [asyncDraftActionCount, setAsyncDraftActionCount] = useState(0);
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
  const isRemoteHost = remoteSession?.mode === REMOTE_MODES.HOST;
  const isRemotePeer = remoteSession?.mode === REMOTE_MODES.PEER;
  const isRemoteGame = Boolean(remoteSession);
  const isAsyncRemoteGame = remoteSession?.protocol === REMOTE_PROTOCOLS.ASYNC;
  const isLiveRemoteGame = isRemoteGame && !isAsyncRemoteGame;
  const isLiveRemoteHost = isRemoteHost && isLiveRemoteGame;
  const isLiveRemotePeer = isRemotePeer && isLiveRemoteGame;
  const remoteRoomKey = remoteSession
    ? `${remoteSession.protocol}:${remoteSession.mode}:${remoteSession.roomId}:${remoteSession.relayAuth}:${remoteSession.hostAuth}:${remoteSession.gameKey}`
    : '';
  remoteSessionRef.current = remoteSession;
  remoteHandlersRef.current = {
    handleRemoteMessage,
    sendHostSnapshot,
  };
  asyncSyncRef.current = syncAsyncRoom;

  const activePlayer = state ? getActivePlayer(state) : null;
  const setupPlacement = state ? getSetupPlacement(state) : null;
  const completableOrders = useMemo(
    () =>
      activePlayer && state?.phase === PHASES.POUR
        ? getCompletableOrders(activePlayer)
        : [],
    [activePlayer, state?.phase],
  );
  const readyCupIndexes = useMemo(
    () => Array.from(new Set(completableOrders.map((match) => match.cupIdx))),
    [completableOrders],
  );
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
    () =>
      state && activePlayer
        ? [
            activePlayer,
            ...state.players.filter((player) => player.id !== activePlayer.id),
          ]
        : [],
    [activePlayer, state],
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
      setAsyncDraftActionCount(0);
    };
  }, [remoteRoomKey]);

  if (!state || !activePlayer) {
    if (isRemoteGame) {
      return (
        <main className="game-page">
          <section className="remote-waiting-panel">
            <h1>Coffee Rush</h1>
            <p>
              {isAsyncRemoteGame
                ? `Syncing encrypted room ${remoteSession.roomId}.`
                : `Joining room ${remoteSession.roomId}. Keep this screen open while the host sends the current game.`}
            </p>
            {remoteStatus.error && <div className="error-banner">{remoteStatus.error}</div>}
            <div className="button-row">
              <span className="remote-status-pill">
                {remoteStatus.connection === 'error'
                  ? 'Connection error'
                  : remoteStatus.connection}
              </span>
              <button type="button" onClick={leaveRemoteGame}>
                Leave
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
      clearAsyncDraft(remoteSessionRef.current.roomId);
    }
  }

  function applyAsyncDraftHydration(hydration) {
    if (!hydration) return false;

    if (hydration.canonical) {
      asyncCanonicalRef.current = hydration.canonical;
    }

    asyncDraftRef.current = hydration.draft;
    setAsyncDraftActionCount(hydration.draftActionCount);
    stateRef.current = hydration.state;
    undoStackRef.current = hydration.undoStack;
    setState(hydration.state);
    setUndoStack(hydration.undoStack);
    return true;
  }

  function clearAsyncDraftState() {
    asyncDraftRef.current = null;
    setAsyncDraftActionCount(0);
    if (remoteSessionRef.current?.roomId) {
      clearAsyncDraft(remoteSessionRef.current.roomId);
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
      const cached = asyncCanonicalRef.current ?? loadAsyncRoomState(session.roomId);
      const savedDraft = restoreDraft ? loadAsyncDraft(session.roomId) : null;
      const offlineDraftHydration = discardDraft
        ? null
        : createAsyncDraftHydrationUnit({
            draft: asyncDraftRef.current ?? savedDraft,
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

  async function commitAsyncActions(actions, resultState, baseHead) {
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

    const pendingId = `async-${Date.now()}`;
    setPendingActionId(pendingId);
    setExportStatus(
      actions.some((action) => action.type === 'END_TURN')
        ? 'Committing turn.'
        : 'Committing setup.',
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
        actions.some((action) => action.type === 'END_TURN')
          ? 'Turn committed.'
          : 'Setup synced.',
      );
      setRemoteStatus((current) => ({
        ...current,
        connection: 'connected',
        error: '',
      }));
      return { state: resultState };
    } catch (commitError) {
      setAsyncDraftState(baseHead, actions, resultState);
      clearPendingActionId(pendingId);
      setExportStatus('');
      setError(commitError?.message ?? 'Could not commit the async turn.');
      return { error: commitError?.message ?? 'Could not commit the async turn.' };
    }
  }

  function dispatchAsyncAction(action) {
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
      action.type === 'PLACE_STARTING_MEEPLE' || action.type === 'END_TURN';

    if (shouldCommitNow) {
      commitAsyncActions(nextActions, result.state, baseHead);
      return { pending: true, state: result.state };
    }

    setAsyncDraftState(baseHead, nextActions, result.state);
    setExportStatus('Draft saved on this device. End turn to sync.');
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
    setSelectedCup(cupIdx);
    setError('');
  }

  function selectMeeple(meepleId) {
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

  async function copyInviteLink() {
    if (!remoteSession) return;

    const inviteLink = createInviteLink(remoteSession);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        copyTextFallback(inviteLink);
      }
      setExportStatus('Invite link copied.');
    } catch {
      try {
        copyTextFallback(inviteLink);
        setExportStatus('Invite link copied.');
      } catch {
        setExportStatus('Could not copy the private invite link.');
      }
    }
  }

  function handleCellClick(cellId) {
    if (setupPlacement) {
      const cell = getCell(cellId);

      if (!cell || !getLegalSetupCells(state).includes(cell.id)) {
        setError('Choose an open board space.');
        return;
      }

      setSelectedSetupCellId(cell.id);
      setSelectedCup(null);
      setError('');
      return;
    }

    if (state.phase !== 'move' || !selectedMeepleId) return;
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

  function placeStartingIngredient(cupIdx) {
    if (!setupPlacement) return;

    if (selectedSetupCellId === null) {
      setError('Choose a board space before choosing a cup.');
      return;
    }

    dispatch({
      type: 'PLACE_STARTING_MEEPLE',
      playerId: setupPlacement.playerId,
      meepleId: setupPlacement.meepleId,
      cellId: selectedSetupCellId,
      cupIdx,
    });
  }

  function confirmMove() {
    dispatch({
      type: 'MOVE',
      playerId: activePlayer.id,
      meepleId: selectedMeepleId,
      path,
      rushSpent,
    });
  }

  function updateRushSpent(nextRushSpent) {
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
  const canActivateUpgrade = activePlayer.completed.length >= 3;
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
  const undoDisabled =
    undoStack.length === 0 ||
    isLiveRemotePeer ||
    (isAsyncRemoteGame && (asyncDraftActionCount === 0 || Boolean(remoteStatus.pendingActionId)));

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
              <button type="button" onClick={copyInviteLink}>
                Copy invite
              </button>
            </>
          )}
          <span className="deck-counter">{state.deck.length} orders</span>
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
                  <button type="button" onClick={copyInviteLink}>
                    Copy invite
                  </button>
                </>
              )}
              <span className="deck-counter">{state.deck.length} orders</span>
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

      {error && <div className="error-banner">{error}</div>}
      {remoteStatus.error && <div className="error-banner">{remoteStatus.error}</div>}
      {exportStatus && <div className="message-banner">{exportStatus}</div>}
      {visibleLastMessage && <div className="message-banner">{visibleLastMessage}</div>}

      <div className={`game-layout phase-${state.phase}`}>
        {state.phase !== PHASES.SETUP_PLACEMENT && (
          <TurnBrief
            player={activePlayer}
            phase={state.phase}
            completableOrders={completableOrders}
          />
        )}

        {state.phase === PHASES.MOVE && (
          <section
            className="action-panel move-control-panel"
            aria-label={`${activePlayer.name} move controls`}
          >
            <div className="phase-tools move-tools">
              <div className="meeple-picker compact-meeple-picker" aria-label="Barista picker">
                {activePlayer.meeples.map((meeple) => (
                  <button
                    key={meeple.id}
                    className={[
                      'meeple-choice',
                      selectedMeepleId === meeple.id ? 'selected-tool' : '',
                      selectedMeepleId === meeple.id ? `selected-tool-${activePlayer.color}` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    type="button"
                    onClick={() => selectMeeple(meeple.id)}
                  >
                    {meepleLabel(meeple)}
                  </button>
                ))}
              </div>
              {activePlayer.rushTokens > 0 && (
                <div className="rush-stepper" aria-label="Rush spent">
                  <span>Rush</span>
                  <button
                    type="button"
                    onClick={() => updateRushSpent(rushSpent - 1)}
                    disabled={rushSpent <= 0}
                    aria-label="Spend one fewer Rush token"
                  >
                    -
                  </button>
                  <strong>{rushSpent}</strong>
                  <button
                    type="button"
                    onClick={() => updateRushSpent(rushSpent + 1)}
                    disabled={rushSpent >= activePlayer.rushTokens}
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
        />

        {state.phase !== PHASES.MOVE && (
          <section className="action-panel" aria-label={`${activePlayer.name} turn controls`}>
            {state.phase === PHASES.SETUP_PLACEMENT && setupPlacement && (
              <div className="phase-tools setup-placement-tools">
                <div className="phase-summary">
                  <span className="phase-kicker">Setup placement</span>
                  <h2>
                    {setupPlacement.player.name}, place{' '}
                    {setupPlacement.meepleId.split('-')[1].toUpperCase()}
                  </h2>
                  <p>
                    {selectedSetupCell
                      ? `${ingredientLabel(
                          selectedSetupCell.ingredient,
                        )} selected from Cell ${selectedSetupCell.id}. Choose a cup for it.`
                      : 'Pick any open board space to collect its starting ingredient, then choose a cup.'}
                  </p>
                </div>
                <div className="cup-picker detailed-picker" aria-label="Starting ingredient cup">
                  {setupPlacement.player.cups.map((cup, index) => (
                    <button
                      key={index}
                      className={selectedCup === index ? 'selected-tool' : ''}
                      type="button"
                      onClick={() => placeStartingIngredient(index)}
                      disabled={!selectedSetupCell}
                    >
                      <span>Cup {index + 1}</span>
                      <small>{ingredientListLabel(cup)}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.phase === PHASES.UPGRADE && (
              <div className="phase-tools">
                <div className="phase-summary">
                  <span className="phase-kicker">Start of turn</span>
                  <h2>{activePlayer.name}, choose an upgrade or move</h2>
                  <p>
                    {canActivateUpgrade
                      ? 'You may activate one upgrade for 3 completed orders, or skip straight to movement.'
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
                  >
                    Move
                  </button>
                </div>
              </div>
            )}

            {state.phase === PHASES.POUR && (
              <div className="phase-tools">
                <div className="phase-summary">
                  <span className="phase-kicker">Pour and serve</span>
                  <h2>Resolve cups for {activePlayer.name}</h2>
                  <p>
                    {activePlayer.hand.length > 0
                      ? 'Pour or discard every collected ingredient. Serve any exact cup matches when ready.'
                      : completableOrders.length > 0
                        ? 'Serve ready orders, then end the turn.'
                        : 'No ingredients remain in hand. End the turn when ready.'}
                  </p>
                </div>
                <CupMemoryStrip
                  cups={activePlayer.cups}
                  selectedCup={selectedCup}
                  onSelectCup={selectCup}
                  readyCupIndexes={readyCupIndexes}
                  label="Pour target cup"
                />
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
                        disabled={selectedCup === null}
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
                      >
                        {`Serve C${match.cupIdx + 1}: ${match.order.name}`}
                      </button>
                    ))}
                  </div>
                )}
                <div className="button-row">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => dispatch({ type: 'END_TURN', playerId: activePlayer.id })}
                    disabled={activePlayer.hand.length > 0}
                  >
                    End turn
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {state.phase === PHASES.MOVE && (
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
                <button type="button" onClick={() => setPath([])} disabled={path.length === 0}>
                  Clear
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={confirmMove}
                  disabled={!movePreview?.canConfirm}
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
        canActivate={canActivateUpgrade}
        isOpen={isUpgradeMenuOpen}
        onActivate={activateUpgrade}
        onClose={() => setIsUpgradeMenuOpen(false)}
      />
      <PassDeviceModal nextPlayerName={passTo} onContinue={() => setPassTo('')} />
    </main>
  );
}
