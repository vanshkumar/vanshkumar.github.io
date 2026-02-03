import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = path.resolve(root, '..');
const lockfile = path.join(repoRoot, 'package-lock.json');

if (!fs.existsSync(lockfile)) {
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(lockfile, 'utf8'));
const packages = data.packages ?? {};
const entries = Object.entries(packages);
const invalid = entries.filter(([name, meta]) => name && !meta?.version);

if (invalid.length === 0) {
  process.exit(0);
}

invalid.forEach(([name]) => {
  delete packages[name];
});

data.packages = packages;
fs.writeFileSync(lockfile, JSON.stringify(data, null, 2) + '\n');
