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
        chunkFileNames: (chunk) => {
          // O índice dos arquivos de dados também é custo de abrir um time: entra na conta.
          if (chunk.facadeModuleId?.endsWith('/dataFiles.ts')) return 'assets/dados-indice-[hash].js';
          const data = /\/src\/(?:data\/(?:generated|app)|effects)\/(?:(moves|effects|talents)\/)?[^/]+\.json$/.exec(chunk.facadeModuleId ?? '');
          return data ? `assets/dados-${data[1] ? `${data[1]}-` : ''}[name]-[hash].js` : 'assets/[name]-[hash].js';
        },
      },
    },
  }
});
