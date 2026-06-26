import { DurableObject } from 'cloudflare:workers';
import {
  ASYNC_PROTOCOL_VERSION,
  ASYNC_ROOM_TTL_MS,
  CLOSE_CODES,
  JOIN_TIMEOUT_MS,
  MAX_HTTP_BODY_BYTES,
  MAX_ROOM_SOCKETS,
  ROOM_HARD_TTL_MS,
  ROOM_IDLE_TTL_MS,
  createNotificationRosterHeadPayload,
  hashCommitEnvelope,
  hashNotificationRosterEnvelope,
  createTokenBucket,
  consumeToken,
  isNotificationRosterUpdateStale,
  normalizeRoomCode,
  safeParseRelayEnvelope,
  validateCloseRoomRequest,
  validateCommitRequest,
  validateCreateRoomRequest,
  validateHeadRequest,
  validateJoinEnvelope,
  validateNotificationRosterHeadRequest,
  validateNotificationRosterUpdateRequest,
  validateRoomMessageEnvelope,
  validateSnapshotRequest,
} from './protocol.js';

const ROOM_STORAGE_KEY = 'room';
const TEXT_ENCODER = new TextEncoder();
const ASYNC_ROOM_PATH_PREFIX = '/room/';

const SQL_SCHEMA = `
  CREATE TABLE IF NOT EXISTS room_meta (
    room_id TEXT PRIMARY KEY,
    protocol INTEGER NOT NULL,
    room_auth_hash TEXT NOT NULL,
    host_auth_hash TEXT,
    created_at INTEGER NOT NULL,
    last_move_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    closed_at INTEGER NOT NULL DEFAULT 0,
    head_index INTEGER NOT NULL DEFAULT 0,
    head_hash TEXT NOT NULL,
    latest_snapshot_index INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS commits (
    room_id TEXT NOT NULL,
    commit_index INTEGER NOT NULL,
    prev_hash TEXT NOT NULL,
    commit_hash TEXT NOT NULL,
    encrypted_commit TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (room_id, commit_index)
  );
  CREATE TABLE IF NOT EXISTS snapshots (
    room_id TEXT NOT NULL,
    snapshot_index INTEGER NOT NULL,
    head_hash TEXT NOT NULL,
    encrypted_snapshot TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (room_id, snapshot_index)
  );
  CREATE TABLE IF NOT EXISTS notification_rosters (
    room_id TEXT PRIMARY KEY,
    roster_hash TEXT NOT NULL,
    encrypted_roster TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

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

function timingSafeEqualText(left, right) {
  const leftBytes = TEXT_ENCODER.encode(String(left ?? ''));
  const rightBytes = TEXT_ENCODER.encode(String(right ?? ''));
  const safeLeft = leftBytes.length > 0 ? leftBytes : new Uint8Array([0]);
  const safeRight = rightBytes.length > 0 ? rightBytes : new Uint8Array([0]);
  const maxLength = Math.max(safeLeft.length, safeRight.length, 1);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= safeLeft[index % safeLeft.length] ^ safeRight[index % safeRight.length];
  }

  return diff === 0;
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
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

function createCorsHeaders(request, env) {
  const origin = request.headers.get('origin') ?? '';
  const allowedOrigins = parseAllowedOrigins(env);

  if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return {};
  }

  return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  };
}

function addCors(response, request, env) {
  const headers = new Headers(response.headers);
  Object.entries(createCorsHeaders(request, env)).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readJsonBody(request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_HTTP_BODY_BYTES) {
    return { error: 'Request body is too large.', status: 413 };
  }

  const raw = await request.text();
  if (TEXT_ENCODER.encode(raw).length > MAX_HTTP_BODY_BYTES) {
    return { error: 'Request body is too large.', status: 413 };
  }

  try {
    return { value: JSON.parse(raw) };
  } catch {
    return { error: 'Request body is not valid JSON.', status: 400 };
  }
}

function firstRow(cursor) {
  const result = cursor.next();
  return result.done ? null : result.value;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const roomId = normalizeRoomCode(url.searchParams.get('room'));

    if (url.pathname.startsWith(ASYNC_ROOM_PATH_PREFIX)) {
      if (!isOriginAllowed(request, env)) {
        return jsonResponse(
          { error: 'Origin not allowed.' },
          403,
          createCorsHeaders(request, env),
        );
      }

      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: createCorsHeaders(request, env),
        });
      }

      if (request.method !== 'POST') {
        return jsonResponse(
          { error: 'Method not allowed.' },
          405,
          createCorsHeaders(request, env),
        );
      }

      if (roomId.length !== 6) {
        return jsonResponse(
          { error: 'Invalid room.' },
          400,
          createCorsHeaders(request, env),
        );
      }

      const roomObjectId = env.COFFEE_RUSH_ROOMS.idFromName(roomId);
      const response = await env.COFFEE_RUSH_ROOMS.get(roomObjectId).fetch(request);
      return addCors(response, request, env);
    }

    if (url.pathname !== '/room') {
      return jsonResponse({ error: 'Not found.' }, 404);
    }

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed.' }, 405);
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
    this.ctx.blockConcurrencyWhile(async () => {
      this.ensureSqlSchema();
    });
  }

  ensureSqlSchema() {
    this.ctx.storage.sql.exec(SQL_SCHEMA);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const roomId = normalizeRoomCode(url.searchParams.get('room'));

    if (url.pathname.startsWith(ASYNC_ROOM_PATH_PREFIX)) {
      return this.handleAsyncRequest(request, url, roomId);
    }

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

  async handleAsyncRequest(request, url, roomId) {
    this.ensureSqlSchema();

    if (roomId.length !== 6) {
      return jsonResponse({ error: 'Invalid room.' }, 400);
    }

    const action = url.pathname.slice(ASYNC_ROOM_PATH_PREFIX.length);
    const parsed = await readJsonBody(request);
    if (parsed.error) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: parsed.error }, parsed.status);
    }

    switch (action) {
      case 'create':
        return this.handleAsyncCreate(roomId, parsed.value);
      case 'head':
        return this.handleAsyncHead(roomId, parsed.value);
      case 'commits':
        return this.handleAsyncCommit(roomId, parsed.value);
      case 'snapshot':
        return this.handleAsyncSnapshot(roomId, parsed.value);
      case 'notifications/head':
        return this.handleAsyncNotificationHead(roomId, parsed.value);
      case 'notifications/update':
        return this.handleAsyncNotificationUpdate(roomId, parsed.value);
      case 'close':
        return this.handleAsyncClose(roomId, parsed.value);
      default:
        return jsonResponse(
          { protocol: ASYNC_PROTOCOL_VERSION, error: 'Not found.' },
          404,
        );
    }
  }

  getAsyncMeta(roomId) {
    return firstRow(
      this.ctx.storage.sql.exec(
        `SELECT
          room_id AS roomId,
          protocol,
          room_auth_hash AS roomAuthHash,
          host_auth_hash AS hostAuthHash,
          created_at AS createdAt,
          last_move_at AS lastMoveAt,
          expires_at AS expiresAt,
          closed_at AS closedAt,
          head_index AS headIndex,
          head_hash AS headHash,
          latest_snapshot_index AS latestSnapshotIndex
        FROM room_meta
        WHERE room_id = ?`,
        roomId,
      ),
    );
  }

  async deleteRoomStorage() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  async deleteIfExpired(meta, now = Date.now()) {
    if (!meta) return true;

    if (meta.closedAt || now >= meta.expiresAt) {
      await this.deleteRoomStorage();
      return true;
    }

    return false;
  }

  async verifyRoomAuth(meta, roomAuth) {
    const roomAuthHash = await hashSecret(roomAuth);
    return timingSafeEqualText(meta.roomAuthHash, roomAuthHash);
  }

  async verifyHostAuth(meta, hostAuth) {
    const hostAuthHash = await hashSecret(hostAuth);
    return Boolean(meta.hostAuthHash) && timingSafeEqualText(meta.hostAuthHash, hostAuthHash);
  }

  async handleAsyncCreate(roomId, body) {
    const validationError = validateCreateRoomRequest(body);
    if (validationError) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: validationError }, 400);
    }

    const now = Date.now();
    const existingMeta = this.getAsyncMeta(roomId);
    if (existingMeta) {
      if (!(await this.deleteIfExpired(existingMeta, now))) {
        return jsonResponse(
          { protocol: ASYNC_PROTOCOL_VERSION, error: 'ROOM_EXISTS' },
          409,
        );
      }

      this.ensureSqlSchema();
    }

    const expiresAt = now + ASYNC_ROOM_TTL_MS;
    const roomAuthHash = await hashSecret(body.roomAuth);
    const hostAuthHash = body.hostAuth ? await hashSecret(body.hostAuth) : '';
    const snapshotText = JSON.stringify(body.initialSnapshot);

    this.ctx.storage.sql.exec(
      `INSERT INTO room_meta (
        room_id,
        protocol,
        room_auth_hash,
        host_auth_hash,
        created_at,
        last_move_at,
        expires_at,
        closed_at,
        head_index,
        head_hash,
        latest_snapshot_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 0)`,
      roomId,
      ASYNC_PROTOCOL_VERSION,
      roomAuthHash,
      hostAuthHash,
      now,
      now,
      expiresAt,
      body.headHash,
    );
    this.ctx.storage.sql.exec(
      `INSERT INTO snapshots (
        room_id,
        snapshot_index,
        head_hash,
        encrypted_snapshot,
        created_at
      ) VALUES (?, 0, ?, ?, ?)`,
      roomId,
      body.headHash,
      snapshotText,
      now,
    );
    await this.ctx.storage.setAlarm(expiresAt);

    return jsonResponse({
      protocol: ASYNC_PROTOCOL_VERSION,
      accepted: true,
      headIndex: 0,
      headHash: body.headHash,
      latestSnapshotIndex: 0,
      expiresAt,
    });
  }

  async handleAsyncHead(roomId, body) {
    const validationError = validateHeadRequest(body);
    if (validationError) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: validationError }, 400);
    }

    const meta = this.getAsyncMeta(roomId);
    if (await this.deleteIfExpired(meta)) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'ROOM_NOT_FOUND' }, 404);
    }

    if (!(await this.verifyRoomAuth(meta, body.roomAuth))) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_AUTH' }, 403);
    }

    const knownHeadIndex = Number.isInteger(body.knownHeadIndex)
      ? body.knownHeadIndex
      : -1;
    const knownHeadHash = String(body.knownHeadHash ?? '');
    const response = {
      protocol: ASYNC_PROTOCOL_VERSION,
      headIndex: meta.headIndex,
      headHash: meta.headHash,
      latestSnapshotIndex: meta.latestSnapshotIndex,
      expiresAt: meta.expiresAt,
      commits: [],
    };

    if (
      knownHeadIndex === meta.headIndex &&
      (!knownHeadHash || knownHeadHash === meta.headHash)
    ) {
      return jsonResponse(response);
    }

    if (knownHeadIndex >= meta.latestSnapshotIndex && knownHeadIndex < meta.headIndex) {
      response.commits = this.getCommitsAfter(roomId, knownHeadIndex);
      return jsonResponse(response);
    }

    const snapshot = this.getSnapshot(roomId, meta.latestSnapshotIndex);
    response.latestSnapshot = snapshot?.encryptedSnapshot ?? null;
    response.latestSnapshotHeadHash = snapshot?.headHash ?? '';
    response.commits = this.getCommitsAfter(roomId, meta.latestSnapshotIndex);
    return jsonResponse(response);
  }

  async handleAsyncCommit(roomId, body) {
    const validationError = validateCommitRequest(body);
    if (validationError) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: validationError }, 400);
    }

    const expectedCommitHash = await hashCommitEnvelope({
      roomId,
      commitIndex: body.expectedHeadIndex + 1,
      prevHeadHash: body.prevHeadHash,
      encryptedCommit: body.encryptedCommit,
    });

    if (!timingSafeEqualText(expectedCommitHash, body.commitHash)) {
      return jsonResponse(
        { protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_COMMIT_HASH' },
        400,
      );
    }

    const meta = this.getAsyncMeta(roomId);
    if (await this.deleteIfExpired(meta)) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'ROOM_NOT_FOUND' }, 404);
    }

    if (!(await this.verifyRoomAuth(meta, body.roomAuth))) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_AUTH' }, 403);
    }

    if (
      body.expectedHeadIndex !== meta.headIndex ||
      body.prevHeadHash !== meta.headHash
    ) {
      return jsonResponse({
        protocol: ASYNC_PROTOCOL_VERSION,
        accepted: false,
        error: 'STALE_HEAD',
        headIndex: meta.headIndex,
        headHash: meta.headHash,
      }, 409);
    }

    const now = Date.now();
    const commitIndex = meta.headIndex + 1;
    const expiresAt = now + ASYNC_ROOM_TTL_MS;

    this.ctx.storage.sql.exec(
      `INSERT INTO commits (
        room_id,
        commit_index,
        prev_hash,
        commit_hash,
        encrypted_commit,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      roomId,
      commitIndex,
      meta.headHash,
      body.commitHash,
      JSON.stringify(body.encryptedCommit),
      now,
    );
    this.ctx.storage.sql.exec(
      `INSERT INTO snapshots (
        room_id,
        snapshot_index,
        head_hash,
        encrypted_snapshot,
        created_at
      ) VALUES (?, ?, ?, ?, ?)`,
      roomId,
      commitIndex,
      body.commitHash,
      JSON.stringify(body.encryptedSnapshot),
      now,
    );
    this.ctx.storage.sql.exec(
      `UPDATE room_meta
      SET last_move_at = ?,
        expires_at = ?,
        head_index = ?,
        head_hash = ?,
        latest_snapshot_index = ?
      WHERE room_id = ?`,
      now,
      expiresAt,
      commitIndex,
      body.commitHash,
      commitIndex,
      roomId,
    );
    await this.ctx.storage.setAlarm(expiresAt);

    return jsonResponse({
      protocol: ASYNC_PROTOCOL_VERSION,
      accepted: true,
      headIndex: commitIndex,
      headHash: body.commitHash,
      latestSnapshotIndex: commitIndex,
      expiresAt,
    });
  }

  async handleAsyncSnapshot(roomId, body) {
    const validationError = validateSnapshotRequest(body);
    if (validationError) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: validationError }, 400);
    }

    const meta = this.getAsyncMeta(roomId);
    if (await this.deleteIfExpired(meta)) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'ROOM_NOT_FOUND' }, 404);
    }

    if (!(await this.verifyRoomAuth(meta, body.roomAuth))) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_AUTH' }, 403);
    }

    if (body.headIndex !== meta.headIndex || body.headHash !== meta.headHash) {
      return jsonResponse({
        protocol: ASYNC_PROTOCOL_VERSION,
        accepted: false,
        error: 'STALE_HEAD',
        headIndex: meta.headIndex,
        headHash: meta.headHash,
      }, 409);
    }

    const now = Date.now();
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO snapshots (
        room_id,
        snapshot_index,
        head_hash,
        encrypted_snapshot,
        created_at
      ) VALUES (?, ?, ?, ?, ?)`,
      roomId,
      body.headIndex,
      body.headHash,
      JSON.stringify(body.encryptedSnapshot),
      now,
    );
    this.ctx.storage.sql.exec(
      `UPDATE room_meta
      SET latest_snapshot_index = ?
      WHERE room_id = ?`,
      body.headIndex,
      roomId,
    );

    return jsonResponse({
      protocol: ASYNC_PROTOCOL_VERSION,
      accepted: true,
      headIndex: meta.headIndex,
      headHash: meta.headHash,
      latestSnapshotIndex: body.headIndex,
    });
  }

  async handleAsyncNotificationHead(roomId, body) {
    const validationError = validateNotificationRosterHeadRequest(body);
    if (validationError) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: validationError }, 400);
    }

    const meta = this.getAsyncMeta(roomId);
    if (await this.deleteIfExpired(meta)) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'ROOM_NOT_FOUND' }, 404);
    }

    if (!(await this.verifyRoomAuth(meta, body.roomAuth))) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_AUTH' }, 403);
    }

    return jsonResponse(createNotificationRosterHeadPayload(this.getNotificationRoster(roomId)));
  }

  async handleAsyncNotificationUpdate(roomId, body) {
    const validationError = validateNotificationRosterUpdateRequest(body);
    if (validationError) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: validationError }, 400);
    }

    const expectedRosterHash = await hashNotificationRosterEnvelope({
      roomId,
      encryptedRoster: body.encryptedRoster,
    });

    if (!timingSafeEqualText(expectedRosterHash, body.rosterHash)) {
      return jsonResponse(
        { protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_NOTIFICATION_ROSTER_HASH' },
        400,
      );
    }

    const meta = this.getAsyncMeta(roomId);
    if (await this.deleteIfExpired(meta)) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'ROOM_NOT_FOUND' }, 404);
    }

    if (!(await this.verifyRoomAuth(meta, body.roomAuth))) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_AUTH' }, 403);
    }

    const currentRoster = this.getNotificationRoster(roomId);
    const currentRosterHash = currentRoster?.rosterHash ?? '';
    if (isNotificationRosterUpdateStale(currentRosterHash, body.previousRosterHash ?? '')) {
      return jsonResponse({
        ...createNotificationRosterHeadPayload(currentRoster),
        accepted: false,
        error: 'STALE_NOTIFICATION_ROSTER',
      }, 409);
    }

    const now = Date.now();
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO notification_rosters (
        room_id,
        roster_hash,
        encrypted_roster,
        updated_at
      ) VALUES (?, ?, ?, ?)`,
      roomId,
      body.rosterHash,
      JSON.stringify(body.encryptedRoster),
      now,
    );

    return jsonResponse({
      ...createNotificationRosterHeadPayload({
        rosterHash: body.rosterHash,
        encryptedRoster: body.encryptedRoster,
        updatedAt: now,
      }),
      accepted: true,
    });
  }

  async handleAsyncClose(roomId, body) {
    const validationError = validateCloseRoomRequest(body);
    if (validationError) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: validationError }, 400);
    }

    const meta = this.getAsyncMeta(roomId);
    if (await this.deleteIfExpired(meta)) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'ROOM_NOT_FOUND' }, 404);
    }

    if (!(await this.verifyRoomAuth(meta, body.roomAuth))) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_AUTH' }, 403);
    }

    if (!(await this.verifyHostAuth(meta, body.hostAuth))) {
      return jsonResponse({ protocol: ASYNC_PROTOCOL_VERSION, error: 'BAD_HOST_AUTH' }, 403);
    }

    await this.deleteRoomStorage();

    return jsonResponse({
      protocol: ASYNC_PROTOCOL_VERSION,
      accepted: true,
    });
  }

  getSnapshot(roomId, snapshotIndex) {
    const row = firstRow(
      this.ctx.storage.sql.exec(
        `SELECT
          snapshot_index AS snapshotIndex,
          head_hash AS headHash,
          encrypted_snapshot AS encryptedSnapshot
        FROM snapshots
        WHERE room_id = ? AND snapshot_index = ?`,
        roomId,
        snapshotIndex,
      ),
    );

    if (!row) return null;

    return {
      ...row,
      encryptedSnapshot: JSON.parse(row.encryptedSnapshot),
    };
  }

  getCommitsAfter(roomId, headIndex) {
    return this.ctx.storage.sql
      .exec(
        `SELECT
          commit_index AS commitIndex,
          prev_hash AS prevHash,
          commit_hash AS commitHash,
          encrypted_commit AS encryptedCommit,
          created_at AS createdAt
        FROM commits
        WHERE room_id = ? AND commit_index > ?
        ORDER BY commit_index ASC`,
        roomId,
        headIndex,
      )
      .toArray()
      .map((row) => ({
        ...row,
        encryptedCommit: JSON.parse(row.encryptedCommit),
      }));
  }

  getNotificationRoster(roomId) {
    const row = firstRow(
      this.ctx.storage.sql.exec(
        `SELECT
          roster_hash AS rosterHash,
          encrypted_roster AS encryptedRoster,
          updated_at AS updatedAt
        FROM notification_rosters
        WHERE room_id = ?`,
        roomId,
      ),
    );

    if (!row) return null;

    return {
      ...row,
      encryptedRoster: JSON.parse(row.encryptedRoster),
    };
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
    const asyncMeta = firstRow(
      this.ctx.storage.sql.exec(
        `SELECT
          room_id AS roomId,
          expires_at AS expiresAt,
          closed_at AS closedAt
        FROM room_meta
        LIMIT 1`,
      ),
    );

    if (asyncMeta) {
      await this.deleteIfExpired(asyncMeta);
      return;
    }

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
    await this.deleteRoomStorage();
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
      await this.deleteRoomStorage();
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
