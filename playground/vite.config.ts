import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'gptvis-vue-data-ui/syntax': fileURLToPath(
        new URL('../packages/gptvis-vue-data-ui/src/syntax.ts', import.meta.url),
      ),
      'gptvis-vue-data-ui/vue': fileURLToPath(
        new URL('../packages/gptvis-vue-data-ui/src/vue.ts', import.meta.url),
      ),
      'gptvis-vue-data-ui': fileURLToPath(
        new URL('../packages/gptvis-vue-data-ui/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4318,
    strictPort: true,
  },
});

