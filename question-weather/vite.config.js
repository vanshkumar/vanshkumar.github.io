import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createQuestionNote, writeQuestionData } from './scripts/question-data.mjs';

const createEndpoint = '/__question-weather-create';
const refreshEndpoint = '/__question-weather-refresh';

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

const questionWeatherRefresh = () => ({
  name: 'question-weather-refresh',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url ?? '/', 'http://question-weather.local').pathname;

      if (pathname !== refreshEndpoint && pathname !== createEndpoint) {
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
            question
          });
          return;
        }

        const data = writeQuestionData();
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
          error: error instanceof Error ? error.message : 'Question Weather action failed'
        });
      }
    });
  }
});

export default defineConfig({
  base: './',
  plugins: [questionWeatherRefresh(), react()],
  test: {
    environment: 'node'
  }
});
