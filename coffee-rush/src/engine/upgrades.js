import { UPGRADE_TILES } from '../data/upgradeTiles';

export const UPGRADE_IDS = UPGRADE_TILES.map((tile) => tile.id);

export function createUpgradeState() {
  return Object.fromEntries(UPGRADE_IDS.map((id) => [id, false]));
}
