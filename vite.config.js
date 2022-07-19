import { sveltekit } from '@sveltejs/kit/vite'
import { imagetools } from 'vite-imagetools'
import svg from '@poppanator/sveltekit-svg'
import WindiCSS from 'vite-plugin-windicss'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    sveltekit(),
    WindiCSS({
      config: './windi.config.js',
    }),
    svg(),
    imagetools(),
  ],
  define: {
    __LOCALHOST_HOST__: JSON.stringify(
      process.env.GITPOD_WORKSPACE_URL
        ? process.env.GITPOD_WORKSPACE_URL.replace('https://', '5173-')
        : 'localhost:5173'
    ),
    __VERCEL_URL__: JSON.stringify(process.env.VERCEL_URL),
  },
  server: {
    hmr: {
      clientPort: process.env.GITPOD_WORKSPACE_URL ? 443 : 5173,
      host: process.env.GITPOD_WORKSPACE_URL
        ? process.env.GITPOD_WORKSPACE_URL.replace('https://', '5173-')
        : 'localhost',
    },
  },
})
