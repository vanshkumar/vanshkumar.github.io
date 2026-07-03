import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {
  createHunchNote,
  createQuestionNote,
  createShelfNote,
  defaultVaultDir,
  resolveVaultAsset,
  vaultAssetUrlPrefix,
  writeHunchData,
  writeQuestionData,
  writeShelfData
} from './scripts/question-data.mjs';

const createEndpoint = '/__question-weather-create';
const refreshEndpoint = '/__question-weather-refresh';
const hunchCreateEndpoint = '/__hunch-weather-create';
const hunchRefreshEndpoint = '/__hunch-weather-refresh';
const shelfCreateEndpoint = '/__shelf-weather-create';
const shelfRefreshEndpoint = '/__shelf-weather-refresh';

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        reject(new Error('Request body is too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });

const contentTypeForPath = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.webp') return 'image/webp';
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.avif') return 'image/avif';
  return 'application/octet-stream';
};

const sendVaultAsset = (pathname, res) => {
  const encodedAssetPath = pathname.slice(vaultAssetUrlPrefix.length);
  let assetPath;
  try {
    assetPath = decodeURIComponent(encodedAssetPath);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid asset path' });
    return;
  }

  const asset = resolveVaultAsset({
    assetPath,
    vaultDir: defaultVaultDir
  });
  if (!asset) {
    sendJson(res, 404, { ok: false, error: 'Asset not found' });
    return;
  }

  res.statusCode = 200;
  res.setHeader('content-type', contentTypeForPath(asset.absolutePath));
  fs.createReadStream(asset.absolutePath).pipe(res);
};

const vaultWeatherLocalServer = () => ({
  name: 'vault-weather-local-server',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url ?? '/', 'http://question-weather.local').pathname;

      if (pathname.startsWith(vaultAssetUrlPrefix)) {
        sendVaultAsset(pathname, res);
        return;
      }

      if (
        pathname !== refreshEndpoint &&
        pathname !== createEndpoint &&
        pathname !== hunchRefreshEndpoint &&
        pathname !== hunchCreateEndpoint &&
        pathname !== shelfRefreshEndpoint &&
        pathname !== shelfCreateEndpoint
      ) {
        next();
        return;
      }

      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'Method not allowed' });
        return;
      }

      try {
        if (pathname === createEndpoint) {
          const body = await readJsonBody(req);
          const created = createQuestionNote({ title: body.title });
          const data = writeQuestionData();
          const question =
            data.questions.find((item) => item.repoPath === created.repoPath) ?? created;

          sendJson(res, 201, {
            ok: true,
            item: question,
            question
          });
          return;
        }

        if (pathname === hunchCreateEndpoint) {
          const body = await readJsonBody(req);
          const created = createHunchNote({ title: body.title });
          const data = writeHunchData();
          const hunch =
            data.hunches.find((item) => item.repoPath === created.repoPath) ?? created;

          sendJson(res, 201, {
            ok: true,
            item: hunch,
            hunch
          });
          return;
        }

        if (pathname === shelfCreateEndpoint) {
          const body = await readJsonBody(req);
          const created = createShelfNote({ title: body.title, rating: body.rating });
          const data = writeShelfData();
          const shelfItem =
            data.items.find((item) => item.repoPath === created.repoPath) ?? created;

          sendJson(res, 201, {
            ok: true,
            item: shelfItem,
            shelfItem
          });
          return;
        }

        let data;
        if (pathname === shelfRefreshEndpoint) {
          data = writeShelfData();
        } else if (pathname === hunchRefreshEndpoint) {
          data = writeHunchData();
        } else {
          data = writeQuestionData();
        }
        sendJson(res, 200, {
          ok: true,
          count: data.count,
          generatedAt: data.generatedAt
        });
      } catch (error) {
        const statusCode = Number.isInteger(error?.statusCode)
          ? error.statusCode
          : 500;

        sendJson(res, statusCode, {
          ok: false,
          error: error instanceof Error ? error.message : 'Vault Weather action failed'
        });
      }
    });
  }
});

export default defineConfig({
  base: './',
  plugins: [vaultWeatherLocalServer(), react()],
  test: {
    environment: 'node'
  }
});
