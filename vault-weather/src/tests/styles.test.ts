import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = fs.readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

const ruleFor = (selector: string): string => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    styles.match(new RegExp(`(?:^|\\})\\s*${escapedSelector}\\s*\\{([^}]+)\\}`))?.[1] ??
    ''
  );
};

describe('Obsidian style isolation', () => {
  it('prevents global button styles from widening weather cards', () => {
    const linkRule = ruleFor('.vault-weather-view .weather-card-link');
    expect(linkRule).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(linkRule).toContain('justify-content: stretch');
    expect(linkRule).toContain('overflow: hidden');
    expect(linkRule).toContain('white-space: normal');
  });

  it('wraps long card titles inside the card boundary', () => {
    const titleRule = ruleFor('.vault-weather-view .weather-card-title');
    expect(titleRule).toContain('min-width: 0');
    expect(titleRule).toContain('overflow-wrap: anywhere');
    expect(titleRule).toContain('white-space: normal');
  });

  it('keeps empty Weather views from becoming Obsidian pointer-blocking overlays', () => {
    const emptyRule = ruleFor('.vault-weather-view .weather-empty-state');
    expect(emptyRule).toContain('position: static');
    expect(emptyRule).toContain('pointer-events: none');
    expect(styles).not.toContain('.vault-weather-view .empty-state');
  });
});
