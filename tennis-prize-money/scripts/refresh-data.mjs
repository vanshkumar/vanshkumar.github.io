import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createJsonHttpSourceAdapter,
  refreshOutputPaths,
  runDataRefresh,
} from '../node_modules/.tmp/refresh/refresh/index.js';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifestUrl = readOptionalEnv('REFRESH_SOURCE_MANIFEST_URL');
const dryRun = readBooleanEnv('REFRESH_DRY_RUN', false);
const updateLastRefreshedAt = readBooleanEnv('REFRESH_UPDATE_TIMESTAMP', true);
const adapters = manifestUrl
  ? [
      createJsonHttpSourceAdapter({
        id: 'configured-json-manifest',
        label: 'Configured JSON manifest',
        url: manifestUrl,
      }),
    ]
  : [];
const consoleLogger = {
  info(message) {
    console.log(message);
  },
  warn(message) {
    console.warn(message);
  },
  error(message) {
    console.error(message);
  },
};

try {
  const existingData = {
    metadata: await readJson(refreshOutputPaths.metadata),
    sources: await readJson(refreshOutputPaths.sources),
    records: await readJson(refreshOutputPaths.records),
  };

  const result = await runDataRefresh({
    existingData,
    adapters,
    logger: consoleLogger,
    updateLastRefreshedAt,
    writeJsonOutput: dryRun ? dryRunWriteJsonOutput : writeJsonOutput,
  });

  const changedPaths = result.writeResults
    .filter((writeResult) => writeResult.changed)
    .map((writeResult) => writeResult.path);

  if (changedPaths.length === 0) {
    console.log('Refresh completed; static JSON is already current.');
  } else if (dryRun) {
    console.log(`Refresh dry run completed; ${changedPaths.length} file(s) would change.`);
  } else {
    console.log(`Refresh completed; changed ${changedPaths.length} file(s):`);
    for (const path of changedPaths) {
      console.log(`- ${path}`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function readJson(relativePath) {
  const content = await readFile(resolveDataPath(relativePath), 'utf8');

  return JSON.parse(content);
}

async function writeJsonOutput(output) {
  const absolutePath = resolveDataPath(output.path);
  let previousContent = null;

  try {
    previousContent = await readFile(absolutePath, 'utf8');
  } catch {
    previousContent = null;
  }

  if (previousContent === output.content) {
    return { path: output.path, changed: false };
  }

  await writeFile(absolutePath, output.content, 'utf8');

  return { path: output.path, changed: true };
}

async function dryRunWriteJsonOutput(output) {
  const absolutePath = resolveDataPath(output.path);
  let previousContent = null;

  try {
    previousContent = await readFile(absolutePath, 'utf8');
  } catch {
    previousContent = null;
  }

  return { path: output.path, changed: previousContent !== output.content };
}

function resolveDataPath(relativePath) {
  const normalizedPath = relativePath.replaceAll('\\', '/');

  if (!normalizedPath.startsWith('src/data/')) {
    throw new Error(`Refusing to read or write outside src/data: ${relativePath}`);
  }

  return resolve(appRoot, normalizedPath);
}

function readOptionalEnv(name) {
  const value = process.env[name];

  return value && value.trim().length > 0 ? value.trim() : null;
}

function readBooleanEnv(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined || value.trim().length === 0) {
    return defaultValue;
  }

  return !['0', 'false', 'no', 'off'].includes(value.trim().toLowerCase());
}
