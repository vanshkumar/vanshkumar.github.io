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
  REMOTE_MESSAGE_TYPES,
  connectRoom,
  createAcceptedAction,
  createActionRequest,
  createInviteLink,
  createStateSnapshot,
} from '../network/roomSync';
import {
  clearGame,
  loadGame,
  loadUndoStack,
  saveGame,
  saveUndoStack,
} from '../persistence/localStorage';
import {
  REMOTE_MODES,
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
  const [state, setState] = useState(() => loadGame());
  const [undoStack, setUndoStack] = useState(() => loadUndoStack());
  const [remoteSession, setRemoteSession] = useState(() => loadRemoteSession());
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
  const remoteRoomKey = remoteSession
    ? `${remoteSession.mode}:${remoteSession.roomId}`
    : '';
  remoteSessionRef.current = remoteSession;
  remoteHandlersRef.current = {
    handleRemoteMessage,
    sendHostSnapshot,
  };

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
      if (!isRemotePeer) {
        navigate('/');
      }
      return;
    }

    saveGame(state);

    if (state.phase === 'gameOver') {
      navigate('/results');
    }
  }, [isRemotePeer, navigate, state]);

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

    if (!session) return undefined;

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
          client.send({
            type: REMOTE_MESSAGE_TYPES.HELLO,
            clientId: client.selfId,
            knownActionIndex: stateRef.current?.log?.length ?? 0,
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

  if (!state || !activePlayer) {
    if (isRemotePeer) {
      return (
        <main className="game-page">
          <section className="remote-waiting-panel">
            <h1>Coffee Rush</h1>
            <p>
              Joining room {remoteSession.roomId}. Keep this screen open while the host
              sends the current game.
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

  function applyAcceptedGameAction(action, { showErrors = true } = {}) {
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
    setUndoStack((current) => {
      const next = [...current.slice(-(MAX_UNDO_STATES - 1)), currentState];
      undoStackRef.current = next;
      return next;
    });
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

  function dispatch(action) {
    if (isRemotePeer) {
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

      try {
        client.send(request);
      } catch {
        clearPendingActionId(request.clientActionId);
        setExportStatus('');
        setError('Could not send that action to the host.');
        return { error: 'Could not send that action to the host.' };
      }

      return { pending: true };
    }

    const result = applyAcceptedGameAction(action);

    if (!result.error && isRemoteHost) {
      remoteClientRef.current?.send(
        createAcceptedAction(action, result.state.log.length),
      );
    }

    return result;
  }

  function sendHostSnapshot(peerId) {
    const currentState = stateRef.current;
    const client = remoteClientRef.current;

    if (!currentState || !client) return;

    client.send(createStateSnapshot(currentState, undoStackRef.current), peerId);
  }

  function requestRemoteResync() {
    remoteClientRef.current?.send({
      type: REMOTE_MESSAGE_TYPES.RESYNC_REQUEST,
      knownActionIndex: stateRef.current?.log?.length ?? 0,
    });
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

    if (isRemoteHost) {
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
          remoteClientRef.current?.send(
            {
              type: REMOTE_MESSAGE_TYPES.ACTION_REJECTED,
              clientActionId: message.clientActionId,
              error: result.error,
            },
            peerId,
          );
          return;
        }

        remoteClientRef.current?.send(
          createAcceptedAction(
            message.action,
            result.state.log.length,
            message.clientActionId,
          ),
        );
        return;
      }
    }

    if (isRemotePeer) {
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
    if (isRemotePeer) {
      setError('Only the host can undo in an online room.');
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

    if (isRemoteHost) {
      remoteClientRef.current?.send(createStateSnapshot(previousState, nextUndoStack));
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

    const inviteLink = createInviteLink(remoteSession.roomId);

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
        setExportStatus(`Room code: ${remoteSession.roomId}`);
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
    if (isRemotePeer) {
      leaveRemoteGame();
      return;
    }

    if (isRemoteHost) {
      try {
        await remoteClientRef.current?.send({ type: REMOTE_MESSAGE_TYPES.ROOM_CLOSED });
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
  const remoteModeLabel = isRemoteHost ? 'Host' : 'Peer';
  const remoteStatusLabel =
    remoteStatus.connection === 'connected'
      ? isRemoteHost
        ? `${remoteStatus.peerIds.length} connected`
        : 'connected'
      : remoteStatus.connection;

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
            disabled={undoStack.length === 0 || isRemotePeer}
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
            disabled={undoStack.length === 0 || isRemotePeer}
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
