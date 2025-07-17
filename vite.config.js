// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // KEY CHANGE: Use '/' for SPA routing compatibility.
  // This ensures module paths are resolved correctly.
  base: '/', 
  server: {
    open: true,
    hmr: true,
  },
  build: {
    sourcemap: true,
  },
});