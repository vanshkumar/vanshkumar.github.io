import { useEffect } from 'react';
import { getUpgradeDisplay } from '../data/upgradeDisplay';
import { UPGRADE_TILES } from '../data/upgradeTiles';

export default function UpgradeMenu({
  player,
  canActivate,
  isOpen,
  onActivate,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop upgrade-menu-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="upgrade-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-menu-title"
      >
        <header className="upgrade-menu-header">
          <div>
            <span className="phase-kicker">Spend 3 completed orders</span>
            <h2 id="upgrade-menu-title">Activate upgrade</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close upgrade menu"
            onClick={onClose}
          >
            x
          </button>
        </header>

        <div className="upgrade-options">
          {UPGRADE_TILES.map((tile) => {
            const active = player.upgrades[tile.id];
            const display = getUpgradeDisplay(tile);
            const disabled = active || !canActivate;

            return (
              <button
                key={tile.id}
                className={`upgrade-option ${active ? 'upgrade-option-active' : ''}`}
                type="button"
                onClick={() => onActivate(tile.id)}
                disabled={disabled}
              >
                <span className="upgrade-option-code">{display.code}</span>
                <span className="upgrade-option-copy">
                  <strong>{tile.name}</strong>
                  <small>{tile.summary}</small>
                </span>
                <span className="upgrade-option-state">
                  {active ? 'Active' : canActivate ? 'Activate' : 'Need 3'}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
