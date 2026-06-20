import { UPGRADE_TILES } from '../data/upgradeTiles';

const UPGRADE_DISPLAY = {
  double_meeples: { code: '2M', shortName: 'Double meeples' },
  diagonal_movement: { code: 'Diag', shortName: 'Diagonal movement' },
  double_corners: { code: '2C', shortName: 'Double corners' },
  double_specialties: { code: '2S', shortName: 'Double specialties' },
};

export default function UpgradeTray({ player, isActive, phase, onActivate }) {
  return (
    <div className="upgrade-tray">
      {UPGRADE_TILES.map((tile) => {
        const active = player.upgrades[tile.id];
        const display = UPGRADE_DISPLAY[tile.id] ?? {
          code: tile.name.slice(0, 3),
          shortName: tile.name,
        };
        const canActivate =
          isActive && phase === 'upgrade' && !active && player.completed.length >= 3;

        return (
          <button
            key={tile.id}
            className={`upgrade-tile ${active ? 'upgrade-active' : ''}`}
            type="button"
            onClick={() => onActivate(tile.id)}
            disabled={!canActivate}
            title={`${display.shortName}: ${tile.summary}`}
          >
            <span className="upgrade-code">{display.code}</span>
            <small>{active ? 'on' : '+2'}</small>
          </button>
        );
      })}
    </div>
  );
}
