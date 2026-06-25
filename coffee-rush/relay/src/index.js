import { DurableObject } from 'cloudflare:workers';
import {
  CLOSE_CODES,
  JOIN_TIMEOUT_MS,
  MAX_ROOM_SOCKETS,
  ROOM_HARD_TTL_MS,
  ROOM_IDLE_TTL_MS,
  createTokenBucket,
  consumeToken,
  normalizeRoomCode,
  safeParseRelayEnvelope,
  validateJoinEnvelope,
  validateRoomMessageEnvelope,
} from './protocol.js';

const ROOM_STORAGE_KEY = 'room';
const TEXT_ENCODER = new TextEncoder();

function bytesToBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

async function hashSecret(secret) {
  const digest = await crypto.subtle.digest('SHA-256', TEXT_ENCODER.encode(secret));
  return bytesToBase64Url(new Uint8Array(digest));
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function sendJson(socket, message) {
  socket.send(JSON.stringify(message));
}

function readAttachment(socket) {
  try {
    return socket.deserializeAttachment() ?? {};
  } catch {
    return {};
  }
}

function writeAttachment(socket, attachment) {
  socket.serializeAttachment(attachment);
}

function parseAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isOriginAllowed(request, env) {
  const allowedOrigins = parseAllowedOrigins(env);
  if (allowedOrigins.length === 0) return true;

  const origin = request.headers.get('origin') ?? '';
  return allowedOrigins.includes(origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const roomId = normalizeRoomCode(url.searchParams.get('room'));

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed.' }, 405);
    }

    if (url.pathname !== '/room') {
      return jsonResponse({ error: 'Not found.' }, 404);
    }

    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
      return jsonResponse({ error: 'Expected a WebSocket upgrade.' }, 426);
    }

    if (roomId.length !== 6) {
      return jsonResponse({ error: 'Invalid room.' }, 400);
    }

    if (!isOriginAllowed(request, env)) {
      return jsonResponse({ error: 'Origin not allowed.' }, 403);
    }

    const roomObjectId = env.COFFEE_RUSH_ROOMS.idFromName(roomId);
    return env.COFFEE_RUSH_ROOMS.get(roomObjectId).fetch(request);
  },
};

