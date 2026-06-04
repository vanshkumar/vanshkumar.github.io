import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = path.resolve(root, '..');
const source = path.join(repoRoot, 'vault', 'assets');
const destination = path.join(repoRoot, 'public', 'assets');
const execFileAsync = promisify(execFile);

if (!fs.existsSync(source)) {
  process.exit(0);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });

const numericPngName = /^(\d+)\.png$/i;

const loadSharp = async () => {
  try {
    const sharpModule = await import('sharp');
    return sharpModule.default;
  } catch (error) {
    console.warn(
      `Skipping sharp WebP optimization: ${error.message.split('\n')[0]}`
    );
    return null;
  }
};

const getComicPages = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && numericPngName.test(entry.name))
    .map((entry) => {
      const [, page] = entry.name.match(numericPngName);
      return {
        name: entry.name,
        page: Number(page)
      };
    })
    .sort((a, b) => a.page - b.page);

const convertWithSips = async (input, output) => {
  await execFileAsync('sips', [
    '-s',
    'format',
    'jpeg',
    '-s',
    'formatOptions',
    '82',
    input,
    '--out',
    output
  ]);
};

const optimizeComicDir = async (dir, sharp) => {
  const pages = getComicPages(dir);
  if (!pages.length) return;

  const outputDir = path.join(dir, 'web');
  fs.mkdirSync(outputDir, { recursive: true });

  await Promise.all(
    pages.map(async ({ name, page }) => {
      const input = path.join(dir, name);
      if (sharp) {
        await sharp(input)
          .webp({ quality: 82 })
          .toFile(path.join(outputDir, `${page}.webp`));
        return;
      }

      if (process.platform === 'darwin') {
        try {
          await convertWithSips(input, path.join(outputDir, `${page}.jpg`));
          return;
        } catch (error) {
          console.warn(`Could not optimize ${input}: ${error.message}`);
        }
      }

      fs.copyFileSync(input, path.join(outputDir, `${page}.png`));
    })
  );
};

const optimizeComicAssets = async () => {
  const sharp = await loadSharp();
  const entries = fs.readdirSync(destination, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => optimizeComicDir(path.join(destination, entry.name), sharp))
  );
};

await optimizeComicAssets();
