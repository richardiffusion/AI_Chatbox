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
    // 强制 CSS 代码分割
    cssCodeSplit: true,
    // 禁用 CSS 内联到 JS
    cssMinify: true,
    // 设置资源内联限制为 0，强制所有资源都作为文件输出
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // 确保 CSS 被提取为独立文件
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