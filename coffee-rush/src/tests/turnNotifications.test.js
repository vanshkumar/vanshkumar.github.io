import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearNotificationContact,
  createAcceptedTurnReminder,
  createEmptyNotificationRoster,
  createTurnReminderMessage,
  createTurnReminderRoomUrl,
  createWhatsAppUrl,
  decryptNotificationRoster,
  encryptNotificationRoster,
  getLocalNotificationContact,
  getNotificationRosterDisplay,
  getTurnReminderTemplates,
  hashNotificationRosterEnvelope,
  loadNotificationRoster,
  normalizeWhatsAppContact,
  openWhatsAppDraft,
  saveNotificationRoster,
  upsertNotificationContact,
} from '../network/turnNotifications';
import {
  REMOTE_MODES,
  createRemoteSession,
} from '../persistence/remoteSession';

const RELAY_AUTH = 'relay_auth_token';
const HOST_AUTH = 'host_auth_token1';
const GAME_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const NOW = new Date('2026-06-26T00:00:00.000Z');

function createSession(overrides = {}) {
  return createRemoteSession({
    mode: REMOTE_MODES.HOST,
    roomId: 'ab12cd',
    relayAuth: RELAY_AUTH,
    hostAuth: HOST_AUTH,
    gameKey: GAME_KEY,
    ...overrides,
  });
}

function normalize(country, nationalNumber) {
  const result = normalizeWhatsAppContact({ country, nationalNumber, now: NOW });
  expect(result.error).toBeUndefined();
  return result.contact;
}

