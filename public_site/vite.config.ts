import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',   // bind to all interfaces, not just ::1
    strictPort: false,  // fall back if 5173 is taken
  },
})
