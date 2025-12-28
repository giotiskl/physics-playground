import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    // Needed for top-level await in WASM
    target: 'esnext',
  },
  optimizeDeps: {
    // Let Vite handle WASM properly
    exclude: ['@dimforge/rapier3d-compat'],
  },
});
