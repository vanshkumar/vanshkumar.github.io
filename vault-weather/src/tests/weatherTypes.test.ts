import { describe, expect, it } from 'vitest';
import { terrainFilterFromState } from '../lib/weatherTypes';

describe('Weather workspace state', () => {
  it('keeps current Writing filters and migrates legacy Terrain filters', () => {
    expect(terrainFilterFromState({ mode: 'group', group: 'posts' })).toEqual({
      mode: 'group',
      group: 'posts'
    });
    expect(terrainFilterFromState({ mode: 'tag', tag: 'questions' })).toEqual({
      mode: 'group',
      group: 'notes'
    });
    expect(terrainFilterFromState({ mode: 'tag', tag: 'projects' })).toEqual({
      mode: 'group',
      group: 'posts'
    });
    expect(terrainFilterFromState({ mode: 'untagged' })).toEqual({ mode: 'all' });
  });
});
