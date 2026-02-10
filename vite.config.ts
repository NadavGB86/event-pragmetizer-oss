import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // When proxy mode is active (Vercel), don't embed the API key in the client bundle
    const exposeKey = env.VITE_USE_PROXY !== 'true';
    return {
      server: {
        port: 5175,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(exposeKey ? (env.GEMINI_API_KEY || '') : ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(exposeKey ? (env.GEMINI_API_KEY || '') : '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
