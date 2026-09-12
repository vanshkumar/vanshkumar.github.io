import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const readBytes = path => fs.readFileSync(new URL(path, import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

const reviewedArtwork = {
  name: 'reviewed-companion-artwork',
  apply: 'build',
  buildStart() {
    const release = JSON.parse(readBytes('./content/pilots/APPROVED_RELEASE.json'));
    if (!/^content\/pilots\/revisions\/r\d+\/INTEGRATION_RECEIPT\.json$/.test(release.receiptPath)) throw new Error('Invalid reviewed release receipt');
    if (hash(readBytes(`./${release.receiptPath}`)) !== release.receiptSha256) throw new Error('Reviewed receipt changed');
    const payloadBytes = readBytes('./src/guide/approved.json');
    if (hash(payloadBytes) !== release.payloadSha256) throw new Error('Public content changed after reviewed integration');
    const payload = JSON.parse(payloadBytes);
    const images = [...payload.scenes, ...payload.entries.map(entry => entry.illustration).filter(Boolean)];
    for (const src of new Set(images.map(image => image.src))) {
      if (!/^art\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg|svg)$/.test(src)) throw new Error(`Invalid reviewed artwork path: ${src}`);
      const bytes = readBytes(`./public/${src}`);
      if (!release.assets.some(asset => asset.src === src && asset.sha256 === hash(bytes))) throw new Error(`Artwork changed after review: ${src}`);
      this.emitFile({ type: 'asset', fileName: src, source: bytes });
    }
  },
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle).filter(item => item.type === 'chunk')) {
      for (const id of Object.keys(chunk.modules)) {
        if (/\/src\/(?:content\.js|LegacyStudies\.jsx|guide\/prototype\.js)$/.test(id) || /\/montessori-books\/(?:content|research)\//.test(id)) throw new Error(`Unreviewed or private module in production: ${id}`);
      }
    }
  },
};

export default defineConfig({ plugins: [react(), reviewedArtwork], base: '/montessori-books/', build: { copyPublicDir: false } });
