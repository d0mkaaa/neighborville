import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    define: {
      'import.meta.env.VITE_EMAIL_FROM': JSON.stringify(env.VITE_EMAIL_FROM),
      'import.meta.env.VITE_EMAIL_FROM_NAME': JSON.stringify(env.VITE_EMAIL_FROM_NAME),
      'import.meta.env.VITE_SESSION_TIMEOUT': JSON.stringify(env.VITE_SESSION_TIMEOUT),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    }
  }
})