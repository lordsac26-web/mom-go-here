import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import base44Plugin from '@base44/vite-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    base44Plugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Deduplicate React across all chunks and dependencies
    dedupe: ['react', 'react-dom', 'react-router-dom', 'zustand', 'scheduler'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
    force: true,
  },
});