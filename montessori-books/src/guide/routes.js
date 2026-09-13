import { stages } from '../concepts.js';

const studyIds = ['windows', 'paths', 'stars', 'paper', 'rhythms', 'notebook', 'ribbon', 'gallery', 'together'];

export function readRoute(hash = window.location.hash) {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const params = new URLSearchParams(query);
  const age = stages.some(stage => stage.id === params.get('age')) ? params.get('age') : '6-9';
  const id = path || 'home';
  return {
    id: id === 'home' || id === 'studies' || studyIds.includes(id) ? id : 'not-found',
    age,
    topic: id === 'home' ? params.get('topic') : null,
    entry: id === 'home' ? params.get('entry') : null,
    idea: id === 'home' ? params.get('idea') : null,
    ideas: id === 'home' && params.has('ideas') ? params.get('ideas').split(',') : null,
    explore: id === 'home' && params.get('view') === 'topics',
  };
}

export function homeLink({ age = '6-9', topic, entry, idea, ideas, explore } = {}) {
  const params = new URLSearchParams({ age });
  if (topic) params.set('topic', topic);
  if (entry) params.set('entry', entry);
  if (idea) params.set('idea', idea);
  if (ideas?.length) params.set('ideas', ideas.join(','));
  if (explore && !topic) params.set('view', 'topics');
  return `#/home?${params}`;
}

export function studyLink(id = 'studies', age = '6-9') {
  return `#/${id}?age=${encodeURIComponent(age)}`;
}
