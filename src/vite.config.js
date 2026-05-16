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
      // Force all packages (including @base44/sdk) to use the app's single React copy
      'react': path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    },
    // Deduplicate React across all chunks and dependencies
    dedupe: ['react', 'react-dom', 'react-router-dom', 'scheduler'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    // Force pre-bundling to use a single React instance
    force: false,
  },
});