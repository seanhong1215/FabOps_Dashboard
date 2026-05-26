import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: process.env.GITHUB_PAGES || process.env.GITHUB_ACTIONS ? '/FabOps_Dashboard/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('zrender')) {
            return 'zrender'
          }
          if (id.includes('echarts') || id.includes('vue-echarts')) {
            return 'charts'
          }
          if (
            id.includes('naive-ui') ||
            id.includes('@vicons') ||
            id.includes('@css-render') ||
            id.includes('vueuc') ||
            id.includes('vooks') ||
            id.includes('vdirs') ||
            id.includes('seemly')
          ) {
            return 'ui'
          }
          if (
            id.includes('vue') ||
            id.includes('vue-router') ||
            id.includes('pinia')
          ) {
            return 'vue-vendor'
          }
        },
      },
    },
  },
})
