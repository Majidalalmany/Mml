import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      hmr: false,
      ws: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // فصل React و React-Dom معا في حزمة واحدة متكاملة
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                return 'vendor-react-core';
              }
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('lucide-react')) return 'vendor-icons';
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
