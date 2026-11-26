import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { appDataPlugin } from './scripts/app-data';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [appDataPlugin(), react()],
  server: {
    port: 3000,
    open: true
  },
  // O `vite preview` (usado pelos testes e2e) herdaria `server.open` e abriria uma aba do navegador a cada execução.
  preview: {
    open: false
  },
  json: { stringify: true },
  build: {
    target: ['chrome109', 'edge109', 'firefox115', 'safari15'],
    // Todo chunk de dados se chama `dados-*`: é assim que o orçamento e o e2e de leveza os reconhecem.
    rollupOptions: {
      output: {
        chunkFileNames: (chunk) => (/\/src\/(data\/(generated|app)|effects)\/.*\.json$/.test(chunk.facadeModuleId ?? '') ? 'assets/dados-[name]-[hash].js' : 'assets/[name]-[hash].js'),
      },
    },
  }
});
