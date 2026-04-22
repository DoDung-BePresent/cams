import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(() => {
  const httpsOff =
    process.env.VITE_DEV_HTTPS === '0' ||
    process.env.VITE_DEV_HTTPS === 'false';
  // Default: plain HTTP so `http://localhost:5173/...` matches MoMo RedirectUrl.
  // MoMo often uses https in sandbox — then run `npm run dev:https` and set RedirectUrl to https://...
  const useLocalHttps =
    !httpsOff &&
    (process.env.VITE_DEV_HTTPS === '1' ||
      process.env.VITE_DEV_HTTPS === 'true');

  return {
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
      ...(useLocalHttps ? [basicSsl()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'https://logcams.cloud',
          changeOrigin: true,
          secure: true,
        },
        '/hubs': {
          target: 'https://logcams.cloud',
          changeOrigin: true,
          secure: true,
          ws: true,
        },
      },
    },
    optimizeDeps: {
      // Reduce stale optimized-deps state between frequent restarts.
      force: true,
    },
  };
});
