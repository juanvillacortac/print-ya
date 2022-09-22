import { sveltekit } from '@sveltejs/kit/vite'
import svg from '@poppanator/sveltekit-svg'
import WindiCSS from 'vite-plugin-windicss'
import { defineConfig } from 'vite'
import { ViteWebfontDownload } from 'vite-plugin-webfont-dl'

export default defineConfig({
  plugins: [
    sveltekit(),
    ViteWebfontDownload(
      [
        'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
        'https://fonts.googleapis.com/css2?family=Fira+Code&display=swap',
        'https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600,700,900',
      ],
      { injectAsStyleTag: true }
    ),
    WindiCSS({
      config: '../../windi.config.js',
    }),
    svg(),
    // imagetools(),
  ],
  define: {
    __API_URL__: JSON.stringify(
      process.env.GITPOD_WORKSPACE_URL
        ? process.env.GITPOD_WORKSPACE_URL.replace('https://', 'https://3000-')
        : process.env.PUBLIC_API_URL || 'http://localhost:3000'
    ),
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
