import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-utils': ['zustand', 'idb', 'date-fns', 'zod'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-export': ['jszip', 'html-to-image'],
        },
      },
    },
  },
});