describe('turn notification helpers', () => {
  beforeEach(() => {
    globalThis.window = {
      location: new URL('https://example.test/coffee-rush/?relay=wss://relay.example.test/room'),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.fetch;
    delete globalThis.window;
  });

  it('normalizes US, UK, and Canada WhatsApp numbers from national input', () => {
    expect(normalize('US', '(415) 555-1212')).toMatchObject({
      country: 'US',
      countryCode: '1',
      nationalNumber: '4155551212',
      whatsappNumber: '14155551212',
    });
    expect(normalize('US', '+1 415 555 1212').nationalNumber).toBe('4155551212');
    expect(normalize('UK', '07700 900123')).toMatchObject({
      country: 'UK',
      countryCode: '44',
      nationalNumber: '7700900123',
      whatsappNumber: '447700900123',
    });
    expect(normalize('UK', '+44 7700 900123').nationalNumber).toBe('7700900123');
    expect(normalize('CA', '(416) 555-1212')).toMatchObject({
      country: 'CA',
      countryCode: '1',
      nationalNumber: '4165551212',
      whatsappNumber: '14165551212',
    });
    expect(normalize('CA', '+1 416 555 1212').nationalNumber).toBe('4165551212');

    expect(normalizeWhatsAppContact({ country: 'MX', nationalNumber: '5555551212' })).toMatchObject({
      error: 'Choose US, UK, or Canada.',
    });
    expect(normalizeWhatsAppContact({ country: 'US', nationalNumber: '123456' })).toMatchObject({
      error: 'Enter 7 to 11 digits.',
    });
    expect(
      normalizeWhatsAppContact({ country: 'UK', nationalNumber: '123456789012' }),
    ).toMatchObject({
      error: 'Enter 7 to 11 digits.',
    });
  });

  it('builds WhatsApp URLs without room secrets in the message text', () => {
    globalThis.window.location = new URL(
      `https://example.test/coffee-rush/?auth=${RELAY_AUTH}&key=${GAME_KEY}&relay=wss://relay.example.test/room#/game?auth=${RELAY_AUTH}&key=${GAME_KEY}`,
    );

    const roomUrl = createTurnReminderRoomUrl('ab12cd');
    const message = createTurnReminderMessage({
      roomId: 'ab12cd',
      playerName: 'Ada',
      country: 'US',
      random: () => 0,
    });
    const url = createWhatsAppUrl('14155551212', message);

    expect(roomUrl).toBe(
      'https://example.test/coffee-rush/?relay=wss%3A%2F%2Frelay.example.test%2Froom&room=AB12CD#/game',
    );
    expect(message).toBe(
      `Ada, your meeple's been parked in the drive-thru lane for an eternity. Pull forward: ${roomUrl}`,
    );
    expect(message).not.toContain(RELAY_AUTH);
    expect(message).not.toContain(GAME_KEY);
    expect(message).not.toContain('auth=');
    expect(message).not.toContain('key=');
    expect(message).not.toContain('player=');
    expect(url).toBe(
      `https://wa.me/14155551212?text=${encodeURIComponent(message)}`,
    );
  });

  it('loads country-specific reminder template banks with required placeholders', () => {
    const usTemplates = getTurnReminderTemplates('US');
    const ukTemplates = getTurnReminderTemplates('UK');

    expect(usTemplates).toHaveLength(100);
    expect(ukTemplates).toHaveLength(100);
    expect(usTemplates.every((template) => template.includes('{name}'))).toBe(true);
    expect(usTemplates.every((template) => template.includes('{room}'))).toBe(true);
    expect(ukTemplates.every((template) => template.includes('{name}'))).toBe(true);
    expect(ukTemplates.every((template) => template.includes('{room}'))).toBe(true);

    const roomUrl = createTurnReminderRoomUrl('ab12cd');
    expect(
      createTurnReminderMessage({
        roomId: 'ab12cd',
        playerName: 'Ada',
        country: 'US',
        random: () => 0,
      }),
    ).toBe(usTemplates[0].replaceAll('{name}', 'Ada').replaceAll('{room}', roomUrl));
    expect(
      createTurnReminderMessage({
        roomId: 'ab12cd',
        playerName: 'Ben',
        country: 'UK',
        random: () => 0,
      }),
    ).toBe(ukTemplates[0].replaceAll('{name}', 'Ben').replaceAll('{room}', roomUrl));
  });

  it('opens WhatsApp drafts in a new tab so the game stays visible', () => {
    const whatsappUrl = 'https://wa.me/14155551212?text=Coffee%20Rush';
    const assign = vi.fn();
    const open = vi.fn(() => ({}));

    expect(openWhatsAppDraft(whatsappUrl, { location: { assign }, open })).toBe(true);

    expect(open).toHaveBeenCalledWith(whatsappUrl, '_blank', 'noopener,noreferrer');
    expect(assign).not.toHaveBeenCalled();
  });

  it('does not navigate the current tab when a WhatsApp draft cannot open', () => {
    const whatsappUrl = 'https://wa.me/14155551212?text=Coffee%20Rush';
    const assign = vi.fn();
    const open = vi.fn(() => null);

    expect(openWhatsAppDraft(whatsappUrl, { location: { assign }, open })).toBe(false);

    expect(open).toHaveBeenCalledWith(whatsappUrl, '_blank', 'noopener,noreferrer');
    expect(assign).not.toHaveBeenCalled();
    expect(openWhatsAppDraft('', { open })).toBe(false);
  });

  it('encrypts and decrypts notification rosters without exposing plaintext in envelopes', async () => {
    const session = createSession();
    const contact = normalize('US', '4155551212');
    const roster = upsertNotificationContact(
      createEmptyNotificationRoster(session.roomId),
      'p1',
      contact,
    );
    const encryptedRoster = await encryptNotificationRoster(session, roster);
    const envelopeText = JSON.stringify(encryptedRoster);
    const rosterHash = await hashNotificationRosterEnvelope({
      roomId: session.roomId,
      encryptedRoster,
    });

    expect(encryptedRoster).toMatchObject({ v: 1, alg: 'A256GCM' });
    expect(envelopeText).not.toContain('4155551212');
    expect(envelopeText).not.toContain('14155551212');
    expect(rosterHash).toMatch(/^[A-Za-z0-9_-]+$/);
    await expect(decryptNotificationRoster(session, encryptedRoster)).resolves.toEqual(roster);
  });

  it('keeps non-local numbers out of display data and supports save/clear mutations', () => {
    const session = createSession();
    const p1Contact = normalize('US', '4155551212');
    const p2Contact = normalize('UK', '07700900123');
    const roster = upsertNotificationContact(
      upsertNotificationContact(createEmptyNotificationRoster(session.roomId), 'p1', p1Contact),
      'p2',
      p2Contact,
    );
    const display = getNotificationRosterDisplay(
      [
        { id: 'p1', name: 'Ada' },
        { id: 'p2', name: 'Ben' },
      ],
      roster,
    );

    expect(display).toEqual([
      {
        playerId: 'p1',
        name: 'Ada',
        status: 'set',
      },
      {
        playerId: 'p2',
        name: 'Ben',
        status: 'set',
      },
    ]);

    expect(getLocalNotificationContact(roster, 'p1')).toEqual(p1Contact);
    const cleared = clearNotificationContact(roster, 'p1');
    expect(getLocalNotificationContact(cleared, 'p1')).toBeNull();
    expect(getLocalNotificationContact(cleared, 'p2')).toEqual(p2Contact);
  });

  it('loads and saves encrypted sidecar rosters without plaintext request bodies', async () => {
    const session = createSession();
    const contact = normalize('US', '4155551212');
    const roster = upsertNotificationContact(
      createEmptyNotificationRoster(session.roomId),
      'p1',
      contact,
    );
    const encryptedRoster = await encryptNotificationRoster(session, roster);
    const rosterHash = await hashNotificationRosterEnvelope({
      roomId: session.roomId,
      encryptedRoster,
    });
    const requests = [];

    globalThis.fetch = vi.fn(async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      if (String(url).includes('/room/notifications/head')) {
        return Response.json({
          protocol: 2,
          rosterHash,
          encryptedRoster,
          updatedAt: 1,
        });
      }

      expect(String(url)).toContain('/room/notifications/update?room=AB12CD');
      expect(options.body).not.toContain('4155551212');
      expect(options.body).not.toContain('14155551212');
      return Response.json({
        protocol: 2,
        accepted: true,
        rosterHash: requests.at(-1).body.rosterHash,
        encryptedRoster: requests.at(-1).body.encryptedRoster,
        updatedAt: 2,
      });
    });

    await expect(loadNotificationRoster(session)).resolves.toMatchObject({
      rosterHash,
      roster,
    });
    await expect(saveNotificationRoster(session, roster, rosterHash)).resolves.toMatchObject({
      accepted: true,
      roster,
    });
    expect(requests).toHaveLength(2);
  });

  it('creates reminders only for accepted async END_TURN commits with a next contact', () => {
    const session = createSession();
    const roster = upsertNotificationContact(
      createEmptyNotificationRoster(session.roomId),
      'p2',
      normalize('UK', '07700900123'),
    );
    const resultState = {
      phase: 'upgrade',
      activePlayerId: 'p2',
      players: [
        { id: 'p1', name: 'Ada' },
        { id: 'p2', name: 'Ben' },
      ],
    };
    const actions = [{ type: 'END_TURN', playerId: 'p1' }];
    const roomUrl = createTurnReminderRoomUrl(session.roomId);

    expect(
      createAcceptedTurnReminder({
        session,
        actions,
        resultState,
        commitResponse: { accepted: true },
        roster,
        random: () => 0,
      }),
    ).toMatchObject({
      playerId: 'p2',
      playerName: 'Ben',
      roomId: 'AB12CD',
      message: getTurnReminderTemplates('UK')[0]
        .replaceAll('{name}', 'Ben')
        .replaceAll('{room}', roomUrl),
    });
    expect(
      createAcceptedTurnReminder({
        session,
        actions,
        resultState,
        commitResponse: { accepted: false, error: 'STALE_HEAD' },
        roster,
      }),
    ).toBeNull();
    expect(
      createAcceptedTurnReminder({
        session,
        actions: [{ type: 'PLACE_STARTING_MEEPLE', playerId: 'p2' }],
        resultState,
        commitResponse: { accepted: true },
        roster,
      }),
    ).toBeNull();
    expect(
      createAcceptedTurnReminder({
        session,
        actions,
        resultState: { ...resultState, phase: 'gameOver' },
        commitResponse: { accepted: true },
        roster,
      }),
    ).toBeNull();
    expect(
      createAcceptedTurnReminder({
        session,
        actions,
        resultState: { ...resultState, activePlayerId: 'p1' },
        commitResponse: { accepted: true },
        roster,
      }),
    ).toBeNull();
  });
});
