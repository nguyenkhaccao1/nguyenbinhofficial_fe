import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const apiTarget = process.env.INTERNAL_API_URL ?? 'http://localhost:5080';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: { alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) } },
  server: {
    port: 5173,
    // Fetch phia trinh duyet (form, tim kiem) di qua cung origin nhu production (nginx /api → API).
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
      '/media': { target: apiTarget, changeOrigin: false },
    },
  },
});
