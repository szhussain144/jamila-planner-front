import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // In dev, /api is forwarded to the backend so no CORS setup is needed.
      // Set VITE_API_URL instead to call a backend on another domain directly.
      proxy: {
        '/api': { target: env.DEV_API_PROXY || 'http://localhost:4000', changeOrigin: true },
      },
    },
  };
});
