import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/AIDext2-Frontend/',
  server: {
    headers: {
      'Cache-Control': 'no-store',
    },
    sourcemapIgnoreList: (sourcePath) =>
      sourcePath.includes('node_modules'),
    hmr: {
      overlay: true,  // shows errors as overlay instead of silently failing
    }
  },
  optimizeDeps: {
    exclude: ['@bokuweb/zstd-wasm'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
})