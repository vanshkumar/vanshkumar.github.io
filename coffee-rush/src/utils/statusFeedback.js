export const DEFAULT_TOAST_DURATION_MS = 3000;

export function getUniqueStatusMessages(messages = []) {
  return Array.from(
    new Set(
      messages
        .map((message) => String(message ?? '').trim())
        .filter(Boolean),
    ),
  );
}
