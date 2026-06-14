import { UPGRADE_TILES } from '../data/upgradeTiles';

export default function UpgradeTray({ player, isActive, phase, onActivate }) {
  return (
    <div className="upgrade-tray">
      {UPGRADE_TILES.map((tile) => {
        const active = player.upgrades[tile.id];
        const canActivate =
          isActive && phase === 'upgrade' && !active && player.completed.length >= 3;

        return (
          <button
            key={tile.id}
            className={`upgrade-tile ${active ? 'upgrade-active' : ''}`}
            type="button"
            onClick={() => onActivate(tile.id)}
            disabled={!canActivate}
            title={tile.summary}
          >
            <span>{tile.name}</span>
            <small>{active ? 'active' : '+2'}</small>
          </button>
        );
      })}
    </div>
  );
}
