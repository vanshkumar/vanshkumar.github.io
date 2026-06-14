export function nextRandom(state) {
  const nextState = {
    ...state,
    rngCursor: state.rngCursor + 1,
  };

  return {
    state: nextState,
    value: mulberry32(hashSeed(state.rngSeed) + state.rngCursor),
  };
}

export function shuffleWithState(state, items) {
  let nextState = state;
  const shuffled = items.map((item) => ({ ...item }));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const result = nextRandom(nextState);
    nextState = result.state;
    const swapIndex = Math.floor(result.value * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return { state: nextState, items: shuffled };
}

function hashSeed(seed) {
  const text = String(seed || 'coffee-rush');
  let hash = 1779033703 ^ text.length;

  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
