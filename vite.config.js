import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' => rutas relativas, funciona en GitHub Pages (usuario.github.io/repo/) sin tocar nada.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
