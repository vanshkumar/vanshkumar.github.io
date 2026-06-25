import {
  buildInviteUrl,
  normalizeRoomCode,
} from '../persistence/remoteSession';
import { createRoomCipher } from './roomCrypto';

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

export function createInviteLink(session, location = window.location) {
  return buildInviteUrl(session, location);
}

export async function connectRoom({
  roomId,
  relayAuth = '',
  hostAuth = '',
  gameKey = '',
  role = 'peer',
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
      relayAuth,
      hostAuth,
      gameKey,
      role,
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
    gameKey,
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

export function createRelaySocketUrl(relayUrl, roomId, location = window.location) {
  const url = new URL(relayUrl, location.href);
  url.searchParams.set('room', normalizeRoomCode(roomId));
  return url.toString();
}

function createClientId() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('');
}

async function connectWebSocketRoom({
  roomId,
  relayAuth,
  hostAuth,
  gameKey,
  role,
  relayUrl,
  onMessage,
  onPeerJoin,
  onPeerLeave,
  onStatus,
  onError,
}) {
  onStatus?.('connecting');
  const cipher = gameKey ? await createRoomCipher(gameKey) : null;

  return new Promise((resolve, reject) => {
    const selfId = createClientId();
    const socketUrl = createRelaySocketUrl(relayUrl, roomId);
    const socket = new WebSocket(socketUrl);
    let settled = false;
    let closeHandled = false;
    const pendingMessages = [];

    function sendRelayMessage(message) {
      socket.send(JSON.stringify(message));
    }

    function failConnection(message) {
      const error = new Error(message);
      onStatus?.('error');
      onError?.(error);

      if (!settled) {
        settled = true;
        reject(error);
      }
    }

    async function sendRoomData(data, target) {
      const encryptedData = cipher ? await cipher.encrypt(data) : data;
      sendRelayMessage({
        type: 'ROOM_MESSAGE',
        roomId,
        target,
        data: encryptedData,
      });
    }

    async function handleRoomMessage(message) {
      try {
        const data = cipher ? await cipher.decrypt(message.data) : message.data;
        onMessage?.(data, message.from);
      } catch {
        onError?.(new Error('Received a room message that could not be decrypted.'));
      }
    }

    function resolveConnection(message) {
      if (settled) return;

      settled = true;
      onStatus?.('connected');
      resolve({
        selfId: message.clientId || selfId,
        send(data, target) {
          return sendRoomData(data, target);
        },
        closeRoom() {
          sendRelayMessage({
            type: 'CLOSE_ROOM',
            roomId,
          });
        },
        leave() {
          socket.close();
        },
      });

      pendingMessages.splice(0).forEach((pendingMessage) => {
        if (pendingMessage.type === 'ROOM_MESSAGE') {
          void handleRoomMessage(pendingMessage);
        }
      });
    }

    socket.addEventListener('open', () => {
      sendRelayMessage({
        type: 'JOIN',
        protocol: 1,
        roomId,
        roomAuth: relayAuth,
        hostAuth,
        clientId: selfId,
        role,
      });
    });

    socket.addEventListener('message', (event) => {
      let message;

      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === 'JOIN_ACK') {
        resolveConnection(message);
        return;
      }

      if (message.type === 'ERROR') {
        failConnection(message.message ?? 'The relay rejected the room connection.');
        socket.close();
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
        if (!settled) {
          pendingMessages.push(message);
          return;
        }

        void handleRoomMessage(message);
      }
    });

    socket.addEventListener('close', () => {
      if (closeHandled) return;
      closeHandled = true;
      onStatus?.('offline');

      if (!settled) {
        reject(new Error(`Could not connect to relay ${socketUrl}.`));
      }
    });

    socket.addEventListener('error', () => {
      const error = new Error(`Could not connect to relay ${socketUrl}.`);
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
  gameKey,
  onMessage,
  onPeerJoin,
  onPeerLeave,
  onStatus,
  onError,
}) {
  onStatus?.('connecting');

  try {
    const cipher = gameKey ? await createRoomCipher(gameKey) : null;
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
      if (!cipher) {
        onMessage?.(data, meta?.peerId);
        return;
      }

      void cipher
        .decrypt(data)
        .then((decrypted) => onMessage?.(decrypted, meta?.peerId))
        .catch(() => {
          onError?.(new Error('Received a room message that could not be decrypted.'));
        });
    };

    onStatus?.('connected');

    return {
      selfId,
      async send(data, target) {
        const outboundData = cipher ? await cipher.encrypt(data) : data;

        if (target) {
          return message.send(outboundData, { target });
        }

        return message.send(outboundData);
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
