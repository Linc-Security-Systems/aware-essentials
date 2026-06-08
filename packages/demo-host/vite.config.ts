import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      // Point directly to TypeScript sources so no pre-build is required
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
