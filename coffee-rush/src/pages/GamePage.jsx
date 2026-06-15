import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import IngredientIcon from '../components/IngredientIcon';
import PassDeviceModal from '../components/PassDeviceModal';
import PlayerPanel from '../components/PlayerPanel';
import { INGREDIENTS } from '../data/ingredients';
import { applyAction } from '../engine/reducers';
import {
  getActivePlayer,
  getCompletableOrders,
  getMeepleForFirstMoveStep,
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
  downloadElementScreenshot,
  downloadTextFile,
} from '../utils/downloads';
import {
  formatGameExport,
  gameExportFilename,
  gameScreenshotFilename,
} from '../utils/gameExport';

const MAX_UNDO_STATES = 25;

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
  const [selectedOrderRef, setSelectedOrderRef] = useState('');
  const [passTo, setPassTo] = useState('');

  const activePlayer = state ? getActivePlayer(state) : null;
  const setupPlacement = state ? getSetupPlacement(state) : null;
  const completableOrders = useMemo(
    () => (activePlayer ? getCompletableOrders(activePlayer) : []),
    [activePlayer],
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
      setSelectedOrderRef('');
      setSelectedCup(null);
    }

    if (action.type === 'FULFILL_ORDER') {
      setSelectedOrderRef('');
    }
  }

  function resetActionUi() {
    setPath([]);
    setRushSpent(0);
    setSelectedCup(null);
    setSelectedOrderRef('');
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
    downloadTextFile(getExportText(), gameExportFilename(state, exportedAt), 'application/json');

    try {
      await downloadElementScreenshot(pageRef.current, gameScreenshotFilename(state, exportedAt));
      setExportStatus('Game log and screenshot downloaded.');
    } catch (screenshotError) {
      console.error(screenshotError);
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
    if (path.length === 0) {
      const inferredMeepleId = getMeepleForFirstMoveStep(
        state,
        selectedMeepleId,
        cellId,
      );
      if (inferredMeepleId !== selectedMeepleId) {
        setSelectedMeepleId(inferredMeepleId);
      }
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

  function fulfillSelectedOrder() {
    const match = completableOrders.find((candidate) => candidate.order.id === selectedOrderRef);
    if (!match) return;

    fulfillOrder(match.cupIdx, selectedOrderRef);
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
      {state.lastMessage && <div className="message-banner">{state.lastMessage}</div>}

      <div className="game-layout">
        <div className="play-surface">
          <Board
            state={state}
            selectedMeepleId={selectedMeepleId}
            path={path}
            rushSpent={rushSpent}
            onSelectMeeple={selectMeeple}
            onCellClick={handleCellClick}
          />

          <section className="action-panel">
            {state.phase === PHASES.SETUP_PLACEMENT && setupPlacement && (
              <div className="phase-tools setup-placement-tools">
                <strong>{setupPlacement.player.name}, place a barista.</strong>
                <span>
                  Choose where this starting ingredient goes, then pick any open board
                  space.
                </span>
                <div className="cup-picker" aria-label="Starting ingredient cup">
                  {setupPlacement.player.cups.map((_, index) => (
                    <button
                      key={index}
                      className={selectedCup === index ? 'selected-tool' : ''}
                      type="button"
                      onClick={() => selectCup(index)}
                    >
                      Cup {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.phase === PHASES.UPGRADE && (
              <div className="phase-tools">
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
                <div className="meeple-picker">
                  {activePlayer.meeples.map((meeple) => (
                    <button
                      key={meeple.id}
                      className={selectedMeepleId === meeple.id ? 'selected-tool' : ''}
                      type="button"
                      onClick={() => selectMeeple(meeple.id)}
                    >
                      {meeple.id.split('-')[1].toUpperCase()}
                    </button>
                  ))}
                </div>
                <label>
                  Rush
                  <input
                    type="number"
                    min="0"
                    max={activePlayer.rushTokens}
                    value={rushSpent}
                    onChange={(event) => setRushSpent(Number(event.target.value))}
                  />
                </label>
                <span className="path-readout">
                  {path.length === 0 ? 'Pick cells' : path.join(' -> ')}
                </span>
                <div className="button-row">
                  <button type="button" onClick={() => setPath([])}>
                    Clear
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={confirmMove}
                    disabled={path.length === 0}
                  >
                    Confirm move
                  </button>
                </div>
              </div>
            )}

            {state.phase === PHASES.POUR && (
              <div className="phase-tools">
                <div className="cup-picker" aria-label="Pour target cup">
                  {activePlayer.cups.map((_, index) => (
                    <button
                      key={index}
                      className={selectedCup === index ? 'selected-tool' : ''}
                      type="button"
                      onClick={() => selectCup(index)}
                    >
                      Cup {index + 1}
                    </button>
                  ))}
                </div>
                <div className="hand-row">
                  {activePlayer.hand.length === 0 && <span>No ingredients in hand</span>}
                  {activePlayer.hand.map((ingredient, index) => (
                    <div className="hand-token" key={`${ingredient}-${index}`}>
                      <button
                        type="button"
                        onClick={() => pourIngredient(ingredient)}
                        disabled={selectedCup === null}
                      >
                        <IngredientIcon ingredient={ingredient} small />
                      </button>
                      <button type="button" onClick={() => discardIngredient(ingredient)}>
                        discard
                      </button>
                    </div>
                  ))}
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    onClick={fulfillSelectedOrder}
                    disabled={!selectedOrderRef}
                  >
                    Serve selected
                  </button>
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
          {state.players.map((player) => (
            <PlayerPanel
              key={player.id}
              player={player}
              isActive={player.id === activePlayer.id}
              selectedCup={selectedCup}
              selectedOrderRef={selectedOrderRef}
              onSelectCup={selectCup}
              onDumpCup={(cupIdx) =>
                dispatch({ type: 'DUMP_CUP', playerId: activePlayer.id, cupIdx })
              }
              onSelectOrder={setSelectedOrderRef}
              onFulfillOrder={fulfillOrder}
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
