import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import IngredientIcon from '../components/IngredientIcon';
import PassDeviceModal from '../components/PassDeviceModal';
import PlayerPanel from '../components/PlayerPanel';
import { UiIcon } from '../components/UiIcon';
import { INGREDIENTS, ingredientLabel } from '../data/ingredients';
import { getCell } from '../engine/board';
import { applyAction } from '../engine/reducers';
import {
  getActivePlayer,
  getCompletableOrders,
  getMeepleForFirstMoveStep,
  getMovePathPreview,
  getPlayer,
  getSetupPlacement,
} from '../engine/selectors';
import { PHASES } from '../engine/types';
import {
  clearGame,
  loadGame,
  loadUndoStack,
  saveGame,
  saveUndoStack,
} from '../persistence/localStorage';
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

function meepleLabel(meeple) {
  return meeple.id.split('-')[1].toUpperCase();
}

function cellLabel(cellId) {
  const cell = getCell(cellId);
  return cell ? `Cell ${cell.id} · ${ingredientLabel(cell.ingredient)}` : 'Unplaced';
}

function ingredientListLabel(ingredients) {
  if (!ingredients || ingredients.length === 0) return 'none yet';
  return ingredients.map((ingredient) => ingredientLabel(ingredient)).join(', ');
}

export default function GamePage() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [state, setState] = useState(() => loadGame());
  const [undoStack, setUndoStack] = useState(() => loadUndoStack());
  const [error, setError] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMeepleId, setSelectedMeepleId] = useState('');
  const [path, setPath] = useState([]);
  const [rushSpent, setRushSpent] = useState(0);
  const [selectedCup, setSelectedCup] = useState(null);
  const [passTo, setPassTo] = useState('');

  const activePlayer = state ? getActivePlayer(state) : null;
  const setupPlacement = state ? getSetupPlacement(state) : null;
  const completableOrders = useMemo(
    () =>
      activePlayer && state?.phase === PHASES.POUR
        ? getCompletableOrders(activePlayer)
        : [],
    [activePlayer, state?.phase],
  );
  const selectedMeeple = activePlayer?.meeples.find(
    (meeple) => meeple.id === selectedMeepleId,
  );
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
    if (!state) {
      navigate('/');
      return;
    }

    saveGame(state);

    if (state.phase === 'gameOver') {
      navigate('/results');
    }
  }, [navigate, state]);

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

  if (!state || !activePlayer) {
    return null;
  }

  function dispatch(action) {
    const beforePlayerId = state.activePlayerId;
    const result = applyAction(state, action);

    if (result.error) {
      setError(result.error);
      return;
    }

    setError('');
    setExportStatus('');
    setUndoStack((current) => [...current.slice(-(MAX_UNDO_STATES - 1)), state]);
    setState(result.state);

    if (action.type === 'END_TURN' && result.state.phase !== 'gameOver') {
      const nextPlayer = getPlayer(result.state, result.state.activePlayerId);
      if (beforePlayerId !== result.state.activePlayerId) {
        setPassTo(nextPlayer.name);
      }
    }

    const resetsTurnControls = ['PLACE_STARTING_MEEPLE', 'MOVE', 'END_TURN'].includes(
      action.type,
    );

    if (resetsTurnControls) {
      setPath([]);
      setRushSpent(0);
      setSelectedCup(null);
    }
  }

  function resetActionUi() {
    setPath([]);
    setRushSpent(0);
    setSelectedCup(null);
    setPassTo('');
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
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((current) => current.slice(0, -1));
    setState(previousState);
    setError('');
    setExportStatus('');
    resetActionUi();
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

  function handleCellClick(cellId) {
    if (setupPlacement) {
      if (selectedCup === null) {
        setError('Choose a cup for this starting ingredient first.');
        return;
      }

      dispatch({
        type: 'PLACE_STARTING_MEEPLE',
        playerId: setupPlacement.playerId,
        meepleId: setupPlacement.meepleId,
        cellId,
        cupIdx: selectedCup,
      });
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

  function newGame() {
    clearGame();
    navigate('/');
  }

  const visibleLastMessage =
    state.lastMessage?.startsWith('Pass to ') && !passTo ? '' : state.lastMessage;
  const selectedCupContents =
    selectedCup === null ? null : activePlayer.cups[selectedCup] ?? null;
  const canActivateUpgrade = activePlayer.completed.length >= 3;

  return (
    <main className="game-page" ref={pageRef}>
      <header className="game-header">
        <div>
          <h1>Coffee Rush</h1>
          <p>
            Turn {state.turn} / {activePlayer.name} / {state.phase}
          </p>
        </div>
        <div className="header-actions">
          <span className="deck-counter">{state.deck.length} orders</span>
          <button type="button" onClick={undoLastAction} disabled={undoStack.length === 0}>
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
      </header>

      {error && <div className="error-banner">{error}</div>}
      {exportStatus && <div className="message-banner">{exportStatus}</div>}
      {visibleLastMessage && <div className="message-banner">{visibleLastMessage}</div>}

      <div className="game-layout">
        <div className="play-surface">
          <Board
            state={state}
            selectedMeepleId={selectedMeepleId}
            path={path}
            rushSpent={rushSpent}
            onSelectMeeple={selectMeeple}
            onCellClick={handleCellClick}
            movePreview={movePreview}
          />

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
                    Choose the cup that will receive the space ingredient, then pick
                    any open board space.
                  </p>
                </div>
                <div className="cup-picker detailed-picker" aria-label="Starting ingredient cup">
                  {setupPlacement.player.cups.map((cup, index) => (
                    <button
                      key={index}
                      className={selectedCup === index ? 'selected-tool' : ''}
                      type="button"
                      onClick={() => selectCup(index)}
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
            )}

            {state.phase === PHASES.MOVE && (
              <div className="phase-tools">
                <div className="phase-summary">
                  <span className="phase-kicker">Move</span>
                  <h2>Plan a route for {activePlayer.name}</h2>
                  <p>
                    {selectedMeeple
                      ? `${meepleLabel(selectedMeeple)} starts on ${cellLabel(
                          selectedMeeple.cellId,
                        )}. Pick adjacent highlighted cells.`
                      : 'Choose one of your baristas before selecting a path.'}
                  </p>
                </div>
                <div className="meeple-picker detailed-picker" aria-label="Barista picker">
                  {activePlayer.meeples.map((meeple) => (
                    <button
                      key={meeple.id}
                      className={selectedMeepleId === meeple.id ? 'selected-tool' : ''}
                      type="button"
                      onClick={() => selectMeeple(meeple.id)}
                    >
                      <span>{meepleLabel(meeple)}</span>
                      <small>{cellLabel(meeple.cellId)}</small>
                    </button>
                  ))}
                </div>
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
                <div className="move-status-grid">
                  <span>
                    Steps {movePreview?.stepsUsed ?? 0} / {movePreview?.maxSteps ?? 3}
                  </span>
                  <span>{movePreview?.remainingSteps ?? 3} remaining</span>
                  <span>
                    Collecting{' '}
                    <span className="inline-icons">
                      {(movePreview?.gainedIngredients ?? []).length === 0
                        ? 'none yet'
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
                {movePreview?.error && (
                  <div className="inline-warning">
                    {movePreview.remainingSteps > 0
                      ? `${movePreview.error} Continue to an open cell or clear the path.`
                      : movePreview.error}
                  </div>
                )}
                <span className="path-readout">
                  {path.length === 0
                    ? 'Tap a highlighted cell to add the first step.'
                    : path.map((cellId) => cellLabel(cellId)).join(' -> ')}
                </span>
                <div className="button-row">
                  <button type="button" onClick={() => setPath([])}>
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
                <div className="cup-picker detailed-picker" aria-label="Pour target cup">
                  {activePlayer.cups.map((cup, index) => (
                    <button
                      key={index}
                      className={selectedCup === index ? 'selected-tool' : ''}
                      type="button"
                      onClick={() => selectCup(index)}
                    >
                      <span>Cup {index + 1}</span>
                      <small>
                        {ingredientListLabel(cup)} · {cup.length}/4
                      </small>
                    </button>
                  ))}
                </div>
                {selectedCup !== null && (
                  <div className="selected-cup-summary">
                    Target: Cup {selectedCup + 1} ({ingredientListLabel(selectedCupContents)})
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
                        {`Serve ${match.order.name} with Cup ${match.cupIdx + 1}`}
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
        </div>

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
              onActivateUpgrade={(tileId) =>
                dispatch({ type: 'ACTIVATE_UPGRADE', playerId: activePlayer.id, tileId })
              }
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

      <PassDeviceModal nextPlayerName={passTo} onContinue={() => setPassTo('')} />
    </main>
  );
}
