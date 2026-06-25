import { buildInviteUrl } from '../persistence/remoteSession';

const TRYSTERO_MODULE_URL = 'https://esm.run/@trystero-p2p/mqtt@0.24.0';
const APP_ID = 'coffee-rush';
const MESSAGE_ACTION = 'coffee-rush-message';

export const REMOTE_MESSAGE_TYPES = {
  HELLO: 'HELLO',
  ACTION_REQUEST: 'ACTION_REQUEST',
  ACTION_ACCEPTED: 'ACTION_ACCEPTED',
  ACTION_REJECTED: 'ACTION_REJECTED',
  STATE_SNAPSHOT: 'STATE_SNAPSHOT',
  RESYNC_REQUEST: 'RESYNC_REQUEST',
  ROOM_CLOSED: 'ROOM_CLOSED',
};

export function createActionRequest(action, clientId, now = Date.now) {
  return {
    type: REMOTE_MESSAGE_TYPES.ACTION_REQUEST,
    clientId,
    clientActionId: `${clientId}-${now()}`,
    action,
  };
}

export function createAcceptedAction(action, actionIndex, clientActionId = '') {
  const message = {
    type: REMOTE_MESSAGE_TYPES.ACTION_ACCEPTED,
    action,
    actionIndex,
  };

  if (clientActionId) {
    message.clientActionId = clientActionId;
  }

  return message;
}

export function createStateSnapshot(state, undoStack = []) {
  return {
    type: REMOTE_MESSAGE_TYPES.STATE_SNAPSHOT,
    state,
    undoStack,
    actionIndex: state?.log?.length ?? 0,
  };
}

export function createInviteLink(roomId) {
  return buildInviteUrl(roomId);
}

export async function connectRoom({
  roomId,
  onMessage,
  onPeerJoin,
  onPeerLeave,
  onStatus,
  onError,
}) {
  const relayUrl = getRelayUrl();

  if (relayUrl) {
    return connectWebSocketRoom({
      roomId,
      relayUrl,
      onMessage,
      onPeerJoin,
      onPeerLeave,
      onStatus,
      onError,
    });
  }

  return connectTrysteroRoom({
    roomId,
    onMessage,
    onPeerJoin,
    onPeerLeave,
    onStatus,
    onError,
  });
}

function getConfiguredRelayUrl() {
  return import.meta.env?.VITE_COFFEE_RUSH_RELAY_URL?.trim() ?? '';
}

export function getRelayUrl(location = window.location) {
  try {
    const relayParam = new URL(location.href).searchParams.get('relay')?.trim() ?? '';
    return relayParam || getConfiguredRelayUrl();
  } catch {
    return getConfiguredRelayUrl();
  }
}

function createClientId() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('');
}

function connectWebSocketRoom({
  roomId,
  relayUrl,
  onMessage,
  onPeerJoin,
  onPeerLeave,
  onStatus,
  onError,
}) {
  onStatus?.('connecting');

  return new Promise((resolve, reject) => {
    const selfId = createClientId();
    const socket = new WebSocket(relayUrl);
    let settled = false;

    function sendRelayMessage(message) {
      socket.send(JSON.stringify(message));
    }

    socket.addEventListener('open', () => {
      sendRelayMessage({
        type: 'JOIN',
        roomId,
        clientId: selfId,
      });
      onStatus?.('connected');
      settled = true;
      resolve({
        selfId,
        send(data, target) {
          sendRelayMessage({
            type: 'ROOM_MESSAGE',
            roomId,
            target,
            data,
          });
        },
        leave() {
          socket.close();
        },
      });
    });

    socket.addEventListener('message', (event) => {
      let message;

      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === 'PEER_JOIN' && message.peerId) {
        onPeerJoin?.(message.peerId);
        return;
      }

      if (message.type === 'PEER_LEAVE' && message.peerId) {
        onPeerLeave?.(message.peerId);
        return;
      }

      if (message.type === 'ROOM_MESSAGE') {
        onMessage?.(message.data, message.from);
      }
    });

    socket.addEventListener('close', () => {
      onStatus?.('offline');
    });

    socket.addEventListener('error', () => {
      const error = new Error(`Could not connect to relay ${relayUrl}.`);
      onStatus?.('error');
      onError?.(error);

      if (!settled) {
        reject(error);
      }
    });
  });
}

async function connectTrysteroRoom({
  roomId,
  onMessage,
  onPeerJoin,
  onPeerLeave,
  onStatus,
  onError,
}) {
  onStatus?.('connecting');

  try {
    const { joinRoom, selfId } = await import(
      /* @vite-ignore */ TRYSTERO_MODULE_URL
    );
    const room = joinRoom({ appId: APP_ID }, roomId);
    const message = room.makeAction(MESSAGE_ACTION);

    room.onPeerJoin = (peerId) => {
      onPeerJoin?.(peerId);
      onStatus?.('connected');
    };

    room.onPeerLeave = (peerId) => {
      onPeerLeave?.(peerId);
    };

    message.onMessage = (data, meta) => {
      onMessage?.(data, meta?.peerId);
    };

    onStatus?.('connected');

    return {
      selfId,
      send(data, target) {
        if (target) {
          return message.send(data, { target });
        }

        return message.send(data);
      },
      leave() {
        room.leave();
      },
    };
  } catch (error) {
    onStatus?.('error');
    onError?.(error);
    throw error;
  }
}
