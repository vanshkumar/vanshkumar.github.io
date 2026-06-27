# WhatsApp Turn Reminder Plan

## Summary

- Implement async-only WhatsApp turn reminders with an encrypted contact roster sidecar, so the relay never sees plaintext phone numbers.
- Players choose `US (+1)`, `UK (+44)`, or `Canada (+1)` from a dropdown, then enter their normal national phone number. No WhatsApp ID is needed.
- After an accepted async `END_TURN`, the browser opens a WhatsApp draft to the next active player; the sender still taps Send.

## Key Changes

### Notification Roster

- Add a notification roster outside reducer state, exports, logs, and undo.
- Use this encrypted payload shape:

```json
{
  "version": 1,
  "roomId": "ABC123",
  "contacts": {
    "p1": {
      "method": "whatsapp",
      "country": "US",
      "countryCode": "1",
      "nationalNumber": "4155551212",
      "whatsappNumber": "14155551212",
      "updatedAt": "2026-06-26T00:00:00.000Z"
    }
  }
}
```

- Encrypt and decrypt the roster with the existing room game key.
- Store only ciphertext and a hash in the relay.
- Allow all invited room participants to decrypt roster status, but only show the full number for the local seat that owns it.

### Relay Sidecar Endpoints

- Add `POST /room/notifications/head?room=ABC123` to return the current encrypted roster and hash for a valid `roomAuth`.
- Add `POST /room/notifications/update?room=ABC123` to write the encrypted roster with stale-hash rejection.
- Validate encrypted envelope shape and hashes only; never inspect, parse, or log contacts.

### Phone Helpers

- Country options are fixed to `US (+1)`, `UK (+44)`, and `Canada (+1)` for v1.
- Strip spaces, punctuation, and trunk-prefix formatting from user input.
- Reject fewer than 7 or more than 11 national digits.
- Store and send the WhatsApp number as `<countryCode><nationalDigits>`, for example `14155551212` or `447700900123`.
- Build URLs as `https://wa.me/<whatsappNumber>?text=<encoded message>`.

### Async Game UI

- Add a compact `WhatsApp reminders` control in `GamePage` for protocol v2 async rooms.
- Include a country dropdown plus local number input, save, and clear actions.
- Show per-seat roster indicators as `set` or `missing`.
- Avoid displaying other players' phone numbers.

### Post-Turn Behavior

- Only after an accepted async `END_TURN`, compute the next active player from `resultState.activePlayerId`.
- If the next player has a saved WhatsApp contact, open a WhatsApp draft with:

```text
Your turn in Coffee Rush room ABC123. Open your existing game and sync.
```

- If auto-open is blocked, show a persistent `Message <player>` button plus copy/share fallback.
- Do not notify on failed commits, stale commits, setup commits, non-async games, local drafts, or game over.

## Test Plan

- Unit test US/UK/Canada normalization, trunk-prefix stripping, invalid inputs, WhatsApp URL encoding, and no room secrets in message text.
- Unit test encrypted roster round-trip and relay stale-hash behavior; assert relay responses do not contain plaintext phone numbers.
- Client tests for saving and clearing the local contact, syncing roster status, hidden non-local numbers, and reload persistence.
- Async commit tests: accepted `END_TURN` triggers exactly one reminder for the new active player; failed, stale, setup, and game-over commits trigger none.
- Export tests: game export JSON contains no phone numbers, WhatsApp URLs, or notification roster payloads.

## Assumptions

- V1 supports WhatsApp only, with US/UK/Canada country choices only.
- The app should not guess country codes beyond the selected dropdown.
- The relay may persist encrypted notification ciphertext but never plaintext contact info or turn ownership.
- Country-specific reminder template banks are static client data keyed by supported country codes.
