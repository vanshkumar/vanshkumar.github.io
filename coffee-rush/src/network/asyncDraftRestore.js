import { isValidAsyncAction } from './asyncRoom';

export const ASYNC_OFFLINE_DRAFT_CONNECTION = 'offlineDraft';

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

  return {
    canonical: normalizedCanonical,
    draft: normalizedDraft,
    state: normalizedDraft.state,
    undoStack: normalizedDraft.undoStack,
    draftActionCount: normalizedDraft.actions.length,
    connection: ASYNC_OFFLINE_DRAFT_CONNECTION,
    statusLabel: formatAsyncDraftConnectionLabel(
      ASYNC_OFFLINE_DRAFT_CONNECTION,
      normalizedDraft.actions.length,
    ),
  };
}
