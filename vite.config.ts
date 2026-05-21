import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import metaInjectPlugin from './plugins/vite-meta-inject';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  // Expose both VITE_ (local dev) and NEXT_PUBLIC_ (Vercel compatibility)
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react(), metaInjectPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['react-hot-toast']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
