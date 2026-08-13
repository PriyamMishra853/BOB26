import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Point the dev proxy at a local backend with VITE_API_PROXY=http://localhost:5001
  const apiTarget = env.VITE_API_PROXY || 'https://bob-production-4e27.up.railway.app';
  const wsTarget = env.VITE_SIGNAL_PROXY || 'wss://bob-production-4e27.up.railway.app';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        },
        '/signal': {
          target: wsTarget,
          ws: true,
          changeOrigin: true
        }
      }
    }
  };
});
