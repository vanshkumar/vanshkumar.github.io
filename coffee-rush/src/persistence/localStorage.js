const STORAGE_KEY = 'coffee-rush:active-game:v2';
const UNDO_STORAGE_KEY = 'coffee-rush:undo-stack:v1';
const MAX_UNDO_STATES = 25;

export function saveGame(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadGame() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearGame() {
  window.localStorage.removeItem(STORAGE_KEY);
  clearUndoStack();
}

export function saveUndoStack(stack) {
  const trimmed = stack.slice(-MAX_UNDO_STATES);
  window.localStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(trimmed));
}

export function loadUndoStack() {
  const raw = window.localStorage.getItem(UNDO_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearUndoStack() {
  window.localStorage.removeItem(UNDO_STORAGE_KEY);
}
