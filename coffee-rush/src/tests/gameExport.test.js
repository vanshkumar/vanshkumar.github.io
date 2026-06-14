import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine/initialState';
import {
  createGameExport,
  formatGameExport,
  gameExportFilename,
} from '../utils/gameExport';

describe('game export', () => {
  it('includes state, action log, undo depth, and a stable filename shape', () => {
    const state = {
      ...createInitialState({
        playerNames: ['Ada', 'Ben'],
        seed: 'export-test',
      }),
      log: [{ type: 'SKIP_UPGRADES', playerId: 'p1' }],
    };
    const undoStack = [{ ...state, log: [] }];
    const exported = createGameExport(state, undoStack);

    expect(exported.app).toBe('coffee-rush');
    expect(exported.exportVersion).toBe(1);
    expect(exported.summary).toMatchObject({
      turn: state.turn,
      phase: state.phase,
      actionCount: 1,
      undoDepth: 1,
    });
    expect(exported.state).toBe(state);
    expect(exported.actionLog).toEqual(state.log);
    expect(exported.undoStack).toBe(undoStack);
    expect(formatGameExport(state, undoStack)).toContain('"actionLog"');
    expect(gameExportFilename(state, new Date('2026-06-14T12:00:00Z'))).toBe(
      'coffee-rush-turn-1-setupPlacement-2026-06-14T12-00-00-000Z.json',
    );
  });
});
