
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: 'http://localhost:5000', // Ensure this points to the correct base
  server: {
    open: true,
    // Configure server to return index.html for unknown routes
    hmr: true,
  },
  build: {
    sourcemap: true,
  },
});

