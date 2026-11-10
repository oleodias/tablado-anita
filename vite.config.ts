import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// O site é publicado em https://oleodias.github.io/tablado-anita/
// por isso todos os caminhos partem de /tablado-anita/.
export default defineConfig({
  base: '/tablado-anita/',
  plugins: [react(), tailwindcss()],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
