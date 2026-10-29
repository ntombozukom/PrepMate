import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // API_PROXY lets `--mode cfdev` send /api to the local Worker (wrangler dev) instead of the .NET API.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.API_PROXY || 'http://localhost:5050',
          changeOrigin: true,
        },
      },
    },
  };
});
