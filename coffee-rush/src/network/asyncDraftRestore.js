import { applyAction } from '../engine/reducers';
import { isValidAsyncAction } from './asyncRoom';

export const ASYNC_OFFLINE_DRAFT_CONNECTION = 'offlineDraft';
const MAX_RESTORED_UNDO_STATES = 25;

function normalizeCanonical(canonical) {
  if (
    !canonical?.state ||
    !Number.isInteger(Number(canonical.headIndex)) ||
    typeof canonical.headHash !== 'string' ||
    canonical.headHash.length === 0
  ) {
    return null;
  }

  return {
    headIndex: Number(canonical.headIndex),
    headHash: canonical.headHash,
    state: canonical.state,
  };
}

export function normalizeAsyncDraftForHydration(draft, fallbackUndoStack = []) {
  const actions = Array.isArray(draft?.actions) ? draft.actions : [];

  if (
    !draft?.state ||
    actions.length === 0 ||
    !actions.every(isValidAsyncAction) ||
    !Number.isInteger(Number(draft.baseHeadIndex)) ||
    typeof draft.baseHeadHash !== 'string' ||
    draft.baseHeadHash.length === 0
  ) {
    return null;
  }

  return {
    baseHeadIndex: Number(draft.baseHeadIndex),
    baseHeadHash: draft.baseHeadHash,
    actions: actions.slice(),
    state: draft.state,
    undoStack: Array.isArray(draft.undoStack)
      ? draft.undoStack.slice()
      : fallbackUndoStack.slice(),
  };
}

function replayDraftActionsFromCanonical(canonicalState, actions) {
  if (!canonicalState || !Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  let nextState = canonicalState;
  const undoStack = [];

  for (const action of actions) {
    const result = applyAction(nextState, action);
    if (result.error) return null;

    undoStack.push(nextState);
    nextState = result.state;
  }

  return {
    state: nextState,
    undoStack: undoStack.slice(-MAX_RESTORED_UNDO_STATES),
  };
}

export function formatAsyncDraftConnectionLabel(connection, draftActionCount) {
  if (connection === ASYNC_OFFLINE_DRAFT_CONNECTION) {
    return draftActionCount > 0 ? `${draftActionCount} offline draft` : 'offline draft';
  }

  return connection;
}

export function createAsyncDraftHydrationUnit({
  draft,
  canonical = null,
  fallbackUndoStack = [],
} = {}) {
  const normalizedDraft = normalizeAsyncDraftForHydration(draft, fallbackUndoStack);
  if (!normalizedDraft) return null;

  const normalizedCanonical = normalizeCanonical(canonical);
  if (
    normalizedCanonical &&
    (normalizedDraft.baseHeadIndex !== normalizedCanonical.headIndex ||
      normalizedDraft.baseHeadHash !== normalizedCanonical.headHash)
  ) {
    return null;
  }

  const replayedDraft = normalizedCanonical
    ? replayDraftActionsFromCanonical(normalizedCanonical.state, normalizedDraft.actions)
    : null;

  if (normalizedCanonical && !replayedDraft) {
    return null;
  }

  const hydratedDraft = replayedDraft
    ? {
        ...normalizedDraft,
        state: replayedDraft.state,
        undoStack: replayedDraft.undoStack,
      }
    : normalizedDraft;

  return {
    canonical: normalizedCanonical,
    draft: hydratedDraft,
    state: hydratedDraft.state,
    undoStack: hydratedDraft.undoStack,
    draftActionCount: hydratedDraft.actions.length,
    connection: ASYNC_OFFLINE_DRAFT_CONNECTION,
    statusLabel: formatAsyncDraftConnectionLabel(
      ASYNC_OFFLINE_DRAFT_CONNECTION,
      hydratedDraft.actions.length,
    ),
  };
}
