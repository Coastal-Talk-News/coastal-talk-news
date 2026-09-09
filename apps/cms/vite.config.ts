import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    // @coastal-talk-news/ui is consumed as TypeScript source from the
    // workspace, not as a built dependency. Pre-bundling it makes Vite cache a
    // stale copy, which surfaces as "does not provide an export named X" after
    // the package's files change while the dev server is running.
    exclude: ['@coastal-talk-news/ui'],
  },
});
