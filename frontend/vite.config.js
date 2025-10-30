import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // force CSS code splitting
    cssCodeSplit: true,
    // Disable CSS inline to JS
    cssMinify: true,
    // Set asset inline limit to 0, forcing all assets to be output as files
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Ensure CSS is extracted as separate files
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.')[1];
          if (/css/i.test(extType)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    }
  },
  base: './'
})