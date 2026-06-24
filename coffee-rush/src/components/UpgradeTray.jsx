import { UPGRADE_TILES } from '../data/upgradeTiles';
import { getUpgradeDisplay } from '../data/upgradeDisplay';

export default function UpgradeTray({ player }) {
  return (
    <div className="upgrade-tray" aria-label={`${player.name} upgrades`}>
      {UPGRADE_TILES.map((tile) => {
        const active = player.upgrades[tile.id];
        const display = getUpgradeDisplay(tile);

        return (
          <span
            key={tile.id}
            className={`upgrade-tile ${active ? 'upgrade-active' : ''}`}
            title={`${display.shortName}: ${tile.summary}`}
            aria-label={`${display.shortName}: ${active ? 'active' : 'inactive'}`}
          >
            <span className="upgrade-code">{display.code}</span>
            <small>{active ? 'on' : '+2'}</small>
          </span>
        );
      })}
    </div>
  );
}
