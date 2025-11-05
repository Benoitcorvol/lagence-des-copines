import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '*.config.js',
        'src/modules/styles.js', // CSS-only module
        'src/modules/template.js' // HTML-only module
      ]
    },
    setupFiles: ['./tests/setup.js']
  }
});
