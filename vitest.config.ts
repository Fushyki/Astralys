import { defineConfig } from 'vitest/config';
import { appDataPlugin } from './scripts/app-data';

export default defineConfig({
  plugins: [appDataPlugin()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  }
});
