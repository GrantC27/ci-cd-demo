import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cwd } from 'node:process'; // Import cwd

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  // This will load .env, .env.local, .env.[mode], .env.[mode].local
  const env = loadEnv(mode, cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Make process.env.API_KEY available to the client code
      // It will take the value from the environment Vite is running in,
      // or from a .env file if you create one (e.g., .env.local with API_KEY=yourkey)
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    // Required for pdfjs-dist worker to be served correctly by Vite's dev server & build
     optimizeDeps: {
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis'
            }
        }
    },
    build: {
      rollupOptions: {
        output: {
          // Attempt to fix pdf.worker.min.mjs loading issues in production
          // by making sure it's findable. Alternatively, copy worker to public.
          manualChunks(id) {
            if (id.includes('pdf.worker.min.mjs')) {
              return 'pdf.worker';
            }
          }
        }
      }
    }
  };
});