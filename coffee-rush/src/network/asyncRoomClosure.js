import { REMOTE_MODES, REMOTE_PROTOCOLS } from '../persistence/remoteSession';

export const ASYNC_ROOM_CLOSED_CONNECTION = 'closed';
export const ASYNC_ROOM_CLOSED_MESSAGE =
  'This async room is closed or no longer exists.';

export function shouldTreatAsyncRoomNotFoundAsClosed({
  syncError,
  session,
  canonical,
  cached,
  activeState,
  draft,
}) {
  if (
    syncError?.code !== 'ROOM_NOT_FOUND' ||
    session?.protocol !== REMOTE_PROTOCOLS.ASYNC ||
    session?.mode !== REMOTE_MODES.PEER
  ) {
    return false;
  }

  return Boolean(canonical?.state || cached?.state || activeState || draft?.state);
}
