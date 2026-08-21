import { defineConfig } from 'vite'

// MV3 の service worker は ES module としてロードされる (manifest の background.type: "module")
// public/ 以下 (manifest.json, アイコン) は Vite がそのまま dist/ にコピーする
export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome116',
    sourcemap: true,
    rollupOptions: {
      input: { 'service-worker': 'src/service-worker.ts' },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
})
