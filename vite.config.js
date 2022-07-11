import { sveltekit } from '@sveltejs/kit/vite'
import { imagetools } from 'vite-imagetools'
import svg from '@poppanator/sveltekit-svg'
import WindiCSS from 'vite-plugin-windicss'

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sveltekit(),
    WindiCSS({
      config: './windi.config.js',
    }),
    svg(),
    imagetools(),
  ],
  define: {
    'process.env.LOCALHOST_HOST': JSON.stringify(
      process.env.GITPOD_WORKSPACE_URL
        ? process.env.GITPOD_WORKSPACE_URL.replace('https://', '3000-')
        : 'localhost:3000'
    ),
    'process.env.VERCEL_URL': JSON.stringify(process.env.VERCEL_URL),
  },
  server: {
    hmr: {
      clientPort: process.env.GITPOD_WORKSPACE_URL ? 443 : 3000,
      host: process.env.GITPOD_WORKSPACE_URL
        ? process.env.GITPOD_WORKSPACE_URL.replace('https://', '3000-')
        : 'localhost',
    },
  },
}

export default config
