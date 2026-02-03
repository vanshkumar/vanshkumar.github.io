import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = path.resolve(root, '..');
const source = path.join(repoRoot, 'src', 'content', 'assets');
const destination = path.join(repoRoot, 'public', 'assets');

if (!fs.existsSync(source)) {
  process.exit(0);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });
