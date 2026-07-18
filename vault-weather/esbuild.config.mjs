import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(appRoot, 'dist');
const watch = process.argv.includes('--watch');

await fs.mkdir(outputDir, { recursive: true });

const copyPluginAssets = async () => {
  await Promise.all([
    fs.copyFile(path.join(appRoot, 'manifest.json'), path.join(outputDir, 'manifest.json')),
    fs.copyFile(path.join(appRoot, 'styles.css'), path.join(outputDir, 'styles.css'))
  ]);
};

const buildOptions = {
  entryPoints: [path.join(appRoot, 'src', 'main.ts')],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*'],
  format: 'cjs',
  target: 'es2018',
  platform: 'browser',
  outfile: path.join(outputDir, 'main.js'),
  sourcemap: watch ? 'inline' : false,
  minify: !watch,
  define: {
    'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production')
  },
  treeShaking: true,
  logLevel: 'info'
};

await copyPluginAssets();

if (watch) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log('Watching Vault Weather plugin sources...');
} else {
  await esbuild.build(buildOptions);
}
