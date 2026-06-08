import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sugerir-temas': 'http://localhost:5000',
      '/gerar-roteiro':  'http://localhost:5000',
      '/decidir':        'http://localhost:5000',
      '/historico':          'http://localhost:5000',
      '/contexto-agente':    'http://localhost:5000',
    },
  },
})
