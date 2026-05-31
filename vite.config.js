import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const gitHash = execSync('git rev-parse --short HEAD').toString().trim()
const { homepage, license, description } = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  base: '/fastview/',
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
    __PROJECT_URL__: JSON.stringify(homepage),
    __LICENSE__: JSON.stringify(license),
    __DESCRIPTION__: JSON.stringify(description),
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/variables" as *;\n@use "@/assets/styles/mixins" as *;\n`,
      },
    },
  },
})
