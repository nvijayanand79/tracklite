import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ 
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0', // Allow external connections
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0', // Production preview server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: false, // Disable for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@heroicons/react']
        }
      }
    }
  }
})
