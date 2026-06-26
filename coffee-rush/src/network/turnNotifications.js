import turnReminderTemplates from '../data/turnReminderTemplates.json';
import { normalizeRoomCode } from '../persistence/remoteSession';
import {
  ASYNC_PROTOCOL_VERSION,
  AsyncRoomError,
  createAsyncEndpointUrl,
} from './asyncRoom';
import {
  canonicalJson,
  createRoomCipher,
  isEncryptedEnvelope,
  sha256Base64Url,
} from './roomCrypto';

export const NOTIFICATION_ROSTER_VERSION = 1;
export const WHATSAPP_COUNTRY_OPTIONS = [
  { country: 'US', label: 'US (+1)', countryCode: '1' },
  { country: 'UK', label: 'UK (+44)', countryCode: '44' },
];

const HASH_PATTERN = /^[A-Za-z0-9_-]{32,96}$/;
const PLAYER_ID_PATTERN = /^p[1-4]$/;
const NATIONAL_DIGITS_PATTERN = /^\d{7,11}$/;
const WHATSAPP_NUMBER_PATTERN = /^\d{8,15}$/;
const DEFAULT_ROOM_LINK_URL = 'https://vanshkumar.net/coffee-rush/#/game';
const DEFAULT_TURN_REMINDER_TEMPLATE =
  '{name}, it is your turn in Coffee Rush. Open your room here: {room}';

export function getWhatsAppCountryOption(country) {
  const normalizedCountry = String(country ?? '').trim().toUpperCase();
  return WHATSAPP_COUNTRY_OPTIONS.find((option) => option.country === normalizedCountry) ?? null;
}

function stripSelectedCountryPrefix(digits, countryCode) {
  const selectedPrefixes = [`00${countryCode}`, `011${countryCode}`, countryCode];
  const prefix = selectedPrefixes.find(
    (candidate) =>
      digits.startsWith(candidate) &&
      digits.length - candidate.length >= 7 &&
      digits.length - candidate.length <= 11,
  );

  return prefix ? digits.slice(prefix.length) : digits;
}

