import preprocess from 'svelte-preprocess'
import { optimizeImports } from 'carbon-preprocess-svelte'
import auto from '@sveltejs/adapter-auto'
import node from '@sveltejs/adapter-node'
import vercel from '@sveltejs/adapter-vercel'

const adapter = () => {
  switch (process.env.ADAPTER?.toLowerCase() || 'vercel') {
    case 'node':
      return node()
    case 'vercel':
      return vercel()
    default:
      return auto()
  }
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [preprocess(), optimizeImports()],
  kit: {
    adapter: adapter(),
    prerender: {
      default: false,
      enabled: false,
    },
    methodOverride: {
      parameter: '_method',
      allowed: ['PUT', 'PATCH', 'DELETE'],
    },
    inlineStyleThreshold: 48 / 0.0009765625,
  },
}

export default config
