import { isValidAsyncAction } from './asyncRoom';

export const ASYNC_COMMIT_RECOVERY_MESSAGE =
  'This turn did not commit. Retry the commit, replay from the latest room state, or discard the local draft before continuing.';
export const ASYNC_REPLAY_FROM_LATEST_MESSAGE =
  'Replay this turn from the latest room state.';
export const ASYNC_DISCARD_DRAFT_MESSAGE = 'Local draft discarded.';

const COMMIT_BOUNDARY_ACTION_TYPES = new Set(['PLACE_STARTING_MEEPLE', 'END_TURN']);

export function isAsyncCommitBoundaryAction(action) {
  return COMMIT_BOUNDARY_ACTION_TYPES.has(action?.type);
}

export function createAsyncCommitRecovery({
  baseHead,
  actions,
  resultState,
  error = '',
} = {}) {
  const draftActions = Array.isArray(actions) ? actions.slice() : [];
  const headIndex = Number(baseHead?.headIndex);
  const headHash = String(baseHead?.headHash ?? '');

  if (
    !Number.isInteger(headIndex) ||
    headIndex < 0 ||
    headHash.length === 0 ||
    draftActions.length === 0 ||
    !draftActions.every(isValidAsyncAction) ||
    !isAsyncCommitBoundaryAction(draftActions[draftActions.length - 1]) ||
    !resultState
  ) {
    return null;
  }

  return {
    baseHead: {
      headIndex,
      headHash,
    },
    actions: draftActions,
    resultState,
    error: String(error ?? ''),
  };
}

export function createAsyncCommitRecoveryFromDraft(draft, error = '') {
  return createAsyncCommitRecovery({
    baseHead: {
      headIndex: draft?.baseHeadIndex,
      headHash: draft?.baseHeadHash,
    },
    actions: draft?.actions,
    resultState: draft?.state,
    error,
  });
}
