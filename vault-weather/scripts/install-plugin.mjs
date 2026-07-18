import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, '..');
const sourceDir = path.join(appRoot, 'dist');
const pluginDir = path.resolve(appRoot, '..', 'vault', '.obsidian', 'plugins', 'vault-weather');
const artifacts = ['main.js', 'manifest.json', 'styles.css'];

await fs.mkdir(pluginDir, { recursive: true });

for (const artifact of artifacts) {
  await fs.copyFile(path.join(sourceDir, artifact), path.join(pluginDir, artifact));
}

console.log(`Installed Vault Weather in ${pluginDir}`);
