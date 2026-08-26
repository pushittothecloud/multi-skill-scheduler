import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const githubPagesBase = '/multi-skill-scheduler/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? githubPagesBase : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
}));
