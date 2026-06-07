import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@awarevue/agent-sdk': resolve(
        __dirname,
        '../agent-sdk-typescript/src/index.browser.ts',
      ),
      '@awarevue/agent-sdk-browser': resolve(
        __dirname,
        '../agent-sdk-browser/src/index.ts',
      ),
      '@awarevue/api-types': resolve(
        __dirname,
        '../api-types/src/index.ts',
      ),
    },
  },
});
