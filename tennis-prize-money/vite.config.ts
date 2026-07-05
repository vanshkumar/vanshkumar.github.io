import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/tennis-prize-money/',
  plugins: [react()],
});
