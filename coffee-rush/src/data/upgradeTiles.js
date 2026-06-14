import rawUpgrades from '../../data/upgradeTiles.csv?raw';
import { parseCsv } from './csv';

export const UPGRADE_TILES = parseCsv(rawUpgrades).map((row) => ({
  id: row.id,
  name: row.name,
  effectTag: row.effect_tag,
  summary: row.summary,
}));
