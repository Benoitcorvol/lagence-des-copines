import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'LACChatWidget',
      fileName: 'widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        // Single IIFE file for easy embedding
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.log for debug mode
        passes: 2
      },
      mangle: true,
      format: {
        comments: false
      }
    },
    target: 'es2015',
    reportCompressedSize: true
  },
  server: {
    port: 8000,
    open: '/test/test.html'
  }
});
