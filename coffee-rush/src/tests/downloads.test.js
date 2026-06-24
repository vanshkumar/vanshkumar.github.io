import { describe, expect, it } from 'vitest';
import { createZipBlob } from '../utils/downloads';

describe('downloads', () => {
  it('creates one ZIP archive containing every requested file', async () => {
    const blob = await createZipBlob([
      {
        name: 'coffee-rush-log.json',
        blob: new Blob(['{"app":"coffee-rush"}'], { type: 'application/json' }),
        lastModified: Date.parse('2026-06-14T12:00:00Z'),
      },
      {
        name: 'coffee-rush-screenshot.png',
        blob: new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
        lastModified: Date.parse('2026-06-14T12:00:00Z'),
      },
    ]);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer);
    const zipText = new TextDecoder().decode(bytes);

    expect(blob.type).toBe('application/zip');
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50);
    expect(zipText).toContain('coffee-rush-log.json');
    expect(zipText).toContain('coffee-rush-screenshot.png');
  });
});
