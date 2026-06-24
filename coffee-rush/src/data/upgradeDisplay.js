export const UPGRADE_DISPLAY = {
  double_meeples: { code: '2M', shortName: 'Double meeples' },
  diagonal_movement: { code: 'Diag', shortName: 'Diagonal movement' },
  double_corners: { code: '2C', shortName: 'Double corners' },
  double_specialties: { code: '2S', shortName: 'Double specialties' },
};

export function getUpgradeDisplay(tile) {
  return (
    UPGRADE_DISPLAY[tile.id] ?? {
      code: tile.name.slice(0, 3),
      shortName: tile.name,
    }
  );
}