export class CoffeeRushRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const roomId = normalizeRoomCode(url.searchParams.get('room'));

    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
      return jsonResponse({ error: 'Expected a WebSocket upgrade.' }, 426);
    }

    if (roomId.length !== 6) {
      return jsonResponse({ error: 'Invalid room.' }, 400);
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    writeAttachment(server, {
      joined: false,
      roomId,
      connectedAt: Date.now(),
      bucket: createTokenBucket(),
    });
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(socket, rawMessage) {
    const attachment = readAttachment(socket);

    if (!attachment.joined && Date.now() - attachment.connectedAt > JOIN_TIMEOUT_MS) {
      this.closeWithError(socket, 'JOIN_TIMEOUT', 'Room join timed out.');
      return;
    }

    const parsed = safeParseRelayEnvelope(rawMessage);
    if (parsed.error) {
      this.closeWithError(
        socket,
        parsed.closeCode === CLOSE_CODES.TOO_LARGE ? 'MESSAGE_TOO_LARGE' : 'BAD_MESSAGE',
        parsed.error,
        parsed.closeCode,
      );
      return;
    }

    const message = parsed.value;

    if (!attachment.joined) {
      await this.handleJoin(socket, message, attachment);
      return;
    }

    if (message?.type === 'PING') {
      sendJson(socket, { type: 'PONG' });
      return;
    }

    if (message?.type === 'CLOSE_ROOM') {
      await this.handleCloseRoom(socket, attachment);
      return;
    }

    await this.handleRoomMessage(socket, message, attachment);
  }

  async webSocketClose(socket) {
    const attachment = readAttachment(socket);
    if (!attachment.joined) return;

    await this.broadcast(
      {
        type: 'PEER_LEAVE',
        peerId: attachment.clientId,
      },
      attachment.clientId,
    );
    await this.markRoomIdleIfEmpty();
  }

  async webSocketError(socket) {
    await this.webSocketClose(socket);
  }

  async alarm() {
    await this.deleteIfIdle();
  }

  async handleJoin(socket, message, attachment) {
    const roomId = attachment.roomId;
    const validationError = validateJoinEnvelope(message, roomId);
    if (validationError) {
      this.closeWithError(socket, 'BAD_JOIN', validationError);
      return;
    }

    const now = Date.now();
    const roomAuth = message.roomAuth ?? message.roomSecret;
    const roomAuthHash = await hashSecret(roomAuth);
    let meta = await this.ctx.storage.get(ROOM_STORAGE_KEY);

    if (meta?.closedAt) {
      this.closeWithError(socket, 'ROOM_CLOSED', 'Room is closed.');
      return;
    }

    if (meta && now - meta.createdAt > ROOM_HARD_TTL_MS) {
      await this.ctx.storage.deleteAll();
      meta = null;
    }

    if (!meta) {
      if (message.role !== 'host') {
        this.closeWithError(socket, 'ROOM_NOT_FOUND', 'Room has not been hosted yet.');
        return;
      }

      meta = {
        roomId,
        roomAuthHash,
        hostAuthHash: await hashSecret(message.hostAuth),
        hostClientId: message.clientId,
        createdAt: now,
        lastActiveAt: now,
        closedAt: 0,
      };
      await this.ctx.storage.put(ROOM_STORAGE_KEY, meta);
    }

    if (meta.roomAuthHash !== roomAuthHash) {
      this.closeWithError(socket, 'BAD_AUTH', 'Invite key does not match this room.');
      return;
    }

    const isHost = message.hostAuth
      ? meta.hostAuthHash === (await hashSecret(message.hostAuth))
      : false;
    const joinedSockets = this.getJoinedSockets();

    if (!isHost && message.role === 'host') {
      this.closeWithError(socket, 'BAD_HOST_AUTH', 'Host auth does not match this room.');
      return;
    }

    if (
      joinedSockets.some(
        (joinedSocket) => readAttachment(joinedSocket).clientId === message.clientId,
      )
    ) {
      this.closeWithError(socket, 'CLIENT_EXISTS', 'Client is already connected.');
      return;
    }

    if (joinedSockets.length >= MAX_ROOM_SOCKETS) {
      this.closeWithError(socket, 'ROOM_FULL', 'Room is full.');
      return;
    }

    writeAttachment(socket, {
      ...attachment,
      joined: true,
      clientId: message.clientId,
      role: isHost ? 'host' : 'peer',
      bucket: createTokenBucket(now),
    });
    await this.touchRoom(now);

    sendJson(socket, {
      type: 'JOIN_ACK',
      clientId: message.clientId,
      peerIds: joinedSockets.map((joinedSocket) => readAttachment(joinedSocket).clientId),
    });
    await this.broadcast(
      {
        type: 'PEER_JOIN',
        peerId: message.clientId,
      },
      message.clientId,
    );
  }

  async handleRoomMessage(socket, message, attachment) {
    const validationError = validateRoomMessageEnvelope(message, attachment.roomId);
    if (validationError) {
      this.closeWithError(socket, 'BAD_ROOM_MESSAGE', validationError);
      return;
    }

    const consumed = consumeToken(attachment.bucket ?? createTokenBucket());
    writeAttachment(socket, {
      ...attachment,
      bucket: consumed.bucket,
    });

    if (!consumed.allowed) {
      this.closeWithError(socket, 'RATE_LIMITED', 'Room message rate limit exceeded.');
      return;
    }

    const payload = {
      type: 'ROOM_MESSAGE',
      from: attachment.clientId,
      data: message.data,
    };
    const target = message.target;

    if (target) {
      const targetSocket = this.getJoinedSockets().find(
        (joinedSocket) => readAttachment(joinedSocket).clientId === target,
      );

      if (!targetSocket) {
        this.closeWithError(socket, 'BAD_TARGET', 'Message target is not connected.');
        return;
      }

      sendJson(targetSocket, payload);
      await this.touchRoom();
      return;
    }

    await this.broadcast(payload, attachment.clientId);
    await this.touchRoom();
  }

  async handleCloseRoom(socket, attachment) {
    if (attachment.role !== 'host') {
      this.closeWithError(socket, 'HOST_ONLY', 'Only the host can close the room.');
      return;
    }

    await this.broadcast(
      {
        type: 'PEER_LEAVE',
        peerId: attachment.clientId,
      },
      attachment.clientId,
    );
    await this.ctx.storage.put(ROOM_STORAGE_KEY, {
      ...((await this.ctx.storage.get(ROOM_STORAGE_KEY)) ?? {}),
      closedAt: Date.now(),
    });
    this.getJoinedSockets().forEach((joinedSocket) => {
      joinedSocket.close(1000, 'ROOM_CLOSED');
    });
    await this.ctx.storage.deleteAll();
  }

  getJoinedSockets() {
    return this.ctx
      .getWebSockets()
      .filter((socket) => readAttachment(socket).joined);
  }

  async broadcast(message, exceptClientId = '') {
    this.getJoinedSockets().forEach((socket) => {
      if (readAttachment(socket).clientId !== exceptClientId) {
        sendJson(socket, message);
      }
    });
  }

  async touchRoom(now = Date.now()) {
    const meta = await this.ctx.storage.get(ROOM_STORAGE_KEY);
    if (meta) {
      await this.ctx.storage.put(ROOM_STORAGE_KEY, {
        ...meta,
        lastActiveAt: now,
      });
    }
  }

  async markRoomIdleIfEmpty() {
    if (this.getJoinedSockets().length > 0) return;

    await this.touchRoom();
    await this.ctx.storage.setAlarm(Date.now() + ROOM_IDLE_TTL_MS);
  }

  async deleteIfIdle() {
    if (this.getJoinedSockets().length > 0) return;

    const meta = await this.ctx.storage.get(ROOM_STORAGE_KEY);
    if (!meta || Date.now() - meta.lastActiveAt >= ROOM_IDLE_TTL_MS) {
      await this.ctx.storage.deleteAll();
      return;
    }

    await this.ctx.storage.setAlarm(meta.lastActiveAt + ROOM_IDLE_TTL_MS);
  }

  closeWithError(
    socket,
    code,
    message,
    closeCode = CLOSE_CODES.POLICY_VIOLATION,
  ) {
    try {
      sendJson(socket, {
        type: 'ERROR',
        code,
        message,
      });
    } finally {
      socket.close(closeCode, code);
    }
  }
}
