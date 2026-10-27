import type { TFile, ViewState, Workspace } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';
import { openWeatherFile } from '../lib/openWeatherFile';

const makeLeaf = (state?: ViewState['state']) => ({
  getViewState: () => ({ type: 'markdown', state }),
  openFile: vi.fn().mockResolvedValue(undefined)
});

const makeWorkspace = (leaves: ReturnType<typeof makeLeaf>[]) => {
  const newLeaf = makeLeaf();
  const workspace = {
    getLeavesOfType: vi.fn().mockReturnValue(leaves),
    getLeaf: vi.fn().mockReturnValue(newLeaf),
    revealLeaf: vi.fn().mockResolvedValue(undefined)
  };
  return { workspace, newLeaf };
};

describe('openWeatherFile', () => {
  it.each(['source', 'preview', undefined])('focuses an existing %s tab without reopening its file', async (mode) => {
    const file = { path: 'An open note.md' } as TFile;
    // No loaded view.file is available, as with a deferred background tab.
    const existingLeaf = makeLeaf({ file: file.path, mode, scroll: 42 });
    const { workspace, newLeaf } = makeWorkspace([makeLeaf({ file: 'Another note.md' }), existingLeaf]);

    await openWeatherFile(workspace as unknown as Workspace, file);

    expect(workspace.getLeavesOfType).toHaveBeenCalledWith('markdown');
    expect(workspace.revealLeaf).toHaveBeenCalledOnce();
    expect(workspace.revealLeaf).toHaveBeenCalledWith(existingLeaf);
    expect(workspace.getLeaf).not.toHaveBeenCalled();
    expect(existingLeaf.openFile).not.toHaveBeenCalled();
    expect(newLeaf.openFile).not.toHaveBeenCalled();
    expect(existingLeaf.getViewState().state).toEqual({ file: file.path, mode, scroll: 42 });
  });

  it('opens a new tab when only a different file with the same name is open', async () => {
    const file = { path: 'A note.md' } as TFile;
    const { workspace, newLeaf } = makeWorkspace([
      makeLeaf(),
      makeLeaf({ file: 'shelf/A note.md' })
    ]);

    await openWeatherFile(workspace as unknown as Workspace, file);

    expect(workspace.getLeaf).toHaveBeenCalledOnce();
    expect(workspace.getLeaf).toHaveBeenCalledWith('tab');
    expect(newLeaf.openFile).toHaveBeenCalledOnce();
    expect(newLeaf.openFile).toHaveBeenCalledWith(file);
    expect(workspace.revealLeaf).not.toHaveBeenCalled();
  });

  it('waits for an existing deferred tab to be revealed', async () => {
    const file = { path: 'A post.md' } as TFile;
    const existingLeaf = makeLeaf({ file: file.path });
    const { workspace } = makeWorkspace([existingLeaf, makeLeaf({ file: file.path })]);
    let finishReveal!: () => void;
    workspace.revealLeaf.mockImplementation(() => new Promise<void>((resolve) => {
      finishReveal = resolve;
    }));
    let completed = false;

    const opening = openWeatherFile(workspace as unknown as Workspace, file).then(() => {
      completed = true;
    });
    await Promise.resolve();
    expect(completed).toBe(false);
    expect(workspace.revealLeaf).toHaveBeenCalledOnce();
    expect(workspace.revealLeaf).toHaveBeenCalledWith(existingLeaf);
    expect(workspace.getLeaf).not.toHaveBeenCalled();

    finishReveal();
    await opening;
    expect(completed).toBe(true);
  });
});
