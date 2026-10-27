import type { TFile, Workspace } from 'obsidian';

export async function openWeatherFile(workspace: Workspace, file: TFile): Promise<void> {
  const existingLeaf = workspace.getLeavesOfType('markdown').find((leaf) => {
    // Saved state also identifies background tabs whose views are still deferred.
    return leaf.getViewState().state?.file === file.path;
  });

  if (existingLeaf) {
    await workspace.revealLeaf(existingLeaf);
    return;
  }

  await workspace.getLeaf('tab').openFile(file);
}
