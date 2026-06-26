export const MAX_PLAYER_NAME_LENGTH = 40;

export function normalizePlayerName(value) {
  return String(value ?? '').replace(/\s+/gu, ' ').trim();
}

export function isValidPlayerName(value) {
  const name = normalizePlayerName(value);
  return name.length > 0 && name.length <= MAX_PLAYER_NAME_LENGTH;
}

export function playerNameError(value) {
  const name = normalizePlayerName(value);

  if (!name) {
    return 'Enter your name.';
  }

  if (name.length > MAX_PLAYER_NAME_LENGTH) {
    return `Keep names to ${MAX_PLAYER_NAME_LENGTH} characters or fewer.`;
  }

  return '';
}
