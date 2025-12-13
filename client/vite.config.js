import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto exponer la red (0.0.0.0)
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Simplified thread pool config for CI stability
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    isolate: false, // Sometimes helps with hanging processes in jsdom environments
    watch: {
        usePolling: true,
        interval: 100,
    },
  },
});
