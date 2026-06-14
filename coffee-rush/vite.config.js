import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/coffee-rush/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
