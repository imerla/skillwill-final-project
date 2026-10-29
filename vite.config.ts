import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router-vendor'
          }
          if (id.includes('node_modules/@tanstack/react-query/')) {
            return 'query-vendor'
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'ui-vendor'
          }
        },
      },
    },
  },
})

