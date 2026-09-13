// Refresh only age-matched invitations; curated openings remain the first visit.
export function ideaChoices(guide, age, ids) {
  const initial = guide.openings(age);
  if (!Array.isArray(ids) || ids.length !== 3 || new Set(ids).size !== 3) return initial;
  const choices = ids.map(id => guide.atAge(id, age));
  return choices.every(item => item && (item.entry.kind === 'invitation'
    || initial.some(opening => opening.entry.id === item.entry.id))) ? choices : initial;
}

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function refreshIdeas(pool, current, seen = [], random = Math.random) {
  const available = [...new Set(pool)].filter(id => !current.includes(id));
  // Never advertise three new choices when fewer than three are available.
  if (available.length < 3) return null;
  const history = new Set([...seen, ...current]);
  const fresh = shuffled(available.filter(id => !history.has(id)), random);
  const ids = fresh.slice(0, 3);
  const restarting = ids.length < 3;
  if (restarting) {
    ids.push(...shuffled(available.filter(id => !ids.includes(id)), random).slice(0, 3 - ids.length));
  }
  return { ids, seen: restarting ? ids : [...new Set([...history, ...ids])] };
}

const storageKey = age => `small-beginnings:seen-ideas:${age}`;
export function readSeenIdeas(age) {
  try {
    const ids = JSON.parse(window.sessionStorage.getItem(storageKey(age)) ?? '[]');
    return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveSeenIdeas(age, ids) {
  try {
    window.sessionStorage.setItem(storageKey(age), JSON.stringify(ids));
  } catch {
    // The mounted view still remembers the cycle when storage is unavailable.
  }
}
