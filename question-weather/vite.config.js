import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeQuestionData } from './scripts/question-data.mjs';

const refreshEndpoint = '/__question-weather-refresh';

const questionWeatherRefresh = () => ({
  name: 'question-weather-refresh',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url !== refreshEndpoint) {
        next();
        return;
      }

      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
        return;
      }

      try {
        const data = writeQuestionData();
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            ok: true,
            count: data.count,
            generatedAt: data.generatedAt
          })
        );
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            ok: false,
            error: error instanceof Error ? error.message : 'Refresh failed'
          })
        );
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
