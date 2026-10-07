import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const apiTarget = process.env.API_URL ?? 'http://localhost:5080';

export default defineConfig({
  // Admin phuc vu duoi /admin cung domain voi website (nginx route /admin → build tinh nay).
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5174,
    // Cung origin voi API qua proxy → cookie refresh SameSite=Strict hoat dong khi dev.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
      '/media': { target: apiTarget, changeOrigin: false },
    },
  },
  build: {
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