export function normalizeWhatsAppContact({
  country,
  nationalNumber,
  now = new Date(),
}) {
  const option = getWhatsAppCountryOption(country);

  if (!option) {
    return { error: 'Choose US or UK.' };
  }

  let digits = String(nationalNumber ?? '').replace(/\D/g, '');
  digits = stripSelectedCountryPrefix(digits, option.countryCode);

  if (option.country === 'UK') {
    digits = digits.replace(/^0+/u, '');
  }

  if (option.country === 'US' && digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  if (!NATIONAL_DIGITS_PATTERN.test(digits)) {
    return { error: 'Enter 7 to 11 digits.' };
  }

  return {
    contact: {
      method: 'whatsapp',
      country: option.country,
      countryCode: option.countryCode,
      nationalNumber: digits,
      whatsappNumber: `${option.countryCode}${digits}`,
      updatedAt: now.toISOString(),
    },
  };
}

export function createTurnReminderRoomUrl(roomId, location = globalThis.window?.location) {
  let url;

  try {
    url = new URL(location?.href ?? DEFAULT_ROOM_LINK_URL);
  } catch {
    url = new URL(DEFAULT_ROOM_LINK_URL);
  }

  url.searchParams.set('room', normalizeRoomCode(roomId));
  url.searchParams.delete('auth');
  url.searchParams.delete('key');
  url.hash = '#/game';
  return url.toString();
}

function hasReminderPlaceholders(template) {
  return (
    typeof template === 'string' &&
    template.includes('{name}') &&
    template.includes('{room}')
  );
}

export function getTurnReminderTemplates(country) {
  const option = getWhatsAppCountryOption(country);
  const templates = option ? turnReminderTemplates[option.country] : null;
  return (Array.isArray(templates) ? templates : []).filter(hasReminderPlaceholders);
}

function pickTurnReminderTemplate(country, random = Math.random) {
  const templates = getTurnReminderTemplates(country);
  if (templates.length === 0) return DEFAULT_TURN_REMINDER_TEMPLATE;

  const randomValue = Number(random?.());
  const normalizedRandom =
    Number.isFinite(randomValue) && randomValue >= 0 && randomValue < 1 ? randomValue : 0;
  const index = Math.min(
    templates.length - 1,
    Math.floor(normalizedRandom * templates.length),
  );
  return templates[index];
}

function normalizeReminderPlayerName(playerName) {
  const name = String(playerName ?? '').replace(/\s+/gu, ' ').trim();
  return name || 'Barista';
}

function formatTurnReminderTemplate(template, { playerName, roomUrl }) {
  return template
    .replaceAll('{name}', normalizeReminderPlayerName(playerName))
    .replaceAll('{room}', roomUrl);
}

export function createTurnReminderMessage(
  options,
  legacyLocation = globalThis.window?.location,
) {
  const normalizedOptions =
    typeof options === 'object' && options !== null
      ? options
      : { roomId: options, location: legacyLocation };
  const roomUrl = createTurnReminderRoomUrl(
    normalizedOptions.roomId,
    normalizedOptions.location ?? legacyLocation,
  );
  const template = pickTurnReminderTemplate(
    normalizedOptions.country,
    normalizedOptions.random,
  );
  return formatTurnReminderTemplate(template, {
    playerName: normalizedOptions.playerName,
    roomUrl,
  });
}

export function createWhatsAppUrl(whatsappNumber, message) {
  const number = String(whatsappNumber ?? '').replace(/\D/g, '');
  if (!WHATSAPP_NUMBER_PATTERN.test(number)) return '';

  return `https://wa.me/${number}?text=${encodeURIComponent(String(message ?? ''))}`;
}

export function createEmptyNotificationRoster(roomId) {
  return {
    version: NOTIFICATION_ROSTER_VERSION,
    roomId: normalizeRoomCode(roomId),
    contacts: {},
  };
}

function isValidPlayerId(playerId) {
  return PLAYER_ID_PATTERN.test(String(playerId ?? ''));
}

function isValidNotificationContact(contact) {
  const option = getWhatsAppCountryOption(contact?.country);
  return (
    contact?.method === 'whatsapp' &&
    Boolean(option) &&
    contact.countryCode === option.countryCode &&
    NATIONAL_DIGITS_PATTERN.test(String(contact.nationalNumber ?? '')) &&
    contact.whatsappNumber === `${contact.countryCode}${contact.nationalNumber}` &&
    typeof contact.updatedAt === 'string'
  );
}

export function normalizeNotificationRoster(value, roomId) {
  const normalizedRoomId = normalizeRoomCode(roomId ?? value?.roomId);
  const roster = createEmptyNotificationRoster(normalizedRoomId);

  if (
    value?.version !== NOTIFICATION_ROSTER_VERSION ||
    normalizeRoomCode(value.roomId) !== normalizedRoomId ||
    value.contacts === null ||
    typeof value.contacts !== 'object' ||
    Array.isArray(value.contacts)
  ) {
    return roster;
  }

  Object.entries(value.contacts).forEach(([playerId, contact]) => {
    if (isValidPlayerId(playerId) && isValidNotificationContact(contact)) {
      roster.contacts[playerId] = { ...contact };
    }
  });

  return roster;
}

export function upsertNotificationContact(roster, playerId, contact) {
  if (!isValidPlayerId(playerId) || !isValidNotificationContact(contact)) {
    throw new Error('Invalid notification contact.');
  }

  return {
    ...roster,
    contacts: {
      ...(roster?.contacts ?? {}),
      [playerId]: { ...contact },
    },
  };
}

export function clearNotificationContact(roster, playerId) {
  if (!isValidPlayerId(playerId)) {
    throw new Error('Invalid notification player.');
  }

  const contacts = { ...(roster?.contacts ?? {}) };
  delete contacts[playerId];
  return {
    ...roster,
    contacts,
  };
}

export function getLocalNotificationContact(roster, localPlayerId) {
  if (!isValidPlayerId(localPlayerId)) return null;
  return roster?.contacts?.[localPlayerId] ?? null;
}

export function getNotificationRosterDisplay(players, roster) {
  return (Array.isArray(players) ? players : []).map((player) => {
    const contact = roster?.contacts?.[player.id] ?? null;

    return {
      playerId: player.id,
      name: player.name,
      status: contact ? 'set' : 'missing',
    };
  });
}

function createNotificationRosterAad(roomId) {
  return {
    roomId: normalizeRoomCode(roomId),
    protocol: ASYNC_PROTOCOL_VERSION,
    kind: 'notification-roster',
  };
}

export async function hashNotificationRosterEnvelope({ roomId, encryptedRoster }) {
  return sha256Base64Url(
    [
      'coffee-rush:v2:notifications',
      normalizeRoomCode(roomId),
      canonicalJson(encryptedRoster),
    ].join(':'),
  );
}

export async function encryptNotificationRoster(session, roster) {
  const cipher = await createRoomCipher(session.gameKey);
  const normalizedRoster = normalizeNotificationRoster(roster, session.roomId);
  return cipher.encrypt(normalizedRoster, {
    aad: createNotificationRosterAad(session.roomId),
  });
}

export async function decryptNotificationRoster(session, encryptedRoster) {
  if (!encryptedRoster) {
    return createEmptyNotificationRoster(session.roomId);
  }

  if (!isEncryptedEnvelope(encryptedRoster)) {
    throw new AsyncRoomError('The notification roster is not encrypted.');
  }

  const cipher = await createRoomCipher(session.gameKey);
  const payload = await cipher.decrypt(encryptedRoster, {
    aad: createNotificationRosterAad(session.roomId),
  });
  const roster = normalizeNotificationRoster(payload, session.roomId);

  if (roster.roomId !== normalizeRoomCode(session.roomId)) {
    throw new AsyncRoomError('The notification roster did not validate.');
  }

  return roster;
}

function isValidRosterHash(value) {
  return value === '' || HASH_PATTERN.test(String(value ?? ''));
}

function validateNotificationHeadResponse(response) {
  if (
    response?.protocol !== ASYNC_PROTOCOL_VERSION ||
    !isValidRosterHash(response.rosterHash) ||
    (
      response.encryptedRoster !== null &&
      response.encryptedRoster !== undefined &&
      !isEncryptedEnvelope(response.encryptedRoster)
    ) ||
    !Number.isInteger(Number(response.updatedAt ?? 0))
  ) {
    throw new AsyncRoomError('The notification roster response was malformed.');
  }

  return {
    ...response,
    rosterHash: response.rosterHash ?? '',
    encryptedRoster: response.encryptedRoster ?? null,
    updatedAt: Number(response.updatedAt ?? 0),
  };
}

async function postNotificationEndpoint(session, endpoint, body) {
  const response = await fetch(createAsyncEndpointUrl(undefined, endpoint, session.roomId), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      protocol: ASYNC_PROTOCOL_VERSION,
      ...body,
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok && payload?.error !== 'STALE_NOTIFICATION_ROSTER') {
    throw new AsyncRoomError(payload?.error ?? 'The notification roster request failed.', {
      code: payload?.error ?? '',
      status: response.status,
    });
  }

  return payload;
}

export async function fetchNotificationRosterHead(session) {
  const response = await postNotificationEndpoint(session, 'notifications/head', {
    roomAuth: session.relayAuth,
  });

  return validateNotificationHeadResponse(response);
}

export async function loadNotificationRoster(session) {
  const head = await fetchNotificationRosterHead(session);
  const roster = await decryptNotificationRoster(session, head.encryptedRoster);

  return {
    ...head,
    roster,
  };
}

export async function saveNotificationRoster(session, roster, previousRosterHash = '') {
  const encryptedRoster = await encryptNotificationRoster(session, roster);
  const rosterHash = await hashNotificationRosterEnvelope({
    roomId: session.roomId,
    encryptedRoster,
  });
  const response = await postNotificationEndpoint(session, 'notifications/update', {
    roomAuth: session.relayAuth,
    previousRosterHash,
    rosterHash,
    encryptedRoster,
  });
  const head = validateNotificationHeadResponse(response);

  if (response?.accepted === false && response.error === 'STALE_NOTIFICATION_ROSTER') {
    return {
      ...head,
      accepted: false,
      error: response.error,
      roster: await decryptNotificationRoster(session, head.encryptedRoster),
    };
  }

  if (response?.accepted !== true || head.rosterHash !== rosterHash) {
    throw new AsyncRoomError('The relay did not accept the notification roster.');
  }

  return {
    ...head,
    accepted: true,
    roster,
  };
}

export function createAcceptedTurnReminder({
  session,
  actions,
  resultState,
  commitResponse,
  roster,
  random,
}) {
  if (
    commitResponse?.accepted !== true ||
    !Array.isArray(actions) ||
    actions[actions.length - 1]?.type !== 'END_TURN' ||
    resultState?.phase === 'gameOver'
  ) {
    return null;
  }

  const nextPlayer = resultState?.players?.find(
    (player) => player.id === resultState.activePlayerId,
  );
  const contact = nextPlayer ? roster?.contacts?.[nextPlayer.id] : null;

  if (!nextPlayer || contact?.method !== 'whatsapp' || !contact.whatsappNumber) {
    return null;
  }

  const message = createTurnReminderMessage({
    roomId: session.roomId,
    playerName: nextPlayer.name,
    country: contact.country,
    random,
  });
  const whatsappUrl = createWhatsAppUrl(contact.whatsappNumber, message);
  if (!whatsappUrl) return null;

  return {
    playerId: nextPlayer.id,
    playerName: nextPlayer.name,
    roomId: normalizeRoomCode(session.roomId),
    message,
    whatsappUrl,
  };
}

export function openWhatsAppDraft(whatsappUrl, windowObject = globalThis.window) {
  const url = String(whatsappUrl ?? '').trim();
  if (!url || !windowObject) return false;

  try {
    if (typeof windowObject.location?.assign === 'function') {
      windowObject.location.assign(url);
      return true;
    }

    if (windowObject.location && 'href' in windowObject.location) {
      windowObject.location.href = url;
      return true;
    }
  } catch {
    // Fall through to window.open for test doubles or locked-down browsers.
  }

  const opened = windowObject.open?.(url, '_self');
  return Boolean(opened);
}
