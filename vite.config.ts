import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // O `vite preview` (usado pelos testes e2e) herdaria `server.open` e abriria uma aba do navegador a cada execução.
  preview: {
    open: false
  }
});
